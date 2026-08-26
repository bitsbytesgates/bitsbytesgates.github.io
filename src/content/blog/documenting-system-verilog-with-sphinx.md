---
title: Documenting SystemVerilog with Sphinx
date: '2022-01-23T18:57:00.000-08:00'
tags:
- Documentation
- SystemVerilog
- Sphinx
- Python
- TbLink-RPC
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-2367826103061036918
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/01/documenting-systemverilog-with-sphinx.html
modified_time: '2022-01-23T18:57:37.815-08:00'
image: https://blogger.googleusercontent.com/img/a/AVvXsEiNWOsyFL5mQ67LxKR4FU9onpnBqZi9VdXXlN6f3v7jdhDpgpoT6JDNZI0xew3Vs7nw6Si5qG-aiOz9IymD_1j7kuh5n8wfSUthnYDrqTyq4gKhhYCFs62nlqZ0X0ll_DW2kMUjQXw3wnLXYAEWS__DyPdR1Xsq4jpUU9e_TU4u_q-fuMtJ6rnFdH4XCQ=s72-c
syndicate: none
---

<div>

[![](/legacy-img/documenting-systemverilog-with-sphinx-3.png)](/legacy-img/documenting-systemverilog-with-sphinx-3.png)

</div>

  
I've been digging into a project over the last few months whose value proposition is to simplify the process of connecting simulation-like environments and things like reference models, testbench languages, etc. I'll write more (likely much more) about this project in the future. This post, however, is about documentation and, specifically, documentation for SystemVerilog code.

As you can imagine, SystemVerilog support is critical for a project that connects into simulation environments. SystemVerilog and UVM currently are, after all, the most widely-deployed solution for block- and subsystem-level verification. But, support for other languages (C, C++, Python, etc) are important as well. Consequently, when it comes to documenting APIs, I need to cover a fair amount of ground.

  

**Sphinx for Documenting Code**

I've been using [Sphinx Documentation Generator](https://www.sphinx-doc.org/en/master/) for the last couple of years. Sphinx accepts input formatted with [reStructuredText](https://www.sphinx-doc.org/en/master/usage/restructuredtext/index.html)  mark-up and generates formatted output in HTML, PDF, and several other formats. Sphinx has a wide variety of plug-ins that help to make formatting different types of document content more productive. Sphinx was originally created for documenting Python code, and it shows. That said, its features support documenting far more than just Python code -- as we'll shortly see.

  

**Leveraging Code Comments**

Tools that generate documentation from code comments have been around for a long time. My experience has been that they're a good way to quickly create somewhat-generic documentation, provided the doc-generation tool supports the right coding language and the codebase contains enough comments. My experience has also been that documentation created from API code comments is lacking key insights from the author on the code's architecture. 

One thing that I've liked about Sphinx is that it supports referencing code-comment documentation, but relies on the document author to do so. This approach encourages the documentation author to incorporate API documentation alongside explanatory text (that could be awkward to include in a code comment) instead of having large fully auto-generated API-reference sections. This approach also gives the documentation author much more control over the document structure than fully-automated API-documentation tools can typically afford to provide.

  

**What About Non-Python Code?**

