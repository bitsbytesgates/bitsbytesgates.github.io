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
Standards have a key role in creating and sustanining ecosystems across
many industries -- just think about PCIe, Ethernet, and SystemVerilog. I'm 
most familiar with Electronic Design Automation (EDA) standards, but the 
general principles translate across industries. 

My first contact with the wonderful world of standards development was with the 
SystemC TLM 2.0 standard back in the mid 2000s. At the time, I was a software
developer working on a virtual prototyping tool, and was told to get involved
with the standard to help influence it in a direction that would fit with 
the product we had, as well as keep track of where the standandard was going
to ensure that we could implement it at some point.

At the time, I found the development process equal parts intriguing and completely 
baffling. This was nothing like the software development process I was used 
to. That said, I really enjoyed periodically meeting with a group of very 
bright people that were all passionate about some of the same topics that I was.
Due to a re-org, I was reassigned before the TLM 2.0 standard was released. 
By that point, though, I knew that I wanted to be more-deeply involved in 
standards development in the future.

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
coverage-driven verification was well-established as the dominant way of 
verifying IP- and IP subsystem-level designs. SystemVerilog was great as
long as you were *simulating* your design and testbench using a 
Hardware-Description Language (HDL) simulator. UVM became less appropriate
the further your environment was from this ideal. For example, UVM was 
still reasonably appropriate when a hardware emulator was used to 
accelerate execution of just the design. By the time both the test and 
the design were running on early silicon, UVM was completely inappropriate.

The traditional approach, of course, is to create and re-create test content
that is appropriate for each environment. At minimum, this is inefficient.
At worst, it can introduce delays into schedules and result in bugs as
the way a design is exercised diverges across different environments.

Verification engineers saw value in solving this problem, and several EDA 
tools were available in the market that provided solutions for capturing
and test content such that it could be easily reused across platforms.
There were two big challenges:
- While there were commonalities in the way the tools viewed the world
  and captured test content, there were also significant differences.
- Each tool's input format was a proprietary language

The result was that users of one tool couldn't reuse the test content
that had created with another tool. In addition, they needed to 
be careful in sharing that test content. Legal agreements often
restrict the sharing of content captured in a proprietary language
to protect the tool vendor's trade secrets. 
In both cases, lack of a standard way of capturing reusable test
content limited the growth of a promising 


## PSS 1.0 -- Establishing a Baseline
Accellera is an organization that supports the development of EDA 
standards. In early 2014, several user and vendor companies proposed 
that Accellera support development of a standard for creating 
cross-platform reusable test content. 

It might seem surprising, but the logical first step in developing a
programming language standard is to determine whether there is sufficient
interest from vendors and users to justify its existence. This 
exercise took about a year and concluded that there was, in fact, 
sufficient industry interest.

The next step was to get everyone aligned. As I mentioned, several 
commerical tools already existed around the industry that, while
aligned in many ways, all had their differences as well. As I 
noted before, language reference manuals (LRMs) are 'legal' documents --
much as requirements documents are. New language features will 
heavily lean on the text used to describe previous language features. 
In other words, it's well-worth taking the time to get things right.

The hard work of getting a solid foundation established for PSS
culminated in the 2018 release of PSS 1.0. This version of the 
language was missing many features that the working group could
see would be needed to do real work. But, it established a solid
base of features on which we could build going forward.

## PSS 2.0 -- Environment-Integration Features

I tend to divide language features into three categories:
- Major new capabilities
- Substantial enhancements to an existing capability
- Incremental refinements to an existing capability

During early development of a language, many features fall in the first 
category. Over time, more features natually fall into the later two.

True to form, PSS 2.0 added significant new capabilities in the first
category, with an emphasis on features to help connect high-level
PSS test scenarios to the environment in which those tests run. 
A selection of new PSS 2.0 features includes:

- A C-like procedural language
- Templated data types
- Facilities for modeling memory acquisition and lifetime for memory used by tests
- A register model to enable test behavior to directly-access device registers
- Facilities to model how multi-core scenarios are distributed across multiple cores

