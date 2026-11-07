# Themes

A Better Deezer theme is **one JSON file**: a name, colors for dark and/or light mode, optionally corner radii, fonts and a bit of CSS. No code, no build step. Themes are installed from *Settings > Themes* (Marketplace, link or file) and shared through this repository's `themes/community/` folder.

- [Make a theme in 2 minutes (no code)](#make-a-theme-in-2-minutes)
- [The format](#the-format)
- [Colors](#colors)
- [Custom CSS](#custom-css)
- [Testing from the console](#testing-from-the-console)
- [Publish it to the Marketplace](#publish-it-to-the-marketplace)
- [Rules and limits](#rules-and-limits)

## Make a theme in 2 minutes

1. `Ctrl ,` > **Themes** > **Create a theme** (or **Customize** on an existing theme to start from it).
2. Pick the colors: the preview is applied live on Deezer, behind the panel. The **Readability** box warns when a text color is too close to its background.
3. **Save and apply**. Your theme now appears in *Your themes*, marked *custom*.
4. **Export .json** to share it or keep a copy.

The **Dark palette / Light palette** switch at the top of the editor chooses which mode you are editing (and previews it). A theme can provide both modes or only one ("Dark only" / "Light only").

## The format

```json
{
  "schema": 1,
  "id": "my-theme",
  "name": "My theme",
  "author": "Your name",
  "description": "One sentence shown on the card.",
  "version": "1.0.0",
  "modes": ["dark", "light"],
  "colors": {
    "dark":  { "bg": "#0e0f13", "accent": "#7c5cff" },
    "light": { "bg": "#f7f7f9", "accent": "#5b3df5" }
  },
  "radius": { "card": 16, "dock": 24 },
  "fonts": { "display": "Georgia, serif" },
  "css": "html[data-bd-skin=\"my-theme\"] [data-bd=\"dock\"] { border-width: 2px !important; }"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `schema` | yes | Always `1` for now. |
| `id` | yes | 2 to 41 characters: lowercase letters, digits, dashes. Must match the file name in `themes/community/` (`my-theme.json`). |
| `name` | yes | Up to 60 characters. |
| `author`, `version` | no | Up to 60 characters. Bump `version` when you update a published theme. |
| `description` | no | Up to 240 characters. |
| `modes` | no | `["dark"]`, `["light"]` or both. Defaults to the palettes you provide. A one-mode theme forces that mode while active. |
| `colors` | no | One object per mode, see below. **Any color you leave out falls back to the default Graphite theme**, so a theme can be just an accent color. |
| `radius` | no | Corner radii in px: `chip` 0–16, `cover` 0–24, `card` 0–32, `menu` 0–32, `dock` 0–40. |
| `fonts` | no | `display` (titles) and `ui` (everything else): font names already installed on the user's machine, with fallbacks. No web fonts. |
| `css` | no | Extra CSS, up to 20 000 characters, see [Custom CSS](#custom-css). |

## Colors

Thirteen keys per mode. Better Deezer maps them onto Deezer's whole interface (including the menus and modals Deezer renders itself), and derives hover, pressed and soft variants of the accent.

| Key | Used for | Readability check |
| --- | --- | --- |
| `bg` | page background | |
| `surface-1` | rail, player bar, panels | |
| `surface-2` | hovered rows, inputs, chips | `text` ≥ 4.5 on it |
| `surface-3` | selected items, pressed | |
| `surface-4` | highest elevation | |
| `line` | borders, separators | |
| `line-strong` | focused / emphasized borders | |
| `text` | main text | ≥ 7 on `bg` |
| `text-2` | secondary text (artists, metadata) | ≥ 4.5 on `bg` |
| `text-3` | tertiary text (hints, dates) | ≥ 4.5 on `bg` |
| `accent` | play button, seek bar, switches | |
| `accent-text` | accent used as text (playing track, links) | ≥ 4.5 on `bg` |
| `on-accent` | icons and text on top of `accent` | ≥ 3 on `accent` |

Values: `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, `hsla()`. The readability check only runs on `#rrggbb` values. The numbers are WCAG contrast ratios. In the editor they are warnings (you can still save); for themes published in this repository the build **refuses** a palette below them, so everything in the Marketplace stays readable.

## Custom CSS

For what colors can't do. Scope every rule to your theme so it only applies while it's active:

```css
html[data-bd-skin="my-theme"] [data-bd="rail"] { backdrop-filter: blur(12px); }
```

Better Deezer tags Deezer's interface with stable attributes. **Target these, never Deezer's `css-xxxx` class names**, which change with every Deezer release.

| Attribute | Elements |
| --- | --- |
| `data-bd="topbar"`, `"search-slot"`, `"rail"`, `"dock"`, `"page"` | the main layout |
| `data-bd="page-header"` | album / playlist / artist header |
| `data-bd="modal"`, `"menu"`, `"toast"`, `"search-popover"`, `"scrim"` | overlays |
| `data-bd-role="track-row"`, `"card"`, `"section-title"`, `"play"`, `"like"`, `"progress-track"`, `"progress-fill"` | content and player parts |
| `data-bd-playing="true"` | the track row that is playing |
| `data-bd-collapsed="true"` on the rail | collapsed rail |
| `html[data-bd-theme="dark"]` / `"light"` | current mode |
| `.bd-np-*` | the Now playing view (`#bd-np`) |

And the CSS variables, if you'd rather reuse the palette: `--bd-bg`, `--bd-surface-1`…`4`, `--bd-text`, `--bd-text-2`, `--bd-text-3`, `--bd-accent`, `--bd-accent-hover`, `--bd-accent-soft`, `--bd-on-accent`, `--bd-line`, `--bd-r-card`, `--bd-r-dock`, `--bd-font-display`, `--bd-font-ui`, `--bd-ease`, `--bd-t-fast`.

Deezer's inline styles often win: add `!important` when a rule doesn't apply.

## Testing from the console

On deezer.com, `F12` > *Console* (with the extension, pick the **Better Deezer** context):

```js
const t = { schema: 1, id: "test", name: "Test", colors: { dark: { accent: "#ff5c8a" } } };
__betterDeezer.themes.validate(t)   // { ok, theme, errors }
__betterDeezer.themes.preview(t)    // apply without saving (closing the settings reverts)
__betterDeezer.themes.install(t)    // save to Your themes
__betterDeezer.themes.activate("test")
__betterDeezer.themes.list()        // ids of every installed theme
```

## Publish it to the Marketplace

1. Fork the repository.
2. Add your file as `themes/community/<id>.json` (the file name must equal the `id`).
3. Run `npm run build` (Node 18+, no dependency): it validates every theme with the same code the extension uses, checks the contrast rules above, and regenerates `themes/index.json` (the Marketplace list). Fix any error it reports.
4. Open a pull request with a screenshot in dark and/or light mode.

Once merged, the theme shows up in every user's Marketplace (it downloads `themes/index.json` from the default branch) and ships offline in the next release.

## Rules and limits

Enforced when installing, editing and building, so a theme can never load or run anything:

- CSS may not contain `url(`, `@import`, `expression(`, `javascript:`, `behavior:`, `-moz-binding`, `</style`, or backslash escapes.
- No fonts from the web: only fonts installed on the user's machine.
- Theme files are at most 100 KB; `css` at most 20 000 characters.
- Unknown keys in `colors` or `radius` are errors (typos don't fail silently).

The errors are listed in [Troubleshooting > Themes](troubleshooting.md#themes).
