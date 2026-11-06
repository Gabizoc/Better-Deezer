# Vendored fonts

Both typefaces are under the SIL Open Font License 1.1 (see the `OFL-*.txt` files),
which allows bundling them with Better Deezer.

| Family | Files | Source |
| --- | --- | --- |
| Bricolage Grotesque (variable, wght 200–800) | `bricolage-grotesque-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/bricolage-grotesque@5.3.0` |
| Instrument Sans (variable, wght 400–700) | `instrument-sans-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/instrument-sans@5.3.0` |

`fonts.json` lists them with their unicode ranges. `scripts/build.mjs` copies them
into the extension (web accessible resources) and embeds them in base64 in the
single-file payload (desktop, userscript). `src/features/fonts.js` registers them
with the FontFace API, so no network request and no CSP font-src issue.
