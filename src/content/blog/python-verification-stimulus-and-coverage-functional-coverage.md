---
title: 'Python Verification Stimulus and Coverage: Functional Coverage'
date: '2020-04-11T19:07:00.001-07:00'
tags:
- PyVSC
- Python
- Functional Coverage
- Functional Verification
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-2488599794066215015
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/04/python-verification-and-stimulus.html
modified_time: '2020-04-11T19:07:58.681-07:00'
image: https://1.bp.blogspot.com/-ph8x-Zy9vU0/XpI3g_cV3XI/AAAAAAAAC5A/ucHyW0cm62Yhoj_u2D4rzWTrnIYi4ToDwCLcBGAsYHQ/s72-c/pyvsc_coverage.png
series: Python Verification Stimulus and Coverage
syndicate: none
---

<div>

[![](/legacy-img/pyvsc_coverage.png)](/legacy-img/pyvsc_coverage.png)

</div>

  
In my last two posts ([here](/blog/modeling-random-stimulus-and-functional-coverage-in-python/) and [here](/blog/python-verification-stimulus-and-coverage-data-types/)), I've been talking about modeling random stimulus, constraints, and functional coverage in Python. After looking at the fundamentals of capturing the specifics of data types such that they can be used for hardware verification last week, lets look at using those data types for modeling functional coverage.  
  
