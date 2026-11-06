/*
 * Consistent tooltips for the dock's icon-only buttons, from their aria-label,
 * plus a short usage tip where Better Deezer adds a gesture (wheel, shortcuts).
 * Some Deezer labels are raw ids ("volume button", "open queuelist"): replaced.
 */
BD.feature({
  id: "tooltips",
  label: ["Infobulles avec astuces", "Tooltips with tips"],

  /** By data-testid prefix: [label fr, label en, tip fr, tip en]. */
  hints: {
    volume_button: ["Volume", "Volume", "Clic : régler · Molette : ±5 % · Alt+clic : muet", "Click: adjust · Wheel: ±5% · Alt+click: mute"],
    queue_list_button: ["File d'attente", "Queue"],
    lyrics_button: ["Paroles", "Lyrics"],
    audio_settings_button: ["Réglages audio", "Audio settings"],
    progress_bar: [null, null, "Molette : ±5 s · Maj+molette : ±15 s", "Wheel: ±5 s · Shift+wheel: ±15 s"]
  },

  describe(el) {
    const testid = el.getAttribute("data-testid") || "";
    const key = Object.keys(this.hints).find((k) => testid.startsWith(k));
    const h = key ? this.hints[key] : [];
    const label = BD.t(h[0], h[1]) || el.getAttribute("aria-label") || "";
    const tip = BD.isEnabled("tips") ? BD.t(h[2], h[3]) : null;
    return { label, tip };
  },

  setup() {
    let tip = null;
    const hide = () => {
      tip?.remove();
      tip = null;
    };
    const show = (el) => {
      const { label, tip: hint } = this.describe(el);
      if (!label && !hint) return;
      hide();
      tip = BD.h("div", { class: "bd-tooltip", role: "tooltip" }, label ? BD.h("strong", {}, label) : null, hint ? BD.h("span", {}, hint) : null);
      document.body.appendChild(tip);
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2))}px`;
      tip.style.top = `${Math.max(8, r.top - t.height - 10)}px`;
    };
    const target = (e) => e.target.closest?.('[data-bd="dock"] button[aria-label], [data-bd="dock"] [data-testid="progress_bar"]');

    document.addEventListener("pointerover", (e) => {
      const el = target(e);
      if (el) {
        el.removeAttribute("title");
        show(el);
      }
    });
    document.addEventListener("pointerout", (e) => target(e) && hide());
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("focusin", (e) => {
      const el = target(e);
      el ? show(el) : hide();
    });
  }
});

BD.feature({ id: "tips", label: ["Afficher les astuces dans les infobulles", "Show tips in tooltips"] });
