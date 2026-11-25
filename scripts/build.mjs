// Build Better Deezer with zero dependencies (Node >= 18).
//   node scripts/build.mjs
// Outputs:
//   dist/extension/           unpacked MV3 extension (Chrome, Edge, Brave, Opera; Firefox via manifest tweak)
//   dist/better-deezer.user.js single payload (CSS embedded) used by the desktop launcher and userscript managers
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const read = (p) => readFileSync(join(root, p), "utf8");
const list = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => !f.startsWith("."))
    .sort()
    .map((f) => `${dir}/${f}`);

const css = list("src/styles").map((f) => `/* ${f} */\n${read(f)}`).join("\n");
const js = (target) =>
  [...list("src/core"), ...list("src/features"), "src/main.js"]
    .map((f) => `// ---- ${f}\n${read(f)}`)
    .join("\n")
    .replaceAll("__BD_VERSION__", pkg.version)
    .replaceAll("__BD_TARGET__", target);

// ---------- Themes ----------
// The validator is the runtime one (src/core/30-themes.js), run here with a stub BD,
// so the repository and the app agree on what a valid theme is.
const themeKit = { settings: { get: (_k, fallback) => fallback }, emit() {}, theme: {} };
new Function("BD", "__BD_THEMES__", read("src/core/30-themes.js"))(themeKit, { builtin: [], community: [] });
const { themeSchema } = themeKit;

// Default palettes (00-tokens.css): a theme's missing colors fall back to them.
const tokensCss = read("src/styles/00-tokens.css");
const paletteOf = (selector) => {
  const block = tokensCss.slice(tokensCss.indexOf(selector)).split("}")[0];
  return Object.fromEntries([...block.matchAll(/--bd-([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2].toLowerCase()]));
};
const defaults = { dark: paletteOf(':root,\nhtml[data-bd-theme="dark"]'), light: paletteOf('html[data-bd-theme="light"] {') };

const loadThemes = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const file = `${dir}/${f}`;
      const { ok, theme, errors } = themeSchema.validate(JSON.parse(read(file)));
      if (!ok) throw new Error(`${file}: ${errors.join("; ")}`);
      if (`${theme.id}.json` !== f) throw new Error(`${file}: the file name must be "${theme.id}.json"`);
      for (const mode of theme.modes) {
        const warnings = themeSchema.checkContrast({ ...defaults[mode], ...(theme.colors[mode] || {}) });
        if (warnings.length) throw new Error(`${file} (${mode}): low contrast: ${warnings.join("; ")}`);
      }
      return theme;
    });
// Graphite (the default) first, then by name.
const byName = (a, b) => (a.id === "graphite" ? -1 : b.id === "graphite" ? 1 : a.name.localeCompare(b.name));
const themes = { builtin: loadThemes("themes/builtin").sort(byName), community: loadThemes("themes/community"), defaults };
const ids = [...themes.builtin, ...themes.community].map((t) => t.id);
const dup = ids.find((id, i) => ids.indexOf(id) !== i);
if (dup) throw new Error(`theme id "${dup}" is used twice`);
// Community registry read by the Marketplace (Settings > Themes). Generated: do not edit by hand.
writeFileSync(
  join(root, "themes/index.json"),
  JSON.stringify({ schema: 1, generated: "by scripts/build.mjs from themes/community, do not edit", themes: themes.community }, null, 2) + "\n"
);

// Translations beyond French and English (src/i18n/<code>.json, keyed by the English text).
// A translation must keep every {placeholder} of its English key.
const i18n = Object.fromEntries(
  readdirSync(join(root, "src/i18n"))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const table = JSON.parse(read(`src/i18n/${f}`));
      for (const [en, text] of Object.entries(table)) {
        if (en === "_name") continue;
        const need = (en.match(/\{\w+\}/g) || []).sort().join();
        const have = (String(text).match(/\{\w+\}/g) || []).sort().join();
        if (need !== have) throw new Error(`src/i18n/${f}: "${en}" must keep ${need || "no placeholder"}, has ${have || "none"}`);
      }
      return [f.replace(/\.json$/, ""), table];
    })
);

// Vendored fonts (SIL OFL): files for the extension, base64 for the single-file payload.
const fonts = JSON.parse(read("assets/fonts/fonts.json"));
const fontsFor = (embed) =>
  fonts.map((f) => (embed ? { ...f, data: readFileSync(join(root, "assets/fonts", f.file)).toString("base64") } : f));

const iife = (body, withCss, embedFonts) =>
  `/*! Better Deezer v${pkg.version} | MIT | https://github.com/Gabizoc/Better-Deezer\n` +
  ` *  Fonts: Bricolage Grotesque, Instrument Sans (SIL Open Font License 1.1) */\n(() => {\n"use strict";\n` +
  (withCss ? `const __BD_CSS__ = ${JSON.stringify(css)};\n` : "") +
  `const __BD_FONTS__ = ${JSON.stringify(fontsFor(embedFonts))};\n` +
  `const __BD_THEMES__ = ${JSON.stringify(themes)};\n` +
  `const __BD_I18N__ = ${JSON.stringify(i18n)};\n` +
  `${body}\n})();\n`;

rmSync(join(root, "dist"), { recursive: true, force: true });

// Extension
const ext = join(root, "dist/extension");
mkdirSync(ext, { recursive: true });
cpSync(join(root, "extension"), ext, { recursive: true });
const manifest = JSON.parse(readFileSync(join(ext, "manifest.json"), "utf8"));
manifest.version = pkg.version;
mkdirSync(join(ext, "fonts"), { recursive: true });
for (const f of readdirSync(join(root, "assets/fonts"))) {
  if (/\.(woff2|txt)$/.test(f)) cpSync(join(root, "assets/fonts", f), join(ext, "fonts", f));
}
writeFileSync(join(ext, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(ext, "better-deezer.css"), css);
writeFileSync(join(ext, "better-deezer.js"), iife(js("extension"), false, false));

// Single-file payload (desktop + userscript)
const header = `// ==UserScript==
// @name         Better Deezer
// @version      ${pkg.version}
// @match        https://www.deezer.com/*
// @exclude      https://www.deezer.com/explore/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
`;
writeFileSync(join(root, "dist/better-deezer.user.js"), header + iife(js("desktop"), true, true));

console.log(`Better Deezer ${pkg.version} built -> dist/ (${themes.builtin.length} built-in themes, ${themes.community.length} community)`);
