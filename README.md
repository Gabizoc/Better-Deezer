# Better Deezer

**A cleaner, more modern Deezer.** Themes, a Marketplace, synced lyrics, a floating player and dozens of small fixes, for the Windows desktop app and the web player. Think Spicetify, for Deezer.

[Install](#install) · [What it changes](#what-it-changes) · [The `better-deezer` command](#the-better-deezer-command) · [Docs](#documentation) · [En français](README.fr.md)

> Unofficial project, not affiliated with Deezer. It only changes how Deezer looks and behaves on your own machine. No account, no analytics, no server: see [Privacy](docs/privacy.md).

## Install

### Windows desktop app

Open **PowerShell** (not cmd) and paste:

```powershell
irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex
```

That's it: open Deezer as usual, from its own shortcut. Better Deezer patches the Deezer app itself, so there is no second app, no admin rights needed, and Deezer's updates are handled for you.

No PowerShell one-liner? Download `better-deezer-windows.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases), unzip it, right click `install.ps1` > *Run with PowerShell*.

### Browser (Chrome, Edge, Brave, Opera)

1. Download `better-deezer-extension.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. **Load unpacked** > pick the unzipped folder, then reload deezer.com.

### Userscript

Install `better-deezer.user.js` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) with Violentmonkey or Tampermonkey. Use the extension **or** the userscript, not both.

## What it changes

**Themes, Spicetify style**
- 6 built-in themes, light / dark / auto
- A **Marketplace** of community themes, install from a link or a file
- A **theme editor** with live preview and readability checks. A theme is one safe JSON file: [make your own](docs/themes.md)

**Modules** you switch on and off, live ([list](docs/modules.md))
- **Now playing** (`F`): big cover and **synced lyrics**, word by word when Deezer has them; click a line to jump there
- **Smooth transitions**, **Hide promotional banners**, **Sleep timer** with a volume fade
- **Accent color from the cover**, **Compact mode**

**A new layout**
- Search always centered in the top bar, with a round **Home** button (`Ctrl K`)
- A **floating rail**, centered on screen, and a **floating player bar**: round play button, filled heart when liked, thin seek bar
- Album and artist headers tinted by the cover, quieter track lists, a **Hide explicit** filter
- Restyled modals, menus, notifications, profile menu and toasts

**Quality of life**
- **Volume**: click to unfold a slider, mouse wheel over it (5 % steps, 1 % with Shift), middle click to mute
- **Seek with the wheel** over the player bar's cover (5 s)
- **Home**: a greeting, sections you can hide, an order you choose (*Familiar*, *Discovery*, by time of day), a local **Don't recommend** list
- **Sidebar**: show, hide and reorder Deezer's own entries
- `Q` opens the queue; Deezer's own shortcuts keep working (`Space`, `M`, `L`, arrows, `H` for the list)

Everything is in **Better Deezer settings**: `Ctrl ,`, or from the profile menu. The [user guide](docs/guide.md) covers every option.

## The `better-deezer` command

The Windows install adds a command, like `spicetify`. Open a **new** terminal after installing:

| Command | What it does |
| --- | --- |
| `better-deezer status` | Installed version, Deezer version, whether Deezer is patched, whether an update is out |
| `better-deezer update` | Installs the latest release after checking its SHA-256 sums (`-f`: reinstall the same version) |
| `better-deezer apply` | Patches Deezer again, e.g. right after a Deezer update |
| `better-deezer restore` | Puts Deezer back as it was, keeps Better Deezer installed (`apply` brings it back) |
| `better-deezer restart` | Restarts Deezer |
| `better-deezer logs` | Last lines of the log |
| `better-deezer uninstall` | Removes Better Deezer and restores Deezer (`-y`: no question) |
| `better-deezer version` | Prints the installed version |

### Uninstall

`better-deezer uninstall`, or *Windows Settings > Apps > Better Deezer > Uninstall*. Deezer is put back exactly as it was. In the browser, remove the extension.

<details>
<summary><b>How the desktop patch works</b></summary>

Deezer's desktop app is Electron showing deezer.com. `patch.ps1` appends a few lines to `build/main.js` inside Deezer's `resources\app.asar`, and keeps the original as `app.asar.bd-backup`. On each deezer.com page load, those lines read `%LOCALAPPDATA%\BetterDeezer\better-deezer.user.js` and run it in the page. If the file is gone, Deezer runs unchanged. The hook opens no port and makes no request.

A Deezer update replaces `app.asar`. The install registers `patch.ps1 -Quiet` at sign-in to put the hook back, and `better-deezer apply` does it on demand.

Everything lives in `%LOCALAPPDATA%\BetterDeezer`: the scripts (plain text, readable), the skin, `config.json`, `patch.log`, and `bin\better-deezer.cmd`, which is on your user PATH.

</details>

## Documentation

| Page | What's inside |
| --- | --- |
| [User guide](docs/guide.md) | Every feature, the settings panel, shortcuts, where settings live, how to reset |
| [Troubleshooting](docs/troubleshooting.md) · [Dépannage](docs/fr/depannage.md) | Symptoms, error messages and fixes |
| [Themes](docs/themes.md) | The theme format, the editor, publishing to the Marketplace |
| [Modules](docs/modules.md) | What each module does, and how to write one |
| [Privacy](docs/privacy.md) | What stays on your machine (everything) and the only requests made |

**Something broke?** Open *Better Deezer settings > About*: it lists the parts of Deezer it could not find and can turn Better Deezer off (`Ctrl ,` turns it back on). Then see [Troubleshooting](docs/troubleshooting.md).

## Development

```bash
npm run build              # Node 18+, no dependency; output in dist/
npm test                   # smoke test in Chromium (needs Playwright installed globally)
npm run check              # build + syntax check + smoke test
node test/cdp-inject.mjs   # inject the build into the real deezer.com over DevTools
```

| Folder | Content |
| --- | --- |
| `src/core` | Core, the anchors on Deezer's page (`data-testid`, ARIA roles, never generated class names), the theme engine |
| `src/features` | One file per feature: top bar, rail, player, volume, lyrics, settings… |
| `src/styles` | CSS, from tokens to modules |
| `themes/` | Built-in and community themes, and `index.json` for the Marketplace |
| `desktop/` | The Windows scripts: `install`, `setup`, `patch`, `cli` (the command), `ui` (the shared look), `uninstall` |
| `test/` | Playwright smoke test on a fixture with Deezer's anchors |

From DevTools (`F12`) on deezer.com, `__betterDeezer.health()` shows which parts of Deezer were found and `__betterDeezer.features()` shows every feature's state. With the extension, pick the **Better Deezer** context first.

**Releasing:** bump `version` in `package.json`, then push a tag `vX.Y.Z` with the same version. The `release` workflow builds the zips, the userscript and `SHA256SUMS.txt`, and `better-deezer update` picks it up.

Contributors: [HANDOFF.md](HANDOFF.md) explains the architecture and the rules for touching Deezer's page.

## Credits

Lyrics from [LRCLIB](https://lrclib.net), the open lyrics database. Inspired by [Spicetify](https://spicetify.app). Fonts: [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) and [Instrument Sans](https://github.com/Instrument/instrument-sans), SIL Open Font License 1.1 ([details](assets/fonts/README.md)).

## License

MIT
