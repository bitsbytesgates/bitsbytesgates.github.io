---
layout: post
title:  "AI: Instigating a Developer Docs Renaissance?"
date: 2025-08-30
categories: AI
excerpt_separator: <!--more-->
mermaid: true
---

There's been lots of discussion about the future of writing in the AI age.
LLMs have shown their potential as a tool by helping authors of many genres 
brainstorm ideas, rough out content, and more. But, this automation comes
with questions attached. If writing can be automated, 
what is the writer's role? If LLMs only deliver the illusion of
producing useful content, are we about to experience a deluge of 
unintelligible [slop](https://simonwillison.net/2024/May/8/slop/) 
masquerading as useful documentation? I've done my share of 
hand wringing while reviewing AI-created code commands and documentation 
that had the form of useful information, but little insightful content. 
A recent coding experience has me seeing an opportunity for a 
developer-docs renaissance driven by the needs of LLMs.

<!-- more -->

# Developer Docs and why we don't create them

I define developer docs as the set of documentation that helps a
developer navigate a technical project and understand things like:
- How to build the project from source
- How to run tests on the project
- Basic structure and architecture of the project
- Examples of how to interact with the API
- Any special structures used by the project

Notes like this have several possible audiences
- Colleagues
- Open source project: potential contributors
- Future you

I suspect most of us agree that this information is useful,
and don't truly feel that our code is self-documenting. 
But, it always seems difficult to devote time to writing good 
developer documentation. Why? I think it's because, 
no matter the audience, developer docs are for the future -- 
a future colleague, future collaborator, or future you. And
it's always tempting to prioritize the 'now' when it comes
to choosing between 'now' and 'future'.

LLMs shift that equation by making developer docs immediately 
actionable, and I'm optimistic that this may actually shift 
our behavior.

# Working with Complex Projects

I was recently working on one of my open source projects. The structure
is a bit complicated due to some of the requirements. Specifically,
I have library projects that consist of:
- C++ API consisting of pure-virtual interface classes
- Core implementation in C++
- A Cython wrapper API implemented in terms of the pure-virtual interface classes

This structure enables the libraries to be used effiently from C++ and Python,
and allows the library native code to interact directly whether called from
C++ or Python. The downside, of course, is that adding a new class or method
involves changes across several source locations: C++ interface, C++ implementation,
and several locations across the Python interface.

I've been using AI assistants (Cline, Copilot) to make modifications to 
this codebase with varying success. On one hand, the results were quite
good given that the only data it had was the code. On the other hand,
there were many cases where the model (gpt-4.1 in this case) would only 
perform a subset of the required changes. In one case, it decided to 
create a new Cython extension file entirely.

# Developer Docs as LLM Instructions

I had independently started to write down some notes about the structure 
of this code. You can find the notes [here](https://github.com/zuspec/zuspec-dev-docs/blob/main/docs/python_ext_structure.md)
if you're interested. Not too complicated, and much more needed of course.

But, when I included this as context for the LLM, the results from the AI assistant
improved dramatically. Still not perfect, but sufficiently better that
I feel more motivated to start a task by writing out some notes. Because,
after all, these notes will be immediately useful as I start working on
the implementation.


# Looking Forward

Writing developer docs and writing code is too-often seen as a zero-sum game:
I can write code *or* I can write developer documentation. LLMs change this 
by blurring the line between writing docs and code. Writing docs, in fact,
may provide greater leverage by allowing you to drive automation of the 
more-tedious aspects of writing code directly from developer docs.

Looking forward, I'm very interested in what standardization emerges around
capturing and curating context documentation intended for LLMs. Specifically,
I'm watching [Agents.md](https://agents.md/) and [llms.txt](https://llmstxt.org/). 

Even more immediately, I'm revisiting how I build out the Zuspec Python-embedded
language. I'm planning to take a documentation-first approach, and am interested
to evaluate the impact this has on the development process itself and my ability
to leverage AI assistants along the way.



.
