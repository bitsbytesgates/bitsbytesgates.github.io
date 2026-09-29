import grammar from './pss.tmLanguage.json' with { type: 'json' }

// Shared by astro.config.mjs (```pss fences) and the /code_html/ viewer pages.
// NOTE: the spread MUST come first. The grammar's own `name` is "portable-stimulus",
// so spreading it last silently overrides `name: 'pss'` and ```pss fences stop resolving.
export const pssLang = { ...grammar, name: 'pss', scopeName: 'source.pss' }
