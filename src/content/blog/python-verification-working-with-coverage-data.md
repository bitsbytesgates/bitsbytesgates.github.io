---
title: 'Python Verification: Working with Coverage Data'
date: '2020-04-25T18:38:00.001-07:00'
tags:
- functional coverage
- Python
- Cocotb
- PyVSC
- UCIS
- constrained random
- Accellera
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-806412704696948975
blogger_orig_url: https://bitsbytesgates.blogspot.com/2020/04/python-verification-working-with.html
modified_time: '2020-04-25T18:38:37.778-07:00'
image: https://1.bp.blogspot.com/-PCp3xC32PWs/XqTlJm0XgfI/AAAAAAAAC7A/J4RwJlYZtWgHDRQaz6V0vTh4IxQX8n1CwCLcBGAsYHQ/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-4.png)](/legacy-img/splash-4.png)

</div>

  
  
Before jumping into this week's post, I wanted to offer a bit of an apology to my readers. I recently realized that, despite being a Google property, Blogger only notifies authors of comments for moderation if the author has specifically registered a 'moderator' email with the site. So, apologies to those of you that have commented on posts directly on the Blogger site and watched those comments hang out in limbo indefinitely. I should now receive notifications of new comments.  
  
In my [last post](/blog/python-verification-stimulus-and-coverage-functional-coverage/), we looked at modeling and sampling functional coverage in Python using the Python Verification Stimulus and Coverage (PyVSC). In that post, I showed how a textual coverage report could be generated to the console by calling an API. But, there is much more that we want to do with functional coverage data. The key question is: how do we store and manipulate it?  
  

### Storing Coverage Data

<div>

There are two big motivations for storing coverage data. The first is that we often wish to aggregate coverage across a large number of tool runs. In order to do that, we need a way to persist the coverage data collected by each individual tool run. The second is that we want to run analysis on the collected and aggregated coverage data. We want a way to browse through the data interactively, and create nice-looking reports and charts.

</div>

- - 

### Standard Coverage Models

<div>

Storing coverage data isn't much different than storing any other data. The first big question to answer is whether there is a standard way of of representing the data, or whether we need to invent one. While I've certainly had fun in the past inventing new formats for representing and storing data, considering all the requirements and designing in appropriate features to represent all the key features of a given type of data is a time consuming problem. Certainly something that should be undertaken as a last resort.

</div>

<div>

The good news is that there are several existing formats for representing coverage. The bad news is that the vast majority are focused on representing code coverage data (eg [Coburtura](https://cobertura.github.io/cobertura/)), not functional coverage data. That said, there is one industry standard for representing functional coverage and code coverage: [Accellera Unified Coverage Interoperability Standard](https://www.accellera.org/downloads/standards/ucis). 

</div>

<div>

While the  UCIS defines several things, it doesn't define a standard database format. That said, what it does define is very useful. Specifically it defines:

</div>

- A data model for representing functional coverage, code coverage, and assertion coverage
- A C-style API for accessing and modifying this data model
- An XML interchange format to assist in moving data from one database implementation to another. In a pinch, the XML interchange format can even be used as a very simplistic database.

<div>

Design is tough, so it's almost always most efficient to make use of the work of a committee of smart and capable people instead of starting over. UCIS is certainly not perfect. There are some "bugs" in the spec, and some internal inconsistencies. That said, it's far better than starting with a blank sheet of paper. The next challenge was adapting UCIS to Python.

</div>

- - 

### PyUCIS Library

<div>

Much of my work recently has been in Python, so I wanted a way to work with the UCIS data model in Python. The [PyUCIS library](https://github.com/fvutils/pyucis) is a pure-Python library for working with the UCIS data model. A block diagram of the architecture is shown below. 

</div>

<div>

[<img src="/legacy-img/PyUCIS_Diagram.png" width="640" height="291" />](/legacy-img/PyUCIS_Diagram.png)

</div>

#### Front-End API

<div>

The core of the PyUCIS library is an implementation of the UCIS API. Remember that the API defined by the UCIS is a C-style API, while Python is much more object-oriented. I initially decided to implement just an object-oriented version of the UCIS API, but then realized that reusing existing code snippets written in C would be much harder without an implementation of the C-style API. Fortunately, building a C-style compatibility API on top of the object-oriented one was fairly straightforward.

</div>

#### Backend

<div>

The PyUCIS library uses a back-end to store the data being accessed via the front-end API. The PyUCIS library currently implements two back ends: an in-memory back-end, and an interface to existing C-API implementations of the UCIS API.

</div>

<div>

The in-memory back-end stores coverage data in Python data structures. While it's not possible to persist the data model directly, the contents can be saved to and restored from the XML interchange format specified by the UCIS.

</div>

<div>

The C-library back-end uses the [Python ctypes library](https://docs.python.org/3/library/ctypes.html) to call the UCIS C API as implemented by a tool-specific shared library. This allows PyUCIS to access data in databases implemented by tools that support UCIS.

</div>

<div>

While PyUCIS doesn't currently implement its own native database for storing coverage data, it's likely that it will in the future. Fortunately, Python provides an SQLite database as part of the core interpreter installation. Stay tuned here.

</div>

#### Built-in Apps

<div>

The final part of the PyUCIS library are a set of built-in apps. These are used to perform simple manipulations on the coverage data and create outputs. Currently, PyUCIS only contains one built-in app: reading and writing the UCIS XML interchange format. That said, there are a couple planned on the roadmap:

</div>

<div>

- A merge app to combine data from multiple UCIS data models
- A report app to produce a textual or HTML coverage report

</div>

- - 

### PyUCIS Apps

<div>

The top layer of the PyUCIS architecture diagram are external applications that use the PyUCIS API. At the moment, there is only one and it's a proof of concept. [PyUCIS Viewer](https://github.com/fvutils/pyucis-viewer) is a Python Qt5-based GUI for viewing coverage data.

</div>

<div>

[<img src="/legacy-img/PyUCIS_Viewer.png" width="400" height="237" />](/legacy-img/PyUCIS_Viewer.png)

</div>

<div>

While the viewer is certainly primitive (and incomplete) at the moment, hopefully this provides some ideas for what can be done with the data accessed via the PyUCIS API.

</div>

  

### Next Steps

<div>

PyUCIS is a pretty early-stage tool. I'm using it to save coverage data from the PyVSC library, and to produce some simple text coverage reports, but there's still quite a bit to do. As always, if you'd like to contribute to this or other projects, I'd welcome the help. 

</div>

<div>

In the next post, I'll return the [Python Verification Stimulus and Coverage](https://github.com/fvutils/pyvsc) (PyVSC) library to look at modeling constrained-random stimulus. Until then, stay safe!

</div>

```
Disclaimer

The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.
```
