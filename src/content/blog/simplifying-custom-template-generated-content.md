---
title: Simplifying Custom Template-Generated Content
date: '2022-08-21T10:18:00.001-07:00'
tags:
- Jinja2
- Code Generation
- Templates
- Python
- Functional Verification
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-1102691510656038598
blogger_orig_url: https://bitsbytesgates.blogspot.com/2022/08/simplifying-custom-template-generated.html
modified_time: '2022-08-21T10:18:42.896-07:00'
image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjW6ygOoIw0lvUu7rGQcU-QVVwfR0SFtT6zCJtRzOilSOqHR8OwMnyDjG3C32-arWwoRRP0mKzGieAzgnyEPWk5fFsnzWNezMqZgDFNOUQy9MCRdodg9cWa3ghlBgKJgxJmXLOAXXCkMJI7tdm-fvXLQZIVvYFCXSXc7yHXz5NjDUt3SRbvhit25z52PQ/s72-c/splash.png
syndicate: none
---

<div>

[![](/legacy-img/splash-18.png)](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjW6ygOoIw0lvUu7rGQcU-QVVwfR0SFtT6zCJtRzOilSOqHR8OwMnyDjG3C32-arWwoRRP0mKzGieAzgnyEPWk5fFsnzWNezMqZgDFNOUQy9MCRdodg9cWa3ghlBgKJgxJmXLOAXXCkMJI7tdm-fvXLQZIVvYFCXSXc7yHXz5NjDUt3SRbvhit25z52PQ/s540/splash.png)

</div>

  

As a verification engineer, it's quite common to work with data and code that follow a regular pattern. Having an efficient way to create this repetitive code is a significant productivity boost. While there certainly are places in the code where 'your critical generation or checking algorithm' goes, much of the structure of an agent, a test environment, etc remain the same. The same goes for other parts of the flow, such as project meta-data, test lists, etc. There are two things that keep us from just making copies of a set of 'golden' files to create the basis for a new UVM agent, project, etc: some or all of the files need to have some data substituted or changed. For example, we want to substitute the name of the new UVM agent we're creating into most of the new SystemVerilog source code.

Custom code generators have been developed for some of these tasks. These often focus on providing a domain-specific way to capture input data, such as the structure of a UVM testbench or the layout of registers in a design. But there are many more opportunities to generate template-driven code that cannot justify the investment to create a focused solution.

