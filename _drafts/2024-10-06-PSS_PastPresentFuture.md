---
layout: post
title:  "PSS: Past, Present, Future"
date: 2024-10-06
categories: PSS
excerpt_separator: <!--more-->
mermaid: true
---

- PSS 3.0 was released just about a month ago. 
- It's been just a hair over 10 years since we started this journey, and 
that has been causing to reflect a bit on the path to where we are today
with the language, where it is that we are, and where I'd like to 
see the language go over the next decade. 

<!--more-->

# A Word on Standards Development
My first contact with the wonderful world of standards development was with the 
SystemC TLM 2.0 standard back in the mid 2000s. At the time, I was a software
developer working on a virtual prototyping tool, and was told to get involved
with the standard to help influence it in a direction that would fit with 
the product we had, as well as keep track of where the standandard was going
to ensure that we could implement it at some point.

At the time, I found the development process a mix of intriguing and completely 
baffling. This was nothing like the software development process I was used 
to. That said, this was a group composed of a lot of really bright people 
that got together every week to discuss a topic that they were clearly 
passionate and knowledgeable about. This definitely seemed interesting. 
While I was reassigned, due to a re-org, before the TLM 2.0
standard was complete, I already knew that I wanted to be involved
with standards development in the future.

# PSS - 1.0-3.0

<div class="mermaid" align="center">
gantt
    title PSS Development
    dateFormat YYYY-MM
    PSPWG           :2014-05,2014-12
    PSS 1.0         :2015-01,2018-06
    PSS 2.0         :2018-07,2021-04
    PSS 2.1         :2021-05,2023-10
    PSS 3.0         :2021-05,2024-08
</div>

That opportunity came in 2014. Around that time, UVM, constrained-random,
coverage-driven verification was well-established as the dominant way to 
verify IP- and IP subsystem-level designs. SystemVerilog was great as
long as you were *simulating* your design and testbench using a 
Hardware-Description Language (HDL) simulator. UVM became less appropriate
the further your environment was from this ideal. For example, UVM was 
still reasonably appropriate when a hardware emulator was used to 
accelerate just the design. By the time both the test and the design
were running on early silicon, UVM was completely inappropriate.

The traditional approach, of course, is to create and re-create test content
that is appropriate for each environment. At minimum, this is inefficient.
At worst, it can introduce delays into schedules and result in bugs as
the way a design is exercised diverges across different environments.

Verification engineers saw value in solving this problem, and several EDA 
tools were available in the market that provided solutions. There were
two big challenges:
- While there were commonalities in the way the tools viewed the world
  and captured test content, there were also significant differences.
- Each tool's input format was a proprietary language

The result was that users of one tool could reuse the test content
that had created with another tool. In addition, they needed to 
be careful in sharing that test content. Legal agreements often
restrict the sharing of content captured in a proprietary language
to protect trade secrets. 
In both cases, lack of a standard way of capturing reusable test
content severely limited growth of 


## PSS 1.0 -- Establishing a Baseline

- Get a plug in for Action-Relation-Level modeling?

## PSS 2.0 -- Environment-Integration Features

## PSS 2.1 -- Convenience Features

## PSS 3.0 -- Behavioral Coverage


# Present
So, where does that leave us? Today, the PSS language supports the features
required for creating and reusing test content across a wide variety of 
verification and validation environments. 

- PSS 3.0



# Future
Looking toward the future of PSS, there are three core areas that I'm paying
attention to.
- **Growing, Evolving Language** -- I want to see the language grow and improve
- **Growing Ecosystem** -- I want to see more people learn PSS, use PSS, and share some of what they've created
- **New PSS Applications** -- I want to see the exploration and emergence of new ways to use PSS

## Growing, Evolving Language
Looking across the programming-language landscape, many of the most-successful 
languages are ones that grow and improve over time. I suspect this is a causal
relationship. Communities and ecosystems grow around programming languages. 
New features help to keep the community engaged, as well as helping to extend
the capabilities of the language and/or simplify how a given usecase is 
captured in the language. 




minimum, new features 


- A language like PSS is tightly intertwined with the environment in which its users work
- Silicon engineering is a fast-moving discipline, with new challenges emerging frequently.
- Natural to expect PSS to grow and adapt to those emerging challenges
- Like to steal a page from the playbook of language, such as Python, that are always looking
  for ways to simplify life for users. If a new language feature helps to convey intent in
  half the lines that we would use now, let's do that. In addition to boosting productivity,
  smaller bodies of code are easier to maintain and have fewer lurking bugs. 
- Generative AI is the new kid on the block. It's already changing the way that we create
  software. While it's not clear how it will impact the way that we crete tests, I can
  guarantee that it will change it. 
  We shouldn't just be asking how generative AI will change the way that we use programming
  languages. We should also be asking how our programming languages should change to 
  better-leverage generative AI. 

  The interesting thing about generative AI is that it
  won't just change how we work with existing programming languages. It is highly likely 
  to change the character of those languages as well. 


## Growing Ecosystem of PSS-Knowledgeable Users and Collateral
- Adoption of PSS is growing -- success stories at verification conferences and vendor events
- Would like to see more university students learning about PSS. 
- Would like to see more reusable collateral (libraries, utilities, etc) available 


## Exploration of New PSS Applications
- Know that PSS is productively applied to testing
- The test space is huge, and current application of PSS really only scratches the surface 
  of the full set of possibilities in terms of how tests are created and their capabilities.
  Lots of opportunity here to explore how PSS description maps to a test implementation.
- In addition, some of the very things that make PSS attractive for modeling tests 
  also potentially make it attractive for other types of modeling as well.
  - Early architectural and behavioral modeling
    - Static/Statistical analysis
    - Executable
  - Possibly, even design

Close with something like: I've been fortunate to have been a part of the PSS journey,
and look forward to being a part of its future. 
PSS is currently ready to deploy, and offers specific features tailored to applications
that require test-content reuse and cross-platform portability. In the coming posts, we'll 
look at some emerging options to enable learning and exploration of PSS.

# References
- PSS Tutorial Video - https://www.accellera.org/resources/videos/portable-stimulus-tutorial-2024
- PSS LRM - https://www.accellera.org/downloads/standards/portable-stimulus
- https://www.analog.com/en/resources/technical-articles/product-life-cycle-of-an-interconnect-bus.html
