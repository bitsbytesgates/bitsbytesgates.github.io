# Tag Vocabulary

The controlled vocabulary for `tags` / `categories` frontmatter on posts in
`src/content/blog/`. This is the reference for tagging **new** posts; the one-time cleanup of
the existing 81 posts is tracked separately in `notes/tagging-review.md`.

## How tags surface

`src/lib/topics.ts` merges `categories` + `tags` into a single "topics" facet, deduped
case-insensitively. Consequences that motivate having a fixed vocabulary at all:

- A near-synonym (`Chisel` vs. `Chisel3`) becomes **two** topic pages that each look sparse.
- Case is deduped, but spelling is not — `functional coverage` and `Functional Coverage` merge;
  `Design Verification` and `Functional Verification` do not.
- A post with no topics is invisible in the topic index **and** falls back to recency-based
  "related posts" instead of real ones.

## Rules for tagging a new post

1. **3–6 tags.** Fewer than 3 usually means the post is under-described; more than 6 means no
   tag is doing any narrowing.
2. **Tag the project by name.** If a post discusses one of my projects at any length, it carries
   that project's tag — even when the post is nominally about something else. This is the single
   most common historical mistake.
3. **Only names from this document.** Adding a new tag is fine, but add it here in the same
   commit, with a description and a stated scope.
4. **Earn a new tag with three posts.** A tag that will only ever apply to one post is noise;
   use the nearest existing concept instead.
5. **Prefer the specific over the generic.** `Package Management` over `Automation`;
   `PyUCIS` over `FVUtils`; `SystemVerilog` over `HDL`.
6. **A series name is not a topic.** Use the `series` field (see the bottom of this file).
7. **Check the retired list** before inventing a tag — the name may already have a canonical form.

---

## Facet 1 — Projects (mine)

Every post substantially about one of these carries its tag. Use the project name even when the
post also carries the underlying language or standard.

Only active projects are listed. Archival posts about retired projects keep their existing
project tags — those tags simply aren't candidates for new posts, so they're left out here.

| Tag | Description / scope |
|---|---|
| `Zuspec` | Python-embedded, model-driven hardware design and verification — executable specs, PSS-style modeling in Python, "becoming the compiler". |
| `PyVSC` | Python library for constrained-random stimulus and functional coverage (SystemVerilog-like constraints and covergroups in Python). |
| `PyUCIS` | Python API and tooling for reading, writing, and manipulating UCIS coverage databases. |
| `PyHDL-IF` | Cross-calling between Python and SystemVerilog/UVM testbenches — the "DPI isn't enough" work. Supersedes the old `PythonUVM` tag as a *topic*. |
| `PyBFMs` | Task-based bus functional models for cocotb-based testbenches. |
| `IVPM` | Project-dependency and environment manager for DV/hardware projects — the "what's my env again" tool. |
| `EDAPack` | Packaged installation and management of open-source EDA tools. |
| `DVKit` | Eclipse-based IDE distribution assembled for DV engineers. |
| `SVEditor` | Eclipse SystemVerilog editor — indexing, navigation, references. |
| `FWRISC` | Featherweight RISC — small FPGA-friendly RISC-V core and its verification. Also a `series` name. |

## Facet 2 — Languages & standards

Use when the language or standard is a subject of the post, not merely the implementation
language of an example.

| Tag | Description / scope |
|---|---|
| `PSS` | Accellera Portable Test and Stimulus Standard — the language, its semantics, and modeling in it. |
| `UVM` | Universal Verification Methodology — components, sequences, analysis ports, registers. |
| `SystemVerilog` | The language itself: syntax, DPI, class library, tooling that targets it. |
| `Python` | Python as a hardware-verification/design language or as the implementation of a tool under discussion. |
| `Chisel` | Chisel/Chisel3 hardware construction language. |
| `SystemC` | SystemC and its class-library-vs-language trade-offs. |
| `UCIS` | Accellera Unified Coverage Interoperability Standard — the coverage database format/API. |
| `RISC-V` | The RISC-V ISA: architecture, cores, toolchain, compliance. |
| `YAML` | YAML as a configuration/data format — schemas, usability, tooling. |
| `Accellera` | Standards-body context: standardization process, committee work, spec releases. |

## Facet 3 — Third-party tools

| Tag | Description / scope |
|---|---|
| `cocotb` | The cocotb Python cosimulation framework. |
| `Verilator` | Verilator simulation/lint, including as the engine behind an example. |
| `Eclipse` | The Eclipse platform as an IDE substrate. |
| `Jinja2` | Jinja2 templating, typically for generated content. |
| `Sphinx` | Sphinx documentation generation. |
| `Googletest` | Googletest as a unit-test harness for hardware-adjacent C++. |
| `Zephyr` | Zephyr RTOS running on the design under test. |
| `FuseSoc` | FuseSoc package/build management. |

## Facet 4 — Concepts

