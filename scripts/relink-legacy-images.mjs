#!/usr/bin/env node
/**
 * Point Blogger "click to enlarge" links at the repatriated local images.
 *
 * The Blogger export wraps most images in a link to the full-size original on
 * *.bp.blogspot.com:
 *
 *     [![](/legacy-img/splash-9.png)](https://1.bp.blogspot.com/-WV71.../s540/splash.png)
 *
 * Phase 1 repatriated the IMAGES but not these LINK TARGETS, so the pages render
 * from local files while every click still leaves for a CDN that can vanish --
 * precisely the dependency the repatriation existed to remove. Lighthouse found
 * it from the other end: an <a> whose only child is an alt="" image has no
 * accessible name, so the whole set failed the link-name audit.
 *
 * Rewrites the target to the local file, preferring the mapping the fetcher
 * recorded (the CDN URL in the link is often a DIFFERENT size variant of the
 * same picture, so it has its own map entry) and falling back to whatever the
 * wrapped <img> already points at.
 *
 * Idempotent: a link already pointing at /legacy-img/ is left alone.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(root, 'src/content/blog')
const MAP = '/home/mballance/projects/bbg_migration/legacy-images/image-map.json'

const byUrl = existsSync(MAP) ? JSON.parse(readFileSync(MAP, 'utf8')).map : {}
const CDN = /^https?:\/\/(?:[0-9a-z]+\.bp\.blogspot\.com|(?:lh[0-9]|blogger)\.googleusercontent\.com)\//

// The CDN path embeds a size segment (/s540/, /w640-h122/) that differs between
// the <img> and its enlarge-link even when both are the same picture. Matching on
// the stable part -- the opaque id plus the filename -- catches those.
const keyOf = (u) => {
  const m = u.match(/\/([-\w]{20,})\/[^/]*\/([^/?#]+)$/)
  return m ? `${m[1]}/${m[2].toLowerCase()}` : null
}
const byKey = new Map()
for (const [u, f] of Object.entries(byUrl)) {
  const k = keyOf(u)
  if (k && !byKey.has(k)) byKey.set(k, f)
}

const localFor = (cdnUrl, fallback) => {
  const direct = byUrl[cdnUrl]
  if (direct) return `/legacy-img/${direct}`
  const k = keyOf(cdnUrl)
  if (k && byKey.has(k)) return `/legacy-img/${byKey.get(k)}`
  return fallback
}

// Blogger post URL -> the slug we host it at now, read from the frontmatter the
// conversion recorded. Legacy posts cross-reference each other by their old
// blogspot.com address; left alone, every one of those is a reader sent off to
// the retired blog to read something this site already serves.
const slugByOrig = new Map()

// Posts are filed under YYYY/MM/, so this has to recurse. It used to be a flat
// readdirSync, which after the re-filing matched nothing and made the whole script
// a silent no-op -- it still exits 0 and still reports "0 links rewritten".
// The SLUG is the basename alone, matching the generateId override in
// src/content.config.ts; the directories are filing and never appear in a URL.
function posts(dir = CONTENT) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...posts(join(dir, e.name)))
    else if (e.name.endsWith('.md')) out.push({ name: e.name, path: join(dir, e.name) })
  }
  return out
}
const ALL = posts()

for (const { name, path } of ALL) {
  const head = readFileSync(path, 'utf8').slice(0, 4000)
  const m = head.match(/^blogger_orig_url:\s*["']?(\S+?)["']?\s*$/m)
  if (m) slugByOrig.set(m[1].replace(/^http:/, 'https:'), `/blog/${name.replace(/\.md$/, '')}/`)
}

let files = 0, links = 0, unmapped = 0, selfLinks = 0, selfMiss = 0
for (const { path: p } of ALL) {
  const src = readFileSync(p, 'utf8')
  let out = src

  // markdown:  [![alt](inner)](cdn)
  out = out.replace(/\[(!\[[^\]]*\]\(([^)\s]+)[^)]*\))\]\((https?:\/\/[^)\s]+)\)/g, (m, img, inner, href) => {
    if (!CDN.test(href)) return m
    const local = localFor(href, inner.startsWith('/') ? inner : null)
    if (!local) { unmapped++; return m }
    links++
    return `[${img}](${local})`
  })

  // markdown link wrapping a RAW <img> tag:  [<img src="inner" ... />](cdn)
  // Blogger emitted this shape wherever it set an explicit display width, which
  // is most of the corpus -- 63 of the 101 enlarge-links.
  out = out.replace(/\[(<img\b[^>]*src="([^"]+)"[^>]*>)\]\((https?:\/\/[^)\s]+)\)/g, (m, img, inner, href) => {
    if (!CDN.test(href)) return m
    const local = localFor(href, inner.startsWith('/') ? inner : null)
    if (!local) { unmapped++; return m }
    links++
    return `[${img}](${local})`
  })

  // Cross-references to the author's own posts on the retired Blogger site.
  //
  // BODY ONLY. `blogger_orig_url` in the frontmatter is a provenance record of
  // where the post came from -- rewriting it to a local path would erase the one
  // thing that says this post was ever on Blogger, and would break this script's
  // own lookup table on the next run.
  const fm = out.match(/^---\n[\s\S]*?\n---\n/)
  const head = fm ? fm[0] : ''
  let body = out.slice(head.length)
  body = body.replace(/https?:\/\/bitsbytesgates\.blogspot\.com\/[^\s)"'<>]*/g, (u) => {
    const trail = u.match(/[.,;:]+$/)?.[0] ?? ''
    const bare = u.slice(0, u.length - trail.length)
    const slug = slugByOrig.get(bare.replace(/^http:/, 'https:'))
    if (!slug) { selfMiss++; return u }
    selfLinks++
    return slug + trail
  })
  out = head + body

  // raw html:  <a href="cdn"> ... <img src="inner">
  out = out.replace(/<a\b([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>(\s*<img\b[^>]*src="([^"]+)"[^>]*>)/g,
    (m, pre, href, post, imgTag, inner) => {
      if (!CDN.test(href)) return m
      const local = localFor(href, inner.startsWith('/') ? inner : null)
      if (!local) { unmapped++; return m }
      links++
      return `<a${pre}href="${local}"${post}>${imgTag}`
    })

  if (out !== src) { writeFileSync(p, out); files++ }
}
console.log(
  `relinked ${links} enlarge-links and ${selfLinks} blogspot.com cross-references across ${files} posts;` +
    ` ${unmapped} images left on the CDN (no local copy), ${selfMiss} self-links unresolved`
)
