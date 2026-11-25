<div align="center">

<img src="store/icon.svg" width="96" height="96" alt="">

# Better Deezer

**A cleaner, more modern Deezer, made your way.**

Themes, a theme Marketplace, synced lyrics, a floating player and dozens of small touches,<br>
for the Windows app and the web player. Spicetify, for Deezer.

![Version](https://img.shields.io/badge/version-1.2.0-a238ff?style=flat-square)
![Windows](https://img.shields.io/badge/Windows-Deezer_app-0078d4?style=flat-square)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/miceabadgmpgdkfgjihkihbgeonlekbb?label=Chrome%20Web%20Store&color=4285f4&style=flat-square)](https://chromewebstore.google.com/detail/miceabadgmpgdkfgjihkihbgeonlekbb)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

[Install](#install) · [Features](#features) · [Command](#the-better-deezer-command) · [Documentation](#documentation) · [Development](#development) · [Français](README.fr.md)

</div>

> [!NOTE]
> Unofficial project, not affiliated with Deezer. It only changes how Deezer looks and behaves **on your machine**. No account, no analytics, no server: see [Privacy](docs/privacy.md).

## Install

### Windows app

Open **PowerShell** (not the Command Prompt) and paste:

```powershell
irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex
```

That's it. Open Deezer as usual, from its own shortcut: the skin is there.

- **No second app**: Better Deezer patches the Deezer app itself, like Spicetify does for Spotify.
- **No admin rights**: everything installs for your Windows account.
- **Deezer updates are handled**: the patch is put back at sign-in.

<details>
<summary>Without the PowerShell command</summary>

Download `better-deezer-windows.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases), unzip it, then right-click `install.ps1` › *Run with PowerShell*.

</details>

### Browser — Chrome, Edge, Brave, Opera

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/miceabadgmpgdkfgjihkihbgeonlekbb)**, then reload deezer.com. Updates arrive on their own.

<details>
<summary>Without the Chrome Web Store</summary>

1. Download `better-deezer-extension.zip` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. **Load unpacked** › pick the folder, then reload deezer.com.

</details>

### Userscript

Install `better-deezer.user.js` from the [Releases](https://github.com/Gabizoc/Better-Deezer/releases) with Violentmonkey or Tampermonkey. Use the extension **or** the userscript, not both.

## Features

Everything is set in the **Better Deezer settings**: `Ctrl ,` (`⌘ ,` on Mac), or from the profile menu. Changes apply at once; the few that need a reload say so.

### 🎨 Themes
- **6 built-in themes**, each in light, dark or following your system
- A **Marketplace** of community themes, kept up to date, with offline copies shipped in each version
- Install a theme from a **link** or a **file**, export any theme as `.json`
- A **theme editor** with a live preview on Deezer, every color of both palettes, advanced CSS, and a **readability check** that warns about low contrast
- **Customize** any theme into your own copy
- A theme is a JSON file with colors and CSS, never code: [make your own](docs/themes.md)

### 🔤 Language and typeface
- **7 languages**: English, French, Spanish, German, Italian, Portuguese and Dutch. *Auto* follows Deezer's language; dates follow it too
- **6 typefaces**: Space Grotesk + Inter (default), Bricolage Grotesque + Instrument Sans, Manrope, Sora + DM Sans, Outfit + Figtree, Plus Jakarta Sans. Switching cross-fades the window, no reload. The default lets a theme pick its own fonts

### 🎤 Now playing (`F`)
- A full-window view with a **big cover**, the background tinted by it, the title, a seek bar you can drag, and previous / play / next
- **Synced lyrics**: **word by word** when Deezer has them (through your Deezer session), line by line from [LRCLIB](https://lrclib.net) otherwise. Choose the source in *Playback & volume*
- The current line fills with the rhythm of the song, instrumental breaks show three breathing dots, and **clicking a line jumps there**
- With no lyrics (none found, instrumental, offline), the cover and controls **move to the center** and say why

### 🪟 Layout
- **Centered search** on the window, whatever the sidebar width, with a round **Home** button. `Ctrl K` puts the cursor in it; results open right below at the same width
- **Floating sidebar**, centered on screen, collapsed or not, with the active page marked
- **Floating player**: round play button in the accent color, filled heart when liked, thin seek bar between the two times
- Album, playlist and artist headers **tinted by the cover**
- **Reworked album and artist pages**, restyled cards, rows and titles, the playing track highlighted, popularity as a thin bar
- Restyled **modals, menus, notifications** (with *Releases / Social* filters), profile menu and messages
- **Tooltips** on every player icon with the gesture it accepts, and a **preview card** of the previous / next track

### 🎛️ Player and comfort
- **Volume**: one click unfolds a slider, a second click mutes. Mouse wheel on it: ±5% (±1% with Shift; step of 2, 5 or 10% in the settings). Alt+click or middle click mutes
- **Mouse wheel on the player's cover** skips ±5 s. The seek bar ignores the wheel, so scrolling the page never moves the music
- **Double-click the title** in the player to open its album
- `Q` opens the queue

### 🏠 Home and recommendations
- A **greeting** with the date on the home page
- **Hide** the home carousels you don't use
- **Reorder** the home page: *Deezer* (unchanged), *Familiar* (your mixes and favorites first) or *Discovery* (new releases and trends first), plus *By time of day* (calm in the morning, focus by day, upbeat at night, relaxing late)
- A **"Don't recommend" list**: cards and tracks matching an artist, a genre or a word are hidden everywhere, on this device
- A **Hide explicit tracks** filter

### 🧭 Sidebar
- The sidebar's entries as Deezer has them, with their real icons and names: an entry Deezer adds or renames shows up by itself
- **Show, hide and reorder** each entry (drag the handle or `Alt ↑` `Alt ↓`), *Reset to default*. Your playlists and pinned items always stay

### 🧩 Modules
Extras you turn on or off live, in *Settings › Modules*:
- **Now playing view + synced lyrics**
- **Smooth transitions**: fades on page and cover changes, cards that lift on hover (off when your system asks for reduced motion)
- **Hide promotional banners**: "Go Premium" and "Sign up" banners, ad slots, sponsored playlists. Visual only, nothing is blocked on the network
- **Sleep timer**: pause after a while or at the end of the track, fading the volume over the last minute; a badge in the player shows the time left
- **Accent color from the cover**: buttons and the seek bar take the cover's main color, adjusted to stay readable
- **Compact mode**: tighter rows and cards to fit more on screen

### ⌨️ Shortcuts
| Keys | Action |
| --- | --- |
| `Ctrl K` / `⌘ K` | Search |
| `Ctrl ,` / `⌘ ,` | Better Deezer settings (also turns Better Deezer back on) |
| `F` | Now playing view with lyrics |
| `Esc` | Close the view, the settings or a menu |
| `Q` | Queue |

Deezer's own shortcuts keep working (`Space`, arrows, `M`, `L`…); the full list is in *Settings › Shortcuts*.

### 🛟 Safety nets
- *Settings › About* lists the Deezer elements Better Deezer recognizes, links to help, **resets** everything, or **turns Better Deezer off** (`Ctrl ,` turns it back on)
- A feature that breaks is switched off for the session and named in the console; the rest keeps working
- A short welcome card on first run, then a 3-second "Better Deezer x.y.z" badge at startup (can be turned off)

The [guide](docs/guide.md) (in French) details every option.

## The `better-deezer` command

The Windows install adds a command, like `spicetify`. Open a **new** terminal after installing.

```text
better-deezer status       state: versions, Deezer patched or not, update available
better-deezer update       install the latest version (-f: reinstall the same one)
better-deezer apply        patch Deezer again, for example after a Deezer update
better-deezer restore      put Deezer back to original, keep Better Deezer installed
better-deezer restart      restart Deezer
better-deezer logs         last lines of the log
better-deezer uninstall    remove everything and restore Deezer (-y: no question)
better-deezer version      show the installed version
```

`update` checks every downloaded file against the release's SHA-256 sums before installing anything.

### Uninstall

`better-deezer uninstall`, or *Windows Settings › Apps › Better Deezer › Uninstall*. Deezer is put back exactly as before. In the browser, remove the extension.

<details>
<summary><b>How Better Deezer patches the app</b></summary>

<br>

The Deezer app is an Electron app that shows deezer.com.

1. `patch.ps1` adds a few lines to `build/main.js` inside Deezer's `resources\app.asar`, and keeps the original as `app.asar.bd-backup`.
2. Each time deezer.com loads, those lines read `%LOCALAPPDATA%\BetterDeezer\better-deezer.user.js` and run it in the page. If the file is gone, Deezer runs unmodified.
3. A Deezer update replaces `app.asar`: the install registers `patch.ps1 -Quiet` at sign-in to put the patch back, and `better-deezer apply` does it on demand.

The patch opens no port and makes no request. Everything lives in `%LOCALAPPDATA%\BetterDeezer`: the scripts (plain text), the skin, `config.json`, the `patch.log` log, and `bin\better-deezer.cmd`, added to the user's PATH.

</details>

## Documentation

| Page | Content |
| --- | --- |
| [Guide](docs/guide.md) (French) | Every feature, the settings, the shortcuts, resetting or turning off Better Deezer |
| [Troubleshooting](docs/troubleshooting.md) | Symptoms, error messages and fixes |
| [Themes](docs/themes.md) (French) | The format, the editor, publishing to the Marketplace |
| [Modules](docs/modules.md) (French) | What each module does, and how to write one |
| [Privacy](docs/privacy.md) | What stays on your machine (everything) and the only requests made |

> [!TIP]
> **Something wrong?** Open *Better Deezer settings › About*: it lists the Deezer elements it cannot find and lets you turn Better Deezer off (`Ctrl ,` turns it back on). Then see [Troubleshooting](docs/troubleshooting.md).

## Development

```bash
npm run build              # Node 18+, no dependencies; output in dist/
npm test                   # smoke test in Chromium (Playwright installed globally)
npm run check              # build + syntax check + smoke test
node test/cdp-inject.mjs   # inject the build into the real deezer.com through DevTools
```

| Folder | Content |
| --- | --- |
| `src/core` | The core, the anchors on Deezer's page (`data-testid`, ARIA roles, never generated classes), the theme engine |
| `src/features` | One file per feature: top bar, sidebar, player, volume, lyrics, settings… |
| `src/i18n` | Translations beyond French and English, keyed by the English text |
| `src/styles` | The CSS, from tokens to modules |
| `themes/` | Built-in and community themes, and `index.json` for the Marketplace |
| `desktop/` | The Windows scripts: `install`, `setup`, `patch`, `cli` (the command), `ui` (shared display), `uninstall` |
| `extension/` | The extension manifest, icons and store translations (`_locales`) |
| `store/` | The Chrome Web Store listing: texts per language, screenshots, promo tiles |
| `test/` | Playwright smoke test on a page that mirrors Deezer's anchors |

In DevTools (`F12`) on deezer.com, `__betterDeezer.health()` shows the Deezer elements found and `__betterDeezer.features()` the state of each feature. With the extension, pick the **Better Deezer** context first.

**Releasing**: change `version` in `package.json`, then push a matching `vX.Y.Z` tag. The `release` workflow builds the zips, the userscript and `SHA256SUMS.txt`, and `better-deezer update` offers it right away.

To contribute: [CONTRIBUTING.md](CONTRIBUTING.md). [CHANGELOG.md](CHANGELOG.md) lists the versions. Security issue: [SECURITY.md](SECURITY.md).

## Credits

- Lyrics: [LRCLIB](https://lrclib.net), the open lyrics database
- Inspiration: [Spicetify](https://spicetify.app)
- Fonts: [Space Grotesk](https://github.com/floriankarsten/space-grotesk), [Inter](https://github.com/rsms/inter), [Bricolage Grotesque](https://github.com/ateliertriay/bricolage), [Instrument Sans](https://github.com/Instrument/instrument-sans), [Manrope](https://github.com/sharanda/manrope), [Sora](https://github.com/sora-xor/sora-font), [DM Sans](https://github.com/googlefonts/dm-fonts), [Outfit](https://github.com/Outfitio/Outfit-Fonts), [Figtree](https://github.com/erikdkennedy/figtree) and [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), SIL Open Font License 1.1 ([details](assets/fonts/README.md))

## License

MIT
