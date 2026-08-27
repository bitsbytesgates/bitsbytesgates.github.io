---
title: 'Embedded Languages: The Space Between Language and API'
date: '2019-07-27T16:19:00.004-07:00'
tags:
- Domain-Specific Language
- Design Abstraction
- Chisel
- SystemC
- UVM
- Python
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-728335647313527081
blogger_orig_url: https://bitsbytesgates.blogspot.com/2019/07/embedded-languages-space-between.html
modified_time: '2019-07-27T16:19:53.351-07:00'
image: https://1.bp.blogspot.com/-NYPCqfsDHYw/XTy9gSEk_7I/AAAAAAAACpU/UligMiB6B3UXRWriR2GzxDE6sce6J4dtQCLcBGAs/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-3.png)](/legacy-img/splash-3.png)

</div>

We're all familiar with general-purpose programming language for capturing general algorithms, but there are also a sizeable group of domain-specific languages that exist to efficiently capture reasoning in a specific domain -- whether that's hardware design (Verilog, VHDL), database manipulations (SQL), or models at a high level of abstraction (UML/xtUML). These languages exist because the overhead is enormous for a domain expert to capture a problem in their given domain using a general-purpose programming language and APIs.  
  
One of my favorite examples showing the motivation for domains-specific languages is spreadsheets. A spreadsheet is a language based around a namespace (table) where elements (cells) in the namespace are addressable by their coordinates, and whose values are represented by equations that may include references to other elements in the namespace. Just think how easy it is to setup a simple spreadsheet to do some what-if analysis, and how difficult it would be if you had to write a program to perform those calculations instead!  
  
Simplistic though it may be, the spreadsheet perfectly captures the motivation behind domain-specific languages: focus on capturing the *what* of a given domain -- the key attributes, key relationships, and key operations -- and not on the *how* of the mechanics of how these elements would be represented in a general-purpose programming language. In short, a domain-specific language provides a user interface to complex algorithms phrased in familiar terms -- at least to someone knowledgeable in a that specific domain.  
  
Taking the step of capturing domain knowledge in a new domain-specific language is a big step, though. There are a variety of reasons to defer taking that step or, perhaps, to not take that step at all.  Sometimes an entire language isn't required to implement the desired user interface. Sometimes it's desirable to have some benefits of a general-purpose language without the overhead of designing an entirely new all-in-one domain-specific and general-purpose language. The embedded domain-specific language is one approach that has been used to bring some benefits of a domain-specific language into an existing general-purpose programming language. The general approach is to use existing general-purpose language constructs, such as pre-processor macros and operator overloading, to build constructs with a domain-specific language feel within an existing language.  
  
Within the set of embedded domain-specific languages that I'm aware of, I'm actually aware of three key styles of embedded a domain-specific language inside an existing general-purpose programming language.  
  
**Decorations and Annotations**  
One of the simplest domain-specific language integration techniques that I'm aware of is the decorator/annotation pattern. This style of domain-specific language is used to statically register classes or functions with a library framework.  

