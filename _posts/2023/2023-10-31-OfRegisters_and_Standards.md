---
layout: post
title: "Of Register Models and Standards"
date: 2023-10-31
categories: PSS
#series: "Intro to PSS"
mermaid: false
excerpt_separator: <!--more-->
---

<p align="center">
<img src="{{ '/imgs/2023/10/OfRegistersAndStandards_splash.png' | absolute_url }}"/>
</p>

Memory-mapped registers play an integral part in configuring and driving
the operation of the vast majority of digital designs today. As a 
consequence, it's not surprising that each language and methodology 
involved in the design, verification, and documentation of digital
designs has its own way of interacting with registers. Fortunately,
standard languages and descriptions exist that allow these language-
and methodology-specific formats to be created from a single central
description.

This post focuses on the results of a weekend project that allows 
a Portable Test and Stimulus (PSS) register access layer to be created 
from SystemRDL input.

<!--more-->

# Why so Many RALs?
Nearly every design and verification environment defines a way to access
and manipulate registers. UVM provides a set of classes for capturing
the definition of register fields, register banks, and address maps. It's
common when writing low-level firmware or tests in C to have either 
pre-processor defines or C 'structs' that specify the layout of fields
within registers and registers within the device memory map. PSS, as well,
defines a set of data structures to use in specifying the layout of 
registers.

Why go to this effort? The simple answer is that it makes code much easier
to create and understand, which makes mistakes much less likely.

Consider the following register, which captures two aspects of how a DMA
transfer is carried out. 

<p align="center">
<img src="{{ '/imgs/2023/10/WB_DMA_Channel_SZ_Reg.png' | absolute_url }}"/>
</p>

Let's assume that we want to configure the 
DMA engine to transfer a total of 128 words, with a chunk size of
4 words. 

{% highlight C %}
  uint32_t tot_chk_sz_v = 0;
  tot_chk_sz_v |= 128; // set total size
  tok_chk_sz_v |= (4 << 16);
  write32(chk_sz_reg, tot_chk_sz_v);
{% endhighlight %}

This code certainly accomplishes the job. It will result in the 
intended values being written into the register. However, other than comments, 
there is nothing in this code to provide meaning to the constants that are used.
If you're like me, revisiting this code after a few months will have you
reaching for the DMA Engine's programmers' guide to remember what all
those numbers mean.

Using a register-access layer makes our code more readable. For example,
here is that same code in C using a struct-based register access layer:

{% highlight C %}
  fwperiph_dma_ch_sz tot_chk_sz_v = {0};
  tot_chk_sz_v.tot_sz = 128;
  tot_chk_sz_v.chk_sz = 4;
  write32(&dma->ch_sz, tot_chk_sz_v.value);
{% endhighlight %}

Even without going into detail on exactly what is happening here, the
code conveys a much better picture of what is happening. And, we don't
need to worry about shifting and masking our data to cause it to be 
placed in the right bit positions.

# Register-description Standards
This is great, but across a project we're likely to need to have 
register access layers for UVM, C, and (just maybe) PSS. Clearly, 
environment-specific register-access layers helps us be productive. But, 
having to create each by hand has a high cost. Fortunately, there exist
a couple of standard description language for capturing the layout of 
registers. This allows us to capture the register layout once, and 
use automation tools to generate the specific 
register-access layers that we need. 

