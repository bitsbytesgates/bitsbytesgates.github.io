# PSS in the Open: PSSParser

> **Status: outline, not prose.** Each section lists the two or three things the
> text underneath has to convey, and carries the code and captured output that
> section is built around. Everything in a `console` block below is real output
> from **pssparser 3.1.1**, installed from PyPI into a throwaway venv on
> 2026-09-09. Nothing was retyped. The `.pss` files live in
> `notes/2027/post-pssparser/examples/`.
>
> This is series post 3 in `notes/2027/pss_series_plan.md` -- *"Does It Parse?
> Checking PSS with an Open Source Parser."* Before publishing, move the
> examples into the harness described in the plan's *Testing the examples*
> section (`cmds/NN-name.cmd` + `.out` + `.exit`, `make check`) so the goldens
> below are regenerated rather than pasted.

---

## Front matter

```yaml
title: 'Does It Parse? Checking PSS With an Open Source Parser'
date: 2026-10-XX
categories: [PSS, Open Source EDA]
series: PSS in the Open
seriesOrder: 3
draft: true
syndicate: derived
tools:
  pssparser: 3.1.1
```

Splash: terminal-shaped banner, the caret diagnostic as the hero image. Same
style as `post-01/imgs/pss31_public_review_banner.svg`.

---

## The three post-level points

Everything else in the post is evidence for these:

1. **Nothing stands between you and a working PSS front end.** One `pip
   install`, three seconds, no build, no license, no environment module. That
   is the point -- not the milliseconds it then takes to run.
2. **The diagnostics are written for a person reading them at 5pm** -- caret
   under the exact span, a stable ID on every message, and a `--syntax-only`
   flag that tells you *which half* of the tool rejected you.
3. **It was a CI citizen on day one**, because `--json` and real exit codes were
   there before the pretty output was.

---

## Opening (before `<!--more-->`)

Key points:

- Open on the loop, not the tool. Writing PSS today for most people means
  editing a file, launching something big, and finding out ninety seconds later
  that you left off a semicolon. That is not a compile error, that is an
  interruption.
- Every other language solved this a long time ago with a front end you can run
  on its own. PSS didn't have one you could just install.
- Now it does: `pip install pssparser`, Apache-2.0, targets PSS 3.1. This post
  is what you get for that one command.

`<!--more-->`

---

## Three Seconds to a Working Parser

Key points:

- Lead with the install, because **the install is the argument**. This is the
  section carrying point 1, and it should get the space that implies. The
  normal cost of trying an EDA tool is not the tool -- it's the license server,
  the environment module, the version of a compiler you don't have, the
  half-day of somebody else's time. Here the entire cost is one line in a
  throwaway venv.
- Say what is *absent*, item by item, because each absence is something a
  reader has personally lost an afternoon to: no build (a prebuilt manylinux
  wheel), no toolchain (no compiler, no ANTLR, no JDK), no license, no
  registration, no site setup, and nothing installed outside the venv. Deleting
  the directory uninstalls it.
- Note the size honestly -- 16 MB, because the parser is a C++ extension and
  the wheel carries it. That is the trade for not building it yourself, and it
  is a good trade.
- The version string is the last thing worth showing: it tracks the LRM
  revision it targets, so `3.1.1` means "PSS 3.1, first patch," not a private
  numbering nobody can map to the standard.
- Land the consequence rather than the number: an install this cheap is
  *disposable*, and disposable is what makes it reasonable to put in a CI job,
  a pre-commit hook, a container layer, or a colleague's shell while you're
  standing behind them. A tool you have to requisition gets evaluated once. A
  tool that costs three seconds gets used.

```console
$ python3 -m venv venv && . venv/bin/activate
$ pip install pssparser
Downloading pssparser-3.1.1-cp312-cp312-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.3 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 16.3/16.3 MB 9.4 MB/s eta 0:00:00
Downloading ciostream-0.0.1.post23931272192-cp312-cp312-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (321 kB)
Downloading debug_mgr-0.0.2.33288736809-cp312-cp312-manylinux_2_34_x86_64.whl (261 kB)
Installing collected packages: debug-mgr, ciostream, pssparser
Successfully installed ciostream-0.0.1.post23931272192 debug-mgr-0.0.2.33288736809 pssparser-3.1.1

$ pssparser --version
3.1.1
```

