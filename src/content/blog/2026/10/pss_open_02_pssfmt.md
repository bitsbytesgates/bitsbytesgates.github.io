# PSS in the Open: pssfmt

> **Status: outline, not prose.** Each section lists the two or three things the
> text underneath has to convey, and carries the code and captured output that
> section is built around. Everything in a `console` block below is real output
> from **pssfmt 0.2.0**, run on 2026-09-09 out of the `psstools/pssfmt` checkout
> (`notes/2027/post-pssfmt/examples/run.sh` is the wrapper). Nothing was
> retyped. The `.pss` inputs live in `notes/2027/post-pssfmt/examples/`.
>
> This is series post 5 in `notes/2027/pss_series_plan.md` -- *"Stop Arguing
> About Whitespace: pssfmt."* Before publishing, move the examples into the
> harness described in the plan's *Testing the examples* section
> (`cmds/NN-name.cmd` + `.out` + `.exit`, `make check`) so the goldens below are
> regenerated rather than pasted, and settle `seriesOrder` against
> `SCHEDULE.md`.

---

## Front matter

```yaml
title: 'Stop Arguing About Whitespace: pssfmt'
date: 2026-10-XX
categories: [PSS, Open Source EDA]
series: PSS in the Open
seriesOrder: 5
draft: true
syndicate: derived
tools:
  pssfmt: 0.2.0
  pssparser: 3.1.1
```

Splash: same terminal-banner style as `post-01/imgs/`. The hero image is the
`--diff` block from *One Command, and the Argument Is Over* -- a formatter post
whose splash is a diff makes its own point.

---

## The three post-level points

Everything else in the post is evidence for these:

1. **Three promises, written down and checked.** Token-identical output,
   convergence, and a fail-safe: a file `pssfmt` cannot format correctly comes
   back *unchanged with a diagnostic* rather than mangled. Most formatters
   never write this contract down, which is why adopting one is a leap of
   faith and adopting this one is not.
2. **The style is measured, not preferred.** Every rule is derived from counts
   over a real PSS corpus, and the counts are published. That is what makes the
   default style arguable-with instead of arbitrary -- and a default style
   *will* be argued with.
3. **There is an off switch.** `// pssfmt off`, `// pssfmt ignore`,
   `.pssfmtignore`, `--lines`. PSS codebases have hand-aligned register tables
   and generated directories, and a formatter that cannot be told to leave them
   alone is a formatter that gets uninstalled.

---

## Opening (before `<!--more-->`)

Key points:

- **Open on the review comment, not the tool.** "Can you fix the indentation on
  line 40?" is a comment somebody wrote on a pull request that was about a
  constraint. Every codebase without a formatter spends some fraction of its
  review budget on whitespace, and that fraction is invisible because it never
  shows up as a bug.
- **The second cost, which is bigger.** Whitespace churn in a diff hides the
  change. A three-line semantic edit inside a forty-line reindent is a review
  that does not happen.
- **Every other language settled this a decade ago** -- gofmt, Black,
  clang-format, Verible. PSS did not have one. Now it does: `pip install
  pssfmt`, Apache-2.0, targets PSS 3.1.
- **State the fear before the feature**, because it is the real objection: the
  reason people hesitate over a formatter is not style, it is *will it break my
  code*. This post's spine is the answer to that question, and the answer is
  checkable.

`<!--more-->`

---

## One Command, and the Argument Is Over

Key points:

- Lead with the whole loop in one screen: a file somebody wrote in a hurry, and
  the same file after. No configuration, no style file, no discussion.
- Name what changed in one sentence -- braces attached, four-space indent, the
  decorative `;` dropped, `src_addr,dst_addr` given its space, `%` and `*`
  spaced, a one-line function body opened out -- and then stop narrating. The
  diff is the argument.
- **Point at what did *not* change**, because it is the more interesting half
  and it sets up the whole post: `rand bit[32]  size;` keeps its two spaces.
  That is `alignment = infer` declining to flatten a column, and it gets its own
  section.
- `--diff` and `--check` are the two modes a team actually wires up; introduce
  them here and let the CI section do the work.

The input -- `examples/messy.pss`:

