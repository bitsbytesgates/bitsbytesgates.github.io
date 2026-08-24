---
title: 'FWRISC: Sizing up the RISC-V Architecture'
date: '2018-12-08T20:17:00.001-08:00'
tags:
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
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-1699277764769430972
blogger_orig_url: https://bitsbytesgates.blogspot.com/2018/12/fwrisc-sizing-up-risc-v-architecture.html
modified_time: '2018-12-16T09:45:33.642-08:00'
image: https://3.bp.blogspot.com/-vl_M8KSBei8/XAx_fj8Fi9I/AAAAAAAACak/oEnB_fcrCFogqQNpOW0CdSAKnZ-_uJWJQCLcBGAs/s72-c/post2_intro.png
syndicate: none
---

<div>

[![](/legacy-img/post2_intro.png)](/legacy-img/post2_intro.png)

</div>

  
  
After deciding on October 22nd to create a RISC-V implementation to enter in the [2018 RISC-V soft-core contest](https://riscv.org/2018contest/) (with entries due November 26th), I needed to gather more information of the RISC-V ISA in general, and the RV32I subset of the ISA specifically. I had previously done some work in RISC-V assembly -- mostly writing boot code, interrupt handlers, and thread-management code. But I certainly hadn't explored the full ISA, and certainly not from the perspective of implementing it. Bottom line, I needed a better understanding of the ISA I needed to implement.  
  
**Fundamentals of the RISC-V ISA**  
The first thing to understand about the RISC-V architecture is that it came from academia. If you took a computer architecture course and read the [Patterson and Hennesy book](https://www.amazon.com/Computer-Architecture-Quantitative-John-Hennessy/dp/012383872X), you read about some aspects of one of the RISC-X family of instruction sets (RISC-V is, quite literally, the 5th iteration of the RISC architecture developed at UC Berkeley).  
  
Due in part to its academic background, the ISA has both been extended and refined (restricted) over time -- sometimes in significant and sometimes in insignificant ways. This ability to both extend and change the ISA is somewhat unique when it comes to instruction sets. I'm sure many of you reading this are well-aware of some of the baggage still hanging around in the x86 instruction set (string-manipulation instructions, for example). While many internal protocols, such as the [AMBA bus protocol](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.ihi0011a/index.html), often take a path of complex early specification versions followed by simpler follow-on versions, instruction set architectures often remain more fixed. In my opinion, the fact that the RISC-V ISA had a longer time to incubate in a context that did not penalize backwards-incompatible changes has resulted in an architecture that is cleaner and easier to implement.  
  
The RISC-V ISA is actually a base instruction-set architecture, and a family of extensions. The RV32I (32-bit integer) instruction set forms the core of the instruction-set architecture. Extensions add on capabilities such as multiply and divide, floating-point instructions, compressed instructions, and atomic instructions. Having this modular structure defined is very helpful in enabling a variety of implementations, while maintaining a single compiler toolchain that understands how to create code for a variety of implementations.  
The RISC-V soft-core contest called for an RV32I implementation, though implementations could choose to include other extensions. The RV32I instruction set is actually very simple -- much simpler than other ISAs I've looked at in the past:  

- 32 32-bit general-purpose registers
- Integer add, subtract, and logical-manipulation instructions
- Control-flow instructions
- Load/store instructions 
- Exceptions, caused by a system-call instruction and address misalignment
- Control and status registers (CSRs)
- Cycle and instruction-counting registers
- Interestingly enough, interrupts are **not** required

<div>

In total, the instruction-set specification states that there are 47 instructions. I consider the RV32I subset to actually contain 48 instructions, since ERET (return from exception) is effectively required by most RV32I software, despite the fact that it isn't formally included in the RV32I subset. 

</div>

<div>

On inspection, the instruction-set encoding seemed fairly straightforward. So, where were the implementation challenges?

</div>

<div>

- CSR manipulation seemed a bit tricky in terms of atomic operations to read the current CSR value, while clearing/setting bits.
- Exceptions always pose interesting challenges
- The performance counters pose a size challenge, since they don't nicely fit in FPGA-friendly memory blocks

<div>

Despite the challenges, the RV32I architectural subset is quite small and simple. This simplicity, in my opinion, is the primary reason it was possible for me to create an implementation in a month of my spare time. 

</div>

</div>

**Implementation Game Plan**  
For a couple or reasons, I elected to use a simple approach to implementation of the RISC-V ISA. First, the deadline for the contest was very close and I wanted to be sure to actually have an entry. Secondly, my thinking was that a simple implementation would result in a smaller implementation.  
Since I was interested in evolving [Featherweight RISC](https://github.com/mballance/fwrisc) after the contest, a second-level goal with the initial implementation was to build and prove-out a test suite that could be used to validate later enhancements.  
  
The implementation approach I settled on was state-machine based -- not the standard RISC pipelined architecture. Given that I was targeting an FPGA, I also planned to move as many registers as possible to memory blocks.  
  
**Next Steps**  
With those decisions made, I was off create an implementation of the RISC-V RV32I instruction set! In my next post, I'll discuss the test-driven development approach I took to implementing the [Featherweight-RISC](https://github.com/mballance/fwrisc) core.  
  

<div>

***Disclaimer***

</div>

  

<div>

</div>

  

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>
