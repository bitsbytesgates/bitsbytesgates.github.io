# Authoring a post

End-to-end: write → preview → publish. The site is Astro; posts are Markdown files in a
content collection, and publishing is a `v*` git tag — never a push to `main`.

Related: [`tag-vocabulary.md`](tag-vocabulary.md) is the controlled vocabulary for `tags` /
`categories` / `series`, and `skills/post-tagging` is the skill that applies it.

---

## 0. One-time setup

```sh
nvm use              # Node 24.19.0, pinned in .nvmrc
npm ci               # lockfile-authoritative; the same command CI runs
```

---

## 1. Create the post

One file per post, filed by the month it was published:

```
src/content/blog/<YYYY>/<MM>/<slug>.md
```

e.g. a post dated `2026-08-26` goes in `src/content/blog/2026/08/writing-a-pss-model.md`.
Create the month directory if it doesn't exist yet.

**The basename is the URL — the directories are not.** That post is served at
`/blog/writing-a-pss-model/`, *not* `/blog/2026/08/writing-a-pss-model/`. The `YYYY/MM`
layout is filing, so the collection stays navigable at 81-plus posts; it has no effect on
routing. `src/content.config.ts` overrides the glob loader's `generateId` to use the basename
alone, and `src/pages/blog/[...slug].astro` routes on that id.

Two things follow from this:

- **Basenames must be unique across the whole collection**, not just within a month. Two
  `getting-started.md` files in different months claim the same URL. Astro itself is silent
  about this — it exits 0, the later file wins, and the other post disappears from the site
  completely (no post page, no archive row, no RSS item). `scripts/check-slugs.mjs` runs in
  `prebuild` and fails the build instead, naming both files.
- **Moving a post between month directories is safe; renaming it is not.** The directory
  doesn't appear in the URL, so re-filing a mis-dated post changes nothing readers can see.
  Changing the basename changes the URL.