```pss
package dma_pkg{

  buffer data_b{
    rand bit[32]  size;
    constraint size in [64..4096];
  };


  component dma_c {
    action mem2mem_a{
      input data_b   src;
      output  data_b dst;
      rand bit[64] src_addr,dst_addr;
      constraint c_align{
        src_addr%4==0;
        dst_addr % 4 == 0;
      }
    }
    function bit[64] chan_base( int index ){ return DMA_CH_BASE+index*DMA_CH_STRIDE; }
  }
}
```

```console
$ pssfmt messy.pss
1 file would be reformatted
package dma_pkg {

    buffer data_b {
        rand bit[32]  size;
        constraint size in [64..4096];
    }

    component dma_c {
        action mem2mem_a {
            input data_b src;
            output data_b dst;
            rand bit[64] src_addr, dst_addr;
            constraint c_align {
                src_addr % 4 == 0;
                dst_addr % 4 == 0;
            }
        }
        function bit[64] chan_base(int index) {
            return DMA_CH_BASE + index * DMA_CH_STRIDE;
        }
    }
}
```

The same run as a diff, which is the form a reviewer sees:

```console
$ pssfmt --diff messy.pss
1 file would be reformatted
--- messy.pss	original
+++ messy.pss	formatted
@@ -1,21 +1,22 @@
-package dma_pkg{
+package dma_pkg {
 
-  buffer data_b{
-    rand bit[32]  size;
-    constraint size in [64..4096];
-  };
+    buffer data_b {
+        rand bit[32]  size;
+        constraint size in [64..4096];
+    }
 
-
-  component dma_c {
-    action mem2mem_a{
-      input data_b   src;
-      output  data_b dst;
-      rand bit[64] src_addr,dst_addr;
-      constraint c_align{
-        src_addr%4==0;
-        dst_addr % 4 == 0;
-      }
+    component dma_c {
+        action mem2mem_a {
+            input data_b src;
+            output data_b dst;
+            rand bit[64] src_addr, dst_addr;
+            constraint c_align {
+                src_addr % 4 == 0;
+                dst_addr % 4 == 0;
+            }
+        }
+        function bit[64] chan_base(int index) {
+            return DMA_CH_BASE + index * DMA_CH_STRIDE;
+        }
     }
-    function bit[64] chan_base( int index ){ return DMA_CH_BASE+index*DMA_CH_STRIDE; }
-  }
 }
```

**Drafting note.** `--diff` on its own exits 0 -- it reports rather than judges.
`--check` is the one that exits 1. Say it once here, show it in the CI section.

---

## The Promise: It Does Not Change Your Code

Key points:

- This is the section the post exists for, and it is point 1. State the contract
  in the tool's own three lines: output re-lexes to the same token sequence
  (same types, same text), comments are preserved character for character, and
  `fmt(fmt(x)) == fmt(x)`.
- **The mechanism is the interesting part, and it is one sentence:** those
  checks run on *every* format, not in a test suite. A format that fails one is
  discarded and the input is handed back. The fail-safe is the default path, not
  a flag somebody can forget.
- Show convergence rather than claiming it -- format twice, diff, nothing.
- Then the scale version: the whole shared corpus, every file, both properties.

Idempotency, shown:

```console
$ pssfmt -q messy.pss > once.pss
$ pssfmt -q once.pss  > twice.pss
$ diff once.pss twice.pss ; echo "exit=$?"
exit=0
```

The corpus, measured rather than asserted -- 92 files, formatted and formatted
again, byte-compared each time:

```console
$ for f in $(find curated -name '*.pss' | sort); do
>   pssfmt -q "$f" > a.out
>   cmp -s a.out "$f" && same=$((same+1)) || chg=$((chg+1))
>   pssfmt -q a.out > b.out
>   cmp -s a.out b.out || nonidem=$((nonidem+1))
> done
byte-identical=61 reformatted=31 non-idempotent=0 total=92
```

- **Read the 61 out loud**, because it is the adoption number and not a vanity
  one: two thirds of a corpus nobody formatted are already byte-identical to
  what `pssfmt` writes. A formatter whose canonical style was picked rather than
  measured does not land there, and the diff it produces on first contact is
  the reason teams back out.
