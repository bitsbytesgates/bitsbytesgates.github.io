# Grammars

`pss.tmLanguage.json` is the **canonical** PSS TextMate grammar for both this site and the
`psstools/vscode-pss-support` VS Code extension.

Upstream: `psstools/vscode-pss-support` @ `syntaxes/pss.tmLanguage.json` (Forgejo).

It carries a patch over upstream commit `5187749` (2020) adding: the keywords `pure`, `target`,
`void`, `in`, `init`, `init_down`, `extend`, `ref`; hex / binary / sized numeric literals; and
entity-name captures on declarations. Without it, Shiki reproduces only 77.4% of the tokens the
old Rouge lexer highlighted. With it, 100%.

**Push this patch back upstream** — the extension has the same gaps.
