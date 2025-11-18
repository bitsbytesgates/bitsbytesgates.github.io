---
layout: post
title: Working with Analysis Ports
date: 2025-11-16
categories: PythonUVM
excerpt_separator: <!--more-->
mermaid: true
---

For the most part, UVM and SystemVerilog make interactions with a 
dynamically-typed language surprisingly easy. There are a few exceptions
where the developer of the SystemVerilog UVM code must step in to enable
access to certain testbench elements. Analysis ports are one case in point.
Fortunately, there is a relatively non-invasive approach to allow Python
to dynamically interact with UVM analysis ports. Let's look more closely at 
the details.


# Working with Analysis Ports

UVM testbench environments use analysis ports extensively. An *analysis port* 
publishes data to zero or more listeners, and is used to route transactions 
from interface monitors to scoreboards and other analysis components. 

Connecting to analysis ports from Python allows scoreboards and other analysis
components to be implemented in Python. There are two technical requirements
that enable Python to receive transactions published by analysis ports:
- Be able to identify a uvm_analysis_port as a distinct type (vs, say, a uvm_object or uvm_component).
- Be able to add a new listener to the analysis port


# Challenges of Dynamically Using Analysis Ports
Each of these technical requirements poses its own challenge. 

<div class="mermaid" align="center">
classDiagram
  uvm_analysis_port_base <|-- uvm_analysis_port
  uvm_tlm_if_base <|-- uvm_analysis_port_base
  uvm_component <|-- uvm_tlm_if_base
  class uvm_analysis_port["uvm_analysis_port #(T)"]
  class uvm_analysis_port_base["uvm_analysis_port_base #(uvm_tlm_if_base #(T,T))"]
  class uvm_tlm_if_base["uvm_tlm_if_base #(T,T)"]
  class uvm_component["uvm_component"]
</div>

SystemVerilog is a statically-typed language that provides minimal 
*introspection* tools for looking at the internals of user-defined 
classes. This is especially true when it comes to templated types. In 
order to ask whether a given object *is an* instance of uvm_analysis_port,
we need to ask about a specific specialization of that type -- for example,
"uvm_analysis_port #(my_special_transaction)". As you might expect, this
poses some challenges because the PyHDL-IF library only knows about concrete
types defined by the UVM library, and doesn't know anything about
the transaction types used within a user's testbench. As a consequence,
when the PyHDL-IF library looks at an analysis port instance, 
it just sees a `uvm_component` instance.

One possible approach to this challenge is to have the user register each 
of the transaction types that they might want to use with analysis ports 
with the PyHDL-IF library. 
For example:

{% highlight verilog %}
class my_transaction extends uvm_sequence_item;
  // ...
endclass

`pyhdl_uvm_transaction_utils(my_transaction)

{% endhighlight %}

This would allow the PyHDL-IF library to identify analysis-port instances,
but wouldn't help with the second challenge of working with 
analysis ports.


The second challenge comes when we want to add a new listener to an 
analysis port. This must be done during `connect_phase`, and requires that 
a properly-specialized `uvm_analysis_imp #(T)` class instance was 
previously created during the build phase. 

# Making Analysis Ports Visibile

While both of these challenges can be overcome independently, doing so 
would require the user to make two independent sets of changes. 
And, more troubling, wouldn't provide a good way for VIP developers 
to hide this complexity from users. 
At minimum, the testbench developer would always need to pre-create
`uvm_analysis_imp` instances for each analysis port to which they might
subscribe.

Instead, PyHDL-IF provides two classes that supports two paths for making
analysis ports visible and accessible from Python:
- *pyhdl_uvm_analysis_port* -- An alternative analysis port implementation intended for use by VIP authors
- *pyhdl_uvm_analysis_imp* -- An analysis port listener intended to make existing analysis ports available to PyHDL-IF

## Example

Let's take a look at an example to understand how analysis ports are made 
accessible to the PyHDL-IF library. The uvm/seq_item_scoreboard example
shows how to make analysis ports accessible as well as how to receive
transactions from analysis ports.

