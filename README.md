# Better Deezer

A cleaner, more modern Deezer, built as an open-source skin and quality-of-life layer. It runs as a browser extension and on the Windows desktop app.

> Unofficial project, not affiliated with Deezer. It changes only how Deezer looks and behaves on your own machine.

## What it changes

- A warm graphite theme with a single accent, plus light and dark modes (in progress)
- A floating, centered sidebar rail and a floating player bar
- Search centered in the top bar, opened with `Ctrl K`
- Volume control with the mouse wheel
- Restyled cards, track rows, menus and tooltips

## Install

### Windows desktop app (coming soon)

```powershell
irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex
```

This adds a **Better Deezer** shortcut that starts the official Deezer app with the skin applied. Deezer's own files are never modified, so Deezer updates keep working.

### Browser (Chrome, Edge, Brave, Opera)

1. Download `better-deezer-extension.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) page and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.
4. Reload deezer.com.

### Userscript

Install `better-deezer.user.js` with Violentmonkey or Tampermonkey.

## Build from source

```bash
npm run build
```

The build has no dependencies and needs Node 18 or newer. Output goes to `dist/`.

## If something breaks after a Deezer update

Open DevTools (F12) and run:

```js
__betterDeezer.health()          // which parts of Deezer were found
__betterDeezer.disable("volume") // turn off one feature
__betterDeezer.disable()         // turn off everything
```

Then open an issue with the output. Contributors can read [HANDOFF.md](HANDOFF.md) for the architecture.

## License

MIT
