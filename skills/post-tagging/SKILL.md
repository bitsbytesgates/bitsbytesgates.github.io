---
name: post-tagging
description: Review and suggest tags for a blog post in src/content/blog/. Use when adding tags to a new post, checking whether an existing post's tags are right, or deciding whether a post belongs to a series.
---

# Tagging a post

## First: read the vocabulary

Read `docs/tag-vocabulary.md` before suggesting anything. It is the controlled vocabulary —
five facets (Projects, Languages & standards, Third-party tools, Concepts, Context), a table of
retired tags and their canonical replacements, and the list of established `series` names.

Do not propose a tag from memory or from what the post's prose happens to call something. If a
name is not in that file, it is either retired (check the mapping table) or new (see
"Proposing a new tag" below).

## Then: read the post

Read the whole post body, not just the title and frontmatter. Tags describe what the post is
*about*, which is often not what it announces itself to be — a post titled as a SystemVerilog
DPI walkthrough may really be a PyHDL-IF post.

Note the existing `tags` / `categories` frontmatter. Both fields feed the same topic index
(`src/lib/topics.ts` merges them, deduping case-insensitively), so treat them as one list. Put
new tags in whichever field the post already uses; use `tags` for a brand-new post.

## Choosing the tags

Work facet by facet — it is the fastest way to avoid missing an obvious dimension.

1. **Project.** Does the post discuss one of my projects at any length? If so its tag is
   mandatory, even when the project is not the headline subject. This is the single most common
   historical mistake in this corpus.
2. **Language or standard.** Only when it is a *subject* of the post, not merely the language the
   examples happen to be written in.
3. **Third-party tool.** Same test: is the tool discussed, or just used to run something?
4. **Concept.** Usually one or two. Prefer the most specific one that genuinely fits; fall back to
   `Functional Verification` only when nothing narrower does.
5. **Context.** Add when the post is commentary, a retrospective, or about the blog itself.

Target **3–6 tags**. Fewer than three usually means the post is under-described; more than six
means no tag is narrowing anything.

Prefer the specific over the generic: `Package Management` over `Automation`, `PyUCIS` over
`FVUtils`, `SystemVerilog` over `HDL`.

## Series vs. tags

A multi-part sequence is a `series`, not a tag. If the post continues an established series, set:

```yaml
series: PSS Fundamentals
seriesOrder: 3
```

Established series names are listed at the bottom of `docs/tag-vocabulary.md`. `series` and
`seriesOrder` are schema fields in `src/content.config.ts`, rendered by `SeriesNav.astro`.

A series name may coincide with a tag (`FWRISC`, `System-Level Verification`); that is fine — the
tag still applies on its own merits.

## Proposing a new tag

A new tag has to earn its slot:

- It must plausibly apply to **at least three posts**, current or foreseeable. A tag that will
  only ever match one post is noise; use the nearest existing concept instead.
- It must not be a near-synonym of an existing tag. `Design Verification` and
  `Functional Verification` do *not* merge — they become two half-empty topic pages.
- If accepted, add it to `docs/tag-vocabulary.md` in the same commit, in the right facet, with a
  description and a stated scope.

When a tag fails these tests, say so and name the existing tag to use instead rather than
silently dropping the idea.

## Reporting

Present the suggestion as the frontmatter block to apply, followed by one line per tag saying why
it is there. Call out explicitly:

- any existing tag you are **removing**, and whether it is retired (give the replacement) or
  simply not supported by the post
- any tag you considered and rejected, when the call was close
- a `series` assignment, if any

Do not edit post frontmatter unless asked to apply the changes.