| Tag | Description / scope |
|---|---|
| `Functional Verification` | The discipline in general — methodology, practice, ecosystem. Default when no narrower concept fits. |
| `Functional Coverage` | Covergroups, coverage models, coverage collection and analysis. |
| `Constrained Random` | Constraint solving and randomized stimulus generation. |
| `SoC Verification` | Verification at the SoC/integration level, where blocks meet. |
| `System-Level Verification` | Verification frameworks and methodology spanning hardware and software at the system level. Broader and more architectural than `SoC Verification`; posts often carry both. |
| `Software-Driven Verification` | Tests driven by software running on an embedded processor in the DUT. |
| `Bus Functional Models` | BFMs: protocol abstraction above signal level. |
| `Code Generation` | Generating source from a model or template — generators, transpilation, template engines. |
| `Design Abstraction` | Raising the level at which hardware or its behavior is described. |
| `Domain-Specific Language` | DSL design, embedded vs. standalone languages, the language/API boundary. |
| `Package Management` | Declaring, resolving, and installing project dependencies and tools. |
| `Formal Verification` | Formal/property-based methods and tools. |
| `Unit Testing` | Unit-level test practice, TDD, test safety nets. |
| `Documentation` | Writing, generating, and maintaining docs. |
| `IDE` | Integrated development environments and the editing/navigation experience. |
| `FPGA` | FPGA implementation, boards, vendor flows, prototyping. |
| `Register Models` | Register description, abstraction, and access from tests. |

## Facet 5 — Context

| Tag | Description / scope |
|---|---|
| `EDA` | The EDA industry, its tools and economics, as a subject. |
| `Open Source EDA` | Open-source EDA specifically: tools, ecosystem, adoption. |
| `AI` | LLMs/AI applied to design, verification, tooling, or docs. |
| `Opinion` | Argument or commentary rather than a technique or walkthrough. |
| `Year in Review` | Annual retrospective posts. |
| `Meta` | Posts about the blog itself. |

---

## Retired tags and their replacements

Do not use these. If a draft carries one, map it:

| Retired | Use instead |
|---|---|
| `Design Verification`, `Verification` | `Functional Verification` |
| `Chisel3` | `Chisel` |
| `RiscV` | `RISC-V` |
| `Electronic Design Automation` | `EDA` |
| `Integrated Development Environment`, `SVE` | `IDE` |
| `functional coverage` (lowercase), `Coverage` | `Functional Coverage` |
| `BFMs` | `Bus Functional Models` |
| `Templates`, `Template`, `Automation` | `Code Generation` |
| `Featherweight RISC`, `RISCVcontest` | `FWRISC` (`RISCVcontest` as a `series`) |
| `SVF`, `Verification Frameworks` | `System-Level Verification` |
| `SoC` | `SoC Verification` |
| `constrained random` (lowercase), `SMT`, `Boolector`, `CRAVE` | `Constrained Random` |
| `Xilinx`, `Vivado`, `Quartus`, `Altera` | `FPGA` |
| `higher-level design`, `design abstraction` (lowercase) | `Design Abstraction` |
| `domain-specific language` (lowercase), `DSL` | `Domain-Specific Language` |
| `HDL`, `RTL`, `Verilog` | the specific language (`SystemVerilog`, `Chisel`) or nothing |
| `FVUtils` | the specific project (`IVPM`, `EDAPack`, `PyUCIS`, …) |
| `PythonUVM` | `PyHDL-IF` + `UVM` + `Python`; keep `PythonUVM` as a `series` |
| `FOSSiDV` | `Open Source EDA` |
| `Symbiyosys` | `Formal Verification` + `Open Source EDA` |
| `PyPi`, `Prototype`, `Schema`, `JSON`, `Intro`, `Test-Driven Development`, `Modelsim`, `Icarus Verilog` | drop, or replace with the nearest concept tag |

`HDL` and `RTL` were Blogger-era catch-alls that applied to nearly every post and narrowed
nothing. `FVUtils` is a GitHub org name, not a topic.

---

## `series`, not tags

`src/content.config.ts` defines `series` and `seriesOrder`, and `SeriesNav.astro` /
`src/pages/series` render them. Multi-part posts set those fields instead of inventing a tag:

```yaml
series: SoC Integration Testing
seriesOrder: 1
```

Established series names: `SoC Integration Testing`, `Python Verification Stimulus and Coverage`,
`PSS Fundamentals`, `Chisel Sharpening`, `FWRISC`, `DVKit`, `PythonUVM`, `Py-HPI`,
`System-Level Verification`, `Re-Evaluating EDA DSLs`.

---

## Worked examples

```yaml
# A PyHDL-IF post that is nominally about SystemVerilog DPI
tags: [PyHDL-IF, Python, SystemVerilog, UVM, cocotb, Functional Verification]

# A PSS post in the fundamentals tour
tags: [PSS, Register Models, UVM, SoC Verification]
series: PSS Fundamentals
seriesOrder: 8

# A tooling post that happens to use IVPM
tags: [IVPM, AI, Package Management, Verilator, Python]

# Commentary
tags: [Opinion, EDA, Open Source EDA, AI]
```
