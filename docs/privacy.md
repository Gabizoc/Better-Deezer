# Privacy

Better Deezer has no server, no account, no analytics and no telemetry.

## What stays on your machine

Everything: your settings, installed themes, the *Don't recommend* list and hidden home sections are in deezer.com's `localStorage` (keys starting with `bd:`). They never leave your browser or the desktop app.

## The only network requests Better Deezer makes

| When | To | What is sent |
| --- | --- | --- |
| You open the **Now playing** view (module on, lyrics source *Deezer*, the default) | `auth.deezer.com`, `pipe.deezer.com` (Deezer's own servers) | The same requests as Deezer's own lyrics button: a short-lived token from your Deezer session (kept in memory 4 minutes, never stored), then the playing track's id to get its lyrics. Nothing leaves Deezer. |
| Same, when Deezer has no lyrics for the track, or with the source set to *LRCLIB only* | `lrclib.net` | The current track's title, artist and duration, to find its lyrics. No account, no cookie (`credentials: "omit"`). Results are cached for the session. |
| You open the **Themes** tab | `raw.githubusercontent.com` | A plain download of `themes/index.json` (the Marketplace list), once per session. |
| You install a theme **from a link** | the link you typed | A plain download of that file. |

Cover colors (header tint, accent from the cover) are read from Deezer's own image CDN, which the page already loads.

Turn the *Now playing* module off and never open the Marketplace, and Better Deezer makes no request at all.

In the browser extension, a tiny script (`page-bridge.js`) runs in Deezer's page to read which track is playing (the extension itself cannot see Deezer's player). It reads that and nothing else.

## Themes cannot track you

A theme is data, not code: colors, sizes, font names and CSS. CSS that could load anything (`url()`, `@import`) or run code is rejected when the theme is installed. A theme cannot see your account or send anything anywhere.

## The desktop app

The Windows install adds a few lines to Deezer's own `app.asar` that run `%LOCALAPPDATA%\BetterDeezer\better-deezer.user.js` in Deezer's deezer.com pages. They open no port and make no request; the skin then behaves exactly as in the browser. Details in the [README](../README.md#windows-desktop-app).
