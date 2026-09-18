---
title: 'PSS 3.1: Target Code'
date: 2026-09-18
series: PSS in the Open
categories: [PSS, Open Source EDAs]
syndicate: derived
---

<p align="center">
<img src="/imgs/2026/09/pss31_targetcode_banner.png" width="660" alt="PSS 3.1 target code: the same four cards -- Constraints, Composition, Target code, Target runtime -- with the Target code card highlighted and marked 'this post'"/>
</p>

A PSS description has two fundamental ways of interfacing with a platform:
by specifying the APIs to call, or the code to generate. We'll talk more
about the API-based approach in the next post, but for now we focus on
what's new with target-code generation in PSS 3.1. A significant
number of changes emphasizes how important this use model continues to
be.

<!--more-->

---

# How target-code generation works

The mechanism straightforward: an action or flow object carries a snippet of
target-language code -- C, assembly, a script, whatever the platform speaks 
-- and that snippet may reference the action's attributes. The tool solves 
the scenario, then walks the traversals and expands one copy of the snippet 
per traversal, substituting the values the solver chose.

<p align="center">
<img src="/imgs/2026/09/pss31_target_flow.png" width="720" alt="Three columns. Left: a dma_c component whose xfer_a action declares 'rand bit[16] sz' and an exec body C template containing dma_start({{sz}}). Middle: an activity traversing xfer_a three times, producing three solved instances with sz = 64, 128 and 32. Right: the generated dma_test.c containing dma_start(64), dma_start(128) and dma_start(32)."/>
</p>

```pss
component dma_c {
    action xfer_a {
        rand bit[16] in [1..1024] sz;

        exec body C = """
            dma_start({{sz}});
        """;
    }

    action test_a {
        activity {
            repeat (3) { do xfer_a; }
        }
    }
}
```

Three traversals of `xfer_a`, three expansions of its body:

```c
dma_start(64);
dma_start(128);
dma_start(32);
```

What comes out is ordinary target-language text. There's no PSS runtime on the
other side, which is exactly why this use model persists in environments where
you can't link a library and call into it -- bare-metal bring-up, boot code,
assembly-level tests.

The corollary is that the model has to specify *everything* the generated code
needs to contain. That's where 3.1 does its work: the 3.0 mechanism was good at
substituting values into a flat always-emitted template structure and awkward
otherwise. PSS 3.1 significantly improves the ergonomics of exception cases.

---

# Template strings

In 3.0, mustache notation was restricted to target-template exec blocks.
In 3.1 it's a feature of *triple-quoted strings* (4.7.1), and target-template
exec blocks are simply one of the places those appear. Substitution works the
same way in any string expression, so the same notation shows up in
`message()`, in a string attribute, in a constant initializer -- and, usefully,
in the filename of an `exec file` block.

```pss
static const int    NCHAN  = 4;
static const string BANNER = """dma: {{NCHAN}} channels""";

component dma_c {
    action dump_a {
        rand bit[4] fileid;
        rand bit[8] data;

        // the filename is a template too, so each traversal picks its file
        exec file """dma_{{fileid}}.dat""" = """data: {{data}}""";

        exec post_solve {
            message(LOW, """dumping {{data}} to file {{fileid}}""");
        }
    }
}
```

The `exec file` line is the one worth pausing on. Pre-3.1, an action type wrote
to one statically-named file, and splitting output per-traversal meant
generating everything into one place and post-processing it. Now the file a
traversal writes to is a function of its solved values.

Worth knowing (4.7.1, 4.7.1.1):

- Substituted expressions must be scalar-typed, and any function they call
  must be `pure`. Formatting is by type: `int` as signed decimal, `bit` as
  unsigned, `bool` as `true`/`false`, an `enum` as its enumerator identifier.
  That last one is what makes `{{kind}}` usable as part of a generated
  function name.
