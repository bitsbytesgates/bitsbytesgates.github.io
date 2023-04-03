---
layout: post
title: "PSS Memory Management Fundamentals"
date: 2023-04-02
categories: PSS
series: "Intro to PSS"
mermaid: true
---

<p align="center">
<img src="{{ '/imgs/2023/04/MemoryManagement_splash.png' | absolute_url }}"/> 
</p>

Storage (memory) is right in the middle of all the work with do with
computer architecture. We have different kinds of memory that each have different
trade-offs around performance (latency / throughput), cost per unit,
and power consumption. We arrange memories into hierarchies with 
the goal of keeping frequently-used data in the upper 
(faster, but limited) layers, while pushing infrequently-accessed data 
to the lower (slower, but more expansive) layers. 

Given the large amount of time time designers spend thinking about 
memory needs, it's no surprise that creating good and capable tests 
to exercise those designs depends on being able to acquire the right 
type of memory at the right time in order to fully-exercise the 
capabilities and characteristics of the system.

Remember, though, that we're writing bare-metal tests. Consequently, we need 
to allocate memory for our test behaviors ahead of time in order to not waste valuable
simulation or emulation time running the 'malloc' and 'free' algorithm. 
When done by hand, static allocation can limit how reusable code is and
remove the majority of variability (ie randomness) from test scenarios. Fortunately, 
PSS provides some easy to use features that allow actions to manage memory that 
they require in a way that enables static allocation while not limiting 
variability or reuse. Let's dig in!

# Test Requirements for Memory Management
System-level tests have three core requirements when it comes to 
memory management:
- Ensure that behaviors needing distinct blocks of memory are provided non-overlapping
  blocks of memory
- Ensure behaviors that need to share data see the same memory
- Ensure that a test is able to explicitly specify the general
  location in memory (eg SRAM, DDR, etc) where a memory block
  comes from.

One of the biggest challenges with hand-written bare-metal
tests is implementing these three characteristics in a distributed
and modular way. 

There are two parts of the PSS memory management approach:
- Specification of available memory resource
- Specification of claims on those resources, and how the claimed data is used.

# Using Memory in Behaviors
Let's start with the second point -- how we claim memory -- since we can see 
immediately how that fits into our DMA example.

In PSS, an action claims memory by having one or more random fields of type
_addr_claim_s_. The action can control how much memory is being requested,
and its alignment, by constraining the fields of the claim.

{% highlight pss %}
buffer MemBuf {
    rand bit[32]    size; // Size of the data
    addr_handle_t   addr_h;
}

component WbDma {

    action Mem2Mem {
        input MemBuf            src_i;
        input MemBuf            dst_o;
        rand addr_claim_s<>     dst_claim;

        // Input and output size must be the same
        constraint dst_o.size == src_i.size;

        // DMA only transfers words
        constraint (dst_o.size % 4) == 0; 

        // Specify size/alignment for allocation
        constraint dst_claim.size == dst_o.size;
        constraint dst_claim.alignment == 4;

        exec post_solve {
            dst_o.addr_h = make_handle_from_claim(dst_claim);
        }

        exec body {
            // ...
        }
    }

    // ...
}
{% endhighlight %}

Okay, we've added a few things to the skeleton Mem2Mem action that
we created in the last post:
- Added a `size` field to `MemBuf` to ensure that producers and consumers
  of this type agree on the data size.
- Added an 'addr_h' field to `MemBuf` that will hold a handle to the allocated
  memory block. 
- Add a claim field (`dst_claim`) to the `Mem2Mem` action that will cause 
  memory to be allocated for the DMA destination memory
- Add constraints to:
  - Relate the source and destination buffer objects.
  - Relate the source and destination buffer objects.

One new thing is that we assign the address handle to a field in the output 
buffer within the `post_solve` exec block inside the `Mem2Mem` action. 
This is done in order to make the address available to the consumer of the 
buffer. Why does this work? 
PSS specifies that two actions that are connected by a buffer object 
both have a handle to exactly the same object. That means that when the 
outputting action assigns a value to a field, it is assigning to the 
exact field that the inputting action will read.

## Specifying Memory Claim Lifetimes

By default, the lifetime of a memory claim is the same as the action containing
it. 

{% highlight pss %}
component WbDma {

    action Mem2Mem {
        input MemBuf            src_i;
        input MemBuf            dst_o;
        rand addr_claim_s<>     dst_claim;

        // ...
    }
}
{% endhighlight %}

