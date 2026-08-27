#!/usr/bin/env node
/**
 * Fail the build when two posts would claim the same URL.
 *
 * THE FAILURE THIS EXISTS TO CATCH
 * --------------------------------
 * Posts are filed under `src/content/blog/YYYY/MM/`, but the URL is the BASENAME alone —
 * `src/content.config.ts` overrides the glob loader's `generateId` to strip the directories.
 * That makes the filing free to change without touching a URL, at the cost of one constraint:
 * basenames must be unique across the WHOLE collection, not per-month.
 *
 * Astro does not enforce it. Measured, not assumed — two different posts named `collide-me.md`
 * in 2014/03 and 2026/08:
 *
 *     build exit 0, zero warnings, 166 pages instead of 167.
 *
 * The later glob entry wins, the earlier post is silently dropped from the site: no post page,
 * no archive row, no topic listing, no RSS item. Nothing in the build output says so, and the
 * CI page-count floor cannot see it — one post short of ~165 is still comfortably over 150.
 * The author's own preview looks correct, because the post they just wrote is the one that won.
 *
 * So the check has to live here, ahead of `astro build`, where it can still be loud.
 *
 * Also warns (does not fail) when a post's directory disagrees with its frontmatter `date`.
 * That is cosmetic — the directory is filing and never reaches a URL — but it is the one way
 * the YYYY/MM scheme rots, and it is invisible unless something says it out loud.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(root, 'src/content/blog')

function posts(dir = CONTENT) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...posts(join(dir, e.name)))
    else if (/\.mdx?$/.test(e.name)) out.push(join(dir, e.name))
  }
  return out
}

const all = posts()

// id must match generateId in src/content.config.ts, or this check guards the wrong thing.
const byId = new Map()
for (const p of all) {
  const id = p.replace(/^.*\//, '').replace(/\.mdx?$/, '')
  if (!byId.has(id)) byId.set(id, [])
  byId.get(id).push(relative(root, p))
}

const collisions = [...byId.entries()].filter(([, files]) => files.length > 1)

// Filing drift: the YYYY/MM the post sits in vs the YYYY-MM its frontmatter claims.
// Read the date textually — the 45 Blogger-era posts carry -08:00 offsets, and parsing
// those as UTC moves month-boundary posts into a month they were never published in.
const misfiled = []
for (const p of all) {
  const m = readFileSync(p, 'utf8').slice(0, 4000).match(/^date:\s*["']?(\d{4})-(\d{2})/m)
  if (!m) continue
  const dir = relative(CONTENT, p).split('/').slice(0, -1).join('/')
  if (dir && dir !== `${m[1]}/${m[2]}`) misfiled.push({ file: relative(root, p), dir, date: `${m[1]}/${m[2]}` })
}

for (const { file, dir, date } of misfiled) {
  console.warn(`warning: ${file} is filed under ${dir} but dated ${date} (filing only; the URL is unaffected)`)
}

if (collisions.length) {
  console.error('\nERROR: duplicate post slugs — these would silently collapse into one URL:\n')
  for (const [id, files] of collisions) {
    console.error(`  /blog/${id}/`)
    for (const f of files) console.error(`      ${f}`)
  }
  console.error('\nThe basename is the URL; the YYYY/MM directories are not part of it, so')
  console.error('filing two posts in different months does NOT make their slugs distinct.')
  console.error('Rename all but one — and if a renamed post was already published, add its')
  console.error('old URL to src/url-map.json so the existing links keep working.\n')
  process.exit(1)
}

console.log(`slugs ok: ${all.length} posts, ${byId.size} unique${misfiled.length ? `, ${misfiled.length} misfiled` : ''}`)
