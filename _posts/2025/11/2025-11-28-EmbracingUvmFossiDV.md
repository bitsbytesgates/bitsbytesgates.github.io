---
layout: post
title: Embracing UVM for FOSSi Design Verification
date: 2025-11-28
categories: FOSSiDV
excerpt_separator: <!--more-->
mermaid: true
---

Open source communities emphasize reuse and collaboration centered around
open and standard data formats. While open source communities do exist in 
cases where closed-source tools provide the sole implementation of a standard,
these communities have significant challenges compared to communities with 
access to open-source tools. The Free and Open Source 
Silicon (FOSSi) community [recently gained the ability](https://antmicro.com/blog/2025/10/support-for-upstream-uvm-2017-in-verilator/) 
to run SystemVerilog/UVM code on the Verilator open-source simulator, bringing significant new opportunities
to share reusable testbench components across flows running on open- and closed-source
tool flows.

<!--more-->

# The Value of Consistency 
There has always been significant cross-over between open source and closed-source
development in the software world. Students and hobbyists gain critical skills 
working with open-source tools, with the understanding that the same languages, 
methodologies, and tools are used in environments where the work product may 
not be open source. Companies that produce closed-source software often contribute 
to open-source libraries and tools that they use internally, and benefit from a 
larger community of users and developers. 

By and large, this holds true in the FOSSi community when it comes to hardware 
design. SystemVerilog and VHDL are used to capture hardware designs, with full
open- and closed-source tool stacks to simulate and synthesize. Innovative
methodologies and tools, such as CHISEL and Amaranth HDL, increase productivity
while still connecting to existing tools using standard hardware description languages (HDLs). 

Support for standard languages and a standard design methodology 
has been critical in fostering a sizable ecosystem of available and reusable 
open-source hardware designs. Because these open-source hardware components 
use the same standard interchange formats used for closed-source development,
the technical aspects of integrating an open-source component into a closed-source 
design are straightforward.

# FOSSi and Functional Verification
Until recently, the picture was quite different for functional verification. 
Functional verification is the systematic process of confirming that the
implementation of a hardware design matches the intended functionality, as 
described by the functional specification. Due to tool capabilities, what
is common when developing with closed-source tools differs significantly
from what is common when developing with open-source tools.

<p align="center">
<img src="{{ '/imgs/2025/11/open_vs_closed_dv_flow.png' | absolute_url }}" />
</p>

Across the industry, [SystemVerilog/UVM](https://verificationacademy.com/topics/planning-measurement-and-analysis/wrg-industry-data-and-trends/2024-siemens-eda-and-wilson-research-group-ic-asic-functional-verification-trend-report/) 
is the most-prevalent infrastructure used to create verification environments.
Until recently, only closed-source tools could run SystemVerilog/UVM testbench environments. 
Thus, content intended to run with a pure open-source tool stack had to 
use a different testbench methodology.

# Toward a Portable Verification Methodology
Ideally, as a community, we can have the best of both worlds: the ability
to use prevalent industry libraries and methodologies with open- and 
closed-source tool chains, and the ability to add new technologies and
techniques on top.

<p align="center">
<img src="{{ '/imgs/2025/11/portable_dv_flow.png' | absolute_url }}" />
</p>

A portable verification stack allows students and hobbyists to hone their skills 
in dominant industry practices, while also enabling them to explore emerging new verification 
approaches and technologies. A portable verification stack also makes it 
easier for industrial users to incorporate new technologies into their 
existing SystemVerilog/UVM environments.

Leveraging SV/UVM in a portable verification flow has other highly-desirable
side effects as well. Having more open-source verification collateral written
in SystemVerilog will help to increase Verilator's support for the language, 
and will result in increased testing of Verilator due to the prevalence of 
continuous-integration flows used for open source.

# Why Focus on Verification IP?

Protocol Verification IP (VIP) is the nexus of the various flows shown above
for good reason.  Hardware designs interact with the outside world via their interfaces. 
Using standard interfaces vastly simplifies the task of integrating designs. Standard
interface protocols range from quite simple to incredibly complex. Most importantly,
the most critical aspects to verify in a hardware design are typically not the
implementation of the interface protocols. And, what's more, the way our tests
wish to interact with the design is typically at the software level -- for example,
memory reads and writes -- not at the detailed level of the interface protocol.

That's where protocol Verification IP comes into the picture. Just like other 
reusable design IP, protocol verification IPs are pre-verified components of
the testbench environment that exist to translate between the software-level 
activity of our tests and the detailed signal-level implementation of a standard
protocol. 

Verification IP allow us to start testing the unique aspects of our design
more quickly, since we can interact with the 'test' side of the VIP at a high
level, with confidence that the VIP will translate to the details of the standard
protocol. Being able to use UVM in our verification flow gives us access
to a much wider set of reusable verification IP.

# Conclusion
Support for SystemVerilog/UVM in open-source tools opens up new possibilities for 
sharing within the FOSSi community and with the closed-source silicon development 
industry. It allows students and professional hobbyists to hone their skills with
common industrial practice using open source tools and collateral. And, it enables
far better distributed development by allowing all contributors to access the same
continuous integration (CI) flow. 

We'll look at an architecture for modular multi-language/multi-environment UVM 
protocol VIP in a future series of posts. But, next week, we'll spend some time looking at 
the suite of PyHDL-IF examples and how to run them. 


# References
- [Support for upstream UVM 2017 in Verilator](https://antmicro.com/blog/2025/10/support-for-upstream-uvm-2017-in-verilator/)
- [CHISEL](https://www.chisel-lang.org/)
- [Amaranth HDL](https://github.com/amaranth-lang)
- [2024 Wilson Research Group Functional Verification Study](https://verificationacademy.com/topics/planning-measurement-and-analysis/wrg-industry-data-and-trends/2024-siemens-eda-and-wilson-research-group-ic-asic-functional-verification-trend-report/)
- [Verilator](https://www.veripool.org/verilator/)
- [UVM](https://www.accellera.org/downloads/standards/uvm)


