---
layout: post
title: "PSS Fundamentals: Actions, Components, and Test Generation"
date: 2023-03-04
categories: PSS
---

Complex engineering endevors require complex calculations. It's open to 
debate as to when the first engineering project that 
required complex calculations occurred, but we know that the calculations
would have needed to be done by hand. And this state largely remained
until the broad availability of the electronic calculator in the 
1950s and 1960s.

But this doesn't mean that "computers" (those individuals performing
computations with pen and ink) were left to compute everything from the
ground up. Fortunately, books were published containing mathematical 
tables that provided the pre-computed results of standard trigonometric 
functions for various input values. The data in these books of 
mathematical tables would, of course, have been produced
laboriously by some other "computer" or "computers" working with pen 
and paper. But, they were invaluable at increasing the speed with 
which complex calculations could be done by hand.

What does this have to do with Portable Test and Stimulus (PSS)? 
PSS is specifically designed to enable PSS processing tools to 
pre-compute the result complex test scenario relationships in order
to make the best use of instructions running at a few Hertz on a simulated 
RTL model of the design processor. But, before we get to how PSS creates tests, 
we need to learn about two fundamental PSS concepts: Actions and Components

## Actions
Our next key topic is the Action. As it so happens, several languages
and description formats use the notion of _Action_. After all, it 
is a very intuitive term to capture an element that is all about
encapsulating behavior. Before digging into, though, it is helpful
to understand a bit about PSS is how it divides test behavior into 
two portions. 

[ Diagram | Modeling and Realization ]
- Actions, activities, constraints, etc
- register and memory read/write ; call external driver functions

The upper portion, called the Modeling Layer
and the lower portion, called the Realization Layer. The modeling
layer contains the constrain-driven features for modeling test scenarios,
and is responsible for capturing the space of interesting and useful
behaviors. 

In contrast, the realization layer is more-or-less 
intended to carry out the instructions of the modeling layer, and 
contains familiar procedural statements such as you find in other 
programming languages such as C, Java, and Python. The realization layer
is also where we'll find constructs for reading and writing registers
and memory. While the realization layer makes local decisions, often
related to handshaking with the device it controls, the modeling layer
is intended to make the big-picture decisions about how the system
is exercised. 

In a sense, _Actions_ cross the boundary between modeling and realization
layer because the can contain both modeling and realization aspects. In 
all cases, they group the data, constraints, and implementation for a given 
behavior. 

```
action check_reg_reset_vals {
    list<bit[32]> reset_vals = {0x0000_0000, 0x0180_2FFF, 0x8000_0000};
    rand bit[8] start;

    constraint start in [0..reset_vals.size()-1];

    exec body {
        bit[32] addr, val;
        repeat (i : reset_vals.size()) {
            addr = 0x1000_0000 + ((start + i)%reset_vals.size());
            val = read32(addr);

            if (val != reset_vals[i]) {
                error("Failed to read register at 0x%08x: read 0x%08x ; expected %08x",
                    addr, val, reset_vals[i]);
            }
        }
    }
}
```

## Hierarchical Actions -- Declarative Behavior
The first action we showed looks very similar to what we might do in a 
UVM sequence. In other words, the rand-qualified variable is randomized 
prior to running the code in 'body', and the code in 'body' does the
low-level work of reading register values and checking their correctness.

Because the action is 

The action above checks the reset value of a set of registers, starting at a 
randomly-controlled start index. _reset\_vals_ and _start_ are part of the
modeling layer. They direct the high-level view of this rather low-level
test. 

Simple action examples:
- Read all actions to check for reset value
  - Random access order
- Program an IP mode
  - Which mode

### Actions are Hierarchical
Thus far, our action scenarios have been select some data values, then
call some functions. So, our actions don't look so different from UVM
sequences. Fortunately, the implementation can be described in terms
of an _Activity_.





Every programming language provides some constructs to group
statements that modify data and, ultimately, interact with the 
surrounding world. PSS provides three such grouping constructs: 
Actions and Exec blocks. 


- Need a few fundamentals on actions
  - Can contain rand and non-rand data fields
  - Actions have a lifecycle - pre-randomize, post-randomize, 'behavior'
  - Behavior can be specified in two different ways
    - Using C-like procedural statements
    - As an activity of zero or more activities 

### Declarative Behavior Descriptions
Most programming languages have one type of behavioral description. In almost
every case, this is an imperative description. An imperative description is 
one in which the implementation of the desired behavior is specified step
by step.

```
int a = get_val();
int b = get_val();
int c;

if (a < b) {
    c == 2;
} else {
    c == 3;
}
```

In the example above, variables `a` and `b` are given values. If `a<b`, `c` is assigned 2. Otherwise, `c` is assigned 3. Pretty straightforward, right? 

Some languages -- especially constraint languages -- support a _declarative_ style of
description in which _rules_ are specified that the program must follow. If we wrote the
snippet of imperative code above as declarative constraints, it might look like 
the following:

```
rand int a;
rand int b;
rand int c;

if (a < b) {
    c == 2;
} else {
    c == 3;
}
```

In this description, we place no bounds on the values that a and b can 
take on because we
are capturing the relationships between a,b, and c. In a declarative 
description, these relationships are bi-directional. In other words, 
not only will c==2 if `a` is constrained to be less than `b`, but `a` 
will be less than `b` if `c` constrained to be 2.

The bi-directional nature of constraints is nothing new to anyone that has 
used constrained-random generation in functional verification. Extending the 
bi-directional nature of constraints to temporal descriptions is.



specifies the steps in . 

PSS divides behaviors into two categories: declraatr


## Components

## Test Creation Flow
We've already started to see artifacts of the PSS test-creation flow in 
the way that PSS breaks execution of an action into three pieces: 
pre_solve, post_solve, body. 


