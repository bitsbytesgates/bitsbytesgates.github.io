---
layout: post
title: "Declarative Programming and Multi-Core Tests"
date: 2023-03-07
categories: PSS
series: "Intro to PSS"
mermaid: true
---

As modern humans, we often pride ourselves on our ability to multi-task. Not 
only can we participate in a meeting, we can we simultaneously prepare the 
slides for the next meeting. Sadly, science has some bad news about 
our perception to multitask vs our actual ability. In reality, like a 
single-core processor, our mind is rapidly context switching between tasks
to provide an illusion of simultaneous focus on multiple tasks. Re-establishing
sole focus on a task can take 20 minutes and, during that time, productivity 
suffers by as much as 40%. Suffice it to say that we're really working at 
half speed when constantly multitasking.

What does multi-tasking have to do with PSS and bare-metal test creation? Well,
there is another task that I've observed humans consistently find challenging:
parallel programming. I think there's actually a connection between this and
the challenges our brain has in multi-tasking. With a sequential program, I 
can reason step-by-step as to what happens. I can do the same for portions of 
a parallel program. But, whenever the parallel threads interact, I need to
reason about their possible relationships at that point in time. Which happens
under each possible ordering of threads reaching the synchronization point? 
It's this last point that, I think, really stresses our multi-tasking ability.
Not only do we need to envision what is happening in the context of one
thread, but need to simultaneously envision the set of possible actions the
other threads may be taking.

## Specific Bare-Metal Multi-Core Test Challenges

Creating bare-metal, multi-core tests poses challenges beyond just the core
challenges of managing parallel behavior described above. Keep in mind that,
because we don't have an OS to manage the processor cores, our test will 
need to be partitioned into per-core test programs that synchronize with
each other.

<div class="mermaid" align="center">
graph TD;
    A[Core0\nWrite]-->B[Core1\nRead/Write];
    B-->C[Core0\nRead];
</div>

The diagram above shows the test flow of a bring-up test that, on the surface,
is quite simple:
- Write some memory from Core0
- Read that memory from Core1, and write some data elsewhere
- Read the memory written by Core1 from Core0

<div class="mermaid" align="center">
flowchart TB
    a-. notify .->d
    d-. notify .->e
    subgraph Core1
    b[Core1\nIdle]-->d[Core1\nRead/Write]-->f[Core1\nIdle]
    end
    subgraph Core0
    a[Core0\nWrite]-->c[Core0\nIdle]-->e[Core0\nRead]
    end
</div>



## PSS and Declarative Descriptions

You may have heard PSS described as a _declarative language_ and wondered
what that really meant in practice. PSS being a declarative-first language
is very important in enabling some of the capabilities of PSS. That said,
the definition of 'declarative language' is a bit flexible.

> In computer science, declarative programming is a programming paradigm — a 
> style of building the structure and elements of computer programs — that 
> expresses the logic of a computation without describing its control flow. 

Put another way:
> Declarative programming is a non-imperative style of programming in which 
> programs describe their desired results without explicitly listing 
> commands or steps that must be performed.

The PSS `modeling layer` is heavily constraint-based, exposing the declarative
programming basis for that portion of the language. We also see the declarative
basis in how PSS approaches implementing multi-core test programs by focusing
the test writer on capturing the desired `intent` of the test with respect to
parallel execution rather than capturing the implementation of synchronization
across threads.




see declarative 

### References
- [https://www.npr.org/2008/10/02/95256794/think-youre-multitasking-think-again](https://www.npr.org/2008/10/02/95256794/think-youre-multitasking-think-again)
- [https://en.wikipedia.org/wiki/Declarative_programming](https://en.wikipedia.org/wiki/Declarative_programming)