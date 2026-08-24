#!/usr/bin/env node
/**
 * Add loading/decoding/dimensions to every <img> in the built HTML.
 *
 * Runs on the OUTPUT rather than as a rehype plugin, for two reasons:
 *   1. Astro 7's default Markdown processor doesn't take rehype plugins without
 *      reinstalling the legacy remark pipeline, which would change how all 81 posts
 *      render after they've already been verified.
 *   2. 114 of the 177 image references are raw <img> tags from the Blogger export using
 *      absolute /public paths. Astro's image pipeline only handles markdown ![](…) with
 *      relative paths, so it would skip two thirds of them regardless.
 *
 * Existing width/height are LEFT ALONE: they came from Blogger's downscaled renditions,
 * and since the sources were refetched at full resolution they now describe the intended
 * DISPLAY size against a higher-resolution file — i.e. a retina image.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const DIST = resolve('dist')
const cache = new Map()

function dimensions(file) {
  const b = readFileSync(file)
  if (b.length > 24 && b.toString('ascii', 1, 4) === 'PNG')
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF')
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue }
      const m = b[i + 1]
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m))
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return null
}

function intrinsic(src) {
  if (cache.has(src)) return cache.get(src)
  let out = null
  try {
    const f = join(DIST, decodeURIComponent(src.split('?')[0]).replace(/^\//, ''))
    if (existsSync(f)) out = dimensions(f)
  } catch {}
  cache.set(src, out)
  return out
}

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (p.endsWith('.html')) yield p
  }
}

let files = 0, imgs = 0, sized = 0
for (const file of walk(DIST)) {
  const src = readFileSync(file, 'utf8')
  let changed = false
  const out = src.replace(/<img\b([^>]*)>/g, (tag, attrs) => {
    imgs++
    let a = attrs
    if (!/\bloading=/.test(a)) a += ' loading="lazy"'
    if (!/\bdecoding=/.test(a)) a += ' decoding="async"'
    if (!/\balt=/.test(a)) a += ' alt=""'
    if (!/\bwidth=/.test(a) && !/\bheight=/.test(a)) {
      const m = a.match(/\bsrc="([^"]+)"/)
      if (m?.[1]?.startsWith('/')) {
        const d = intrinsic(m[1])
        if (d?.w && d?.h) { a += ` width="${d.w}" height="${d.h}"`; sized++ }
      }
    }
    changed = true
    return `<img${a}>`
  })
  if (changed) { writeFileSync(file, out); files++ }
}
console.log(`images: ${imgs} tags across ${files} files; ${sized} given intrinsic dimensions`)
