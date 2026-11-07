# User guide

Better Deezer restyles the Deezer web player (www.deezer.com) and the Windows desktop app, and adds a few things Deezer doesn't have. Everything happens on your machine: Deezer's servers see a normal Deezer.

Install instructions are in the [README](../README.md#install). Something wrong? See [Troubleshooting](troubleshooting.md).

## First start

A card in the bottom right corner shows the three things to know:

- `Ctrl ,` (`⌘ ,` on Mac) opens the **Better Deezer settings**. It's also in the profile menu (your avatar, top right).
- `F` opens the **Now playing** view with synced lyrics.
- The **mouse wheel** works on the volume and on the player bar's cover.

The card appears once. Afterwards a small "Better Deezer x.y.z" badge shows for 3 seconds at startup (turn it off in *Settings > Appearance*).

## What changes

### Top bar
- The search field is **always centered on the window**, whatever the width of the side rail, with a round **Home** button on its left. `Ctrl K` focuses it.
- Results open right under the field, at the same width, with a footer listing the search shortcuts.

### Side rail and player bar
- The rail floats; collapsed, its icons are centered. The active page is marked with an accent bar.
- The player bar floats at the bottom: round accent play button, filled heart when liked, thin seek bar between the two times.
- **Volume**: click the speaker to unfold a slider, click it again to mute. Wheel over the speaker or the slider: ±5 % (±1 % with Shift; the step can be 2, 5 or 10 % in *Settings > Playback*). Alt+click or middle click: mute.
- **Seek with the wheel** over the cover in the player bar: ±5 s. The seek bar itself ignores the wheel, so scrolling the page never moves the music.
- Double-click the title in the player bar to open its album.
- Tooltips on every icon, with the gesture it supports.

### Pages
- Album, playlist and artist headers are tinted with the cover's color.
- Track lists: quieter rows, the playing track highlighted, popularity as a thin bar, and a **Hide explicit** filter.
- Home: a greeting with the date, sections you can hide (*Settings > Home*) and reorder (*Settings > Recommendations*).
- Modals, menus, notifications (with *Releases / Social* filters), the profile menu and toasts follow the theme.

## The settings panel

| Tab | What you can do |
| --- | --- |
| **Themes** | Light / dark / auto, pick a theme, browse the Marketplace, install from a link or a file, create or customize a theme ([Themes](themes.md)) |
| **Modules** | Turn extras on and off, live ([Modules](modules.md)) |
| **Appearance** | Turn the visual parts on and off, the startup badge, and the **Sidebar** entries (Home, Explore, Favourite tracks, Playlists, Albums, Artists, Podcasts). The Library entries are hidden by default; your playlists and pinned items always stay. |
| **Playback & volume** | Player bar features, wheel gestures, tooltips, volume step |
| **Home** | Hide the home carousels you don't use |
| **Recommendations** | Home order: *Deezer* (unchanged), *Familiar* (your mixes and favorites first) or *Discovery* (new releases and trends first), plus *By time of day*. And a **Don't recommend** list: cards and tracks matching an artist, genre or word are hidden everywhere |
| **Shortcuts** | Every keyboard shortcut and gesture |
| **About** | Version, the health check (which parts of Deezer were found), help, reset, turn Better Deezer off |

Changes apply at once. The few that need a reload show a *Reload* bar at the bottom of the panel.

About the Recommendations tab: Better Deezer cannot change what Deezer recommends (that happens on Deezer's servers). It reorders and hides what Deezer shows, on this device only.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl K` / `⌘ K` | Search |
| `Ctrl ,` / `⌘ ,` | Better Deezer settings (also turns Better Deezer back on if you turned it off) |
| `F` | Now playing view with lyrics |
| `Esc` | Close the view, the settings or a menu |
| `Q` | Queue |
| Deezer's own | `Space` play/pause, `←` `→` seek, `Shift ←` `Shift →` previous / next, `Shift ↑` `Shift ↓` volume, `M` mute, `L` like, `S` search, `R` replay, `0`–`9` jump, `H` for Deezer's list |

Shortcuts are ignored while you type in a field.

## Where your settings live

In the browser's `localStorage` for deezer.com, under keys starting with `bd:` (for example `bd:themes:active`). Nothing is synced: each browser, and the desktop app, has its own settings. Installed themes are stored there too.

### Reset everything

- *Settings > About > Reset* (asks for confirmation, then reloads), or
- in DevTools (`F12`) console on deezer.com:
  ```js
  Object.keys(localStorage).filter((k) => k.startsWith("bd:")).forEach((k) => localStorage.removeItem(k)); location.reload();
  ```
  With the extension, pick the **Better Deezer** context in the console's context dropdown first, or run it in the default context: both see the same `localStorage`.

## Turning it off

- One feature: its switch in the settings.
- Everything, for now: *Settings > About > Turn off Better Deezer*. Deezer reloads untouched. `Ctrl ,` asks to turn it back on.
- For good: remove the extension, or uninstall *Better Deezer* from *Windows Settings > Apps*. Deezer itself is never modified.
