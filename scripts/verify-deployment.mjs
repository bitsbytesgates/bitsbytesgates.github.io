// Verify a live deployment: run it against a preview URL before a release, and
// against production after one.
//
//   node scripts/verify-deployment.mjs https://astro-preview.bitsbytesgates.pages.dev
//
// Exits non-zero on any failure, so it can gate a cutover. Written for the Astro
// migration's §8 checklist; the redirect and feed-identity checks are the ones
// that matter most -- they are what keep nine years of inbound links and every
// existing RSS subscriber intact.
import { readFileSync } from 'node:fs'

const BASE = process.argv[2]
const REPO = new URL('..', import.meta.url).pathname
const map = JSON.parse(readFileSync(`${REPO}/src/url-map.json`, 'utf8'))

let pass = 0, fail = 0
const ok = (c, msg) => { c ? pass++ : fail++; console.log(`${c ? '  ok  ' : 'FAIL  '}${msg}`) }

const LIMIT = 12
async function pool(items, fn) {
  const out = new Array(items.length); let i = 0
  await Promise.all(Array.from({ length: LIMIT }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k) }
  }))
  return out
}

console.log(`\n=== §8 verification against ${BASE} ===\n`)

// ---- 1. old URLs, both forms, single-hop 301 -------------------------------
console.log('[1] old URL redirects (both forms, single hop)')
const oldUrls = Object.keys(map)
const pairs = oldUrls.flatMap(u => [u, u.replace(/\.html$/, '')])
const redirBad = []
await pool(pairs, async (u) => {
  const r = await fetch(BASE + u, { redirect: 'manual' })
  const loc = r.headers.get('location')
  if (r.status !== 301) return redirBad.push(`${u} -> HTTP ${r.status}`)
  const want = map[u.endsWith('.html') ? u : u + '.html']
  if (!loc || new URL(loc, BASE).pathname !== want) return redirBad.push(`${u} -> ${loc} (want ${want})`)
  const r2 = await fetch(new URL(loc, BASE), { redirect: 'manual' })
  if (r2.status !== 200) redirBad.push(`${u} -> ${loc} -> HTTP ${r2.status} (second hop)`)
})
ok(redirBad.length === 0, `${pairs.length - redirBad.length}/${pairs.length} old URLs single-hop 301 to a 200`)
redirBad.slice(0, 10).forEach(b => console.log('        ' + b))

// ---- 2. feed ---------------------------------------------------------------
console.log('\n[2] feed')
const feed = await fetch(BASE + '/feed.xml')
ok(feed.status === 200, `/feed.xml HTTP ${feed.status}`)
const xml = await feed.text()
ok(/^<\?xml/.test(xml), 'feed is well-formed XML declaration')
ok((feed.headers.get('content-type') || '').includes('atom'), `content-type ${feed.headers.get('content-type')}`)
const ids = [...xml.matchAll(/<id>([^<]+)<\/id>/g)].map(m => m[1]).slice(1)
ok(ids.length === 10, `${ids.length} entries (jekyll-feed shipped 10)`)
const oldSet = new Set(oldUrls.map(u => 'https://bitsbytesgates.com' + u.replace(/\.html$/, '')))
const stable = ids.filter(i => oldSet.has(i)).length
ok(stable === ids.length, `${stable}/${ids.length} entry <id>s are the pre-migration URLs (subscribers not re-notified)`)

// ---- 3. sitemap ------------------------------------------------------------
console.log('\n[3] sitemap')
for (const p of ['/sitemap-index.xml', '/sitemap-0.xml']) {
  const r = await fetch(BASE + p); ok(r.status === 200, `${p} HTTP ${r.status}`)
}
const sm = await (await fetch(BASE + '/sitemap-0.xml')).text()
ok(!sm.includes(','), 'no comma in any sitemap URL')