- **Zero non-idempotent, zero declined**, across three independent authors and a
  code generator.

**Drafting note.** `README.md` says 64 identical / 28 reformatted; the run above
gives 61 / 31 on 0.2.0. Rules landed since that text was written. Regenerate
both numbers from one command before publishing and fix whichever is stale.

---

## What a Broken Formatter Looks Like

Key points:

- The fail-safe is the promise that makes the other two safe to rely on, and a
  promise nobody has seen fire is a promise. So fire it.
- **Be completely straight about the method:** there is no bug in 0.2.0 that
  trips it, so the run below *injects* one -- a patched rule renames a single
  identifier in its output, the smallest token-level corruption available. The
  script is in the examples directory.
- Read the diagnostic as three separate facts: which check failed, what it saw
  (`'src_addr' -> 'srcaddr'`, 85 code tokens in, 84 out), and what happened to
  your file. Note that the *idempotence* check independently caught the same
  corruption -- the checks are not one check wearing three hats.
- **Exit 2, not 1**, and this is the design detail worth a sentence: `1` means
  "the answer is no, this file needs formatting" and `2` means "I could not
  compute the answer." A CI gate that merges them reports a style failure for a
  broken toolchain.
- The last line -- *"This is a pssfmt bug. The file has not been modified."* --
  is the whole posture. The tool would rather tell you it is broken than quietly
  do a good-enough job.

```console
$ python fault_inject.py -i messy.pss    # a rule patched to corrupt one token
messy.pss: left unchanged -- the formatted output failed verification:
  tokens (output line 12): token 44 changed: 'src_addr' -> 'srcaddr' (input has 85 code tokens, output 84)
  idempotence (output line 14): formatting the output again changed it at offset 319: '_addr % 4 == 0;\n    ' -> 'addr % 4 == 0;\n     '
  This is a pssfmt bug. The file has not been modified.
1 file declined
exit=2
```

And the file on disk, after a run that was asked to rewrite it in place:

```console
$ pssfmt --check messy.pss ; echo "exit=$?"
1 file would be reformatted
exit=1
```

Still unformatted -- which is to say, still exactly what you wrote.

- **One more consequence, stated because it is counter-intuitive.** A declined
  file looks *identical to a clean one* from the outside: no diff under
  `--check`, nothing written under `-i`. That is why the diagnostic prints in
  every mode and why it exits 2. Silence there would turn a formatter bug into
  "that file mysteriously never gets formatted."

---

## The Style Is Measured

Key points:

- This is point 2, and the way to land it is to take the single most
  argued-about rule in any formatter and show the counts underneath it rather
  than defending it.
- **The corpus is grouped by *voice*, not by file**, and that is the
  methodological move worth explaining: three independent authors --
  hand-written PSS, the core library from an unrelated project, and a register
  generator. Agreement across voices is evidence; agreement within one author's
  48 files is one opinion counted 48 times.
- Take `a + b*c` vs `a + b * c` -- *precedence tightening* -- as the worked
  example, because it is the one question the corpus came back split on, and it
  split cleanly: every human on one side, the code generator on the other.
- Then the honest part: the tie was broken by argument, not by counts. The
  argument is mechanical rather than aesthetic -- tightening by precedence
  requires reasoning about expression-tree shape, so the same subexpression
  formats differently depending on where it sits, while uniform spacing is a
  rule about adjacent tokens. For a tool whose first promise is *it does not
  change your code*, the simpler invariant wins.

Two voices, one rule, from `tools/style_survey.py`:

```console
$ python tools/style_survey.py
VOICE: hand-written   (48 files, 3020 lines)
    multiplicative -> rhs            n=24   -> 1 (100%)   {1: 24}
    lhs -> multiplicative            n=24   -> 1 (100%)   {1: 24}

VOICE: generated   (25 files, 1589 lines)
    multiplicative -> rhs            n=28   -> 0 (100%)   {0: 28}
    lhs -> multiplicative            n=28   -> 0 (100%)   {0: 28}
```

- Read the dictionaries out once so the reader can read the rest themselves:
  `{1: 24}` is twenty-four sites with a one-space gap, `{0: 28}` is
  twenty-eight with none.