There is no date *in the filename* (unlike Jekyll's `_posts/`) and no `permalink` field. The
directory is derived from `date`, but nothing reads it back — `date` in the frontmatter
remains the single source of truth for ordering and display. Choose the slug once, lowercase
and hyphenated, and leave it alone after publication.

> Old Jekyll URLs are kept alive by `public/_redirects`, generated at build time from
> `src/url-map.json`. That map covers the 81 migrated posts. A **new** post needs no entry;
> only rename an existing post if you are also willing to add a redirect by hand.

### Frontmatter

Everything is validated by `src/content.config.ts` — a typo in a field name or a bad date
fails the build rather than silently vanishing. Minimum viable post:

```yaml
---
title: Writing a PSS Model
date: 2026-08-26
tags:
- PSS
- Zuspec
- Constrained Random
---
```

Full field reference:

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | **required** | Quote it if it contains a `:` |
| `date` | date | **required** | `YYYY-MM-DD` for new posts. Sorts the whole site |
| `tags` | string[] | `[]` | Use this for new posts |
| `categories` | string[] | `[]` | Legacy-modern posts use this; merged with `tags` into one topic facet |
| `series` | string | – | Must match an established series name exactly |
| `seriesOrder` | number | – | Position within the series |
| `excerpt` | string | – | Overrides the auto-excerpt; also the `<meta description>` |
| `image` | string | – | Social/OG image URL |
| `mermaid` | boolean | `false` | Declarative only — see §3, detection is automatic |
| `toc` | boolean | `false` | |
| `draft` | boolean | `false` | `true` removes the post from the site **entirely** — see §4 |
| `syndicate` | `full` \| `derived` \| `none` | `none` | LinkedIn syndication intent |

`legacy`, `author`, `modified_time`, `blogger_id`, `blogger_orig_url` are provenance fields
for the 45 Blogger-era posts. Do not set them on new work.

### Tagging

Do not invent tags from memory. Either read [`docs/tag-vocabulary.md`](tag-vocabulary.md)
and pick facet by facet, or hand the job to the `skills/post-tagging` skill — "tag
`src/content/blog/2026/08/<slug>.md`" is enough to trigger it, and it reads the vocabulary and the
whole post body before proposing anything.

The one rule that gets broken most: **if the post discusses one of your projects at any
length, that project's tag is mandatory**, even when it isn't the headline.

For a multi-part post use `series` + `seriesOrder`, not a new tag. Established names are
listed at the bottom of the vocabulary file; `SeriesNav` renders prev/next from them.

---

## 2. Write the body

Standard Markdown. Two conventions matter:

**Excerpt.** The listing pages show `excerpt` if set, otherwise everything before
`<!--more-->`, otherwise the first ~260 characters. Put `<!--more-->` after the opening
paragraph:

```markdown
Zuspec aspires to provide a unified, extensible Pythonic framework …

<!--more-->

## Background
```

**Code fences.** Highlighting is Shiki, with a committed PSS grammar
(`grammars/pss.tmLanguage.json`) registered as `pss`:

````markdown
```pss
component pss_top { … }
```
````

`systemverilog`, `python`, `sh`, etc. are all available as normal.

---

## 3. Images and diagrams

**Images** go under `public/imgs/<year>/<month>/` and are referenced by absolute path:

```markdown
<img src="/imgs/2026/08/block-diagram.png"/>
```

Anything in `public/` is copied verbatim. `scripts/post-build-images.mjs` adds
`loading`/`decoding`/`width`/`height` to every `<img>` in the built HTML, so do not hand-write
those attributes — but if you *do* set `width`/`height`, they are left alone and treated as
the intended display size.

`/legacy-img/` is the Blogger-era image pool. New posts should not add to it.

**Mermaid diagrams** are raw HTML blocks:

```html
<div class="mermaid">
graph LR
  a(Model)-->b(Generate)-->c(Run)
</div>
```

⚠️ **No blank lines inside the `<div>`.** In CommonMark a blank line ends an HTML block, and
everything after it is re-parsed as Markdown — smartypants turns `-->` into `–>` and Mermaid
renders a red "Syntax error in text" box. `scripts/check-mermaid.mjs` fails the build on this,
which is the only reason it isn't a recurring silent breakage.

The Mermaid library is loaded per-page by detecting `class="mermaid"` in the body, so the
diagram works whether or not you set `mermaid: true` in frontmatter.

---

## 4. Preview

```sh
npm run dev          # http://localhost:4321
```

Hot-reloads on save. Check the post page, the home page listing, `/archive/`, and each of its
`/topics/<topic>/` pages.

> **`draft: true` hides the post from `dev` too.** Every page — index, archive, topics,
> series, RSS, and the post's own route — filters on `!data.draft`, with no dev-mode
> exception. So a draft is genuinely unreachable locally. To preview work in progress, simply
> **omit `draft`** (or set it `false`) and don't tag a release; nothing reaches readers until
> §6 anyway. Use `draft: true` only for a finished-looking post you want committed but
> withheld.

### Full local build

Before committing, run the real pipeline once — `dev` skips the redirect generation, the image
pass, the Mermaid check, and search indexing:

```sh
npm run check        # type/content-schema check
npm run build        # prebuild: slug collisions + redirects → astro build → images → mermaid check → pagefind
npm run preview      # serve dist/ exactly as CI built it
```

Search (`/search/`) only works against `preview`, not `dev` — Pagefind indexes `dist/`.

---

## 5. Commit

```sh
git add src/content/blog/2026/08/<slug>.md public/imgs/2026/08/
git commit -m "Post: Writing a PSS Model"
git push origin main
```

A push to `main` **builds and checks, and publishes nothing.** Both pipelines
(`.github/workflows/ci.yaml`, `.forgejo/workflows/publish.yml`) run the identical
`npm run build` plus sanity checks:

- `dist/index.html` non-empty
- ≥ 150 HTML pages (a new post moves this up, never down)
- `dist/_redirects` present with ≥ 160 `301` rules
- `dist/pagefind/pagefind.js` present
- (Forgejo side) no internal hostnames/IPs in tracked files — this repo is public

Green push = the post is safe to release.

---

## 6. Publish

Publishing is a tag, and only a tag:

```sh
git tag v2026.08.26
git push origin v2026.08.26
```

`origin` is Forgejo; the tag mirrors to GitHub. Exactly one side is allowed to deploy,
decided by the release-authority switch at
`https://dvkit.org/.well-known/release-authority.json`:

- **authority = `github`** → the GitHub `publish` job downloads the built artifact and
  `wrangler pages deploy dist --project-name=bitsbytesgates`. That is the only publication
  step; if it doesn't run, the release didn't happen (it hard-fails on a missing credential
  rather than reporting a green no-op).
- **authority = `forgejo`** → the Forgejo `release` job re-uploads the build as
  `bbg-site-release-<tag>`; a host-side poller stages it, then, on the host:
  ```sh
  blog-promote    # staging -> live
  blog-deploy     # live -> Cloudflare Pages project 'bitsbytesgates'
  ```

The dormant side **skips** rather than fails — a red build on the standby every release would
train you to ignore the signal.

If the switch is unreachable on a tag, both sides refuse to publish (fail closed).

### Verify the deployment

```sh
node scripts/verify-deployment.mjs https://bitsbytesgates.com
```

Checks every old URL in `src/url-map.json` for a single-hop 301 in both `.html` and
extensionless forms, plus feed identity. Run it against a preview URL before a cutover and
against production after a release. Non-zero exit = something regressed.

---

## Checklist

- [ ] `src/content/blog/<YYYY>/<MM>/<slug>.md`, basename final and unique across the collection
- [ ] `title`, `date`, and tags from the vocabulary (project tag included)
- [ ] `<!--more-->` after the opening paragraph
- [ ] Images under `public/imgs/<year>/<month>/`, absolute `/imgs/…` paths
- [ ] No blank lines inside any `<div class="mermaid">`
- [ ] `npm run check && npm run build && npm run preview` clean
- [ ] Commit + push `main`, CI green
- [ ] `git tag vYYYY.MM.DD && git push origin vYYYY.MM.DD`
- [ ] `node scripts/verify-deployment.mjs https://bitsbytesgates.com`

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Build fails with a Zod/content error | Frontmatter field name or type doesn't match `src/content.config.ts` |
| Post missing from every page, no error | `draft: true` |
| Red "Syntax error in text" box where a diagram should be | Blank line inside the `<div class="mermaid">` |
| `pss` fence renders unhighlighted | Grammar `name` collision — the spread must come *first* in `astro.config.mjs` |
| CI: "only N pages built" | Content collection glob matched nothing; check the file is under `src/content/blog/<YYYY>/<MM>/` with a `.md` extension |
| `ERROR: duplicate post slugs` | Two posts share a basename in different month directories — basenames are global. Rename one; if it was already published, add its old URL to `src/url-map.json` |
| A post is simply absent from the built site, no error | Almost always a slug collision that predates the `check-slugs` guard, or `draft: true` |
| A post appears at `/blog/2026/08/<slug>/` | `generateId` was dropped from the glob loader in `src/content.config.ts`; every URL and the whole redirect map breaks with it |
| Search finds nothing | You're on `npm run dev`; Pagefind only indexes `dist/` |
| Tag pushed, run green, site unchanged | Authority switch names the other side — check which pipeline actually ran the deploy job |
