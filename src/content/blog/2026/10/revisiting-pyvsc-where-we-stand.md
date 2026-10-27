---
title: 'Revisiting PyVSC: Where we Stand'
date: 2026-10-05
series: Revisiting PyVSC
seriesOrder: 1
categories: [Python DV, Constraint Solvers, PyVSC, Open Source EDAs]
syndicate: derived
draft: true
image: /imgs/2026/10/pyvsc_intro_banner.png
---

<p align="center">
<img src="/imgs/2026/10/pyvsc_intro_banner.png" width="660" alt="Revisiting PyVSC: where we stand. Six years of users, one short list, and what we did about it. Five sources -- constrainedrandom, SyoSil, Incore / Coverify, Microsoft DatagenDV and the FSiC survey -- feed into one short list: throughput, skewed distribution, one general solver, ergonomics, cross coverage. An arrow leads to a dark card showing riscv-dv pygen instructions per second climbing in six steps, labelled ~100x, 128 to 13,569, 0 constraint violations."/>
</p>

<!--
The outline this post was written from: notes/pyvsc-series/01_intro.md
(sources, do-not-use list and the pre-publish checklist live there).

Figures: notes/pyvsc-series/imgs/make_figs.py (SVG) + export.sh (PNG).
Distribution data: notes/pyvsc-series/bench/dist_grid.py, run 2026-10-11 --
stock = pyvsc 0.9.6.37412289187 from PyPI (Boolector); dv-solve = the
pyvsc-dv-solve working tree (branch mballance/dv-solve), same classic code,
VSC_SOLVER=dv-solve; cr = constrainedrandom from PyPI. Single runs.
riscv-dv numbers: pyvsc-dv-solve doc/notes/riscv_dv_speedup_summary.md (2026-10-09).
constrainedrandom comparison: benchmarks/RESULTS_constrainedrandom.md (2026-09-22).
Downloads/stars: pypistats + GitHub API, 2026-10-11.
-->

