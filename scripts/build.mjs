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

const iife = (body, withCss) =>
  `/*! Better Deezer v${pkg.version} | MIT | https://github.com/Gabizoc/Better-Deezer */\n(() => {\n"use strict";\n` +
  (withCss ? `const __BD_CSS__ = ${JSON.stringify(css)};\n` : "") +
  `${body}\n})();\n`;

rmSync(join(root, "dist"), { recursive: true, force: true });

// Extension
const ext = join(root, "dist/extension");
mkdirSync(ext, { recursive: true });
cpSync(join(root, "extension"), ext, { recursive: true });
const manifest = JSON.parse(readFileSync(join(ext, "manifest.json"), "utf8"));
manifest.version = pkg.version;
writeFileSync(join(ext, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(ext, "better-deezer.css"), css);
writeFileSync(join(ext, "better-deezer.js"), iife(js("extension"), false));

// Single-file payload (desktop + userscript)
const header = `// ==UserScript==
// @name         Better Deezer
// @version      ${pkg.version}
// @match        https://www.deezer.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
`;
writeFileSync(join(root, "dist/better-deezer.user.js"), header + iife(js("desktop"), true));

console.log(`Better Deezer ${pkg.version} built -> dist/`);
