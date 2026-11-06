/* Tag the structural pieces so the CSS can style them. */
BD.feature({
  id: "shell",
  update() {
    const rail = BD.anchors.rail();
    const dock = BD.anchors.dock();
    const topbar = BD.anchors.topbar();
    const page = BD.anchors.page();

    BD.unmarkAll("rail", rail);
    BD.unmarkAll("dock", dock);
    if (rail) BD.mark(rail, "rail");
    if (dock) BD.mark(dock, "dock");
    if (topbar) BD.mark(topbar, "topbar");
    if (page) BD.mark(page, "page");

    const group = BD.anchors.searchField()?.closest('[data-group="true"], [role="group"]');
    if (group) BD.mark(group, "search-field-group");
  }
});
