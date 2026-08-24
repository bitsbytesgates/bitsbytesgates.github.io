---
title: What's My Env Again?
date: 2026-05-23
categories:
- FVUtils
- IVPM
syndicate: derived
---

Almost any non-trivial project will require some amount of environment configuration.
Perhaps the project uses a local Python virtual environment that must be used
for running tests. Perhaps it's a hardware-design project that needs to configure
the environment for various EDA tools, and ensure that they're available to users.
If you're sharing a project with other users, this poses a challenge. The typical
approach is to have a setup.sh script. But, you need to remember to source it 
before doing any work in the project -- and when moving over to another project.
And, then, there's the complication of different shells. Fortunately there's 
[direnv](https://direnv.net/): a very elegant solution that has become my 
go-to over the past year or so. 
And, naturally, [IVPM](https://fvutils.github.io/ivpm) provides support.

<!--more-->

I first learned about [direnv](https://direnv.net/) from a colleague a little 
over a year ago.  
Initially, I was a bit skeptical because it inverts the typical approach
to environment management. Typically, the environment is a session property
that persists as the user navigates around the filesystem. [direnv](https://direnv.net/) 
treats the environment as a property of the project directory tree. Instead of
needing to remember to source a setup file before doing work in a project,
the mere act of entering the project directory causes the environment
to be configured. 

Now, if you're like me, this initially seems a big odd. And, you might
ask if this slows everything down. The good news is that it's quite fast
and, at least for me, it begins to feel ergonomic very quickly.


## How does it work?

[direnv](https://direnv.net/) has three key components: 
- `.envrc` files to configure the environment.
- A lightweight executable, written in [Go](https://go.dev/), to process .envrc files 
- A shell alias to ensure direnv runs to configure the environment

### .envrc files and the stdlib
`.envrc` files contain the statements and directives that configure the environment.
These files accept `bash` syntax, providing access to standard control-flow statements.
This also enables direnv to work cooperatively with other environment-management
tools, such as [Environment Modules](https://envmodules.io/). Environment modules is
quite popular in silicon engineering environments because it provides elegant support
for managing multiple versions of a tool. For example, you might load version 
5.046 of [Verilator](verilator.org) using the following command:

```
module load verilator/5.046
```

If your environment uses Environment Modules, you can add these same statements to 
your `.envrc` file and direnv will configure the proper tool versions in your environment.

In addition to using standard shell syntax to configure environment variables, Direnv
provides a standard library of helpful functions. For example, the `PATH_add` stdlib
function adds a directory to the PATH variable:

```
PATH_add scripts
```

### Shell Alias

Direnv needs to know when the working directory changes so it can update the 
environment if required. This is done by evaluating direnv's `hook` subcommand. 
In `bash`, this looks like this:

```
% eval "$(direnv hook bash)"
```

Direnv supports a [wide variety of shells](https://direnv.net/docs/hook.html), 
including bash, zsh, and tcsh. Add the appropriate statement to your shell's 
startup script and direnv will ensure that your environment is properly set
whenever you're within a directory structure containing an `.envrc` file.


## IVPM Support

The Integrated-View Package Manager (IVPM) fetches dependent packages for a
project and assembles unified views of those dependencies -- and environment
variables are a critical *view*. IVPM creates `packages/packages.envrc` with
variable settings for the project and loaded dependencies. Here is a sampling
of what it does:
- Set IVPM_PACKAGES to point to the root deps-dir
- Add the Python virtual environment to the PATH
- Load `envrc` files from dependencies

This last item is particularly relevant when it comes to open-source EDA tools
provided by the [EDAPack](https://edapack.github.io) project. These projects
provide `export.envrc` files that IVPM incorporates into the master `packages.envrc`
file. Doing so ensures that the loaded tools are automatically available in
when working in the project tree.

Using the generated envrc file is simple as well. Just add the following to 
the project `.envrc` file:

```
if [ -d packages ]; then
  source_env packages/packages.envrc
fi
```


## Conclusions and Next Steps
The [direnv](https://direnv.net) provides a project-centric approach to environment
management that ensures that your environment is always properly configured according
to your working directory. IVPM assembles a unified view of the environment variables
that should be configured based on the dependent projects it has loaded. Together,
these two tools provide an easy approach to project environment configuration.

AI has been a hot topic recently, with engineers increasingly using an AI assistant
like Claude or Codex to automate their work. Next time we'll look at how IVPM configures
project-specific context data for AI assistants to use.

## References
- [direnv](https://direnv.net)
- [EDAPack](https://edapack.github.io)
- [IVPM](https://fvutils.github.io/ivpm)
