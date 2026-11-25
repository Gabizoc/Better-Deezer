# Contributing to Better Deezer

Thanks for your interest! Issues and pull requests are welcome in English or French.

- [Report a bug](#report-a-bug)
- [Suggest a feature](#suggest-a-feature)
- [Share a theme](#share-a-theme)
- [Translate](#translate)
- [Contribute code](#contribute-code)
- [Pull requests](#pull-requests)

## Report a bug

Open an [issue](https://github.com/Gabizoc/Better-Deezer/issues/new/choose) and include:

- your Better Deezer version (*Settings › About*, or `better-deezer version`) and where you use it: Windows app, Chrome extension or userscript;
- your Deezer, browser or Windows version;
- what *Settings › About* says about Deezer elements it cannot find, or the output of `__betterDeezer.health()` in the console (`F12`);
- for the Windows app, the end of the log: `better-deezer logs`;
- a screenshot if something looks wrong.

> [!CAUTION]
> **Never paste cookies, tokens or your `arl` value.** Nobody needs them to debug Better Deezer. Security issues do not go in a public issue: see [SECURITY.md](SECURITY.md).

After a Deezer update, most breakages come from a page element that changed its name. A report with the `health()` output is usually enough to fix it.

## Suggest a feature

Open an issue that describes the problem first, then the change you have in mind. Better Deezer stays a skin and comfort layer: no downloads, no ad blocking, nothing that touches your account or Deezer's servers.

## Share a theme

A theme is a single JSON file, no code. [docs/themes.md](docs/themes.md) (French) explains every field.

1. Create it with the editor (*Settings › Themes › Create*) and export it.
2. Add it to `themes/community/`.
3. Run `npm run build`. It validates the theme, checks readability and regenerates `themes/index.json`.
4. Open a pull request with a screenshot in dark and/or light mode.

## Translate

Better Deezer speaks English, French, Spanish, German, Italian, Portuguese and Dutch.

- **Interface:** `src/i18n/<code>.json` maps each English sentence to its translation. Keep `{placeholders}` as they are. A missing sentence falls back to English, so partial translations are fine.
- **New language:** add `src/i18n/<code>.json` with a `_name` entry (the language's own name, e.g. `"Deutsch"`). The language picker lists it automatically.
- **Chrome Web Store:** the extension name and summary live in `extension/_locales/<locale>/messages.json` (name ≤ 75 characters, summary ≤ 132; the build checks both). The full description lives in `store/listing/<locale>.txt`.

Fixing an awkward phrase is a perfectly good first pull request.

## Contribute code

Requirements: Node 18 or later. The build has no dependencies.

```bash
npm run build              # output in dist/
npm test                   # smoke test in Chromium (Playwright installed globally)
npm run check              # build + syntax check + smoke test
node test/cdp-inject.mjs   # inject the build into the real deezer.com through DevTools
```

To try the extension: `chrome://extensions` › Developer mode › *Load unpacked* › `dist/extension`.

### Layout

| Path | Contents |
|---|---|
| `src/core/` | The `BD` object, Deezer anchors, theme engine |
| `src/features/` | One file per feature (settings, now playing, fonts, sidebar…) |
| `src/styles/` | CSS, split by area, built on `--bd-*` tokens |
| `src/i18n/` | Translations (English is in the code) |
| `themes/` | Built-in and community themes |
| `assets/fonts/` | Bundled typefaces (SIL OFL) |
| `extension/` | Chrome manifest and `_locales` |
| `desktop/` | Windows install, patch, update and CLI scripts |
| `store/` | Chrome Web Store listing |

[docs/modules.md](docs/modules.md) (French) describes how a feature is written.

### Rules that keep Better Deezer from breaking

- CSS never targets Deezer's generated classes (`css-xxxx`).
- Only `src/core/10-anchors.js` knows how to find Deezer elements.
- Never move a node that React manages.
- Every new color is a token, in dark and light.
- User-facing text goes through `BD.t("Français", "English")`, with `{name}` for values.
- Nothing loads from the network unless it is documented in [docs/privacy.md](docs/privacy.md). Fonts and assets are bundled.
- Motion respects `prefers-reduced-motion`.

### Windows scripts

`desktop/*.ps1` must run on Windows PowerShell 5.1, with no external modules. `install.ps1` stays pure ASCII; the others are UTF-8 with BOM. CI checks both, along with PSScriptAnalyzer.

## Pull requests

- One topic per pull request.
- Commit messages in English, imperative mood ("Add…", "Fix…").
- `npm run check` passes.
- A before/after screenshot for any visual change.
- Docs updated (`docs/`) and a line in `CHANGELOG.md` under *Non publié*.

Maintainers handle versions and releases: pushing a `v*` tag builds and publishes them.

## License

By contributing, you agree that your work is released under the project's [MIT license](LICENSE).
