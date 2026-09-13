---
layout: post
title:  "Re-Evaluating EDA DSLs in the AI Era"
date: 2025-08-18
categories: Zuspec
excerpt_separator: <!--more-->
mermaid: true
---

I've been looking for a new hardware-centric design language for the last couple of years. 
Or, more precisely, I've been looking for a hardware-centric design language that would
allow me to realize my ideal silicon design flow. 
- Must support using the same language to refine a design through a series of abstraction levels -- from architecture down to RTL
- Must support fast iteration by supporting both dynamic/executable and static/formal/symbolic evaluation of the same description
- Must support capturing the test, verification, and firmware aspects of a design in addition to the hardware.
- Must be interoperable with existing design flows and environments

Until recently, I've assumed that a dedicated domain-specific language would be required
to meet these requirements. However, some new observations about languages and 
large language models, coupled with some technical learning has me seeing a different 
path forward for my little project -- as well as for future EDA domain-specific languages.

<!-- more -->

# Why EDA Domain-Specific Languages?
If you work in silicon design, you're very familiar with a set of domain-specific languages (DSLs),
such as SystemVerilog and VHDL,  that are used to specify a model of your design intent, 
verify its logical correctness, and synthesize it to a gate-level representation that can
be programmed onto an FPGA or fabricated as an ASIC. These languages exist precisely because 
of the domain (hardware)-specific semantics that we need to capture, and how distinct 
those semantics are from those captured by software languages.

{% highlight python3 %}
module counter(
    input clock, reset, enable,
    output reg [31:0] count);

  always @(posedge clock or posedge reset) begin
    if (reset) begin
      count <= 0;
    end else if (enable) begin
      count <= count + 1;
    end
  end
endmodule
{% endhighlight %}

Even a simple counter, like the code above, highlights some of the key semantics
unique to hardware.
- implicit entrypoint -- nothing "calls" the always block
- parallel evaluation -- always blocks run concurrently
- synchronized assignment -- the new value of 'count' doesn't take effect immediately

Typical implementation, such as an event-driven simulator, is very different from 
how this code would be evaluated if it was written in a software language. Having a
language that directly captures the semantics of synchronous digital logic makes us
much more productive.

There certainly are advantages to this approach of creating specific languages for
capturing hardware semantics. We can use whatever syntax we find to most-accurately
convey the semantics that we're capturing -- for example, using '<=' above to denote
an assignment that doesn't take effect immediately. Having a full, bespoke, language 
also often encourages new applications for the language. For example, Verilog started
off as a simulation language. It was only later that tools started to synthesize
gates from a Verilog description.

# The Cost of EDA Domain-specific Languages
For all the benefits of having full EDA domain-specific languages, there are 
significant drawbacks. 

For one, the cost of designing such a language is high 
precisely because we often want to have standard software features and semantics
alongside our hardware-specific semantics. Creating a whole language necessitates
designing all the details -- not just the ones that we're most interested in 
as hardware designers.

When it comes to languages, community and popularity matter. Community and popularity
lead to tools and libraries built around the language, and people talking about 
how to accomplish things with a language. As hardware designers, 
we represent a very small group compared to the much larger community of software 
engineers. A keynote speaker at DAC this year cited a statistic that the number of 
hardware engineers (inclusive of all disciplines) was less than 10% the number of 
software engineers. Even a language that is wildly popular among hardware engineers
would still be considered a niche language in the broader industry. 

