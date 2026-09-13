---
layout: post
title: The Best of a Language and a Class Library
date: 2026-01-04
categories: Zuspec
excerpt_separator: <!--more-->
mermaid: true
---

In hardware design and verification, we're used to working with domain-specific
languages (DSLs), such as SystemVerilog, VHDL, and PSS, as well as class libraries, such as
UVM, SystemC, and CHISEL. We use these DSLs and class libraries to capture key 
semantics of hardware design ; each have their costs and benefits. A language, of course,
offers ultimate flexibility with significant implementation cost. Class libraries reduce
that implementation cost significantly by leveraging the capabilities of a host language,
but often lack expressive capability and portability. The [Zuspec](https://github.com/zuspec) 
project that I've been working on takes a different approach, with the goal of getting the 
benefits (and avoiding most drawbacks) of both approaches. 

<!--more-->

# DSL or Class Library?
In my experience, the use of hardware modeling varies widely across project teams. At the
extremes, some attempt to maintain a consistent set of models across various abstraction 
levels, while others focus on producing RTL for their piece of the design and create 
models on an as-needed basis to achieve that task. While these approaches seem very 
different there are points of intersection. For example, both teams will likely have a 
predictor model for use in verification. Both teams will likely find that model creation
is time consuming and, depending on their choice of modeling language, both may have 
challenges integrating a predictor model into their verification environment.

Modeling language is one of the first choices to be made when creating a hardware model.
In general, there are two choices: select a domain-specific language such as SystemVerilog, 
or select a class library, such as SystemC, that is implemented in terms of a 
general-purpose language. 

Both of these approaches have benefits and drawbacks. 

### Benefits
- Language
  - Full flexibility to have domain-specific features
  - Clear boundaries between what is the 'language' and the rest of the 
  - Full flexibility to process a model
- Class Library
  - Leverage existing tools (compilers, editors, linters, debuggers) for the base language
  - Leverage existing expertise in the base language
  - Easily expand the class library to add new capabilities

### Drawbacks
- Language
  - Expensive to implement and add new features
  - Must convince users to learn and become proficient in the language
  - Interoperability with existing languages and tools can be a challenge
- Class Library
  - Existing tools don't comprehend domain-specifics encoded by the library
  - The need to work with base-language compilers limits how the model can be processed
  - The base language often limits how easily/naturally domain-specific features can be described

We currently use a variety of domain-specific languages across the design and verification
process. Ideally, we could apply a modeling approach that retains the key benefits of 
both approaches much more broadly.

# Zuspec: A DSL / Class Library Hybrid

[Zuspec](https://github.com/zuspec/) is a Python class library with a twist. 
A model described with Zuspec dataclasses is completely valid Python syntax, and can 
be validated with existing Python static checkers.  But, due to some key Python 
capabilities, a Zuspec model can also be processed as if it were a domain-specific language. 

Python offers benefits both to the Zuspec users (ie the author of a Zuspec model) and 
to tool implementors. For users, large portions of the existing tool ecosystem can
be leveraged natively with a Zuspec description. Because the Zuspec library adheres
to Python type rules, content-assist and navigation features in integrated developement
environments, such as [VSCode](https://code.visualstudio.com/), work properly. 
For the same reason, static type checkers can help detect issues, such as incorrect 
use of functions, early.

But, what's even more attractive about Python is that it provides parsing infrastructure
that helps Zuspec construct an intermediate-representation (IR) data model that captures
details that would impossible for a pure class library to capture. This IR also 
allows Zuspec to map a Zuspec model to a variety of implementations.

Let's look at a simple example:

{% highlight python %}
    @zdc.dataclass
    class Prod(zdc.Component):
        p : zdc.PutIF[int] = zdc.port()

        async def _send(self):
            for i in range(16):
                await self.p.put(i)
                await self.wait(zdc.Time.ns(10))

    @zdc.dataclass
    class Cons(zdc.Component):
        c : zdc.GetIF[int] = zdc.port()

        @zdc.process
        async def _recv(self):
            while True:
                i = await self.c.get()
                print("Received %d" % i)

    @zdc.dataclass
    class Top(zdc.Component):
        p : Prod = zdc.inst()
        c : Cons = zdc.inst()
        ch : zdc.Channel[int] = zdc.inst()

        def __bind__(self): return (
            (self.p.p, self.ch.put),
            (self.c.c, self.ch.get)
        )

    t = Top()

    asyncio.run(t.p._send())
{% endhighlight %}

This is a simple producer-consumer model. The producer and consumer 
communicate via a channel, and the testbench is responsible for activating
the producer. As a side-note, a comparable case in SystemC is roughly twice
as many lines of code, so there are already some measurable efficiencies.

Staying inside Python early in the model-development process is attractive 
due to the fast turnaround time and access to existing Python libraries. 
Any Zuspec model can be run directly in Python and can access all Python 
language and library features. 

If you look closely at the description above, you might find yourself 
wondering how it executes. For example, how are ports connected? This is 
where some of the 'declarative' aspects of this description come into play.
Despite the description looking and behaving like a class library, there is
still some "magic" behind the scenes. In the case of port connections, the
Zuspec library takes the user's bind specification and determines how to
properly connect ports and channels. And, of course, there are many other
cases where Zuspec allows the user to specify *what* is desired and have
the library determine *how* that intent is implemented.

# Beyond Pure Python

There are quite a few projects that seek to translate Python to a more-performant
implementation. Python ahead-of-time (AOT) compilers typically work with a Python
script (and it dependent libraries) as a whole. Zuspec looks at the world 
differently. 

## Identifying the Model Boundary
Zuspec uses types defined in zuspec.dataclasses to identify the boundary of
a model. For example, in the example above, the 'Top' class defines such
a boundary. Tools that map a Zuspec description to a non-Python implementation
operate on such boundaries.

<p align="center">
<img src="{{ '/imgs/2026/01/zuspec_diagram_2.png' | absolute_url }}"/>
</p>

{% comment %}
<div class="mermaid">
graph TD
    A["User Code(zuspec.dataclasses)"] --> B{"Target"}
    B -->|Pure Python| C["Executable Python"]
    B -->|Retargetable| D["Intermediate Representation (IR)"]
    D --> E["Transform & Manipulate"]
    E --> Ep["Implement"]
    Ep --> F["SystemVerilog Behavioral Model"]
    Ep --> G["SystemVerilog RTL"]
    Ep --> H["Fast C/C++ Model"]
    Ep --> I["Static/Formal Model"]
    
    style A fill:#5dade2,stroke:#333,stroke-width:2px,color:#000
    style C fill:#58d68d,stroke:#333,stroke-width:2px,color:#000
    style D fill:#f39c12,stroke:#333,stroke-width:2px,color:#000
    style E fill:#f39c12,stroke:#333,stroke-width:2px,color:#000
    style F fill:#bb8fce,stroke:#333,stroke-width:2px,color:#000
    style G fill:#bb8fce,stroke:#333,stroke-width:2px,color:#000
    style H fill:#bb8fce,stroke:#333,stroke-width:2px,color:#000
    style I fill:#bb8fce,stroke:#333,stroke-width:2px,color:#000
</div>
{% endcomment %}

## Pure Python vs Retargetable

The other place where Zuspec is a bit different is in defining 'Profiles'
for content. This has significant similarities to the SystemVerilog "synthesizable" 
subset. The first choice is whether a model is *Retargetable* or not. 
*Retargetable* models can be mapped to non-Python implementations.  

In order to be *retargetable*, a model can only contain elements of Zuspec-recognized
types. The 'Top' class above matches this criteria. That said, as long as running 
in Python is sufficient, a Zuspec model is free to use any Python construct.

Checking *Profile* compliance is another place where the Python ecosystem helps.
Zuspec implements a plug-in to the [flake8](https://flake8.pycqa.org/en/latest/) 
linter that allows Zuspec to check profile compliance along with other Python
rules that flake8 checks. This allows Zuspec-specific checks to be performed
on-the-fly as code is developed, providing much faster feedback to the developer 
(or LLM, as is often the case today).

The diagram above shows several options for how a *Retargetable* Zuspec model 
might be implemented. Several of these targets, such as SystemVerilog RTL,
have their own *Profile* that further restricts available features.

# Conclusions and Next Steps
Zuspec is showing early promise in simplifying hardware model creation, and allowing
those models to be reused and retargeted to a variety of environments. Next time,
we'll look at modeling abstraction-level methodology, and how this helps humans (and LLMs)
to more-effectively discuss and implement the hardware models they care about.

## References
- [Zuspec: Pythonic Model-Driven Hardware Development](https://bitsbytesgates.com/zuspec/2025/09/22/Zuspec_PythonicModelDrivenHardwareDevelopment.html)



