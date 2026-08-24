import type { CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'blog'>

/**
 * The two corpora use different fields — modern posts have `categories`, the 45 Blogger-era
 * posts have `tags` — and four names appear in both vocabularies (EDA, Python, EDAPack, UCIS).
 * Readers do not care which field a post used in 2016, so everything is merged into one
 * "topics" facet, deduped case-insensitively.
 */
export function topicsOf(post: Post): string[] {
  const seen = new Map<string, string>()
  for (const t of [...post.data.categories, ...post.data.tags]) {
    const key = t.trim().toLowerCase()
    if (key && !seen.has(key)) seen.set(key, t.trim())
  }
  return [...seen.values()]
}

export function topicSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Every topic across the corpus, with post counts, most-used first. */
export function topicIndex(posts: Post[]) {
  const byslug = new Map<string, { name: string; slug: string; posts: Post[] }>()
  for (const p of posts) {
    for (const t of topicsOf(p)) {
      const slug = topicSlug(t)
      if (!slug) continue
      if (!byslug.has(slug)) byslug.set(slug, { name: t, slug, posts: [] })
      byslug.get(slug)!.posts.push(p)
    }
  }
  return [...byslug.values()].sort(
    (a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name),
  )
}

export const byDateDesc = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf()

/** Series members in reading order: explicit seriesOrder if set, otherwise chronological. */
export function seriesPosts(posts: Post[], series: string): Post[] {
  return posts
    .filter((p) => p.data.series === series)
    .sort((a, b) => {
      const ao = a.data.seriesOrder, bo = b.data.seriesOrder
      if (ao != null && bo != null) return ao - bo
      return a.data.date.valueOf() - b.data.date.valueOf()
    })
}

/**
 * Related posts by shared-topic overlap, falling back to recency.
 * `site.related_posts` without LSI is just "10 most recent", which is why the Jekyll
 * template had it commented out.
 */
export function relatedTo(post: Post, all: Post[], limit = 4): Post[] {
  const mine = new Set(topicsOf(post).map(topicSlug))
  const scored = all
    .filter((p) => p.id !== post.id)
    .map((p) => {
      const overlap = topicsOf(p).map(topicSlug).filter((t) => mine.has(t)).length
      return { p, overlap }
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || byDateDesc(a.p, b.p))
  const out = scored.slice(0, limit).map((x) => x.p)
  if (out.length < limit) {
    for (const p of [...all].sort(byDateDesc)) {
      if (out.length >= limit) break
      if (p.id !== post.id && !out.includes(p)) out.push(p)
    }
  }
  return out
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/** ~200 wpm, excluding fenced code — code is scanned, not read. */
export function readingTime(body: string | undefined): number {
  if (!body) return 1
  const prose = body.replace(/```[\s\S]*?```/g, '')
  return Math.max(1, Math.round(prose.split(/\s+/).length / 200))
}
