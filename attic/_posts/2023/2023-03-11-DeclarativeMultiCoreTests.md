---
layout: post
title: "Declarative Programming and Multi-Core Tests"
date: 2023-03-11
categories: PSS
series: "Intro to PSS"
mermaid: true
excerpt_separator: <!--more-->
---
<p align="center">
<img src="{{ '/imgs/2023/03/PSSMultiCoreTests_splash.png' | absolute_url }}"/> 
</p>

As humans, we often pride ourselves on our ability to multi-task. Not 
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
parallel and, especially, multi-core programming. I think there's actually 
a connection between this and the challenges our brain has in multi-tasking. 
With a sequential program, I can reason step-by-step as to what happens. 
I can do the same for some portions of a parallel program. But, whenever 
the parallel threads interact, I need to reason about their possible 
relationships at that point in time. What happens
under each possible ordering of threads reaching the synchronization point? 
It's this last point that, I think, really stresses our multi-tasking ability.
Not only do we need to envision what is happening in the context of one
thread, but need to simultaneously envision the set of possible actions the
other threads may be taking.

<!--more-->

## Specific Bare-Metal Multi-Core Test Challenges

Creating bare-metal, multi-core tests poses challenges beyond just the core
challenges of managing parallel behavior described above. Keep in mind that,
because we don't have an OS to manage the processor cores, our test will 
need to be partitioned into per-core test programs that synchronize with
each other.

<div class="mermaid" align="center">
graph TD;
    A[Core0\nWrite]-->B[Core1\nCopy];
    B-->C[Core0\nCheck];
</div>

The diagram above shows the test flow of a bring-up test that, on the surface,
is quite simple:
- Write some memory from Core0
- Read that memory from Core1, and write some data elsewhere (copy)
- Read the memory written by Core1 from Core0 and check that it's correct

From this simple test flow, we will need to create two core-specific tests that
coordinate to achieve the desired activity. The diagram below shows what 
our test core-specific tests need to do:

<div class="mermaid" align="center">
flowchart TB
    c01-. notify .->c10
    c11-. notify .->c02
    subgraph Core1
    c1s[["Core1 Start"]]
    c1s-->c10
    c10(["Wait: Core0::Write"])
    c10-->d
    d[Core1\nCopy]
    d-->c11
    c11(["Notify: Copy Complete"])
    c11-->c1e
    c1e[["Core1 End"]]
    end
    subgraph Core0
    c0s[["Core0 Start"]]
    c0s-->a
    a[Core0\nWrite]
    a-->c01
    c01(["Notify: Write Complete"])
    c01-->c02
    c02(["Wait: Core1::Copy Complete"])
    c02-->e
    e[Core0\nCheck]
    e-->c0e
    c0e[["Core0 End"]]
    end
</div>

- Core 0
    - Wakes up and writes to the specified memory location
    - Notifies Core 1 that the write is complete
    - Waits for Core 1 to notify that the read/write is complete
    - Read the data from the specified location

- Core 1
    - Wakes up and waits for Core 0 to write to the specified memory location
    - Reads the specified location and writes to another
    - Notifies Core 0

In this case, we are working with three operations distributed across two 
cores. As we introduce more behaviors spread across more processor cores,
the individual tests only become more complex.

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

The PSS `modeling layer` that we looked at in the last post is heavily 
constraint-based, exposing the declarative programming basis for that portion 
of the language. We also see the declarative
basis in how PSS approaches implementing multi-core test programs by focusing
the test writer on capturing the desired `intent` of the test with respect to
parallel execution rather than capturing the implementation of synchronization
across threads.

As we see more of the PSS language and its applications, the implications and
results of PSS having a declarative `modeling layer` will become clearer. For 
now, focus on two things:
- We need to think in relationships and rules instead of computation steps. 
- We can focus much more on what we *want* to happen in our tests instead of
  on *how* we're going to get our tests to do that.

When it comes to our multi-core test, this means that we are free to focus
on what interesting patterns of memory access we want to form, and leave 
the task of creating self-synchronizing per-core test programs to our
PSS tool.

## PSS and the Multi-Core Memory Test

Let's revisit our multi-core memory test -- this time showing the PSS 
approach. First, a warning. We're pretty early in looking through all the 
constructs supported by the PSS language, so don't worry if you don't 
recognize or understand the details of every language construct. 

