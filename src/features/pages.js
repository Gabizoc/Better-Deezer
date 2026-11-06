/*
 * Page rework, borrowing what works in other players (Apple Music, Spotify, Tidal):
 *  - album / playlist / artist: large tinted header, big display title, cover
 *    with depth; quiet track list where the heart and "more" only show on hover
 *    (or when the track is liked), popularity as a thin bar, and an optional
 *    "Hide explicit tracks" filter next to the play button;
 *  - home: a greeting by time of day and sections you can hide (Settings > Home).
 * Everything is tagged here and styled in styles/30-content.css.
 */
BD.feature({
  id: "pages",
  label: ["Pages album / artiste retravaillées", "Reworked album / artist pages"],

  update() {
    this.masthead();
    this.trackList();
    this.explicitFilter();
  },

  masthead() {
    const head = BD.anchors.masthead();
    if (!head) return;
    const title = BD.q("h1, h2", head);
    if (title) {
      BD.mark(title, "page-title", "data-bd-role");
      // Long titles get a smaller size, like Apple Music.
      const len = title.textContent.trim().length;
      BD.mark(title, len > 40 ? "xl" : len > 22 ? "l" : "m", "data-bd-len");
    }
    const cover = BD.q('[data-testid$="-cover"], [data-testid="cover"]', head);
    if (cover) {
      BD.mark(cover, "page-cover", "data-bd-role");
      // Artists and profiles get a round picture, like most players.
      BD.mark(cover, String(/\/(artist|profile)\//.test(location.pathname)), "data-bd-round");
    }
  },

  trackList() {
    const grid = BD.anchors.trackGrid();
    if (!grid) return;
    BD.mark(grid, "track-grid", "data-bd-role");
    // Popularity "x / 10": thin bar instead of five ticks.
    BD.qa('[data-testid="popularity"]', grid).forEach((el) => {
      if (el.hasAttribute("data-bd-pop")) return;
      const active = BD.qa('[data-testid="note-active"]', el).length;
      const total = active + BD.qa('[data-testid="note-inactive"]', el).length;
      const fromLabel = (el.getAttribute("aria-label") || "").match(/(\d+)\s*\/\s*(\d+)/);
      const ratio = fromLabel ? Number(fromLabel[1]) / Number(fromLabel[2]) : total ? active / total : 0;
      el.setAttribute("data-bd-pop", String(Math.round(ratio * 100)));
      el.style.setProperty("--bd-pop", `${Math.round(ratio * 100)}%`);
    });
    // Explicit rows, for the filter.
    BD.qa('[role="row"]', grid).forEach((row) => {
      const explicit = Boolean(BD.q('[data-testid="ExplicitIcon"], [aria-label="explicit_label"], [data-testid*="explicit" i]', row));
      if (explicit) BD.mark(row, "true", "data-bd-explicit");
    });
  },

  explicitFilter() {
    const toolbar = BD.anchors.pageToolbar();
    const grid = BD.anchors.trackGrid();
    const html = document.documentElement;
    const on = BD.settings.get("pages:hideExplicit", false);
    BD.mark(html, String(Boolean(on && grid)), "data-bd-hide-explicit");
    if (!toolbar || !grid || !BD.q('[data-bd-explicit="true"]', grid)) return;
    if (toolbar.parentElement.querySelector(".bd-explicit-toggle")) return;
    const button = BD.h(
      "button",
      {
        type: "button",
        class: "bd-chip bd-explicit-toggle",
        "aria-pressed": String(on),
        onclick: () => {
          const next = !BD.settings.get("pages:hideExplicit", false);
          BD.settings.set("pages:hideExplicit", next);
          button.setAttribute("aria-pressed", String(next));
        }
      },
      BD.t("Masquer les titres explicites", "Hide explicit tracks")
    );
    toolbar.after(button);
  }
});

/* Home: greeting + hideable sections (Settings > Home). */
BD.feature({
  id: "home",
  label: ["Accueil : salutation et sections masquables", "Home: greeting and hideable sections"],

  setup() {
    BD.home = { sections: () => this.sections().map((s) => s.title) };
  },

  isHome() {
    return /^\/([a-z]{2}(-[a-z]{2})?)?\/?$/i.test(location.pathname);
  },

  sections() {
    const page = BD.anchors.page();
    if (!page) return [];
    const blocks = BD.anchors.homeSections();
    const list = blocks.length
      ? blocks
      : BD.qa('[data-testid="section_title"]', page).map((t) => t.closest("section") || t.parentElement?.parentElement);
    return list
      .filter(Boolean)
      .map((el) => ({ el, title: this.titleOf(el) }))
      .filter((s) => s.title);
  },

  /** Section title without its "See all" button text. */
  titleOf(el) {
    const heading = BD.q('[data-testid="section_title"], h2', el);
    if (!heading) return "";
    const clone = heading.cloneNode(true);
    clone.querySelectorAll('[data-testid="section_title_cta"], [data-testid="section-title-subtitle"], button, a[role="button"]').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  },

  greeting() {
    const h = new Date().getHours();
    if (h < 5) return BD.t("Bonne nuit", "Good night");
    if (h < 12) return BD.t("Bonjour", "Good morning");
    if (h < 18) return BD.t("Bon après-midi", "Good afternoon");
    return BD.t("Bonsoir", "Good evening");
  },

  update() {
    const page = BD.anchors.page();
    if (!page) return;
    const home = this.isHome();
    const old = BD.q(".bd-greeting");
    if (!home) {
      old?.remove();
      return;
    }

    const hidden = new Set(BD.settings.get("home:hidden", []));
    const sections = this.sections();
    sections.forEach(({ el, title }) => {
      if (hidden.has(title)) BD.mark(el, "true", "data-bd-hidden");
      else if (el.hasAttribute("data-bd-hidden")) el.removeAttribute("data-bd-hidden");
    });

    const first = sections[0]?.el;
    if (!first) return;
    const name = (BD.q('[data-testid="topbar-profile"] img')?.getAttribute("alt") || "").trim();
    const text = name ? `${this.greeting()}, ${name}` : this.greeting();
    let greeting = old;
    if (!greeting || greeting.nextElementSibling !== first) {
      old?.remove();
      const date = new Date().toLocaleDateString(BD.lang() === "fr" ? "fr-FR" : undefined, { weekday: "long", day: "numeric", month: "long" });
      greeting = BD.h("div", { class: "bd-greeting" }, BD.h("p", { class: "bd-greeting-date" }, date), BD.h("h1", { class: "bd-greeting-title" }, text));
      first.before(greeting);
    }
    const title = BD.q(".bd-greeting-title", greeting);
    if (title.textContent !== text) title.textContent = text; // the avatar (name) may load later
    // Line up with the sections' titles, whatever padding Deezer gives them.
    const ref = BD.q('[data-testid="section_title"]', first);
    if (ref) {
      const pad = Math.max(0, Math.round(ref.getBoundingClientRect().left - greeting.getBoundingClientRect().left));
      if (greeting.style.paddingLeft !== `${pad}px`) greeting.style.paddingLeft = `${pad}px`;
    }
  }
});

/* Dock gestures: wheel over the cover seeks ±5 s, double-click on the title opens the album. */
BD.feature({
  id: "dock-gestures",
  label: ["Molette sur la pochette (±5 s), double-clic sur le titre (album)", "Wheel on cover (±5 s), double-click title (album)"],
  setup() {
    document.addEventListener(
      "wheel",
      (e) => {
        if (!e.target.closest?.('[data-bd="dock"] [data-testid="item_cover"]')) return;
        const input = BD.anchors.progressInput();
        const player = BD.features.find((f) => f.id === "player");
        if (!input || !player?.seek) return;
        e.preventDefault();
        player.seek(input, Number(input.value) + ((e.deltaY || e.deltaX) < 0 ? 1 : -1) * (e.shiftKey ? 15 : 5));
      },
      { capture: true, passive: false }
    );
    document.addEventListener("dblclick", (e) => {
      const title = e.target.closest?.('[data-bd="dock"] [data-testid="item_title"]');
      if (!title) return;
      const dock = title.closest('[data-bd="dock"]');
      const link = BD.q('a[href*="/album/"]', title) || BD.q('a[href*="/album/"]', dock);
      if (link) {
        e.preventDefault();
        link.click();
      }
    });
  }
});