The one measurement that is a wall rather than a distribution -- and the reason
`print_width` defaults to 80:

```text
    76  #####################################  105
    77  ##################################       98
    78  ###################################     100
    79  ###################################     101
    80  ###########################              78
    81  ######                                   19   <-- cliff
    82  #                                         3
    87  |                                         1
    88+ (nothing)
```

- **The point is the cliff, not the number.** Authors are not averaging below
  80, they are wrapping *to* it. That is a measurement of intent, and it is a
  different kind of fact from "80 is traditional."

One more, kept short because it is the same move a third time: the optional
`;` after a declaration's closing brace. 27 of them, in 4 of 92 files, against
701 declarations without. Consistent *within* those four files -- which is what
makes it a style rather than an oversight, and why it is an option
(`optional_semicolon`) with three settings rather than a rule.

- **Close the section on the meta-point:** the numbers are what makes this a
  conversation. "Why does it space multiplication?" has an answer that is not
  "because the author preferred it," and `docs/style.rst` carries one for every
  rule on the page.

---

## Where It Refuses to Have an Opinion

Key points:

- The most surprising thing about a good formatter is what it *doesn't* do,
  and the surprise is worth pre-empting because it otherwise reads as
  incompleteness.
- **`alignment = infer` is the whole idea in one setting:** align a block only
  if its author already aligned it. Not "align everything," not "flush
  everything left." A hand-built table comes back exactly as written; a ragged
  block is set flush.
- The evidence is the sharpest split in the corpus and worth one line: the
  hand-written voice has 7 aligned trailing-comment runs and 0 ragged; the
  generator has 0 aligned and 15 ragged. A global `align` would column-ise 18
  blocks nobody asked for; a global flush-left would destroy 21 hand-built
  tables. `infer` reproduces both.
- Then the three standing commitments, as a short list, because each is the
  reason somebody somewhere disabled a different formatter: **it will not
  reorder anything** (order in PSS interacts with inheritance and `extend`);
  **it will not reflow comment text** (a comment can hold a table, a diagram, a
  licence, a URL); **it will not touch `exec` target-template interiors**.

Both blocks in one file, one run:

```pss
component regs_c {
    // an author-built table: three lines, columns already lined up
    bit[8]   cmd;      // command register
    bit[16]  addr;     // destination address
    bit[8]   status;   // completion status

    // a ragged block: nobody built a column here
    bit[32]     ctrl;
    bit[8]  mode;
    bit[16]   irq_mask;
}
```

```console
$ pssfmt -q align.pss
component regs_c {
    // an author-built table: three lines, columns already lined up
    bit[8]   cmd;      // command register
    bit[16]  addr;     // destination address
    bit[8]   status;   // completion status

    // a ragged block: nobody built a column here
    bit[32] ctrl;
    bit[8] mode;
    bit[16] irq_mask;
}
```

- **That is the whole demo and it should be shown side by side.** One file, two
  blocks, opposite treatment, no configuration involved. It is also the answer
  to the `rand bit[32]  size;` question left open in the first section.
- One consequence worth naming so nobody files it as a bug: a *single* marked
  line is reproduced, not flattened. `infer` infers from a run; one line is not
  a ragged block, it is no evidence.

The target-template commitment, which is the one that would actually corrupt
something if it were wrong -- a tab, an odd gap and a trailing space inside the
C, all surviving while the PSS around them moves:

```console
$ pssfmt -q exec.pss | cat -A
component dma_c {$
    action start_a {$
        exec body C = """$
^Idma_program_chunk( 0 );$
            dma_start();   $
""";$
    }$
}$
```

- Say why in one sentence: that text is C, not PSS. Leading whitespace can be
  semantic in a target language, the interior is part of a string's *value*, and
  re-anchoring a generated payload changes what it generates.

---

## The Off Switch

Key points:

- Point 3. Lead with the legitimate case rather than the concession: a
  hand-aligned register table is deliberate work, and a tool that flattens it
  has destroyed information. Some things a formatter should be told to skip.
- Three granularities, one sentence each: `// pssfmt off` / `// pssfmt on` for a
  region, `// pssfmt ignore` for the next construct, `.pssfmtignore` for whole
  paths.
