// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { pssLang } from './grammars/pss-lang.mjs'

export default defineConfig({
  site: 'https://bitsbytesgates.com',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      langs: [pssLang],
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
})