Timed, cold cache, on a laptop:

```console
$ time pip install -q --no-cache-dir pssparser

real	0m2.428s
user	0m0.493s
sys	0m0.062s
```

**Drafting note.** The `notes/2027/post-01/README.md` says pssparser "is a
C++/Cython extension -- it has to be built, not just downloaded," and that the
CI examples lane needs a prebuilt image. That was true when it was written and
is no longer true for `x86_64` Linux + CPython 3.12: PyPI serves a manylinux
wheel. Check the wheel matrix before repeating the claim, and fix the note in
the series plan either way.

---

## The Boring Case, Deliberately First

Key points:

- Show a model that is *fine* before showing one that isn't. A tool's success
  output is a design decision and this one made the right call: a single line,
  and nothing else.
- Introduce the running model here and then stop explaining it. It's the DMA
  engine from the [Intro to PSS](/series/intro-to-pss/) series -- a buffer, a
  component, two actions -- so a reader who followed that series is already
  oriented and a reader who didn't loses nothing.
- Exit 0. Say it once, in prose, and let the exit-code table at the end do the
  rest.

```pss
package dma_pkg {

    buffer data_b {
        rand bit[32] size;
        constraint size in [64..4096];
    }

    component dma_c {

        action mem2mem_a {
            input  data_b src;
            output data_b dst;

            rand bit[64] src_addr, dst_addr;

            constraint c_align {
                src_addr % 4 == 0;
                dst_addr % 4 == 0;
            }
        }

        action xfer_a {
            output data_b dst;
            rand bit[32] sz;

            constraint c_sz { dst.size == sz; }
        }
    }
}
```

```console
$ pssparser dma.pss
0 errors in 1 file
```

One sentence on run time and then drop it: it's fast enough to be a save
action, and there is no PSS front end to benchmark it against, so a number here
would be theatre. What matters is that the answer arrives while you're still
looking at the terminal.

```console
$ time pssparser -q dma.pss

real	0m0.088s
user	0m0.084s
sys	0m0.003s
```

---

## What a Diagnostic Looks Like

Key points:

- This is the section the post exists for. State the shape once --
  `file:line:col: severity: message`, then the source line, then a caret
  underlining the span -- and note that it's the Rust/Clang convention on
  purpose, because it's the one every editor, CI system and human already
  parses.
- The message names the token it expected *and* the token it found. Both halves
  matter: "expected `;`" tells you the fix, "before `constraint`" tells you
  where you actually are, which is usually a line earlier than you think.
- **Suggestions are worth their own beat.** An unresolved name gets a
  "did you mean" with the replacement printed under the caret in green -- the
  thing that turns a typo from a lookup into a glance:

  ```console
  $ pssparser gc-value.pss
  gc-value.pss:6:26: error: unknown identifier 'max'; did you mean 'map'?
   6 |         constraint j == max(k, l);
     |                          ^~~
     |                          map
  ```

  *(The suggestion is only as good as the symbol table -- here the nearest name
  is a stdlib type, which is its own small joke. Worth one line, because a
  reader who hits an unhelpful suggestion should know why.)*
- Don't over-claim on the other half. The renderer also supports `note:`
  related locations, and the core checker in 3.1.1 doesn't emit any. Say so in
  the honest-ledger section rather than showing a feature that isn't there.

A missing semicolon -- and note that the caret lands on the *next* line, which
is where the parser found out:

```console
$ pssparser missing-semi.pss
missing-semi.pss:26:13: error: expected ';' before 'constraint'
 26 |             constraint c_sz { dst.size == sz; }
    |             ^~~~~~~~~~

1 error in 1 file
```

MSB: Would it make sense to show the preceding content, since the missing
semicolon is likely after a declaration or statement?

A duplicate declaration, where the caret span carries the information:

```console
$ pssparser dup.pss
dup.pss:11:27: error: duplicate declaration of 'sz'
 11 |             rand bit[8]  sz;
    |                           ^~

1 error in 1 file
```

MSB: It's great to know about a duplicate, but even better to know where
it was previously defined (or, where the compiler thinks it is)