{% highlight verilog %}
  // Producer component with two analysis ports
  class dual_producer extends uvm_component;
    `uvm_component_utils(dual_producer)

    pyhdl_uvm_analysis_port #(seq_item_a) ap_a;
    uvm_analysis_port #(seq_item_b) ap_b;

    function new(string name, uvm_component parent);
      super.new(name, parent);
    endfunction

    function void build_phase(uvm_phase phase);
      super.build_phase(phase);
      ap_a = new("ap_a", this);
      ap_b = new("ap_b", this);
    endfunction
{% endhighlight %}

The code snippet above shows how the pyhdl_uvm_analysis_port can be used
instead of uvm_analysis_port to make an analysis port available to the
PyHDL-IF library. The API of this class is identical to uvm_analysis_port,
making this a good choice for VIP authors that want to automatically make 
analysis ports accessible.

{% highlight verilog %}
  // Environment tying producer to scoreboard
  class my_env extends uvm_env;
    `uvm_component_utils(my_env)

    // ...
    pyhdl_uvm_analysis_imp #(seq_item_b)    ap_b_proxy;
    // ...

    function void build_phase(uvm_phase phase);
      super.build_phase(phase);
      // ...
      ap_b_proxy = new("ap_b_proxy", this);
    endfunction

    function void connect_phase(uvm_phase phase);
      super.connect_phase(phase);
      // ...
      prod.ap_b.connect(ap_b_proxy.analysis_export);
    endfunction
  endclass
{% endhighlight %}

Note that `ap_b` uses a normal uvm_analysis_port in the VIP. We can 
make this analysis port accessible to the PyHDL-IF library by connecting
an instance of `pyhdl_uvm_analysis_imp` to it. While this could be done
anywhere, it's often done in the environment (as shown above). 

The `pyhdl_uvm_analysis_imp` instance is connected to the analysis port 
in the same way that any other analysis port subscriber does. Doing 
this allows Python code to receive transactions published by the 
analysis port.


Both `pyhdl_uvm_analysis_port` and `pyhdl_uvm_analysis_imp` have a `proxy`
field inside with a `add_listener` method that the Python environment 
uses to register a listener. Let's look at the Python environment now.

{% highlight python %}
class PyComp(uvm_component_impl):

    def build_phase(self, phase):
        print("build_phase", flush=True)

    def connect_phase(self, phase):
        print("connect_phase", flush=True)
        env = self.proxy.get_parent()
        env.prod.ap_a.proxy.add_listener(self.write_a)
        env.ap_b_proxy.proxy.add_listener(self.write_b)

    def write_a(self, t):
        print("write_a %0s" % str(t.pack()), flush=True)

    def write_b(self, t):
        print("write_b %0s" % str(t.pack()), flush=True)
{% endhighlight %}

In this case, the component proxy is a child instance of the `env` class
shown above. Consequently, to connect to the analysis ports, we first
need to get a handle to the instance of the `env` class (our parent).
After that, we need to access the analysis port `proxy` field inside
the `pyhdl_uvm_analysis_port` and `pyhdl_uvm_analysis_imp` instances.
We can pass any callable Python method or object to the `add_listener`
method. In this case, we simply register two class methods. When simulation
runs, `write_a` and `write_b` will be called whenever the analysis port
that they monitor publishes a transaction.


# Conclusions and Next Steps
The PyHDL-IF library allows analysis ports to be made visible and accessible 
from Python with a small one-time investment. Verification IP (VIP) 
developers can implement this support, allowing all users to benefit. 
Testbench developers can also perform this work for VIP that isn't pre-instrumented. 
The result is that scoreboards and other analysis components can easily be developed in Python. 

Thus far in the series, we've seen how to run Python 
behavior from SystemVerilog. We've seen how to interact with user-defined 
UVM class fields, and we've now seen how to subscribe to analysis ports. 
These technical capabilities make it easy for Python to dynamically interoperate 
with an existing SystemVerilog/UVM testbench. But, thus far, these 
capabilities don't do much to support Python development tools. In the next
post, we'll see how the PyHDL-IF library provides a bridge from SystemVerilog/UVM
to help Python development tools understand what is present in the UVM environment
and make us more productive developing Python testbench components.

## References
- PyHDL-IF library - [https://github.com/fvutils/pyhdl-if](https://github.com/fvutils/pyhdl-if)
- Analysis port example - [https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/seq_item_scoreboard](https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/seq_item_scoreboard)


