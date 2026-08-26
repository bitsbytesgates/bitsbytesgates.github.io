---
title: Simplifying Access to Open-Source EDA Software
date: 2026-05-15
categories:
- EDAPack
- IVPM
- Open Source EDA
- Package Management
- Python
mermaid: true
syndicate: full
---

Free and Open-Source Silicon (FOSSi) hardware designs face an interesting
challenge. There's a sizable and growing set of open source tools. But, obtaining
the software in pre-built form -- especially the latest versions -- can be a 
challenge due to the number of Linux OS variants. [EDAPack](https://edapack.github.io) 
adapts the approach that the Python ecosystem has developed to this challenge of 
distributing binaries
with broad Linux distribution compatibility. Together, [EDAPack](https://edapack.github.io) 
and [IVPM](https://fvutils.github.io/ivpm) provide 
a simple and fast way for projects to ensure that the proper version of open-source EDA tools
are available in the same way that they manage other dependencies.


## Problem and opportunity
How do you normally install software? While there are many possible paths, a common path is
to install new software using your operating system's package manager. Most Linux
variants use something like `apt` or `yum`. macOS and Windows have App Stores.
These built-in package managers are great for obtaining widely-used, stable software
packages. They're not as great for niche software, software that changes frequently, or 
software where multiple versions are simultaneously in use. Open-source EDA software, for example.

There are projects that distribute bundles of pre-built open-source EDA software,
such as [Tabby CAD](https://www.yosyshq.com/tabby-cad-datasheet), or create Docker 
images with pre-built software. These are great if they supply all the tools and tool
versions that you need, and supports the Linux version that you're using. But, often
we only need one or two tools. 

One substantial challenge with EDA software is that the community is small enough that
it's not feasible to independently support each Linux distribution with pre-built packages.
But, at the same time, Linux distributions are sufficiently different that a single
binary can't support all relevant distributions.


## Python and manylinux
As it so happens, the Python ecosystem has developed quite an elegant solution to this problem.
Using native-compiled extension code is a key technique to increase Python performance.
Obtaining these `binary wheels` in pre-built form simplifies package installation and 
avoids users running into compilation errors due to missing development libraries and toolchains.

But, how to ensure broad compatibility across platforms? They key is to build native-compiled
code on a platform with the same characteristics as the target platform. The Python Packaging Authority (ppya)
defines a set of Docker images https://github.com/pypa/manylinux for just this purpose. 
Each are based on a specific Linux distribution, and specify a set of compatible Linux distributions.
A key benefit of using these images vs just using the base Docker image is that the pypa project
keeps `manylinux` images updated with recent versions of tools such as compilers and Python interpreters. 
While the software you build with a `manylinux` image may be compatible with an older 
Linux distribution versions, you aren't locked into the old development tools that shipped with that 
distribution version.


## EDAPack - Multi-Platform OSS EDA Binaries

The [EDAPack](https://edapack.github.io) project borrows the Python `manylinux` infrastructure 
to build open-source EDA
tool binaries that support multiple Linux platforms. In cases where an open-source EDA tool
benefits from associated packages, EDAPack includes those as well. For example, the EDAPack 
release of the Yosys synthesis engine includes associated tools for equivalency checking (eqy),
formal verification (sby), and includes the `yosys-slang` plug-in that supports a broader 
set of SystemVerilog constructs.

## Managing Installed Tools with IVPM
It's great to have access to pre-built binaries, but downloading and managing 
multiple versions of tools is cumbersome. Fortunately, we can use [IVPM](https://fvutils.github.io/ivpm) to
simplify the setup process even further. IVPM approaches this by having each
project capture their dependencies -- including tools -- in a YAML file named
`ivpm.yaml`. In the case of using packages from [EDAPack](https://edapack.github.io), a project
specifies the dependency source as `gh-rls` (Github Release).

```
package:
  name: ivpm-fusesoc-example-registry

  dep-sets:
  - name: default
    deps:
    - name: iverilog
      src: gh-rls
      url: https://github.com/edapack/iverilog-bin
      cache: true
```

When we fetch the project's dependencies, we get tools as well. To save both time
and disk space, we've marked our tools packages as being cached. This means
that all projects that use the same version of a given tool simply link to 
a single installation in IVPM's cache directory.

The obvious win here is that anyone wanting to a given project can very quickly
gather the open-source tools required in order to use the project. But, beyond
that, the project creator can pin tools to specific version to reduce issues due
to using different tool versions. In addition, it's easy to different projects
to require and use different tool versions. IVPM's cache holds the total set of
active tool versions, and each project holds links to the specific required versions.

## Conclusions and Next Steps

The EDAPack organization hosts a growing collection of projects that build and
release open-source EDA software. Most packages focus on supporting x86 Linux 
via the `manylinux` build system. IVPM supports fetching tools and other 
artifacts from Github Releases, making it easy to load and configure the 
precise set of tools and tool versions required by any project managed with
IVPM.

Feel free to reach out if you'd like to contribute a new open-source EDA tool
to the EDAPack collection or add support for a new platform to a supported
EDA tool.

Next time we'll look at [direnv](https://direnv.net/), my new favorite tool
for project-centric environment management and see how IVPM integrates.

### Video
Increasingly, topics on the blog benefit from a demo. I'm experimenting with
recording companion videos that provide space for this. 


<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/At--xRSsLAc" title="YouTube video" loading="lazy" allowfullscreen frameborder="0"></iframe>
</div>



### References
- [Tabby CAD](https://www.yosyshq.com/tabby-cad-datasheet)
- [EDAPack](https://edapack.github.io)
- [IVPM](https://fvutils.github.io)