As I mentioned last week, I'm using this series of blog posts as a guide and as motivation to document the [PyVSC](https://github.com/fvutils/pyvsc) package that implements the random stimulus and coverage that I'm describing. You can find documentation on the functional-coverage features in the [Coverage](https://py-vsc.readthedocs.io/en/latest/coverage.html#) chapter of the [documentation on readthedocs.org](https://py-vsc.readthedocs.io/en/latest/).  
  

### Covergroups

<div>

SystemVerilog, as well as several other verification languages, groups functional coverage elements in a construct called a covergroup. A covergroup is a type (like a class) that can be instanced multiple times, and whose instances maintain a relationship back to the type. 

</div>

<div>

A PyVSC covergroup is a Python class with a special *covergroup* decorator. 

</div>

<div>

```python
@vsc.covergroup
class my_covergroup(object):

    def __init__(self):
        self.with_sample(
            a=bit_t(4)
            )
        self.cp1 = vsc.coverpoint(self.a, bins={
            "a" : vsc.bin(1, 2, 4),
            "b" : vsc.bin(8, [12,15])
            })

my_cg_1 = my_covergroup()
my_cg_2 = my_covergroup()
```

</div>

<div>

The *covergroup* decorator ensures that core methods and attributes are present in the covergroup class without requiring the class to derive from a specific base class. The decorator also ensures that certain introspection and class-construction steps are performed after the user's constructor code runs and before returning to the caller. Fortunately, all these details are hidden so a PyVSC covergroup behaves like any other Python class. Creating an instance of a covergroup is as simple as creating an instance of the class, as shown above.

</div>

### Coverpoints, Bins, and Crosses

<div>

Once we have a covergroup type defined, we need to define the values, value ranges, and combinations of values we wish to observe during verification. These features are captured by *coverpoints*, *bins,* and *coverpoint crosses*.

</div>

<div>

All of these features are captured by calling PyVSC methods.

</div>

<div>

```python
@vsc.covergroup
class my_covergroup(object):

    def __init__(self, a : callable):

        self.cp1 = vsc.coverpoint(a, bins={
            "a" : vsc.bin(1, 2, 4),
            "b" : vsc.bin(8, [12,15])
            })
```

</div>

<div>

For example, above we create a single coverpoint with two bins. The first bin ("a") will be considered covered if the coverpoint sees a value of 1, 2, or 4. The second will be considered covered if the coverpoint sees a value of 8, or 12..15.

</div>

<div>

```python
@vsc.covergroup
class my_covergroup(object):

    def __init__(self, a : callable):

        self.cp1 = vsc.coverpoint(a, bins={
            "a" : vsc.bin_array([], 1, 2, 4),
            "b" : vsc.bin_array([4], [8,16])
            })
```

</div>

<div>

Creating arrays of bins is also important, of course. In the example above, we create two arrays of bins. The bin array labeled "a" will consist of three individual bins that, respectively, monitor the values 1, 2, and 4. The second bin array ("b") will consist of four individual bins that monitor the values 8..16. In this case, each bin will monitor two coverpoint values (8..9, 9..10, etc). If you're familiar with SystemVerilog, these features -- and even the syntax -- should look very familiar.

</div>

<div>

One question, of course, is how we associate a name with our coverpoints. If you've used verification frameworks that are embedded in C++ (eg SystemC, or SystemC SCV), you're probably used to specifying strings to name each element. One nice aspect of Python is that we're able to introspect the names of the variables to which features like coverpoints are assigned. So, part of the "magic" that our *coverpoint* decorator applies is to determine the names of coverpoints based on the class attributes to which coverpoints are assigned.

</div>

<div>

We don't just care about individual variable values, of course. We often need to ensure that combinations of variable values are exercised as part of verification. That's where coverpoint crosses come into play.

</div>

<div>

```python
@vsc.covergroup
class my_covergroup(object):

   def __init__(self):
       self.with_sample(
           a=bit_t(4),
           b=bit_t(4)
       )
       self.cp1 = vsc.coverpoint(self.a, bins={
           "a" : vsc.bin_array([], [1,15])
           })
       self.cp2 = vsc.coverpoint(self.b, bins={
           "a" : vsc.bin_array([], [1,15])
           })

       self.cp1X2 = vsc.cross([self.cp1, self.cp2])
```

</div>

<div>

Using the *cross* method, we can create a cross between two existing coverpoints. In the example above, we have created a cross that has 225 cross bins.

</div>

### Sampling Coverage Data

<div>

One topic that we haven't yet looked at is how we will get the data to be sampled from the testbench to the covergroup for the PyVSC library to sample. PyVSC, like SystemVerilog, provides a *sample* method on the covergroup that is called by the testbench to cause the coverpoints and crosses to sample data. PyVSC provides two ways to channel data from the testbench to the covergroup to be sampled when the *sample* method is called.

</div>

<div>

</div>

<div>

```python
@vsc.covergroup
class my_covergroup(object):

   def __init__(self):
       self.with_sample(
           a=bit_t(4)
           )
       self.cp1 = vsc.coverpoint(self.a, bins={
           "a" : vsc.bin(1, 2, 4),
           "b" : vsc.bin(8, [12,15])
           })

cg = my_covergroup()
cg.sample(1)
cg.sample(12)
```

</div>

<div>

The first method for passing data to sample is to pass that data via the sample-method call. To use this method, your covergroup constructor must call the *with_sample()* method to specify the parameter names and types that will be accepted by the *sample* method. Note that the parameters need to be one of the PyVSC  types that we discussed last week. 

</div>

<div>

In the example above, the *sample* method will accept one parameter that is a 4-bit unsigned integer. Note that calling the *with_sample()* method will create attributes in the covergroup class that can be passed to coverpoint(s) as the variable to sample.

</div>

<div>

The second method for passing data for sampling to the covergroup is to specify the mapping when an instance of the covergroup class is created. 

</div>

<div>

```python
@covergroup
class my_covergroup(object):

    def __init__(self, a, b): # Need to use lambda for non-reference values
        super().__init__()

        self.cp1 = coverpoint(a,
            bins=dict(
                a = bin_array([], [1,15])
            ))

        self.cp2 = coverpoint(b, bins=dict(
            b = bin_array([], [1,15])
            ))


a = 0;
b = 0;

cg = my_covergroup(lambda:a, lambda:b)

a=1
b=1
cg.sample() # Hit the first bin of cp1 and cp2
```

</div>

<div>

This approach uses Python *lambda* expressions to allow the covergroup to query the current value of variables when the *sample* method is called.

</div>

### Reporting

<div>

Once we start collecting functional coverage data, we'll want to know which combinations have been covered and which have not been covered. PyVSC provides a couple of options for seeing what combinations have been covered and which have not. I'll cover a couple of the simple ones in this post, and we'll come back for the more-ambitious one in a future post.

</div>

<div>

The simplest approaches to querying coverage are via APIs and as text reports. Each instance of a covergroup class provides a *get_coverage() *method that returns the percentage of coverage goals that have been achieved. In other words, when no combinations have been covered, this method will return 0, and will return 100 when all have been achieved. 

</div>

<div>

PyVSC also provides several methods for creating a coverage report as a Python object, a string, and displaying the coverage report in the transcript. 

</div>

<div>

A textual coverage report looks something like this:

</div>

<div>

<div>

TYPE my_cg : 75.000000%

</div>

<div>

    CVP a_cp : 75.000000%

</div>

<div>

    Bins:

</div>

<div>

        a : 3

</div>

<div>

        a : 3

</div>

<div>

        a : 17

</div>

<div>

        a : 0

</div>

<div>

    INST my_cg : 75.000000%

</div>

<div>

        CVP a_cp : 75.000000%

</div>

<div>

        Bins:

</div>

<div>

            a : 3

</div>

<div>

            a : 3

</div>

<div>

            a : 1

</div>

<div>

            a : 0

</div>

<div>

    INST my_cg_1 : 100.000000%

</div>

<div>

        CVP a_cp : 100.000000%

</div>

<div>

        Bins:

</div>

<div>

            a : 3

</div>

<div>

            a : 3

</div>

<div>

            a : 3

</div>

<div>

            a : 6

</div>

</div>

<div>

The textual coverage report reports on each type of covergroup that is in use, and on every instance of that covergroup.

</div>

### Coming up Next

<div>

If you're interested in investigating  PyVSC a bit more, please see the [documentation on readthedocs.org](https://py-vsc.readthedocs.io/en/latest/). If you'd like to try out the library yourself, you can install it (Linux-only) for Python3 using *pip:*

</div>

<div>

% pip install pyvsc

</div>

<div>

The textual coverage report I showed above is interesting, but is a pretty simplistic way to look at coverage data. In my next post, I'll talk about how we can store our coverage data in a form that can be merged, reported, and displayed. 

</div>

<div>

```
Disclaimer

The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.
```

</div>

```

```
