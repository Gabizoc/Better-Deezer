/* Consistent tooltips for the dock's icon-only buttons, from their aria-label. */
BD.feature({
  id: "tooltips",
  setup() {
    let tip = null;
    const hide = () => {
      tip?.remove();
      tip = null;
    };
    const show = (el) => {
      const label = el.getAttribute("aria-label");
      if (!label) return;
      hide();
      tip = document.createElement("div");
      tip.className = "bd-tooltip";
      tip.textContent = label;
      document.body.appendChild(tip);
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2))}px`;
      tip.style.top = `${r.top - t.height - 8}px`;
    };
    const target = (e) => e.target.closest?.('[data-bd="dock"] button[aria-label]');

    document.addEventListener("pointerover", (e) => {
      const el = target(e);
      if (el) {
        el.removeAttribute("title");
        show(el);
      }
    });
    document.addEventListener("pointerout", (e) => target(e) && hide());
    document.addEventListener("focusin", (e) => {
      const el = target(e);
      el ? show(el) : hide();
    });
  }
});