Two declarations of one function that disagree -- the case where a plain
"redeclaration" message would have been useless:

```console
$ pssparser fndisagree.pss
fndisagree.pss:3:19: error: declarations of 'start_dma' disagree about the return type
 3 |     function bit start_dma(bit[32] sz);
   |                   ^~~~~~~~~

1 error in 1 file
```

MSB: Here, again, it would be create to show the disagreement. We see one, but not
the other(s)

A warning, which is where the severity column earns its place:

```console
$ pssparser warn.pss
warn.pss:4:10: warning: 'compile if' branch without enclosing braces is deprecated
 4 |         buffer data_b { rand bit[32] size; }
   |          ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

MSB: This doesn't look right. where's the compile if?

**Say out loud that this one exits 0.** There is no `--Werror` in 3.1.1, so a
team that wants warnings to fail CI has to check the summary or the `--json`
stream themselves. That is a real gap and naming it costs nothing.

MSB: pssparser should have a -Werror option

---

## Two Halves: Parsing and Linking

Key points:

- The single most useful thing a new user can learn about this tool, and it
  takes one example: `--syntax-only` parses and stops; the default also links,
  which is where symbol resolution, type lookup and cross-file references
  happen.
- Why you care: the flag is a bisection tool. If the error survives
  `--syntax-only`, it's grammar. If it vanishes, it's a name that didn't
  resolve -- a missing file on the command line, a missing `import`, a typo in
  a type name. Two runs, and you know which kind of problem you have.
- The other consequence, worth one sentence: syntax errors stop the run before
  linking, so a file with one stray brace will hide every unresolved-type error
  behind it. Fix the syntax first; the second list is usually shorter than it
  looks.

The same file, both ways:

```console
$ pssparser undef-type.pss
undef-type.pss:11:21: error: unknown type 'descriptor_b'
 11 |             input  descriptor_b src;
    |                     ^~~~~~~~~~~~

1 error in 1 file
```

MSB: Wouldn't it be great to have a 'did you mean ...' with close matches?

```console
$ pssparser --syntax-only undef-type.pss
0 errors in 1 file
```

Linking is also what makes the multi-file case work. A package in one file, a
component that imports it in another:

```pss
// dma_lib.pss
package dma_lib_pkg {
    buffer data_b {
        rand bit[32] size;
        constraint size in [64..4096];
    }
}
```

```pss
// dma_use.pss
import dma_lib_pkg::*;

component dma_c {
    action xfer_a {
        input  data_b src;
        output data_b dst;
    }
}
```

```console
$ pssparser dma_lib.pss dma_use.pss
0 errors in 2 files
```

Forget the library on the command line and the failure is legible rather than
mysterious -- the import fails first, and the two types it should have brought
in fail after it:

```console
$ pssparser dma_use.pss
dma_use.pss:1:9: error: unknown type 'dma_lib_pkg'
 1 | import dma_lib_pkg::*;
   |         ^~~~~~~~~~~

dma_use.pss:5:17: error: unknown type 'data_b'
 5 |         input  data_b src;
   |                 ^~~~~~

dma_use.pss:6:17: error: unknown type 'data_b'
 6 |         output data_b dst;
   |                 ^~~~~~

3 errors in 1 file
```

**Drafting note:** three errors from one root cause is the honest version of
this example and the post should say so -- there's no "first error wins"
suppression here. That's the natural hand-off to `--max-errors`.

---

## When Everything Is Broken

Key points:

- The failure mode this flag exists for: one bad edit produces forty
  diagnostics and the one you needed scrolled off the top. Default is 20;
  `--max-errors N` cuts it lower, `0` turns the cap off.
- The design detail worth pointing at: hitting the cap is itself a diagnostic
  (`PSS029`), with a location, rather than silent truncation. You always know
  the list was cut.
- Keep this section short. It's a flag, not a feature.

Eight unresolved types, capped at three:

```console
$ pssparser --max-errors 3 broken2.pss
broken2.pss:3:28: error: unknown type 'undef1_b'
 3 |         action a1 { input undef1_b f; }
   |                            ^~~~~~~~

