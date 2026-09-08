---
title: 'PSS 3.1 Is Out for Public Review -- Here''s What Changed'
date: 2026-09-07
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
---

<p align="center">
<img src="/imgs/2026/09/pss31_public_review_banner.png" width="660" alt="PSS 3.1 out for public review: four cards -- Constraints, Composition, Target code, Target runtime -- each listing three features with their clause numbers"/>
</p>

After roughly two years of work, the Accellera Portable Stimulus Working Group (PSWG) released 
PSS 3.1 for public review. PSS 3.1 is a so-called 'minor' release, which is always a bit subjective.
PSS 3.1 doesn't introduce major new features, the way that PSS 3.0 introduced behavioral coverage.
But, it does introduce new features that enable modeling scenarios that were previously impossible, 
and simplify things that were previously possible by clunky or inconvenient. The PSWG is looking 
for feedback by the end of September, so the clock is ticking. Let's dig in to survey the broad
categories of change in PSS 3.1.

<!--more-->

Every new release of a standard contains a variety of features. With major release, we can point
to a small number of headline features. With a minor release like 3.1, it's helpful to organize
the new features into categories. The banner does a good job of listing four categories of 
new feature. Over the next few posts, we'll dig into each category in more detail. For now, let's
get the lay of the land.

## Constraints

```pss
struct xfer_s {
    rand bit[64] src_addr, dst_addr;
    rand int     access_sz;

    constraint aligned(bit[64] a, int n) { a % n == 0; }

    constraint c {
        access_sz in [1,2,4,8];
        aligned(src_addr, access_sz);
        aligned(dst_addr, access_sz);
    }
}
```

PSS scenario models use constraints heavily to capture data-value and scheduling *rules* of the
test scenario. PSS started out with the bulk of the constraint features that SystemVerilog 
supports. 3.1 adds support for *soft* constraints, but also adds a new type of constraint 
designed for reuse: generic constraints. Think of generic constraints as the constraint
equivalent of functions -- very helpful when you want to express the same relationship
multiple times across different variables.

## Composition

```pss
instance ref chan_c       primary;
instance list<ref chan_c> spares;
ref chan_c                observer;

mutable int bytes_moved;
```

PSS uses structure, in the form of the component tree, as a location. PSS 3.1 adds 
several new structural capabilities -- including mutable data that activities can
use during the solve phase and using component-reference fields as action context
in activities.

## Target code

```pss
exec body C = """
    {# One program call per chunk, then start the engine. #}
    {% foreach (c : chunk[0..nchunks-1]) %}
    dma_program_chunk({{c}});
    {%%}
    {% if (irq) %}
    dma_enable_irq();
    {%%}
    dma_start();
""";
```

PSS continues to support text generation as a mechanism for realizing tests. 
New controls have been added to support greater control over the generated output.

## Target runtime

```pss
channel_c<desc_s, 4> descq;

action consume_a {
    exec body {
        desc_s d;
        // Blocks until an element is available; FIFO order.
        d = comp.descq.get();
        message(LOW, "programmed a descriptor");
    }
}
```

PSS 3.1 introduces two new capabilities for runtime interaction. Channels
provide a mailbox for passing data between threads within a PSS scenario,
or between PSS scenario threads and the environment. A new 'export function'
feature provides a way for the environment call into a PSS test -- for example,
to notify of an interrupt.

## Conclusion and next steps

PSS 3.1 has a wealth of new features and improvements to existing features, and 
we'll start looking in more depth at the features in each category in future 
posts. The public review period for PSS 3.1 extends through the end of September.
Read the LRM draft and provide feedback via the [Accellera 3.1 Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)! 


## Resources
- [Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
