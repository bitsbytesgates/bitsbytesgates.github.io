---
title: Modeling Random Stimulus and Functional Coverage in Python
date: '2020-03-27T14:02:00.003-07:00'
tags:
- CRAVE
- SMT
- functional coverage
- Python
- Boolector
- Cocotb
- PyVSC
- UVM
- Functional Verification
- constrained random
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-4688440595080223691
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/03/modeling-random-stimulus-and-functional.html
modified_time: '2020-05-15T09:00:46.056-07:00'
image: https://1.bp.blogspot.com/-3xDfd2VYh08/Xn5nbRvUAUI/AAAAAAAAC4M/LF-klZXXRdY45dulHRG4k1iyXbeFy1EBQCLcBGAsYHQ/s72-c/ModelingRandomStimulusSplash.png
syndicate: none
---

<div>

[![](/legacy-img/ModelingRandomStimulusSplash.png)](/legacy-img/ModelingRandomStimulusSplash.png)

</div>

  
If you've been following the blog over the last year, you've probably noticed that I've spent quite a bit of time over the last year learning and using Python. For several reasons, it's become my new favorite programming language. Until recently, I've mostly used Python as an implementation language. However, I've been curious as to how well Python works for implementing an embedded domain-specific language (eDSL). Most of my experience in this space has been with C++, so I was looking for an excuse to experiment.  
  
In addition to using Python as a general programming language, I've also been using it as a testbench language for functional verification. I've spent time learning about the cocotb library that interfaces Python to a simulation engine, and in building an efficient task-based interface between Python and BFMs in simulation. With a decade or so developing OVM and UVM testbench environments, one thing I found myself missing in Python were the constraint and functional coverage modeling features that SystemVerilog provides. Now, to be clear, there is at least one existing Python library that provides random stimulus in Python, but after evaluating the approach and supported features against commonly-used SystemVerilog features, I decided to proceed in a different direction.  
  
**Functional Verification and Constrained Random Stimulus**  
Constrained-random stimulus and functional coverage have become well-ingrained in functional verification practice over the last decade or more. SystemVerilog, of course, embeds this functionality in the language, SystemC offers two libraries (SCV and CRAVE) for randomization. The Accellera Portable Test and Stimulus (PSS) language also specifies constrained-randomization and functional coverage features. These existing specifications all overlap on a few key features, though they also each have some unique features.  
  
From a requirements perspective, I wanted to support a super-set of the constraint and functional coverage features from these existing sources to the extent possible. In addition to wanting to support as many useful features as possible, reuse was a key consideration. We're also beginning to see some open-source UVM-based libraries, such as the [riscv-dv](https://github.com/google/riscv-dv) project from Google for generating RISC-V instruction streams, that include constraints and functional coverage. This library and others are implemented in SystemVerilog, of course, but could be translated to Python. The porting task is definitely eased if the constraints and coverage can simply be mechanically translated instead of being reworked and remodeled to target a different set of supported constructs.  
  
**Key Requirements**  
After a bit of investigation, I settled on the following requirements for my library, and decided to name it Python Verification Stimulus and Coverage (PyVSC).  
  

- Keep the user-visible modeling constructs as syntactically similar to SystemVerilog as possible and practical
- Provide an underlying data model that can be programmatically processed to support static analysis, checking, and visualization of the user-specified constraints and coverage.
- Allow users to capture simple features in natural syntax, while allowing them to programmatically build up the model for more-complex applications. 
- Be able to take advantage of the availability and high performance of existing SMT solvers 

<div>

**PyVSC Basics**

</div>

<div>

The code below shows a simple example of capturing a class with random fields using the PyVSC library.

</div>

<div>

```python
@vsc.randobj
class my_item_c(object):
   def __init__(self):
       self.a = vsc.rand_bit_t(8)
       self.b = vsc.rand_bit_t(8)

    @vsc.constraint
    def ab_c(self):
        self.a != 0
        self.a <= self.b
        self.b in vsc.rangelist(1,2,4,8)
```

</div>

<div>

Note that the class is identified as a randomizable class via the *vsc.randobj* decorator. Decorators, which Python supports as a first-class construct, enable classes and methods to be tagged as having special significance. They also allow additional functionality to be layered on. In this case, functions for randomization will be added to the class. The class inheritance hierarchy will also be altered slightly, to allow constraints and random fields to be configured after construction of a class instance. However, 

</div>

<div>

Class fields (both random and non-random) that will participate in randomization are declared using VSC types. This enables information on bit-width and randomizable status to be associated with class fields. 

</div>

<div>

Now, let's have a look at functional coverage.

</div>

<div>

```python
@vsc.covergroup
 class my_cg(object):

     def __init__(self):
         # Define the parameters accepted by the sample function
         self.with_sample(dict(
             it=my_item_c()
          ))

          self.a_cp = vsc.coverpoint( self.it.a, bins=dict(
             # Create 4 bins across the space 0..255
             a_bins = bin_array([4], [0,255])
          )
          self.b_cp = vsc.coverpoint(self.it.b, bins=dict(
             # Create one bin for each value (1,2,4,8)
             b_bins = bin_array([], 1, 2, 4, 8)
          )
          self.ab_cross = vsc.cross([self.a_cp, self.b_cp])
```

</div>

<div>

A covergroup is a class decorated with the *vsc.covergroup* decorator. As with a randomizable class, the decorator implements proper construction order, and adds methods to the target class. 

</div>

<div>

There are several ways that coverage data can be provided to a covergroup class. In the example above, coverage data will be passed as parameters to the 'sample' method. In order to do this, we must specify the sample-method parameter names and types. This is done by calling the *with_sample* method and passing a Python dictionary with parameter name and type. 

</div>

<div>

Coverpoints and crosses are defined using the *coverpoint* and *cross* methods. Coverpoint bins are declared as shown above, and support the set of value bins supported by SystemVerilog -- individual bins containing individual values and ranges of values, and bin arrays containing values partitioned across the bins.

</div>

<div>

Okay, let's put it all together. The code below creates an instance of the covergroup, an instance of the randomizable class, randomizes the class, and samples the data in the covergroup.

</div>

<div>

```bash
 # Create an instance of the covergroup
 my_cg_i = my_cg()

 # Create an instance of the item class
 my_item_i = my_item_c()

 # Randomize and sample coverage
 for i in range(16):
     my_item_i.randomize()
     my_cg_i.sample(my_item_i)

 # Now, randomize keeping b in the range [1,2]
 for i in range(16):
     with my_item_i.randomize_with() as it:
         it.b in vsc.rangelist(1,2)
     my_cg_i.sample(my_item_i)

 print("Coverage: %f \%" % (my_cg_i.get_coverage()))
```

</div>

<div>

The first randomization loop randomizes the class using constraints declared in the class. The second randomization loop adds an additional inline constraint.

</div>

  
**Looking Forward**  
Over the next couple of posts, I'll go through the stimulus-generation and functional coverage features of PyVSC in more detail. Future posts will also tackle what to we can do in terms of static analysis of constraint models, as well as what to do with functional coverage data once we've collected it. Until then, feel free to have a look at the early documentation on [readthedocs.io](https://py-vsc.readthedocs.io/en/latest), and have a look at the PyVSC project on [GitHub](https://github.com/fvutils/pyvsc).  
  
  

<div>

***Disclaimer***

</div>

<div>

*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*

</div>
