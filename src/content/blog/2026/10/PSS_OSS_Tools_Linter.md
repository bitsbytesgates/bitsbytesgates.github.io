---
title: 'Open Source PSS: Checking Beyond the LRM'
date: 2026-10-12
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
draft: true
image: /imgs/2026/10/pss_linter_banner.png
---

<p align="center">
<img src="/imgs/2026/10/pss_linter_banner.png" width="660" alt="Checking beyond the LRM (Open Source PSS: lint rules as data). A rules.yaml file with match, where and examples sections goes into pssparser's C++ core, which evaluates CEL. It fans out to four places -- CLI, CI, editor and agent -- and each reports the same finding: warning ACME010 on claim 'buf'."/>
</p>

<!--
DRAFT (2026-10-11). Every console block in this part is real output from
pssparser built from branch lint-core-c0 (not yet released; PyPI is 3.1.7),
run on the files in public/code/2026/10/. Regenerate with
notes/2027/post-pss-linter/examples/run-rules.sh before publishing, against
the release that ships the rules engine.

Figures: notes/2027/post-pss-linter/imgs/make_figs.py (SVG) + export.sh (PNG).

Waiting on pssparser (docs/design/linter-post-readiness-2026-10-11.md):
- C6.8 (has_flag, type_decl, derives_from): the claim rule below is shown in
  its target form; memory_claims.yaml on disk is the interim form that
  produced the output. Swap the file once C6.8 lands.
- B6: the agent-authoring skill, for the "Writing rules with an agent" section.
- E1/E2: if the name-span default lands, drop `report:` from the naming rules;
  if --select lands, show the command-line form beside the TOML.
-->

Compilers check whether source code is legal according to the language
reference manual (LRM). But legal isn't the same as right. A model can be
perfectly legal PSS and still use a library in a way that can't work, or
ignore conventions that the rest of your team follows. Catching that is the
job of a linter.

Some of what a linter checks is universal. Much of it isn't: it's specific
to a library, a project or a company. In this post, we look at how
[pssparser](/blog/PSS3.1_OSS_Tools_Parser/) lets you write those checks
yourself, as a few lines of YAML rather than as a plug-in, and how the same
rule then runs on the command line, in CI, in an editor and in the hands of
an AI agent.

<!--more-->

# Checks beyond the language

Let's start with two things we'd like a tool to catch, neither of which is
an LRM violation.

**A library used in a way that can't work.** Address claims from the core
library's `addr_reg_pkg` describe a block of memory an action needs. The
solver picks the claim's size, alignment and placement, but only if the
claim is `rand`. Here's Example 348 from the
[PSS 3.1 public review draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf):

```pss
action my_action {
    transparent_addr_claim_s<> claim;
    constraint claim.alignment == 2**4;
    exec body {
        int offset = 16;
        int data = 128;
        addr_handle_t h0 = make_handle_from_claim(claim, offset);
        write32(h0, data);
        // ...
    }
};
```

