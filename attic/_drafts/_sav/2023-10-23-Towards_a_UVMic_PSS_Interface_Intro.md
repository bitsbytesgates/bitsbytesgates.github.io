# Towards a UVM-ic PSS Interface: Intro

If you've spent even a little time with the Python community,
you've probably heard someone refer to code as being 'Pythonic', or 
suggesting that a certain way of coding is 'More Pythonic' than
another. With Python, as is true with many programming languages,
there are many ways to accomplish the same result. A 'More-Pythonic' 
implementation makes better use of Python language features and,
as a result, is likely to be more compact, easier to read and 
understand, and (hopefully) both.

While the specifics are different, we can apply the same 
*language*-ic or *methodology*-ic concept to non-Python languages
and methodologies as well. In this post, and a few to follow, 
I'd like to explore how the Portable Test and Stimulus (PSS) language
integrates with UVM environments and how we can make that most 
natural. Or, in other words, make it most UVM-ic.

<!-- more -->

# What's the Problem?

The Portable Test and Stimulus (PSS) language interfaces with the
outside world via *imported* functions. The general approach should
appear familiar to anyone that has interfaced SystemVerilog with
C code using SystemVerilog's Direct Programming Interface (DPI).

## Flat vs Hierarchical
<Example PSS import and usage>

Executing a PSS *Action* results in calls being made to this 
global API. 

<Diagram of 'Actor' interacting with shared global API>
- Structure on PSS side
- Structure on UVM side

Most-obvious integration: PSS functions map to exported DPI tasks/functions

This is functional, to the the extent that our global function
calls from the PSS model result in calls to global SystemVerilog
tasks and functions. The challenge arises from the fact that
very little UVM behavior is driven from global functions. Some
behavior is driven from the `run_phase` tasks in UVM components.
Most, however, is driven by sequences. Test scenarios at the 
level of abstraction used in PSS are almost always driven by
virtual sequences.

However, stimulus is generated via object-oriented constructs in UVM.
- Global virtual sequence
- Environment-specific virtual sequence
- Component
- Generic class

Looking for a common integration styles that supports all of these.

Support calling APIs in Sequence, Component, or arbitrary class.

Want an object-oriented interface that allows us to make
our PSS tesbench code independent of a specific vendor's tool.
- Use tool-provided content with pre-defined names and public interface
- Supports interoperability
- Our interface to the tool is common/standard

Support variety of tool styles with different capabilities:
- Pre-generated test
- On-the-fly interpreted test
- Pre-compiled, native-executed test

- Single or multiple comp/action combinations
- Able or unable to react to seed
- Single or multiple independent 'Actors' per simulation

Provide generic/standard methods for:
- Implementing the PSS API, or portions thereof, in a class
- Starting execution of the PSS model
- Connecting user PSS API implementation to tool

Ideally, instead of having our PSS *Actor* running *outside*
our UVM environment reaching in, we want our *Actor* running
within the UVM entity that drives test behavior.

## 