- In an exec block, expansion happens after `pre_body` completes. In a string
  expression, it happens when the expression is evaluated -- so a string
  built in a procedural context captures the values as of that moment.
- A triple-quoted string that references only constants is itself a constant.
  One that doesn't, isn't, and can't be used where a constant is required.
- Comments finally have somewhere to live. `{# ... #}` spans lines and `{#}`
  runs to the end of the line; neither reaches the generated text, and special
  elements inside a comment are not expanded. That's the notation you want for
  commenting out a block of template that contains mustaches.

---

# Controlling uniqueness

Some generated content belongs to the test, not to the traversal. A header
include, a static helper, a boot stub. The natural place to declare it is the
action or component that needs it -- but actions run many times, and an `exec
header` on a component instantiated four times contributed its text four times.
The workaround was to hoist the declaration up to some singleton scope, which
put the code that needs a helper and the code that declares it in different
files.

PSS 3.1 adds an *exec block tag* (20.5.4): a struct value attached to the exec
block, whose only job is to decide whether two emitted blocks are the same
block.

<p align="center">
<img src="/imgs/2026/09/pss31_exec_tags.png" width="720" alt="Two rows. Untagged: four dma_c.ch instances each feed an untagged exec header, producing dma_test.c with four identical #include lines. Tagged: the same four instances feed one exec header carrying a dma_hdr_s tag, producing dma_test.c with the #include emitted once"/>
</p>

```pss
struct dma_hdr_s { string unit = "dma"; }

component chan_c {
    exec header C = dma_hdr_s {.unit = "dma"} : """
        #include "dma_regs.h"
    """;

    action prog_a {
        rand bit[16] sz;
        exec body C = """dma_start({{sz}});""";
    }
}

component dma_c {
    chan_c ch[4];
}
```

Four channels, one `#include`. And because the tag is a struct *value*, not a
name, deduplication can be per-value rather than all-or-nothing -- a header
tagged with a solved attribute is emitted once per distinct value of that
attribute:

```pss
enum   cache_op_e  { CLEAN, INVALIDATE, CLEAN_INVALIDATE }
struct cache_op_tag { cache_op_e kind; }

action cache_op_a {
    rand cache_op_e kind;
    rand bit[64]    addr;

    exec header C = cache_op_tag {.kind = kind} : """
        static inline void cache_op_{{kind}}(uint64_t addr) { /* ... */ }
    """;
    exec body C = """cache_op_{{kind}}({{addr}});""";
}
```

Traverse that action three times with `kind` solving to `CLEAN`, `CLEAN`,
`INVALIDATE` and you get two helper definitions and three calls.

Worth knowing (20.5.4):

- The tag affects code generation *only*. Not traversal, not solving, not
  runtime behavior. It is not a mechanism for choosing between
  implementations.
- Two blocks match when they have the same exec kind, the same target
  language, the same target execution unit, the same tag struct type, and
  equal tag values. An `exec file` block matches on filename plus tag.
  Matching ignores declaration scope: blocks in unrelated action or component
  types can match.
- **An untagged block matches nothing -- including another untagged block.**
  That's what keeps the feature backward compatible.
- If two matching blocks generate text that differs by so much as a character,
  that's an error, not a silent pick. Worth knowing before you tag something
  whose template still contains a per-traversal attribute.
- Tags are permitted on `header`, `declaration`, `run_start`, `run_end` and
  `exec file` -- the blocks that decide *where* generated code lands. Not on
  `body`, which runs once per traversal and so has nothing to deduplicate:

  ```console
  $ pssparser --no-color bad-exec-tag.pss
  bad-exec-tag.pss:11:28: error: exec block tag is not permitted on 'body' exec blocks
   11 |             exec body C = dma_hdr_s : """dma_start({{sz}});""";
      |                            ^

  1 error in 1 file
  ```

---

# Generative content