Generative AI and LLMs are driving what appears to be a consolidation around 
popular languages recently. In their [August report](https://www.tiobe.com/tiobe-index/), TIOBE (software security analysts, that also track langauge popularity) note a strong
increase in the popularity of Python driven by the proficiency of AI assistants with
Python. Given the cost of training a large language model (LLM), language popularity is likely to become a self-reinforcing pattern: increasing popularity leads to better 
results from LLMs, which further increases the popularity of a language.

# Alterative Approaches

Over the years, at least two alternatives to a full domain-specific language have been
used: class libraries and embedded domain-specific languages. 

## Class Libraries

A class library is the lightest-weight approach to capturing domain-specific semantics.
In this approach, the host language is used as-is and domain-specific semantics are
captured by creating instances of classes and calling methods from the class library.
Both UVM and SystemC Follow the class-library approach to domain-specific semantics. 

This approach encounters challenges when the semantics to be captured run counter to
the host language, or the host language doesn't support capturing them. For example,
introspecting the value of class fields is of high interest in both SystemC and UVM. 
UVM uses a special set of macros to register user-defined class fields with the 
library.

{% highlight systemverilog %}
class ABC extends uvm_object;
	rand bit [15:0] 	m_addr;
	rand bit [15:0] 	m_data;

	`uvm_object_utils_begin(ABC)
		`uvm_field_int(m_addr, UVM_DEFAULT)
		`uvm_field_int(m_data, UVM_DEFAULT)
	`uvm_object_utils_end
endclass
{% endhighlight %}

Exposing access to fields in this way is both a bit cumbersome for the user,
and quite possibly computationally inefficiency because the implementation
must cover so many cases in a generic fashion.

Class libraries also tend to be tightly locked to the their host language
for evaluation. Because a processing tool isn't able to look at the
structure of user-defined functions, there isn't an opportunity to represent
them in a different language. If a class library-based description needs to 
target a different language, it typically will build an internal data 
model based on running the model and generate code from that data model.

## Embedded Domain-Specific Languages

If a class library is insufficient to capture the semantics we require, another
approach is to create an embedded domain-specific language (eDSL) using a language
feature called operator overloading. Not all languages support operator overloading
-- for example, SystemVerilog does not. For those that do, operator overloading 
allows us to redefine the implementation of standard operators in specific cases.
This can allow us to create the illusion of writing a different language inside
the confines of our host language.

[SystemC Verification (SCV) library](https://systemc.org/overview/systemc-verification/) 
provides one example of using operator 
overloading to capture random constraints. The PyVSC library offers another.

{% highlight python3 %}
    @vsc.constraint
    def ab_c(self):
       self.a > self.b
{% endhighlight %}

Python is feature-rich when it comes to operator overloading. The constraint
above looks exactly how you would intuitively expect a 'greater-than' constraint
to look. But there are limits. 

{% highlight python3 %}
    @vsc.constraint
    def ab_c(self):
        self.a == 5

        with vsc.if_then(self.a == 1):
            self.b == 1
        with vsc.else_if(self.a == 2):
            self.b == 2
{% endhighlight %}

Python doesn't allow us to override statements, so we need to invent a new
way of capturing constraint statements like if/elsif/else.

Furthermore, Python doesn't allow us to override some operators. So, we need
to invent another way of capturing logical `and`, logical `or`, and the `in`
operator.

Finally, the code above doesn't really *look* like good Python code. Tools
like linters are likely to complain. LLMs will also not know how to create
this content unless specially prompted.

# Back to Python

So, where does that leave us? Well, until recently, right back to needing a full language to
satisfy the requirements. But, as it turns out, Python has a few more features to offer.

Unlike many languages, Python supports introspecting and rewriting code at the [abstract 
syntax tree (AST) level](https://docs.python.org/3/library/ast.html). This feature is mostly
used by linting tools, but is also used by the [Pytest](https://docs.pytest.org/en/stable/) 
tool to provide more detail about assertions that fail.

This suggests a new way to look at a Python description:

{% highlight python3 %}
class MyClass(vsc.RandClass):
    a : vsc.rand[vsc.bit[32]]
    b : vsc.rand[vsc.bit[32]]

    @vsc.constraint
    def ab_c(self):
        self.a == 5

        if self.a == 1:
            self.b == 1
        elif self.a == 2:
            self.b == 2
{% endhighlight %}

Specifically, all syntax is plain Python syntax -- no operator overloading that might
confuse linters or LLMs. We still can use markers, such as base classes and 
decorators, to identify special regions where the semantics differ from plain 
Python execution. For example, the @vsc.constraint decorator marks a method that
contains constraints. Instead of executing these regions to build up a data structure,
we simply use Python's AST introspection to build the data structure directly.
This allows us to leverage Python syntax, and all the tools that understand it, while
layering our own special semantics on top.

# Next Steps

As I mentioned at the beginning of this post, my key interest is in having a modeling
language that supports capturing very abstraction descriptions of hardware behavior
all the way to RTL. While I could start with any of the abstraction levels, I've 
decided to start with RTL because that's where all abstraction levels eventually end 
up. We'll start looking at a Python-encapsulated description of RTL in the next post.


