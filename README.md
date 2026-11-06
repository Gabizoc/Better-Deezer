# Better Deezer

A cleaner, more modern Deezer, built as an open-source skin and quality-of-life layer. It runs as a browser extension and on the Windows desktop app.

> Unofficial project, not affiliated with Deezer. It changes only how Deezer looks and behaves on your own machine. Nothing is sent anywhere.

## What it changes

- **Light and dark themes** (warm graphite, one violet accent), or **Auto** to follow your system
- A **floating rail**, centered when collapsed, and a **floating player bar**: round violet play button, filled heart when liked, thin violet seek bar between the two times
- **Volume**: click the icon to unfold a slider, mouse wheel over the icon or the slider (5% steps, 1% with Shift), Alt+click or middle click to mute
- **Seek with the wheel** over the progress bar or the cover (5 s, 15 s with Shift)
- Search centered in the top bar (`Ctrl K`), results aligned under it with a shortcuts footer
- Restyled modals, menus, notifications (with Releases / Social filters), profile menu and toasts
- Album and artist pages with a header tinted by the cover, quieter track lists, popularity as a thin bar, a **Hide explicit tracks** filter
- Home: a greeting and **sections you can hide**
- **Better Deezer settings** (`Ctrl ,` or from the profile menu): theme, features on/off, wheel step, home sections, a local **Don't recommend** list, all shortcuts
- `Q` opens the queue. Deezer's own shortcuts still work (`Space`, `M`, `L`, `S`, arrows, `H` for the full list)

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

## If something breaks after a Deezer update

Open *Better Deezer settings > About*: it lists the parts of Deezer that were not found. You can turn features off one by one there, or turn Better Deezer off entirely (press `Ctrl ,` to turn it back on).

From DevTools (F12), the console API is `__betterDeezer`. With the extension, pick the **Better Deezer** context in the console's context dropdown first (extensions run in their own world):

```js
__betterDeezer.health()          // which parts of Deezer were found
__betterDeezer.disable("volume") // turn off one feature
__betterDeezer.disable()         // turn off everything
```

Then open an issue with the output. Contributors can read [HANDOFF.md](HANDOFF.md) for the architecture.

## Credits

Fonts: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) and [Instrument Sans](https://github.com/Instrument/instrument-sans), SIL Open Font License 1.1 (bundled in `assets/fonts`).

## License

MIT
