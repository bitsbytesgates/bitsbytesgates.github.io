

Engineering is a process of making and validating hypotheses. We make assumptions
about how a particular design will perform, then validate those assumptions by
running real workloads against that design. How we do this differs significantly
between software and hardware engineering.  With software, aside from the effort 
of writing code, it's easy for an engineer to try out a new design, almost immediately, 
on a platform with similar characteristics to the platform targeted for production. 
In contrast, it might be 12-24 months before a silicon design engineer can validate their
design decisions on production silicon. This leads hardware engineers to create and
use *models* of portions of the design to validate design assumptions. Let's dig 
deeper into the questions we wish to answer and the models we create to do so.

<!--more-->

# The Questions We Ask and Models we Build

- Verification: confirm that two models are logically equivalent according to set of criteria
- Validation: confirm that requirements are achieved -- Could think about the spec requirements being properly mapped to implementation

- 

In the abstract, two sides of the same coin

The key issue is that we need to build too many distinct models to adequately answer our 
key question in an efficient manner. Ideally, we want a small number of, related, scalable 
models with which we can perform key analysis to validate our assumptions.

# Abstraction Level is a Continuum

We have a wide range of model types we can employ, given the complexity and nuance of the 
questions that we're trying to answer.
there are a range of 

![](../../../imgs/2025/12/design_abstraction.png)
<p align="center">
<img src="{{ '/imgs/2025/12/design_abstraction.png' | absolute_url }}"/>
</p>

The abstraction definitions above focus on a hardware device as a whole. In so 
doing, they don't provide us quite enough freedom to describe the models we need
to produce.  I've started using the terminology shown in the diagram above to 
characterize the abstraction level of hardware-centric models. These definitions 
focus on how three key aspects of a device are described:

- **Implementation** - The level of detail used to capture the device-internal 
  behavior. Several of the abstraction levels listed above are relevant here.
- **Physical Interface** - How the execution environment interacts with the device.
  For example, the device may implement a Wishbone signal-level interface for
  accessing registers.
- **Logical Interface** - How the environment interacts with the device. For example, a 
  driver interacts with a device via a Memory-Mapped IO (MMIO) logical interface, and 
  typically has no awareness of the physical interface.

Each of these forms an axis, with several possible levels of abstraction. For example,
we might use a model with an *algorithmic implementation*, *protocol-level physical interface*,
and a *mmio logical interface* to bring up our testbench while we're waiting for
the designers to deliver an *RTL implementation* that we can use. We might also 
create a model having an *RTL implementation*,  *protocol-level physical interface*,
and a *MMIO logical interface* that firmware engineers can use to develop their
firmware against.

Several abstraction-level definitions were developed in the early 2000s as
Electronic System Level (ESL) design was being explored, and SystemC 
transaction-level modeling (TLM) was being developed. 

- **Algorithmic** - Behavioral model with little/no focus on architecture or timing
- **Communicating Processes (CP+T)** - Dataflow-oriented model with or without approximate timing
- **Programmer's View (PV+T)** - Register-oriented implementation with or without timing
- **Cycle Accurate (CA)** - Clocked, bit-accurate model with micro-architectural details
- **Register-Transfer Level (RTL)** - Synthesizable (VHDL/Verilog) implementation

You can find a more-elaborate description in [1] in the [references](#references) section.
You can see how each of these fit as points on the axes above. 



Let's look at each of these briefly through the lens of one of my favorite examples:
a multi-channel DMA engine [2]. 



## DMA Logical Interface

The logical interface is how we think of interacting with the device from the outside
world -- typically software. Let's start with 

### Abstraction Level: Operation
- Think of as the Driver view
- Many operations are blocking
- Caller is threaded
- Example 'm2m' operation

- What is it good for?

### Abstraction Level: Programmer View
- Registers, Memory, Events (eg interrupts)
- Example 'm2m' programming sequence

- What is it good for?

### Abstraction Level: Scenario
Portable Test and Stimulus (PSS) suggests an abstraction level that is above the
*Operation* level, and focuses on relationships between devices in a system and
the scenarios that exercise them. For example, only one 

- Model acquisition of 
- What is it good for?

### Combining Logical Interfaces
- Scenario -> Operation -> Programmer
- Programminer -> Operation -> Scenario

## DMA Physical Interface

### Abstraction Level: Operation

### Abstraction Level: Programmer View

### Abstraction Level: TLM

### Abstraction Level: Protocol

## DMA Internal Implementation

- All about timing fidelity vs eventual implementation as transistors

### Algorithmic - Untimed / Loosely Timed

### Cycle Accurate - With Varying Fidelities

### Register-Transfer Level -- Ready to go to Synthesis


## Analysis and Model Abstraction Axes
=> Modeling is great, but our end goal is to analyze properties of
  a given model's implementation
- Dynamic
- Symbolic / Formal / Static
- Cross-domain analysis: 
  - Formal: firmware corner cases given an appropriate hardware model
  - Dynamic: Checkerboard abstraction levels to evaluate a few blocks in 
    detailed form, while the rest are high level

- Goal: easily create models that implement different points in this space 
  by being able to stay in the same framework and reuse significant portions 
  of the model.

  - Example: implement Operation logical interface in terms of registers/memory
    - Reuse all existing tests
    - 
  - Example: 

- Reusability enables composition, bridging


# No Model is an Island

- Support integration and integration-within
  - Incorporate existing Verilog models
  - Incorporate model into a Verilog simulation

- Must connect to existing descriptions
  -> Incorporate existing detailed models (Verilog)
  -> Represent the operation of existing C code for analysis
    - Prove that C implementation is safe, given hardware model


There are many differences between designing and implementing software vs designing
and implementing hardware. Principal amongst these is hardware design's reliance 
on modeling. 

# Conclusion
Having a system for representing models of hardware behavior at multiple abstraction
levels ... 
Next time we'll revisit Zuspec in the next level of detail to see how the framework
is evolving to deliver these benefits. 

- This is a "what we want" from hardware modeling
- How do we get it?
  - Architecture of
- What does it look like

## References
- [1] Donlin, Adam - [Transaction Level Modeling: Flows and Use Models](https://www.cs.york.ac.uk/rts/docs/CODES-2003-2005/PAPERS/2004/CODES04/pdffiles/p075.pdf)
- [2] [Wishbone DMA/Bridge IP Core](https://opencores.org/projects/wb_dma)