Every other claim in that chapter is declared `rand`. This one isn't, so it
isn't randomized: its size, alignment and trait keep their default values,
and the constraint on `alignment` becomes a check on a fixed value rather
than a request to the solver. The model is legal, and the mistake is easy to
make (it made it into the standard's own examples). Catching it up front
saves a confusing solve failure or a test that quietly does less than you
think. A check like this also needs an escape hatch: if you really do mean a
fixed claim, you need a way to say so.

**A house convention.** Many teams name types by kind: actions end in `_a`,
components in `_c`, structs in `_s`. Nothing in the LRM cares. But if that's
your team's style, you want a tool to enforce it, rather than leave it to
code review, and you want an AI agent writing PSS for you to follow it too.
Another team will have a different convention, or none at all.

The first check is about a library that everyone shares. The second is about
one team's preferences. Neither belongs in the compiler, and the second
doesn't really belong encoded in a fixed tool. So the real question is 
how easy it is to add checks like these yourself.

<p align="center">
<img src="/imgs/2026/10/pss_linter_layers.png" width="720" alt="Legal isn't the same as right: who decides each check. A .pss model passes four gates in turn: the LRM, checked by the compiler and set by the standard; built-in lint, universal checks owned by pssparser; library rules, such as for addr_reg_pkg, owned by the library's users; and house rules, such as ACME, owned by your team. The last two are grouped as YAML rules. A model that passes all four gets a green check."/>
</p>

# Why not plug-ins?

Most lint tools answer that question with plug-ins: write code against the
tool's API, package it, install it. pssparser has that too: a Python checker
API. But plug-ins have costs that keep custom checks rarer than, perhaps, 
they could be:

- **You write code against the tool's internals.** Even a one-line
  naming rule means learning an AST API, a registration mechanism and a
  packaging story.
- **They're tied to one implementation language.** A Python plug-in runs
  where Python runs. pssparser also runs inside an editor's language server,
  through a WebAssembly (WASM) build of its C++ core under Node. A Python
  plug-in can't run there, so the check would have to be written a second
  time, in TypeScript, and the two copies kept in step.
- **They're awkward to distribute.** A team's style rules should live in the
  team's repository, next to the code they apply to, not in a package
  everyone has to install.

<p align="center">
<img src="/imgs/2026/10/pss_linter_plugin_vs_data.png" width="720" alt="Write the check once: plug-in versus rule file. A checker.py plug-in goes through the Python API and runs on the CLI and in CI, but not in the editor's WASM build, which needs a rewrite as checker.ts. A rules.yaml file goes into the C++ core and runs on the CLI and in CI, in the editor (WASM), and for an agent."/>
</p>

# Rules as data

So we're taking a different approach, borrowed from tools that have solved
the same problem elsewhere. ESLint's
[`no-restricted-syntax`](https://eslint.org/docs/latest/rules/no-restricted-syntax),
[ast-grep](https://ast-grep.github.io/reference/yaml.html) and
[Semgrep](https://semgrep.dev/docs/writing-rules/rule-syntax) all let users
write rules as data: a pattern that selects syntax-tree nodes, and a
condition. Kubernetes'
[ValidatingAdmissionPolicy](https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/)
and [protovalidate](https://github.com/bufbuild/protovalidate) write their
conditions in [CEL](https://cel.dev), the Common Expression Language: a
small expression language that can't loop forever and is cheap to evaluate.

A pssparser rule follows the same pattern:

- A rule lives in a **YAML file**, with as many rules as you like per file.
- `match:` picks the **AST nodes** the rule looks at, by kind (`Action`,
  `Field`, ...) and, optionally, by what they're inside.
- `where:` is a **CEL expression** over the node, which can call a library of
  functions that ask the linked model questions: what a reference resolves
  to, where a declaration is used, what a constant evaluates to.
- `examples:` are small models marked with the findings they should produce.
  They're the rule's **tests**, and its documentation.

The rule files are interpreted by pssparser's C++ core, not by Python. That
core is the same one the Python CLI uses and the one compiled to WASM for
Node, so a rule file runs unchanged on the command line, in CI and in an
editor.

# What a rule looks like

Here's the action naming rule:

```yaml
# house_naming.yaml -- ACME house naming conventions
pss-rules:
  defaults:
    family: naming
    tier: style
    severity: warning

  rules:
    - id: ACME001
      name: action-suffix
      summary: Action type names end in '_a'.
      message: "action '${node.name.id}' should end in '_a'"
      match: { kind: Action }
      where: "!node.name.id.endsWith('_a')"
      report: "[node.name]"
      examples:
        - code: |
            component pss_top {
              action xfer { }      // expect: ACME001
              action xfer_a { }
            }
```

*Source: [house_naming.yaml](/code_html/2026/10/house_naming/) ([raw](/code/2026/10/house_naming.yaml))*

<p align="center">
<img src="/imgs/2026/10/pss_linter_anatomy.png" width="720" alt="Anatomy of rule ACME001 action-suffix. From the AST, match kind: Action picks two action nodes, xfer and xfer_a. where !endsWith('_a') keeps xfer. report puts warning ACME001 under the name in 'action xfer { }'. Below, the examples lane: xfer expects ACME001, xfer_a expects nothing, and --check-rules passes."/>
</p>

Taking it a field at a time:

- **`id` and `name`.** `ACME001` and `action-suffix` both name the rule
  anywhere pssparser takes one: on the command line, in configuration, in
  waivers. The `ACME` prefix is your namespace; pssparser reserves only its
  own (`PSS`, `PSSP`, `LINT`).
- **`match`.** The rule looks at every `Action` declaration.
- **`where`.** It fires when the name doesn't end in `_a`. `node.name` is an
  identifier node; `.id` is its text.
- **`message`.** `${...}` pulls values from the model into the message.
- **`report`.** Report at the action's name rather than across its whole
  body.
- **`examples`.** `xfer` must be reported, and `xfer_a` must not.
- **`defaults`.** The `family`, `tier` and `severity` apply to every rule in
  the file. A `style` rule normally reports a hint, which only an editor
  shows; this file asks for a warning instead.

The file has two more rules just like it: components end in `_c` (with
`pss_top` exempt) and structs end in `_s`.

# Turning rules on

Rule files are named in the project's configuration: the `.pssparser.toml`
file (or `[tool.pssparser]` table in `pyproject.toml`) that holds the rest
of pssparser's settings. A rule from a file runs once it's selected:

```toml
# .pssparser.toml
version = 1

[lint]
rules = ["house_naming.yaml", "memory_claims.yaml"]
select = ["ACME"]
```

*Source: [house_rules.toml](/code_html/2026/10/house_rules/) ([raw](/code/2026/10/house_rules.toml)) -- save it as `.pssparser.toml`*

`rules` takes files or directories (every rule file directly in a
directory is loaded), relative to the configuration file. `--rules PATH` on
the command line adds more. `select = ["ACME"]` turns on every rule in the
`ACME` namespace.

Here's a small DMA model with a few problems:

```pss
import addr_reg_pkg::*;

struct dma_desc {
    rand bit[32] src;
    rand bit[32] dst;
    rand bit[16] len;
}

component dma_engine {
    action xfer_a {
        rand dma_desc               desc;
        transparent_addr_claim_s<>  buf;
        constraint buf.size == desc.len;
    }
}

component pss_top {
    transparent_addr_space_c<> sys_mem;
    dma_engine                 dma;
}
```

*Source: [dma_house.pss](/code_html/2026/10/dma_house/) ([raw](/code/2026/10/dma_house.pss))*

```bash
% pssparser dma_house.pss
dma_house.pss:3:8: warning: [ACME003] struct 'dma_desc' should end in '_s'
 3 | struct dma_desc {
   |        ^~~~~~~~

dma_house.pss:9:11: warning: [ACME002] component 'dma_engine' should end in '_c'
 9 | component dma_engine {
   |           ^~~~~~~~~~

dma_house.pss:12:37: warning: [ACME010] claim 'buf' is not 'rand', so it is not randomized: its size, alignment and trait keep their default values
 12 |         transparent_addr_claim_s<>  buf;
    |                                     ^~~

3 warnings in 1 file
```

## Your rules are first-class rules

Once loaded, a rule from a file is a rule like any built-in one. It's in
the catalogue:

```bash
% pssparser --list-markers | grep -E '^ID|ACME'
ID       SEV       CHECKER    SUMMARY
ACME001  warning   pss-rules  Action type names end in '_a'.
ACME002  warning   pss-rules  Component type names end in '_c'.
ACME003  warning   pss-rules  Struct type names end in '_s'.
ACME010  warning   pss-rules  An address claim is not declared 'rand'.
```

`--explain` documents it, including where it's defined and its first
example:

```bash
% pssparser --explain ACME001
ACME001 action-suffix
Action type names end in '_a'.

  tier:              style
  family:            naming
  analysis level:    L0
  scope:             file
  matches:           Action
  defined in:        house_naming.yaml:9:7
  default severity:  warning
  fix:               none available

Flagged (example 1):

    component pss_top {
      action xfer { }
      action xfer_a { }
    }
```

The warning policy applies to it. Here the naming family fails the build,
and the claim check stays a warning:

```bash
% pssparser -Werror=family:naming dma_house.pss
dma_house.pss:3:8: error: [ACME003] struct 'dma_desc' should end in '_s' [-Werror=family:naming]
 3 | struct dma_desc {
   |        ^~~~~~~~

dma_house.pss:9:11: error: [ACME002] component 'dma_engine' should end in '_c' [-Werror=family:naming]
 9 | component dma_engine {
   |           ^~~~~~~~~~

dma_house.pss:12:37: warning: [ACME010] claim 'buf' is not 'rand', so it is not randomized: its size, alignment and trait keep their default values
 12 |         transparent_addr_claim_s<>  buf;
    |                                     ^~~

2 errors, 1 warning in 1 file
% echo $?
1
```

And it can be waived in the source, with a reason, when the convention
doesn't fit:

```pss
// pssparser waive ACME002: name fixed by the IP-XACT import
component dma_engine {
```

```bash
% pssparser waived.pss
waived.pss:3:8: warning: [ACME003] struct 'dma_desc' should end in '_s'
...
waived.pss:13:37: warning: [ACME010] claim 'buf' is not 'rand', so it is not randomized: its size, alignment and trait keep their default values
...
2 warnings in 1 file (1 waived)
```

# A rule that knows the library

The naming rules only look at names. The claim rule has to know about
types: it needs to ask "is this field's type a claim?", including when the
type is a user's subtype of a claim several levels down. That takes the
linked model, not just the syntax tree:

```yaml
# memory_claims.yaml
pss-rules:
  rules:
    - id: ACME010
      name: claim-not-rand
      tier: suspicious
      family: decl
      summary: An address claim is not declared 'rand'.
      message: >-
        claim '${node.name.id}' is not 'rand', so it is not randomized:
        its size, alignment and trait keep their default values
      match: { kind: Field, inside: { kind: Action } }
      let:
        t: type_decl(node.type)
      where: >-
        !has_flag(node.attr, FieldAttr.Rand) && t.hasValue()
        && derives_from(t.value(), "addr_reg_pkg::addr_claim_base_s")
      examples:
        - code: |
            import addr_reg_pkg::*;
            component pss_top {
              transparent_addr_space_c<> mem;
              action my_action {
                transparent_addr_claim_s<> claim;       // expect: ACME010
                rand transparent_addr_claim_s<> ok;
              }
            }
```

*Source: [memory_claims.yaml](/code_html/2026/10/memory_claims/) ([raw](/code/2026/10/memory_claims.yaml))*

<!-- TODO(C6.8): the source file is still the interim form, until
type_decl / has_flag / derives_from land. Same findings. -->

<p align="center">
<img src="/imgs/2026/10/pss_linter_claim_types.png" width="720" alt="A rule that knows the library: ACME010 claim-not-rand. The field 'transparent_addr_claim_s&lt;&gt; buf;' has no rand and is flagged. type_decl follows its type to transparent_addr_claim_s in addr_reg_pkg; derives_from walks up through addr_claim_s to addr_claim_base_s. A user's own subtype, my_dma_claim_s, sits below transparent_addr_claim_s and matches the same way."/>
</p>

`type_decl` follows the field's type (through typedefs and template
specializations) to its declaration, and `derives_from` walks its base
types. Because the base type is named as a path into the core library, the
rule catches `transparent_addr_claim_s`, `addr_claim_s` and any subtype of
them that you define yourself. The `let:` entry names an intermediate value
so that `where:` stays readable.

This is the kind of rule that's worth sharing beyond one team. Anyone who
uses `addr_reg_pkg` can make this mistake, so a rule written once can be
used by every PSS user.

# The same rules in the editor

Since the rules run in the C++ core, the WASM build used by editor tooling
runs them too. Here are the same two rule files, and the same model, run
from Node:

```js
import { readFileSync } from 'node:fs';
import { createParser } from '@psstools/pssparser';

const read = (f) => readFileSync(f, 'utf8');
const parser = await createParser();
parser.parseSources([{ name: 'dma_house.pss', content: read('dma_house.pss') }]);
parser.link();
parser.loadRules([
  { name: 'house_naming.yaml',  text: read('house_naming.yaml') },
  { name: 'memory_claims.yaml', text: read('memory_claims.yaml') },
]);
for (const m of parser.runLint().markers)
  console.log(`${m.file}:${m.line}:${m.col}: ${m.severity}: [${m.code}] ${m.message}`);
```

*Source: [lint_in_node.mjs](/code_html/2026/10/lint_in_node/) ([raw](/code/2026/10/lint_in_node.mjs))*

```bash
% node lint_in_node.mjs
dma_house.pss:3:8: warning: [ACME003] struct 'dma_desc' should end in '_s'
dma_house.pss:9:11: warning: [ACME002] component 'dma_engine' should end in '_c'
dma_house.pss:12:37: warning: [ACME010] claim 'buf' is not 'rand', so it is not randomized: its size, alignment and trait keep their default values
```

The same findings, at the same positions, from the same rule files. Hooking
this into the PSS language server, so rules show up as you type, is the next
step.

# Writing rules with an agent

Our naming rule is the kind of thing a team decides in a meeting and then
never quite gets around to enforcing. Writing the rule is now short work,
and it's work an AI agent does well, because the format gives the agent
something it can check.

<p align="center">
<img src="/imgs/2026/10/pss_linter_agent_loop.png" width="720" alt="Writing rules with an agent: write the rule and its examples, run --check-rules, and loop back on a PSSP215 type error or a PSSP222 example failure. When it passes, the resulting rules.yaml is used by both the team and the agent."/>
</p>

The loop goes like this: write the rule and its examples, run
`pssparser --check-rules`, fix what it reports, and repeat. Two things make
that loop tight. First, expressions are type-checked when the file loads,
and the errors say what to write instead. Here, the rule used the
identifier node where it needed the text:

```bash
% pssparser --check-rules typo.yaml
typo.yaml:14:16: error: [PSSP215] no matching overload for 'endsWith' applied to (ExprId, string) (the first is the receiver); it takes string.endsWith(string) -> bool
 14 |       where: "!node.name.endsWith('_a')"
    |                ^
```

Second, the examples are run as tests. Drop the `!` from the action rule,
and both of its examples fail:

```bash
% pssparser --check-rules action_rule.yaml
action_rule.yaml:17:11: error: [PSSP222] example 'example 1' of ACME001: expected ACME001 at line 2, but it was not reported
 17 |         - code: |
    |           ^

action_rule.yaml:17:11: error: [PSSP222] example 'example 1' of ACME001: ACME001 was reported at 3:10, which the example does not expect
 17 |         - code: |
    |           ^

2 errors in 1 file
```

pssparser ships agent skills that describe how to use it. We're adding one
that teaches rule writing: the file format, the function library, and this
loop. With it, a request like this becomes a reviewed, tested rule file:

> Our house style is that action types end in `_a`, components in `_c`
> (except `pss_top`) and structs in `_s`. Write pssparser rules for it, with
> examples, and check them.

<!-- TODO(B6): once the pss-rules skill ships, run that prompt for real and
show the transcript (prompt, rule, --check-rules run). Don't write it by
hand. -->

The same rule files then tell the agent what your house style *is*: point it
at them, or let it run `pssparser` on what it writes, and it gets the same
findings you'd get in review.

# What we have, what we don't, and how you can help

What's here today is a framework. The rule format, the CEL engine, the
example-driven tests and the configuration all work, on the command line and
in WASM. What's thin is the set of rules: pssparser's own checks are still
the handful of warnings from the
[last post](/blog/PSS3.1_OSS_Tools_Parser/), and the library of functions
that rules can call is growing as we write rules that need them.

That's where we'd like your help:

- **Try the format.** Write a rule for a convention your team follows, and
  tell us where the format got in the way.
- **Share rules for shared libraries.** A rule about `addr_reg_pkg` or
  `std_pkg` usage helps everyone who uses them. Those can become built-in
  rules.
- **Report the gaps.** If a rule you want can't be written because a
  function is missing, that's exactly the input we need.

Issues and pull requests are welcome on
[GitHub](https://github.com/psstools/pssparser/issues). PSS is a young
language with a small community, and every check we write once, in the
open, is one that no team has to rediscover or rewrite for its own flow.
The more of that knowledge lives in shared tools, the easier PSS gets for
everyone.

## References

- [pssparser on GitHub](https://github.com/psstools/pssparser)
- [pssparser documentation](https://dvkit.org/psstools/pssparser/)
- Example files used in this post:
  [dma_house.pss](/code_html/2026/10/dma_house/),
  [house_naming.yaml](/code_html/2026/10/house_naming/),
  [memory_claims.yaml](/code_html/2026/10/memory_claims/),
  [house_rules.toml](/code_html/2026/10/house_rules/),
  [lint_in_node.mjs](/code_html/2026/10/lint_in_node/)
- [CEL, the Common Expression Language](https://cel.dev)
- [ast-grep rule reference](https://ast-grep.github.io/reference/yaml.html),
  [Semgrep rule syntax](https://semgrep.dev/docs/writing-rules/rule-syntax),
  [ESLint no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Open Source PSS: PSSParser](/blog/PSS3.1_OSS_Tools_Parser/)
