/*
 * Better Deezer — core runtime.
 * All files in src/core and src/features are concatenated (in name order)
 * inside one IIFE by scripts/build.mjs. They share the `BD` object.
 */
const BD = {
  version: "__BD_VERSION__",
  target: "__BD_TARGET__", // "extension" | "desktop"
  features: [],
  health: {},
  debug: false
};

try {
  BD.debug = localStorage.getItem("bd:debug") === "1";
} catch {}

BD.log = (...args) => BD.debug && console.info("[Better Deezer]", ...args);
BD.warn = (...args) => console.warn("[Better Deezer]", ...args);

/** Persisted settings. localStorage works in both the extension (page origin) and desktop. */
BD.settings = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(`bd:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`bd:${key}`, JSON.stringify(value));
    } catch {}
  }
};

BD.isVisible = (el) => {
  if (!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = getComputedStyle(el);
  return s.visibility !== "hidden" && s.display !== "none";
};

/** Set a data-bd marker only if it changed (avoids MutationObserver feedback loops). */
BD.mark = (el, value, attr = "data-bd") => {
  if (el && el.getAttribute(attr) !== value) el.setAttribute(attr, value);
};

BD.unmarkAll = (value, keep, attr = "data-bd") => {
  document.querySelectorAll(`[${attr}="${value}"]`).forEach((el) => {
    if (el !== keep) el.removeAttribute(attr);
  });
};

/**
 * Register a feature.
 *  id      unique name, also the settings key (`bd:feature:<id>` = false disables it)
 *  setup   runs once at boot
 *  update  runs on every (throttled) DOM change; must be idempotent and cheap
 */
BD.feature = (def) => BD.features.push(def);

BD.isEnabled = (id) => BD.settings.get(`feature:${id}`, true) !== false;
