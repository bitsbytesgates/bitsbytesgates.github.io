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

let files = 0, imgs = 0, sized = 0, eager = 0, anchors = 0
for (const file of walk(DIST)) {
  const src = readFileSync(file, 'utf8')
  let changed = false
  let first = true
  const out = src.replace(/<img\b([^>]*?)\s*\/?>/g, (tag, attrs) => {
    imgs++
    // The trailing slash of a self-closing <img ... /> has to come off before
    // anything is appended, or the output is `... height="351" / loading="lazy"`
    // -- an attribute literally named "/". Browsers tolerate it; validators and
    // downstream regexes do not.
    let a = attrs

    // An <img> with no usable src cannot be the LCP element, and marking one
    // eager/fetchpriority=high tells the browser to race for a resource that
    // does not exist. One post carries a bare `<img>` -- an authoring slip that
    // predates this migration and renders broken on the live site too -- and it
    // sits above that page's real first image, so it would have stolen the
    // priority hint. Leave such tags entirely alone.
    if (!/\bsrc="[^"]+"/.test(a)) return `<img${a}>`

    // The FIRST image on a page is almost always the Largest Contentful Paint
    // element, and lazy-loading the LCP image delays it rather than helping:
    // the browser will not even discover it until layout. So the first one is
    // eager and prioritised, and only the rest are deferred. Lighthouse flagged
    // exactly this ("LCP image was lazily loaded") when every image was lazy.
    if (!/\bloading=/.test(a)) {
      a += first ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"'
      if (first) eager++
    }
    if (!/\bdecoding=/.test(a)) a += first ? ' decoding="sync"' : ' decoding="async"'
    first = false
    if (!/\balt=/.test(a)) a += ' alt=""'

    const m = a.match(/\bsrc="([^"]+)"/)
    const d = m?.[1]?.startsWith('/') ? intrinsic(m[1]) : null
    const w = a.match(/\bwidth="(\d+)"/)?.[1]
    const h = a.match(/\bheight="(\d+)"/)?.[1]
    if (d?.w && d?.h) {
      // Blogger frequently set width alone. A width without a height still
      // reserves no vertical space, so the page reflows when the image lands --
      // the browser only honours the pair. Derive the partner from the file's
      // real aspect ratio rather than dropping the author's chosen size.
      if (!w && !h) { a += ` width="${d.w}" height="${d.h}"`; sized++ }
      else if (w && !h) { a += ` height="${Math.round((+w * d.h) / d.w)}"`; sized++ }
      else if (h && !w) { a += ` width="${Math.round((+h * d.w) / d.h)}"`; sized++ }
    }
    changed = true
    return `<img${a}>`
  })
  // Name the "click to enlarge" links.
  //
  // Blogger wrapped most images in a link to the full-size file, and gave the
  // image no alt text. An <a> whose only content is an alt="" image has no
  // accessible name at all: a screen reader announces "link" and nothing else,
  // which is a WCAG 2.4.4 failure and what Lighthouse's link-name audit flags.
  // The filename is the only description that actually exists, so use it --
  // uninformative beats unnamed, and inventing alt text would be worse than both.
  let named = 0
  const out2 = out.replace(
    /<a\b(?![^>]*\baria-label=)([^>]*?)href="(\/legacy-img\/[^"]+|\/imgs\/[^"]+)"([^>]*)>(\s*<img\b[^>]*>\s*)<\/a>/g,
    (m, pre, href, post, img) => {
      // Only anchors whose sole content is an image with no text alternative.
      if (/\balt="[^"]+"/.test(img)) return m
      const label = decodeURIComponent(href.split('/').pop())
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      named++
      return `<a${pre}href="${href}"${post} aria-label="View full-size image: ${label}">${img}</a>`
    }
  )
  if (out2 !== out) changed = true
  if (changed) { writeFileSync(file, out2); files++; anchors += named }
}
console.log(
  `images: ${imgs} tags across ${files} files; ${sized} given intrinsic dimensions; ${eager} LCP candidates loaded eagerly; ${anchors} enlarge-links given an accessible name`
)
