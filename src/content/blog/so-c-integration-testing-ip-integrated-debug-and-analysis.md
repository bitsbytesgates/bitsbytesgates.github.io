---
title: 'SoC Integration Testing: IP-Integrated Debug and Analysis'
date: '2021-02-28T10:27:00.000-08:00'
tags:
- SoC Verification
- PyBFMs
- cocotb
- Python
- UVM
- RISC-V
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-7365953598579437340
blogger_orig_url: https://bitsbytesgates.blogspot.com/2021/02/soc-integration-testing-ip-integrated.html
modified_time: '2021-02-28T10:27:30.939-08:00'
image: https://1.bp.blogspot.com/-Uv3Qm-tHLPY/YDrk77i_u0I/AAAAAAAADgk/nBkE_Qvibsc8eUvE_0sC13PQEKEJpRr0ACLcBGAsYHQ/s72-c/splash.png
series: SoC Integration Testing
syndicate: none
---

<div>

[![](/legacy-img/splash-8.png)](/legacy-img/splash-8.png)

</div>

One of the things I've always liked about side projects is the freedom to stop and explore a topic of interest as it comes up. One such topic that came up for me recently is IP-integrated debug and analysis instrumentation. I started thinking about this after the last post ([link](/blog/so-c-integration-testing-higher-level-software-debug-visibility/)) which focused on exposing a higher-abstraction-level view of processor-core execution. My initial approach to doing this involved a separate bus-functional model (BFM) intended to connect to any RISC-V processor core via an interface. After my initial work on this bus-functional model that could be bolted onto a RISC-V core, two things occurred to me:

<div>

- Wouldn't it be helpful if processor cores came with this type of visibility built-in instead of as a separate bolt-on tool?
- Wouldn't SoC bring-up be simpler if more of the IPs within the SoC exposed an abstracted view of what they were doing internally instead of forcing us to squint at (nearly) meaningless signals and guess?

<div>

And, with that, I decided to take a detour to explore this a bit more. Now, it's not unheard of to create an abstracted view of an IP's operation during block-level verification. Often, external monitors that are used to reconstruct aspects of the design state, and that information is used to guide stimulus generation, or as part of correctness checking. Some amount of probing down into the design may also be done.

</div>

<div>

While this is great for block-level verification, none of this infrastructure can reasonably move forward to the SoC level. That leaves us with extremely limited visibility when trying to debug a failure at SoC level.

</div>

<div>

If debug and analysis instrumentation were embedded into the IP during its development, an abstracted view of the IP's operation would consistently be available independent of whether it's being verified at block level or whether it's part of a much larger system.

</div>

<div>

**Approach**

</div>

<div>

After experimenting with this a bit, I've concluded that the process of embedding debug and analysis instrumentation within an IP is actually pretty straightforward. The key goals guiding the approach are:

</div>

- Adding instrumentation must impose no overhead when the design is synthesized. 
- Exposing debug and analysis information must be optional. We don't want to slow down simulation unnecessarily if we're not even taking advantage of the debug information

<div>

When adding embedded debug and analysis instrumentation to an IP, our first step is to create a 'socket' within the IP to which we can route the lower-level signals from which we'll construct the higher-level view of the IP's operation. From a design RTL perspective, this socket is an empty module whose ports are all inputs. We instance this 'debug-socket' module in the design and connect the signals of interest to it.

</div>

<div>

Because the module contains no implementation and only accepts inputs, synthesis tools very efficiently optimize it out. This means that having the debug socket imposes no overhead on the synthesized result.

</div>

<div>

Of course, we need to plug something into the debug socket. In the example we're about to see, what we put in the socket is a Python-based bus functional model. The same thing could, of course, be done with a SystemVerilog/UVM agent as well.

</div>

**Example - DMA Engine**

</div>

<div>

**  
**

</div>

<div>

