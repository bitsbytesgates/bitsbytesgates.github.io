---
title: 'Python Verification Stimulus and Coverage: Constraints'
date: '2020-05-09T15:50:00.000-07:00'
tags:
- Python
- Boolector
- Cocotb
- PyVSC
- Functional Verification
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-8613871834597907949
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/05/python-verification-stimulus-and.html
modified_time: '2020-05-09T15:50:33.408-07:00'
image: https://1.bp.blogspot.com/-5brwvGvJgds/XrbHTbxSbZI/AAAAAAAAC8I/BA9qcnrfshE_qDlIO8yP5k9uOMNsiEYygCK4BGAsYHg/s72-c-d/splash_constraints.png
syndicate: none
---

<div>

[![](/legacy-img/splash_constraints.png)](https://1.bp.blogspot.com/-5brwvGvJgds/XrbHTbxSbZI/AAAAAAAAC8I/BA9qcnrfshE_qDlIO8yP5k9uOMNsiEYygCK4BGAsYHg/splash_constraints.png)

</div>

<div>

Over the past few blog posts, we've looked at:

</div>

<div>

- [The fundamentals of modeling stimulus and functional coverage in Python](/blog/modeling-random-stimulus-and-functional-coverage-in-python/)
- [Modeling verification data types in Python](/blog/python-verification-stimulus-and-coverage-data-types/)
- [Modeling and capturing functional coverage in Python](/blog/python-verification-stimulus-and-coverage-functional-coverage/)
- [Making use of captured coverage data](/blog/python-verification-working-with-coverage-data/)

<div>

In this post, we will look at how to model constraints in Python using the [PyVSC](https://github.com/fvutils/pyvsc) library. Several libraries that I'm familiar with (mostly C++) provide a way to embed constraints using an embedded domains-specific language. I've felt some discontent with the way that this is done because it's fairly different from what we're familiar with in languages that treat constraints as first-class language constructs.  Specifically, in C++, constraints are often modeled as lists of comma-separated expressions, and not as blocks of statements the way a first-class language would model them. This means that constraints that would normally be grouped in a block need to be split up into multiple blocks. And, when constraints are combined, they become difficult to read. One of my motivations in examining Python's support for embedded domain-specific languages was to see if Python offered a better approach. My feeling is that it most definitely does, and I hope you agree.

</div>

<div>

The examples in this post come from the PyVSC documentation. The latest version is always directly available on [readthedocs.io](https://py-vsc.readthedocs.io/en/latest/).

</div>

### Constraint Blocks

<div>

Constraint blocks in PyVSC are special class methods that are decorated with a *constraint* Python decorator. The presence of the *constraint* decorator causes PyVSC to see treat these methods, not as a regular Python method, but as an element to construct a constraint expression model. Here's a simple example:

</div>

<div>

```python
@vsc.randobj
class my_base_s(object):

    def __init__(self):
        self.a = vsc.rand_bit_t(8)
        self.b = vsc.rand_bit_t(8)

    @vsc.constraint
    def ab_c(self):
       self.a < self.b
```

</div>

<div>

PyVSC calls the methods marked as constraints once during the class-elaboration process and creates an internal model of the constraint statements captured in these constraint blocks. It also replaces the method with a class field that has special properties. More on that later.

</div>

<div>

By overloading operators (such as "\<"), PyVSC is able to get an expression tree that can be given to the [Boolector SMT](https://boolector.github.io/) solver that does all the heavy-lifting of constraint solving for PyVSC. 

</div>

<div>

As in SystemVerilog, constraint blocks are considered "virtual". In other words, having a constraint in a sub-class with the same name as a constraint in a base class causes the base-class constraint to be replaced with the sub-class constraint. 

</div>

<div>

```python
@vsc.randobj
class my_base_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)
       self.c = vsc.rand_bit_t(8)
       self.d = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):
      self.a < self.b

@vsc.randobj
class my_ext_s(my_base_s):

   def __init__(self):
       super().__init__()
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)
       self.c = vsc.rand_bit_t(8)
       self.d = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):
      self.a > self.b
```

</div>

<div>

In the example above, the *ab_c* constraint in the sub-class *my_ext_s* overrides the *ab_c* constraint in the base class *my_base_s*. The effect is that instances of *my_ext_s* will enforce the relationship (a \> b) instead of the base-class relationship (b \< a).

</div>

### Constraint Expressions

<div>

PyVSC supports specifying constraints using the familiar set of expression constructs we're all used to using: \<, \>, ==, !=, etc. The one set of operators that do not behave as you would expect in Python are the logical ones: and, or, etc. Python doesn't allow overriding these logical operators, unlike other operators. Consequently, we use bit-wise operators instead. 

</div>

<div>

```
with my_i.randomize_with() as it:
   it.a_small() | it.a_large()
```

</div>

<div>

In the example above, *a_small* and *a_large* are boolean constraints. Normally, in Python, we would combine these using *or*. In a PyVSC constraint, we use **\|** instead.

</div>

<div>

There are two special expressions to be aware of that can be used in constraints: the 'in' expression and part select. Both of these are frequently used in Python, and both can be used in constraints with PyVSC.

</div>

<div>

```python
@vsc.randobj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)
       self.c = vsc.rand_bit_t(8)
       self.d = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):

      self.a in vsc.rangelist(1, 2, [4,8])
      self.c != 0
      self.d != 0

      self.c < self.d
      self.b in vsc.rangelist([self.c,self.d])
```

</div>

<div>

The 'in' expression operates on a PyVSC-type field on the left-hand side and a PyVSC *rangelist* on the right-hand side. A *rangelist* can contain individual values and ranges of values. A *rangelist* can contain both constant expressions, such as the literals shown in the first rangelist, and expressions involving other PyVSC variables.

</div>

<div>

Python provides array-slicing expressions, and PyVSC reuses these to implement bit-slicing of scalar fields.

</div>

<div>

```python
@vsc.randobj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(32)
       self.b = vsc.rand_bit_t(32)

   @vsc.constraint
   def ab_c(self):

       self.a[7:3] != 0
       self.a[4] != 0
```

</div>

<div>

In this example, the part-select operator is used to ensure that certain bits and bit-ranges within the 'a' field are non-zero.

</div>

### Constraint Statements

<div>

Statements pose two additional challenges when developing an embedded domain-specific language: often keywords are already in use by the host language (and cannot be overloaded), and languages often don't provide easy way to overload statement blocks. Here, Python definitely has some benefits. Now, not surprisingly, Python doesn't allow overloading of built-in statements.But, it does provide an easy-to-use way of creating scopes that can be used to capture block statements. 

</div>

<div>

PyVSC provides three constraint statements. If/else and Implies are block statements, while the 'unique' constraint is not.

</div>

<div>

Python's mechanism for introducing a block of statements is the 'with' statement. When combined with a user-defined object, the 'with' statement allows a library writer to comprehend statement blocks. Here is an example of an if/else constraint:

</div>

<div>

```python
@vsc.randobj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)
       self.c = vsc.rand_bit_t(8)
       self.d = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):

       self.a == 5

       with vsc.if_then(self.a == 1):
           self.b == 1
       with vsc.else_if(self.a == 2):
           self.b == 2
```

</div>

<div>

The *if_then* class is used to form the 'if' branch of an if/else statement. Additional 'else-if' branches can be added on with the 'else_if' class. The final 'else' case is described with the 'else_then' class. 

</div>

<div>

The *implies* constraint is similar, since 'implies' applies to a constraint block:

</div>

<div>

```python
class my_s(object):

   def __init__(self):
       super().__init__()
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)
       self.c = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):

       with vsc.implies(self.a == 1):
           self.b == 1
```

</div>

Finally, the 'unique' constraint ensures that the specified terms have a unique value:

</div>

<div>

```python
@vsc.rand_obj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(32)
       self.b = vsc.rand_bit_t(32)
       self.c = vsc.rand_bit_t(32)
       self.d = vsc.rand_bit_t(32)

   @vsc.constraint
   def ab_c(self):
       vsc.unique(self.a, self.b, self.c, self.d)
```

</div>

<div>

### Customizing Declared Constraints

<div>

In general, we want to specify most of our constraints as part of the class hierarchy. However, there are quite a few cases where we need to customize things a bit when we randomize the class. PyVSC provides two capabilities to enable this: in-line constraints, and constraint mode.

</div>

<div>

In-line constraints allow us to add extra constraints that are specific to a randomization. To use this capability, use the 'randomize_with' call instead the the 'randomize' call as shown below:

</div>

<div>

```python
@vsc.randobj
class my_base_s(object):

   def __init__(self):
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)

   @vsc.constraint
   def ab_c(self):
      self.a < self.b

item = my_base_s()
for i in range(10):
  with item.randomize_with() as it:
    it.a == i
```

</div>

<div>

The example above ensures that 'a' increments 0..9 across 10 randomization calls. Note that the fields of the class can either be referenced via the handle that is being randomized (item) or via a special variable created by the 'with' block.

</div>

<div>

Constraint-mode allows entire constraint blocks to be turned on and off. Error-injection is one use-case for this feature. 

</div>

<div>

```python
@vsc.randobj
class my_item(object):

    def __init__(self):
        self.a = vsc.rand_bit_t(8)
        self.b = vsc.rand_bit_t(8)

    @vsc.constraint
    def valid_ab_c(self):
       self.a < self.b

item = my_item()
# Always generate valid values
for i in range(10):
  item.randomize()

item.valid_ab_c.constraint_mode(False)

# Allow invalid values
for i in range(10):
  item.randomize()
```

</div>

<div>

As shown in the example above, the first 10 randomizations have all constraints enabled. The next 10 randomizations have the 'valid_ab_c' constraint block disabled, allowing invalid values to be produced.

</div>

</div>

### Next Steps

<div>

Over the past few posts, we've looked at the key features and capabilities of PyVSC, a Python library for modeling constraints and functional coverage for verification. I would encourage you to use PyVSC, report bugs, and suggest enhancements. PyVSC is, of course, an open-source project, so contributions in the form of pull requests for bug fixes, documentation updates, and enhancements are always welcome as well.

</div>

<div>

For the last few months (pretty close to a year, actually) I've been really focused on hardware-centric functional verification infrastructure, with a focus on Python. I'm thinking it's time to get back to focusing a bit more on firmware development and embedded-software verification. There have been some interesting developments in this space, recently, which have the potential to enable significant changes in the way we develop and verify firmware and other low-level software. Look for more on that soon. Until then, stay safe and keep learning!

</div>

<div>

 

</div>

<div>

```
DisclaimerThe views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.
```

</div>
