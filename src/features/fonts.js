/* Load the two typefaces. If the page's CSP blocks Google Fonts, the
 * fallback stacks in 00-tokens.css (Segoe UI Variable) take over.
 * TODO (HANDOFF): vendor the woff2 files (both are SIL OFL) to drop the network call. */
BD.feature({
  id: "fonts",
  setup() {
    if (document.getElementById("bd-fonts")) return;
    const link = document.createElement("link");
    link.id = "bd-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
});
