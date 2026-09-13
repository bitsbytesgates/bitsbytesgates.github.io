# attic — the Jekyll site, retired

Nothing in this directory is built, served, or read by anything. The site is Astro; it
lives in `src/`, `public/`, `scripts/` and `astro.config.mjs`.

## Why this directory exists

Google Analytics was lost in the Jekyll → Astro migration, and the reason was structural:
the measurement ID lived in `_includes/head.html`, which stopped being the site but still
looked exactly like it. Nothing flagged it as unported, because nothing could tell the
difference between a file that mattered and a file that used to.

A grep for `gtag` returned three answers — one live, one broken (`_includes/analytics.html`,
templated on a `site.google_analytics` key that `_config.yml` never defined), and one dead
(`head-custom.html`, entirely inside a `{% comment %}`). Only one was real. That ambiguity
is what this move deletes.

Git history keeps all of it either way. The point is that grep stops finding it.

## What was verified before moving

The prebuild scripts were checked for dependencies on this tree — the redirect map keeps
nine years of inbound links alive and must not break:

- `scripts/gen-redirects.mjs` reads `src/url-map.json`. Not `_posts/`.
- `scripts/check-slugs.mjs` reads `src/content/blog`. Not `_posts/`.

Neither references anything here. `grammars/` was deliberately **left in place** at the repo
root despite looking like site furniture: `astro.config.mjs` reads
`grammars/pss.tmLanguage.json` for PSS syntax highlighting.

## Contents

| Path | What it was |
|---|---|
| `_config.yml` | Jekyll site config, including the `subscribe_url` / `subscribe_id` for the Google Forms email signup |
| `_includes/` | Jekyll partials — `head.html` (the live GA tag), `analytics.html` (broken), `subscribe.html` (the Forms POST) |
| `_layouts/` | Jekyll page templates |
| `_posts/` | Jekyll-format sources. The published corpus now lives in `src/content/blog/`, ported |
| `_drafts/` | **Unpublished drafts, still potentially wanted.** See below |
| `head-custom.html` | Dead GA snippet (`G-D4CQR7PB0Z`), commented out, never collected |
| `index.md`, `archive.html`, `404.html`, `about.md` | Jekyll pages, superseded by `src/pages/*.astro` |
| `Gemfile.cfg` | Ruby dependency config |
| `imgs/rss.svg` | Orphaned asset — unreferenced by `src/` or `public/` |

## `_drafts/` is not dead, just unportable

`attic/_drafts/` holds real unfinished posts, not retired config. They are here because they
are in Jekyll format and the Astro build cannot read them — leaving them at the repo root
implied they were live when they were not.

To publish one, port it to `src/content/blog/<year>/<month>/` and give it frontmatter
matching the schema in `src/content.config.ts`. Copying it across unchanged will fail the
build.

## Related

- `docs/analytics-plan.md` — the analytics restoration this move completes
- `docs/email-subscription.md` — the other thing the migration dropped; `_includes/subscribe.html`
  and the `_config.yml` keys are the prior art it refers to
