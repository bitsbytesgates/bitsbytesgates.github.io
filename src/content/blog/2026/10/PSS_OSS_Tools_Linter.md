---
title: 'Open Source PSS: Linting'
date: 2026-10-05
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
draft: true
image: /imgs/2026/10/pss_linter_banner.png
---

<p align="center">
<img src="/imgs/2026/10/pss_linter_banner.png" width="660" alt="Your project decides what fails (Open Source PSS: linting). A .pss file with three squiggled lines goes into pssparser, which reports every finding as a warning. The findings fall into kinds -- portability, deprecated, not yet -- and a checked-in .pssparser.toml sets each kind's level: portability to error, deprecated to info (still shown, not counted), not yet to off (waived). Only the error reaches CI, which fails with exit 1."/>
</p>

<!--
Every console block below is real output from pssparser 3.1.7 (PyPI), run on
the files in public/code/2026/10/. Regenerate with
notes/2027/post-pss-linter/examples/run.sh rather than editing output by hand.
-->

Compilers check whether source code is legal according to the language
reference manual (LRM): whether the syntax is valid, whether references
resolve, and so on.

But, in many cases we don't just want to know whether the code is legal. We
want to know whether it follows best practices -- whether it will port to
other tools, and whether it avoids features that are on their way out. That's
the domain of linting tools. While lint tools are often built on top of a
compiler, their requirements are quite different. Let's see what our
[PSS Parser](/blog/PSS3.1_OSS_Tools_Parser/) offers.

