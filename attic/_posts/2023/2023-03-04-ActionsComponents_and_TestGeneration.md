---
layout: post
title: "PSS Fundamentals: Actions, Components, and Test Generation"
date: 2023-03-03
categories: PSS
series: "Intro to PSS"
excerpt_separator: <!--more-->
---
<p align="center">
<img src="{{ '/imgs/2023/PSSFundamentals_ActionsComponents_splash.png' | absolute_url }}"/> 
</p>
Complex engineering endeavors require complex calculations. It's open to 
debate as to when the first engineering project that required complex 
calculations occurred. What we do know is that those 
calculations would have been done by hand. And this 
state largely remained until the broad availability of the electronic 
calculator in the 1950s and 1960s, even as engineering projects 
and the technology we used to accomplish them become more ambitious.

<p align="center">
<img src="{{ '/imgs/2023/US-Veterans-Bureau-Computing-Division-1924.jpg' | absolute_url }}"
    height="480"/>
<em><figcaption>Computing Division of the US Veterans Bureau, 1924. Image Courtesy of the Computer History Museum.</figcaption></em>
</p>

But this doesn't mean that "computers" (those individuals performing
computations with pen and ink or simple mechanical machines) were left 
to compute everything from the ground up. Fortunately, books were published 
containing mathematical tables that provided the pre-computed results of 
standard trigonometric 
functions for various input values. The data in these books of 
mathematical tables would, of course, have been produced
laboriously by some other "computer" or "computers" working with pen 
and paper. But, they were invaluable at increasing the speed with 
which complex calculations could be completed by hand.

<!--more-->

<p align="center">
<img src="{{ '/imgs/2023/LogTrigTablesBook.jpg' | absolute_url }}" height="320"/>
<em><figcaption>Logarithmic and Trigonometric Tables Book. Image courtesy of the Smithsonian.</figcaption></em>
</p>

What does this have to do with Portable Test and Stimulus (PSS)? 
PSS is specifically designed to enable PSS processing tools to 
pre-compute the result of complex test scenario relationships in order
to make the best use of instructions running at a few Hertz on a simulated 
RTL model of the design processor. But, before we get to how PSS creates tests, 
we need to learn about two fundamental PSS concepts: Actions and Components

## Actions and Layered Test Modeling
Our next key topic is the Action. As it so happens, several languages
and description formats use the notion of _Action_. After all, it 
is a very intuitive term to capture an element that is all about
describing and encapsulating behavior. Before digging into actions,
it is helpful to understand how PSS divides a description of test 
behavior into two portions. 

<p align="center">
<img src="{{ '/imgs/2023/ModelingRealizationLayers.png' | absolute_url }}"/>
<em><figcaption>PSS Modeling and Realization Layers.</figcaption></em>
</p>

The upper portion, called the Modeling Layer, contains the constraintt-driven 
features for modeling test scenarios, and is responsible for capturing the 
space of interesting and useful behaviors. 

In contrast, the realization layer is more-or-less 
intended to carry out the instructions of the modeling layer, and 
contains familiar procedural statements such as appear in other 
programming languages like C, Java, and Python. The realization layer
is also where we'll find constructs for reading and writing registers
and memory. While the realization layer makes local decisions, often
related to handshaking with the device it controls, the modeling layer
is intended to make the big-picture decisions about how the system
is exercised. 

### Connecting Modeling and Realization Layers
As the diagram suggests, _Actions_ bridge the boundary between modeling and 
realization layer because they can contain both modeling and realization 
aspects. In all cases, actions group the data, constraints, and implementation 
for a given behavior. 

```pss
action check_reg_reset_vals {
    list<bit[32]> reset_vals = {0x0000_0000, 0x0180_2FFF, 0x8000_0000};
    rand bit[8] start;

    constraint start in [0..reset_vals.size()-1];

    exec body {
        bit[32] off, addr, val;
        repeat (i : reset_vals.size()) {
            off = ((start + i)%reset_vals.size());
            addr = 0x1000_0000 + 4*off;
            val = read32(addr);

            if (val != reset_vals[off]) {
                error("Failed to read register at 0x%08x: read 0x%08x ; expected %08x",
                    addr, val, reset_vals[off]);
            }
        }
    }
}
```

The example above is an action that checks the reset value of registers in the
design. It contains a list of register expected values, and a random variable
that will specify the order in which the action checks the reset values -- 
just to be sure that the order in which we access registers doesn't change
behaviors. This is our modeling layer.