PyVSC started in 2019 with a simple goal: make SystemVerilog-style
constrained-random stimulus and functional coverage feel as natural in Python
as they do in SystemVerilog. I wrote about it in early 2020, in a series that
started with [Modeling Random Stimulus and Functional Coverage in
Python](/blog/modeling-random-stimulus-and-functional-coverage-in-python/) and
went on to [data types](/blog/python-verification-stimulus-and-coverage-data-types/),
[constraints](/blog/python-verification-stimulus-and-coverage-constraints/)
and [functional coverage](/blog/python-verification-stimulus-and-coverage-functional-coverage/),
and in a [WOSET 2020 paper](https://woset-workshop.github.io/PDFs/2020/a15.pdf)
that already named riscv-dv as the user that motivated it.

Six years on, PyVSC is widely used, and it's also widely critiqued. What
strikes me about the critiques is how specific and consistent they are. People
who have never talked to each other, measuring different things, have arrived
at the same short list. And, for the most part, they're right.

This post is about that list: where PyVSC stands today, what its users have
told us, what we've learned from it, and where the work is going. It's the
first of a series. The posts that follow go into each piece in depth, with
the numbers, including the ones that point at a gap.

One promise up front, because it matters to anyone with a testbench built on
PyVSC: **everything new is opt-in and additive.** The classic `@vsc.randobj`
and `@vsc.covergroup` API is unchanged, and the old and new styles can be
mixed in the same file.

<!--more-->

# Where PyVSC stands

## Who uses it

PyVSC gets about 64,000 downloads a month from PyPI. The GitHub
repository has about 150 stars. Download counts overstate the number of
people, of course. Some of that volume is riscv-dv's CI and packages that pull
PyVSC in as a dependency. Even so, it's a sizable user base for a niche
library.

A few of those users have written about it publicly, which is where most of
what follows comes from:

- **Microsoft's [DatagenDV](https://github.com/microsoft/datagenDV)** uses
  PyVSC as its randomization engine across multiple testbenches. The
  [DVCon paper](https://dvcon-proceedings.org/wp-content/uploads/1044-Datagen-Python-Constrained-Random-Test-Stimulus-Framework.pdf)
  reports that "DatagenDV has successfully saved hundreds of hours over
  several projects."
- **riscv-dv's Python generator (pygen)** is built on PyVSC.
- **PyUVM-based work** tends to reach for PyVSC by default. SyoSil chose it
  for a real PyUVM testbench in their
  [open-source verification whitepaper](https://www.syosil.com/images/resources/osv_whitepaper-1.0.3.0.pdf),
  and academic papers ([arXiv 2407.10317](https://arxiv.org/html/2407.10317v1),
  [arXiv 2503.11666](https://arxiv.org/pdf/2503.11666)) use it for the
  simple reason one of them gives: "Python as HVL does not have a covergroup.
  Hence, PyVSC is used."

The newest independent measurement, SyoSil's from 2024 against version 0.8.6,
is still a fair picture of PyVSC today. The library has been stable for some
time: fixes, but no change of direction. This series is about the change of
direction, and it puts current numbers on the record alongside it.

## What PyVSC got right

The strongest endorsement comes from the people who used PyVSC hardest. The
DatagenDV team needed to bring block-level SystemVerilog constraints up to the
chip level, and found:

> "An instruction which contained 60 fields and 300 lines of SystemVerilog
> constraints was rewritten using PyVSC in a day's time, replacing directed
> test case values."

That's the thing PyVSC was designed for: if you can write the constraint in
SystemVerilog, you can write it in PyVSC with recognizably the same shape.

Other strengths come up repeatedly:

- **Nested and dynamic objects.** SyoSil moved their testbench off
  cocotb-coverage because of it: "No additional boilerplate is required to add
  support for randomizing nested objects."
- **Randomization and coverage in one library**, with coverage exported in the
  standard UCIS format.
- **A real solver.** Tightly constrained problems get solved, and an
  unsatisfiable constraint set is reported as unsatisfiable rather than
  retried forever.

These aren't incidental. A faster but simpler approach can't easily add them,
because each one depends on having a real constraint solver underneath. That's
why the work described in this series keeps one. The job was never to remove
the solver; it was to make it fast and fair.

SyoSil's conclusion sums up the trade-off as users saw it:

> "For non-complex constraints, constrainedrandom is much faster than PyVSC,
> whereas PyVSC is faster at solving complex constraints. This comes at the
> cost of PyVSC skewing the distribution of the generated random numbers,
> which might prolong verification efforts as some input combinations become
> less likely to be generated."

I've come to think of that paragraph as a good capture of the objective: keep the
complex-constraint win, close the gap on simple constraints, and get rid of
the skew. We'll come back to it at the end and see how we did.

## What users told us

Five independent sources have published substantive critiques of PyVSC:
the constrainedrandom project, SyoSil's whitepaper, a DVCon paper from Incore
Semiconductors and Coverify, Microsoft's DatagenDV paper, and the
[FSiC open-source verification survey](https://wiki.f-si.org/images/0/06/Open-Source_Verification.pdf).
Lay what they say side by side and the overlap is striking.

<p align="center">
<img src="/imgs/2026/10/pyvsc_critique_matrix.png" width="720" alt="Five independent reviews, one short list. A matrix of five sources (constrainedrandom, SyoSil, Incore / Coverify, Microsoft DatagenDV, FSiC survey) against what they said about PyVSC. What needed fixing: throughput (flagged by the first four), skewed distribution (the first four), everything goes to one general solver (Incore), ergonomics of rand_* types and if_then (SyoSil, Microsoft), cross binsof and bin with() (FSiC). What it got right: SystemVerilog constraints port over (SyoSil, Microsoft), nested and dynamic object randomization (SyoSil, Microsoft), coverage in the same library (SyoSil, Microsoft, FSiC)."/>
</p>

**1. Throughput.** constrainedrandom states its goal plainly: to "achieve at
least a 10x speedup over pyvsc." We ran their benchmark suite against stock
PyVSC, and the claim is true. constrainedrandom is 26 to 426 times faster,
geometric mean, depending on the workload set and whether you count
first-call costs. Along the way we found three defects in the suite itself.
Correcting them doesn't rescue PyVSC. Others
measured the same thing in their own settings. Incore found that pygen
"generates less than a hundred random RISC-V instructions in a second," and
DatagenDV reports that 10,000 randomizations of a three-field item took
roughly five minutes.

**2. Distribution.** SyoSil found PyVSC's results "heavily skewed towards low
values for a and high values for b" under a simple `a < b` constraint. Incore
and DatagenDV report skew independently. This matters more than it might
seem. Stimulus that keeps landing on the same few values means some
combinations rarely get generated, and coverage closes more slowly.

**3. Architecture.** Incore goes further and names the cause: PyVSC "relies
completely on Satisfiability (SAT) solvers." There's no fast path for the easy
constraints, which are most of them.

**4. Ergonomics.** DatagenDV shadows every PyVSC random field with a plain
Python field, because "PyVSC's special data types are not very easy to work
with outside of constraints." They built a `@rand_dataclass` decorator to do
it automatically. SyoSil's complaint is about the constraint language itself:
needing `with vsc.if_then` and `with vsc.else_then` "to express relatively
simple conditional relationships."

**5. Coverage modeling.** The FSiC survey notes gaps in cross coverage:
`binsof`/`intersect` and `with` clauses.

Notice what's *not* on the list. Nobody says the modeling approach is wrong,
or that the coverage semantics are off. The complaints are about speed,
quality and convenience, not about the model.

I want to thank everyone who wrote these up. They were detailed, reproducible
and fair, and taken together they amount to a written specification for the
work that followed. Here's how that work lines up against the list:

| What users asked for | What we built | Where it's covered |
|---|---|---|
| Throughput | dv-solve: the cheapest engine first, a complete engine for the residue | Post 2 |
| Distribution | Sampling treated as a requirement, and measured | Post 2 |
| One general solver for everything | A tiered engine, with the solver behind it | Post 2 |
| Ergonomics (`rand_*`, `if_then`) | Dataclasses, with constraints parsed rather than executed | Post 3 |
| Cross coverage (`binsof`, `with`) | Covergroups as dataclasses | Post 4 |

# What we've learned

Looking back, classic PyVSC pays two taxes. The first is the solver: every
randomization goes to a heavyweight general-purpose engine, which is built to
answer a different question than the one stimulus generation asks. The second
is elaboration: PyVSC rediscovers the structure of every object, every time
one is created. The first two lessons below are about those taxes. The other
two are about not trading correctness away to remove them.

## 1. Stimulus generation is not general-purpose constraint solving

An SMT solver is a *decision procedure*. It's engineered to answer "is there a
solution?" as quickly as possible, and to hand back whichever solution it
found first. That's exactly right for checking a property. For generating
stimulus, it's the wrong question. We don't want *a* solution; we want a
*well-distributed random* one, and a different one on every call. The first
solution a solver finds is a poor sample, because solvers tend to find
solutions near the boundaries of the space.

The verification workload also has a distinctive profile, and each part of
it suggests something a solver can exploit:

| What the workload looks like | What a solver can do about it |
|---|---|
| The same constraint structure, solved thousands of times with new values | Compile once, then just rebind the values |
| Solutions drawn one at a time, from constraints that shift (inline `with`, changing knobs) | Don't rely on batch-sampling techniques that assume a fixed problem |
| Mostly bounds, ranges and set membership, with a small residue that's genuinely hard | Solve the easy part natively; escalate only the residue |
| Frequently independent sub-problems | Partition, and solve each separately |
| Unsatisfiable constraints must still be reported | Keep a complete engine behind the fast one |

The conclusion is that we need a a solver engine tuned to that profile, rather than a
general one bent toward a job it was never intended to do. That's the subject of the next post.

## 2. Structure belongs to the type, not the instance

Classic PyVSC does all of its structural work when an object is created. It
scans the object to find its fields, then *executes every constraint method*
to record what the constraints say. For the most common loop in
verification (create an item, randomize it, send it, discard it, repeat)
that's backwards since every iteration rediscovers exactly the same structure.

The cost is easy to underestimate. When we profiled classic PyVSC, the native
solve was only about 12–20% of the time spent in `randomize()`. A faster
solver alone could never fix the rest.

The lesson I take from this is that **modeling form is a performance
decision.** A declarative, typed model, where the structure is known once per
class, is also the model that lets the library stop redoing work. Here,
ergonomics and performance point in the same direction. It was encouraging to
see that the DatagenDV team had independently arrived at a dataclass-based
model for their own reasons.

## 3. Operator overloading has sharp edges, and the worst ones are silent

PyVSC's constraint language is built on Python operator overloading. That
works for `<`, `&` and `+`, but Python doesn't let a library overload `and`,
`or`, `not`, `if`, `in`, or chained comparisons. Hence `vsc.if_then`,
`vsc.rangelist`, and a few precedence traps around `&` and `|`.

Some of those limits produce errors. The ones that worry me are the ones that
don't. Consider:

```python
@vsc.constraint
def c(self):
    sum(self.listvar) == 0       # quietly discarded
    self.listvar.sum == 0        # the working idiom
```

Python's builtin `sum()` doesn't produce a constraint, so the first line
silently constrains nothing. This isn't hypothetical. constrainedrandom's own
benchmark uses that form, and 193 of the 200 solutions its PyVSC baseline
produced violated the constraint. Nobody was warned. If the author of a
benchmark suite gets this wrong, users do too, and that makes it a library
problem, not a user problem.

Chained comparisons fail the same way. Python evaluates `lo <= x < hi` as
`lo <= x and x < hi`, and since `and` can't be overloaded, the first half is
silently thrown away. The constraint you get is just `x < hi`.

The fix came from outside PyVSC. pytest has long *read* the source of your
assertions rather than simply running them, and [Zuspec's](https://github.com/zuspec/zuspec-dataclasses) constraint model is
built on the same idea: parse, don't execute.

## 4. Correct means legal *and* well-distributed

For stimulus, correctness has two halves. Every answer must satisfy the
constraints, and the answers must cover the space the constraints allow. A
generator that never draws some legal values is wrong in a way no constraint
check will catch: the testbench passes, and the bug those values would have
found stays hidden.

So every speed claim in this series comes with a check on both halves. The
new solver's answers can be checked against the constraints themselves and
against an independent solver (z3), and distribution is measured, not
assumed. When we found the new solver collapsing one constraint shape onto
a single value, the fix cost 5x of throughput on that shape, and we took it.
Correct and slower beats fast and wrong.

# Where we're headed

The work falls into three pieces. Each is opt-in, and each gets its own post.

**A solver built for stimulus.** dv-solve tries the cheapest engine first,
keeps a complete engine for the hard residue, and treats distribution as a
requirement rather than a side effect. Existing PyVSC code runs on it without
changes, and Boolector becomes optional.

**Dataclasses, with constraints parsed rather than executed.** A
dataclass-based front-end (`vsc.dc`) where structure is established once per
class. Constraint methods are read with Python's `ast` module when the class
is defined, and never executed. Chained comparisons like `0 <= x < 256`,
native `if`/`elif`/`else`, `x in [...]` and `x in range(...)`, and (as of
this week) `and`, `or` and `not` all mean what they say in a class
constraint. Anything the parser can't translate is rejected when the class is
defined, with a file and line number. Builtin `sum()` over an array, for
example, is now an error instead of a no-op.

**Covergroups as dataclasses.** The same typed model applied to functional
coverage, including crosses with a working `binsof`.

## What this enables: riscv-dv at 100x

Incore measured pygen at under 100 instructions a second. Here's where it is
now:

<p align="center">
<img src="/imgs/2026/10/pyvsc_riscvdv_staircase.png" width="720" alt="riscv-dv pygen: 128 to 13,569 instructions per second, on riscv_arithmetic_basic_test for rv32imc, log scale, each step stacking on the one above. Stock PyVSC 0.9.6 with pygen unmodified: 128. Plus the dv-solve solver, pygen still unmodified: 474 (3.7x). Plus porting pygen's instruction model to dataclasses: 6,553 (13.8x). Plus solving register constraints without the solver: 9,785 (1.5x). Plus riscv-dv fixes removing a needless copy per stream: 12,563 (1.3x). Plus keeping the solve plan when only constraint values change: 13,569 (1.1x). Overall about 100x. Every run had zero oracle violations and every generated program assembles."/>
</p>

That's about a 100x improvement, and it's worth being clear about where it
came from:

- **The solver alone**, with pygen unmodified, takes it from 128 to 474
  instructions a second (3.7x). That's what an existing user gets without
  changing any code.
- **Porting pygen's instruction model** to the dataclass front-end is the
  biggest single step, another 13.8x.
- **The rest** comes from solving register-selection constraints without the
  solver, removing a needless copy in riscv-dv, and keeping the solve plan
  when only constraint values change.

Every run produced zero constraint violations under the benchmark's checker,
and every generated program assembles. The speed-only steps leave the output
byte-identical across seeds. This is one test, `riscv_arithmetic_basic_test`
for rv32imc, so I'm not claiming every riscv-dv test speeds up by the same
amount. That's the kind of thing I'd like help measuring.

On constrainedrandom's own benchmark suite, the new stack is now 3.1x faster
than constrainedrandom with warm caches and 5.2x faster cold.

## Beyond Python

dv-solve isn't tied to PyVSC. It can also run as the constraint solver behind
Verilator's `randomize()`, and we've validated it there on riscv-dv. That gets
its own post, with numbers.

## Distribution: one clear win, one open problem

The first distribution check is the shape that shows the problem most
clearly: a value drawn from `inside {1, 2, [100:200]}`.

<p align="center">
<img src="/imgs/2026/10/pyvsc_inside_hist.png" width="720" alt="a inside {1, 2, [100:200]}: where the draws land, 4,000 draws over 103 legal values, one bar per value, dashed line at an even spread of about 39 each. Stock PyVSC 0.9.6 with Boolector: most frequent value drawn 1029 times and the next 992 times, both near 200, and only 101 of 103 values seen. PyVSC with dv-solve, same code: most frequent value 49 times, all 103 values seen, bars hugging the even line. constrainedrandom: most frequent value 52 times, all 103 values seen."/>
</p>

Stock PyVSC put half of its 4,000 draws on just two values, and never drew
1 or 2 at all. The same code on dv-solve spreads the draws as evenly as
constrainedrandom does.

The second check is SyoSil's, which is the best uniformity test I know of in
the published literature: `x <= y` with both in `[0:9]`, 10,000 draws, and a
count of how often each of the 55 legal pairs comes up. A cell counts as even
if it's within 10% of the ideal share.

<p align="center">
<img src="/imgs/2026/10/pyvsc_syosil_grid.png" width="720" alt="SyoSil's uniformity test: x less than or equal to y over [0:9], 10,000 draws, share of each (x, y) pair; the ideal is 1.82% and within plus or minus 10% counts as even. Three triangular heat maps. Stock PyVSC 0.9.6: 15 of 55 cells even, busiest cell 3.4%, with over-represented cells along the diagonal. PyVSC with dv-solve: 12 of 55 cells even, busiest cell 5.2%, with the two corner cells (0,0) and (9,9) heavily over-represented and the upper-right region under-represented. constrainedrandom: 46 of 55 cells even, busiest cell 2.2%."/>
</p>

Here dv-solve is no better than stock PyVSC. It's arguably a little worse,
with the two corners of the triangle drawn nearly three times as often as
they should be. constrainedrandom passes comfortably. I'd rather show you this
than leave it out. Relational constraints between fields are the next thing
we're fixing in the sampler, and this grid is going into the test suite as a
gate.
<!-- CONFIRM: the commitment above (fix next + grid as a CI gate) is written
     on your behalf. Found 2026-10-11 while making the figure; vdc front-end
     gives the same result over 30,000 draws (11/55 even, corners 5.5%/5.7%). -->

## Back to the scoreboard

So how did we do against SyoSil's summary?

- **Complex constraints:** kept, and faster.
- **Simple constraints:** much closer, but not won. constrainedrandom is still
  faster on loosely constrained problems and on weighted `dist`. On our
  broader benchmark set with warm caches, the new stack runs at about half
  constrainedrandom's speed.
- **Distribution:** fixed for set membership like `inside`, not yet for
  relational constraints like `x <= y` or `a < b`. constrainedrandom is still
  closer to uniform there.

So we're not claiming to be the fastest Python constrained-random library,
and we're not claiming uniform distributions. We're also not making any
comparison with the solvers in commercial simulators. What we are claiming is
a big, measured step on every axis users raised -- even if there are still gaps.

# Closing

Every engineering decision is a trade-off, and we make the best ones when the
trade-offs are measured and out in the open. That's why the misses are in this
post alongside the wins.

If you use PyVSC, I'd like your workloads, your constraint shapes and your
benchmarks, especially the ones where PyVSC is slow or the distribution looks
wrong today. Distribution bugs are invisible unless someone goes looking, and
the shapes you care about are the ones we should be testing. The next post
explains how to turn on the solver's cross-checking for your own workloads;
please send us anything it flags.

The critiques that shaped this work were public and reproducible, and that's
what made them useful. constrainedrandom's benchmark suite made our solver
better. Better shared benchmarks help
every Python verification library, not just PyVSC. The DatagenDV authors put
it well:

> "Open-source verification tools like PyVSC are still new and need
> additional vetting. We encourage readers to contribute to open source design
> verification libraries."

Next time: the solver.

<!-- TODO at release: install line (pip install pyvsc[dv-solve]) and the
     version number. Until then: the work is on the mballance/dv-solve branch
     of github.com/fvutils/pyvsc (24 commits not yet pushed as of 2026-10-11). -->

## References

- [PyVSC on GitHub](https://github.com/fvutils/pyvsc) and
  [documentation](https://dvkit.org/fvutils/pyvsc/)
- [PyVSC: WOSET 2020](https://woset-workshop.github.io/PDFs/2020/a15.pdf)
- [constrainedrandom](https://github.com/will-keen/constrainedrandom)
  ([docs](https://constrainedrandom.readthedocs.io/en/latest/intro.html),
  [ORConf 2025 talk](https://youtu.be/nhqgxgn9FRg))
- SyoSil: [An implementation of a Python-based verification environment using PyUVM and cocotb](https://www.syosil.com/images/resources/osv_whitepaper-1.0.3.0.pdf)
- Incore / Coverify: [Crafting a Million Instructions/Sec RISCV-DV](https://dvcon-proceedings.org/wp-content/uploads/1008.pdf) (DVCon)
- Microsoft: [DatagenDV: Python Constrained Random Test Stimulus Framework](https://dvcon-proceedings.org/wp-content/uploads/1044-Datagen-Python-Constrained-Random-Test-Stimulus-Framework.pdf) (DVCon)
- Minigutti: [Open-Source Verification of digital ASIC/FPGA circuits](https://wiki.f-si.org/images/0/06/Open-Source_Verification.pdf) (FSiC)
- [arXiv 2407.10317](https://arxiv.org/html/2407.10317v1),
  [arXiv 2503.11666](https://arxiv.org/pdf/2503.11666)