- **A protected region comes back byte for byte** -- including the blank lines
  that are otherwise clamped, the trailing whitespace that is otherwise removed,
  and the tabs. That is a stronger promise than "this rule is suppressed," and
  the distinction is the point: **the region is copied, not exempted.** There is
  no rule name to name and no diagnostic to silence, because the tool has no
  opinion about it at all.
- **The one honest exception, shown rather than buried:** the region's *first*
  line still gets the enclosing block's indent, because a member cannot refuse
  the indent its parent writes. Visible in the capture below -- the `struct`
  line moved to column 4 and everything under it kept the columns it had.

```console
$ pssfmt -q hatch.pss | cat -A
component spi_c {$
    // pssfmt off$
    struct^Ispi_csr_s {$
^I    bit[8]  cmd;^Ibit[16] addr;$
^I    bit[8]  status;^Ibit[16] mask;$
^I}$
    // pssfmt on$
$
    action xfer_a {$
        rand bit[16]  len;$
    }$
}$
```

Whole directories, for the generated code nobody hand-edits:

```console
$ cat proj/.pssfmtignore
gen/

$ pssfmt --check proj ; echo "exit=$?"       # without the ignore file: 2 files
1 file would be reformatted
exit=1
```

- **The rule that saves an argument later:** ignore patterns filter a
  *directory search*, never a file you named. `pssfmt -i gen/thing.pss` formats
  it, because you typed it.

Two more escape hatches worth a sentence each, both about *adoption* rather than
taste:

- `--lines A:B` formats only the lines you touched, which is what makes the tool
  adoptable on a codebase that has never been formatted -- the review stays
  about your change instead of about the whitespace.
- The **honest wart**, and it should be shown rather than described, because a
  reader will hit it in the first ten minutes: a range that cuts through the
  middle of a block leaves the closing brace where it was, since that line was
  not in the range. Not a bug -- line 17 was not asked for. Cutting each corpus
  file at arbitrary thirds leaves a mismatched brace in **50 of 92** files, so
  say it out loud and say that ranges shaped like an edit hit it far less often.

```console
$ pssfmt -q --lines 14:17 messy.pss
...                                       # lines 1-13 byte-for-byte as written
      rand bit[64] src_addr,dst_addr;
            constraint c_align {
                src_addr % 4 == 0;
                dst_addr % 4 == 0;
            }
    }
```

---

## Putting It in CI

Key points:

- Same argument the pssparser post makes, and it should be made in half the
  space here: `--check` is silent on success and exits 1, which is the entire
  integration.
- The exit-code table is the interface, and the `1` / `2` split is the thing
  worth stating precisely -- one is a pull request that needs formatting, the
  other is a broken toolchain, and they call for opposite responses.
- Show the pre-commit hook as a real rejection followed by a real fix, because
  a hook that is only described is a hook nobody installs.

| Situation | Exit |
|---|---|
| already formatted, or formatted successfully | 0 |
| `--check`: at least one file would change | 1 |
| unreadable file, bad `.pssfmt`, invalid usage, **or a declined file** | 2 |

```sh
#!/bin/sh
# .git/hooks/pre-commit
files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.pss$')
[ -z "$files" ] && exit 0
pssfmt --check $files || {
    echo "pssfmt: run 'pssfmt -i $files' before committing" >&2
    exit 1
}
```

```console
$ git commit -m "add dma model"
2 files would be reformatted
pssfmt: run 'pssfmt -i gen/regs_gen.pss
src/dma.pss' before committing

$ git log --oneline
fatal: your current branch 'master' does not have any commits yet
```

```console
$ pssfmt -i src/dma.pss gen/regs_gen.pss
reformatted src/dma.pss
reformatted gen/regs_gen.pss
2 files reformatted

$ git add -A && git commit -q -m "add dma model" && git log --oneline
fd1624d add dma model
```

- One detail that belongs here and nowhere else: `-i` does not touch files that
  are already formatted, so their mtimes do not change and nothing downstream
  rebuilds. And it writes a temporary file and renames it over the target, so a
  crash mid-write leaves the old file or the new one, never half of one.