The realization layer of the example is contained in the `body` block. This
is the code that carries out the 'higher-level' decisions made by the 
modeling layer. In this case, we:
- Loop over the set of registers we need to check
- Compute the offset and address of the selected register which are 
  relative to a random starting point.
- Read it, check against the expected value, and report any mismatches.

Even this tiny action begins to show some of the value of modeling scenarios
with PSS. Our code is similar to what we might write in C and, if anything, is
a bit more compact. Let's come back to this example to see how PSS can help
us with generating test variants.

One other thing that we'll come back to are activities. The action above is
called an `atomic` action. An atomic action is a leaf-level action that
is implemented in terms of procedural code. We can also implement the 
behavior of an action in terms of other actions. This so-called `activity`
provides us an expanded set of modeling features. 

## Components
`Components` are the other key PSS fundamentals construct for this post. The 
requirement for `components` stems from the observation that actions in
a system `act on` a specific context. A DMA transfer action must `act on` 
a _specific_ DMA controller, because there are likely to
be several in a system. A DMA transfer action needs to know things like
what the base address is for the DMA controller registers. The PSS `Component` 
construct fills this requirement for a persistent, static entity to model
physical entities, the resources they contain, and the operations that 
can be performed on them.

```pss
component dma_c {
    action mem2mem_a {
        // ...
    }

    // ...
}

component subsys_c {
    dma_c           dma0;
    dma_c           dma1;

    // ...
}
```

Components may be composed hierarchically, much as designs are. So, if your
subsystem design contains two instances of a DMA controller IP, your
PSS component that represents the subsystem from a test perspective will
as well.


Components is another topic that we will revisit in greater depth in a 
future post. For now, their fundamental attributes are:
- The component tree remains constant for the lifetime of the test
- A component type groups the supported behaviors and resources required by 
those behaviors
- Each action execution is associated with a corresponding instance of
a component


## Test Creation Flow
PSS breaks the execution of a PSS model into two large phases:
- Solve  -- Constraints are solved, random variable values are assigned, etc
- Target -- Behavior executes on the target platform

The goal is to enable separating or combining these phases depending 
on the characteristics of the environment.

<p align="center">
<img src="{{ '/imgs/2023/PSSTestGenFlow.png' | absolute_url }}"/>
<em><figcaption>PSS Pre-Gen Test Generation Flow.</figcaption></em>
</p>

The figure above shows a typical _pre-generation_ flow targeted at 
producing bare-metal test software for SoC integration verification.
In this case, simplifying computations performed on the target 
platform is a key goal, since the simulated RTL processor model runs
at a very low effective clock speed.

Looking back at our 'register reset test' action, the implementation
code might look like the following:

{% highlight C %}
int main() {
  uint32_t val;
  uint32_t ret = 0;

  val = *((volatile uint32_t *)0x10000004);
  if (val != 0x01802FFF) {
    error("Failed to read register at 0x%08x: read 0x%08x ; expected %08x",
         0x10000004, val, 0x01802FFF);
    ret |= 1;
  }
  val = *((volatile uint32_t *)0x10000008);
  if (val != 0x80000000) {
    error("Failed to read register at 0x%08x: read 0x%08x ; expected %08x",
        0x10000008, val, 0x80000000);
    ret |= 1;
  }
  val = *((volatile uint32_t *)0x10000000);
  if (val != 0x00000000) {
    error("Failed to read register at 0x%08x: read 0x%08x ; expected %08x",
        0x10000000, val, 0x00000000);
    ret |= 1;
  }
  return ret;
}
{% endhighlight %}

Note that, in this case, the PSS processing tool has pre-computed the random 
starting index, unrolled the loop, and pre-computed addresses in order to minimize 
instructions executed on the target platform. It could also have locally-computed
a random value between 0 and 2 for the starting index. Due to the abstraction
level at which the test behavior is defined, the PSS processing tool has many
implementations options that can be traded off against the requirements of the
implementation platform.

Much as mathematical tables helped human
computers to maximize the results they were able to produce by hand, the PSS
semantics that enable pre-computation of results help PSS-created tests maximize
test throughput on simulated hardware platforms.


## Looking Forward
In this post, we have learned about two key PSS constructs: _actions_ and _components_. 
_Actions_ describe model-level behavior and connect that high-level behavior to 
test realization implementation via exec blocks. _Components_ describe structure,
and group behaviors (actions) with the resources they require. From now on, every
example will be built from _Actions_ and _Components_, and we will add new ways
that PSS enables actions and components to interact.

In the next post, we will begin to look in more detail at the declarative basis
of the PSS language. Being, first and foremost, declarative makes PSS a bit 
different as languages go, but also enables many of its most impressive capabilities.


