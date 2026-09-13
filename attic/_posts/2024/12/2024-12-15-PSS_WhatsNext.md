---
layout: post
title:  "What's Next for PSS?"
date: 2024-12-15
categories: PSS
excerpt_separator: <!--more-->
mermaid: true
---

<p align="center">
<img src="{{ '/imgs/2024/12/PSSFuture_splash.png' | absolute_url }}"/> 
</p>

As the year winds down, it's a good time to think about the coming year and the
areas where I'd like to have an impact. One area of particular
interest this year is the Portable Test and Stimulus (PSS) standard. The Accellera 
PSS working group released the 3.0 version of the PSS LRM in August, and I've felt
fortunate to have been involved with PSS Working Group (PSWG) from its inception,
and to see how the growing body of features in PSS have allowed the language to 
enable test-content portability across simulation, emulation, and post-silicon
targets. 

The release of PSS 3.0 also provides an opportunity to step back and consider 
the future of PSS -- not just incremental additions to its current field of use,
but also how its use could expand to other portions of the design and verification process.

<!--more-->

Today, the PSS language provides powerful features for capturing test 
scenarios. It's particularly adept at capturing IP programming sequences
that are reusable from IP to system level. 


<div class="mermaid" align="center">
block-beta
columns 1
  block:Areas
    A["Arch"]
    B["Sw Models"]
    C["Impl (RTL)"]
    D["DV (Sim)"]
    E["DV (Emu)"]
    F["Prototying"]
    G["Si Bring-Up"]
    H["Si Validation"]
  end
</div>

Currently, the use of PSS centers around DV, prototyping, and silicon
bring-up. PSS has plenty of room in which to expand adoption in 
these areas, but there are also many others areas where PSS 
could play and add value.

Looking forward, there are three key areas where I'm looking to see growth
in the PSS language and ecosystem:

## Develop PSS Core Language

An evolving language is critical to maintaining interest and users. 
Needs, styles, and approaches change over time, and a programming
language must react to these changes in requirement in order to remain
relevant. My informal observation is that, since the mid-2010s, more 
programming languages are shortening the interval between updates
to the language. I'm happy to see the PSS language continuing to
grow and evolve in the context of the Accelera PSWG.


## Grow PSS Ecosystem

Ecosystems are key to the success of any programming language. Having a 
vibrant ecosystem means that users of a language will have access to 
code snippets, expertise, and reusable libraries created by other users
of the language. Vibrant ecosystems also act as a pipeline, getting 
students interested in and familiar with the language. 

I'd also like to see more publicly-available examples and libraries. 
Having real live code out there to play with is a critical part of
learning a new technology. 

## Exploration of New Applications

New applications and integrations is the area in which I most like to play.
Each phase of the design process shown above has its own unique 
requirements that it places -- most often on *how* the language is 
processed, but sometimes on the features provided by the language itself
as well.

There are key differences in test requirements across the different platforms
shown in the diagram above, and worth exploring how that impacts how 
tests are implemented. But, in addition, there might be some other interesting
roles for PSS across the process. Could we use PSS, for example, to implement
an architectural model of the design?

# Thinking Forward
Given these three areas, it's reasonable to ask how we can "move the needle" 
in each of them. To a certain extent, continued evolution of the core
language might have the simplest answer since there's a well-established 
group (the Accellera PSWG) with members from across the industry that meet 
weekly to discuss that topic.

Advancing the other two areas poses a technology-access challenge. It's 
fine to speculate on how PSS might contribute to the design process, 
for example. However, I'd argue that what most people really want to see
are implementations (proof-of-concept or production) that deliver 
concrete results.

The same holds for building knowledge of PSS. It's fine to read descriptions
about how PSS works and how to use it to create test scenarios. Real learning
takes places when people are able to work with the language themselves and
internalize the key concepts of the language.


## PSS and Open Source
Open source software has been a powerful enabler of exploration in other ecosystems. 
Having open source resources encourages people to learn about a technology. 
It also provides a basis for experimentation that doesn't require an interested
party to start at zero.

## Zuspec
Starting in 2025, I'll be starting to write more about components within the 
*Zuspec* umbrella project. Consequently, it's worth providing a brief 
introduction to what *Zuspec* is, what it's not, and what to expect.

Zuspec is a collection of functionality for working with the style of
action-centric dataflow descriptions used by the PSS language. The
philosophy of the component libraries is to keep things as modular as
possible to maximize the reuse opportunities even as we discover different
ways in which to productively use and apply these descriptions.

<p align="center">
<img src="{{ '/imgs/2024/12/Zuspec_crop.png' | absolute_url }}" style="width: 200px"/>
</p>

The *Zuspec* name is a portmanteau of zusammen (German for together) and 'spec',
and reflects my ambition for PSS to be a specification that brings together
disciplines such as design and verification that are quite separate today.

From a technical perspective, the vast majority of Zuspec components are 
implemented as C++ libraries (for speed) that also have Python bindings, 
making it easy to use a small amount of Python to mix them together 
into an application.

<p align="center">
<img src="{{ '/imgs/2024/12/ZuspecProjectMap.png' | absolute_url }}" style="width: 800px"/>
</p>

Zuspec is much more of a technology framework than a tool today. You won't find
any fancy GUIs. And, it's in an early state of development and testing: 
you should expect to find bugs. That said, my hope is that if these 
components can help me to explore new areas of PSS application they can
enable others to do the same. Starting in the new year, I'll be writing
more about the components and what they allow us to do with a 
PSS-based description

# PSS Looking Forward

I continue to see PSS as having a bright future. It's providing strong value
in the areas of test-content reuse, with a focus on simulation, emulation, 
and silicon bring-up. And, as more people learn about PSS and get 
hands-on experience with the language and its capabilities, I'm confident 
that adoption will continue to grow. I also see great possibilities for the 
language to expand its application space into domains adjacent to where it 
is applied today. 

In the coming year, I'm looking forward to writing more about what PSS 
enables today, and what it could enable in the future. And, of course,
expect to hear more about other tools and technologies related to design
and verification. There is always something new to learn and explore!


# References
- Accellera - https://accellera.org
- PSS Tutorial Video - https://www.accellera.org/resources/videos/portable-stimulus-tutorial-2024
- PSS LRM - https://www.accellera.org/downloads/standards/portable-stimulus