// ---- 4-6. every post page --------------------------------------------------
console.log('\n[4-6] post pages')
const slugs = [...new Set(Object.values(map))]
const bad = { status: [], struct: [], h1: [], comma: [], og: [], footer: [] }
let shiki = 0, pssBlocks = 0, mermaidPosts = 0
const htmls = await pool(slugs, async (s) => {
  const r = await fetch(BASE + s)
  if (r.status !== 200) { bad.status.push(`${s} HTTP ${r.status}`); return null }
  const h = await r.text()
  const count = (re) => (h.match(re) || []).length
  if (count(/<html[\s>]/g) !== 1 || count(/<head[\s>]/g) !== 1 || count(/<body[\s>]/g) !== 1 || count(/<title[\s>]/g) !== 1)
    bad.struct.push(s)
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
  if (h1s.length !== 1 || !h1s[0]) bad.h1.push(`${s} (${h1s.length} h1)`)
  if (s.includes(',')) bad.comma.push(s)
  for (const p of ['og:title', 'og:description', 'og:image', 'twitter:card'])
    if (!h.includes(p)) bad.og.push(`${s} missing ${p}`)
  if (!/views and opinions expressed/i.test(h)) bad.footer.push(`${s} no disclaimer`)
  shiki += count(/class="astro-code/g)
  pssBlocks += count(/data-language="pss"/g)
  if (/mermaid/i.test(h)) mermaidPosts++
  return h
})
ok(bad.status.length === 0, `${slugs.length - bad.status.length}/${slugs.length} post pages HTTP 200`)
bad.status.slice(0, 5).forEach(b => console.log('        ' + b))
ok(bad.struct.length === 0, `${slugs.length - bad.struct.length}/${slugs.length} have exactly one <html>/<head>/<body>/<title>`)
ok(bad.h1.length === 0, `${slugs.length - bad.h1.length}/${slugs.length} have exactly one non-empty <h1>`)
bad.h1.slice(0, 5).forEach(b => console.log('        ' + b))
ok(bad.comma.length === 0, 'no new URL contains a comma')
ok(bad.og.length === 0, `${slugs.length - bad.og.length}/${slugs.length} carry og:title/description/image + twitter:card`)
bad.og.slice(0, 5).forEach(b => console.log('        ' + b))
ok(bad.footer.length === 0, `${slugs.length - bad.footer.length}/${slugs.length} carry the "views are mine" disclaimer`)
ok(shiki >= 140, `${shiki} highlighted code blocks (expected >= 140)`)
ok(pssBlocks >= 55, `${pssBlocks} PSS blocks highlighted (expected >= 55)`)
console.log(`  info  ${mermaidPosts} post pages reference mermaid`)

// ---- 7. homepage & pagination ---------------------------------------------
console.log('\n[7] homepage, pagination, standalone pages')
for (const p of ['/', '/about/', '/archive/', '/series/', '/topics/', '/search/', '/404.html']) {
  const r = await fetch(BASE + p); ok(r.status === 200, `${p} HTTP ${r.status}`)
}
const home = await (await fetch(BASE + '/')).text()
ok((home.match(/href="\/blog\//g) || []).length >= 5, `homepage links ${(home.match(/href="\/blog\//g) || []).length} posts`)
ok(home.includes('href="/2/"'), 'homepage paginates (single-hop link to /2/)')
for (const p of ['/2/','/3/','/9/']) { const r = await fetch(BASE+p); ok(r.status===200, `${p} HTTP ${r.status}`) }
ok((await fetch(BASE+'/10/')).status===404, '/10/ does not exist (9 pages of 10 for 81 posts)')

// ---- 8. dark mode + assets -------------------------------------------------
console.log('\n[8] theme, search, assets')
ok(home.includes('data-theme') || home.includes('prefers-color-scheme'), 'no-FOUC theme script present')
const css = home.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1]
const cssBody = css ? await (await fetch(BASE + css)).text() : ''
ok(/prefers-color-scheme:\s*dark/.test(cssBody), 'dark theme in the stylesheet')
ok(/--shiki-dark/.test(cssBody), 'code blocks swap to the dark Shiki palette')
for (const p of ['/pagefind/pagefind.js', '/pagefind/pagefind-ui.js', '/feed.xml', '/robots.txt']) {
  const r = await fetch(BASE + p); ok(r.status === 200, `${p} HTTP ${r.status}`)
}

// ---- 9. post count ---------------------------------------------------------
console.log('\n[9] corpus')
const archive = await (await fetch(BASE + '/archive/')).text()
const archLinks = new Set([...archive.matchAll(/href="(\/blog\/[^"]+)"/g)].map(m => m[1]))
ok(archLinks.size === 81, `archive lists ${archLinks.size} posts (expected 81)`)

console.log(`\n=== ${pass} passed, ${fail} failed ===`)
process.exit(fail ? 1 : 0)
