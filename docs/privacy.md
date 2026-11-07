# Privacy

Better Deezer has no server, no account, no analytics and no telemetry.

## What stays on your machine

Everything: your settings, installed themes, the *Don't recommend* list and hidden home sections are in deezer.com's `localStorage` (keys starting with `bd:`). They never leave your browser or the desktop app.

## The only network requests Better Deezer makes

| When | To | What is sent |
| --- | --- | --- |
| You open the **Now playing** view (module on) | `lrclib.net` | The current track's title, artist and duration, to find its lyrics. No account, no cookie (`credentials: "omit"`). Results are cached for the session. |
| You open the **Themes** tab | `raw.githubusercontent.com` | A plain download of `themes/index.json` (the Marketplace list), once per session. |
| You install a theme **from a link** | the link you typed | A plain download of that file. |

Cover colors (header tint, accent from the cover) are read from Deezer's own image CDN, which the page already loads.

Turn the *Now playing* module off and never open the Marketplace, and Better Deezer makes no request at all.

## Themes cannot track you

A theme is data, not code: colors, sizes, font names and CSS. CSS that could load anything (`url()`, `@import`) or run code is rejected when the theme is installed. A theme cannot see your account or send anything anywhere.

## The desktop launcher

The Windows launcher starts Deezer with a debugging port bound to `127.0.0.1` (your machine only) while Deezer runs, to inject the skin. Programs running under your Windows account could connect to it during that time; such programs could already read Deezer's data on disk. Details in the [README](../README.md#windows-desktop-app).