While PSS 1.0 was critical in establishing the fundamentals of the PSS 
language, it was missing enough critical features that it was difficult 
to do production work with the language at that point. That could no longer
be said about PSS 2.0. 

That didn't mean that PSS was done, though. Far from it.

## PSS 2.1 
Standards development is an interesting exercise of meeting today's needs
while looking over the horizon just a bit. Developing features -- especially
if they're somewhat novel -- can take a bit of time. A critical feature in
any verification language is the ability to capture coverage metrics. PSS
has had support for collecting data-centric (ie like SystemVerilog) metrics 
from 1.0, but something more was needed to capture metrics about scenario
execution. This turned out to be a major undertaking -- perhaps even a 
bit more than some of us realized. In the meantime, a slate of
very useful other features had been developed that would simplify the 
life of PSS test authors.

So, in late 2023, we released PSS 2.1 with features such as:
- A new standard library with messaging and logging functions
- Built-in methods for doing read-modify-write (masked write) operations on registers
- Support for floating-point data types


## PSS 3.0 -- Behavioral Coverage
Measurement and analysis is critical in verification. In SystemVerilog, we 
have the SystemVerilog Assertion (SVA) subset of the language that allows 
us to reason about behaviors and conditions within the RTL. SVA allows
us to capture the critical required aspects of key behaviors and events,
while also identifying what is not part of those critical behaviors. 

As a verification language, PSS has similar requirements to identify
key required aspects of behaviors. Of course, PSS isn't operating 
at the signal level. It is operating at the *action* level, so 
SVA doesn't directly apply in its unmodified form. However, we 
need something with many similar characteristics that matches
the abstraction level of PSS.

PSS 3.0 tackles this requirement by defining language features
to reason about action execution and the relationships 
between executing actions. I see this as providing
"SystemVerilog Assertions at the transaction level". 

PSS 3.0 defines this new language for reasoning about action
execution and relationships for collecting coverage metrics. However,
there are clearly more applications that we can look forward to 
in the future.


# Present
So, where does that leave us? Today, the PSS language supports the features
required for creating and reusing test content across a wide variety of 
verification and validation environments. 

# Future
Looking toward the future of PSS, there are three core areas that I'm paying
attention to.
- **Growing, Evolving Language** -- I want to see the language grow and improve
- **Growing Ecosystem** -- I want to see more people learn PSS, use PSS, and to have some of them share some of what they've created
- **New PSS Applications** -- I want to see the exploration and emergence of new ways to use PSS 

## Growing, Evolving Language
Looking across the programming-language landscape, many of the most-successful 
languages are ones that grow and improve over time. I suspect this is a causal
relationship. Communities and ecosystems grow around programming languages 
that grow and adapt along with their communities.  New features help to keep 
the community engaged, as well as helping to extend the capabilities of the 
language and/or simplify how a given usecase is captured in the language. 

## Growing Ecosystem of PSS-Knowledgeable Users and Collateral
There is clear evidence that PSS adoption is growing. Look at vendor-published 
success stores, look at conference papers, even look at LinkedIn, and you will
see mentions of PSS. 

There's clearly room to grow here, though.  I'd like to see more reusable 
open-source libraries of PSS content. And, I would love to see more people 
generally learning about PSS. 


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


I've been fortunate to have been a part of the PSS journey, and look forward to being 
an active part of its future.  PSS is currently ready to deploy, and offers specific 
features tailored to applications that require test-content reuse and cross-platform 
portability. In the coming posts, we'll look at some emerging options to enable learning 
and exploration of PSS.

# References
- Accellera - https://accellera.org
- PSS Tutorial Video - https://www.accellera.org/resources/videos/portable-stimulus-tutorial-2024
- PSS LRM - https://www.accellera.org/downloads/standards/portable-stimulus
- https://www.analog.com/en/resources/technical-articles/product-life-cycle-of-an-interconnect-bus.html