Let's look at a simple example of adding instrumentation to an existing IP. Over the years, I've frequently used the [wb_dma core from opencores.org](https://opencores.org/projects/wb_dma) as a learning vehicle, and when creating examples. I created my first OVM testbench around the wb_dma core, learned how to migrate to UVM with it, and have even used it in SoC-level examples. 

</div>

<div>

|                                                                                                                                                                                                                                                                                                                            |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [<img src="/legacy-img/DMA_block_diagram.png" width="400" height="315" />](/legacy-img/DMA_block_diagram.png) |
| DMA Block Diagram                                                                                                                                                                                                                                                                                                          |

  

<div>

The wb_dma IP supports up to 31 DMA channels internally that all communicate with the outside world via two initiator interfaces and are controlled by a register interface. It isn't overly complex, but determining what the DMA engine is attempting to do by observing traffic on the interfaces is a real challenge!

</div>

<div>

When debugging a potential issue with the DMA, the key pieces of information to have are:

</div>

- When is a channel active? In other words, when does it have pending transfers to perform?
- When a channel is active, what is it's configuration? In other words, source/destination address, transfer size, etc.
- When is a channel actually performing transfers?

<div>

While there may be additional things we'd like to know, this is a good start.

</div>

<div>

[<img src="/legacy-img/TransferDetail.png" width="640" height="438" />](/legacy-img/TransferDetail.png)

</div>

  

<div>

The waveform trace above shows the abstracted view of operation produced for the DMA engine. Note the groups of traces that each describe what one channel is doing. The *dst*, *src*, and *sz* traces describe how an active channel is configured. If the channel is inactive, these traces are blanked out. The *active* signal is high when the channel is actually performing transfers. Looking at the duty cycle of the *active* signals across simultaneously-active channels gives us a good sense for whether a given channel is being given sufficient access to the initiator interfaces. 

</div>

<div>

Let's dig into the details a bit more on how this is implemented.

</div>

<div>

</div>

<div>

***DMA Debug/Analysis Socket***

</div>

<div>

We first need to establish a debug/analysis "socket" -- an empty module -- that has access to all the signals we need. In the *[fwperiph-dma](https://github.com/Featherweight-IP/fwperiph-dma)* IP (a derivative of the original *wb_dma* project), this socket is implemented by the [fwperiph_dma_debug module](https://github.com/Featherweight-IP/fwperiph-dma/blob/main/verilog/rtl/fwperiph_dma_dbg.v). 

</div>

<div>

[<img src="/legacy-img/fwperiph_dma_dbg.png" width="333" height="400" />](/legacy-img/fwperiph_dma_dbg.png)

</div>

  

<div>

And, that's all we need. The debug/analysis socket has access to:

</div>

- Register writes (adr, dat_w, we)
- Information on which channel is active (ch_sel, dma_busy)
- Information on when a transfer completes (dma_done_all)

<div>

Note that, within the module, we have an \`ifdef block allowing us to instance a module. This is the mechanism via which we insert the actual debug BFM into the design. Ideally, we would use the SystemVerilog *bind* construct, but this IP is designed to support a pure-Verilog flow. The \`ifdef block accomplishes roughly the same thing as a type bind.

</div>

<div>

***Debug/Analysis BFM***

</div>

<div>

The debug/analysis BFM has two components. One is a [Verilog module](https://github.com/Featherweight-IP/fwperiph-dma/blob/main/verilog/dbg/python/fwperiph_dma_bfms/hdl/fwperiph_dma_dbg_bfm.v) that translates from the low-level signals up to operations such as "write channel 2 CSR" and "transfer on channel 3 complete". This module is about 250 lines of code, much of it of low complexity. 

</div>

<div>

The other component of the BFM is the [Python class](https://github.com/Featherweight-IP/fwperiph-dma/blob/main/verilog/dbg/python/fwperiph_dma_bfms/fwperiph_dma_dbg_bfm.py) that tracks the higher-level view of what channels are active, how they are configured, and ensures that the debug information exposed in signal traces is updated. The Python BFM can also provide callbacks to enable higher-level analysis in Python. The Python BFM is around 150 lines of code. 

</div>

<div>

So, in total we have ~400 lines of code dedicated to debug and analysis -- a similar amount and style to what might be present in a block-level verification environment. The difference, here, is that this same code is reusable when we move to SoC level. 

</div>

<div>

**Results**

</div>

<div>

**  
**

</div>

<div>

Thus far, I've mostly used the waveform-centric view provided by the DMA-controller integrated debug. Visual inspection isn't the most-efficient way to do analysis, but I've already had a couple of 'ah-ha' moments while developing some cocotb-based tests for the DMA controller. 

</div>

<div>

[<img src="/legacy-img/AlignedStart.png" width="640" height="236" />](/legacy-img/AlignedStart.png)

</div>

I was developing a full-traffic test that was intended to keep all DMA channels busy for most of the time when I saw the pattern in the image above. Notice that a transfer starts on each channel (left-hand side), and no other transfers start until all the previously-started transfers are complete (center-screen). Something similar happens on the right-hand side of the trace. Seeing this pattern graphically alerted me that my test was unintentionally waiting for all transfers to complete before starting the next batch, and thus artificially throttling activity on the DMA engine.

</div>

<div>

<div>

[<img src="/legacy-img/RandomStart.png" width="640" height="224" />](/legacy-img/RandomStart.png)

</div>

With the test issue corrected, the image above shows expected behavior where new transfers start while other channels are still busy.  

<div>

**Looking Forward**

</div>

<div>

**  
**

</div>

<div>

I've found the notion of IP-integrated debug and analysis instrumentation very intriguing, and early experience indicates that it's useful in practice. It's certainly true that not all IPs benefit from exposing this type of information, but my feeling is that many that contain complex, potentially-parallel, operations exposed via simple interfaces will. Examples, such as DMA engines, processor cores, and PCIe/USB/Ethernet controllers come to mind. And, think how nice it would be to have IP with this capability built-in!

</div>

<div>

In this blog post, we've looked at the information exposed via the waveform trace. This is great to debug the IP's behavior -- while it's being verified on its own or during SoC bring-up. At the SoC level, the higher-level information exposed by at the Python level may be even more important. As we move to SoC level, we become increasingly interested in validation -- specifically, confirming that we have configured the various IPs in the design to support the intended use, but not over-configured them and, thus, incurred excess implementation costs. My feeling is that the information exposed at the Python level can help to derive performance metrics to help answer these questions.

</div>

<div>

This has been a fun detour, and I plan to continue exploring it in the future -- especially, how it can enable higher-level analysis in Python. But, now it's time to look at how we can bring the embedded-software and hardware (Python)  portions of our SoC testbench closer together. Look for that in the new few weeks.

</div>

<div>

***References***

</div>

<div>

- wb_dma IP (original Wishbone DMA IP) -- <https://opencores.org/projects/wb_dma>
- fwperiph-dma IP (Modified DMA IP) -- <https://github.com/Featherweight-IP/fwperiph-dma>

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

</div>
