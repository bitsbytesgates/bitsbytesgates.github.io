
If you've worked with UVM, you've worked with Transaction-Level Modeling (TLM).
Many TLM concepts in 

## What we want
- Actor knows about its API in object-oriented terms
- We can supply an implementation of that API
- The implementation of that API can be a mix of:
  - Locally-suppplied by our class
  - Composed of pre-built API snippets that may delegate
  - ...
- Maintain independence from using a certain base class
- Only worry about implementing the methods we need
  - 

This is a bit trickier to implement in SystemVerilog, since
it only supports single inheritance. But, there is a way.

## A Static Decorator Pattern
I'll be showing all the details with this code. But, don't
start thinking about how much work it will be to create
all this code just yet. The good news is that nearly
everything you see here can easily be generated from a 
PSS model.

What we want:
- Give *Actor* an SV class with an API that it can call
- Allow our classes (sequence, component, etc) to implement portions of that API
- Have the *Actor* call our implementations

Start with the User view:
- Have base class that defines virtual tasks/functions that we can override
  - Base implementations allow us to only implement what we need to
- Show example of overriding a base method
- There are two issues with this:
  - Unclear how we would 'mix-in' pre-built implementations for portions of the API
  - Unclear how we deal with needing to support multiple base classes

## Mix-ins
SystemVerilog and other languages support an interesting design pattern called
'mix-ins' (couple of resferences). 
Basic concept is to provide a class that is parameterized with the type of 
its base class. 
You can think of this allowing us to 'inject' classes into the inheritance 
hierarchy:
- MyClass -> UVM Sequence
- MyClass -> API Base -> UVM Sequence
- MyClass -> API Impl -> API Base -> UVM Sequence

## What can be made tool-agnostic?
- Notion of a global Base API class and Base API Mix-In classes
  - Method signatures are defined by the standard, so should be
    no differences between tools
- API is model-specific.
- pss_model_api w/ PssApi and PSSApiMixin classes

## Tool-Implemented Standard API classes
- Actor class with signature
  - root component and action type names
  - seed
  - Handle to implementation class
- Interface is fixed
- Implementation may be model-specific
  - Embedded interpreter
  - 

## Argument for a global API
- Will ca

## Example where Actor is a class

## Example where Actor uses global DPI API

## Actor Proxy: Bridging from Generic API to Specific Implementation