A few years ago, I created the [Verification Template Engine (VTE)](https://github.com/fvutils/vte/) to serve my needs for generating template-driven content. I developed VTE with three user-experience requirements in mind:

- Creating a new template should be very easy, but have access to powerful generation features
- Managing the available templates should be simple for a user. 
- The core tools should be generic, and make few or no assumptions about what is being generated

<div>

VTE focuses on organizing and discovering template content, but leverages the [Jinja2 template engine](https://palletsprojects.com/p/jinja/) to do the heavy lifting of template expansion. In some sense, you can think of VTE as providing a user interface to the Jinaj2 library.

</div>

<div>

I've been using VTE since developing it, but am just getting back to create proper documentation, which you can find here: <https://fvutils.github.io/vte/>. As part of that work, I created a quickstart guide which is both in the documentation, and forms the remainder of this post. 

</div>

<div>

<div>

**Installing VTE**

</div>

<div>

The easiest way to install VTE is from PyPi.

</div>

<div>

% python3 -m pip install --user vte

</div>

<div>

Test that you can run VTE by running the command (vte) and/or invoking the module:

</div>

<div>

% vte --help

</div>

<div>

% python3 -m vte --help

</div>

<div>

**Creating a Template**

</div>

<div>

VTE discovers templates by searching directories on the VTE_TEMPLATE_PATH environment variable. VTE uses a marker file named .vte to identify the root of a template. All files and directories in and below a template directory are considered to be part of the template. The template identifier is composed from the directory names between the directory listed in VTE_TEMPLATE_PATH and the directory containing the .vte marker file.

</div>

<div>

Let’s look at an example to illustrate the rules.

</div>

<div>

templates

</div>

<div>

  uvm

</div>

<div>

    agent

</div>

<div>

      .vte

</div>

<div>

    component

</div>

<div>

      .vte

</div>

<div>

  doc

</div>

<div>

    blog_post

</div>

<div>

      .vte

</div>

<div>

    readme

</div>

<div>

      .vte

</div>

<div>

Let’s assume we add the templates directory to VTE_TEMPLATE_PATH. VTE will find four templates:

</div>

<div>

uvm.agent

</div>

<div>

uvm.component

</div>

<div>

doc.blog_post

</div>

<div>

doc.readme

</div>

<div>

All files in and below the directory containing the .vte marker will be rendered when the template is used.

</div>

<div>

**Creating the Template Structure**

</div>

<div>

Let’s create a very simple template structure. Create the following directory structure:

</div>

<div>

templates

</div>

<div>

  doc

</div>

<div>

    readme

</div>

<div>

Change directory to templates/doc/readme and run the quickstart command:

</div>

<div>

% vte quickstart

</div>

<div>

Verification Template Engine Quickstart

</div>

<div>

Template directory: templates/doc/readme

</div>

<div>

Template Description \[\]? Create a simple README

</div>

<div>

This command will prompt for a description to use for the template. Enter a description and press ENTER. This will create the .vte marker file.

</div>

<div>

View the .vte file. You’ll see that the initial version is quite simple. For now, this is all we need.

</div>

<div>

template:

</div>

<div>

  description: Create a simple README

</div>

<div>

  parameters: \[\]

</div>

<div>

\#   - name: param_name

</div>

<div>

\#     description: param_desc

</div>

<div>

\#     default: param_default

</div>

<div>

**Creating the Template File**

</div>

<div>

Now, let’s create the template file that will be processed when we render the template. Our readme template only has one file: README.md.

</div>

<div>

Create a file named README.md containing the following content in the templates/doc/readme directory:

</div>

<div>

\# README for {{name}}

</div>

<div>

TODO: put in some content of interest

</div>

<div>

VTE supports defining and using multiple parameters, but defines one built-in parameter that must be supplied for all templates: name. Our template file references name using Jinja2 syntax for variable references.

</div>

<div>

We have now created a simple template for creating README.md files.

</div>

<div>

**Rendering a Template**

</div>

<div>

In order to render templates, VTE must first be able to discover them. Add the templates directory to the VTE_TEMPLATE_PATH environment variable.

</div>

<div>

% export VTE_TEMPLATE_PATH=\<path\>/templates \# Bourne shell

</div>

<div>

% setenv VTE_TEMPLATE_PATH \<path\>/templates \# csh/tsh

</div>

<div>

Let’s test this out by running the vte list command:

</div>

<div>

% vte list

</div>

<div>

doc.readme - Create a simple README

</div>

<div>

If you see the doc.readme line above, VTE has successfully discovered the template.

</div>

<div>

Now, let’s actually generate something. Let’s create a new directory parallel to the templates directory in which to try this out

</div>

<div>

% mkdir scratch

</div>

<div>

% cd scratch

</div>

<div>

Finally, let’s run the generate command:

</div>

<div>

% vte generate doc.readme my_project

</div>

<div>

Note: processing template README.md

</div>

<div>

VTE prints a line for each template file is processes. The output above confirms that is processed the template README.md file.

</div>

<div>

Let’s have a look at the result. View the README.md file in the scratch directory.

</div>

<div>

\# README for my_project

</div>

<div>

TODO: put in some content of interest

</div>

<div>

Node that the {{name}} reference was replaced by the name (my_project) that we specified.

</div>

<div>

You have now created your first VTE template!

</div>

</div>

**Conclusion**

As the tutorial above illustrates, creating a new template for use with VTE is no more effort than making a few name substitutions. If you use the template more than once, you will already have received a positive return on the effort invested. While templates can be simple, you have the full power of the [Jinja2](https://palletsprojects.com/p/jinja/) template engine when you need to do something more complex. I encourage you to check out the [VTE documentation](https://fvutils.github.io/vte/) and look for opportunities where using template-driven content generation can make your life easier and make you more productive.

  

<div>

Copyright 2022 Matthew Ballance

</div>

<div>

<span face="Trebuchet MS, Trebuchet, Verdana, sans-serif">*The views and opinions expressed above are solely those of the author and do not represent those of my employer or any other party.*</span>

</div>
