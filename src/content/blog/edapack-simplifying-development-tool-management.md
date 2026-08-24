---
title: 'EDAPack: Simplifying Development-Tool Management'
date: '2019-01-13T19:00:00.002-08:00'
tags:
- Formal Verification
- Electronic Design Automation
- EDA
- Symbiyosys
- Design Verification
- EDAPack
legacy: true
author: Matthew Ballance
blogger_id: tag:blogger.com,1999:blog-142675602739945566.post-6059972311529904563
blogger_orig_url: https://bitsbytesgates.blogspot.com/2019/01/edapack-simplifying-development-tool.html
modified_time: '2019-01-13T19:00:55.885-08:00'
image: https://1.bp.blogspot.com/--njzrHQyvJI/XDuhIZ-ON6I/AAAAAAAACeg/x7K7gEJfY9wu1TOnIukV9JlxQ7zi7nImwCLcBGAs/s72-c/edapack-splash.png
syndicate: none
---

<div>

[![](/legacy-img/edapack-splash.png)](/legacy-img/edapack-splash.png)

</div>

<div>

</div>

One of my first "real" engineering courses during my college days centered around scripting and working with Unix, and the professor really emphasized that any repetitive task was a candidate for automation. It's a point that resonated with me at the time, and I continue to question whether any mind-numbing and multi-step process I face should be automated.  

<div>

**<u>Challenges of Managing EDA Tools</u>**

</div>

<div>

One of those mind-numbing processes I've been facing recently is managing my installations of development tools -- specifically, the electronic design automation (EDA) tools that I use to simulate and synthesize Verilog hardware descriptions and develop the embedded software that runs on those devices.

</div>

<div>

In my experience, EDA tools are a bit different than the standard software that might be installed by default on your Linux workstation:

</div>

- EDA software is enough of a niche market that builds will either just not be available for your Linux distribution, or will be an older version of the software.
- I often need to install EDA software on machines where I don't have root access, so it wouldn't help me much if the Linux distribution provided a pre-built version of the software
- I often don't have control over the Linux distribution and version that I have to use. CentOS/RHEL 6, released in 2011, is still quite common and will likely continue to be common since support is offered through 2020.
- It's often necessary to have several versions of EDA software installed at a given time. Projects often have a dependency on a specific version -- at least until a newer version is validated, so multiple versions must coexist

<div>

These challenges, in and of themselves, make maintaining a collection of EDA tools time-consuming.

</div>

<div>

**<u>Challenges of Managing OSS EDA Tools</u>**

</div>

<div>

When it comes to working with open-source EDA tools, there is another level of complexity. These tools are often provided in source form, so they must be installed by the end user. EDA software, like any other, can be complex and can have dependencies on additional software packages. Compiling [SymbiYosys](https://symbiyosys.readthedocs.io/en/latest/), the open-source formal-analysis tool, requires that the source for seven other packages be fetched, compiled, and installed. This is complex enough when the user has administrator access to the machine and can install needed development libraries. Without administrator access, this process becomes incredibly complex. And, of course, when a new version of one of the packages is released, the whole process must be repeated.

</div>

<div>

**<u>Introducing EDAPack</u>**

</div>

<div>

I created [EDAPack](https://github.com/edapack), which I consider to be in an Alpha state, to address the challenges I describe above. You can think of EDAPack has having two main components, as shown in the diagram below:

</div>

<div>

</div>

  

<div>

[<img src="/legacy-img/EDAPackDiagram_2.png" width="640" height="343" />](/legacy-img/EDAPackDiagram_2.png)

</div>

<div>

First off is the base set of tools, shown in the bottom box. EDAPack contains an installation of [Environment Modules](http://modules.sourceforge.net/), which is a software package that is somewhat-widely used to manage configuring the environment for different software tools. Modules makes it easy to configure the environment with the right mix of tool versions with a minimum of fuss. EDAPack also contains an installation of Python3, a software package that is increasingly required to run open-source software tools, but is somewhat difficult to get correctly-installed on older Linux distributions. Finally, EDAPack contains scripts to manage installation of tools into the EDAPack tree.

</div>

<div>

The second part of EDAPack is most significant for those of you that are using open-source tools, such as a GCC cross-compiler or one of the open-source Verilog simulators. A key aspect of EDAPack's mission is to provide pre-compiled versions of these packages that can simply be installed and used, skipping all the complexities of installing development libraries and compiling required dependencies. Right now, just a few packages are setup to be used in this way, but the goal is to expand that set based on user demand.

</div>

<div>

Now, providing pre-compiled software is always an interesting proposition in a Linux environment. Different distributions provide different versions of tool and libraries, making it difficult to deliver software that will run on a variety of distributions. EDAPack compiles packages on CentOS 6, then tests the software on a variety of Linux distributions (courtesy of [Docker](https://www.docker.com/)), ensuring that the software will run correctly on a wide variety of Linux distributions.

</div>

<div>

**<u>How does it Work?</u>**

</div>

<div>

Getting started is actually pretty simple (and that's by design): just download EDAPack from the [GitHub release](https://github.com/EDAPack/edapack/releases) page. After installing EDAPack, you'll want to source a setup script in the EDAPack 'etc' directory (\<edapack\>/etc/edapack.sh) in order to configure some initial paths.

</div>

<div>

From there, you'll probably want to install some software. This can be done using the edapack avail command to list software that is available to install:

</div>

<div>

[![](/legacy-img/edapack_avail.png)](/legacy-img/edapack_avail.png)

</div>

<div>

Once you know which software you'd like to install, the edapack install command is used to  fetch and install the software into the EDAPack tree. For example, edapack install verilator fetches a pre-built version of Verilator from the release area on GitHub and installs it into the EDAPack tree.

</div>

<div>

Before using software from the EDAPack tree, you will use the *module* tool (provided by [Environment Modules](http://modules.sourceforge.net/)) to list the installed packages and load tools into your environment. Here's the output from module avail, which lists the installed tools. 

</div>

<div>

[![](/legacy-img/module_avail.png)](/legacy-img/module_avail.png)

</div>

<div>

We can see that *symbiyosys* and *verilator* are installed. We can load a specific version of these tools, or specify the 'latest' version to get the newest installed version.

</div>

<div>

In other words, simply issuing the command module load verilator/latest will setup our environment to use the latest-installed version of [Verilator](https://www.veripool.org/wiki/verilator).

</div>

<div>

**<u>  
</u>**

</div>

<div>

**<u>Current Status and Call to Action</u>**

</div>

<div>

Currently, EDAPack is newly-released, provides a bare minimum of packages (Verilator, Icarus Verilog, and SymbiYosys), and provides support for Linux only. EDAPack is useful to me, and I'll continue to evolve it to meet my needs. However, I'm very interested in whether EDAPack could be useful to you as well.

</div>

<div>

Are you an EDA user? What tools would you like to see delivered in this way? What OS (Linux distro or other) do you use, and would like to ensure is supported?

</div>

<div>

Are you an author of open-source engineering software? Would you like to have your software made available to users in this way?

</div>

<div>

Do you have other ideas of what might be possible with a framework like this?

</div>

<div>

EDAPack is designed to enable hardware and embedded-software developers focus on developing their designs, not on compiling their development tools. I'm interested in your input on whether you feel EDAPack is a useful concept and, if so, what could make it even more useful to you. Feel free to comment on the blog, or file requests on GitHub. What tools are in your pack?

</div>

- 

<div>

</div>