> class slave_address_map_info extends uvm_object;  
>   protected int min_addr;  
>   protected int max_addr;  
>   function new(string name = "slave_address_map_info");  
>     super.new(name);  
>   endfunction  
>   \`uvm_object_utils_begin(slave_address_map_info)  
>     \`uvm_field_int(min_addr, UVM_DEFAULT)  
>     \`uvm_field_int(max_addr, UVM_DEFAULT)  
>   \`uvm_object_utils_end  
>   // ...  
> endclass

<div>

While there are many examples of a decorator/annotation eDSLs, the example that came to mind first for me was the Universal Verification Methodology (UVM). UVM is a class library for functional verification built on top of the SystemVerilog domain-specific language. Two common operations that users of the UVM need to perform is registration of key user-defined types with the class library, and writing functions to clone, compare, and print class instances. Performing these operations in plain old code is time-consuming and error-prone. UVM provides a set of macros that allow the user to declare the existence of their user-defined class type and the fields within it (shown above highlighted in blue). 

</div>

<div>

The macros (SystemVerilog's key feature supporting embedded domain-specific languages) above cause the class type to be registered with the UVM class library, and implement functions for comparing, displaying, and cloning an object of this type. All from a high-level specification.

</div>

  
**Enmeshed eDSL**  
Our next level of eDSL integration starts to look a bit more like a language. An Enmeshed eDSL provides the user statements that look a bit like a programming language, but are really driving algorithms behind the scenes. I call this style of integration Enmeshed because the user's general-purpose programming language code interacts closely with the algorithms driven by the eDSL as program runs.  

> class item : public rand_obj {  
> public:  
> item(rand_obj\* parent = 0) : rand_obj(parent), src_addr(this), dest_addr(this) {  
> src_addr.addRange(0, 9);  
> src_addr.addRange(90, 99);  
> constraint(dest_addr() % 4 == 0);  
> constraint(dest_addr() \<= reference(src_addr) + 3);   
> }  
>      
> randv\<uint\> src_addr;  
> randv\<uint\> dest_addr;  
> };

Our example of an Enmeshed eDSL comes courtesy of [CRAVE](https://github.com/agra-uni-bremen/crave-bundle), a constrained-random data generation package for the C++-based [SystemC](https://www.accellera.org/downloads/standards/systemc) library. As you can see, the highlighted sections above look a bit more like a language. In this case, these are constraint expressions that control a constraint solver such that the values of *src_addr* and *dst_addr* obey the relationships established by the expressions.  
When the user's program runs, it creates instances of classes like the one shown above, calls an API to create new random values for the random fields, and uses the values from those fields directly. In short, I consider the eDSL enmeshed with the host language because execution of the host language is interleaved with (effective) execution of the eDSL. The host language takes a primary role, and calls the eDSL code to provide specific services to the primary application.  
  
**Encapsulated eDSL**  
Our final level of eDSL integration is an embedded DSL that defines a new domain within the host language. There are several hardware-description languages embedded in general-purpose programming languages that fit this definition.  
  
```scala
import chisel3._

class GCD extends Module {
 val io = IO(new Bundle {
   val a  = Input(UInt(32.W))
   val b  = Input(UInt(32.W))
   val e  = Input(Bool())
   val z  = Output(UInt(32.W))
   val v  = Output(Bool())
 })
 val x = Reg(UInt(32.W))
 val y = Reg(UInt(32.W))
 when (x > y)   { x := x -% y }
 .otherwise     { y := y -% x }
 when (io.e) { x := io.a; y := io.b }
 io.z := x
 io.v := y === 0.U
}
```  
I've selected [CHISEL](https://chisel.eecs.berkeley.edu/) (Constructing Hardware in a Scala-Embedded Language) as the example. What makes an encapsulated eDSL different is that the description made using the eDSL is monolithic and executed to create a single model -- in this case, Verilog. The GCD design show above might be used within a larger CHISEL-based design, but would never be used within a user's program to provide a useful service to the program. In a sense, an encapsulated eDSL description takes on a primary role within the host application.   
  
  
**Embedding a DSL in Python**  
As we've seen, an embedded domain-specific language can provide a domain-specific interface to complex algorithms inside the confines of an existing general-purpose programming language. We've looked at several styles in which an embedded domain-specific language can be integrated into its host language -- all with different tradeoffs in terms of benefits and usability.  
I've personally worked with embedded domain-specific languages in nearly every programming language I've used -- from C/C++ to TCL to Java. Most recently, though, I've been learning Python and (naturally) exploring the capabilities that Python offers for supporting an eDSL. Over the next few posts I'll look at Python's features that enable eDSL integration using a small eDSL I've been working on as an example.  
In the meantime, what has your experience been with embedded domain-specific languages? Helpful or frustrating? Any notable examples -- either good or bad?  
  
  

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