In the context of our example, that means that `dst_claim` would be released
as soon as the DMA transfer completes. Clearly, that's not what we want since we
are claiming `dst_claim` in order to provide data to another action.

The solution is to _extend_ the lifetime of the memory claim by attaching 
it to something with a longer lifetime. In this case, that thing with a 
longer lifetime is, very naturally, the output buffer, since we intend the 
lifetime of the buffer and the lifetime of our memory claim to match.

{% highlight pss %}
component WbDma {

    action Mem2Mem {
        input MemBuf            src_i;
        input MemBuf            dst_o;
        rand addr_claim_s<>     dst_claim;

        // ...

        exec post_solve {
            dst_o.addr_h = make_handle_from_claim(dst_claim);
        }

        // ...
        
    }
}
{% endhighlight %}

Now, when the memory we've claimed is passed to another action via a buffer,
the memory claim lives at least until the receiving action is complete.

<div class="mermaid" align="center">
flowchart TD;
  mem_b_1 -.-> mem2mem_1
  mem2mem_1 -.-> mem_b_2
  mem_b_2 -.-> mem2mem_2
  mem2mem_2 -.-> mem_b_3
  subgraph Execution
    mem2mem_1("Mem2Mem[1]") --> mem2mem_2("Mem2Mem[2]")
  end
  subgraph Dataflow
    mem_b_1(["MemBuf\nsize: 64\naddr_h=0x80000000"])
    mem_b_2(["MemBuf\nsize: 64\naddr_h=0x80001000"])
    mem_b_3(["MemBuf\nsize: 64\naddr_h=0x80002000"])
  end
</div>

# Describing Memory Resources
In addition to claiming memory, we also need to capture the memory available
to us in the system. This is done by defining an address space with one or
more memory regions, from which memory will be allocated. 

Address spaces are instanced in the component tree. Recall from the post about
actions and components that each action execution occurs in the context of
a component instance.

The address space used by a given claim is located by searching hierarchically
up the component tree from the action's context component instance until an 
address space with the same `trait` type as the claim is found.

This resolution scheme means that we need to exercise care in where we place
our address space. Memory is most commonly a system property. 
If we instance our DMA Engine in two different systems, we could reasonably
expect the available memory to be different. The amount of memory is likely
to be different, as are the base addresses of key memory regions.

<div class="mermaid" align="center">
flowchart TD
  subgraph PssTop["pss_top"]
    aspace[["aspace : transparen_address_space_c<>"]]
    mem2mem-. claim .->aspace
    subgraph WbDma["dma : WbDma"]
      mem2mem["Mem2Mem"]
    end
  end
</div>

## Capturing Available Memory
In our simple example, we will capture the address space for our DMA
engine to use in `pss_top`. 

{% highlight pss %}

// ...

component pss_top {
    transparent_addr_space_c<>           aspace;

    WbDma                                dma;

    exec init_down {
        transparent_addr_region_s<>      region;

        region.addr = 0x8000_0000;
        region.size = 0x1000_0000;
        aspace.add_region(region);

        region.addr = 0x0000_0000;
        region.size = 0x1000_0000;
        aspace.add_region(region);
    }
}

{% endhighlight %}

The available memory regions within the address space are specified in the 
`init_down` exec block. Here, we register two regions of memory -- one at
0x8000_0000 and one at 0x0000_0000.

# Putting it all together
We've completed the basic updates to our PSS model that enable our DMA actions
to sensibly management memory.
- We have added a memory claim to the `Mem2Mem` action to claim memory
  for the destination buffer.
- We have added a handle to the the `MemBuf` buffer type that enables
  us to properly manage the lifetime of that claimed memory.
- We have specified an address space with available regions of memory for 
  the `Mem2Mem` action to use.

At this point, the Mem2Mem action will randomly allocate memory regions from 
the two registered regions. For now, this is likely just fine. In the future,
we will need to take finer-grain control over where our memory claims are 
satisfied. Fortunately, PSS provides features to support that requirement
as well.

In this post, we've seen the steps necessarily to make use of the core 
memory-management features that PSS provides. Now that we know how to
manage memory as a test-scenario resource, we can turn our attention to
managing another type of resource: the DMA channels within the engine.


# Resources
- [1] [PSS LRM](https://www.accellera.org/downloads/standards/portable-stimulus) 
- [2] [DMA PSS Code (Viewing)]({{ 'code_html/2023/03/wb_dma_2.html' | absolute_url }})
- [3] [DMA PSS Code (Raw Text)]({{ 'code/2023/03/wb_dma_2.pss' | absolute_url }})


