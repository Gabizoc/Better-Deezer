/*
 * Tag content blocks (section titles, cards, track rows) inside the page.
 * Heuristics rely on semantics (headings, role="row", item_cover) rather than classes.
 */
BD.feature({
  id: "content",
  update() {
    const page = BD.anchors.page();
    if (!page) return;

    // Page title: the first h1 of the page.
    const h1 = page.querySelector("h1");
    if (h1) BD.mark(h1, "page-title", "data-bd-role");

    // Section titles: h2 directly heading a carousel or grid.
    page.querySelectorAll("h2").forEach((h2) => BD.mark(h2, "section-title", "data-bd-role"));

    // Track rows: ARIA rows that contain a title cell.
    page.querySelectorAll('[role="row"]').forEach((row) => {
      if (!row.querySelector('[data-testid="title"], [role="gridcell"], [role="cell"]')) return;
      BD.mark(row, "track-row", "data-bd-role");
    });

    // Cards: the clickable ancestor (<a> or [role=group]) of each cover outside of rows.
    page.querySelectorAll('[data-testid="item_cover"]').forEach((cover) => {
      if (cover.closest('[role="row"]')) return;
      const card = cover.closest('[role="group"], li, figure');
      if (card && card !== page) BD.mark(card, "card", "data-bd-role");
    });
  }
});

/* Highlight the row that is currently playing, using the dock's title as truth. */
BD.feature({
  id: "now-playing",
  update() {
    const dock = document.querySelector('[data-bd="dock"]');
    const current = dock?.querySelector('[data-testid="item_title"], [data-testid="title"]')?.textContent?.trim();
    document.querySelectorAll('[data-bd-role="track-row"]').forEach((row) => {
      const title = row.querySelector('[data-testid="title"]')?.textContent?.trim();
      const playing = Boolean(current && title && title === current);
      BD.mark(row, String(playing), "data-bd-playing");
    });
  }
});
