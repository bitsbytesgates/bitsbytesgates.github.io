---
layout: post
title: The Mechanics of UVM/Python Cross-Calling
date: 2025-11-01
categories: PythonUVM
excerpt_separator: <!--more-->
mermaid: true
---

It's not necessary to understand very much about how PyHDL-IF implements
the bridge between Python and UVM, but useful to understand a bit. Doing 
so helps to understand what this library is and is not intended to do,
and how you can best use it in your verification environment.


<!--more-->

# An Interface, not a UVM Library

<p align="center">
<img src="{{ '/imgs/2025/11/pyhdl_if_uvm_wrapper.png' | absolute_url }}"/>
</p>

One important thing to understand is that PyHDL-IF is an interface library,
and not a full testbench library. The UVM portion of PyHDL-IF is intended to 
make it easy to call SystemVerilog/UVM APIs from Python, and vice versa. 
Consequently, it is only
useful if a SystemVerilog/UVM testbench is a part of your verification environment.
If you want to create a UVM testbench in Python, the [pyuvm](https://github.com/pyuvm/pyuvm)
library is more likely to be what you're looking for. You can even use 
`pyuvm` with PyHDL-IF to provide structure to the Python portion of the testbench
that leverages your existing UVM-SV testbench.

Limiting the scope in this way has its advantages, though. While the UVM library
is quite large, the APIs that test writers and scoreboard developers use is 
a much smaller subset. Prioritizing this much-smaller subset very quickly 
provides an interface library that covers a large percentage of usecases.

# Initiating Behavior from UVM

One implication of PyHDL-IF being an interface library is that all 
PyHDL-IF UVM objects are wrappers to access SystemVerilog UVM objects. 
While it is possible (and common!) to create instances of UVM objects
from Python, what happens under the hood as the following:
- Python (via the PyHDL-IF library) calls a UVM method, creating a new UVM object
- The PyHDL-IF library creates a SystemVerilog and Python object pair with a handle to the UVM object
- This 'wrapper' Python object is returned to the caller. 

So, how do we initiate Python behavior from a UVM testbench? There are 
two special PyHDL-IF "proxy" classes that provide a Python implementation
for `uvm_component` and `uvm_sequence`: `pyhdl_uvm_component_proxy` and `pyhdl_uvm_sequence_proxy`.

# Interface Structure

The PyHDL-IF library provides infrastructure that connects a Python object and 
a SystemVerilog object via method calls. Specially-decorated classes define
the shared API. For example, the code snippet below defines the API of the 
UvmSequenceProxy:

{% highlight python %}
@api
class UvmSequenceProxy(object):

    @exp
    async def body(self): ...

    @imp
    def get_userdata(self) -> UvmObject: ...

    @imp
    def create_req(self) -> UvmObject: ...

    @imp
    def create_rsp(self) -> UvmObject: ...

    @imp
    async def start_item(self, item : object): ...

    @imp
    async def finish_item(self, item : object): ...
{% endhighlight %}

**exp** methods are ones that will be implemented in Python and will
be called from SystemVerilog. Likewise, **imp** methods will be implemented
in SystemVerilog and called from Python.

The PyHDL-IF code generator creates a SystemVerilog class that implements
this protocol -- calling the Python method when an **exp** method is
called in SystemVerilog and calling a SystemVerilog when an **imp** method
is called in Python.

When a new instance of the generated SystemVerilog is created, it results 
in a pair of objects: one in SystemVerilog and a connected peer Python object.

# Initiating Behavior

Starting Python behavior from a UVM-SV environment is as simple as selecting
the right `proxy` class, creating an instance, and using the `proxy` class
object within the UVM-SV environment as if it were a regular UVM object.

Let's look at an example that implements a UVM sequence in Python.
Let's look at the Python class before seeing how it is used. The
code below is from the `uvm/sequence_rand_item` example:

{% highlight python %}
from hdl_if.uvm import uvm_sequence_impl

class PyRandSeq(uvm_sequence_impl): 

    async def body(self):
        # Send a small burst of randomized items
        for i in range(8):
            req = self.proxy.create_req()
            # Randomize sequence item
            req.randomize()

            # Optional visibility
            try:
                s = req.sprint()
            except Exception:
                s = "<no sprint available>"
            print(f"PyRandSeq: sending item {i}\n{s}")

            await self.proxy.start_item(req)
            await self.proxy.finish_item(req)

{% endhighlight %}

On a side note, I've been finding that AI assistants like Copilot and 
Cline are extremely helpful in creating tests and examples. I created
the code above, along with the rest of the example, using 
[Cline](https://cline.bot/). While the current set of models 
(GPT-5 in this case) does well with many types of code, the only 
mistakes I had to hand-correct were in the SystemVerilog code. 

If you look closely, there are two APIs used here that aren't 
technically UVM APIs: `randomize` and `create_req`. All the other APIs 
are standard UVM. 

Now let's see how we launch this code from UVM.

{% highlight verilog %}
    class base_test extends uvm_test;
        `uvm_component_utils(base_test)
        // ...

        task run_phase(uvm_phase phase);
            // Python-driven sequence proxy
            typedef pyhdl_uvm_sequence_proxy #(
                .REQ(seq_item)) py_seq_t;
            py_seq_t seq;

            phase.raise_objection(this);
            seq = py_seq_t::type_id::create("seq");
            seq.pyclass = "pyseq::PyRandSeq";
            seq.start(m_env.m_seqr);
            phase.drop_objection(this);
        endtask
    endclass
{% endhighlight %}

In the abbreviated snippet above, the test `run_phase` task creates an
instance of `pyhdl_uvm_sequence_proxy` that is properly specialized
for the request sequence item type and the Python class, then starts 
the sequence on the sequencer. UVM's object-oriented nature lets us 
create and use a sequence without caring whether it's implemented in
Python or SystemVerilog.

# PYHDL-IF UVM API Specifics

Let's use this example to look more closely at the API exposed by
PYHDL-IF. There are three core categories:
- UVM methods that are exposed to Python as-is
- UVM methods whose signature is slightly altered
- Utility methods that are not part of UVM

The `get_name` method is an example of a UVM method that is exposed
to Python as-is. 

{% highlight verilog %}
function string get_name();
{% endhighlight %}

{% highlight python %}
def get_name(self) -> str: ...
{% endhighlight %}

While there are a few cosmetic differences, these functions are
practically identical: same user-specified parameters and same 
return type.

The `get_config_object` method is an example of a UVM method that
is exposed to Python with slight alterations due to the language.

{% highlight verilog %}
function bit get_config_object(string field_name,
                               inout uvm_object value,
                               input bit clone=1);
{% endhighlight %}

{% highlight python %}
def get_config_object(self, 
    field_name : str, 
    clone : bool=True) -> Tuple[bool, UvmObject]:
{% endhighlight %}

The key differences are in the return type and whether in-out
parameters are used. Python discourages returning values via
reference parameters, while this is a common pattern in SystemVerilog.
We follow the Python pattern to better-align with common practice there.

The final category are utility methods that aren't present in UVM 
at all. Two examples are the `randomize` method and the `create_req`
method in the UVM sequence Python class. While `randomize` isn't 
part of the UVM API, Python test content benefits from having it.
`create_req` exists for similar reasons. In SystemVerilog, we could
refer to the `REQ` type parameter of the sequence class to create 
a new request sequence item. In Python, it makes sense to expose
this functionality via a method.

# Beyond UVM Methods

The combination of exposing UVM-defined methods to Python, along with and 
two `proxy` classes to initiate behavior, makes it simple to run Python 
behavior and interact with the UVM testbench. 

One thing you've probably noticed about the examples is that user-defined
data isn't accessed from Python. While we call the `randomize` method from 
Python, we aren't directly controlling the sequence-item fields. In the next 
post, we'll take a look at how we can get and set the value of SystemVerilog
class fields from Python.





