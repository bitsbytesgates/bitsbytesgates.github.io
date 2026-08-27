---
title: '2020: Nights and Weekends Projects in Review'
date: '2020-12-28T18:20:00.000-08:00'
tags:
- Year in Review
- PyVSC
- PyBFMs
- cocotb
- Functional Coverage
- Constrained Random
- Python
- RISC-V
- SoC Verification
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-6930909879744532713
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/12/2020-nights-and-weekends-projects-in.html
modified_time: '2020-12-28T18:20:06.178-08:00'
image: https://1.bp.blogspot.com/-DZkaD_vzuoQ/X-oyxNXGKwI/AAAAAAAADZo/WF95kx1n-74ipRgHDy7CKvmQd5C5aIWhQCLcBGAsYHQ/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-2.png)](/legacy-img/splash-2.png)

</div>

## 2020 in Review

<div>

Last year was my first year-end blog post looking back at the prior year's projects, and I thought I'd continue the (now) tradition this year. 2020 has definitely been a different year for me, and not just because of the COVID19 situation. It's been a year to take a step back and consider directions, next steps, and the tools I'll need to get there. But it's also included some interesting and fun "nights and weekends" projects. Let's jump in with a project that's much more targeted at the future -- retooling for the new meaning of cross-platform.

</div>

## The New Cross-Platform and Retooling

<div>

Cross-platform has always been a key development consideration of mine when developing software. In the early 2000s, cross-platform largely meant that software would run well on Linux, Windows, and macOS -- ideally without incurring significant development overhead. During these years, I found Java to be a productive way to approach developing cross-platform software. 

</div>

<div>

More recently, cross-platform has taken on a more-expansive meaning. These days, it's often desirable to make functionality available to users and developers in a variety of environments in addition to across a range of operating systems:

</div>

<div>

- As a C/C++ or Java library accessible via an API
- As a Python extension
- As a web service accessible via a json-rpc API
- Executing in a browser

<div>

One project in particular -- a language-processing library -- really emphasized these cross-platform requirements. I could see needing to make this language parser and related logic available via a Python API, available as a web service, running locally in a browser, and (possibly) as part of a native desktop application. In all of these environments, of course, it had to be fast. 

</div>

</div>

<div>

I spent time looking at a variety of options. Python was great for software distribution and for use by integrators, but lacked performance and didn't provide an easy path to running in the browser. Typescript/Javascript looked interesting, but going that route appeared to make distribution as a Python extension or native library more difficult. Rust, also, looked promising in the long term, but a bit early in the near term.

</div>

<div>

After much investigation, my conclusion has been to pursue a bit of a "back to the future" solution: C++. C++ provides good native-compiled performance. It's well-supported for creating and delivering Python extensions. And, with a bit of [Emscripten](https://emscripten.org/)/WASM magic, it can be used in the browser.

</div>

<div>

Look for the first results of this new strategy to become available in 2021 as part of some language development tooling.

</div>

## PyBFMs: High-performance BFMs

<div>

In 2018 and 2019 I put some focus on testbench methodology that worked across open-source and closed-source commercial tools, and eventually settled on using Python and the [cocotb](https://github.com/cocotb/cocotb) library. I quickly realized that it would be beneficial to have a library of Bus Functional Model (BFMs) for standard protocols, and that the overall simulation performance could be improved substantially if the low-level functionality of these BFMs was implemented in the hardware-description language and only the high-level functionality was implemented in Python. This led to creation of the [PyBFMs](https://github.com/pybfms) project. 

</div>

<div>

Roughly speaking, there are two components to the PyBFMS project: a core package with code generators and a native library for interfacing with simulators, and a set of packages that each provide BFMs for a given protocol. 

</div>

<div>

Having a robust library of reusable and high-performance Python BFMs dramatically shortens the time it takes to create a Python verification environment for a design. Currently, this is a project that primarily makes progress as needed to support verification projects that I work on. My hope for 2021 on this project is to make progress on enabling others to contribute protocol BFMs that are of interest to them.  

</div>

## PyVSC: Constraints and Coverage in Python

<div>

One effort I continued from 2019 was my work with constraint solvers and embedded domain-specific languages (eDSLs). Compared to SystemVerilog, one thing I missed about Python was the lack of complex randomization and the ability to collect functional coverage.

</div>

<div>

[<img src="/legacy-img/RISCV-DV_Coverage.png" width="320" />](/legacy-img/RISCV-DV_Coverage.png)

</div>

The [PyVSC](https://pyvsc.readthedocs.io/en/latest/) (Python Verification Stimulus and Coverage) package is built on top of the high-performance [Boolector](https://github.com/boolector/boolector) solver. Python provides many features that enable embedding a new language inside Python, including operator-overloading and introspection. PyVSC makes heavy use of all of these features to allow users to model constraints and functional coverage within the Python language.

In addition to randomizing data to apply to the design being verified, doing good verification also requires tracking what has been tested. Functional coverage fills that role in commercial verification flows today. PyVSC also provides features for modeling and capturing functional coverage data. 

## Google MPW Shuttle

<div>

One of the more-exciting projects I tackled this year was actually the furthest outside my areas of expertise. As such, I feel like I learned a lot, and came to have a much better appreciation for the challenges of ASIC implementation.

</div>

<div>

Like many others that I've met in the industry, my interest in electronics started as a hobby. Given the decade, my earliest experience with electronics was at the component level -- designing circuits at the schematic level, then soldering those circuits together either with point-to-point wires or on hand-etched PCBs. It's amazing to see how far we've come since then in terms of readily-available CAD software for PCB layout and accessible, cost-effective, on-demand manufacturing of high-quality PCBs for hobbyists.

</div>

<div>

The story is quite different when it comes to chip design, of course. Hobbyists and low-volume commercial applications have access to FPGAs, while creating an ASIC remains a complex and expensive proposition. 

</div>

<div>

There are signs this could be changing, though. Several projects have been working on assembling the elements and tools needed to implement an ASIC using open-source and/or closed-source tools. One big thing to change this year was availability of a Process Design Kit (PDK) under an open-source license. The [SkyWater 130nm PDK](https://www.skywatertechnology.com/blog/how-to-design-with-a-free-skywater-pdk/) doesn't target a cutting-edge technology node by any means, but it's certainly still relevant. And, having a manufacturable PDK is a key enabler for the development of tools, methodologies, and expertise. 

</div>

<div>

[<img src="/legacy-img/FWPayload_rot.png" width="320" />](/legacy-img/FWPayload_rot.png)

</div>

  

<div>

Of course, for a hobbyist like myself, having an open-source PDK is great and interesting, but there's little practical application. Or, at least there wasn't until I learned about the Google-sponsored Multi-Project Wafer (MPW) shuttle. The premise was quite simple: provide a design targeting the SkyWater PDK and get some chips fabricated. Much of the heavy lifting on the mechanics of this project (at least as far as I could tell) was done by [eFabless](https://efabless.com/), a company that provides SoC development services. 

</div>

<div>

I plan to write more about the process of going from RTL to GDS-II with an open-source toolchain in the coming year. For now, I want to commend Google, eFabless, and SkyWater for pushing the envelope in enabling custom-silicon development!

</div>

## Looking Forward

<div>

So, what's in store for 2021? More hardware development -- this time with an emphasis on targeting the SkyWater PDK. And, perhaps, a return to creating language-development tools. No matter what projects come along, I know there will always be new things to learn!

</div>

<div>

***Disclaimer***

</div>

<div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

</div>
