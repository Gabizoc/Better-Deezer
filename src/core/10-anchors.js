/*
 * Anchors: the ONLY place that knows how to find Deezer's elements.
 *
 * Rules (see HANDOFF.md):
 *  - Prefer data-testid, ids, ARIA roles/labels. Never generated `css-xxxx` classes.
 *  - Each anchor lists fallbacks from most to least stable.
 *  - When Deezer ships an update and something breaks, fix it HERE, nowhere else.
 *  - `BD.health` records which anchors resolved, readable via __betterDeezer.health().
 */
BD.anchors = {
  topbar: () => document.querySelector("#page_topbar") || document.querySelector('header[role="banner"]'),

  page: () =>
    document.querySelector("#page_content") ||
    document.querySelector("main") ||
    document.querySelector('[role="main"]'),

  searchField: () => document.querySelector('[data-testid="search_field"]'),
  searchContainer: () => document.querySelector('[data-testid="search_container"]'),

  searchPopover: () => {
    const container = BD.anchors.searchContainer();
    const id = container?.getAttribute("aria-controls");
    const byId = id ? document.getElementById(id) : null;
    return byId || document.querySelector('[data-testid="search_popper"]');
  },

  volumeButton: () => document.querySelector('[data-testid^="volume_button"]'),
  volumeInput: () => document.querySelector('[data-testid="volume_menu_bar"]'),

  /** The rail: walk up from a known nav link until we hit the fixed left column. */
  rail: () => {
    const seeds = [
      document.querySelector('nav a[href$="/library"], nav a[href*="/library/"]'),
      document.querySelector('[data-testid="HouseFilledIcon"]'),
      [...document.querySelectorAll("button[aria-label]")].find((b) =>
        /barre latérale|sidebar/i.test(b.getAttribute("aria-label"))
      )
    ].filter(Boolean);

    for (const seed of seeds) {
      for (let el = seed; el && el !== document.body; el = el.parentElement) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (
          (s.position === "fixed" || s.position === "sticky") &&
          r.left <= 16 &&
          r.width >= 56 &&
          r.width <= 360 &&
          r.height >= innerHeight * 0.6
        ) {
          return el;
        }
      }
    }
    return null;
  },

  /** The player: smallest bottom-anchored wide box containing play + progress. */
  dock: () => {
    const play = document.querySelector('[data-testid="play_button_play"], [data-testid="play_button_pause"]');
    if (!play) return null;
    for (let el = play.parentElement; el && el !== document.body; el = el.parentElement) {
      const r = el.getBoundingClientRect();
      const hasProgress = el.querySelector('[data-testid="progress_bar"]');
      if (
        hasProgress &&
        r.width >= innerWidth * 0.5 &&
        r.height >= 48 &&
        r.height <= 160 &&
        r.bottom >= innerHeight - 24
      ) {
        return el;
      }
    }
    return document.querySelector('[data-testid="player"]') || null;
  }
};

/** Resolve every anchor once and record which ones work. */
BD.checkHealth = () => {
  for (const [name, find] of Object.entries(BD.anchors)) {
    let ok = false;
    try {
      ok = Boolean(find());
    } catch {}
    BD.health[name] = ok;
  }
  return BD.health;
};
