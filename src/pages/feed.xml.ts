import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { byDateDesc } from '../lib/topics'
import urlMap from '../url-map.json'

/**
 * Atom feed at /feed.xml — the URL, the format, and the entry <id> values all match what
 * jekyll-feed emitted.
 *
 * The <id> is the load-bearing part. Feed readers key "have I shown this to the user?" on it,
 * so emitting new-style ids would re-notify every subscriber with the entire back catalogue.
 * We therefore keep the OLD extensionless URL as the identity of each entry, while <link>
 * points at the new location. Identity and address are allowed to differ; that is the whole
 * reason Atom separates them.
 */
const SITE = 'https://bitsbytesgates.com'
const TITLE = 'Bits, Bytes, and Gates'
const SUBTITLE =
  "There's oh so much fun to be had. At the leading edge, at the bleeding edge, at the confluence of bits, bytes, and gates."
const AUTHOR = 'Matthew Ballance'

const md = new MarkdownIt({ html: true, linkify: true })

// new slug -> old extensionless URL, inverted from the Phase 1 conversion map
const oldUrlBySlug = new Map<string, string>()
for (const [oldUrl, newUrl] of Object.entries(urlMap as Record<string, string>)) {
  const slug = newUrl.replace(/^\/blog\//, '').replace(/\/$/, '')
  oldUrlBySlug.set(slug, oldUrl.replace(/\.html$/, ''))
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const GET: APIRoute = async () => {
  // jekyll-feed shipped 10 entries. Emitting all 81 would push the entire back catalogue
  // at existing subscribers as unread — the same re-notification problem the stable <id>
  // values above exist to avoid.
  const LIMIT = 10
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort(byDateDesc)
    .slice(0, LIMIT)

  const entries = posts.map((p) => {
    const link = `${SITE}/blog/${p.id}/`
    // Identity stays on the old address so existing subscribers are not re-notified.
    const id = oldUrlBySlug.has(p.id) ? `${SITE}${oldUrlBySlug.get(p.id)}` : link
    const body = (p.body ?? '').replace('<!--more-->', '')
    const html = sanitizeHtml(md.render(body), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
      // relative asset paths must survive as absolute URLs in a feed reader
      transformTags: {
        img: (_tag, attrs) => ({
          tagName: 'img',
          attribs: { ...attrs, src: attrs.src?.startsWith('/') ? SITE + attrs.src : attrs.src },
        }),
        a: (_tag, attrs) => ({
          tagName: 'a',
          attribs: { ...attrs, href: attrs.href?.startsWith('/') ? SITE + attrs.href : attrs.href },
        }),
      },
    })
    const updated = (p.data.modified_time ?? p.data.date).toISOString()
    return `<entry><title type="html">${esc(p.data.title)}</title><link href="${link}" rel="alternate" type="text/html" title="${esc(p.data.title)}" /><published>${p.data.date.toISOString()}</published><updated>${updated}</updated><id>${id}</id><author><name>${esc(p.data.author ?? AUTHOR)}</name></author>${[...p.data.categories, ...p.data.tags].map((c) => `<category term="${esc(c)}" />`).join('')}<content type="html" xml:base="${link}"><![CDATA[${html}]]></content></entry>`
  })

  const updated = posts[0]?.data.date.toISOString() ?? new Date().toISOString()
  const xml = `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><generator uri="https://astro.build/">Astro</generator><link href="${SITE}/feed.xml" rel="self" type="application/atom+xml" /><link href="${SITE}/" rel="alternate" type="text/html" /><updated>${updated}</updated><id>${SITE}/feed.xml</id><title type="html">${esc(TITLE)}</title><subtitle>${esc(SUBTITLE)}</subtitle><author><name>${AUTHOR}</name></author>${entries.join('')}</feed>`

  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } })
}
