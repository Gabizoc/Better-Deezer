/*
 * Volume: an always-visible inline slider in the dock, driven through Deezer's
 * own range input (data-testid="volume_menu_bar") so the app keeps its state.
 * Mouse wheel over the slider or the volume button changes the volume.
 * Ported from the original "Deezer Tweaks" extension.
 */
BD.feature({
  id: "volume",
  step: 5,

  /** Deezer only mounts its range input while the hover menu is open. */
  openNativeMenu(button) {
    if (!button || BD.anchors.volumeInput()) return;
    const r = button.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    const Ctor = window.PointerEvent || MouseEvent;
    for (const type of ["pointerover", "pointerenter", "mouseover", "mouseenter"]) {
      button.dispatchEvent(new Ctor(type, { ...init, pointerType: "mouse" }));
    }
  },

  writeNative(input, ratio) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, String(min + (max - min) * ratio));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  },

  readRatio() {
    const input = BD.anchors.volumeInput();
    if (input) {
      const min = Number(input.min || 0);
      const max = Number(input.max || 100);
      if (max > min) return (Number(input.value) - min) / (max - min);
    }
    return BD.settings.get("volume", 1);
  },

  setRatio(ratio) {
    const next = Math.max(0, Math.min(1, ratio));
    BD.settings.set("volume", next);
    this.paint(next);
    const button = BD.anchors.volumeButton();
    const started = Date.now();
    const apply = () => {
      const input = BD.anchors.volumeInput();
      if (input) return this.writeNative(input, next);
      if (Date.now() - started > 1000) return;
      this.openNativeMenu(button);
      setTimeout(apply, 80);
    };
    apply();
  },

  paint(ratio) {
    const range = document.querySelector(".bd-volume-input");
    if (!range) return;
    const pct = Math.round(ratio * 100);
    range.value = String(pct);
    range.style.setProperty("--bd-volume", `${pct}%`);
  },

  update() {
    const button = BD.anchors.volumeButton();
    if (!button || button.closest(".bd-volume")) return;

    const wrap = document.createElement("span");
    wrap.className = "bd-volume";
    const range = document.createElement("input");
    range.className = "bd-volume-input";
    range.type = "range";
    range.min = "0";
    range.max = "100";
    range.step = "1";
    range.setAttribute("aria-label", "Volume");

    button.parentNode.insertBefore(wrap, button);
    wrap.append(button, range);
    document.documentElement.setAttribute("data-bd-volume", "inline");
    this.paint(this.readRatio());

    range.addEventListener("input", (e) => {
      e.stopPropagation();
      this.setRatio(Number(range.value) / 100);
    });

    wrap.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dir = e.deltaY < 0 ? 1 : -1;
        this.setRatio(Number(range.value) / 100 + (dir * this.step) / 100);
      },
      { passive: false }
    );
  }
});