Substitution fills holes in a fixed shape. Real generated code doesn't have a
fixed shape: the number of descriptors depends on a solved value, the interrupt
setup is there or it isn't. Pre-3.1 the answer was to assemble the text in a
`post_solve` exec by string concatenation, then substitute the result -- which
means the generated code's structure lives in procedural PSS rather than in
anything that looks like the code being generated.

PSS 3.1 adds control-flow directives in `{% ... %}` delimiters (4.7.1.2). If
you've written a Jinja2 or Mustache template, this is the model you already
have -- with the difference that the statements and expressions between the
delimiters are *PSS*, evaluated against the solved model.

```pss
action prog_a {
    rand int in [1..4]    nchunks;
    rand array<bit[32],4> chunk;
    rand bool             irq;

    exec body C = """
        {# One program call per chunk, then start the engine. #}
        {% foreach (c : chunk) %}
        dma_program_chunk({{c}});
        {%%}
        {% if (irq) %}
        dma_enable_irq();
        {%%}
        dma_start();
    """;
}
```

The template now reads like the C it emits, with the variable parts marked.
Compare that against the same logic expressed as string concatenation in a
`post_solve` block and the argument makes itself.

Worth knowing (4.7.1.2):

- The directive set is `if` / `else if` / `else`, `repeat`, `foreach`, local
  variable declaration, and assignment. Every block closes with a bare `{%%}`.
- `foreach` takes an iterator, an index, or both, and `repeat` takes an
  optional index -- so the generated code can reference the loop position, not
  just the element.
- Expressions inside a directive are written bare -- no mustaches. Mustache
  notation is for emitting a value; a directive is already an expression
  context.
- A line containing only directives and whitespace contributes nothing to the
  output, newline included. That's what lets you indent the template for
  readability without indenting the generated code.
- Assignment reaches template-local variables only. You can't write back to an
  action attribute from a directive, and the same restriction has always
  applied to mustache notation: a substitution is a read.

---

# Conclusions and providing feedback

Target-code generation isn't new in PSS, and that's the point: it's a use model
with enough real deployment behind it that the 3.1 changes read as a list of
accumulated workarounds being retired. Templates that describe their own
structure instead of being assembled by string surgery. A file name that can
depend on what was solved. And a defined answer to "this belongs in the test
exactly once."

Here's what I'd suggest thinking about while reading Clause 4.7 and Clause 20
of the draft:

- **How do your tests integrate with the environment today -- generated code,
  API calls, or both?** It's genuinely useful for the working group to know how
  the split falls in practice, because it's what tells us where to spend
  effort.
- **Find the place where you're assembling target code with string
  concatenation** and rewrite it with control-flow directives. Does the
  directive set cover it, or did you need something that isn't there?
- **Take the content you currently hoist into a singleton scope** to keep it
  from being emitted repeatedly, and put it back where it belongs with a tag.
  Does the matching rule do what you expected? Is "identical text or error"
  the behavior you want?
- **Look for cases where these features don't go far enough.** Partial coverage
  is worth reporting. A feature that solves 80% of your case is more useful to
  hear about than one that solves none of it.

It takes a community to build a standard, and your eyes and attention are a
much-appreciated contribution! And, as a reminder, the review closes at the
end of September.

## References

- [Feedback Forum](https://forums.accellera.org/forum/64-portable-stimulus-31-public-review-feedback/)
- [PSS 3.1 Draft](https://www.accellera.org/images/downloads/drafts-review/PSS%203.1%20Public%20Review%20Draft%202026.08.28.pdf)
- [Post 1: PSS 3.1 Is Out for Public Review](https://bitsbytesgates.com/blog/PSS3.1_PR_01_Overview/)
- [Post 2: Simplifying Constraint Modeling](https://bitsbytesgates.com/blog/PSS3.1_PR_02_Constraints/)
- [Post 3: Simplifying Composition](https://bitsbytesgates.com/blog/PSS3.1_PR_03_Composition/)
