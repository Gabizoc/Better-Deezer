# Modules

Modules are optional extras, a bit like Spicetify's extensions. Turn them on and off in *Settings > Modules*: each one applies at once, without reloading.

| Module | Default | What it does | Network |
| --- | --- | --- | --- |
| **Now playing + synced lyrics** | on | `F` or the button in the player bar: full-window view with the big cover on the left and lyrics on the right that scroll with the music: the current line fills at singing pace and instrumental breaks show three dots that light up until the voice comes back. Click a line to jump there; click or drag the seek bar (arrows ±5 s). Blurred cover in the background, play / previous / next and a seek bar. `Esc` closes. | `lrclib.net`: title, artist, duration of the current track, only while the view is open |
| **Smooth transitions** | on | Pages fade in, the player bar cover cross-fades on track change, cards lift on hover. Skipped when your system asks for reduced motion. | none |
| **Hide promotional banners** | on | Hides "Go Premium" and "Sign up" banners, ad slots and sponsored playlists. Visual only. | none |
| **Sleep timer** | on | 15 / 30 / 45 / 60 minutes or *End of track*, from the module's card. A badge with the countdown sits in the player bar (click it to cancel). The volume fades over the last minute, Deezer pauses, then the volume is put back. | none |
| **Accent color from the cover** | off | The accent (play button, seek bar, switches, playing track) takes the main color of the playing cover, lightened or darkened until it reads well on the theme's background. | none (Deezer's image CDN) |
| **Compact mode** | off | Smaller player bar, tighter spacing, smaller page headers. | none |

## Lyrics

Two sources, chosen in *Settings > Playback & volume > Lyrics*:

1. **Deezer** (default): Deezer's own lyrics, through your Deezer session, exactly like Deezer's lyrics button. Many tracks are synced **word by word**: each word lights up when it is sung. Others are synced line by line with each line's real length.
2. **[LRCLIB](https://lrclib.net)**, when Deezer has none (or with *LRCLIB only*): a free, open, community-run database. Better Deezer asks for the exact title, artist and duration first, then searches and keeps the closest version (within 8 seconds of the track's length, synced lyrics preferred). Line timings only: the line fills at an estimated singing pace.

The source is shown under the lyrics (*Lyrics: Deezer, word by word*, *Lyrics: Deezer*, *Lyrics: LRCLIB*).

Missing or wrong lyrics can be added or fixed by anyone on lrclib.net, and then show up for everybody.

## Write a module

A module is a feature file in `src/features/` with `module: true`. Minimal example, `src/features/hello.js`:

```js
/*
 * Hello: shows the playing title in the window title.
 */
BD.defaultOff.add("hello"); // opt-in: remove this line to have it on by default
BD.feature({
  id: "hello",
  module: true,
  live: true, // can be switched on/off without reloading
  glyph: "M4 12h16M12 4v16", // 24×24 SVG path, drawn with a stroke
  label: ["Titre dans l'onglet", "Title in the tab"],
  description: ["Le titre en cours dans le nom de l'onglet.", "The playing title in the tab name."],

  setup() {
    this.original = document.title;
  },

  update() {
    // Runs after every DOM change (throttled to one per frame): keep it cheap and idempotent.
    const title = BD.q('[data-bd="dock"] [data-testid="item_title"]')?.textContent.trim();
    const next = title ? `♪ ${title}` : this.original;
    if (document.title !== next) document.title = next;
  },

  teardown() {
    // Undo everything setup/update did: switching the module off must leave no trace.
    document.title = this.original;
  }
});
```

Run `npm run build`, reload the extension, and it appears in *Settings > Modules*.

Rules (the same as everywhere in Better Deezer, see [HANDOFF.md](../HANDOFF.md)):

- **Find Deezer's elements through `BD.anchors` or `data-testid` / ARIA**, never through `css-xxxx` class names.
- **Never move or remove Deezer's nodes**: React owns them. Tag them (`BD.mark(el, "value", "data-bd-…")`) and style the tag, or insert your own elements next to them.
- Your own UI: build it with `BD.h(tag, props, ...children)`, class names prefixed `bd-`, colors from the `--bd-*` variables so every theme applies.
- Text in both languages: `BD.t("Français", "English")`.
- Persist with `BD.settings.get(key, fallback)` / `BD.settings.set(key, value)` (stored as `bd:<key>`).
- Network: only if the module's purpose needs it, `credentials: "omit"`, a timeout, and say what is sent in its `description` and in [Privacy](privacy.md).
- Errors are caught: a module that throws is switched off for the session and named in the console, the rest keeps working.
- Add a check to `test/smoke.mjs` (the fixture is `test/fixture.html`).
