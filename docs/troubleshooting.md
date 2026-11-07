# Troubleshooting

Start here: open *Better Deezer settings* (`Ctrl ,`) > **About**. The **Deezer elements found** line tells you whether Better Deezer recognises Deezer's page. "Everything is in place" means the problem is elsewhere; a list of names means Deezer changed something (see [After a Deezer update](#after-a-deezer-update)).

En français : [Dépannage](fr/depannage.md).

- [Nothing changes on deezer.com](#nothing-changes-on-deezercom)
- [After a Deezer update](#after-a-deezer-update)
- [Windows desktop app](#windows-desktop-app)
- [Themes](#themes)
- [Lyrics and the Now playing view](#lyrics-and-the-now-playing-view)
- [Modules](#modules)
- [Messages in the console](#messages-in-the-console)
- [Reporting a problem](#reporting-a-problem)

## Nothing changes on deezer.com

| Check | Fix |
| --- | --- |
| Is the extension enabled? | `chrome://extensions` (or `edge://extensions`): *Better Deezer* switched on, no red *Errors* button. Reload deezer.com. |
| Did you turn Better Deezer off? | Press `Ctrl ,` on deezer.com: a dialog offers to turn it back on. |
| Is it the right site? | Better Deezer runs on `www.deezer.com` only (not `account.deezer.com`, not the old `deezer.com/en/` marketing pages). |
| After unzipping a new version | *Load unpacked* points to a folder: after replacing its contents, click the reload arrow on the extension card, then reload deezer.com. |
| Another Deezer extension or userscript | Turn it off and reload: two skins fight over the same elements. |
| *Favourite tracks*, *Albums*… are missing from the sidebar | Hidden by default. *Settings > Sidebar* brings each one back (or *Reset to default*). |
| An entry can't be dragged in *Settings > Sidebar* | Deezer lays that group out in a way that can't be reordered without moving its elements, which Better Deezer never does. Show / hide still works. |
| Userscript | Violentmonkey / Tampermonkey must be allowed on deezer.com, and the script enabled. Only one copy installed (extension **or** userscript). |

## After a Deezer update

Deezer ships new versions often. Better Deezer never relies on Deezer's generated class names, only on stable markers (`data-testid`, ARIA roles), so most updates are fine. When something does break:

1. *Settings > About* lists the elements that were **not found** (e.g. `volumeButton, progressInput`).
2. Turn off the feature that looks broken (its switch in *Appearance* or *Playback & volume*), or everything with *Turn Better Deezer off*: Deezer reloads untouched.
3. [Report it](#reporting-a-problem) with the list. A fix is usually one line in `src/core/10-anchors.js`.

A feature that throws an error is switched off automatically for the session, so one broken part never takes down the rest. Its name appears in the console as `feature "…" disabled after error`.

Note: some elements only exist on some pages or for some accounts. `profileButton` is missing when logged out, `volumeInput` until the volume is opened, `homeSections` outside the home page. The About tab marks those as "not open" rather than missing.

## Windows desktop app

| Symptom | Cause and fix |
| --- | --- |
| `irm … \| iex` shows red text about *execution policy* | Run it in **Windows PowerShell** (not cmd), or right click `install.ps1` > *Run with PowerShell*. The installer only runs for your user, no admin rights needed. |
| *Install cancelled: Deezer.exe not found* | The installer looks in the usual places, then asks for the full path of `Deezer.exe`; pressing Enter cancels. Install the Deezer desktop app first ([deezer.com/download](https://www.deezer.com/download)), or give the path ahead of time: `$env:BD_DEEZER_PATH = "C:\path\to\Deezer.exe"` before running the install command. |
| The *Better Deezer* shortcut opens plain Deezer | Deezer was already running: the launcher closes it first, but if it is stuck in the tray, quit it from the tray icon and start *Better Deezer* again. Then read the log (below). |
| *Deezer is already running* | You started the launcher with `-KeepRunning`. Quit Deezer (tray icon > Quit) and start again. |
| Deezer starts without the skin for a few seconds | The launcher waits for Deezer's page to load, then injects. On slow PCs this takes a moment; if it never applies, check the log. |
| *CDP … failed* / *CDP socket closed* in the log | Deezer closed or restarted during injection. Start *Better Deezer* again. If it repeats, a Deezer update may have changed its startup: report it with the log. |
| Antivirus warning | The launcher is a PowerShell script that starts Deezer with a debugging port on `127.0.0.1`. Some antivirus tools flag that pattern. The scripts are plain text in `%LOCALAPPDATA%\BetterDeezer\`: you can read them. |
| Uninstall | *Windows Settings > Apps > Better Deezer > Uninstall*, or run `%LOCALAPPDATA%\BetterDeezer\uninstall.ps1`. Deezer is untouched; your Better Deezer settings stay in Deezer's storage until you clear its cache. |

**Log file**: `%LOCALAPPDATA%\BetterDeezer\launcher.log` (paste `%LOCALAPPDATA%\BetterDeezer` in the Explorer address bar). Each start writes the Deezer path, the port, and every page it injected into.

**DevTools in the desktop app**: while *Better Deezer* runs, open `http://127.0.0.1:<port>` from the log in Chrome to inspect Deezer, and use the `__betterDeezer` console API.

## Themes

| Message or symptom | Meaning and fix |
| --- | --- |
| *Offline: community themes shipped with this version.* | The Marketplace could not download the latest list from GitHub (offline, blocked, or the repository is private). The themes bundled with this version still work. |
| *invalid link* / *the link must start with https://* | Install from link needs a direct `https://` link to the `.json` file. On GitHub, use the **Raw** link. |
| *download failed (HTTP 404)* | The link is wrong or the file is private. |
| *download failed: Failed to fetch* | The site does not allow downloads from deezer.com (CORS). Download the file and use *Install from a file* instead. |
| *file too large* | Themes are limited to 100 KB. |
| *Cannot save: …* followed by a list | The theme is invalid; each item says what to fix, e.g. `colors.dark.bg: "blue" is not a color`, `"css" may not use url()…`. Format: [Themes](themes.md). |
| Contrast warnings in the editor (`text-2 on bg: 3.1 (min 4.5)`) | Not an error: the theme saves, but some text will be hard to read. Adjust the colors named. |
| A theme looks broken after a Deezer update | Its custom `css` may target something that moved. Switch back to *Graphite* and tell the theme's author. |
| Light / dark switch does nothing | The theme provides only one palette (e.g. *Aurora* is dark only). Its card says so. |

## Lyrics and the Now playing view

| Message | Meaning |
| --- | --- |
| *Looking for lyrics…* | Asking lrclib.net. Usually under a second. |
| *No lyrics found for this track.* | LRCLIB has no lyrics for this title and artist. Anyone can add them at [lrclib.net](https://lrclib.net). |
| *Instrumental ♪* | LRCLIB marks the track as instrumental. |
| *Lyrics unavailable (cannot reach lrclib.net).* | Offline, or a firewall / ad blocker blocks `lrclib.net`. Allow it or turn the module off. |
| Lyrics not in sync | LRCLIB matched another version of the track (radio edit, live). Better Deezer only accepts versions within 8 seconds of the track's duration and prefers synced ones; when only plain lyrics exist they are shown without sync. |
| The line fills too fast or too slow | The source is LRCLIB (shown under the lyrics), which only gives the start of each line: the fill is an estimate. Deezer's word-by-word lyrics are exact when Deezer has them for the track. |
| Always *Lyrics: LRCLIB*, never Deezer | Deezer has no synced lyrics for that track, or the request to Deezer failed (logged out, network). Check *Settings > Playback & volume > Lyrics* is on *Deezer, then LRCLIB*. The extension needs Chrome / Edge 111 or newer. |
| `F` does nothing | You are typing in a field, or the *Now playing* module is off (*Settings > Modules*). Nothing playing: the view says so. |

## Modules

| Module | If it misbehaves |
| --- | --- |
| Accent from the cover | Stays on the theme's accent: the cover could not be read (some CDN answers refuse cross-origin reads). Next track usually works. |
| Sleep timer | The timer lives in the open page: reloading or closing Deezer cancels it. The fade lowers Deezer's volume, then restores it after pausing. |
| Hide promos | Purely visual. If a banner still shows, Deezer introduced a new one: report its text. |
| Transitions | Off automatically when your system asks for reduced motion (Windows: *Settings > Accessibility > Visual effects > Animation effects*). |
| Compact mode | Only spacing and sizes; turn it off if something overlaps. |

## Messages in the console

Open DevTools with `F12` > *Console*. With the extension, choose **Better Deezer** in the context dropdown to use `__betterDeezer`.

| Message | Meaning |
| --- | --- |
| `[Better Deezer] vX.Y.Z (extension) running on …` | All good. |
| `anchors not found (Deezer may have changed, or the element is not on screen): …` | Same list as *About*. Fine if the element simply isn't on this page. Better Deezer only starts on the web player, never on Deezer's marketing pages (`/explore/…`, download, offers): if you see this there, you have an old version. In Chrome this shows in the extension's *Errors* panel; it is a warning, not a crash. |
| `feature "x" disabled after error in update: …` | That feature crashed and was switched off for this session. Report the error. |
| `volume input never mounted` | The volume slider could not reach Deezer's own control (rare). Clicking the speaker again usually fixes it. |

Useful commands:

```js
__betterDeezer.health()            // which parts of Deezer were found
__betterDeezer.features()          // every feature, on/off, failed
__betterDeezer.disable("volume")   // turn one feature off ( .enable("volume") to undo )
__betterDeezer.debug()             // verbose logs; __betterDeezer.debug(false) to stop
```

## Reporting a problem

Open an issue on the repository with:

1. Where: browser + version, or the desktop app; extension, userscript or launcher.
2. What you did and what you expected.
3. The *About* tab's **Deezer elements found** line, or the output of `__betterDeezer.health()` and `__betterDeezer.features()`.
4. For the desktop app: the last lines of `launcher.log`.
5. A screenshot helps.

Never paste cookies, tokens or your `arl` value: nobody needs them to debug Better Deezer.