<div class="mermaid" align="center">
graph TD;
    A[Core0\nWrite]-->B[Core1\nCopy];
    B-->C[Core0\nCheck];
</div>


### Modeling the Leaf-Level Actions

First, let's create Write, Copy, and Check actions. Let's keep our data
generation and checking simple by using an incrementing data pattern.

```pss
component memtest_c {
    addr_handle_t       base_addr;

    action Write {
        rand executor_claim_s<core_s> core;
        rand bit[64] in [0..0xFFFFFF] offset;
        rand bit[32] in [1..256]      words;

        exec body {
            repeat (i : words) {
                write32(
                    make_handle_from_handle(comp.base_addr, 4*(offset+i)), 
                    i+1);
            }
        }
    }

    // ...
}
```

Okay, what do we have going on here? First off, let's talk about two new
data types: addr_handle_t and executor_claim. PSS defines the addr_handle_t
type to represent an abstract reference to memory on the target system. 
You can think of this as a sort of pointer if you're a C programmer. Unlike
in C, though, we don't directly manipulate an addr_handle_t variable. 

PSS defines the _executor_claim_s_ type to allow an action to specify 
on which core it runs. The term _executor_ encompasses both processor
cores and elements of the testbench that execute behavior. As a user, we need
to be able to direct actions to run on specific cores using relevant 
characteristics of the cores. The executor _claim_ data structure is
templated with a data type that allows us to specify that relevant data.

Finally, we have two random variables to specify a offset and size for 
the write, and an exec block that specifies the behavior to run
when the action executes. In this case, call the _write32_ PSS 
built-in method to write an incrementing value to a memory location.


```pss
component memtest_c {
    // ...

    action Copy {
        rand executor_claim_s<core_s> core;
        rand bit[64] in [0..0xFFFFFF] src;
        rand bit[64] in [0..0xFFFFFF] dst;
        rand bit[32] in [1..256]      words;

        exec body {
            bit[32] tmp;
            repeat (i : words) {
                tmp = read32(
                    make_handle_from_handle(comp.base_addr,     
                        4*(src+i)));
                write32(
                    make_handle_from_handle(comp.base_addr, 
                        4*(dst+i)), 
                    tmp);
            }
        }
    }

    // ...
}
```

Okay, many familiar things with the Copy action. Here, we're also selecting
a core to run on (`core`) and have a random `src` and `dst` offset that 
point to different areas in memory.

In this case, our `exec body` block reads from the source area and writes
to the destination area.


```pss
component memtest_c {

    // ...

    action Check {
        rand executor_claim_s<core_s> core;
        rand bit[64] in [0..0xFFFFFF] offset;
        rand bit[32] in [1..256]      words;

        exec body {
            bit[32] tmp;
            repeat (i : words) {
                tmp = read32(
                    make_handle_from_handle(comp.base_addr, 
                        4*(offset+i)));
                if (tmp != i+1) {
                    error("0x%08x: expect %d ; receive %d", 
                        4*(offset+i), i+1, tmp);
                }
            }
        }
    }

    // ...
}
```

Finally, our _Check_ action reads back words from a region of memory and expects
to find an incrementing pattern of data. 

### A Convenience Action
In order to perform a write, copy, check operation with these three actions, we
need to ensure that some relationships hold. Let's create a convenience action
where we can place those constraints.

As a side note, PSS provides much richer mechanisms for managing memory and
coordination between actions. But let's keep things simple for now.


```pss
component memtest_c {

    // ...

    action WriteCopyCheck {
        Write             write;
        Copy              copy;
        Check             check;

        activity {
            write;
            copy;
            check;
        }

        constraint {
            // Copy reads from same location that Write populated
            copy.src == write.offset; 
            // Check reads from the same location that Copy populated
            copy.dst == check.offset;
            // All actions write the same number of words
            copy.words == write.words;
            copy.words == check.words;

            // Ensure that src/dst regions do not overlap
            (copy.src+(4*copy.words) < copy.dst) ||
            (copy.src > copy.dst+(4*copy.words));
        }
    }

    // ...
}
```

Our `WriteCopyCheck` action provides us a simple and reusable 
write/copy/check operation that we can use and customize without
worrying about the constraints inside.

### Modeling the Cores and Memory

