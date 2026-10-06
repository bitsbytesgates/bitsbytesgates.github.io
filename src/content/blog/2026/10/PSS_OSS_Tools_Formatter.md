---
title: 'Open Source PSS: Formatting'
date: 2026-10-06
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
draft: true
image: /imgs/2026/10/pssfmt_banner.png
---

<p align="center">
<img src="/imgs/2026/10/pssfmt_banner.png" width="660" alt="Same tokens, cleaner layout (Open Source PSS: formatting). A .pss file with ragged indents and two lines run together goes into pssfmt. Every run checks three things: the tokens are unchanged, formatting again changes nothing, and the result parses. The output holds the same tokens in the same order, laid out on a regular indent, and CI's --check exits 0. If a check fails, the original file comes back unchanged and pssfmt exits 2."/>
</p>

<!--
Every console block is real output from pssfmt 0.3.0 (PyPI) on pssparser
3.1.7, re-captured 2026-10-04, except the one marked 0.1.0, which comes from a
separate venv with pssfmt==0.1.0. Inputs are in notes/2027/post-pssfmt/examples/
(run.sh wraps pssfmt; corpus.sh regenerates the corpus numbers). The style
figures come from `python tools/style_survey.py packages/pss-corpus/curated`
in the pssfmt checkout. The GitHub Actions snippet is illustrative and was not
run. The config-typo capture prints the absolute path to cfg/.pssfmt; it is
trimmed to `.pssfmt` here. The outline this post was written from is notes/2027/post-pssfmt/OUTLINE.md.
-->

It's no surprise that well-formatted text is easier to read, and that's as
true of code as it is of prose. But keeping code well formatted by hand is
tedious, and it costs more than it would seems. Whitespace diffs obscures 
legitimate changes, and review comments about whitespace cost everyone time.

