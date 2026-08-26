---
title: Generate Custom Content Quickly with a Template Engine
date: '2019-03-02T13:38:00.001-08:00'
tags:
- IVPM
- Code Generation
- Jinja2
- Python
- UVM
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-1242043696191857470
blogger_orig_url: https://bitsbytesgates.blogspot.com/2019/03/generate-custom-content-quickly-with.html
modified_time: '2019-03-02T13:38:42.442-08:00'
image: https://1.bp.blogspot.com/-ATyX_mYeEFY/XHrrYRSDP7I/AAAAAAAAChQ/6yYSRbhzfPABx-p8zJmIID_4v3K9KArywCLcBGAs/s72-c/vte-splash.png
syndicate: none
---

<div>

[![](/legacy-img/vte-splash.png)](/legacy-img/vte-splash.png)

</div>

  
I was at [DVCon](https://dvcon.org/) earlier this week, and attended the UVM Update Tutorial delivered by Cliff Cummings. Cliff described his typical process of creating UVM elements, which is to have a set of 'golden' template files that can be copied and hand-customized to the task at hand. It's certainly something I've done frequently on UVM projects and in many other contexts as well.  
  
If you work in verification and you're anything like me, you create lots of files pretty much every day. Scripts, UVM code, C++ code, Makefiles, meta-data files, the list goes on and on. While all of these files will contain custom content, there is often a lot of boilerplate content as well. There are certainly specialized tools focused on quickly creating content for specific domains. For example, there are several tools and libraries to help quickly create UVM elements based on some high-level inputs from the user. But, what about files that are custom to your environment? Can we do better than the standard process of copy, rename, and then manually doing a search/replace in each file?  
  
**VTE**  
I've recently been playing with just such a template engine for my own use. For lack of a better name, I've been calling it the Verification Template Engine (VTE), since I'm largely using it for creating files in the context of a verification environment. VTE is implemented in Python and leverages the [Jinja2](http://jinja.pocoo.org/docs/2.10/) template engine, which is typically used for creating web content from a template.  
  
Given how much VTE is just reusing existing functionality, what is the value-add? Two things, really:  
  

- VTE provides a user interface that makes it easy to see what templates are available in the environment
- VTE specifies a template structure that makes it really easy to create new templates from those 'golden' template files that you would normally copy, rename, and modify.

  
**Using Templates**  
VTE currently ships a couple of small templates with the tool. Your custom templates will be found via the VTE_TEMPLATE_PATH environment variable.  
  
VTE currently supports two commands: *list* and *generate.* The *list* command shows the set of templates that were found on the template path.  
*  
* ```
% vte list
project.ivpm.googletest-hdl - IVPM project with Googletest-HDL dependence
verif.ip.googletest-hdl     - IP verification environment using Googletest-HDL
verif.uvm.test              - Creates a UVM test class
```

<div>

`The generate command, as you might expect, generates content from a specified template. `

</div>

<div>

```
usage: vte generate [-h] [-force] template name [KEY=VALUE [KEY=VALUE ...]]

positional arguments:
 template    ID of template
 name        Name to use in the template
 KEY=VALUE   Specify other template variables

optional arguments:
 -h, --help  show this help message and exit
 -force      force overwrite of existing files
```

</div>

<div>

Here's an example using VTE to create the skeleton project structure that I use when developing an IP:

</div>

<div>

```
% vte generate project.ivpm.googletest-hdl my_proj
Note: processing template etc/ivpm.info
Note: processing template etc/packages.mf
Note: processing template etc/env.sh
Note: processing template scripts/ivpm.py
Note: processing template scripts/ivpm.mk
% find -type f
./etc/ivpm.info
./etc/packages.mf
./etc/my_proj_env.sh
./scripts/ivpm.py
./scripts/ivpm.mk
```

</div>

**Creating Templates**  
  
Creating new template is simple as well. VTE. uses a marker file, named *.vte* to identify the root directory of a template. Any files in that directory or its subdirectories is considered to be a template file. The ID for a template is composed from the path elements between the VTE_TEMPLATE_PATH entry and the directory containing the *.vte* marker file.  
  
For a very simple template, all you need is an empty *.vte* marker. However, adding a little information to the *.vte* file makes your template more useful. For example, you can add a short description for your template, which will be shown with the *vte list* command is run:  
  
```
[template]
desc = Creates a UVM test class
```  
The template files, themselves, use [Jinja2](http://jinja.pocoo.org/docs/2.10/) markup to refer to template parameters and specify directives.  
  
```system-verilog
/****************************************************************************
* {{name}}.svh
* 
****************************************************************************/
{%set filename = "{{name}}.svh" %}
/**
* Class: {{name}}
* TODO: Document UVM Test {{name}}
*/
class {{name}} extends {{base_class}};
`uvm_component_utils({{name}})

function new(string name, uvm_component parent=null);
 super.new(name, parent);
endfunction

endclass
```

<div>

  

</div>

The example above is a template for a UVM Test class. The *{% set filename ... %}* directive specifies the name of the output file, which depends on the value of the *name* parameter. The rest of the template contains a reference to the *name* parameter wherever we want that to be substituted in. As you can probably guess, these locations where *{{name}}* is referenced are the very locations that you'd go through with a text editor and manually substitute in some content.  
  
  
**Sound Interesting?**  
If this all sounds interesting, check out VTE on GitHub: <https://github.com/fvutils/vte>. You can download a release tarball from the *Releases* area, add the bin directory to your PATH, and try it out right away. You can also find documentation in the [README](https://github.com/fvutils/vte/blob/master/README.md) file.  
If you find an issue with VTE, or would like to see it support a new feature, file a ticket on the GitHub issue tracker. Even better, send me a pull request!  
  
My hope is that a tool like VTE can make creating boilerplate code much simpler and faster, allowing you to focus your efforts on adding truly-unique content. That is, after all, always the goal of engineering and automation, right?
