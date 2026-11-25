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

/**
 * The route path of a URL ("/fr/album/123"). The website routes on the path, but
 * the desktop app loads https://www.deezer.com/fr/ and routes on the hash
 * ("#/fr/album/123"): there the path is "/fr/" on every page and every rail link.
 * Always read routes through this, never `location.pathname`.
 */
BD.path = (url = location.href) => {
  try {
    const u = new URL(url, location.href);
    return u.hash.startsWith("#/") ? u.hash.slice(1).split("?")[0] : u.pathname;
  } catch {
    return "";
  }
};
/** Prefix for links we build ourselves: "#" in the hash-routed desktop app, "" on the website. */
BD.routePrefix = () => (location.hash.startsWith("#/") ? "#" : "");

BD.log = (...args) => BD.debug && console.info("[Better Deezer]", ...args);
BD.warn = (...args) => console.warn("[Better Deezer]", ...args);

/** Tiny event bus: "settings" (key, value), "theme" (resolved theme). */
BD.listeners = {};
BD.on = (type, fn) => (BD.listeners[type] ||= []).push(fn);
BD.emit = (type, ...args) =>
  (BD.listeners[type] || []).forEach((fn) => {
    try {
      fn(...args);
    } catch (err) {
      BD.warn(`listener for "${type}" failed:`, err);
    }
  });

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
    BD.emit("settings", key, value);
  }
};

/**
 * UI language. French and English are written in the code: BD.t("Français", "English").
 * Other languages come from src/i18n/<code>.json, keyed by the English text (the build
 * puts them in __BD_I18N__). Settings > Appearance > Language overrides the automatic
 * choice, which follows Deezer's page language, then the browser's.
 */
BD.i18n = typeof __BD_I18N__ !== "undefined" ? __BD_I18N__ : {};
BD.languages = () => [
  ["fr", "Français"],
  ["en", "English"],
  ...Object.entries(BD.i18n).map(([code, table]) => [code, table._name || code])
];
BD.lang = () => {
  const supported = BD.languages().map(([code]) => code);
  const chosen = BD.settings.get("lang", "auto");
  if (chosen !== "auto" && supported.includes(chosen)) return chosen;
  for (const raw of [document.documentElement.lang, navigator.language, ...(navigator.languages || [])]) {
    const code = String(raw || "").toLowerCase().split(/[-_]/)[0];
    if (supported.includes(code)) return code;
  }
  return "en";
};
/** BCP 47 locale for dates and numbers. */
BD.locale = () => ({ fr: "fr-FR", en: "en-GB", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-BR", nl: "nl-NL" })[BD.lang()] || undefined;
/**
 * BD.t("Bonjour {name}", "Hello {name}", { name }) — {placeholders} are filled from `vars`
 * in every language, so translations keep them as they are.
 */
BD.t = (fr, en, vars) => {
  const lang = BD.lang();
  let text = lang === "fr" ? fr : lang === "en" ? en : (BD.i18n[lang] && BD.i18n[lang][en]) || en;
  if (vars) text = String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return text;
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

/** Small DOM builder for our own UI: BD.h("button", { class: "x", onclick }, "text", child). */
BD.h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
};

/**
 * Register a feature.
 *  id           unique name, also the settings key (`bd:feature:<id>` = false disables it)
 *  label        [fr, en] shown in the Better Deezer settings panel (omit to hide the toggle)
 *  description  [fr, en] optional longer text under the label
 *  module       true to list it in Settings > Modules, with `glyph` (an SVG path, 24×24, stroked)
 *  live         true if it can be switched on/off without reloading (needs `teardown` when it leaves traces)
 *  setup        runs once, the first time the feature is on
 *  update       runs on every (throttled) DOM change; must be idempotent and cheap
 *  teardown     undoes setup/update when the feature is switched off (live features)
 *
 * Avoid other property names that could clash with these (e.g. a method called `label`).
 */
BD.feature = (def) => BD.features.push(def);

/** Features that are off until the user turns them on (opt-in modules). */
BD.defaultOff = new Set();
BD.isEnabled = (id) => BD.settings.get(`feature:${id}`, !BD.defaultOff.has(id)) !== false;

/**
 * Extra tabs for the settings panel, registered by feature files:
 *   BD.settingsTab({ id, order, label: [fr, en], render(ui) => Node[] })
 * `ui` is the settings feature (helpers: section, row, toggle, segmented, ...).
 */
BD.settingsTabs = [];
BD.settingsTab = (tab) => BD.settingsTabs.push(tab);