Most languages settled this long ago with a formatter: gofmt, Black,
clang-format, Verible. A tool lays the code out the same way every time, and
a CI job checks that it's been done, so nobody has to think about it. Now PSS
has one too. [pssfmt](https://github.com/psstools/pssfmt) is open source
(Apache-2.0), targets PSS 3.1, and installs with `pip install pssfmt`.

In my experience, people don't hesitate to adopt a formatter because of its
style. They hesitate because they're afraid it will break their code. So, 
if anything, the theme running through this post is the work pssfmt does 
to ensure that it only changes how your code looks, and *never* how it works.

<!--more-->

# pssfmt in 30 seconds

Here's a small DMA model, written in a hurry:

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

*Source: [messy.pss](/code_html/2026/10/messy/) ([raw](/code/2026/10/messy.pss))*

With no configuration at all, here's what pssfmt makes of it:

```pss
% pssfmt -q messy.pss
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

Braces sit on the line that opens the construct, the indent is four spaces,
operators and commas are spaced, the double blank line is gone, and the
one-line function body is opened out. The meaningless `;` after the buffer's
closing brace is dropped too. We'll come back to that one.

Notice what *didn't* change: `rand bit[32]  size;` keeps its two spaces.
That's deliberate, and we'll come back to it as well.

There are four ways to run it:

- `pssfmt FILE` writes the formatted file to stdout.
- `pssfmt -i FILE` rewrites the file in place.
- `pssfmt --diff FILE` shows what would change, and exits 0.
- `pssfmt --check FILE` writes nothing, and exits 1 if anything would change.

`--diff` is what a reviewer wants to see. On a whole file that's never been
formatted, nearly every line changes, so the diff is mostly noise. Its real
use is on code that's already tidy, where it points straight at the one line
that isn't:

```diff
% pssfmt --diff review.pss
1 file would be reformatted
--- review.pss	original
+++ review.pss	formatted
@@ -4,7 +4,7 @@
         rand bit[32] size;
         constraint c_align {
             src_addr % 4 == 0;
-            dst_addr%4==0;
+            dst_addr % 4 == 0;
         }
         constraint c_size {
             size in [64..4096];
```

*Source: [review.pss](/code_html/2026/10/review/) ([raw](/code/2026/10/review.pss))*

`--check` is what CI runs.

## Not just declarations

pssfmt 0.3.0 also lays out procedural code: `if`/`else` chains, loops, and
long parameter lists. Here's an `else` chain written three different ways:

```pss
function bit[32] words(bit[32] n, bit[8] width, bool packed) {
    if(packed){
        n = (n + width-1)/width;
    }
    else if (width==8) {
        n = n>>2;
    }
    else
    {
        n = n*2;
    }
    return n;
}
```

pssfmt gives it one shape:

```pss
% pssfmt -q else.pss
function bit[32] words(bit[32] n, bit[8] width, bool packed) {
    if (packed) {
        n = (n + width - 1) / width;
    } else if (width == 8) {
        n = n >> 2;
    } else {
        n = n * 2;
    }
    return n;
}
```

*Source: [else.pss](/code_html/2026/10/else/) ([raw](/code/2026/10/else.pss))*

The chain comes out as `} else if (…) {` and stays flat, rather than nesting
one level deeper per branch.

Line breaks follow the content, too. Here the first prototype is 94 columns
wide, and the second function has its whole body on one line:

```pss
component dma_c {
    function bit[32] desc_words(bit[32] nbytes, bit[8] width, bool packed, bit[32] base_addr);
    function bit[32] chan_base(int index) { return DMA_CH_BASE + index * DMA_CH_STRIDE; }
}
```

```pss
% pssfmt -q params.pss
component dma_c {
    function bit[32] desc_words(
        bit[32] nbytes,
        bit[8] width,
        bool packed,
        bit[32] base_addr
    );
    function bit[32] chan_base(int index) {
        return DMA_CH_BASE + index * DMA_CH_STRIDE;
    }
}
```

*Source: [params.pss](/code_html/2026/10/params/) ([raw](/code/2026/10/params.pss))*

The parameter list is broken one item per line because it doesn't fit in 80
columns, not because of where the author happened to press Enter. Break the
list by hand in odd places and pssfmt produces exactly the same output.

# It won't break your code

Back to the fear. What should a formatter promise? pssfmt makes three
promises, and it checks them on every run:

- **The tokens don't change.** Every non-whitespace token in the output is
  identical, in type and text, to the one in the input, and every comment is
  kept exactly.
- **Formatting is idempotent.** Formatting the output again changes nothing:
  `fmt(fmt(x)) == fmt(x)`.
- **No new parse errors.** The output has no parse errors that the input
  didn't already have.

The important word is *every*. These aren't checks in pssfmt's test suite;
they run each time you format a file. If any check fails, your file is left
exactly as it was, and pssfmt tells you so. That fail-safe is the default
path, not a flag you have to remember to pass.

One consequence is worth calling out if you've been burned by other
formatters: the parentheses you wrote are always kept, and pssfmt never adds
any. It works on a *concrete* syntax tree, where `(` is a token like any
other, instead of rebuilding your code from an abstract syntax tree plus a
precedence table.

Idempotence is easy to check for yourself:

```console
% pssfmt -q messy.pss > once.pss
% pssfmt -q once.pss  > twice.pss
% diff once.pss twice.pss ; echo "exit=$?"
exit=0
```

It's more convincing at scale. The pssfmt project measures itself against
[pss-corpus](https://github.com/psstools/pss-corpus), a shared collection of
real PSS. Formatting each of its 92 curated files, then formatting the result
again and comparing bytes, gives:

```console
byte-identical=36 reformatted=56 non-idempotent=0 declined=0 total=92
```

The numbers that matter are the zeros: no file failed to converge, and no
file was declined.

## What a caught bug looks like

Safety checks are easy to describe and hard to believe until you see one
fire. So here's a real one. pssfmt 0.1.0, the first release on PyPI, had a
bug: a comment on the same line as an opening brace was lost during layout.

```console
% pssfmt brace.pss          # pssfmt 0.1.0
brace.pss: left unchanged -- the formatted output failed verification:
  comments: comment 1 changed: '// DMA engine model' -> <end of file> (input has 1 comment, output 0)
  This is a pssfmt bug. The file has not been modified.
1 file declined
package dma_pkg { // DMA engine model
  component dma_c{
    action xfer_a { rand bit[32] len; }
  }
}
exit=2
```

*Source: [brace.pss](/code_html/2026/10/brace/) ([raw](/code/2026/10/brace.pss))*

The comment check caught the bug every time it happened, so the bug never
damaged a file. Read the diagnostic as three facts: which check failed
(`comments`), what it saw (one comment in, none out), and what happened to
your file (nothing). The original was written back out unchanged. And the
last line sums up the whole attitude: *"This is a pssfmt bug. The file has
not been modified."*

Version 0.3.0 fixes the bug:

```console
% pssfmt brace.pss          # pssfmt 0.3.0
1 file would be reformatted
package dma_pkg { // DMA engine model
    component dma_c {
        action xfer_a {
            rand bit[32] len;
        }
    }
}
```

Note the exit code on the declined file: 2, not 1. A `1` from `--check`
means "the answer is no: this file needs formatting." A `2` means "I couldn't
compute the answer." From the outside, a declined file looks exactly like a
clean one, with no diff and nothing written. Without the explicit message and
the distinct exit code, a formatter bug would show up as a file that
mysteriously never gets formatted.

# A familiar style, checked against real code

The second thing people argue about is the style itself. Every formatter has
to answer questions like "Where does the brace go?" and "Is it `a*b` or
`a * b`?" pssfmt doesn't invent new answers. It follows the conventions most
PSS users already write in C, C++, and SystemVerilog, and that established
formatters like clang-format, gofmt, and Black have settled on:

- four-space indents, and never tabs
- K&R braces: `{` on the line that opens the construct, and `} else {` cuddled
- one space around binary operators: `index * STRIDE`
- at most one blank line in a row, and no trailing whitespace
- an 80-column line width

What PSS does have is a way to check those conventions against real code.
The pssfmt repository includes a survey tool that reads
[pss-corpus](https://github.com/psstools/pss-corpus) token by token and
counts how its authors actually write. It groups the code by *voice* rather
than by file: today that's one organization's hand-written PSS, the PSS core
library from an unrelated project, and a register-model generator. That
grouping matters because agreement *across* independent authors is evidence.
The same habit repeated in 48 files by one author is one opinion counted 48
times.

Even with a small corpus, the check already confirms several of the rules.
Braces go on the opening line in 732 of 733 cases, and not one indented line
uses a tab. The line width is the most striking. Here are line lengths for
the two human voices:

```
    76  #####################################  105
    77  ##################################       98
    78  ###################################     100
    79  ###################################     101
    80  ###########################              78
    81  ######                                   19   <-- cliff
    82  #                                         3
```

That isn't an average sitting below 80. It's a wall: PSS authors already wrap
*to* 80 columns, so the convention and the code agree.

The check is also useful when it pushes back. Most formatters, gofmt,
rustfmt, and Black among them, strip blank lines after an opening `{`. pssfmt
did too, until the survey showed the two human voices writing those blank
lines in 41 of the corpus's 92 files. The rule was backed out. The convention
was a good starting point, and the corpus showed where PSS code differs.

Where the corpus is silent, convention decides. There are only five
`if`/`else` statements in the corpus, and they don't agree, so `} else {`
follows K&R, the Linux kernel, Google's C++ style, and lowRISC. Spacing
around `*` is similar: the hand-written voice writes `index * STRIDE`, the
generator writes `index*STRIDE`, and pssfmt takes the C convention.

The [style guide](https://dvkit.org/psstools/pssfmt/style.html) records,
rule by rule, what the corpus currently says, and `tools/style_survey.py`
regenerates every figure. Today some of those figures are thin. The mechanism
is the part that lasts: every new voice added to pss-corpus makes the check
stronger, and turns "I don't like it" into a conversation about what PSS code
actually looks like.

# Where it won't have an opinion

The most surprising thing about a good formatter is what it leaves alone.

Remember `rand bit[32]  size;` from the first example? pssfmt's alignment
setting defaults to `infer`. A block whose columns the author lined up is
kept, and a block that only sort of lines up is set flush:

```console
% pssfmt -q align.pss
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

*Source: [align.pss](/code_html/2026/10/align/) ([raw](/code/2026/10/align.pss))*

One file, two blocks, opposite results, and no configuration.

Target templates are another place pssfmt keeps its hands off. The text inside
`exec body C = """…"""` is C, not PSS, so it's copied byte for byte. Below,
`cat -A` makes the whitespace visible: the tab (`^I`), the odd indent, and the
trailing spaces inside the template all survive, while the PSS around them
moves.

```console
% pssfmt -q exec.pss | cat -A
component dma_c {$
    action start_a {$
        exec body C = """$
^Idma_program_chunk( 0 );$
            dma_start();   $
""";$
    }$
}$
```

*Source: [exec.pss](/code_html/2026/10/exec/) ([raw](/code/2026/10/exec.pss))*

pssfmt makes three standing commitments:

- It never reorders anything.
- It never reflows comment text.
- It never touches the inside of a target template.

There's exactly one option that changes your tokens: `optional_semicolon`,
which controls the `;` that PSS allows, but doesn't need, after a closing
brace. The default, `omit`, drops it, as in the first example. `preserve`
leaves yours alone, and `require` adds one everywhere it's legal. When this
option is active, the token check is relaxed to allow exactly that one
difference, in that one direction, and nothing else.

# The off switch

Some content shouldn't be automatically indented: for example, a hand-aligned 
register table. pssfmt gives you three levels of control:

- `// pssfmt off` … `// pssfmt on` protects a region.
- `// pssfmt ignore` protects the next construct.
- A `.pssfmtignore` file (gitignore syntax) excludes paths, such as a `gen/`
  directory of generated code.

A protected region is *copied*, not merely exempted. Tabs, trailing
whitespace, and blank lines are all kept. The only change is that the
region's first line takes the indent of the code around it:

```console
% pssfmt -q hatch.pss | cat -A
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

*Source: [hatch.pss](/code_html/2026/10/hatch/) ([raw](/code/2026/10/hatch.pss))*

The `struct` line moved, and nothing under it did.

This matters more in 0.3.0 than it did before. Long parameter lists are now
joined and re-broken from their content, so a parameter list you aligned
into columns by hand loses those columns. Three of the five in the corpus
did. `// pssfmt off` is how you keep one.

Two smaller details:

- `.pssfmtignore` filters a *directory search*, never a file you name.
  `pssfmt -i gen/x.pss` formats that file, because you typed its name.
- `--lines A:B` formats only the given lines of a file. On a codebase that's
  never been formatted, this lets you format just what you touched, so the
  first review stays about your change instead of the whitespace.

# Putting it in CI

The CI integration is `--check` plus an exit code:

| Situation | Exit |
|---|---|
| Already formatted, or formatted successfully | 0 |
| `--check`: at least one file would change | 1 |
| Unreadable file, bad configuration, bad usage, **or a declined file** | 2 |

A gate that treats every non-zero code the same will eventually report a
broken toolchain as a style failure. Check for `1` and `2` separately.

pssfmt runs alongside the parser from the
[previous post](https://bitsbytesgates.com/blog/PSS3.1_OSS_Tools_Parser/) in
the same job. pssparser gates on correctness, and pssfmt gates on layout:

```yaml
- run: pip install pssparser pssfmt==0.3.0
- run: pssparser src/*.pss
- run: pssfmt --check src/
```

Notice the pinned version. pssfmt always follows the latest defaults. While
pssfmt is under activate development, at least, there are likely be new 
changes every release. If this churn creates issues, consider pinning the 
release so you only see formatting changes due to code that you modified.

A few details make `-i` safe to run anywhere:

- Files that are already formatted aren't rewritten, so their timestamps
  don't change and nothing downstream rebuilds.
- Output is written to a temporary file and then renamed into place, so a
  crash never leaves half a file.
- The file's encoding and line endings are preserved. A UTF-16 file (the
  default for Windows PowerShell 5.1) is written back in UTF-16, and CRLF
  stays CRLF. A formatter that re-encoded files would make changes you'd
  never see in the diff.

```console
% file u16.pss ; pssfmt -i u16.pss ; file u16.pss
u16.pss: Unicode text, UTF-16, little-endian text
reformatted u16.pss
1 file reformatted
u16.pss: Unicode text, UTF-16, little-endian text
```

## Configuration, briefly

This section is deliberately short because pssfmt is intended to work without
extra configuration. In the rare event that you do need options, they go in a `.pssfmt` file
or in a `[tool.pssfmt]` table in `pyproject.toml`. Both are TOML, and both
are found by searching upward from each file. The first one found wins
outright, with no merging, and the search stops at the top of your
repository, so a stray `.pssfmt` in your home directory can't restyle every
checkout.

There are 15 options. They exist for projects that have *already* decided
something, such as `pack_arguments = "bin_pack"` for LLVM-style packed
argument lists. What's worth showing is what happens when you get one wrong:

```console
% cat .pssfmt
indent_widht = 2
% pssfmt --check messy.pss ; echo "exit=$?"
pssfmt: .pssfmt: unknown option `indent_widht`; did you mean `indent_width`?
exit=2
```

That's exit 2, and the files under that configuration are skipped rather than
formatted with the defaults. Falling back silently would let one typo restyle
a whole directory tree.

# What it doesn't do yet

pssfmt's gaps are quiet rather than dangerous. A construct with no layout rule
is reproduced exactly, so an incomplete rule set can't damage a file. As of
0.3.0, per the project's [status page](https://dvkit.org/psstools/pssfmt/status.html),
these are still reproduced as written:

- **Unbraced branches** like `if (x) y;`. Adding the braces would change
  your tokens.
- **`repeat { … } while (e);`**, whose block sits in the *middle* of the
  statement.
- **Map and struct literals** like `{"a": 1}` and `{.x = 1}`. The corpus
  contains none.
- **Inline constraints** (`do step with { … }`), guarded and weighted
  `select` branches, `match` in activities, `replicate`, and the `monitor`
  operators. Each appears once, or in only one file, and one author's habit
  isn't a convention.
- **Allman braces.** `brace_style = "break"` is recognized but not
  implemented, and pssfmt says so.

That's a fair way for the tool to be. A formatter with a rule for every PSS
construct on day one would have had to make most of them up.

# Conclusions and next steps

pssfmt helps you keep your PSS codebase properly formatted, making it easier
to read and keeping code reviews focused on real content -- not whitespace.
What's more, its built-in safeguards ensure that it a formatter bug doesn't 
accidentally corrupt your source. Consider having a look at the 
[style guide](https://dvkit.org/psstools/pssfmt/style.html) to better-understand
the conventions currently used.

A few ways you can help:

- **Run `pssfmt --diff` on a model you already have.** If you disagree with
  the result, the style guide shows what the corpus says about that rule.
  Tell us where it's wrong.
- **File issues** on [GitHub](https://github.com/psstools/pssfmt/issues),
  especially for any file pssfmt declines. A declined file is, by
  definition, a pssfmt bug.
- **Contribute PSS to [pss-corpus](https://github.com/psstools/pss-corpus).**
  Every new voice makes the style check more meaningful, and today
  the corpus is small.

That last ask is the one I'd underline. pss-corpus isn't pssfmt's private
test set. pssparser and its linter test against it too, and every tool
built on it gets better each time someone adds real code. That's
the value of a shared set of open tooling: no single user, vendor, or project
has to build it, and everyone who contributes gets something they couldn't
have built alone. As always, your contributions are welcome and appreciated!

Next time, we'll look at the linter: the same parser, gating on what your
code means rather than how it looks.

## References

- [pssfmt on GitHub](https://github.com/psstools/pssfmt) (Apache-2.0)
- [pssfmt on PyPI](https://pypi.org/project/pssfmt/)
- [pssfmt documentation](https://dvkit.org/psstools/pssfmt/):
  [quickstart](https://dvkit.org/psstools/pssfmt/quickstart.html),
  [command line](https://dvkit.org/psstools/pssfmt/cli.html),
  [configuration](https://dvkit.org/psstools/pssfmt/configuration.html),
  [style](https://dvkit.org/psstools/pssfmt/style.html),
  [status](https://dvkit.org/psstools/pssfmt/status.html)
- [pss-corpus](https://github.com/psstools/pss-corpus), the corpus the style
  is checked against
- Example files used in this post:
  [messy.pss](/code_html/2026/10/messy/),
  [review.pss](/code_html/2026/10/review/),
  [else.pss](/code_html/2026/10/else/),
  [params.pss](/code_html/2026/10/params/),
  [brace.pss](/code_html/2026/10/brace/),
  [align.pss](/code_html/2026/10/align/),
  [exec.pss](/code_html/2026/10/exec/),
  [hatch.pss](/code_html/2026/10/hatch/)
- [Open Source PSS: PSSParser](https://bitsbytesgates.com/blog/PSS3.1_OSS_Tools_Parser/)
