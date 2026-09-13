---
layout: post
title:  "DPI Isn't Enough: Making Python Part of Your SV Testbench"
date: 2024-11-04
categories: Python
excerpt_separator: <!--more-->
mermaid: true
---
<p align="center">
<img src="{{ '/imgs/2024/11/DPI_Isnt_Enough_splash.png' | absolute_url }}"/> 
</p>

I've been using Python for verification since early 2019 for personal projects,
and have found both the language and the rich ecosystem of general and
special-purpose libraries to be incredibly helpful in quickly and efficiently 
bringing up a testbench environment. [cocotb](https://www.cocotb.org), 
the most popular integration between Python and HDL simulators, integrates with 
the simulator at the signal level. This isn't a problem as long as you fully adopt 
Python as your testbench
methodology and implement everything in Python -- from test scenario down to BFMs 
interacting with signals. Sometimes this is the case, but often we have an existing
SystemVerilog environment that we'd like to mix some Python into.  We might have an 
existing BFM implemented in SystemVerilog that we'd like to call from Python. 
We might have an existing UVM environment from which we want to call a Python library.

SystemVerilog simulators support the Direct Procedure Interface (DPI), of course,
which allows SystemVerilog to call C code and for C code to call SystemVerilog.
Unfortunately, DPI on its own, doesn't provide the features that we need for 
a fully-featured integration between Python and a HDL simulation. As you might
surmise, though, I'm about to describe a library 
([PyHDL-IF](https://github.com/fvutils/pyhdl-if)) that fills in the missing pieces.
Before we get there, though, let's have a look at how we'd like to interact
with Python in a SystemVerilog testbench

<!--more-->

# Using Python from SV and Vice Versa


## Calling Python from SV

Requirements:
- Be able to keep things dynamic
  - Don't require any Python library-specific SV code in order to use the library
  - Be able to look up Python elements by name, etc
- Ideally, have some utilities on the SV side to make this easier

This is actually pretty easy, since the CPython interpreter has a C API. 
If we expose the C API via SystemVerilog DPI, we can make the same calls from
SystemVerilog that we would make from a C/C++ application. The C API
is fairly low-level and detailed, but we can always add a layer of SystemVerilog
utility classes on top.

This type of integration works well for using Python libraries to access 
data (ie JSON, YAML, etc), when we want to manipulate data using a library
like Pandas, or when we want to use a Python library to generate reference
data. In other words, as long as our SV call to Python returns immediately.

## Calling SV from Python

Python gets much more interesting -- and useful -- in a SystemVerilog 
testbench when a Python method call from SystemVerilog can 
consume simulation time. 

This allows us to implement active elements of a our testbench, 
such as tests, in Python. It also allows us to call existing
testbench elements, such Bus Functional Models (BFMs), from Python. 

This usecase is where SystemVerilog DPI poses some technical challenges. 
Both SystemVerilog and Python implement cooperative multi-threading, 
Unfortunately, the requirements that they place on how threaded behavior 
interacts with the outside world (and vice versa) prevent cross-calling
in a 'blocking' manner between the two languages.

## Additional Requirements

Beyond the raw capability to cross-call between SystemVerilog and Python,
there a few additional requirements that vastly simplify the ability
to create reusable infrastructure. 
- Reusable functionality should be implemented by Python and SystemVerilog
  code only. Application-specific DPI C code brings platform dependencies
  and exposes us to implementation details of how different simulators 
  deal implement DPI. These are things you want to deal with as infrequently 
  as possible, and certainly not every time you add a new Python+SV library.
- Any generated code should be, at most, application-specific. Specifically,
  the end user shouldn't need to re-generate application-specific code.

# PyHDL-IF Package

<div class="mermaid" align="center">
block-beta
columns 1
  block:UICode
  columns 1
    Title["App-Specific Code"]
    style Title fill:transparent,stroke:transparent
    block:UICodeLanguages
        UIPython["Python"]
        UIEmpty["Spacer"]
        style UIEmpty fill:transparent,stroke:transparent,color:transparent
        UISystemVerilog["SystemVerilog"]
    end
  end
  block:Codegen
  columns 1
    block:CodegenI
      CodegenM1["CodegenM1"]
      CodegenPad["CodegenPad"]
      CodegenM2["CodegenM2"]
      style CodegenM1 fill:transparent,stroke:transparent,color:transparent
      style CodegenPad fill:transparent,stroke:transparent,color:transparent
      style CodegenM2 fill:transparent,stroke:transparent,color:transparent
    end
    CodegenTitle["Code Generator"]
    style CodegenTitle fill:transparent,stroke:transparent
  end
  UIPython --> CodegenM1
  CodegenM2 --> UISystemVerilog
  block:Library
  columns 1
    block:LibraryI
      LibraryPy["Python"]
      LibraryDpi["DPI"]
      LibrarySV["SystemVerilog"]
    end
    LibraryTitle["Core PyHDL-IF Library"]
    style LibraryTitle fill:transparent,stroke:transparent
  end
</div>    

With those use models and requirements in mind, let's take a look at the
PyHDL-IF library. This library is designed to implement the low-level
details of interfacing between Python and SystemVerilog at the 
method-call level, such that you can focus on writing SystemVerilog
and Python and ignore the low-level details implemented in C.

The PyHDL-IF package has several components, but the two most-relevant
ones for us are shown in the diagram above.
PyHDL-IF provides a SystemVerilog API for calling into Python, and
Python and DPI libraries to support calling back into SystemVerilog 
from Python. It also provides a SystemVerilog code generator to create
SystemVerilog class APIs to simplify the process of cross-calling 
between the two languages.

# An Example
To better understand all of this, let's walk through an example. You can find 
the full code of this example here: [call_sv_bfm example](https://github.com/fvutils/pyhdl-if/tree/main/examples/call/dpi/call_sv_bfm)

<div class="mermaid" align="center">
block-beta
block:Outer
columns 1
  block:Inner
  columns 2
    block:Python
    columns 1
      PySeq(["Python Sequence"])
      PyPad1["Python Pad"]
      PyPad2["Python Pad"]
      PyTitle["Python"]
      style PyTitle fill:transparent,stroke:transparent
      style PyPad1 fill:transparent,stroke:transparent,color:transparent
      style PyPad2 fill:transparent,stroke:transparent,color:transparent
    end
    block:SvTB
    columns 1
      WbBfm["Wishbone BFM"]
      SvPad["Pad"]
      Init["Initial Block"]
      SvTbTitle["SystemVerilog TB"]
      style SvTbTitle fill:transparent,stroke:transparent
      style SvPad fill:transparent,stroke:transparent,color:transparent
    end

    Init --> PySeq
    PySeq --> WbBfm
  end
end
</div>

Here's a block diagram of what's happening. We have a SystemVerilog testbench
that contains an instance of a Wishbone BFM written in SystemVerilog. Our
goal is to write a test in Python that will call tasks in the BFM. We want
to start that Python test from SystemVerilog as well.

Let's dig into some details on how this all fits together.

## Python BFM Interface
Let's start with the Python interface to the Wishbone BFM. You can find the full source here:
[call_sv_bfm.py](https://github.com/fvutils/pyhdl-if/tree/main/examples/call/dpi/call_sv_bfm/call_sv_bfm.py)


{% highlight python %}
import ctypes as ct
import hdl_if as hif

@hif.api
class WishboneInitiator(object):

    @hif.imp
    async def write(self, addr : ct.c_uint32, data : ct.c_uint32):
        pass

    @hif.imp
    async def read(self, addr : ct.c_uint32) -> ct.c_uint32:
        pass
{% endhighlight %}

A class decorated with the *api* decorator specifies a cross-language
API. Methods within that class that are decorated with *import* or *export*
decorators support cross-language calling.

Methods are described with respect to Python:
- When an *Import* method is called from Python, the matching 
  SystemVerilog method is called
- When an *Export* method is called from SystemVerilog, the 
  matching Python method is called.

Both Python and SystemVerilog have special rules about coroutine methods.
In both languages, a coroutine method can call another coroutine method 
or a non-coroutine method. However, a non-coroutine method cannot invoke
a coroutine method. It's critical to keep this aligned between SystemVerilog
and Python:
- An *async* Python method matches with a SystemVerilog *task*
- A plain Python method matches with a SystemVerilog *function*

The API class, with it's decorators is used for two purposes. One, somewhat
obviously, is to implement the Python side of a cross-language API. The
other is to generate SystemVerilog to implement the SystemVerilog portion 
of the API. 

## SystemVerilog BFM
Let's move on and take a look at the Wishbone BFM that we will access 
using the API class that we've defined above. You can find the full code here:
[wb_init_bfm.sv](https://github.com/fvutils/pyhdl-if/tree/main/examples/call/dpi/call_sv_bfm/wb_init_bfm.sv)

{% highlight verilog %}
module WishboneInitiatorBFM(
    input           clock,
    input           reset,
    output reg[31:0]        adr,
    output reg[31:0]        dat_w,
    input[31:0]             dat_r,
    output                  cyc,
    input                   err,
    output reg[3:0]         sel,
    output                  stb,
    input                   ack,
    output reg              we
);
// ...

    task bfm_write(int unsigned adr_v, int unsigned dat_v);
        // ...
        // Works with the state machine to perform a write
    endtask

    // ...

        class WishboneInitiatorImpl extends WishboneInitiator;
        virtual task write(int unsigned addr, int unsigned data);
            bfm_write(addr, data);
        endtask

        virtual task read(
            output int unsigned retval, input int unsigned addr);
            bfm_read(retval, addr);
        endtask

    endclass

    WishboneInitiatorImpl       m_api_obj;

    // Register ourselves with the PyHDL-IF object registry
    initial begin : init
        m_api_obj = new();
    end

    // ...
endmodule

{% endhighlight %}

Key portions of the BFM interface code are shown above. The BFM defines 
*bfm_read* and *bfm_write* tasks that are used to drive read and write operations
via the signal-level interface. 

The BFM defines a local class (*WishboneInitiatorImpl*) that inherits from 
a class (*WishboneInitiator*) that is generated from the Python class specification
of the API. The derived class here implements the *read* and *write* tasks in 
terms of the BFM's existing tasks.

Finally, the BFM module creates an instance of the API implementation class.


## Python Test Class
Okay, thus far we have a SystemVerilog BFM and a Python API definition for
calling it. Now, let's look at the test code that uses that API. You can find the
full source here:
[call_sv_bfm.py](https://github.com/fvutils/pyhdl-if/tree/main/examples/call/dpi/call_sv_bfm/call_sv_bfm.py)

{% highlight python %}
import ctypes as ct
import hdl_if as hif

@hif.api
class Test(object):

    @hif.exp
    async def run(self, bfm : ct.py_object):

        for i in range(64):
            wr_val = (i+1)
            print(f'[Py] writing: {wr_val}')
            await bfm.write(0x8000_0000+(4*i), wr_val)
            rd = await bfm.read(0x8000_0000+(4*i))
            print(f'[Py] readback: {rd}')
            assert wr_val == rd

{% endhighlight %}

Our test code is encapsulated in a Python class with an `async` method.
Our test method expects to receive a handle to the BFM API, which it will 
use to perform reads and writes.

## Top-level Testbench
Finally, let's take a look at the top-level testbench that pulls it all 
together. You can find the full source here:
[call_sv_bfm.sv](https://github.com/fvutils/pyhdl-if/tree/main/examples/call/dpi/call_sv_bfm/call_sv_bfm.sv)

{% highlight verilog %}

module call_sv_bfm;
    import pyhdl_if::*;
    import call_sv_bfm_pkg::*;

    // ...

    WishboneInitiatorBFM    init_bfm(
        .clock(clk),
        .reset(reset),
        .adr(adr),
        .dat_r(dat_r),
        .dat_w(dat_w),
        .stb(stb),
        .cyc(cyc),
        .ack(ack),
        .we(we)
    );

    initial begin
        automatic Test test;

        pyhdl_if_start();

        #50ns;
        reset = 0;

        // Create an instance of the Test class and run
        $display("%0t --> run", $time);
        test = new();
        test.run(init_bfm.m_api_obj.m_obj);
        $display("%0t <-- run", $time);
        $finish;
    end

endmodule
{% endhighlight %}

The top-level testbench instances the BFM. This results in the BFM creating an
instance of the Python class that can be used to call the BFM. The result is 
a SystemVerilog class that holds a handle to the corresponding Python class.

The top-level 'initial' block in the test module creates an instance of the
`Test` Python class. As with the BFM, the result is a SystemVerilog class
that holds a handle to the matching Python class.

Finally, we call the `run` method on the Test class and pass a handle to the
BFM's Python class. The run method will, of course, call back into 
SystemVerilog to invoke the BFM's methods.

## Summary
We've quickly walked through an example of integrating Python and SystemVerilog
such that we can implement Python methods that make task calls into the simulator.
This can allow us to either quickly graft some Python onto am existing BFM we 
have in our testbench. It could allow us to easily add an existing SystemVerilog
BFM to our existing cocotb Python testbench and call it from our Python tests.
There are, of course, more applications and usecases for PyHDL-IF. We'll look at those
in future posts.


## References
- [cocotb](https://www.cocotb.org),  
- [PyHDL-IF library](https://github.com/fvutils/pyhdl-if)








