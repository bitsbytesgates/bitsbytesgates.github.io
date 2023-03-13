---
layout: post
title: Automating Bare-Metal Tests with PSS
date: 2023-02-25
categories: PSS
series: "Intro to PSS"
---
<p align="center">
<img src="{{ '/imgs/2023/AutomatingBareMetalSoCTestsWithPSS_splash.png' | absolute_url }}"/> 
</p>
As a technologist, it's tempting to focus on what is new 
(at least, new to me) -- especially when choosing what to write about.
I'm periodically reminded that there is immense value in returning
to topics. Returning to a topic might raise awareness with a different
set of readers, but it's also highly likely that I'll learn something
new about the topic, or that my perspective on the topic will evolve 
in the process.

This post marks the beginning of just such a "back to basics" series
that focuses on the [Accellera Portable Test and Stimulus](https://www.accellera.org/downloads/standards/portable-stimulus) 
(PSS) language. PSS is a specification language for modeling behavior 
to test. It specifically focuses on providing features that help 
in creating bare-metal software-driven system-level tests. Consequently,
this 'Intro to PSS' series will focus on the task of the bare-metal
software-driven test writer, and the value PSS provides.

## Programming Languages Categories
When it comes to programming languages, there are two big 
categories: general-purpose programming languages and domain-specific
programming languages. General-purpose programming languages such
as C/C++, Java, Python, and Rust are designed to be able to 
implement any algorithm or behavior. The "any..." part comes 
with a caveat, of course: any algorithm or behavior given sufficient
expertise and time. 

There are classes of problems that have such
well-defined expert solutions that it's considered wasteful
to actually apply large amounts of expert-programmer 
resource to create a bespoke solution each time they arise. This is where 
domain-specific languages (DSL) come into play. A domain-specific language 
provides a way to capture a problem in a way that a domain expert finds 
familiar, along with enough information to enable a synthesis tool to 
produce an optimal implementation in a general-purpose language.


## Cases where DSLs shine
As you may have guessed, PSS is a domain-specific language. In this case,
one targeted at capturing system-level test behavior in terms 
familiar to a domain expert.
Let's take a look at another very popular application for domain-specific
languages to better understand the value and tradeoffs that they provide.

An excellent example of an application of domain-specific languages 
is building lexical analyzers (lexers) and parsers.  People that 
define languages think in terms of language grammars -- typically
captured in [Backus-Naur Form](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form) 
(BNF). For example, here is a snippet of BNF grammar from the PSS 
language-reference manual.


```
action_body_item ::=
 activity_declaration
 | override_declaration
 | constraint_declaration
 | action_field_declaration
```

Coding a parser by hand from this description involves a fair amount of 
analysis to, for example, identify the keywords that would cause a parser
to proceed down one branch vs another, and how many tokens of
'lookahead' are needed in each case to disambiguate choices. While these
are critical implementation decisions, they're difficult for a human to
make by hand since they often involve 'global' thinking about the whole
of a sizable language grammar. In other words, not areas of thinking that
to which the untrained human mind lends itself.


```
action_body_item:
 activity_declaration
 | override_declaration
 | constraint_declaration
 | action_field_declaration
 ;
```

Re-expressing the BNF in the terms of a domain-specific language is an
almost-trivial exercise for a domain expert in language design. The 
code snippet above is in [ANTLR4](https://www.antlr.org/) format. There 
are a few small changes in format, and a few things that are conveyed 
typographically in a printed language grammar are conveyed differently
to support programmatic processing, but overall the DSL description
is easy to learn for a domain expert.

By capturing our language grammar in a domain-specific language format,
we're able to make use of a parser/lexer builder tool to derive an 
efficient implementation of a language parser for this language. The 
parser-builder tool is able to easily and quickly make high-quality
global optimizations that would have been very time consuming and 
error-prone for a human to make. And, if we change the grammar at 
some point, we only need to re-run the the parser-builder tool to derive
a new (and still optimal) parser implementation.

Looking at a few domain-specific languages, they tend to shine when:
- There exists a natural (innate or acquired) way for a domain expert to 
  capture a domain problem.
- Deterministic, automated methods exist to derive an optimized 
  implementation from the domain-specific description
- There is a significant difference between the best way to describe a 
  problem and the best way to implement it in a general-purpose 
  programming language
- Achieving a good implementation requires global and/or concurrent 
  optimization.

## Where does Bare-Metal Testing fit? 
With that in mind, let's look back at our target application for PSS:
creation of bare-metal software-driven tests. In a typical 
system-development flow, development and verification of hardware and
software proceed on different paths up to a point. Of course, there 
can be some cross-over in the process, but the time when software
really starts to run on the hardware for which it is intended is
once the hardware system is assembled and verified.

<p align="center">
<img src="{{ '/imgs/2023/Hw_Sw_VDiagram_640.png' | absolute_url }}"/> 
</p>

Once a stable hardware-like representation of the hardware system 
exists, the integration team can really get started on completing
software for the system. Note that I said "hardware-like". In many
cases, this representation of the hardware system will be a hardware
emulator, or an FPGA prototype. The key is that the representation
has sufficient stability and performance to support 
software-development efforts. 

Two key factors to a successful hardware/software integration process are 
maximizing the stability of the hardware platform and having an efficient
path to reproduce and produce minimized testcases for any bugs found
by the integration team. The quality, quantity, and flexibility of the
bare-metal tests used to verify the system-level hardware platform has
a huge impact on success here.

## What are Bare-Metal Tests?
In order to appreciate some of the key benefits that PSS has to offer 
in creating bare-metal software-driven tests, it's useful to understand
a bit more about about the characteristics of bare-metal software tests.

As their name suggests, bare-metal software tests run directly on the
processor cores of a design. Unlike production software, they don't 
run on top of an operating system or real-time operating system (RTOS),
and consequently don't have access to services that operating systems
provide, such as:
- Dynamic memory allocation
- Threads and processes
- Multi-processor scheduling infrastructure
- Device-driver infrastructure

There are very good reasons that bare-metal tests opt to run directly
on the hardware and forego the use of an operating system.

Early software-driven integration testing is performed using a hardware
simulator to provide maximum debug visibility. Simulating a full system
at RTL is a slow process. Even simple operating systems run a 
not-insignificant amount of code prior to execution of the application,
all of which is running very very slowly on a simulated RTL model of 
a processor. Running bare-metal tests enables running more actual test
code.

The code that an operating system runs on start-up assumes that a the
hardware platform is stable. For example, for proper operation, it 
will require that memory accesses to different regions, and very possibly
atomic operations, are working. It will require that exceptions and 
interrupts are stable. Instability in the hardware platform is likely
to manifest itself in kernel panic, "blue screen of death", or other 
generic error signal that is unlikely to point the developer to the
root cause with any accuracy. We can create much more focused tests
for ensuring stability in various aspects of the platform that can
produce much more accurate failure signatures, allowing the developer
to zero in on the root cause much more quickly.

Finally, writing bare-metal tests gives us much more fine-grained
control over the hardware. The goal of an OS is to produce an 
optimal balance between overall throughput, scheduling fairness,
and other factors such as power consumption. The bare-metal testers
goal is often to hit corner cases that such a 'balanced' approach
to running code doesn't lend itself to.

## So, how does PSS Help?
So, we have good reasons for writing our early software-driven 
tests as bare-metal software. But this doesn't really make them
any easier to write. Over the next few posts we will explore how
the PSS domain-specific language helps to boost test-writing
productivity, while still enabling us to derive lean and mean
bare-metal software-driven tests. We will see how PSS processing
tools bridge the abstraction gap between a PSS-level description
and good bare-metal implementation code. We will see how a PSS
description enables PSS processing tools to make good global
optimizations that are difficult and error-prone for humans. It
remains to be seen whether PSS is considered to provide a natural 
(innate or acquired) way to capture system-level tests. I hope 
you'll have the information to assess this for yourself by the
end of this series.




