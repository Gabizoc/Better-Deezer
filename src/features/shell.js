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
    }
    if (dock) BD.mark(dock, "dock");
    if (topbar) BD.mark(topbar, "topbar");
    if (page) BD.mark(page, "page");

    const group = BD.anchors.searchGroup();
    if (group) {
      BD.mark(group, "search-field-group");
      // The results popover takes the field's width, so Popper's "bottom" placement lines them up.
      const w = `${Math.round(group.getBoundingClientRect().width)}px`;
      if (w !== "0px" && document.documentElement.style.getPropertyValue("--bd-search-w") !== w) {
        document.documentElement.style.setProperty("--bd-search-w", w);
      }
    }
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
