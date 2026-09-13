---
layout: post
title: Unlocking the Combined Strength of UVM and Python
date: 2025-10-04
categories: PythonUVM
excerpt_separator: <!--more-->
mermaid: true
---

UVM and Python are often positioned as rivals when it comes to their role in 
functional verification, with teams picking one or the other as the basis 
for a verification environments. Each have strengths, though, and using them 
together produces much stronger results. In fact, building on the popularity
of UVM and the availability of UVM verification components provides a 
significant boost to the process of introducing Python to an existing UVM 
environment.

<!--more-->

# Assessing Languages for Functional Verification
Using object-oriented languages to develop hardware verification environments
for simulation and hardware emulation is a longstanding practice. This is 
enabled by the fact that dynamic verification of hardware has a lot in common
with testing software. Aside from constrained randomization, tests for hardware look
very similar to tests for software. Likewise, scoreboards and other analytics
components organize, filter, and categorize data in very software-centric ways.

SystemVerilog is a commonly-used object-oriented language that is 
often used alongside UVM. But, C/C++, Java, and Python have all been used for 
verification for many years with and without UVM. 

There are many factors to consider when selecting the languages to use for 
verification. It's important to consider the features provided by the language, 
the size of its library ecosystem, and the size of the community. All of these 
contribute to the perceived ease with which new content can be developed using 
the language. Given the popularity of AI assistants, it's also important to consider 
how 'AI friendly' the language is.

The Python language ranks highly on these criteria. It is the most popular software
language by several measures, and has been for some time. Development in Python 
is supported by a sizable collection of development tools and libraries. And,
it offers superior results with AI assistants due to the availability of large
volumes of training data for large language models (LLMs). 

# Ease of Integration and Reuse

But, for hardware verification, two of the most important factors to consider 
are ease of integration into a simulation environment and how readily existing
collateral can be reused. Both of these are critical in assessing how easily
a new language can be incrementally added to existing environments.

When it comes to ease of integration with simulation environments, Python also 
ranks very highly. The [cocotb](https://www.cocotb.org) library is a well-known 
and well-maintained library that implements a dynamic integration with simulation 
environments at the signal level using the VPI API. This allows Python-driven tests 
to easily interact with a design at the signal level.

When it comes to reuse of existing infrastructure, the picture with Python is a bit 
more mixed. `cocotb` only supports integration at the signal level, which prevents 
reuse of existing SystemVerilog object-oriented collateral.

Having a strong reuse strategy is critical to the success of bringing a new 
verification language into an existing environment. It's likely that many thousands
of person hours have been applied to building up the verification collateral in
a verification environment. Not only is it prohibitively expensive to re-develop
this in a new language, doing so risks the introduction of instability through
new bugs. 

The `pyhdl-if` library enables the use of Python with existing SystemVerilog 
classes through the use of generated wrappers. This opens up significant new 
possibilities for reuse, but does come with a cost. In the worst case, each
and every VIP in a verification environment will require a task-based interface
to be designed and developed. This forces teams to be selective in which 
components are exposed to Python which, in turn, limits adoption of Python.

Ideally, we want the best of both when it comes to integration and reuse. 
We want a low-effort integration that also supports seamless reuse of existing
SystemVerilog object-oriented verification collateral.

# Focusing on UVM

Fortunately, UVM helps to suggest a solution. Because of the popularity of UVM, 
focusing on enabling easy integration with UVM environments is a good 80+% solution.
Recent enhancements to the `pyhdl-if` library provide a ready-made integration with
UVM classes, enabling Python behavior to be initiated from UVM and UVM components 
to be used from Python. All without any custom wrapper code.

UVM provides several key areas of functionality, all of which are supported by APIs:
- Component structure
- Sequences and sequencers
- Register model
- Configuration database
- Factory

In addition to having access to these APIs, we also need to address two challenges:
- How to work with user-defined types and data
- How to initiate Python behavior

# Example

Over the next few posts, we'll dig into all the details of how this works from a
technical perspective. For now, let's take a look at a simple example that highlights
just how easy it is to add Python behavior to a UVM environment by leveraging the
UVM API.

<p align="center">
<img src="{{ '/imgs/2025/10/pyhdl_uvm_component_proxy.png' | absolute_url }}"/>
</p>

This example shows how we can use a *component proxy* class in SystemVerilog 
to initiate Python behavior from our UVM testbench. As the diagram suggests, 
we will add a new component instance in SystemVerilog that will act as a 
proxy for a UVM component implementation in Python.

{% highlight verilog %}
package top_pkg;
    import uvm_pkg::*;
    import pyhdl_uvm::*;

    // Test
    class base_test extends uvm_test;

        pyhdl_uvm_component_proxy   m_pycomp;

        `uvm_component_utils(base_test)

        function new(string name = "base_test", uvm_component parent);
            super.new(name, parent);
        endfunction

        function void build_phase(uvm_phase phase);
            super.build_phase(phase);
            m_pycomp = pyhdl_uvm_component_proxy::type_id::create("m_pycomp", this);
            m_pycomp.pyclass = "pycomp::PyComp";
        endfunction

        task run_phase(uvm_phase phase);
            $display("--> test run_phase");
            phase.raise_objection(this);
            // Test stimulus would go here
            #100;
            phase.drop_objection(this);
            $display("<-- test run_phase");
        endtask
    endclass

endpackage
{% endhighlight %}

The additions to the SystemVerilog portion of the testbench are minimal. Specifically:
- New field for the component proxy
- Construction of the component proxy in the *build_phase*. 
- Specification of the Python class that implements the component

Now let's look at the Python class:

{% highlight python %}
from hdl_if.uvm import UvmComponentProxy

class PyComp(UvmComponentProxy):

    def build_phase(self, phase):
        print("-- build_phase", flush=True)

    def connect_phase(self, phase):
        print("-- connect_phase", flush=True)

    async def run_phase(self, phase):
        print("Hello from PyComp run_phase", flush=True)
{% endhighlight %}

The implementation must inherit from the *UvmComponentProxy* base class. The
*build_phase*, *connect_phase*, and *run_phase* methods will be invoked by 
the SystemVerilog UVM environment.

And, that's it. No need to generate API interface classes, and just a few
lines a code needed to get something running.

If you're interested, you can look at the full code [here](https://github.com/fvutils/pyhdl-if/tree/main/examples/uvm).


# Conclusions and Next Steps

Of course, the example above only shows how to get started. 
Over the next few posts, we'll dive into more detail on the capabilities of the
`pyhdl-if` library UVM integration. We'll also look at usecases for Python in 
a verification environment. 