Like last time, every example below is a complete file you can download
(there's a link under each one), and every output was produced by running
pssparser 3.1.7 on that file.

<!--more-->

# What a linter has to do

A compiler error means "this is not PSS." A lint warning means something
weaker: "this is PSS, but you probably want to change it." That difference
drives what a linter needs:

- **It reports what *may* be a problem.** So, by default, a lint warning
  can't stop the build.
- **It enforces preferences, and preferences differ between teams.** So the
  project, not the tool, has to choose which checks matter and how severe
  they are.
- **It can be wrong, or early.** So there has to be a supported, visible way
  to say "I know, not now." Deleting the rule isn't a waiver.

Most of this post is about the second and third points: how you control
what pssparser reports. Here's where we're going:

| A linter needs | pssparser answers with | Section |
|---|---|---|
| A way to look up what a rule means | `--list-markers`, `--describe ID` | [Every rule has a name](#every-rule-has-a-name) |
| Control over what fails the build | `-Werror`, `-Werror=ID`, `-Wno-error=ID` | [Deciding what fails](#deciding-what-fails) |
| A policy the whole team shares | `.pssparser.toml` or `pyproject.toml` | [Putting the policy in the repo](#putting-the-policy-in-the-repo) |
| Waivers | `[severity] ID = "off"` | [Waivers](#waivers) |
| Knowing which setting won | `--show-config` | [Which setting won?](#which-setting-won) |

# Two warnings

First, something to control. Here's a small piece of the DMA model we've been
using across the series, with two things a linter should point out:

```pss
package dma_types_pkg {
    enum xfer_mode_e { SINGLE, BURST };
}

package dma_pkg {
    const int MAX_LEN = 4096;
    import dma_types_pkg::*;

    component dma_c {
        action xfer_a {
            rand xfer_mode_e mode;
            rand bit[32]     len;
            constraint len <= MAX_LEN;
        }

        action burst_a {
            rand bit[32] len;
            dynamic constraint short_xfer { len <= 64; }

            activity {
                short_xfer;
                do xfer_a;
            }
        }
    }
}
```

*Source: [dma_warn.pss](/code_html/2026/10/dma_warn/) ([raw](/code/2026/10/dma_warn.pss))*

```bash
% pssparser dma_warn.pss
dma_warn.pss:7:5: warning: 'import dma_types_pkg::*;' follows a declaration; imports shall come first in a package, a component, an extension or a file (18.1.3)
 7 |     import dma_types_pkg::*;
   |     ^
  note: first declaration here
   --> dma_warn.pss:6:15
   6 |     const int MAX_LEN = 4096;
     |               ^

dma_warn.pss:21:17: warning: traversal of dynamic constraint 'short_xfer' is deprecated (13.1.1); declare it as a generic constraint, 'constraint short_xfer() { ... }'
 21 |                 short_xfer;
    |                 ^~~~~~~~~~

2 warnings in 1 file
```

**An import in the wrong place (PSS053).** The LRM says imports come first in
a scope (18.1.3). Plenty of existing code doesn't follow that rule, and many
tools accept it anyway, so pssparser reports it as a warning rather than an
error. But a tool that reads the LRM strictly is entitled to reject this
file. Moving the import to the top costs nothing and makes the model
portable. The `note:` points at the declaration the import should have come
before.

**A deprecated feature (PSS117).** `dynamic constraint` still works in 3.1,
but it's been replaced by a generic constraint that takes no parameters (see
[Simplifying Constraint Modeling](https://bitsbytesgates.com/blog/PSS3.1_PR_02_Constraints/)).
The message gives the replacement spelling, so the warning doubles as a
migration aid.

Note that the run exits with `0`. Warnings alone don't fail the run, and
that's the right default. The rest of this post is about changing it.

# Every rule has a name

You can't control a rule you can't name. `--list-markers` prints the whole
catalogue of diagnostics. Here it is, filtered to the warnings:

```bash
% pssparser --list-markers | grep -E '^ID|warning'
ID      SEV      CHECKER  SUMMARY
PSS016  warning  core     Register width has no primitive access function
PSS030  warning  core     A checker extension could not be loaded
PSS031  warning  core     Entry-point key disagrees with the checker's declared name
PSS032  warning  core     Extension requires a newer checker API than this build provides
PSS044  warning  core     Enum item hides a declaration of the same name
PSS046  warning  core     Enum item used where its enumeration type is not expected
PSS051  warning  core     Extension member not visible here
PSS052  warning  core     Explicit import conflicts with a declaration or import
PSS053  warning  core     Import after a declaration
PSS101  warning  core     Unknown annotation type (annotation disregarded)
PSS104  warning  core     Deprecated brace-less 'compile if' branch
PSS116  warning  core     Construct is accepted but not represented in the AST
PSS117  warning  core     Traversal of a deprecated dynamic constraint
PSS119  warning  core     Type width references a constant declared later
```

`--describe` documents a single entry: the LRM clause, why the rule exists,
and how to fix what it reports:

```bash
% pssparser --describe PSS117
PSS117  [warning]  checker: core
Traversal of a deprecated dynamic constraint

An activity traverses a ``dynamic`` constraint.  This still works, but LRM 13.1.1 deprecates dynamic constraints: "their functionality is replaced by a generic constraint with no parameters".

Message: ``traversal of dynamic constraint 'dc' is deprecated (13.1.1); declare it as a generic constraint, 'constraint dc() { ... }'``

Before::

    dynamic constraint dc { x > 0; }

After::

    constraint dc() { x > 0; }

Reported where the constraint is traversed.  Traversing a *fixed* named constraint is an error (PSS018).
```

One rough edge to be aware of: in 3.1.7, the human-readable output doesn't
print the ID of a built-in warning. The JSON output does, so that's the
quickest way to get from a warning to its ID:

```bash
% pssparser --json dma_warn.pss | jq -r '.diagnostics[] | "\(.line) \(.code)"'
7 PSS053
21 PSS117
```

<!-- If pssparser starts printing the ID in human output, regenerate and drop
the paragraph above and the jq example. -->

# Deciding what fails

Warnings exit `0`. That's right on a developer's desk, and wrong in CI for the
rules your team actually cares about. pssparser borrows three flags from GCC
and Clang:

- `-Werror` makes every warning an error.
- `-Werror=ID` makes just this one rule an error.
- `-Wno-error=ID` exempts this one rule from a blanket `-Werror`.

Suppose your team has decided that import placement matters now, but the move
away from dynamic constraints will happen over the next few months.
`-Werror=PSS053` says exactly that:

```bash
% pssparser -Werror=PSS053 dma_warn.pss
dma_warn.pss:7:5: error: 'import dma_types_pkg::*;' follows a declaration; imports shall come first in a package, a component, an extension or a file (18.1.3) [-Werror=PSS053]
 7 |     import dma_types_pkg::*;
   |     ^
  note: first declaration here
   --> dma_warn.pss:6:15
   6 |     const int MAX_LEN = 4096;
     |               ^

dma_warn.pss:21:17: warning: traversal of dynamic constraint 'short_xfer' is deprecated (13.1.1); declare it as a generic constraint, 'constraint short_xfer() { ... }'
 21 |                 short_xfer;
    |                 ^~~~~~~~~~

1 error, 1 warning in 1 file
% echo $?
1
```

The `[-Werror=PSS053]` suffix says *why* this is an error, so the next person
to see it doesn't conclude that the parser got stricter. And the exit code is
computed after promotion, so CI sees a `1` (see the
[exit-code table](/blog/PSS3.1_OSS_Tools_Parser/#exit-codes-as-the-ci-contract)
in the PSSParser post).

`-Werror=ID` is opt-in: one rule at a time, which is how a team adopts lint
on an existing code base without fixing the whole backlog on day one. The
opposite approach is opt-out: every warning fails, except the ones you've
exempted. That's `-Werror` plus `-Wno-error=ID`:

```bash
% pssparser -Werror -Wno-error=PSS117 dma_warn.pss
dma_warn.pss:7:5: error: 'import dma_types_pkg::*;' follows a declaration; ... (18.1.3) [-Werror]
...
dma_warn.pss:21:17: warning: traversal of dynamic constraint 'short_xfer' is deprecated (13.1.1); ...
...
1 error, 1 warning in 1 file
```

The result is the same on this file. The difference is what happens to the
*next* warning someone introduces: with the opt-in flag it stays a warning;
with the opt-out flags it fails the build.

# Putting the policy in the repo

A flag typed into one person's shell isn't a team decision. The decision
should live in the repository, and pssparser reads it from a `.pssparser.toml`
file (or a `[tool.pssparser]` table in `pyproject.toml`), found by searching
upward from the working directory.

The `[severity]` table sets the level of any rule by ID: `error`, `warning`,
`info`, `hint`, or `off`. The lower levels are useful during a migration. Set
to `info`, a deprecation stays in the output, so people keep seeing it, but it
no longer counts as a warning:

```toml
# .pssparser.toml
version = 1

[severity]
PSS117 = "info"      # migrating to generic constraints; keep it visible
```

*Source: [migrating.toml](/code_html/2026/10/migrating/) ([raw](/code/2026/10/migrating.toml)) -- save it as `.pssparser.toml`*

```bash
% pssparser dma_warn.pss
dma_warn.pss:7:5: warning: 'import dma_types_pkg::*;' follows a declaration; ... (18.1.3)
...
dma_warn.pss:21:17: info: traversal of dynamic constraint 'short_xfer' is deprecated (13.1.1); declare it as a generic constraint, 'constraint short_xfer() { ... }'
 21 |                 short_xfer;
    |                 ^~~~~~~~~~

1 warning in 1 file
```

## Waivers

**`off` is the waiver.** A waived diagnostic isn't printed, isn't counted, and
doesn't affect the exit code. Put a comment beside each waiver saying why.
That comment is the difference between a waiver and someone quietly muting a
rule.

The same table works in both directions. Here's a complete team policy: one
rule promoted to an error, one waived, and every other warning failing the
build:

```toml
# .pssparser.toml
version = 1

[severity]
PSS053 = "error"     # imports first: other tools reject the other order
PSS117 = "off"       # dynamic constraints stay until the 3.1 migration

[warnings]
error = true         # any other warning fails the build
```

*Source: [team_policy.toml](/code_html/2026/10/team_policy/) ([raw](/code/2026/10/team_policy.toml)) -- save it as `.pssparser.toml`*

```bash
% pssparser dma_warn.pss
dma_warn.pss:7:5: error: 'import dma_types_pkg::*;' follows a declaration; imports shall come first in a package, a component, an extension or a file (18.1.3)
 7 |     import dma_types_pkg::*;
   |     ^
  note: first declaration here
   --> dma_warn.pss:6:15
   6 |     const int MAX_LEN = 4096;
     |               ^

1 error in 1 file
```

Note that this time there's no `[-Werror]` suffix. The configuration made
PSS053 an error outright, rather than promoting a warning, and the output
keeps those two cases distinct.

## What waivers can't do (yet)

In 3.1.7, a waiver applies to a rule everywhere the configuration applies.
There's no inline form (a comment that waives one diagnostic on one line), and
no per-path form for generated or vendored code. Today, the workaround is
separate `--config` files for separate directories. Most linters you've used
have both, and they're on the list. If you need them, a
[GitHub issue](https://github.com/psstools/pssparser/issues) describing your
case will help shape them.

# Which setting won?

Once defaults, a configuration file and command-line flags can all set the
same value, "why did this rule fail (or not fail) the build?" becomes a real
question. `--show-config` answers it by listing every resolved value and the
layer that set it. Here it is with the team policy above:

```bash
% pssparser --show-config
Configuration files (lowest precedence first):
  .pssparser.toml

Resolved values:
  key                                value                    source
  select                             (all)                    (default)
  disable                            (none)                   (default)
  load                               (none)                   (default)
  warnings.error                     true                     .pssparser.toml
  warnings.no-error                  (none)                   (default)
  warnings.none                      false                    (default)

Severity overrides:
  severity.PSS053                    error                    .pssparser.toml
  severity.PSS117                    off                      .pssparser.toml
```

And here it is with the migration file, plus a flag someone added to their
CI job:

```bash
% pssparser -Werror=PSS053 --show-config
Configuration files (lowest precedence first):
  .pssparser.toml

Resolved values:
  key                                value                    source
  select                             (all)                    (default)
  disable                            (none)                   (default)
  load                               (none)                   (default)
  warnings.error                     PSS053                   command line
  warnings.no-error                  (none)                   (default)
  warnings.none                      false                    (default)

Severity overrides:
  severity.PSS117                    info                     .pssparser.toml
```

Every value says where it came from, so there's no need to reconstruct the
precedence rules in your head.

## Guard rails

A policy file that's silently wrong is worse than having none, so pssparser
validates its configuration and fails fast. Here are three mistakes it
catches.

You can't waive a core *error*. A core error means the model couldn't be
built, so waiving it would report success for a run that compiled nothing.
That's the line between linting and compiling from the start of this post,
enforced by the tool:

```bash
% pssparser --config waive_core_error.toml dma_warn.pss
error: waive_core_error.toml: 'PSS001' is a core error and cannot be set to 'warning'. A core error means the model could not be built, so silencing it would report success for a run that produced nothing. Use --no-warnings or a narrower 'select' if the goal is a quieter report
% echo $?
2
```

A typo in a severity is rejected, not ignored:

```bash
% pssparser --config severity_typo.toml dma_warn.pss
error: severity_typo.toml: severity for 'PSS117' must be one of error, warning, info, hint, off; got 'of'
```

And a classic TOML mistake gets an explanation, not just a rejection:

```bash
% pssparser --config checkers_table.toml dma_warn.pss
error: checkers_table.toml: unknown key 'checkers' in the pssparser configuration; use 'select'/'disable'/'load' for lists of checker names, and the singular '[checker.<name>]' table for one checker's options.
  TOML forbids a key from being both an array and a table, so 'checkers = [...]' and '[checkers.<name>]' cannot coexist in one file; the two names are what keep both spellings available.
```

*Sources: [waive_core_error.toml](/code_html/2026/10/waive_core_error/), [severity_typo.toml](/code_html/2026/10/severity_typo/), [checkers_table.toml](/code_html/2026/10/checkers_table/)*

All three exit with `2`: a broken configuration is a broken invocation, not a
broken model.

# Conclusions and next steps

A compiler decides whether your model is legal. A linter helps you decide
whether it's what you want: portable, and free of features on their way out.
pssparser does both in one pass, and leaves the decision about what fails
the build to your project.

The minimum useful setup is a few lines in the `pyproject.toml` you may
already have:

```toml
[tool.pssparser]
version = 1

[tool.pssparser.severity]
PSS053 = "error"     # imports first: other tools reject the other order
```

*Source: [pyproject.toml](/code_html/2026/10/pyproject/) ([raw](/code/2026/10/pyproject.toml))*

With that in place, the rule your team cares most about fails CI (exit code
`1`), and everything else stays a warning until you're ready for it. Combine
it with the `--json` output and exit codes from the
[PSSParser post](/blog/PSS3.1_OSS_Tools_Parser/), and lint is just another
step in your flow.

Adding more checks is an ongoing task. If there's a mistake you keep making
-- or keep finding in other people's models -- that you'd like a tool to
catch, please suggest it on
[GitHub](https://github.com/psstools/pssparser/issues). Bug reports for checks
that fire when they shouldn't are just as welcome.

## References

- [pssparser on GitHub](https://github.com/psstools/pssparser)
- [pssparser on PyPI](https://pypi.org/project/pssparser/)
- [pssparser documentation](https://dvkit.org/psstools/pssparser/):
  [command line](https://dvkit.org/psstools/pssparser/cli.html),
  [markers](https://dvkit.org/psstools/pssparser/markers.html)
- Example files used in this post:
  [dma_warn.pss](/code_html/2026/10/dma_warn/),
  [migrating.toml](/code_html/2026/10/migrating/),
  [team_policy.toml](/code_html/2026/10/team_policy/),
  [waive_core_error.toml](/code_html/2026/10/waive_core_error/),
  [severity_typo.toml](/code_html/2026/10/severity_typo/),
  [checkers_table.toml](/code_html/2026/10/checkers_table/),
  [pyproject.toml](/code_html/2026/10/pyproject/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Open Source PSS: PSSParser](/blog/PSS3.1_OSS_Tools_Parser/)
- [Post 2: Simplifying Constraint Modeling](https://bitsbytesgates.com/blog/PSS3.1_PR_02_Constraints/)
