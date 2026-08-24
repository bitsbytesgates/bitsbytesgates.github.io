#!/usr/bin/env node
/**
 * Fail the build if a Mermaid diagram was corrupted by the Markdown parser.
 *
 * THE FAILURE THIS EXISTS TO CATCH
 * --------------------------------
 * Diagrams live in raw `<div class="mermaid">` blocks carried over from the
 * Jekyll site. In CommonMark a BLANK LINE terminates an HTML block, so anything
 * after one inside the div is re-parsed as Markdown. The damage is quiet and
 * total:
 *
 *     write(Write)-->copy(Copy)        becomes    write(Write)–>copy(Copy)
 *
 * because smartypants reads `--` as an en dash. Mermaid then throws a lexical
 * error and renders a red "Syntax error in text" box instead of the diagram.
 *
 * It is invisible to every cheap check. The page is HTTP 200, the mermaid script
 * loads, the `.mermaid` div is present, and Mermaid even emits an <svg> -- an
 * <svg> containing an error message. Only parsing the diagram source catches it,
 * which is why this runs on every build rather than living in a checklist.
 *
 * Guards the output, not the input, so it also catches a future post that
 * reintroduces the blank line, or a Markdown-processor change that alters where
 * HTML blocks end.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const DIST = resolve('dist')

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (p.endsWith('.html')) yield p
  }
}

const problems = []
let blocks = 0, pages = 0

for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8')
  const found = [...html.matchAll(/<div class="mermaid"[^>]*>([\s\S]*?)<\/div>/g)]
  if (!found.length) continue
  pages++
  const rel = file.slice(DIST.length)
  for (const m of found) {
    blocks++
    const body = m[1]
    const why = []
    // Smart punctuation: only ever arrives via the Markdown typographer, and
    // every one of these is syntactically meaningful to Mermaid.
    if (/[–—]/.test(body)) why.push('smart dash (Mermaid arrows "-->" were rewritten)')
    if (/[“”‘’]/.test(body)) why.push('smart quotes')
    // Injected markup: proof the block was re-parsed as Markdown.
    const tags = [...new Set([...body.matchAll(/<(p|em|strong|a|code|ul|ol|li)\b/g)].map((t) => t[1]))]
    if (tags.length) why.push(`Markdown-injected <${tags.join('>, <')}>`)
    if (why.length) problems.push({ rel, why, snippet: body.trim().split('\n')[0].slice(0, 60) })
  }
}

if (problems.length) {
  console.error(`\nERROR: ${problems.length} of ${blocks} Mermaid diagrams were corrupted by the Markdown parser.\n`)
  for (const p of problems) {
    console.error(`  ${p.rel}`)
    console.error(`    ${p.snippet}...`)
    for (const w of p.why) console.error(`    - ${w}`)
  }
  console.error(
    '\nAlmost always a BLANK LINE inside the <div class="mermaid"> block: it ends the\n' +
      'HTML block, so the rest is parsed as Markdown. Remove the blank line.\n'
  )
  process.exit(1)
}

console.log(`mermaid: ${blocks} diagrams across ${pages} pages, none corrupted`)
