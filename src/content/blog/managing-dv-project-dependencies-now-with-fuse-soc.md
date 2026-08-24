---
title: Managing DV Project Dependencies - Now with FuseSoc
date: 2026-05-09
categories:
- FVUtils
mermaid: true
syndicate: full
---

I had the pleasure of attending [LatchUp](https://fossi-foundation.org/latch-up/2026) 
this past weekend. Conferences invariably 
spark new ideas and new perspectives, and this past weekend was no different. 
Specifically, I found a new perspective on interoperability between two free and 
open source silicon (FOSSi) tools that I've known about for quite some time:
[FuseSoc](https://fusesoc.readthedocs.io/en/stable/user/overview.html), a package management tool for design 
and verification created by Olof Kindren,
and [IVPM](https://fvutils.github.io/ivpm/), a polyglot project-local package manager that I created and maintain.

<!--more-->

## Dependencies in DV Projects

Design and verification projects are unique in the diversity of their dependencies.
Mono-language projects tend to have package-management tools focused on the unique
aspects of that programming language -- for example, Python has `pypi` and `pip`/`uv`. 
In contrast, design and verification projects
tend to leverage artifacts in multiple languages from a variety of sources. You'll 
certainly have SystemVerilog and/or VHDL sources, but you might also depend on one or more
Python libraries. This can make dependency management cumbersome, since
initializing a project involves using all the relevant packages managers to fetch
dependencies from those particular ecosystems -- in addition to potentially downloading
some files not managed by any package manager. Either way, you'll likely need some
sort of project-specific section in your README or a `bootstrap.sh` script to tie it all together.


## IVPM - A Polyglot Package Manager

Integrated-View Package Manager (IVPM) provides another approach. IVPM is a 
project-local dependency manager whose
genesis was my frustration with the limitations of using git submodules to manage
DV project source dependencies. IVPM started off as a relatively simple 
Python script that created local clones of git projects, driven by a manifest file. 
As new requirements came along, IVPM gradually evolved to where it is today: a 
flexible and extensible package manager that supports fetching 
dependencies from a wide variety of sources 
and synthesizing unified views from a variety of package artifacts, including:
- Python virtual environment from Python packages
- node_modules install from Node.js packages
- Links to available AI agent skills
- ... and more

What occurred to me last weekend was to enable IVPM to fetch FuseSoc packages and
assemble a unified view of the available FuseSoc libraries inside a project. 


## IVPM In Action

Let's look at a small example just to get a sense of what this looks like in practice.
Let's say that we're developing a little open-source RISC-V core. While developing 
our project, we benefit from having access to a few things:
- RISC-V ISA manual
- Verilator for simulation
- Common definitions (Verilog packaged with .core files)
- cocotb, fusesoc, and pyelftools for automating tests

While our project README.md will describe what is required in order to 
work on the core, we also provide an ivpm.yaml file that IVPM uses
to automate setup:

```
package:
  name: my-risc-v

  dep-sets:
  - name: default
    deps:
    - name: riscv-isa-manual
      url: https://github.com/riscv/riscv-isa-manual.git
      anonymous: true
    - name: verilator
      url: https://github.com/edapack/verilator-bin
      src: gh-rls
      cache: true
    - name: fwprotocol-defs.git
      url: https://github.com/featherweight-ip/fwprotocol-defs.git
    - name: cocotb
      src: pypi
    - name: fusesoc
      src: pypi
    - name: pyelftools
      src: pypi
```

When we run `ivpm update` in the project, the tool:
- Clones the git repos and downloads the Verilator binary release
- Creates a Python virtual environment and installs packages from `pypi`
- Creates `packages.envrc` that adds Python and Verilator to the path
- Updates `fusesoc.conf` with paths to the protocol defs .core file

When `ivpm update` completes, the project is ready to run. The environment
is configured, required open source software is installed, and FuseSoc is
configured to be able to find the installed .core files.

## Conclusions and Next Steps

IVPM provides a way to unify your project dependencies and you and your 
users get up-and-running fast. And, now, it supports FuseSoc-packaged 
IP as well. If you're interested in experimenting a bit more, you can
find two examples showing IVPM's support for FuseSoc 
[here](https://github.com/fvutils/ivpm/tree/master/examples/fusesoc).

Next time, we'll look at leveraging learnings from the Python ecosystem
on creating portable binary releases of open source EDA tools. And, of 
course, fetching these with IVPM.
