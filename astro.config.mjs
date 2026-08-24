// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { readFileSync } from 'node:fs'

// Shiki has had no filesystem access since v1.0 — read the grammar and spread it.
// NOTE: the spread MUST come first. The grammar's own `name` is "portable-stimulus",
// so spreading it last silently overrides `name: 'pss'` and ```pss fences stop resolving.
const pss = JSON.parse(readFileSync('./grammars/pss.tmLanguage.json', 'utf8'))

export default defineConfig({
  site: 'https://bitsbytesgates.com',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      langs: [{ ...pss, name: 'pss', scopeName: 'source.pss' }],
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
})
