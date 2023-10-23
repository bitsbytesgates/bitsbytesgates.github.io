
In my last post, I touched on some of the challenges of connecting
PSS and UVM -- two structural, object-oriented environments -- 
via a flat global API. Before exploring solutions to this challenge,
let's elaborate a few of the scenarios that our solution should
support.

## Env-Specific Virtual Sequence
- Behavior driven to sub-elements without regard to containing context
- Sub-envs act completely independently
- Sequence acccesses sub-sequencers, agents via 'virtual sequencer'


## Unbound Virtual Sequence
- Virtual sequence not associated with any sequencer
- Caller must initialize with required resources before running
- Sequence doesn't really know/care any specifics about the
  resources it uses. 

## Component-Driven Stimulus
- 

## Object-Oriented Reuse of Implementation
- Sequence makes use of utility behavior provided by a base class
- May aggregate several elements of utility behavior by 
  composition or inheritance

In all of these cases, behavior is driven from within some object
to interact with 

Key Requirements
- Behavior driven from within an object
- No inherent dependency on the location of the object
- Able to 