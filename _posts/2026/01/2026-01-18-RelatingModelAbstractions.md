---
layout: post
title: Relating Hardware Model Abstractions
date: 2026-01-18
categories: Zuspec
excerpt_separator: <!--more-->
mermaid: true
---

The most difficult transition in hardware modeling is the transition from
natural-language to executable specification. It is during this transition
that the ambiguities inherent in natural-language descriptions are resolved.
Maximizing value from a multi-abstraction hardware modeling strategy requires
minimizing the number of times a natural-language spec is converted to executable.
Zuspec defines interface abstraction levels that provide a basis for comparing
implementations with different abstraction levels.

<!--more-->

<p align="center">
<img src="{{ '/imgs/2026/01/design_abstraction.png' | absolute_url }}"/>
</p>

# Connecting Modeling Abstractions

<p align="center">
<img src="{{ '/imgs/2026/01/spec_model_relationship.png' | absolute_url }}"/>
</p>

In the previous post, we looked at several internal-implementation abstraction
levels. These help us explore the architecture and micro-architecture of the
design with different cost and performance tradeoffs. However, the internal 
implementation doesn't provide a good basis for comparing models. 
In essence, this means that 
the natural-language to executable spec translation happens for each model.
This raises the cost of modeling, but also increases the risk that each model
implements a slightly different interpretation of the original spec.

<p align="center">
<img src="{{ '/imgs/2026/01/spec_model_model_relationship.png' | absolute_url }}"/>
</p>

Ideally, we want some basis for mechanically comparing two models with different
implementations such that we can easily establish whether they are equivalent 
according to that basis. Each
model still needs to incorporate abstraction-specific details from the spec, but 
isn't a full from-spec implementation.

# Breaking Down Device Abstraction

<p align="center">
<img src="{{ '/imgs/2026/01/design_abstraction.png' | absolute_url }}"/>
</p>

Zuspec uses interface abstraction levels as this basis of comparison. 
The first thing to note is that there are two levels of interface: logical and physical.

The same set of interface abstractions apply to logical and physical interfaces, so
let's explore the abstraction levels first.

## Abstraction: Scenario
A scenario-level interface captures rules about how a device may be used. The 
[Portable Test and Stimulus (PSS) standard](https://www.accellera.org/downloads/standards/portable-stimulus) 
is likely the best-known example of a scenario-level interface abstraction.
PSS uses scheduling rules and constraints to specify data, data-flow, and 
resource utilization rules. The rules of a scenario-level description assist
in automating test creation and simplifying the integration of content 
from multiple IPs.

## Abstraction: Operation
An operation-level interface captures the device interface in terms of 
operations that the device can perform. Think of the API of a software driver
for a device. An operation-level interface lets us exercise key functions
of a device without worrying too much about the details.

## Abstraction: MMIO
A memory-mapped I/O (MMIO) interface uses memory-mapped registers and 
interrupts as the device interface. 

## Abstraction: TLM
A transaction-level modeling (TLM) interface uses packet-like messages. 
The [TLM 1.0 and 2.0 standards](https://www.accellera.org/images/downloads/standards/systemc/TLM_2_0_LRM.pdf) 
provide good examples of this level of modeling. TLM is also heavily
used in [UVM](https://www.accellera.org/downloads/standards/uvm) testbench 
environments.

## Abstraction: Protocol
Protocol-level interfaces are the familiar signal-level interfaces used
in register-transfer level (RTL) designs. 


## Physical Interfaces

We're all familiar with physical device interfaces. In RTL, these are the Protocol-level
interfaces with signal-level ports at the boundary of the device. Every hardware model has physical interfaces,
and these typically 

## Logical Interfaces

A logical interface is typically a software interface. Software, firmware, and 
test environments interact with a device via logical interfaces. A key attribute
of a logical interface is that it is independent of the physical interface 
and can be virtualized. 

## Useful Combinations

The combination of logical and physical interface abstraction levels, combined with
internal implementation abstraction level, provides a flexible way to characterize
a given model. The table below summarizes how the abstraction levels apply to
logical and physical interfaces. 

| Abstraction | Logical | Physical |
|-------------|---------|----------|
| Scenario    | Yes     | Maybe    |
| Operation   | Yes     | Yes      |
| MMIO        | Yes     | Yes      |
| TLM         | Maybe   | Yes      |
| Protocol    | No      | Yes      |

# Interface Roles

<p align="center">
<img src="{{ '/imgs/2026/01/interface_roles.png' | absolute_url }}"/>
</p>

In addition to abstraction level and interface type, interface roles are also worth
considering when characterizing a device.
- Initiator interfaces make requests to targets. Think: memory interface on a RISC-V core
- Target interfaces respond to requests from an initiator. Think: register interface on a UART
- Monitor interfaces passively view interaction between initiator and target

# Relating Interface Abstractions

<p align="center">
<img src="{{ '/imgs/2026/01/abstractors.png' | absolute_url }}"/>
</p>

Abstractors, a term used by the [IP-XACT](https://www.accellera.org/downloads/standards/ip-xact)
standard, provide a mechanism for bridging abstraction levels in a reusable way. An abstractor
has two or more physical interfaces with different abstraction levels and different roles. 
Specific kinds of abstractors often go by names like bus functional model or transactor. 

With the right set of abstractors, we can provide multiple views of the same model implementation.
For example, an algorithmic implementation of a device with MMIO physical interfaces can 
be used as a stand-in for the RTL implementation of the device with protocol-level interfaces 
in a verification testbench simply by adding the right protocol transactors from a library.


# Next Steps
Interface abstraction levels and interface types (logical, physical) enable 
model reuse and provide a basis for comparing models with very different
internal implementations. While there are many legal combinations of logical interface,
physical interface, and internal implementation, there are a few key combinations. 
In the next post, we'll start to look at how some of these key combinations, and
how they are captured and evaluated in Zuspec.

