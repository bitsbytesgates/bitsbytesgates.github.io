---
layout: post
title:  "Re-Evaluating EDA DSLs: Becoming the Compiler"
date: 2025-08-23
categories: Zuspec
excerpt_separator: <!--more-->
mermaid: true
---

A key benefit of full languages is having full control over processing
the language: being the compiler.  Having full control over language
processing is exactly what enables us target simulation and FPGA bitstream
with the same SystemVerilog source simply by specifying the same source
to different toolchains. Fortunately, Python's dynamic nature gives us 
all the tools we need to "become the compiler" for portions of the 
Python description that we care about. 

<!-- more -->

# A Simple Counter

Let's start with an example. The code below represents the behavior of 
a very simple counter in Verilog:

{% highlight systenverilog %}

module counter(
  input             clock,
  input             reset,
  output reg[31:0]  count);

  always @(posedge clock or posedge reset) begin
    if (reset) begin
      count <= {32{1'b0}};
    end else begin
      count <= count + 1;
    end
  end

endmodule

{% endhighlight %}

When we process this description to create an implementation, there
are a few things that we need to know:

- The region of interest -- what is a class, module, interface, etc?
- Data member types and kinds -- local data vs port with directionality
- Logic/behavior inside the region and when it's activated

A Verilog-based tool establishes these key attributes by lexically processing
the input text. 

Let's create an equivalent representation in Python using our Zuspec 
library.

{% highlight python3 %}

import zuspec.dataclasses as zdc

@zdc.dataclass
class Counter(zdc.Component):
    clock : zdc.Bit = zdc.input()
    reset : zdc.Bit = zdc.input()
    count : zdc.Bit[32] = zdc.output()

    @zdc.sync(clock=lambda s:s.reset, reset=lambda s:s.clock):
    def inc(self):
        if self.reset:
            self.count = 0
        else:
            self.count += 1
{% endhighlight %}

From one perspective, this is just a Python class that conforms to
the Python's syntactic and semantic rules. But, we've also encoded
some special domain-specific information:

- The base class is `Component`. A processing tool can identify the "kind" 
  of region based on the base type.
- We have typed fields that have direction information attached to them.
- We have tagged a method with a `decorator` named "sync". This identifies
  the method as being evaluated with synchronous semantics.

You might be asking how this is any different from a class library,
such as SystemC or pyuvm. This is exactly the right question to ask, since
it's at the crux of how this approach is different.

# Becoming the Compiler

If we were implementing the Zuspec library as a class library, we would have
each of the key elements above (Component, @sync, input, output) construct
a portion of a description that we could execute. For example, we might 
create an implementation to generate Verilog source. But, committing to 
an implementation is limiting. What if we, instead, wanted to test the 
Python model by simulating it in Python? We would probably need a 
different class library implementation. We'll definitely want to use 
different implementations for different modules in the system across the
design cycle. Managing which class library implementation each module 
uses gets complicated very quickly.

How else can we approach this problem? Like a compiler, of course. And, Python's
dynamic programming aspects make this much more straightforward than any other
language that I'm currently aware of.

<p align="center">
<img src="{{ '/imgs/2025/08/model_transform.png' | absolute_url }}"/> 
</p>

So, what does this look like? 
- Treat user input (Counter class above) as having no implementation
- Doing something with the input requires a transformation -- a "compiler"
- Transformers take the user-specified class as input and return
  - Another Python class type
  - A Python data structure with information about a non-Python implementation

Using this approach allows different transformations to be used for 
different modules in the design.

# Anatomy of a Type Transformer

Type transformers typically use the visitor pattern, using a visitor that
is aware of key elements of the domain-specific specification.

{% highlight python3 %}

    class MyTransform(api.Visitor):
        _result : str = ""

        def transform(self, t) -> str:
            self._result = ""
            self.visit(t)
            return self._result

        def visitComponentType(self, t):
            self.print("MyV.visitComponentType")
            return super().visitComponentType(t)
        
        def visitInput(self, f):
            self.print("visitInput: %s" % f.name)

        def visitOutput(self, f):
            self.print("visitOutput: %s" % f.name)

        def visitExec(self, name, e):
            self.print("visitExec: %s" % name)

        def print(self, m):
            self._result += m + "\n"

{% endhighlight %}

In this case, we're simply transforming a type model into a string 
that displays the content of the model. But, we could use the same
approach to transform the type to Verilog. And, because the model 
is a specification without a class-library implementation, both
of these implementations (and more) can easily co-exist.

# Next Steps

In this post, we've looked at an approach to capturing hardware domain
semantics in Python such that we keep the description independent 
of the implementation in the same way a full-custom domain-specific
language does. Moving forward, we'll focus on getting an implementation
path in place that will let us create Verilog and start to explore
some of the ways that capturing RTL in Python boosts our productivity.