## IP-XACT -- Registers (and more) in XML
[IP-XACT](https://www.accellera.org/downloads/standards/ip-xact) has been 
around in one flavor or another since around 2004. Its purpose is 
to document the external and programming interfaces of IPs
in a machine readable format. While this mission is much more expansive
than just capturing registers, IP-XACT also supports capturing 
register definitions.

In IP-XACT, our DMA transfer-size register description looks like this:

{% highlight XML %}
    <ipxact:register>
        <ipxact:name>SZ</ipxact:name>
        <ipxact:addressOffset>'h4</ipxact:addressOffset>
        <ipxact:size>32</ipxact:size>
        <ipxact:field>
          <ipxact:name>tot_sz</ipxact:name>
          <ipxact:description>Total transfer size (in words)</ipxact:description>
          <ipxact:bitOffset>0</ipxact:bitOffset>
          <ipxact:bitWidth>12</ipxact:bitWidth>
          <ipxact:volatile>true</ipxact:volatile>
          <ipxact:access>read-write</ipxact:access>
        </ipxact:field>
        <ipxact:field>
          <ipxact:name>chk_sz</ipxact:name>
          <ipxact:description>Chunk size</ipxact:description>
          <ipxact:bitOffset>16</ipxact:bitOffset>
          <ipxact:bitWidth>9</ipxact:bitWidth>
          <ipxact:volatile>true</ipxact:volatile>
          <ipxact:access>read-write</ipxact:access>
        </ipxact:field>
    </ipxact:register>
{% endhighlight %}

IP-XACT captures all the data we need, and provides a great interchange
format between tools. The one thing it's (subjectively) not good at is
providing a human-friently description. XML, after all, is quite 
verbose.

## SystemRDL -- A language for describing registers
That brings us to 
[SystemRDL](https://www.accellera.org/downloads/standards/systemrdl). 
SystemRDL is a domain-specific language (DSL) specifically designed for 
capturing the structure and layout of registers. 

In SystemRDL, our DMA transfer-size register description looks like 
this:

```
reg fwperiph_dma_channel_sz {
    field {
        desc = "Total transfer size (in words)";
        hw = rw;
        sw = rw;
    } tot_sz[11:0];
    field {
        desc = "Chunk size";
        hw = rw;
        sw = rw;
    } chk_sz[24:16];
};
```

While the code above captures the same information as the previous 
IP-XACT snippet, the SystemRDL description is shorter and (arguably) 
much easier for a human to capture. Ease of use is generally the benefit 
of using a domain-specific language. The cost is the 
expense (dollars, development time, etc) of tools to support
a domain-specific language.

# PeakRDL -- Tools for processing SystemRDL
That brings me to [Latch-Up](https://www-archive.fossi-foundation.org/latchup/) -- 
the excellent FOSSi Foundation conference that acts as the US version of 
[ORConf](https://orconf.org/). I was fortunate to be able to attend this year 
and, as always, learned a great deal about developments in the open-source 
hardware development space. 

It was at Latch-Up that I first became aware of 
[PeakRDL](https://github.com/SystemRDL/PeakRDL).
PeakRDL is a collection of tools focused on the SystemRDL language. 

In addition to tools for parsing and transforming SystemRDL descriptions
into various output formats, PeakRDL provides a 
[VSCode](https://code.visualstudio.com/) extension that supports syntax
highlighting for SystemRDL files.

# PeakRDL-pss - Connecting SystemRDL to PSS
Ever since I saw PeakRDL at Latch-Up in April, my TODO list has contained
an item dedicated to adding support for the PSS register-access layer.
Fortunately, PeakRDL has a well-defined extension mechanism that allows 
new input formats and output formats to be supported without touching the
core of the tool.

Last weekend, I was starting to hand-write yet another PSS register 
description when I thought "why not tackle that TODO-list item and
actually create the PSS exporter? How hard could it really be?".

And, the great news is that it was really straightforward. I used
an existing extension module as a reference, and completed most
of the work in an afternoon. You can find the source 
[here](https://github.com/mballance/PeakRDL-pss) if you're really
interested. It's about 300 lines of pretty simple code.

Our example DMA engine register, when rendered as PSS, looks like
the following. One implementation detail that the PSS export
plug-in handles is insertion of 'reserved' fields between 
register fields that are not contiguous.

```
    struct fwperiph_dma_channel_sz : packed_s<> {
        bit[12] tot_sz;
        bit[4] reserved;
        bit[9] chk_sz;
    }
```

# Conclusions and next steps
Register access layers are key to making testbench and firmware
code that interacts with registers easy to understand and maintain.
Standard register-description languages allow developers to capture the
layout of registers using a easy-to-read and maintain language, then
use automation tools like PeakRDL to automate generation of the
environment-specific register access layer code.

In terms of next steps for PSS support in PeakRDL, the long-term goal 
is to finish documenting the extension and get is up-streamed to the 
PeakRDL organization.
Until then, you can try out the flow by installing PeakRDL, then
installing the PSS extension from the GitHub repository.

{% highlight Shell %}
  % pip install peakrdl
  % pip install git+https://github.com/mballance/PeakRDL-pss
  % peakrdl pss -o my_register_model.pss my_register_model.rdl
{% endhighlight %}


