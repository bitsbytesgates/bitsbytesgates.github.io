---
title: 'SoC Integration Testing: Intro and Challenges '
date: '2021-01-16T18:29:00.000-08:00'
tags:
- SoC Verification
- Software-Driven Verification
- Python
- RISC-V
- Open Source EDA
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-8165435786622037178
blogger_orig_url: https://bitsbytesgates.blogspot.com/2021/01/soc-integration-testing-intro-and.html
modified_time: '2021-01-16T18:29:25.412-08:00'
image: https://1.bp.blogspot.com/-B9Vd2K7SMOs/YAOfDE0VZ9I/AAAAAAAADcI/d8ylNbcOYkE7KcgOtIYl_wtKnMNcKTW4gCLcBGAsYHQ/s72-c/splash.png
series: SoC Integration Testing
syndicate: none
---

<div>

[![](/legacy-img/splash.png)](/legacy-img/splash.png)

</div>

  

<div>

As I mentioned in my [end-of-year post](/blog/2020-nights-and-weekends-projects-in-review/), one of my 2020 projects was to develop a design for the [Google/eFabless/SkyWater Multi-Project Wafer (MPW) fab run](https://efabless.com/open_shuttle_program). One thing I looked forward to was applying elements of the Python-based verification flow that I've been developing. Doing so highlighted a gap in my verification toolkit: reusable infrastructure for SoC-level verification.

</div>

<div>

**Caravel and the User Project Area**

</div>

<div>

[eFabless](https://efabless.com/), the company developing the RTL to GDS flow and project-managing the MPW shuttle, developed the pad ring and some management circuitry that all projects made use of. The management circuitry includes a small processor, a few peripherals, and debug circuitry for observing and interacting with the user-project area (see image below). 

</div>

<div>

[<img src="/legacy-img/ciic_harness.png" height="320" />](/legacy-img/ciic_harness.png)

</div>

<div>

The entire thing is called the Caravel -- a carrier for the user project. To keep things simple, my project was, itself, a very small SoC with a RISC-V core, a few peripherals and some memory (shown below). 

</div>

<div>

[![](/legacy-img/fwpayload_diagram.png)](/legacy-img/fwpayload_diagram.png)

</div>

So, essentially, the entire project is two SoCs back to back. 

<div>

<div>

**IP Verification vs SoC Integration Testing**

</div>

<div>

Much of my work recently has been with Python-based verification environments focused on IP-level verification. I've worked with constrained-random stimulus generation, functional coverage, and bus functional models. While IP-level verification isn't the only possible application of this work, my usage has all been firmly focused on verification of RTL IP-level designs.

</div>

<div>

Verifying the "payload" portion of the MPW design was fairly straightforward using this infrastructure. I was able to leverage some bus functional models (BFMs) from the [PyBfms](https://github.com/pybfms) library, and wrote some Python tests to verify that the design IPs were properly integrated.

</div>

<div>

However, things got more complicated (and painful) when it came to verifying the integration by running software on the Caravel management processor. Lack of visibility into what the software was doing made debug difficult. Lack of synchronization between the running software and the testbench environment made automating regression tests difficult. Given some tight deadlines, I ended up focusing on verifying my project and largely tested the interface between the management processor and my project using interactive tests. But, the experience got me thinking about what reusable elements would have enabled more complete and comprehensive verification.

</div>

<div>

**Verification Key Requirements**

</div>

<div>

IP-level and SoC-level testbench environments are quite different. IP-level environments have a monolithic testbench ideally composed of reusable test infrastructure, while the test infrastructure is much more distributed in an SoC-level environment. Despite these differences, the key requirements for highly-productive verification are very similar in both of these test environments.

</div>

***Synchronization and Control***

</div>

<div>

All testbench environments need to synchronize execution of the various components. In a monolithic testbench, this is typically done with thread-synchronization primitives provided by the testbench language (eg fork/join and semaphores for SystemVerilog) or the testbench library (eg Event for cocotb). 

</div>

<div>

Synchronization and control have two primary roles: ensure the test only begins once everything in the testbench environment is running, and detect the end of the test and shut everything down. In a monolithic environment, this isn't so difficult. In an SoC environment, this becomes much more difficult because a key part of our testbench is the embedded software running on the processor core(s) in the design. Synchronizing the start and end of the test with this running software is a challenge. Unlike synchronization in an IP-level testbench, which is addressed in one way for a given language and library, synchronization and control in an SoC environment is often addressed in a custom manner. 

</div>

<div>

***Debug visibility***

</div>

<div>

In an IP-level testbench environment, debug typically leverages two sources of information: signal-level waveform trace and the debug log. We still have all of that data in an SoC environment, of course, but getting a sense of what the test software is doing at the point of a hardware failure is much more difficult. Often, it comes down to manually correlating the program counter from the waveform with a disassembly dump of the test program.

</div>

<div>

  
***Metrics***

</div>

<div>

IP-level environments provide several sources of metrics for determining when verification is complete. Functional coverage metrics ensure that key test scenarios are executed, and that key conditions are exercised in the design. Code-coverage metrics alert us to areas of the design not being properly exercised by tests.

</div>

<div>

In an SoC-level environment, we would like to add software-centric metrics to help us understand whether our test software is exercising key scenarios. Lack of visibility into the operation of the software tends to get in the way of doing this.

</div>

<div>

  
***Verification IP***

</div>

<div>

Verification IP for external interfaces is present in both IP- and SoC-level environments. VIP simplifies the process of exercising design behavior via an interface. In an SoC-level environment, the IPs in the SoC take over the role that verification IP played for internal interfaces. It's often difficult to use these IPs as verification IP because appropriate low-level driver software isn't available -- either it hasn't been developed yet or it only exists in the context of a full operating system. Taking time to write low-level driver software for IPs in the SoC takes away time from writing test scenarios.

</div>

<div>

<div>

**Looking Forward**

</div>

<div>

My latest experience in both IP/subsystem-level and SoC-integration verification has emphasized that there's a hole in my verification toolbox. The existing tools in my verification toolbox work quite well for IP-level verification, and they're quite reusable. I'd like to have more reusable elements when approaching SoC integration testing. 

</div>

<div>

Over the next few blog posts I'll look at some SoC-level verification infrastructure that I'm creating. A key hope, of course, is that this is sufficiently general that it's more broadly useful than just for Caravel. I'll be focusing on approaches and methodology that can be applied whether you're a hardware hobbyist or in commercial practice. I'll also be continuing my focus on Python as the testbench methodology, but same approaches should work with SystemVerilog or SystemC as well if you're using these methodologies.

</div>

<div>

I'm always interested in feedback on whether these elements of methodology are useful, scalable, etc. So, please comment with your thoughts. 

</div>

<div>

<div>

***Disclaimer***

</div>

<div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

</div>

</div>

<div>

*  
*

</div>

</div>