As mentioned previously, Sphinx was originally a tool for documenting Python packages. As such, it provides built-in features for extracting documentation comments from Python code. The [Doxygen](https://www.doxygen.nl/index.html) tool is one very popular way of documenting languages such as C and C++ from code comments. The [Breathe](https://breathe.readthedocs.io/en/latest/) plug-in for Sphinx processes the XML output files from Doxygen, allowing Sphnix documents to bring in documentation code-comments from any language supported by Doxygen.

The good news is that Doxygen supports a wide range of languages. Using Doxygen to pull in doc comments from the C++ codebase of my project will work with relative ease. Unfortunately, though, Doxygen doesn't support SystemVerilog.

 

**Doxygen and Filters**

Believe it or not, a commonly-recommended path to support a new language with Doxygen is to write a filter script that transforms the source language (that Doxygen doesn't support) into the form of a language that Doxygen does. 

As luck would have it, there is a SystemVerilog filter for Doxygen: [DoxygenFilterSystemVerilog](https://github.com/SeanOBoyle/DoxygenFilterSystemVerilog). It's written in PERL and uses regular expressions to recognize SystemVerilog constructs and translate them into C++ equivalents that Doxygen can understand. Doxygen primarily cares about constructs like classes, class fields, and function declarations. This makes an approximate-translation strategy workable.

**Dealing with Packages and Namespaces**

There's just one small issue that we need to solve in order to have a complete flow. SystemVerilog class-based code relies heavily on the pre-processor to assemble a set of classes under the appropriate package. In C++, a namespace is just a 'tag' that gets applied to content. Any number of files may declare content inside the same namespace with no issues. SystemVerilog, conversely, requires that a given package be declared only once and that all content in that package be declared inside that single package scope. The end result is that users sensibly place different classes in different files and 'glue' the whole thing together using include directives and the pre-processor.

If we are only documenting code from a single package, this likely wouldn't cause a problem. We could simply run the Doxygen filter on each class file. When documenting a codebase with multiple packages, we need to ensure we stay consistent with the packages in which classes are declared. How do we do this? By pre-processing the code, of course!

  

**Putting it all Together**

There really are two parts to our flow. The first is processing the SystemVerilog code to make it 'look' like C++.

<div>

[<img src="/legacy-img/documenting-systemverilog-with-sphinx-5.png" width="640" height="175" />](/legacy-img/documenting-systemverilog-with-sphinx-5.png)

</div>

  

That part of the flow is shown above. In this portion of the flow I'm using [Verilator](https://github.com/verilator/verilator) for the pre-processor  
because of a very unique feature. Most pre-processors that I'm aware of strip out comments as part of preprocessing. Verilator allows the user to (optionally) retain comments. Since the vast majority of the 'interesting' content is found in documentation comments, this is a critical feature for this flow.

  

<div>

[<img src="/legacy-img/documenting-systemverilog-with-sphinx-4.png" width="640" height="285" />](/legacy-img/documenting-systemverilog-with-sphinx-4.png)

</div>

Once we have our "c++-ified" SystemVerilog, we can run that through Doxygen. This will result in some XML files containing the information and relationships Doxygen extracted from the XML code. These XML files are what the Breathe plug-in reads, and exposes to Sphinx.

As I mentioned earlier, Sphinx brings in documentation code-comment content on demand instead of automatically assembling it into a document or document section. 

<div>

[![](/legacy-img/documenting-systemverilog-with-sphinx-2.png)](/legacy-img/documenting-systemverilog-with-sphinx-2.png)

</div>

The snippet above shows bringing in the code-comment documentation for all fields and methods within the specified class (in this case tblink_rpc::IEndpoint). The result in the document looks something like what is shown below:

<div>

[![](/legacy-img/documenting-systemverilog-with-sphinx-1.png)](/legacy-img/documenting-systemverilog-with-sphinx-1.png)

</div>

  

<div>

<div>

There are other Sphinx doc tags that allow referencing a single function, etc.

<div>

  

  

**Looking Forward**

In my current work, I'm focused on SystemVerilog classes. The approach above works well for documenting class structures, but doesn't work so well for document SystemVerilog modules and interfaces. My current thinking is to use the [Sphinx Verilog Domain](https://github.com/SymbiFlow/sphinx-verilog-domain) plug-in to document modules, and continue to use the flow above for classes. Would a single tool be better? Yes. But having two complementary tools is just fine.

Now that I have a way to document SystemVerilog class code, I'm digging into that process. If you're curious about the commands/scripts I'm using, you can have a look at the [tblink-rpc-docs](https://github.com/tblink-rpc/tblink-rpc-docs/) project and the [Makefile](https://github.com/tblink-rpc/tblink-rpc-docs/blob/main/Makefile) in that project.

Hope you find this helpful, and feel free to comment back on your approach to documenting SystemVerilog classes.

  

</div>

</div>

</div>
