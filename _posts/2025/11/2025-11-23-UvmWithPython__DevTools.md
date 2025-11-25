---
layout: post
title: Introducing UVM to Python Development Tools
date: 2025-11-23
categories: PythonUVM
excerpt_separator: <!--more-->
mermaid: true
---

Over the past few posts, we've examined the details of dynamically interacting
with a SystemVerilog/UVM environment from Python. We can access the 
component hierarchy of a UVM testbench, read and write the value of sequence-item
fields, and run sequences from Python -- all without recompiling our UVM testbench
or needing to generate any testbench-specific code. In this
post, we'll see how we can generate a Python view of key user-defined SystemVerilog 
classes in the UVM testbench. The reason? To better support the operation of Python
development tools.

<!--more-->

# Feeding Python Development Tools

Python has a rich ecosystem of developer tools. There are IDE plug-ins that 
assist developers in navigating around a codebase, and provide context-aware 
editing capabilities.  There are static-checking tools (MyPy, Flake8, etc) that 
identify coding mistakes before execution, saving iteration time. And, of course, 
there are a collection of AI assistants (Copilot, Cline, Codex, Claude, etc) that 
have proven very adept at writing Python code. The common factor with all of these 
tools is that they all operate on Python source.

We've gotten this far without needing to generate any testbench-specific Python
or SystemVerilog code to implement a general-purpose Python integration with
a UVM testbench. Fortunately, the same dynamically-discovered data that enables ease 
of integration can be used to generate the Python source that enables our 
development tools.

# Discovering Available Types

PyHDL-IF already uses the vast majority of the data required to generate a Python 
view of user-defined SV/UVM classes to implement the runtime integration 
between Python and SystemVerilog -- specifically, identifying and accessing 
named component instances and fields registered with the UVM library. 
The one piece that we're missing is a list
of all the classes registered with the UVM factory.

Unfortunately, the UVM library doesn't make this information available via
a standard API. The good news is that there is a workaround. The UVM factory
provides a `print` function that reports the names of registered classes via
the UVM report infrastructure. Using a custom message handler, we can intercept
and save this catalog of available choices. You can find the relevant 
code in [src/hdl_if/share/uvm/pyhdl_uvm_object_rgy.svh](https://github.com/fvutils/pyhdl-if/blob/main/src/hdl_if/share/uvm/pyhdl_uvm_object_rgy.svh).

{% highlight verilog %}

/** 
 * Implements a report catcher to allow capturing the 
 * list of object typenames printed by the factory
 */     
class factory_print_catcher extends uvm_report_catcher;
    string  factory_print;

    function new(string name="factory_print_catcher");
        super.new(name);
    endfunction

    function action_e catch();
        factory_print = get_message();

        // Suppress the message
        return CAUGHT;
    endfunction
endclass

class pyhdl_uvm_object_rgy;
    // ...
    virtual function string _get_type_dump();
        factory_print_catcher catcher = new;
        uvm_factory factory = uvm_factory::get();

        // Attach our custom report catcher so we can 
        // save the message printed by factory.print()
        uvm_report_cb::add(null, catcher);

        factory.print();

        uvm_report_cb::delete(null, catcher);

        return catcher.factory_print;
    endfunction

    // ...
endclass
{% endhighlight %}


# The pyhdl_uvm_pygen UVM Test

We need to run the simulator in order to load and execute code from the UVM
testbench. In a UVM environment, the UVM test is the center of executing
test behavior, so it makes sense to provide a UVM test that handles discovering
the available user-defined UVM classes and generating a Python view. The 
PyHDL-IF library provides the `pyhdl_uvm_pygen` test for this purpose.

While the `pyhdl_uvm_pygen` test is the entrypoint, the task of discovering
available classes, processing them, and generating Python is all implemented
in Python. 

# Example
While all the details of *how* we extract information from SV/UVM classes is 
interesting, pragmatic users will be much more interested in *applying* the
workflow and using the result.

Let's look at an example, which you can find in [examples/uvm/pygen](https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/pygen).

This example consists of a simple UVM environment with a memory-oriented sequence 
item, shown below:

{% highlight verilog %}
    class seq_item extends uvm_sequence_item;
        bit              ctrl_addr_page;
        bit[1:0]         addr_page;

        rand bit [7:0]   addr;
        rand bit         write; // 1=write, 0=read
        rand bit [31:0]  data;
        rand bit [3:0]   tid;

        // ...

        `uvm_object_utils_begin(seq_item)
            `uvm_field_int(ctrl_addr_page, UVM_ALL_ON)
            `uvm_field_int(addr_page, UVM_ALL_ON)
            `uvm_field_int(addr , UVM_ALL_ON)
            `uvm_field_int(write, UVM_ALL_ON)
            `uvm_field_int(data , UVM_ALL_ON)
            `uvm_field_int(tid  , UVM_ALL_ON)
        `uvm_object_utils_end

        // ...
    endclass
{% endhighlight %}

Our build/run-flow specification (flow.yaml) specifies how to build
and run tests. This example also launches the PyHDL-IF-provided 
UVM test that generates Python classes. Note how the task parameters
specify a SystemVerilog plusarg (+pyhdl.outdir) to specify the destination directory
for the generated Python classes.

{% highlight yaml %}

  - name: sim-run
    uses: "hdlsim.${{ sim }}.SimRun"
    needs:
    - sim-img
    - pyhdl-if.DpiLib
    with:
      plusargs:
      - UVM_TESTNAME=pyhdl_uvm_pygen
      - pyhdl.python=${{ rootdir }}/../../packages/python/bin/python
      - pyhdl.debug=0
      - pygen.debug=1
      - pyhdl.outdir=${{ rootdir }}/env_classes/env

{% endhighlight %}

Running the `sim-run` task runs the `pyhdl_uvm_pygen` UVM test, which
generates Python classes in the example directory. The class corresponding
to the sequence item is shown below. You can find the full code in
[examples/uvm/pygen/env_classes/env/seq_item.py](https://github.com/fvutils/pyhdl-if/blob/main/examples/uvm/pygen/env_classes/env/seq_item.py).

{% highlight python %}
@dc.dataclass(kw_only=True)
class seq_item_fields(object):
    ctrl_addr_page : int = dc.field(default=0)
    addr_page : int = dc.field(default=0)
    addr : int = dc.field(default=0)
    write : int = dc.field(default=0)
    data : int = dc.field(default=0)
    tid : int = dc.field(default=0)

@dc.dataclass
class seq_item(uvm_object, seq_item_fields):
    pass
{% endhighlight %}

The class fields are declared in a pure-data class (seq_item_fields) to make 
it easier to use just the data aspect of the class for unit testing. 

Once generated, these Python classes that mirror the user-defined 
SystemVerilog/UVM classes can be supplied to all of our standard Python 
development tools, allowing these tools to check and provide help working
with the Python interface to our SystemVerilog/UVM testbench.


# Conclusion
The PyHDL-IF library provides an easy-to-use integration between Python and
a SystemVerilog/UVM testbench environment. And, by generating a Python view
of the SystemVerilog classes, supports Python development tools in providing
a productive developer experience. 

We'll look at other features of the PyHDL-IF library and its support for SV/UVM
in future posts. But, more immediately, we'll be looking at how recent changes in
the open-source EDA ecosystem are changing what's possible in a verification 
flow that supports both open-source and closed-source tools.

# References
- [PyHDL-IF](https://github.com/fvutils/pyhdl-if/)
- [MyPy](https://mypy-lang.org/)
- [Flake8](https://flake8.pycqa.org/en/latest/)


