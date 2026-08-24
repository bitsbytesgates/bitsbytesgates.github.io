---
title: 'TbLink-RPC: Simplifying the Multi-Language Testbench'
date: '2022-03-27T13:40:00.000-07:00'
tags: []
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-3321529724266083236
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/03/tblink-rpc-simplifying-multi-language.html
modified_time: '2022-03-27T13:42:47.349-07:00'
image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjRHKdkXm_YqfEF4nahvthmhcSyVkvuROeDoDcR-M25X1Gi4KFoG15drTEl7t3H1HOyImflxhYPzMa1pYxQ0wNDNpekQqWBkJA3JjecSNMlZkG8wTEczhFu-1mfHq0PQggd8LWdgvuRiPGEqjRhulETC-0LC-JRH3L7p0ZUDQBepfWBgn6wtw5cznPjhg/s72-c/MultiLanguageTestbench_splash.png
syndicate: none
---

<div>

[![](/legacy-img/MultiLanguageTestbench_splash.png)](/legacy-img/MultiLanguageTestbench_splash.png)

</div>

  

SystemVerilog/UVM is, by far, the most widely-used language and methodology for block and subsystem-level verification environments today. The simplicity of that statement overlooks the fact that it’s often very common to have other bits of non-SystemVerilog code connected. Maybe it’s some C/C++ code that implements a reference algorithm used by the scoreboard. Maybe it’s an instruction-set simulation model used to implement software behavior. Maybe it’s infrastructure that allows early firmware code to drive behavior in the simulation. Either way, integrating non-SystemVerilog code is a non-trival development and maintenance task, despite the fact that SystemVerilog defines a standard API (the Direct Procedure Interface – DPI).

This is the first in a series of posts describing a project that I’ve been working with a goal of simplifying this situation. The TbLink-RPC (roughly Testbench Link Remote Procedure Call) provides infrastructure that dramatically reduces the code a testbench developer needs to create in order to integrate code with a simulation environment. 

Two primary experience brought me to working on the TbLink-RPC project. The first was a somewhat long history of feeling like I had to reinvent the wheel every time I needed to integrate non-SystemVerilog code into a testbench environment. The second was my interest in ‘alternative’ testbench languages and my experience using Python as a verification language.

Back in the 2017/2018 timeframe, I started to get re-involved with open-source hardware design targeting, primarily, FPGAs. When you’re designing gateware (frankly, any software-like thing), it’s imperative to have a good test environment. I did a bit of exploration, trying out bespoke C++ testbench environments and a few other things, before landing on Python and cocotb as my test framework. A lot of this was motivated by open-source tool capabilities and community. I was committed to using open-source tools as much as possible for my open-source gateware, and open-source simulators (eg Icarus and Verilator) didn’t support sufficient SystemVerilog features to be able to use SV-UVM. After looking around a bit, cocotb seemed to have the largest community around it making it the obvious choice.

I found a lot to like about Python and cocotb for developing testbench environments. Python has a large collection of libraries, and the ability to easily incorporate these in a testbench boosted my productivity. I find the Python language easy to write and use – especially for smaller projects. Having a pure-Python testbench worked for me as a hobbyist. In many ways, that is because I create all my testbench environments from the ground up and don’t use commercial Verification IP (VIP/UVCs). 

This same approach doesn’t work in most commercial environments. Testbench environments must reuse existing VIPs/UVCs (either commercial or developed in-house), and it’s common for a testbench architecture to remain mostly-unchanged across multiple design cycles. Doing a wholesale conversion to Python (or any other ‘alternative’ language) doesn’t make sense. Furthermore, bringing in small amounts of a different language has a high development and maintenance cost.

What I concluded I really wanted was a framework that would simplify the process of integrating some amount of testbench code written in any language (more precisely, any non-SystemVerilog language since the simulator already supports SystemVerilog) into a simulation environment.

**Concept**

I’ll get into more detail about the TbLink-RPC architecture in a future post. Fundamentally, though, the idea is to form a point-to-point connection between two environments through which pairs of objects can communicate via method calls. 

<div>