broken2.pss:4:28: error: unknown type 'undef2_b'
 4 |         action a2 { input undef2_b f; }
   |                            ^~~~~~~~

broken2.pss:5:28: error: unknown type 'undef3_b'
 5 |         action a3 { input undef3_b f; }
   |                            ^~~~~~~~

broken2.pss:6:28: error: too many errors (3); stopped reporting further errors for this file
 6 |         action a4 { input undef4_b f; }
   |                            ^~~~~~~~

4 errors in 1 file
```

---

## Every Message Has a Number

Key points:

- The part that turns a checker into a platform: every diagnostic carries a
  stable ID, the IDs are enumerable, and each one has documentation you can
  read from the command line. That is what makes "we suppress PSS104 in
  generated code" a sentence a team can actually write down.
- The discovery path is three flags and no documentation site:
  `--list-checkers`, `--list-markers`, `--describe ID`. None of them need a
  source file, which means they work before you have anything to check.
- Point at the shape of the numbering rather than the list: `PSS0xx` is
  syntax and symbol resolution, `PSS1xx` is the 3.1 semantic rules --
  annotations, `mutable`, exec tags, mustache templates. The catalogue is a
  map of what the front end actually enforces.

```console
$ pssparser --list-markers
ID      SEV      CHECKER  SUMMARY
---------------------------------
PSS001  error    core     Syntax error
PSS002  error    core     Unknown symbol reference
PSS003  error    core     Duplicate symbol declaration
PSS004  error    core     Symbol or ref-path resolution failure
PSS005  error    core     Cannot extend unknown type or enum
...
PSS104  warning  core     Deprecated brace-less 'compile if' branch
PSS105  error    core     Illegal 'mutable' qualifier
PSS106  error    core     Exec block tag not permitted on this exec kind
PSS107  error    core     Member selection on a slice
PSS108  error    core     Unterminated mustache expression
PSS109  error    core     Malformed mustache expression
```

*(34 markers in 3.1.1 -- the post shows the ends of the list and says so.)*

```console
$ pssparser --describe PSS001
PSS001  [error]  checker: core
Syntax error

The parser encountered a token it did not expect.  Messages include patterns such as:

* ``expected ';' before '}'``
* ``unexpected end of input; possible missing closing '}'``
* ``unexpected '<token>' in this context``
* ``expected identifier before '<token>'``
* ``syntax error at '<token>'``

Check that the surrounding PSS syntax is well-formed.
```

---

## Thirty Lines Is a Lint Rule

Key points:

- This is the teaser for post 4, sized as a teaser: show that the extension
  point is real by using it once, and leave packaging, entry points and CI
  wiring to the post that owns them.
- The claim to make and immediately support: a house rule is a small Python
  class, not a patch to a compiler. Subclass `CheckerBase`, declare your
  markers, walk the AST, call `add_marker`.
- The two details that save an implementer an hour, stated as asides rather
  than a tutorial: pick your own three-letter ID prefix, because `PSS` is
  reserved for the core; and filter `global_scopes` down to `ctx.files`, or you
  will lint the standard library too.

One real guideline -- *flow-object types carry a suffix naming their kind* --
as a checker:

```python
from pssparser.checkers.base import CheckerBase
from pssparser.checkers.markerdef import MarkerDef
from pssparser.ast import StructKind


class BufferNameChecker(CheckerBase):
    name = "buffer-naming"
    description = "buffer types must be named *_b"
    marker_defs = [MarkerDef(
        id="HSE001",
        severity="warning",
        summary="Buffer type name does not end in '_b'",
        detail="House style: flow-object types carry a suffix naming their "
               "kind, so a reader of an action's input/output list can see "
               "what changes hands without looking the type up.")]

    def check(self, ctx):
        for gs in ctx.global_scopes:
            path = ctx.file_map.get(gs.getFileid(), gs.getFilename())
            if path in ctx.files:
                self._scan(ctx, path, gs)

    def _scan(self, ctx, path, node):
        if type(node).__name__ == "Struct" and node.getKind() == StructKind.Buffer:
            name = node.getName().getId()
            if not name.endswith("_b"):
                loc = node.getName().getLocation()
                ctx.add_marker(code="HSE001", file=path,
                               line=loc.lineno, col=loc.linepos,
                               extent=len(name),
                               message=f"buffer '{name}' should be named '{name}_b'")
        for c in getattr(node, "getChildren", list)():
            self._scan(ctx, path, c)
