

Toward a common PSS/UVM interface pattern
> Different PSS tools interface differently with SV/UVM
> Typically, DPI will be used in some way
> As users, don't really care about mechanics. Care about:
  - How our code implements PSS APIs
  - Our ability to reuse APIs implemented by others (eg 3rd-party VIP)
  - Our ability to create reusable code
  - Global vs local concerns
    - I only want to worry about APIs that I'm using
    - Others should be able to do the same, even if the API sets don't overlap

Interfaces, Delegation, Oh My! Toward a common PSS/UVM interface pattern

Requirements:
- Allow specific uses to implement as much or as little of the PSS model API as appropriate
- Keep user PSS and SV code independent of environment structure specifics
- Support reuse of API implementation
- Support for multiple distinct API implementations
- Object-oriented interface
- Detect mismatches at compile time (eg vs via $cast())
  - Cannot detect a class that incorrectly overrides a set of functions. This will be caught at runtime.
- Support multiple PSS 'Actors' running in a given environment
- Support matching 'Actors' to different parts of the UVM environment

Assumptions:
- In most cases, a single PSS <-> UVM API per testbench
-> It's possible to create classes that work with any compliant API

- Core concepts
- Reuse patterns


# Problem statement
- PSS is an object-oriented language
- Like UVM, has multiple structural contexts (PSS component tree / UVM component tree)
  - Many languages are 
  - What's unique with PSS and UVM are the notions of structure in both languages/methodologies
  - Example: Java and C++ are both object-oriented languages. Interface patterns 
  -> Managing mapping contexts is critical 
- Interface, like SV/DPI is via global functions
- For reuse, want to take advantage of object-oriented methods of implementing APIs 
- A PSS model has a single global set of interface functions
  - Different components  
- 
- UVM stimulus patterns
  - Behavior in component `run_phase` tasks
    - Invoke behavior on lower-level sequences
    - Can reach outside
    - Not reusable
  - Global virtual sequence
    - Specific to a given topology
    - Looks up handles based on obolute paths through component tree
    - Specific to a given testbench ; not reusable
    - Slightly simpler 
  - Environment-specific virtual sequence
    - Works with 
  - Summary
-
- Challenge: interface two object-oriented languages with structure via a flat API
  - Sub-Challenge: shouldn't assume that the two structural elements line up
    - UVM sequences

# Setup
- PSS model (type) and imported API functions
- Actor(s) implementing runtime view of a specific Component/Action combination
- API implementation(s) that connect Actor(s) to UVM environment
  - Sequence
  - Component
  - ...


# Registers+Memory

# General case
