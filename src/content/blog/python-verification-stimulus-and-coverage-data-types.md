---
title: 'Python Verification Stimulus and Coverage: Data Types'
date: '2020-04-05T10:02:00.000-07:00'
tags:
- functional coverage
- Python
- Cocotb
- Functional Verification
- constrained random
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-373800869599754092
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/04/python-verification-stimulus-and.html
modified_time: '2020-04-05T10:02:17.914-07:00'
image: https://1.bp.blogspot.com/-3xDfd2VYh08/Xn5nbRvUAUI/AAAAAAAAC4Q/YjgMPTE9fXA0Tp7oIaxYgRtFJ-HsGWuxQCPcBGAYYCw/s72-c/ModelingRandomStimulusSplash.png
syndicate: none
---

<div>

[![](/legacy-img/ModelingRandomStimulusSplash-2.png)](/legacy-img/ModelingRandomStimulusSplash-2.png)

</div>

  

<div>

In my last post, [Modeling Random Stimulus and Functional Coverage in Python](https://bitsbytesgates.blogspot.com/2020/03/modeling-random-stimulus-and-functional.html), I introduced a Python library for modeling random variables, constraints, and functional coverage. Starting with this post, I'll go through several aspects of the [PyVSC](https://github.com/fvutils/pyvsc) library in greater detail. In this post, I'll cover the data types supported by PyVSC.

</div>

<div>

There are two reasons for doing this. For one thing, I think it's a useful way to describe the key features of the library (and hope you agree). The other reason is documentation. I don't do New Year's resolutions, but if I did one of mine this year would have been to do a better job of documenting my projects. For me, at least, documentation seems to be one of the hardest parts of a project -- or, at least, the easiest to defer and ignore. After coming back to a couple of my older projects and having to read code to figure out how to use them, I've decided that I need to invest more in documentation.

</div>

<div>

Fortunately, creating good documentation and making it readily-available has gotten much easier. Sphinx does a great job of converting ReStructured Text (RST) into nice-looking documentation. [Read-the-docs](https://readthedocs.org/) ensures that the latest and greatest version of documentation is always just a click away. You can always find the latest PyVSC documentation [here](https://py-vsc.readthedocs.io/en/latest/), and I'm investing more time in getting my other projects documented in the same way.

</div>

<div>

So, there you have it. My strategy is to introduce a set of PyVSC features in each of the next few posts. At the same time, I'll ensure the documentation for those features is in place. With that, let's dig in!

</div>

### Verification Requires Being Specific with Datatypes

<div>

Increasingly, programming languages (looking at you, Python) are eager to separate the declaration of scalar data types from the way that they are represented. While C/C++, SystemVerilog, and Java all require the user to specify information about scalar data types -- width, sign, etc -- Python doesn't. An integer variable is as wide as it needs to be to hold the values the user wants to store in it. Furthermore, an integer variable doesn't have any notion of being signed or unsigned.

</div>

<div>

When verifying hardware, we need to be a bit more specific because we're working with designs that very much care about the representation of data types. The nets transferring data across a bus interface have a fixed width, and the data stored in registers has both a width and a sign. Consequently, the verification code we write must also be specific about the data it is sending and receiving from the design being verified.

</div>

<div>

So, when generating stimulus and collecting coverage, we definitely need to capture the width of each verification-centric variable, and whether it is signed or unsigned. With stimulus-generation , there is one other piece of information that we need to track: whether the variable is randomized. 

</div>

### PyVSC and Scalar Datatypes

<div>

PyVSC uses specific data types for both constrained-random stimulus generation and for functional coverage collection. Like other randomization and coverage-collection frameworks, the use of specific data types provided by the library, instead of the language-provided built-in data types, serves two purposes. First, it allows the user to be sufficiently specific about the characteristics and meta-data of the data type. Second, it enables the library to capture expressions.  
  
Currently, PyVSC supports three core categories of data type:  
  

- Integer scalar -- specific-bitwidth, signed and unsigned, random and non-random
- Enumerated -- random and non-random variables 
- Class -- random and non-random instances of a *randobj* class

<div>

```python
@vsc.randobj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_uint8_t()
       self.b = vsc.uint16_t(2)
       self.c = vsc.rand_int64_t()
```

</div>

<div>

PyVSC provides pre-defined data-type classes that roughly correspond to the standard data types defined by the stdint.h C/C++ header file. These data-type classes have widths that are multiples of 8 bits, and specify the sign and randomness of the variable.  
  

<table class="docutils align-default">
<tbody>
<tr class="odd row-odd">
<td><div>
Width
</div></td>
<td><div>
Signed
</div></td>
<td><div>
Random
</div></td>
<td><div>
Non-Random
</div></td>
</tr>
<tr class="even row-even">
<td><div>
8
</div></td>
<td><div>
Y
</div></td>
<td><div>
rand_int8_t
</div></td>
<td><div>
int8_t
</div></td>
</tr>
<tr class="odd row-odd">
<td><div>
8
</div></td>
<td><div>
N
</div></td>
<td><div>
rand_uint8_t
</div></td>
<td><div>
uint8_t
</div></td>
</tr>
<tr class="even row-even">
<td><div>
16
</div></td>
<td><div>
Y
</div></td>
<td><div>
rand_int16_t
</div></td>
<td><div>
int16_t
</div></td>
</tr>
<tr class="odd row-odd">
<td><div>
16
</div></td>
<td><div>
N
</div></td>
<td><div>
rand_uint16_t
</div></td>
<td><div>
uint16_t
</div></td>
</tr>
<tr class="even row-even">
<td><div>
32
</div></td>
<td><div>
Y
</div></td>
<td><div>
rand_int32_t
</div></td>
<td><div>
int32_t
</div></td>
</tr>
<tr class="odd row-odd">
<td><div>
32
</div></td>
<td><div>
N
</div></td>
<td><div>
rand_uint32_t
</div></td>
<td><div>
uint32_t
</div></td>
</tr>
<tr class="even row-even">
<td><div>
64
</div></td>
<td><div>
Y
</div></td>
<td><div>
rand_int64_t
</div></td>
<td><div>
int64_t
</div></td>
</tr>
<tr class="odd row-odd">
<td><div>
64
</div></td>
<td><div>
N
</div></td>
<td><div>
rand_uint64_t
</div></td>
<td><div>
uint64_t
</div></td>
</tr>
</tbody>
</table>

Just to keep things straightforward, PyVSC defines classes that capture all 16 combinations of width, sign, and randomness.

</div>

<div>

PyVSC also provides classes for capturing fields that have a width that is not a multiple of 8, or that is wider than 64 bits. 

</div>

<div>

First, an example:

</div>

<div>

```python
@vsc.randobj
class my_s(object):

   def __init__(self):
       self.a = vsc.rand_int_t(27)
       self.b = vsc.rand_bit_t(12)
```

</div>

<div>

<table class="docutils align-default">
<tbody>
<tr class="odd row-odd">
<td><div>
Signed
</div></td>
<td><div>
Random
</div></td>
<td><div>
Non-Random
</div></td>
</tr>
<tr class="even row-even">
<td><div>
Y
</div></td>
<td><div>
rand_int_t
</div></td>
<td><div>
int_t
</div></td>
</tr>
<tr class="odd row-odd">
<td><div>
N
</div></td>
<td><div>
rand_bit_t
</div></td>
<td><div>
bit_t
</div></td>
</tr>
</tbody>
</table>

</div>

<div>

The [Data Types](https://py-vsc.readthedocs.io/en/latest/data_types.html) chapter of the documentation contains more examples and details on how all of these data types are used.

</div>

<div>

  
  

</div>

</div>

<div>

### PyVSC and Composite Data Types

</div>

<div>

In true object-oriented fashion, PyVSC supports composing larger randomizable classes out of smaller randomizable classes. 

</div>

<div>

```python
@vsc.randobj
class my_sub_s(object):
   def __init__(self):
       self.a = vsc.rand_uint8_t()
       self.b = vsc.rand_uint8_t()

@vsc.randobj
class my_s(object):

   def __init__(self):
       self.i1 = vsc.rand_attr(my_sub_s())
       self.i2 = vsc.attr(my_sub_s())
```

</div>

<div>

In these cases, it's important to specify whether the class-type attribute should be randomized when the containing class is randomized. Decorating the attribute with *rand_attr* will cause the sub-attributes to be randomized. Not decorating the field, or decorating it with *attr* will cause the sub-attributes to not be randomized.  

### Accessing Attribute Values

</div>

<div>

It's quite common in randomization and coverage frameworks (eg SystemC SCV, CRAVE) to use method calls to access the value of randomizable class attributes. This is because the randomizable attributes are, themselves, objects.  
PyVSC provides get_val() and set_val() methods for each scalar datatype provided by the library. In addition, PyVSC implements operator overloading for *randobj-*decorated classes. In most cases, this means that special randomizable class attributes operate just like any other scalar Python class attribute.

</div>

### Coming up Next

<div>

In the next blog post, we'll look at PyVSC's support for modeling, capturing, and saving functional coverage data. Until then, feel free to check out the [PyVSC documentation](https://py-vsc.readthedocs.io/en/latest/) on readthedocs.io. If you'd like to experiment with PyVSC, install the *pyvsc* package from [pypi.org](http://pypi.org/) or check out the [PyVSC](https://github.com/fvutils/pyvsc) repository on GitHub.

</div>

- - 

  
  

<div>

***Disclaimer***

</div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>

<div>

*  
*

</div>
