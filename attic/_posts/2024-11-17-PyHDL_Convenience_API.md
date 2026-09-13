---
layout: post
title:  "Easy Access to Python Libraries with a SystemVerilog Convenience API"
date: 2024-11-17
categories: Python
excerpt_separator: <!--more-->
mermaid: true
---

<p align="center">
<img src="{{ '/imgs/2024/11/PyHDL_IF_Convenience_API.png' | absolute_url }}"/> 
</p>

In the last post 
([DPI Isn't Enough: Making Python Part of Your SV Testbench](https://bitsbytesgates.com/python/2024/11/04/DPI_Isnt_Enough_MakingPythonPartOfYourSVTB.html)), 
we looked at how to use the [PyHDL-IF](https://fvutils.github.io/pyhdl-if) library 
to call SystemVerilog from Python. 
This is, in some sense, the most challenging Python and SV interaction to implement. 
And, as the title suggests, it's something that definitely requires
more than just the raw features of the SystemVerilog DPI.

That said, there are many cases where we simply want to access some functionality
that is readily-available in Python and not readily-available in SystemVerilog. 
In these cases, we don't need to call back into SystemVerilog from Python. 
Arguably, we **could** simply use SystemVerilog DPI To call the relevant 
[Python C API](https://docs.python.org/3/c-api/). The PyHDL-IF library uses the
Python C API internally to implement cross-calling between SystemVerilog and
Python, and it's always good to have it as an option. The downside is that code that
uses the C API tends to be rather verbose, so let's see if we can improve the
situation with a SystemVerilog convenience API.

<!--more-->

# PyHDL-IF Architecture

The PyHDL-IF implements the interface between Python and HDLs with a layered architecture.

<div class="mermaid" align="center">
block-beta
columns 1
  block:UIApp
  columns 1
    TitleApp["App-Specific Interfaces"]
    style TitleApp fill:transparent,stroke:transparent
    block:UICodeAPIs
      UICall["Method Call"]
      UITlm["TLM"]
    end
  end
  block:UIMid
  columns 1
    TitleMid["Convenience API"]
  end
  block:UIDirect
  columns 1
    TitleDirect["CPython API"]
  end
</div>

In the [last post](https://bitsbytesgates.com/python/2024/11/04/DPI_Isnt_Enough_MakingPythonPartOfYourSVTB.html),
we looked at an example built on top of the 'Call' API. This is the API that manages blocking cross-calling
between Python and a HDL. Using this API requires us to mark up our Python API with decorators and generate
SystemVerilog source to implement the API in the SystemVerilog environment. 

We could use this same approach to "wrap up" the API of a Python library and expose it to SystemVerilog. But,
it often makes sense to use one of the lower-level interface APIs. Let's look at an example.

# Loading JSON Data

UVM testbench environments can be highly-configurable when used for complex, configurable IPs. Capturing 
the configuration data in a JSON or YAML file is helpful in keeping all the settings in one place. 
The challenge arises when we want to acccess that data from our UVM environment. Current options include:

- **Integrate a parser implemented in C via SV DPI** 
- **Implement a parser in SystemVerilog**

Both of these involve a fair amount of (likely project-specific) work and debugging. In contrast, reading 
a JSON file in Python and iterating through the top-level entries is trivial:

{% highlight python %}
import json

datafile = "data1.json"

fp = open(datafile, "r")
data_s = fp.read()
fp.close()

data = json.loads(data_s)
keys = data.keys()

for i in range(len(keys)):
    print("Key: %d %s" % (i, keys[i]))

for key in keys:
    print("Key: %s" % key)

{% endhighlight %}

# SV/Python Convenience API
Using the PyHDL-IF library, we actually have several options for leveraging Python to access JSON data. 
Let's look at using [SystemVerilog convenience API](https://fvutils.github.io/pyhdl-if/sv_api.html#systemverilog-api). 
This API is object-oriented and higher level than the raw CPython API (which we also can use). 

{% highlight verilog %}
    import pyhdl_if::*;

    initial begin
        automatic string datafile;
        automatic py_object json, data_fp, data_s;
        automatic py_dict data;
        automatic py_list keys;

        if (!$value$plusargs("data=%s", datafile)) begin
            $display("Error: no datafile specified");
            $finish;
        end

        py_gil_enter();

        // Import Python's 'json' package 
        json = py_import("json");

        // Open and read the specified data file
        data_fp = py_call_builtin("open", py_tuple::mk_init('{
            py_from_str(datafile),
            py_from_str("r")}));
        data_s = data_fp.call_attr("read"); 
        data_fp.call_attr("close");

        // Parse the data
        data = py_dict::mk(json.call_attr("loads", 
            py_tuple::mk_init('{data_s})));

        // Get the list of keys
        keys = data.keys();

        // Iterate based on the list size
        for (int i=0; i<keys.size(); i++) begin
            $display("Key: %0d %0s", i, keys.get_item(i).to_str());
        end

        // Use an iterator
        for (py_iter i=keys.iter(); i.valid(); ) begin
            automatic py_object it = i.next();
            $display("Key: %0s", it.to_str());
        end

        py_gil_leave();
    end
{% endhighlight %}

The code above accomplishes the same thing as the pure-Python code that reads a JSON file. 
While the SystemVerilog code involves roughly twice as many lines as the pure-Python code,
it *is* pure SystemVerilog. And, it didn't require us to do any code generation or any
special "tagging" of Python code. Let's look in more detail at what's happening in this
code, and how the PyHDL-IF convenience API helps us out.

## Calling Built-in Functions
One of the first things we need to do is to read the contents of the JSON data file. 
The Python `open` function is a built-in. This means that it's not contained in 
another package or module that needs to be imported.

{% highlight verilog %}
        data_fp = py_call_builtin("open", py_tuple::mk_init('{
            py_from_str(datafile),
            py_from_str("r")}));
{% endhighlight %}

PyHDL-IF provides the `py_call_builtin` function to call built-ins. The PYthon C API
requires function arguments to be Python objects, and to be packed in a Tuple. The
`py_tuple::mk_init` function handles creating the properly-sized tuple. The helper
function `py_from_str` creates a Python string object from a SystemVerilog string value.

## Calling Methods
The `open` function returns a Python stream object. We want to read all the data from
the file and then close the file.

{% highlight verilog %}
        data_s = data_fp.call_attr("read"); 
        data_fp.call_attr("close");
{% endhighlight %}

The `call_attr` function implemented by the `py_object` SV class handles looking up the
requested attribute within the Python object and calling it. In this case, 
both `read` and `close` methods take no arguments.

{% highlight verilog %}
        // Parse the data
        data = py_dict::mk(json.call_attr("loads", py_tuple::mk_init('{data_s})));
{% endhighlight %}

Python views everything as an object. Consequently, the `loads` method within
the `json` package is just an attribute with the json package object. This means
that we can call it in the same way we would invoke a method on a class-type object.
We happen to know that the return of the `loads` method is a Python dictionary (`dict).
Therefore, we can directly convert the return value to a `py_dict` object. This allows
us to use convenience methods to access the data.

## Iterating
Now that we have a Python dictionary containing the JSON data, we likely will 
want to iterate over it. The PyHDL-IF objects also provide some convenience 
APIs to help simplify this process as well.

{% highlight verilog %}
    // Get the list of keys
    keys = data.keys();

    // Iterate based on the list size
    for (int i=0; i<keys.size(); i++) begin
        $display("Key: %0d %0s", i, keys.get_item(i).to_str());
    end
{% endhighlight %}

A Python dictionary returns it key set as a list. Perhaps the simplest way
to iterate over the items of list is to get each element via its index,
as shown above.

{% highlight verilog %}
    // Use an iterator
    for (py_iter i=keys.iter(); i.valid(); ) begin
        automatic py_object it = i.next();
        $display("Key: %0s", it.to_str());
    end
{% endhighlight %}

The list object also implements Python's *iteration* interface. PyHDL-IF
also provides helper types and functions around this interface. We can
still use a SystemVerilog *for* loop. The difference is that the iteration
variable is actually a Python iterator object. Here, again, the convenience
API simplifies the user code compared to using the raw CPython API.


# Conclusion
The PyHDL-IF Python convenience API enables you to call Python code from
SystemVerilog without the need to generate any application-specific 
code, and with less work that directly using the CPython API would require.
This reduction of effort makes is incredibly simple to augment the capabilities
of your existing testbench with those of a library from the vast Python ecosystem.

# Resources
- [PyHDL-IF Documentation](https://fvutils.github.io/pyhdl-if/)
- [PyHDL-IF SV Convenience API](https://fvutils.github.io/pyhdl-if/sv_api.html)
- [CPython API](https://docs.python.org/3/c-api/index.html)
