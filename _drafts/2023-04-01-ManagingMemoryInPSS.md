---
layout: post
title: "Managing Memory in PSS"
date: 2023-03-29
categories: PSS
series: "Intro to PSS"
mermaid: true
---

Storage (memory) is right in the middle of all the work with do with
computer architecture. We have different kinds that each have different
trade-offs around performance (latency / throughput), cost per unit,
and power consumption. We arrange memories into hierarchies with 
the goal of keeping frequently-used data in the upper 
(faster, but limited) layers, while pushing infrequently-accessed data 
to the lower (slower, but more expansive) layers. 

Given the large amount of time time designers spend thinking about 
memory needs, it's no surprise that creating good and capable tests 
depends on being able to acquire the right type of memory at the right 
time in order to fully-exercise the capabilities and characteristics 
of the system.

Remember, though, that we're writing directed tests. We want to allocate
memory to our test behaviors ahead of time in order to not waste valuable
simulation or emulation time running the 'malloc' and 'free' algorithm. 
When done by hand, static allocation can limit how reusable code is and
remove the majority of variability (ie randomness) from test scenarios.

Fortunately, PSS provides some easy to use features that allow 
actions to manage memory that they require. Let's dig in!

# Test Requirements for Memory Management
System-level tests have three core requirements when it comes to 
memory management:
- Ensure that behaviors needing distinct blocks of memory have
  non-overlapping memory
- Ensure behaviors that need to share data see the same memory
- Ensure that a test is able to explicitly require the general
  location in memory (eg SRAM, DDR, etc) where a memory block
  comes from.

One of the biggest challenges with hand-written bare-metal
tests is implementing these three characteristics in a distributed
and modular way. What te

# PSS memory management fundamentals
There are two parts of the PSS memory management approach:
- Specification of available memory resource
- Specification of claims on those resources, and how the claimed data is used.

## Using Memory in Behaviors
Let's start with the second point -- how we claim memory -- since we can see 
immediately how that fits into our DMA example.

In PSS, an action claims memory by having one or more random fields of type
_addr_claim_s_. The action can control how much memory is being requested,
and its alignment, by constraining the fields of the claim.

{% highlight pss %}
buffer MemBuf {
    rand bit[32] size; // Size of the data
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


    }

    // ...
}
{% endhighlight %}

Okay, we've added a few things to the skeleton Mem2Mem action that
we created in the last post:
- Added a `size` field to `MemBuf` to ensure that producers and consumers
  of this type agree on the data size.
- Add a claim field (`dst_claim`) that will cause memory to be allocated
  for the DMA destination memory
- Add constraints to:
  - Relate the source and destination buffer objects.
  - Relate the source and destination buffer objects.

- address claim + claim process
- address handle
- memory-access methods

## Describing Memory Resources
Capturing 
  - Captured within the component tree.
  - address space -- Groups a set of address regions 
    - Always specific to a specific trait type (data structure)
    - Regions specify the data values in a trait
  - address regions
    - Specifies information about the region within the address space
      - Base address
      - Size

- Importance of memory in tests
  - Many behaviors
  - Each may need memory
  - In our earliest example, we two 
  - Remember: we're writing bare-metal tests without malloc/free
    - Need to ensure behaviors that run concurrently use unique memory
    - Need to track memory lifetime as we extend scenario
  - Want to combine behaviors (have work together independently)
    - Static assignment of memory typically limits this
    - 
  - Want to connect behaviors -- remember our mem2mem action?
    - Very difficult to assign non-overlapping memory to support this
  - Want to extend behaviors -- run more of them
    - Our static assignment of memory likely will get in the way here
  - Our tests need to scale to the system in which the IP is instanced.
    Example: different memory regions, and we want to make use of
    what is available. Why? Because differences in memory latency and 
    throughput are critical to overall system behavior. Selection of
    where data is stored is critical 

- Key needs for memory
==> Basic / Fundamental
  - Ensure unique memory when needed
  - Track lifetime so memory can be reused
  - Support specifying alignment
==> More advanced
  - Support multiple regions with different characteristics
  - Support allocating memory based on characteristic
  - Support full control over address


  ## Memory lifetime
  - Default to lifetime of the action that claimed the data
  - Holding a handle in a flow object extends lifetime to that of flow object

# Putting it all together
  - Add memory handle to data buffer
  - Add memory claim to mem2mem action
  - Pass handle to data buffer via post_solve
  - 

# Resources
- [1] [PSS LRM](https://www.accellera.org/downloads/standards/portable-stimulus) 


