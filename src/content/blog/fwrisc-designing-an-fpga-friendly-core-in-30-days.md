---
title: 'FWRISC: Designing an FPGA-friendly Core in 30 Days'
date: '2018-12-01T17:55:00.000-08:00'
tags:
- Zephyr
- Verilator
- RTL
- FPGA
- Googletest
- Verilog
- RISCVcontest
- RISC-V
- HDL
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-3278562873094967676
blogger_orig_url: https://bitsbytesgates.blogspot.com/2018/12/risc-v-designing-fpga-friendly-core-in.html
modified_time: '2018-12-04T12:56:24.325-08:00'
image: https://3.bp.blogspot.com/-rCh9bdAbtkY/XAL5Um0aZOI/AAAAAAAACaI/RH1k9rBNkwM2bhGswKIO1Q63wTv6NraVQCLcBGAs/s72-c/fwrisc_intro_splash_2.png
syndicate: none
---

<div>

</div>

<div>

[![](/legacy-img/fwrisc_intro_splash_2.png)](/legacy-img/fwrisc_intro_splash_2.png)

</div>

<div>

Designing a processor is often considered to be a large and complex undertaking, so how did I decide to design and implement in a month? For a few reasons, really. For one, my background is in hardware design, despite having worked in the EDA (Electronic Design Automation) software industry for many years. The last time I did a full hardware design was quite a few years ago using an i386EX embedded processor and other packaged ICs. Recently, though, I've been looking for opportunities to brush up on my digital-design skills. The primary reason, however, was that I saw the call for contestants in the [2018 RISC-V soft-core processor contest](https://riscv.org/2018contest/). I've found contests to be a fun way to learn because the organizers' criteria often cause me to learn something I otherwise wouldn't have thought to investigate. This contest was certainly no different!

</div>

<div>

The 2018 RISC-V contest certainly had some unique criteria. The contest required that verification be done using the [Verilator](https://www.veripool.org/wiki/verilator) "simulator", an open-source Verilog to C++ translator that is very fast and powerful, but also has some interesting quirks. Also required was support for [Zephyr](https://www.zephyrproject.org/), a real-time operating system (RTOS) that I certainly wasn't aware of before the contest. Most interesting to me, though, was the contest category for smallest RISC-V FPGA implementation.

</div>

<div>

**Small, you say?**

</div>

<div>

When thinking about processor design, I often think about maximizing performance. However, there are many applications -- especially in the IoT space -- where having a small amount of processing power that requires little resources is very important. Often these applications are dominated today by older processor architectures, such as the venerable 8051. Despite it's somewhat-small size in an FPGA implementation, the 8051 processor isn't terribly friendly to C compilers, and is very slow. What if a modern architecture, such as the RISC-V ISA, could take the place of these older architectures while matching, or even improving, on their small size?

</div>

<div>

Despite seeing the value of having small RISC-V implementations, my first reaction when seeing the contest announcement was puzzlement. Weren't there already several small RISC-V implementations? Well, as it turns out, yes and no. There were several existing small implementations. However, the ones I found were not truly compliant with the RV32I architecture specification. The tradeoffs taken were often taken to reduce the implementation size by removing features that required resources, but were not needed for the author's intended application. These tradeoffs often meant that a special compiler toolchain was needed, or that users needed to be cautious when attempting to reuse existing software written for the RISC-V ISA.

</div>

<div>

**Results?**

</div>

<div>

Well, bottom line, I was able to design, verify, and implement a 32-bit RV32I RISC-V core in 30 days, and you can find the code on [GitHub](https://github.com/mballance/fwrisc). A netlist of the design is shown at the beginning of this post. Early results are quite promising with respect to the balance between performance and size, and there are several known areas for improvement. Through the process, I've learned a lot -- rediscovering RTL design, gaining a much deeper appreciation of the RISC-V ISA, and learning about new tools like Verilator and infrastructure like Zephyr. Over the next few weeks, I'll be writing more about specific details of the design and verification process and what I learned. So, stay tuned for future posts!

</div>

<div>

***Disclaimer***

</div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

<div>

*  
*

</div>
