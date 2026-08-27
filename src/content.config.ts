import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

/**
 * One collection for both corpora.
 *
 * The 36 modern posts use `categories`; the 45 Blogger-era posts use `tags` with a different
 * vocabulary. Rather than model that split in the type system, both are optional and the UI
 * merges them into a single "topics" facet — readers do not care which field a post used in 2016.
 */
const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
    /**
     * THE DIRECTORY IS FILING, NOT ROUTING.
     *
     * Posts are filed under `YYYY/MM/` so the directory stays navigable, but the id — and
     * therefore the URL, since `src/pages/blog/[...slug].astro` routes on `post.id` — is the
     * BASENAME ALONE. `2019/12/writing-a-task-based-cocotb-bfm.md` is served at
     * `/blog/writing-a-task-based-cocotb-bfm/`, exactly as it was when the file sat flat.
     *
     * Without this override the default generateId derives the id from the path, every one of
     * the 81 posts silently moves to `/blog/2019/12/…`, and `src/url-map.json` — the entire
     * nine-year redirect map — points at URLs that no longer exist. The build would stay green
     * while doing it: the page count is unchanged and the redirect count is unchanged, because
     * both still describe a site, just not this one.
     *
     * Consequence to keep in mind: basenames must be unique across ALL year/month directories,
     * not just within one. Two posts named `getting-started.md` in different months are an id
     * collision, and ASTRO DOES NOT REPORT IT — measured, not assumed: the build exits 0 with
     * zero warnings, the later glob entry wins, and the other post is dropped from the site
     * entirely. `scripts/check-slugs.mjs` runs in `prebuild` to make that loud.
     */
    generateId: ({ entry }) => entry.replace(/^.*\//, '').replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // Modern posts use YYYY-MM-DD; legacy posts carry a full ISO timestamp with offset.
    date: z.coerce.date(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    mermaid: z.boolean().default(false),
    toc: z.boolean().default(false),
    draft: z.boolean().default(false),

    // --- provenance -------------------------------------------------------
    legacy: z.boolean().default(false),
    author: z.string().optional(),
    modified_time: z.coerce.date().optional(),
    blogger_id: z.string().optional(),
    blogger_orig_url: z.string().url().optional(),

    // --- syndication (see linkedin-syndication-strategy.md) ---------------
    syndicate: z.enum(['full', 'derived', 'none']).default('none'),
  }),
})

export const collections = { blog }