[<img src="/legacy-img/concept_diagram.png" width="400" height="165" />](/legacy-img/concept_diagram.png)

</div>

  

There are a few things that make TbLink-RPC different from other remote-procedure-call solutions. The first is that TbLink-RPC is simulation centric. Or, rather, it is designed to work with environments that maintain a local “simulated” notion of time. To that end, TbLink-RPC supports both blocking (time-consuming) and non-blocking functions, and defines a protocol to ensure that time advances at the intended time.

TbLink-RPC is designed to support both single OS process and multi OS-process integration. Single-process integration (where both environments run in the same OS process) provide higher performance.    But, single-process integration isn’t always feasible. For example, one environment might be an instruction-set simulator (eg QEMU) that must run in its own process in order to manage memory in its own highly-specialized way. 

TbLink-RPC emphasizes automation and modularity. Code-generation automation is used to create the boilerplate code, minimizing user effort to integrate new APIs. The entire system is designed such that integrations created independently can be easily combined. Even better, this is done in such a way that SystemVerilog users don’t need to deal with generated DPI integration code.

  

**Example**

An example is often the simplest way to get across a concept, and I have a very simple one here. For now, I’ll just show the key elements of a typical use case: connecting a Python reference model to a UVM testbench environment. 

<div>

[<img src="/legacy-img/UVM_tb_diagram.png" width="320" height="264" />](/legacy-img/UVM_tb_diagram.png)

</div>

  

Now, in this case our DUT isn’t that exciting. It’s just an adder, so our reference model is correspondingly trivial. 

<div>

[![](/legacy-img/python_class.png)](/legacy-img/python_class.png)

</div>

  

Our reference-model class contains a method named ‘add’ that returns the sum of two parameters passed to it. Note that we apply a decorator (tblink_rpc.iftype) to the class. This registers the class with the TbLink-RPC infrastructure. Note, also, that we apply a decorator to the ‘add’ method and specify typing annotations for the parameters and return type. Together, these register the method with TbLink-RPC and specify the parameter types to be used.

<div>

[![](/legacy-img/sv_object_class.png)](/legacy-img/sv_object_class.png)

</div>

  

In order to call our Python class from SystemVerilog, we will need a SV class to call. That class is shown above, and combines a class from the TbLink-RPC library (TbLinkLaunchUvmObj) with some generated implementation classes created from the API definition that in Python. If our class contained methods implemented in SystemVerilog that could be called from Python, then this class would contain the implementation. Since that’s not the case, there isn’t anything to implement here.

From a UVM testbench perspective, using our Python class involves two steps:

- Launch an instance of the class in Python connected with the SV class
- Call the API

<div>

[![](/legacy-img/launch_remote_obj.png)](/legacy-img/launch_remote_obj.png)

</div>

The first step, launching, is shown above. The TbLink-RPC library class (TbLinkLaunchUvmObj) that our class inherits from implements the details of starting up and communicating with an embedded or remote environment. We just have to specify the details of how to do this via the configuration object. In this case, and in most cases, we will use a factory method to fill in common details. Because we are starting a Python environment, we must specify the Python module (uvm_python_obj) that contains the Python class we wish to call.

<div>

[![](/legacy-img/call_remote_obj.png)](/legacy-img/call_remote_obj.png)

</div>

  

<div>

Finally, we need to call our reference model. Our scoreboard contains a method that accepts operand data from the agent driving the ALU, and a result from the agent monitoring the ALU output. We call the reference model by making a SV class-method call to obtain the expected result from the Python reference model.

</div>

<div>

**Next Steps**

</div>

<div>

TbLink-RPC is designed to simplify integrating code into simulation environment. In the context of a SystemVerilog environment, this makes it much easier and simpler to bring in external models written in non-SystemVerilog. Over the course of the next few posts, I’ll go into a bit more detail on TbLink-RPC architecture and the nuts and bolts of the integration process.

  

**References**

- TbLink-RPC (under construction) - <https://tblink-rpc.github.io/>
- cocotb - <https://docs.cocotb.org/en/stable/>

<div>

Copyright 2022 Matthew Ballance

</div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

</div>
