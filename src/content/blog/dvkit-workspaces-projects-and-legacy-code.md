---
title: 'DVKit: Workspaces, Projects, and Legacy Code'
date: '2018-01-07T11:57:00.000-08:00'
tags:
- IDE
- RTL
- Verilog
- SystemVerilog
- Eclipse
- design abstraction
- Design Verification
- HDL
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-6993462667292205651
blogger_orig_url: https://bitsbytesgates.blogspot.com/2018/01/dvkit-workspaces-projects-and-legacy.html
modified_time: '2018-01-07T11:57:40.173-08:00'
image: https://2.bp.blogspot.com/-p4TwkHhI8cc/WlJt5VAnQLI/AAAAAAAACMc/DeClllSY6SsO4dEkIXXhiVk9RCAKfVhxgCLcBGAs/s72-c/WorkspaceProject_1.png
syndicate: none
---

<span id="docs-internal-guid-71002205-8558-2cbb-e1f8-ca1ed6710348"></span>  
In [Part 1](/blog/dvkit-more-productive-code-development-for-dv-engineers/) of this series, I introduced DVKit, an Eclipse-based IDE for files types used by DV engineers. If you're used to editing your source files with a single-file editor like Vi/Vim or Emacs, moving to an integrated development environment can take some getting used to. Single-file editors don't require any context (in fact, do not take advantage of any context) beyond the file on which they have been invoked. In contrast, IDEs require context for a file in order to provide many of the project-centric features that they provide.  
  
Eclipse, like many integrated development environments, provides a variety of flexible features with which to specify the context of the files being developed. In this post, I'll describe the best practice fundamentals I've developed over the years when setting up development projects. Future posts will explore a few additional features that are very helpful in some cases.  
  

<div>

[<img src="/legacy-img/WorkspaceProject_1.png" width="400" height="213" />](/legacy-img/WorkspaceProject_1.png)

</div>

  

### Projects 

Eclipse provides two fundamental features for working with code: projects and workspaces (shown above). A project is represented by a directory that includes the sources being developed and some meta-data files with information about the language (eg Java) being used and how that language should be processed (eg assume Java 7). Some of this information is captured in a file named '.project' that is present in all Eclipse projects, and some will be captured in toolchain-specific files.  
  
An Eclipse session can have multiple projects open at any given time.  
  

### Workspaces

<div>

Eclipse uses a workspace to capture a development session. A workspace records the projects that are open, the windows that are open and their positions and sizes, etc. In contrast to projects, a workspace typically does not contain any actual code -- just the preferences and settings used while developing code.

</div>

<div>

Projects are associated with a workspace in two ways:

</div>

<div>

- When a project is created, it is automatically added to the active workspace
- An existing project can be imported into the active workspace

<div>

In both cases, a link is added from the workspace to where the project is located on the filesystem. The project and its files will be visible in the workspace, but you are actually editing the files within the project directory, as shown in the diagram above.

</div>

</div>

I typically create a workspace for each codeline that I'm working on. So, I might have a workspace for "sveditor-master" and one for "sveditor-fast-indexer".  
  

### Working with Existing Code

<div>

If you're getting started with an Eclipse-based IDE like DVKit, you likely have lots of existing code and no existing Eclipse projects. So where do you start? Well, the good news is that Eclipse projects fit very nicely around existing code. You just need to decide what the primary language for the project is, and create the right project.

</div>

<div>

Let's say I want to work on files from the Linux Device Tree Compiler (DTC), and that I've cloned a copy of the repository (<git://git.kernel.org/pub/scm/utils/dtc/dtc.git>) to c:/usr1/fun/dvkit/tutorial/dtc.  
After launching DVKit, I would launch the 'New C Project' wizard (New-\>Project... ) to create a new project for editing C code.  
  

<div>

[<img src="/legacy-img/NewProject_1-2.png" width="320" height="310" />](/legacy-img/NewProject_1-2.png)

</div>

<div>

The next wizard allows me to provide specifics about the project I want to work on.

</div>

  

<div>

[<img src="/legacy-img/WorkspaceProject_2.png" width="286" height="320" />](/legacy-img/WorkspaceProject_2.png)

</div>

  
  

- **What is the project named?** 'dtc'
- **Where is it located?** On the filesystem at c:/usr1/fun/dvkit/tutorial/dtc
- **How are the source files compiled?** With a Makefile

<div>

After completing this wizard, the 'dtc' project will be visible in the workspace:

</div>

<div>

[<img src="/legacy-img/DTC_Project.png" width="640" height="444" />](/legacy-img/DTC_Project.png)

</div>

  
Now the source files from the 'dtc' project are visible in the workspace and available for editing. In the future, we can bring the 'dtc' project into another workspace by running the Eclipse Import wizard to import an existing project.  
  

### Conclusion

<div>

The Eclipse project construct allows project-specific settings to be associated with source code, while the workspace construct enables users to manage session-specific settings. Eclipse's ability to construct a project around existing source code makes it easy to use Eclipse to develop existing code.

</div>

<div>

As always, you can download the freely-available Eclipse-based DVKit here: <https://sourceforge.net/projects/dvkit/files/>

</div>

  

</div>
