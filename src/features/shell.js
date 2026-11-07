/* Tag the structural pieces so the CSS can style them. */
BD.feature({
  id: "shell",
  update() {
    // Deezer toggles the rail by setting --layout-sidebar-width inline on its layout
    // root: an attribute change the main (childList) observer does not see.
    const root = BD.anchors.layoutRoot();
    if (root && root !== this.observedRoot) {
      this.observedRoot = root;
      this.rootObserver?.disconnect();
      this.rootObserver = new MutationObserver(() => BD.schedule?.());
      this.rootObserver.observe(root, { attributes: true, attributeFilter: ["style", "class"] });
    }

    const rail = BD.anchors.rail();
    const dock = BD.anchors.dock();
    const topbar = BD.anchors.topbar();
    const page = BD.anchors.page();

    BD.unmarkAll("rail", rail);
    BD.unmarkAll("dock", dock);
    if (rail) {
      BD.mark(rail, "rail");
      BD.mark(rail, String(BD.anchors.railCollapsed()), "data-bd-collapsed");
      this.markActiveLinks(rail);
      this.markSticky(rail);
    }
    if (dock) BD.mark(dock, "dock");
    if (topbar) BD.mark(topbar, "topbar");
    if (page) BD.mark(page, "page");

    const group = BD.anchors.searchGroup();
    if (group) BD.mark(group, "search-field-group");

    const banner = BD.anchors.signupBanner();
    if (banner) BD.mark(banner, "signup-banner");
  },

  /**
   * Sticky headers inside the rail ("Library", "Playlists") need an opaque
   * background or the list scrolls visibly under them. Computed styles are
   * costly: scan at most once a second.
   */
  markSticky(rail) {
    const now = Date.now();
    if (this.stickyScan && now - this.stickyScan < 1000) return;
    this.stickyScan = now;
    rail.querySelectorAll("div, header, h2, p").forEach((el) => {
      if (getComputedStyle(el).position === "sticky") BD.mark(el, "rail-sticky", "data-bd-role");
    });
  },

  /** Deezer swaps icons for the active page but sets no aria-current: derive it from the URL. */
  markActiveLinks(rail) {
    const path = location.pathname.replace(/\/$/, "");
    rail.querySelectorAll("a[href]").forEach((a) => {
      let href;
      try {
        href = new URL(a.href, location.href).pathname.replace(/\/$/, "");
      } catch {
        return;
      }
      const isLogo = a.matches('[aria-label="Deezer logo"]') || !a.textContent.trim() && !a.querySelector("svg[data-testid$='Icon'], img");
      const active = !isLogo && (path === href || (href.split("/").length > 2 && path.startsWith(`${href}/`) && !/^\/[a-z]{2}$/.test(href)));
      BD.mark(a, String(active), "data-bd-active");
    });
  }
});

/*
 * Sidebar entries: choose which of Deezer's navigation links the rail shows
 * (Settings > Appearance > Sidebar). Only the icon links are concerned (Home,
 * Explore and the Library ones), never the pinned items or the playlists list.
 * By default the Library links are hidden: Favourite tracks, playlists, albums,
 * artists and podcasts stay one click away from the profile and the library page.
 */
BD.railNav = {
  /** key -> [fr, en, test on the path after the language segment]. Order = rail order. */
  items: {
    home: ["Accueil", "Home", (p) => p === ""],
    explore: ["Explorer", "Explore", (p) => p.startsWith("channels/explore")],
    loved: ["Coups de cœur", "Favourite tracks", (p) => p === "library/loved"],
    playlists: ["Playlists", "Playlists", (p) => p === "library/playlists"],
    albums: ["Albums", "Albums", (p) => p === "library/albums"],
    artists: ["Artistes", "Artists", (p) => p === "library/artists"],
    podcasts: ["Podcasts", "Podcasts", (p) => p === "library/podcasts" || p === "library/shows"]
  },
  defaultHidden: ["loved", "playlists", "albums", "artists", "podcasts"],

  hidden() {
    return new Set(BD.settings.get("rail:hidden", this.defaultHidden));
  },

  setVisible(key, visible) {
    const set = this.hidden();
    visible ? set.delete(key) : set.add(key);
    BD.settings.set("rail:hidden", [...set]);
    BD.schedule?.();
  },

  /** Which entry a rail link is, or null. Nav links are `a > svg[data-testid$=Icon] + heading`. */
  keyOf(a) {
    if (!a.querySelector(':scope > svg[data-testid$="Icon"]')) return null;
    let path;
    try {
      path = new URL(a.href, location.href).pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i, "").replace(/^\/|\/$/g, "");
    } catch {
      return null;
    }
    for (const [key, [, , test]] of Object.entries(this.items)) if (test(path)) return key;
    return null;
  }
};

BD.feature({
  id: "rail-nav",
  live: true,

  update() {
    const rail = BD.q('[data-bd="rail"]');
    if (!rail) return;
    const hidden = BD.railNav.hidden();
    const groups = new Set();
    rail.querySelectorAll("a[href]").forEach((a) => {
      const key = BD.railNav.keyOf(a);
      if (!key) return;
      BD.mark(a, key, "data-bd-nav");
      BD.mark(a, String(hidden.has(key)), "data-bd-nav-hidden");
      groups.add(a.parentElement);
    });
    // A Library block with every link hidden goes too (its "Library" title and shuffle button).
    groups.forEach((list) => {
      const links = BD.qa(":scope > [data-bd-nav]", list);
      const block = list.parentElement;
      const empty = links.length > 0 && links.every((a) => a.getAttribute("data-bd-nav-hidden") === "true");
      const own = block && block !== rail && !BD.q('[data-bd-nav="home"]', block) && BD.qa("[data-bd-nav]", block).length === links.length;
      if (own) BD.mark(block, String(empty), "data-bd-nav-hidden");
      else BD.mark(list, String(empty), "data-bd-nav-hidden");
    });
  },

  teardown() {
    BD.qa("[data-bd-nav-hidden]").forEach((el) => el.removeAttribute("data-bd-nav-hidden"));
  }
});
