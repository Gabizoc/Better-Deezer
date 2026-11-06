/*
 * Ambient header: on album / playlist / artist pages, tint the header with a
 * flat color sampled from the cover. The 18% mix into the ground happens in CSS
 * (--bd-ambient in 00-tokens.css) so it follows the light and dark themes. No gradient.
 */
BD.feature({
  id: "ambient",
  label: ["En-têtes teintés par la pochette", "Headers tinted by the cover"],
  setup() {
    this.lastSrc = null;
  },
  update() {
    const page = BD.anchors.page();
    if (!page) return;
    const isDetail = /\/(album|playlist|artist)\//.test(location.pathname + location.hash);
    const header = isDetail ? page.querySelector("header") || page.querySelector("h1")?.closest("section, div") : null;

    BD.unmarkAll("page-header", header);
    if (!header) return;
    BD.mark(header, "page-header");

    const img = header.querySelector("img");
    if (!img || !img.complete || img.src === this.lastSrc) return;
    this.lastSrc = img.src;

    try {
      const c = document.createElement("canvas");
      c.width = c.height = 8;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      const n = d.length / 4;
      const avg = (v) => Math.round(v / n);
      document.documentElement.style.setProperty("--bd-ambient-src", `rgb(${avg(r)}, ${avg(g)}, ${avg(b)})`);
    } catch {
      // Cross-origin cover without CORS headers: keep the neutral surface.
      document.documentElement.style.removeProperty("--bd-ambient-src");
    }
  }
});