Let's come back to how we describe cores. The leaf-level actions use a data
structure named `core_s` to describe information about the processor cores.
We can choose to put any type of data in this data structure to describe
key attributes about the processor cores in our system. For now, let's 
just give each core a numeric ID.

```pss
struct core_s : executor_trait_s {
    rand bit[8]     id;
}
```

PSS defines two built-in component types to represent an individual executor
and a group of executors. Assuming we have 4 cores, let's define a 
corresponding set of executors and group them.

```pss
struct core_s : executor_trait_s {
    rand bit[8]     id;
}

component pss_top {
    executor_c<core_s>         core[4];
    executor_group_c<core_s>   cores;
    transparent_addr_space_c<> aspace;
    memtest_c                  memtest;

    exec init {
        foreach (core[i]) {
            core[i].trait.id = i;
            cores.add_executor(core[i]);
        }

        // Define a memory region
        transparent_addr_region_s<> region;
        region.addr = 0x8000_0000;
        region.size = 0x1000_0000;
        memtest.base_addr = aspace.add_region(region);
    }
}
```

In the snippet above, we've declared an executor for each core and specified 
its unique `id`. Each individual core is added to the `cores` group of 
executors. As you might guess, this entire scheme is designed to handle 
much more complex associations of cores and groups of cores.

We also declare an address space that contains a region of memory. The memory
region starts at 0x8000_0000 and is 0x1000_0000 in size. The `add_region` 
call shown in the exec block returns an address handle, which we assign
to the `base_addr` field in the memtest component. Our Write/Copy/Check 
actions will be able to access the memory region via this handle.


### Creating Tests

Let's start by writing a test that is identical to the test flowchart that
we've been looking at:

<div class="mermaid" align="center">
graph TD;
    A[Core0\nWrite]-->B[Core1\nCopy];
    B-->C[Core0\nCheck];
</div>

```pss
component pss_top {
    // ...

    action Copy_0_1_0 {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id == 0;
                copy.core.trait.id == 1;
                check.core.trait.id == 0;
            }
        }
    }
}
```

Simply by adding a few extra constraints (rules) on top of our convenience
Write/Copy/Check action, we can achieve exactly the scenario of writing
data from Core 0, Copying it using Core 1, then checking the result from Core 0.
Notice that, in this case, the size of data being created and copied is random.

```pss
component pss_top {
    // ...

    action Copy_same_core {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id == copy.core.trait.id;
                copy.core.trait.id == check.core.trait.id;
            }
        }
    }
}
```

With a slightly different set of rules, we can say that we want the same core
to perform the write, copy, and check. The actual core (0..3) will be 
randomly selected

```pss
component pss_top {
    // ...

    action Copy_check_diff_core {
        activity {
            do memtest_c::WriteCopyCheck with {
                write.core.trait.id != check.core.trait.id;
            }
        }
    }
}
```

Changing the rules again, we can require the core writing data to be different
from the core checking data. The one copying data is left completely random.


## Conclusion
While the human mind may not lend itself to efficiently reasoning about concurrency,
automation can go a long way to simplifying the creation of multi-core tests. In this 
post, we've seen a few ways in which the declarative modeling approach that PSS defines
helps in focusing the user on capturing _what_ to test, and delegating the task of
making happen -- the _how_ -- to the PSS test-synthesis tool. This lets us quickly
change the rules of the test to focus in on specific scenarios -- how much data 
is being transferred, for example -- and the generated test follows. This results in 
a huge boost in test-creation productivity vs manually coding (or copy/paste/modifying)
individual tests.

If you have access to a PSS processing tool, please try out the example code
(link below). You should be able to observe the multi-core synchronization code 
that the PSS tool emits to explicitly schedule and synchronize behavior across
multiple processor cores.

In the next post, we'll start to learn about the features PSS provides to help 
actions communicate in a reusable and modular fashion.



### References
- [https://www.npr.org/2008/10/02/95256794/think-youre-multitasking-think-again](https://www.npr.org/2008/10/02/95256794/think-youre-multitasking-think-again)
- [https://en.wikipedia.org/wiki/Declarative_programming](https://en.wikipedia.org/wiki/Declarative_programming)
- [MemTest PSS Code (Viewing)]({{ 'code_html/2023/03/memtest.html' | absolute_url }})
- [MemTest PSS Code (Raw Text)]({{ 'code/2023/03/memtest.pss' | absolute_url }})