# Better Deezer

A cleaner, more modern Deezer, built as an open-source skin and quality-of-life layer. It runs as a browser extension and on the Windows desktop app.

> Unofficial project, not affiliated with Deezer. It changes only how Deezer looks and behaves on your own machine. No account, no analytics: the only requests it can make are for lyrics (lrclib.net) and the theme Marketplace (GitHub), see [Privacy](docs/privacy.md).

## What it changes

- **Themes, Spicetify style**: 6 built-in themes plus a **Marketplace** of community themes, light / dark / auto, install from a link or a file, and a **theme editor** with live preview and readability checks. A theme is one safe JSON file ([how to make one](docs/themes.md))
- **Modules** you switch on and off live ([list](docs/modules.md)):
  - **Now playing** (`F`): big cover and **synced lyrics** that scroll with the music, click a line to jump there
  - **Smooth transitions** between pages and covers
  - **Hide promotional banners**
  - **Sleep timer** with a volume fade
  - **Accent color from the cover**, **Compact mode**
- **Top bar**: the search is always centered on the window, with a round **Home** button on its left (`Ctrl K`)
- A **floating rail**, centered when collapsed, and a **floating player bar**: round play button, filled heart when liked, thin seek bar between the two times
- **Volume**: click the icon to unfold a slider, mouse wheel over it (5% steps, 1% with Shift), Alt+click or middle click to mute
- **Seek with the wheel** over the progress bar or the cover (5 s, 15 s with Shift)
- Restyled modals, menus, notifications (with Releases / Social filters), profile menu and toasts
- Album and artist pages with a header tinted by the cover, quieter track lists, popularity as a thin bar, a **Hide explicit tracks** filter
- **Home**: a greeting, sections you can hide, and an order you choose (*Familiar*, *Discovery*, by time of day)
- **Better Deezer settings** (`Ctrl ,` or from the profile menu): themes, modules, features on/off, wheel step, home, a local **Don't recommend** list, all shortcuts, health check, reset
- `Q` opens the queue. Deezer's own shortcuts still work (`Space`, `M`, `L`, `S`, arrows, `H` for the full list)

## Documentation

- [User guide](docs/guide.md): every feature and setting
- [Troubleshooting](docs/troubleshooting.md) ([en français](docs/fr/depannage.md)): error messages and fixes
- [Themes](docs/themes.md): make, test and publish a theme
- [Modules](docs/modules.md): what each module does, and how to write one
- [Privacy](docs/privacy.md): what stays on your machine (everything) and the only requests made

## Install

### Windows desktop app

In PowerShell:

```powershell
irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex
```

Or download `better-deezer-windows.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases), unzip it and run `install.ps1` (right click, *Run with PowerShell*).

This adds a **Better Deezer** shortcut (Start menu and desktop) that starts the official Deezer app with the skin applied. Deezer's own files are never modified, so Deezer updates keep working, and the original Deezer shortcut still starts plain Deezer. Uninstall from *Settings > Apps > Better Deezer*.

How it works: the launcher starts `Deezer.exe` with Chromium's `--remote-debugging-port` on a random port, which listens on `127.0.0.1` only, and injects the skin through the DevTools protocol while Deezer runs. Any program already running on your PC under your account could also connect to that port during that time (such a program could read your Deezer data anyway). Logs: `%LOCALAPPDATA%\BetterDeezer\launcher.log`.

### Browser (Chrome, Edge, Brave, Opera)

1. Download `better-deezer-extension.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) page and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.
4. Reload deezer.com.

### Userscript

Install `better-deezer.user.js` with Violentmonkey or Tampermonkey.

## Build and test from source

```bash
npm run build          # no dependency, Node 18+; output in dist/
npm test               # smoke test in Chromium (needs Playwright installed globally)
node test/cdp-inject.mjs   # replays the desktop launcher's DevTools sequence on Chromium
```

## If something breaks

Open *Better Deezer settings > About*: it lists the parts of Deezer that were not found, links to the help, and can turn Better Deezer off (`Ctrl ,` turns it back on). Every symptom and error message is explained in [Troubleshooting](docs/troubleshooting.md).

From DevTools (F12), the console API is `__betterDeezer`. With the extension, pick the **Better Deezer** context in the console's context dropdown first (extensions run in their own world):

```js
__betterDeezer.health()          // which parts of Deezer were found
__betterDeezer.features()        // every feature: on, off, failed
__betterDeezer.disable("volume") // turn off one feature
__betterDeezer.disable()         // turn off everything
```

Contributors: [HANDOFF.md](HANDOFF.md) explains the architecture and the rules for touching Deezer's page.

## Credits

Lyrics: [LRCLIB](https://lrclib.net), the open lyrics database. Inspired by [Spicetify](https://spicetify.app) for Spotify.

Fonts: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) and [Instrument Sans](https://github.com/Instrument/instrument-sans), SIL Open Font License 1.1 (bundled in `assets/fonts`).

## License

MIT
