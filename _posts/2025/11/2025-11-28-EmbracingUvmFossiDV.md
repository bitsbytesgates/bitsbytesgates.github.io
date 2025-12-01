---
layout: post
title: Embracing UVM for FOSSi Design Verification
date: 2025-11-01
categories: FOSSiDV
excerpt_separator: <!--more-->
mermaid: true
---

Open source communities emphasize reuse and collaboration centered around
open and standard data formats. While open source communities do exist in 
cases where closed-source tools provide the sole implementation of a standard,
these communities have significant challenges compared to communities with 
access to open-source tools. The Free and Open Source 
Silicon (FOSSi) community recently gained the ability to run SystemVerilog/UVM
code on the Verilator open-source simulator, significantly increasing the ability
to share reusable testbench components across flows running on open- and closed-source
tool flows.

creation of UVM
testbench environments that are aligned with thoseallows ability opens the door to new
opportunities to collaborate and share open-source SystemVerilog UVM verification 
infrastructure
and the ability to use that UVM infrastructure with open source tools.
- Significantly increases the ability to share 
- Increases our ability to share and collaborate

<!--more-->

# The Value of Consistency 
There has always been significant cross-over between open source and closed-source
development in the software world. Students and hobbyists gain critical skills 
working with open-source tools, with the understanding that the same languages, 
methodologies, and tools are used in environments where the work product may 
not be open source. Companies that produce closed-source software often contribute 
to open-source libraries and tools that they use interanlly, and benefit from a 
larger community of users and developers. 

By and large, this holds true in the FOSSi community when it comes to hardware 
design. SystemVerilog and VHDL are used to capture hardware designs, with full
open- and closed-source tool stacks to simulate and synthesize. This consistency 
has been critical in fostering a sizable ecosystem of available and reusable 
open-source hardware designs. Because these open-source hardware components 
use the same standard interchange formats used for closed-source development,
the technical aspects of integrating an open-source component into a closed-source 
design are straightforward.

# FOSSi and Functional Verification
Until recently, the picture was quite different for functional verification. 
Functional verification is the systematic process of confirming that the
implemention of a hardware design matches the intended functionality, as 
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

This allows students and hobbyists to hone their skills in dominant industry
practices, while also enabling them to explore emerging new verification 
approaches and technologies. A portable verification stack also makes it 
easier for industrial users to incorporate new technologies into their 
existing SystemVerilog/UVM environments.

- Base of SystemVerilog/UVM -- reusable protocol Veriifcation IP
- Option of what goes on top
  - SystemVerilog tests
  - Python tests
  - ???
- Option of what else to connect

Impact:
- Increased opportunity for sharing -- especially around protocol verification IP
  - Speeds environment creation, and how quickly 
- As a library developer, provides a consistent base on which to build
- Provides a critical component of a continuous integration flow, automatically 
  ensuring quality and enabling a larger group of contributors since all can
  access 

# Looking Forward
Supporting 
- Leverage existing community of engineers that use UVM
- Increase Verilator feature support and stability by increasing how much content, and the complexity of the content, that runs on Verilator.

- Open-source communities spring up around all open 
- Focusing on standards pays off: if you're a student, knowing standards helps you 
  get a job. If you're a FOSSi hobbyist, focusing on standards means a larger pool
  of potential collaborators that also know the standards that that you're using.

# Changes in How We Collaborate
Increased connectivity has fundamentally changed the way that these communities collaborate,
especially with respect to how software-like infrastructure is developed. Greater 
connectivity and automation has enabled development to be effectively and 
productively carried out by a distributed team. In a space like design verification,
it's unlikely that all collaborators will have access to the same closed-source tools.
Open-source tool implementations are critical in providing a set of tools that, by definition,
all collaborators can freely access. 

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
- [2024 Wilson Research Group Functional Verification Study](https://verificationacademy.com/topics/planning-measurement-and-analysis/wrg-industry-data-and-trends/2024-siemens-eda-and-wilson-research-group-ic-asic-functional-verification-trend-report/)
- [Verilator](https://www.veripool.org/verilator/)
- [UVM](https://www.accellera.org/downloads/standards/uvm)


Using innovative technologies and techniques is a great thing. The inability
to use an industry-standard methodology 
unable 
though, it would be
needing to 

Ideally, though, using 
When the choice of verification tool stack and methodology divides the 
community, it becomes a problem.

Impact:
- Splits community -- can learn theory of dominant industry methodology
  with libraries like PyUVM, but can't actually practice SystemVerilog/UVM
  with open source tools
- Imposes a barrier for contributing to SystemVerilog/UVM open source 
  projects, since must have access to closed-source tools
- Limits distributed development by limiting what can be validated with
  continuous integration flows. 