**Cut, recorded so it does not come back:** a GitHub Actions YAML block. The
hook above is the artifact readers copy; the CI step is `pssfmt --check .` and a
`pip install`, and showing it twice in one series is filler. Cross-link the
pssparser post's workflow instead.

---

## Configuration, Briefly

Key points:

- Keep this section short and say why it is short: `pssfmt` runs with no
  configuration and that is the intended way to use it. The options exist for
  projects that have *already* decided something, not as knobs to explore.
- Two mechanisms, one sentence: a `.pssfmt` file or a `[tool.pssfmt]` table in
  `pyproject.toml`, both TOML, both found by walking up from each file.
- **The two discovery rules that will otherwise bite somebody**, stated as
  decisions rather than trivia: the first configuration found wins *outright*
  (the chain is not merged, so "which file set this value?" stays answerable by
  reading), and the search stops at the top of your repository (otherwise a
  `.pssfmt` in a home directory silently restyles every checkout on the
  machine).
- Show the typo diagnostic rather than the option table -- a full table belongs
  in the docs, and the diagnostic makes the better point about the tool's
  posture.

```console
$ cat .pssfmt
indent_widht = 2

$ pssfmt --check messy.pss ; echo "exit=$?"
pssfmt: /work/.pssfmt: unknown option `indent_widht`; did you mean `indent_width`?
exit=2
```

- Note the exit code: an unknown option is a `2`, and the files that
  configuration governs are **skipped**, never formatted with the defaults
  instead. Silently falling back would mean a typo restyles a subtree.

---

## Asking Why

Key points:

- Small section, one capture, and it earns its place because "why is this line
  laid out like that" is otherwise a question you answer by reading rule source.
- `--explain` formats the file, writes nothing, and reports which rule laid out
  each line.
- **The line to build the section around is the last one.** Across the whole
  corpus at the default width, the engine makes exactly *one* fit decision in 92
  files. So "every break in this file is unconditional" is not a failure to find
  something -- it is the answer, and it means the layout came from a rule rather
  than from `print_width`.
- The other thing to look for: a line attributed to `(verbatim)` was *copied*,
  not composed -- that construct has no rule yet. That is the honest bridge to
  the next section.

```console
$ pssfmt --explain messy.pss
messy.pss: 22 output lines, print_width 80, indent_width 4

Which rule laid out each line
  1-2          package_declaration
  3            struct_declaration
  4            attr_field
  5            constraint_declaration
  6-7          struct_declaration
  8            component_declaration
  9            action_declaration
  10-12        action_field_declaration
  13           constraint_declaration
  14-15        expression_constraint_item
  16           constraint_declaration
  17           action_declaration
  18           function_decl
  19           procedural_return_stmt
  20           function_decl
  21           component_declaration
  22           package_declaration

Every break in this file is unconditional: a rule emitted it.
  The engine measured 0 group(s) and broke none.
```

---

## What It Doesn't Do Yet

Key points:

- Same method as the pssparser post: running everything through the tool maps
  where the tool stops, and a reader deciding whether to adopt needs this
  section more than the flattering ones.
- **The framing that makes this different from a to-do list**, and it should be
  stated first because it changes how the list reads: a construct with no rule
  falls back to the formatter that changes nothing. So an incomplete rule set
  cannot corrupt a file, and adding a rule cannot make an unrelated construct
  worse. The gap is *quiet*, not dangerous.
- Then the list, with the reason each one is waiting -- and the reason is almost
  always the same one, which is the point: **the corpus has not decided it.**

As of pssfmt 0.2.0:

- **`if`/`else` is left exactly as written.** Where `} else {` goes is not in
  the style, because five corpus instances across three files cannot settle it.
- **Loops.** `repeat (i : n)` carries a fifth reading of a character the style
  already splits four ways; `repeat { … } while (e);` puts its block in the
  *middle* of the statement, which the block layout cannot express.
- **A statement or prototype you wrapped across lines** is reproduced, because
  formatting it means joining it -- and six of the corpus's seven wrapped calls
  join to between 86 and 108 columns.
- **Seven constraint items and a list of activity constructs** -- `unique`,
  `dist`, `foreach`, inline constraints, labels, guarded `select` branches --
  each of which the corpus contains once, or contains only in a single file.
  One instance is not a convention.
