---
layout: post
title: Accessing User-Defined SV Data from Python
date: 2025-11-08
categories: PythonUVM
excerpt_separator: <!--more-->
mermaid: true
---

We've seen how the [PyHDL-IF](http://github.com/fvutils/pyhdl-if) library makes it simple to implement UVM sequences 
and components in Python, and how Python can call back into SystemVerilog. But,
a significant part of a testbench deals with user-defined data, ranging from 
named UVM instances, transaction fields in sequence items and control knobs on 
sequences. Fortunately, UVM provides features that [PyHDL-IF](http://github.com/fvutils/pyhdl-if) uses to provide 
dynamic and Pythonic access to user-defined data in UVM.

<!--more-->

# Two Kinds of User-Defined Data

There are two key kinds of user-defined data that we care about in our UVM 
environment: named UVM instances, and data fields. In both of these cases,
a SystemVerilog environment typically references the named field directly.

{% highlight verilog %}
    task body();
      uvm_status_e   status;
      uvm_reg_data_t rd;

      // Program CTRL / CLKDIV / SS
      m_env.m_reg.CTRL.enable.write(status, 1);
      m_env.m_reg.CTRL.master.write(status, 1);
      m_env.m_reg.CLKDIV.div.write(status, 16'h0004);
      m_env.m_reg.SS.ss_mask.write(status, 4'h1);

      // ...
    endtask
{% endhighlight %}

An example of using named instance fields, using registers, is shown
above.  Our goal is to be able to access these fields just as easily in 
Python, as well as plain data fields.

## Named UVM Instances

Named UVM instances are UVM objects registered with the UVM library using a name.
User code typically accesses these objects via the SystemVerilog instance 
fields, but they can also be obtained using UVM API methods. Fortunately, 
Python provides specific functionality to enable us to do this.

{% highlight verilog %}
  class spi_reg_block extends uvm_reg_block;
    `uvm_object_utils(spi_reg_block)

    rand reg_CTRL   CTRL;
    rand reg_STATUS STATUS;
    // ...

    function new(string name="spi_reg_block");
      super.new(name, UVM_NO_COVERAGE);
    endfunction

    virtual function void build();
      // ...

      CTRL   = reg_CTRL  ::type_id::create("CTRL");
      STATUS = reg_STATUS::type_id::create("STATUS");
      // ...

      CTRL  .configure(this, null, "");
      STATUS.configure(this, null, "");
      // ...
    endfunction

  endclass
{% endhighlight %}

Registers and register fields provide a good example of UVM named 
instances. As shown above, register blocks (and registers) usually
provide named SystemVerilog fields to represent registers and fields.
But, the `configure` method also registers the object with the UVM
API such that it can be found by name. In the case of the register
block, the `get_registers` function returns a list of register objects.

The Python `__getattr__` method allows us to access UVM named instances
from Python just as easily as in SystemVerilog. 

{% highlight verilog %}
@api
class uvm_reg_block(uvm_object):

    def __init__(self):
        self._reg_m = None

    # ...
    @imp
    def get_registers(self) -> List[uvm_reg_p]:
        raise NotImplementedError()
    
    def __getattr__(self, name):
        if self._reg_m is None:
            regs = self.get_registers()
            self._reg_m = {}
            for r in regs:
                self._reg_m[r.get_name()] = r
        if name in self._reg_m.keys():
            return self._reg_m[name]
        else:
            raise AttributeError("No register %s in block %s" % (
                name, self.get_name()))

{% endhighlight %}

The Python code snippet above shows how this is implemented for the 
`uvm_reg_block` class. Python calls the `__getattr__` class method
any time an unknown class attribute is referenced. In a `uvm_reg_block`
class, we build a map of the named register fields and return the
proper one if it is available.

{% highlight python %}
class PyRegSeq(uvm_sequence_impl):

    async def body(self):
        # Obtain the register model from the sequencer
        seqr = self.proxy.m_sequencer
        _,spi_regs = seqr.get_config_object("spi_regs", False)

        print("spi_regs: %s" % str(spi_regs), flush=True)

        spi_regs.CTRL.enable.set(1)
        spi_regs.CTRL.master.set(1)
        await spi_regs.CTRL.update()

        spi_regs.CLKDIV.div.set(0x4)
        spi_regs.SS.ss_mask.set(0x1)
        await spi_regs.CLKDIV.update()
        await spi_regs.SS.update()

        await spi_regs.TXDATA.write(0xA5)

{% endhighlight %}

Connecting `__getattr__` to a search of named UVM fields enables a 
Python-implemented UVM sequence to access registers and register fields
directly, as shown above.


## Plain-Data Fields

Accessing UVM named-instance fields is useful in some cases, but there
are many other cases where the fields are not named instances. UVM 
sequence-item fields are a great example. Python code may wish to
both read and write the value of these fields. While the path to accessing
the value of these fields is a bit less direct, UVM absolutely provides
a path for doing so.

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

The code snippet above shows a typical UVM sequence item with random fields.
This sequence item uses the UVM field macros (eg uvm_field_int) to register
the user-defined fields with the UVM library. This enables the UVM library
to automatically implement several pieces of functionality, such as 
comparing the value of two objects and copying the field values of an object.
Users can also implement these functions by hand-implementing methods such 
as `do_copy` and `do_compare`, but that results in quite a bit of hand-created
code and an increased risk of introducing errors. 

There are three key elements of functionality that the [PyHDL-IF](http://github.com/fvutils/pyhdl-if) library uses
to enable user-defined data fields to be accessed from Python:
- **sprint** -- Converts the class and its fields to a string representation
- **pack_int** -- Packs the field values to an array of unsigned ints
- **unpack_int** -- Sets the field values from an array of unsigned ints

Used together, these three methods provide the [PyHDL-IF](http://github.com/fvutils/pyhdl-if) library everything
it needs to allow Python to easily get and set the value of user-defined
fields. If you're interested in the details of how it works, see the
`mk` method of the [uvm_object_rgy](https://github.com/fvutils/pyhdl-if/blob/main/src/hdl_if/uvm/wrap/object_rgy.py)
class. 

The short version is that type information is built each time a new type of 
UVM object is passed from SystemVerilog to Python. The field names and
types are extracted using the string representation provided by `sprint`.
The field names and types are used to dynamically define a Python type.
When Python code calls the `pack` method, an instance of this Python 
type is constructed with field values provided by packing the SystemVerilog 
field values. Setting the value of the SystemVerilog fields is done 
by calling `unpack` in Python. Let's see how it is used.

{% highlight python %}
class PyRandSeq(uvm_sequence_impl):
    async def body(self):
        # ...

        # Now, exercise each page in turn 
        for i in range(4):
            req = self.proxy.create_req()
            
            # Get the current values
            val = req.pack()
            val.ctrl_addr_page = 1
            val.addr_page = i

            # Set the field values
            req.unpack(val)

            await self.proxy.start_item(req)
            # Randomize with control knobs
            req.randomize()
            await self.proxy.finish_item(req)

{% endhighlight %}

The example above shows how to use both the `pack` and `unpack` methods to 
control randomization from Python using randomization control knobs. In this
case, we want to control the address "page" -- its upper bits. To do this,
the sequence creates an instance of the request object, then calls `pack`
to obtain a Python object containing the field values of the SystemVerilog
sequence item. After setting the desired address page, the `unpack` 
method is called to set the value of the SystemVerilog fields. Finally, 
the standard `start_item`, `randomize`, `finish_item` sequence of calls
is made to execute the sequence item on the driver.

# Conclusion
The [PyHDL-IF](http://github.com/fvutils/pyhdl-if) library allows Python code to easily access both named UVM
instance fields and data fields. This significantly enhances the type 
of test and analysis behavior that can easily be implemented in Python.

Thus far in this series of posts, we've seen how to launch Python behavior
from SystemVerilog, interact with UVM APIs, and access fields declared in 
SystemVerilog UVM classes. Next, we'll take a look at UVM analysis ports.
Analysis ports are critical for obtaining transactions for scoreboards and
other analysis components. Working with them in a generic fashion is tricky.
Next time, we'll see how the [PyHDL-IF](http://github.com/fvutils/pyhdl-if) library makes them easily accessible
from Python.


# References
- PyHDL-IF library: [https://github.com/fvutils/pyhdl-if](https://github.com/fvutils/pyhdl-if)
- Example: spi_reg_seq: [https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/spi_reg_seq](https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/spi_reg_seq)
- Example: sequence-item knobs: [https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/sequence_item_knobs](https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm/sequence_item_knobs)

