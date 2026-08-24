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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
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