- **`**` and `>>`.** `**` has 65 instances from a single author, unanimously
  tight, against a general rule that says spaced. `>>` is not a token in PSS at
  all -- it is two `>` that must touch inside an operator that must not, which
  per-token spacing cannot express. Both are left alone.
- **`brace_style` has one implemented value.** `attach` is what the corpus does,
  732 times out of 733. Allman does not occur.
- **The escape hatches have zero corpus coverage**, and always will until the
  tool has users -- the corpus contains no directives. Worth saying plainly:
  the hatch mechanism is tested, but it is not *evidenced* the way the style
  rules are.
- **No `--dump-config`**, and no diff-driven mode that turns a `git diff` into
  ranges. The machinery for the second is `--lines`; what is missing is the
  part that reads the diff.

Then the fairness note, in the same breath: a formatter that had a rule for
every construct in PSS 3.1 on its first release would have needed to invent
most of them, and inventing is exactly what this project decided not to do.

---

## Wrapping Up

Key points:

1. Recap as the contract, not the feature list: it does not change your code, it
   converges, and it fails safe -- and all three are checked on every run rather
   than promised in a README.
2. The reason the style is defensible is that it was counted rather than chosen,
   and the counts ship with the tool. Point at `docs/style.rst` as the artifact
   worth reading even by someone who never installs `pssfmt`.
3. Ask: run `pssfmt --diff` over a model you already have. If it produces a diff
   you disagree with, `docs/style.rst` has the count behind the rule -- and a
   voice the corpus does not have yet is worth more to this project than a star.
4. Teaser for the next post: same AST, same parser, now driving an editor
   (`vscode-pss-support`) -- the formatter you just ran on the command line is
   the one behind format-on-save.

---

## References

- [pssfmt](https://github.com/psstools/pssfmt) -- Apache-2.0
- [pss-corpus](https://github.com/psstools/pss-corpus) -- the shared corpus the
  style is measured over
- `docs/style.rst` -- every rule with the count behind it
- `docs/status.rst` -- what is built and what is waiting on a decision
- Post: *Does It Parse? Checking PSS With an Open Source Parser*
- [lowRISC Verilog style guide](https://github.com/lowRISC/style-guides/blob/master/VerilogCodingStyle.md)
  -- the closest domain peer, and cited by the style doc where the corpus is thin

---

## Open decisions this outline does not make

- **How much of the measurement story to tell.** Currently one rule
  (multiplication), one histogram (`print_width`), one option
  (`optional_semicolon`). The corpus methodology -- reading tokens rather than
  text, disambiguating `*`, `<` and `:` before counting -- is genuinely
  interesting and is *also* the fastest way to turn this into a post about
  corpus linguistics. Current call: one sentence, in the measured-style section,
  and a link.
- **Whether the fail-safe section keeps the fault injection.** It is the
  strongest artifact in the post and it is the only one that is not a plain run
  of the tool. Argument for keeping it: the promise is the post's spine and an
  unfired promise is a claim. Argument against: injecting a bug to show a safety
  net could read as manufactured. If it goes, replace it with the verifier's
  three checks stated in prose -- much weaker.
- **Whether `--lines` earns its wart.** The mismatched-brace capture is honest
  and slightly ugly, and 50-of-92 is a big number to print in a post arguing the
  tool is safe. Current call: keep it, in the off-switch section rather than a
  section of its own, because a reader hits it in the first ten minutes and
  finding it undocumented is worse than reading about it.
- **Where the corpus numbers come from at publish time.** The 61/31 above is a
  loop in a shell. Before publishing it should be one command in the examples
  harness so a `make regen` updates it -- otherwise it is exactly the kind of
  number that ages into a lie.
- **Whether to show `pssfmt` and `pssparser` in one pipeline.** The series-level
  argument is that these tools share one AST, and this post never demonstrates
  it. One capture -- format, then parse, clean -- would. Risk: it belongs to the
  landscape post (plan post 2), which owns the composition claim.
- **Version pinning.** 0.2.0 is pre-1.0 and the style rules are still landing;
  the corpus numbers in this post moved between the README being written and
  this outline. Put the version in the frontmatter (done) and re-run every
  capture at publish time, not before.
```
