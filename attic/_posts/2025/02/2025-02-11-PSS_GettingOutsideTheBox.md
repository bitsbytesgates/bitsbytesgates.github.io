---
layout: post
title:  "PSS: Getting Outside the Box"
date: 2025-02-11
categories: PSS
excerpt_separator: <!--more-->
mermaid: true
---
<p align="center">
<img src="{{ '/imgs/2025/02/PSSGettingOutsideTheBox_splash.png' | absolute_url }}"/> 
</p>

In the [last post](https://bitsbytesgates.com/pss/2025/02/04/Transpilation_and_PSS.html), 
we showed a SystemVerilog implementation of a PSS model
that printed "Hello World!". Interesting, perhaps, but quite a ways from 
being useful. In order to be useful, our PSS model needs to interact with
the environment surrounding it.

This post will cover more details about how a PSS model interacts with 
the environment around it, and look at an object-oriented interface between
PSS and a SystemVerilog environment.

<!--more-->

Both PSS and SystemVerilog are object-oriented languages. With language
interoperability, our goal is to keep each language's view of inteacting
with the "other" consistent with its own norms and conventions. Because
both languages are object-oriented, we want SystemVerilog to see its
interactions with PSS in object-oriented terms, and vice versa. 

While we're looking at an API in the context of our Zuspec PSS to SystemVerilog
transpiler, the goal is to define a language interoperability approach that
will work with many PSS tools.


Essentially, what we want is this:
<div class="mermaid" align="center">
flowchart TD
    subgraph Model1 ["PSS Model1"]
      BFM1_1["BFM1"]
      BFM1_2["BFM2"]
    end
    subgraph Model2 ["PSS Model2"]
      BFM2_1["BFM1"]
      BFM2_2["BFM2"]
    end

    subgraph Sim ["Simulation"]
      BFM1
      BFM2
      BFM3
      BFM4
    end
    Model1 --> Sim
    Model2 --> Sim

</div>

In other words, we want an integration mechanism that supports:
- Multiple, independent, instances of PSS model implementations that run concurrently.
- Multiple "logical streams" within each PSS model instance that
  interact with the SystemVerilog testbench

The biggest obstacle to achieving this is that both PSS and SystemVerilog
use global functions to implement interactions with the outside world. 
Global functions do not allow us to leverage object-oriented language constructs, so 
we will need to add some infrastructure on top.

# The Basics
PSS provides `import` functions to allow the PSS model to interact 
with the outside world. 

{% highlight pss %}
import target function void bfm_write(bit[32] addr, bit[32] data);
import target function bit[32] bfm_read(bit[32] addr);

component bfm_c {
  action write {
    // 
    exec body {
      bfm_write(...);
    }
  }
}
{% endhighlight %}

In the example above, two functions are declared -- one to perform
a read via a BFM, and one to perform a write. These are global
functions, accessible from all PSS contexts. 

The PSS LRM specifies how function parameter and return types are 
mapped to SystemVerilog and C. Theoretically, we could map
the functions themselves to `export` tasks and functions
in SystemVerilog.

{% highlight systemverilog %}
interface bfm;
  automatic task bfm_write(int unsigned addr, int unsigned data);
  endtask
  export "DPI-C" task bfm_write;

  automatic task bfm_read(output int unsigned data, input int unsigned addr);
  endtask
  export "DPI-C" task bfm_read;

endinterface

{% endhighlight %}

The example above shows SystemVerilog `export` tasks that mirror the
PSS `import` functions. Conceptually, calling `bfm_write` in PSS
would translate into a call to the `bfm_write` task in SystemVerilog. 
If we do that, though, we have no awareness of multiple PSS model
instances, and little implementation flexibility.  Fortunately, a 
little methodology and a little code generation can help us
get the object-oriented interfaces that we want!

## Introducing the API Class
Zuspec-SV (our PSS to SV transpiler) defines an Import API class that
contains a virtual method definition for each and every Import function
in the PSS model. 

{% highlight systemverilog %}

class pss_import_api extends backend_api;
   
  virtual task bfm_write(int unsigned addr, int unsigned data);
  endtask

  virtual task bfm_read(output int unsigned data, input int unsigned addr);
  endtask

endclass

{% endhighlight %}

The code above shows what would be produced for the `bfm_write` and
`bfm_read` functions shown earlier. The `import` API class inherits
from another API class that defines built-in functions that the PSS
model needs to access. Implementing the API can be done simply by
creating a class that inherits from `pss_import_api` and providing
implementations of the tasks and functions.

## Connecting our API Implementation
Once we have a SystemVerilog class with properly-implemented methods, 
we need to connect the PSS model implementation to it. This is where
things get a bit tool-specific. 

PSS defines a scenario model as the combination of a tree of 
*components* and a hierarchy of *actions* that execute in the
context of the components. `Zuspec-SV` refers to this 
component/action combination as an *Actor*. An *Actor* is 
implemented as a class that accepts the import API class 
as an argument to its constructor.

{% highlight systemverilog %}
    class pss_top__Entry_actor extends actor_c;
        pss_top comp_tree;
        pss_import_api api;
        executor_base_c default_executor;

        function new(pss_import_api api=null);
           ...
        endfunction
      ...
    endclass
{% endhighlight %}

As we saw in the *Hello World* example, we run a PSS model
by creating an instance of the *Actor* and calling the
*run* task. 

## Full Example
Let's take a step-by-step look at the simple API implementation example
in `zuspec-examples`. You can find the full example 
[here](https://github.com/zuspec/zuspec-examples/tree/main/sv/simple_read_write).

If you want to try this example yourself, be sure to update your `Zuspec-SV`
version. You can do so in the `zuspec-examples` project by running the
following command:

```
% ./packages/python/bin/pip install -U zuspec-sv
```

You will need at least version 0.0.9 to run this example.

Let's start with the PSS code:

{% highlight pss %}
import target function void bfm_write(input bit [32] addr, input bit [32] data);
import target function bit[32] bfm_read(input bit [32] addr);

component pss_top {

    action Entry {
        exec body {
            bit[32] data;
            bfm_write(0, 0x12345678);
            bfm_write(4, 0x12345678);
            data = bfm_read(4);
            message(LOW, "PSS read data %d", data);
        }
    }
}
{% endhighlight %}

We declare two import functions -- one that writes data via a bus functional 
model (BFM), and one that reads data via a bus functional model.

We then declare a (very) simple PSS Action that calls the `write` function
twice, calls the `read` function once, and displays the return value.

### Implementing the API

`Zuspec-SV` creates the following API class based on the import functions
declared within the PSS model:

{% highlight systemverilog %}
    class pss_import_api #(type BaseT=zsp_sv::empty_t) extends backend_api #(BaseT);
        virtual task bfm_write(
                input int unsigned addr,
                input int unsigned data);
            `ZSP_FATAL(("Import function bfm_write is not implemented"));
        endtask
        virtual task bfm_read(
                output int unsigned __retval,
                input int unsigned addr);
            `ZSP_FATAL(("Import function bfm_read is not implemented"));
        endtask
    endclass
{% endhighlight %}

Note that the signature of the `bfm_read` task is a bit different. This 
is because SystemVerilog tasks do not support a return value, so the
result must be returned via an output parameter. Fortunately, this is
all well-defined by the rules in the PSS LRM.


{% highlight systemverilog %}
package simple_read_write_pkg;
    import pss_types::*;

    class api_impl extends pss_import_api;
        virtual task bfm_write(
            input int unsigned addr,
            input int unsigned data);
            $display("bfm_write: 'h%08h 'h%08h", addr, data);
        endtask

        virtual task bfm_read(
            output int unsigned __retval,
            input int unsigned addr);
            $display("bfm_read: 'h%08h", addr);
            __retval = 42;
        endtask
    endclass

endpackage
{% endhighlight %}

Our testbench environment is responsible for providing code, like 
that shown above, to provide an implementation for the import functions.
Our implementation, here, is quite simple: We print a message when either 
task is called, and return the value `42` from the `read` function.

{% highlight systemverilog %}
module simple_read_write;
    import simple_read_write_pkg::*;
    import pss_top__Entry_pkg::*;

    initial begin
        automatic api_impl api = new();
        pss_top__Entry actor = new(api);

        actor.run();
    end
endmodule
{% endhighlight %}

Finally, we can put everything together and run our PSS model. The 
code above creates an instance of our implementation of the API 
class, and passes it to the constructor of our PSS `Actor` class.
When we run the simulation, we should see something like the following:

```
bfm_write: 'h00000000 'h12345678
bfm_write: 'h00000004 'h12345678
bfm_read: 'h00000004
PSS read data 42
```


# Summary and What's Next
We've looked at the funadamentals of a strategy to integrate two 
object-oriented languages, via global functions, 
in an object-oriented way. This approach
gives us flexibility in changing how APIs are implemented using 
the standard object-oriented approaches that we're used to. 

But, we're not done just yet. You can likely imagine how this 
approach supports multiple indepdent PSS model instances. But,
how does it support API implementations coming from different
sources, and multiple independent streams of activity within
one PSS model? In the next post, we'll start to dig into how
to interface PSS to verifcation IP (VIP) and bus functional models (BFMs).


