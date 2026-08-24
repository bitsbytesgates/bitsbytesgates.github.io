---
title: 'Arrays, Dynamic Arrays, Queues: One List to Rule them All'
date: '2020-06-27T15:43:00.001-07:00'
tags:
- Electronic Design Automation
- domain-specific language
- Python
- PyVSC
- Functional Verification
- constrained random
- Design Verification
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-649586351283392620
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/06/arrays-dynamic-arrays-queues-one-list.html
modified_time: '2020-06-27T15:43:34.867-07:00'
image: https://1.bp.blogspot.com/-eSbEW6CXj2I/Xve6PIe8-RI/AAAAAAAAC_Q/qNxrNskh4ysWWe_2tqR3Lqn0Zf21LdpVACK4BGAsYHg/s72-w500-c-h279/splash.png
syndicate: none
---

<div>

[<img src="/legacy-img/splash-13.png" width="500" height="279" />](https://1.bp.blogspot.com/-eSbEW6CXj2I/Xve6PIe8-RI/AAAAAAAAC_Q/qNxrNskh4ysWWe_2tqR3Lqn0Zf21LdpVACK4BGAsYHg/s540/splash.png)

</div>

<div>

Randomizable lists are, of course, very important in modeling more-complex stimulus, and I've been working to support these within PyVSC recently. Thus far, PyVSC has attempted to stay as close as possible to both the feature set and, to the extent possible, the look and feel of SystemVerilog features for modeling constraints and coverage.  With randomizable lists, unlike other features, I've decided to diverge from the SystemVerilog. Keep reading to learn a bit more about the capabilities of randomizable lists in PyVSC and the reason from diverging from the SystemVerilog approach.

</div>

<div>

**SystemVerilog: Three Lists with Different Capabilities**

</div>

<div>

SystemVerilog is, of course, three or so languages in one. There's the synthesizable design subset used for capturing an RTL model of the design. There's the testbench subset that is an object-oriented language with classes, constraints, etc. There's also the assertion subset. These different subsets of the language have different requirements when it comes to data structures. These different requirements have led SystemVerilog to have three array- or list-like data structures:

</div>

<div>

**Fixed-size arrays**, as their name indicates, have a size specified as part of their declaration. A fixed-size array never changes size. Because  the array size is captured as part of the declaration, methods that operate on fixed-size arrays can only operate on a single-size array.

</div>

<div>

The size of **dynamic-size arrays** can change across a simulation. The size of a dynamic-size array is specified when it is created using the *new* operator. Once a dynamic-size array instance has been created, the only way to change its size is to re-create it with another *new* call. Well, actually, there is one other way. Randomizing a dynamic-size array also changes the size.

</div>

<div>

The size of a **queue*** *is changed by calling methods. Elements can be appended to the list, removed, etc. A queue is also re-sized when it is randomized.

</div>

<div>

**PyVSC: One List with Three Options**

</div>

<div>

If you've done a bit of Python programming, you're well aware that Python has a single list. Python's list is closest to SystemVerilog's *queue* data structure. My initial thought on supporting randomizable lists with PyVSC was just to create an equivalent to the *list* and be done. But then I thought a bit more about use models for arrays in verification. Each SystemVerilog array type represents a useful use model, but there's also another use model that I've never properly figured out how to easily represent in SystemVerilog. Fundamentally, there are two use cases for randomizable lists:

</div>

<div>

- List with non-random elements
- List with random elements, whose size is not random
- List with random elements, whose size is random

<div>

When the size of a list whose size is not randomizable is modified by appending or removing elements, its size is preserved when the list is subsequently randomized.

</div>

<div>

Here are a few examples.

</div>

<div>

```python
@vsc.randobj
class my_item_c(object):
   def __init__(self):
     self.my_l = vsc.rand_list_t(vsc.uint8_t(), 4)
```

</div>

<div>

The example above declares a list that initially contains four random elements.

</div>

<div>

```python
@vsc.randobj
class my_item_c(object):
   def __init__(self):
     self.my_l = vsc.randsz_list_t(vsc.uint8_t())

   @vsc.constraint
   def my_l_c(self):
       self.my_l.size in vsc.rangelist((1,10))
```

</div>

<div>

The example above declares a list whose size will be randomized when the list is randomized. A list with randomized size must have a top-level constraint that specifies the maximum size of the list. Note that in this case the size of the list will be between 1 and 10.

</div>

<div>

If you wish to use a list of non-random values in constraints, you must store those values in an attribute of type **list_t**. This allows PyVSC to properly capture the constraints.

</div>

```python
@vsc.randobj
class my_item_c(object):
   def __init__(self):
     self.a = vsc.rand_uint8_t()
     self.my_l = vsc.list_t(vsc.uint8_t(), 4)

     for i in range(10):
         self.my_l.append(i)

   @vsc.constraint
   def a_c(self):
     self.a in self.my_l

it = my_item_c()
it.my_l.append(20)

with it.randomize_with(): 
```

<div>

<span class="n">      it</span><span class="o">.</span><span class="n">a</span> <span class="o">==</span> <span class="mi">20</span> 

</div>

<div>

In the example above, the class contains a non-random list with values 0..9. After an instance of the class is created, the list is modified to also contain 20. Then we randomize the class with an additional constraint that a must be 20. This randomization will succeed because the *my_l* list does contain the value 20.

</div>

<div>

**Using Lists in Foreach Constraints **

</div>

<div>

PyVSC now also supports the *foreach* constraint. By default, a foreach constraint provides a reference to each element of the array. 

</div>

<div>

```python
@vsc.randobj
class my_s(object):
   def __init__(self);
       self.my_l = vsc.rand_list_t(vsc.uint8_t(), 4)

   @vsc.constraint
   def my_l_c(self):
       with vsc.foreach(self.my_l) as it:
           it < 10
```

</div>

<div>

In the example above, we constrain each element of the list to have a value less then 10. However, it can also be useful to have an index to use in computing values. The *foreach* construct allows the user to request that an index variable be provided instead.

</div>

<div>

```python
@vsc.randobj
class my_s(object):
   def __init__(self);
       self.my_l = vsc.rand_list_t(vsc.uint8_t(), 4)

   @vsc.constraint
   def my_l_c(self):
       with vsc.foreach(self.my_l, idx=True) as i:
           self.my_l[i] < 10
```

</div>

<div>

The example above is identical semantically to the previous one. However, in this case we refer to elements of the list by their index. But, what if we want both index and value iterator?

</div>

<div>

```python
@vsc.randobj
class my_s(object):
   def __init__(self);
       self.my_l = vsc.rand_list_t(vsc.uint8_t(), 4)

   @vsc.constraint
   def my_l_c(self):
       with vsc.foreach(self.my_l, it=True, idx=True) as (i,it):
           it == (i+1)
```

</div>

<div>

Just specify both 'it=True' and 'idx=True' and both index and value-reference iterator will be provided.

</div>

</div>

**One List to Rule them All**

<div>

As of the 0.0.4 release (available now!) PyVSC supports lists of randomizable elements whose size is either fixed or variable with respect to randomization. Check it out and see how it helps in modeling more-complex verification scenarios in Python!

</div>

<div>

```
DisclaimerThe views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.
```

</div>

<div>

**  
**

</div>

<div>

**  
**

</div>