```

Loaded straight off disk -- no packaging step while you iterate:

```console
$ pssparser --load-checker style:BufferNameChecker dma-style.pss
dma-style.pss:3:12: warning: [HSE001] buffer 'data' should be named 'data_b'
 3 |     buffer data {
   |            ^~~~

1 warning in 1 file
```

And it is a first-class citizen the moment it loads -- same catalogue, same
`--describe`:

```console
$ pssparser --load-checker style:BufferNameChecker --list-checkers
Registered checkers (2):
  core                 Built-in parser and linker diagnostics [built-in]
    markers: PSS001 PSS002 PSS003 PSS004 PSS005 ...
  buffer-naming        buffer types must be named *_b
    markers: HSE001
```

```console
$ pssparser --load-checker style:BufferNameChecker --describe HSE001
HSE001  [warning]  checker: buffer-naming
Buffer type name does not end in '_b'

House style: flow-object types carry a suffix naming their kind, so a reader of
an action's input/output list can see what changes hands without looking the
type up.
```

Close the section with the hand-off: `--checker` and `--no-checker` select what
runs, and a `pssparser.checkers` entry point ships the rule as a package. Post 4
does that.

---

## Putting It in CI

Key points:

- The argument is that no adapter was needed. `--json` and meaningful exit
  codes were in the tool before the caret rendering was, so wiring it up is a
  `jq` one-liner, not a plug-in.
- Show the JSON in full for one diagnostic -- it's small, and the reader should
  see that `code`, `end_col` and the `summary` block are all there. `end_col`
  is what an editor needs to draw a squiggle of the right length; it's the same
  span the caret underlines.
- The point that matters more than the mechanics: it is the *same* ID in the
  terminal, in the editor, and in the CI annotation. One vocabulary.

```console
$ pssparser --json undef-type.pss
{
  "diagnostics": [
    {
      "file": "undef-type.pss",
      "line": 11,
      "col": 21,
      "severity": "error",
      "message": "unknown type 'descriptor_b'",
      "end_col": 33,
      "code": "PSS002"
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 0,
    "files": 1
  }
}
```

Straight into GitHub Actions annotations:

```console
$ pssparser --json broken2.pss | jq -r \
    '.diagnostics[] | "::\(.severity) file=\(.file),line=\(.line),col=\(.col)::[\(.code)] \(.message)"'
::error file=broken2.pss,line=3,col=28::[PSS002] unknown type 'undef1_b'
::error file=broken2.pss,line=4,col=28::[PSS002] unknown type 'undef2_b'
::error file=broken2.pss,line=5,col=28::[PSS002] unknown type 'undef3_b'
::error file=broken2.pss,line=6,col=28::[PSS002] unknown type 'undef4_b'
```

The whole workflow step, which is the artifact readers will actually copy:

```yaml
- run: pip install pssparser
- run: |
    pssparser --json $(git ls-files '*.pss') \
      | jq -r '.diagnostics[] | "::\(.severity) file=\(.file),line=\(.line),col=\(.col)::[\(.code)] \(.message)"'
    exit ${PIPESTATUS[0]}
```

Exit codes, captured rather than asserted:

| Situation | Exit |
|---|---|
| clean | 0 |
| warnings only | 0 |
| any error | 1 |
| file not found / no files given | 2 |

```console
$ pssparser nope.pss ; echo "exit=$?"
error: file not found: nope.pss
exit=2
```

---

> **Cut, recorded so it doesn't come back: a "Does It Scale?" section.** There
> was a draft of one -- 200 files, 2000 actions, 6600 lines, 0.2s. It's out.
> Setup cost is the thing a reader can act on and the thing that's genuinely
> different here; parse speed has no comparison basis, since there is no other
> PSS parser to hold it against, so the number reads as filler. The one line
> about run time in *The Boring Case* is the whole treatment. The capture is
> preserved in `notes/2027/post-pssparser/scale.txt` if a reviewer asks.

---

## What It Doesn't Do Yet

Key points:

- Reframe the honest-ledger habit as method, the way post 1 did: running
  everything through the tool also maps where the tool stops. A reader
  deciding whether to adopt it needs this section more than the flattering
  ones.
- Lead with the two that will actually cost someone time, and give each one
  sentence.
- Then the fairness note, in the same breath: a front end that enforced every
  semantic rule in the LRM would be a different kind of tool, and none of this
  is a complaint.

As of pssparser 3.1.1:

- **No `note:` related locations from the core checker.** The renderer and the
  JSON schema both support them -- and a plug-in checker can emit them today
  via `add_marker(related=...)` -- but no built-in diagnostic does. An unclosed
  brace reports where the parser gave up, not where the brace was opened:

  ```console
  $ pssparser unclosed.pss
  unclosed.pss:29:1: error: unexpected end of input; missing closing '}'

  1 error in 1 file
  ```

  This is the one place the post should *not* dress up the output. The message
  is correct and the location is useless, which is exactly what an unclosed
  scope looks like to a parser without a related-location pass.

- **No `--Werror`.** Warnings exit 0, so gating on them means reading the
  summary or the JSON yourself.

- **Linking is not full semantic checking.** `--dump-ast` and the AST post
  (series post 9) get into this; the honest short version is that a clean parse
  means the names resolve, not that the model is correct. Post 1 already
  showed a few 3.1 rules that link clean and shouldn't -- cross-link rather
  than re-list.

- **The caret's column is one past the token on some diagnostics.** Cosmetic,
  visible in the `unknown type` examples above, and worth an issue rather than
  a paragraph. *(Check whether this is fixed before publishing; if it is,
  regenerate every golden in this post.)*

---

## Wrapping Up

Key points:

1. Recap as a single command line, not a list: `pip install pssparser`, then
   `pssparser *.pss`. Two commands, and the first one is the news.
2. The point to leave them with is the second one, not the first -- the reason
   this matters isn't the parser, it's that every other tool in the series
   (`pssfmt`, `sphinx-pss`, `vscode-pss-support`, `pssc`) is a client of this
   one AST and this one marker catalogue, so the vocabulary you learn here is
   the vocabulary everywhere.
3. Ask: run it over a model you already have, and if it rejects something the
   LRM allows, that's a bug report worth more than a star.
4. Teaser for post 4: the checker above, done properly -- packaged, discovered
   through an entry point, and failing a real CI job.

---

## References

- [pssparser](https://github.com/psstools/pssparser) -- Apache-2.0
- [PSS 3.1 draft](https://www.accellera.org/downloads/drafts-review)
- [Intro to PSS](/series/intro-to-pss/) -- the DMA model used here
- Post 1: *PSS 3.1 Is Out for Public Review*

---

## Open decisions this outline does not make

- **Where the checker section lives.** It is the strongest single example in the
  post and it belongs to post 4. Current call: keep it, sized as a teaser, on
  the grounds that "you can extend it" is load-bearing for point 2 and a
  30-line class proves it faster than a paragraph. If post 4 ends up feeling
  pre-empted, cut this to `--list-checkers` output plus one sentence.
- **Whether the install section should carry a second environment.** Point 1
  rests on "one command, no prerequisites," and the capture behind it is one
  machine: x86_64 Linux, CPython 3.12. If the wheel matrix doesn't cover macOS
  or 3.13, the claim needs narrowing to what was actually tested. Check before
  publishing -- this is the post's load-bearing claim and the cheapest one to
  overstate.
- **Whether to show `--dump-ast` here at all.** Currently not shown -- it's post
  9's material and a JSON dump would unbalance a post about diagnostics. One
  forward-linking sentence in *What It Doesn't Do Yet* is the whole treatment.
- **The `unclosed.pss` example is the post's weakest output and its most
  honest.** Decide whether it leads the ledger section (current) or gets cut to
  a sentence. Argument for keeping the block: showing a bad-looking diagnostic
  is what makes the good-looking ones credible.
- **Dates.** The series plan runs in 2027, the review-window sub-series ran in
  September 2026, and this file sits in `2026/10/`. Settle the numbering
  (`seriesOrder`) against `SCHEDULE.md` before publishing.
