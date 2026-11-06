// Smoke test: load dist/better-deezer.user.js into Chromium on test/fixture.html,
// served at https://www.deezer.com/fr/ so the payload's host guard passes.
//   npm run build && npm test
// Uses the Playwright found on the machine (not a project dependency: the build stays dependency-free).
// Screenshots go to test/.out/ (git-ignored).
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright not found. Install it globally (npm i -g playwright) to run the smoke test.");
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.env.BD_SHOTS || join(root, "test/.out");
mkdirSync(out, { recursive: true });
const fixture = readFileSync(join(root, "test/fixture.html"), "utf8");
const payload = readFileSync(join(root, "dist/better-deezer.user.js"), "utf8");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route("https://www.deezer.com/**", (route) =>
  route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: fixture })
);
// Same path as the desktop launcher: injected at document start, before the DOM exists.
await context.addInitScript({ content: payload });

const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const open = async (setup) => {
  await page.goto("https://www.deezer.com/fr/");
  if (setup) {
    await page.evaluate(setup);
    await page.reload();
  }
  await page.waitForFunction(() => window.__betterDeezer && document.documentElement.dataset.bd === "on");
  await page.waitForTimeout(150);
};
const $eval = (fn, arg) => page.evaluate(fn, arg);
const shot = (name) => page.screenshot({ path: join(out, `${name}.png`) });

// ---------- Boot ----------
await open(() => localStorage.clear());
check("boots once (no double injection)", (await $eval(() => document.querySelectorAll("#bd-style").length)) === 1);
const health = await $eval(() => window.__betterDeezer.health());
const visibleAnchors = ["topbar", "page", "searchField", "searchContainer", "volumeButton", "rail", "dock", "playButton", "progressInput", "likeButton"];
const missing = visibleAnchors.filter((k) => !health[k]);
check("anchors resolve on the fixture", missing.length === 0, missing.join(", "));

// ---------- 1. Themes ----------
check("dark theme by default", (await $eval(() => document.documentElement.dataset.bdTheme)) === "dark");
const tempoBg = () => $eval(() => getComputedStyle(document.body).getPropertyValue("--tempo-colors-background-neutral-primary-default").trim());
const bodyBg = () => $eval(() => getComputedStyle(document.body).backgroundColor);
check("Tempo tokens bridged to --bd-* (dark)", (await bodyBg()) === "rgb(11, 10, 12)", await bodyBg());
await shot("1-dark");
await $eval(() => window.__betterDeezer.theme("light"));
check("light theme applies live", (await bodyBg()) === "rgb(245, 243, 240)", await bodyBg());
await shot("1-light");
await page.emulateMedia({ colorScheme: "dark" });
await $eval(() => window.__betterDeezer.theme("system"));
check("system follows prefers-color-scheme: dark", (await $eval(() => document.documentElement.dataset.bdTheme)) === "dark");
await page.emulateMedia({ colorScheme: "light" });
await page.waitForTimeout(50);
check("system follows prefers-color-scheme: light", (await $eval(() => document.documentElement.dataset.bdTheme)) === "light");
await $eval(() => window.__betterDeezer.theme("dark"));
void tempoBg;

// ---- more checks are appended per feature below ----
// ---------- 2. Volume ----------
const vol = () => $eval(() => ({ volume: __fake.volume, mutes: __fake.mutes, open: document.querySelector(".bd-volume")?.dataset.open }));
check("volume slider inserted before Deezer's button", await $eval(() => document.querySelector(".bd-volume")?.nextElementSibling?.dataset.testid?.startsWith("volume_button")));
await page.click('[data-testid^="volume_button"]');
let v = await vol();
check("click on icon opens the slider (no native mute)", v.open === "true" && v.mutes === 0, JSON.stringify(v));
check("accent ring on the icon", (await $eval(() => getComputedStyle(document.querySelector('[data-testid^="volume_button"]')).boxShadow)).includes("inset"));
await page.waitForTimeout(300);
await shot("2-volume-open");
const box = await page.locator('[data-testid^="volume_button"]').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, -100);
await page.waitForTimeout(400);
v = await vol();
check("wheel up on the icon raises Deezer's volume", Math.abs(v.volume - 0.55) < 0.011, JSON.stringify(v));
const sbox = await page.locator(".bd-volume input").boundingBox();
await page.mouse.move(sbox.x + sbox.width / 2, sbox.y + sbox.height / 2);
await page.mouse.wheel(0, 100);
await page.mouse.wheel(0, 100);
await page.waitForTimeout(400);
v = await vol();
check("wheel down on the slider lowers it", Math.abs(v.volume - 0.45) < 0.011, JSON.stringify(v));
await page.mouse.click(sbox.x + sbox.width * 0.9, sbox.y + sbox.height / 2);
await page.waitForTimeout(400);
v = await vol();
check("dragging/clicking the slider sets the volume", v.volume > 0.8, JSON.stringify(v));
check("Deezer's hover popup is hidden", await $eval(() => { const m = document.querySelector('[data-testid="volume_menu"]'); return !m || getComputedStyle(m.closest('[data-bd="volume-native"]') || m).opacity === "0"; }));
check("bubble shows the percentage while adjusting", (await $eval(() => document.querySelector(".bd-volume-bubble").textContent)).endsWith("%"));
await page.click('[data-testid^="volume_button"]');
check("re-click while open = Deezer's mute", (await vol()).mutes === 1 && (await vol()).open === "true");
await page.click('[data-testid^="volume_button"]');
await page.keyboard.press("Escape");
check("Escape folds it back", (await vol()).open === "false");
await page.click('[data-testid^="volume_button"]', { modifiers: ["Alt"] });
check("Alt+click keeps Deezer's mute", (await vol()).mutes === 3);
await page.click('[data-testid^="volume_button"]', { modifiers: ["Alt"] });

// ---------- 3. Rail ----------
const railBox = () => $eval(() => {
  const r = document.querySelector('[data-bd="rail"]');
  const b = r.getBoundingClientRect();
  const links = [...r.querySelectorAll("a, button")].filter((a) => a.getBoundingClientRect().width).map((a) => { const x = a.getBoundingClientRect(); return x.left + x.width / 2; });
  return { collapsed: r.dataset.bdCollapsed, top: b.top, bottom: b.bottom, cx: b.left + b.width / 2, links, height: b.height };
});
await page.waitForTimeout(400);
let rb = await railBox();
const areaMid = (900 - 80 - 12) / 2;
check("collapsed rail is detected", rb.collapsed === "true");
check("collapsed rail is centered vertically", Math.abs((rb.top + rb.bottom) / 2 - areaMid) < 8 && rb.height < 600, `mid ${((rb.top + rb.bottom) / 2).toFixed(0)} vs ${areaMid}, h ${rb.height.toFixed(0)}`);
check("collapsed rail entries are centered horizontally", rb.links.every((x) => Math.abs(x - rb.cx) < 2), rb.links.map((x) => x.toFixed(0)).join(","));
check("active page marked in the rail", (await $eval(() => document.querySelector('[data-bd="rail"] [data-bd-active="true"]')?.getAttribute("href"))) === "/fr/");
check("no css-xxxx class in our stylesheet", !(await $eval(() => /\.css-[a-z0-9]/i.test(document.getElementById("bd-style").textContent))));
const hoverLink = page.locator('[data-bd="rail"] a[href="/fr/channels/explore"]');
await hoverLink.hover();
await page.waitForTimeout(250);
check("rail hover paints surface-2", (await hoverLink.evaluate((a) => getComputedStyle(a).backgroundColor)) === "rgb(28, 26, 31)");
await shot("3-rail-collapsed");
await $eval(() => __expandSidebar(true));
await page.waitForTimeout(500);
rb = await railBox();
check("expanded rail floats full height", rb.collapsed === "false" && rb.top <= 14 && rb.height > 700, JSON.stringify({ top: rb.top, h: rb.height }));
await shot("3-rail-expanded");
await $eval(() => __expandSidebar(false));

// ---------- 4. Player bar ----------
const css = (sel, prop) => $eval(([s, p]) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[p] : null; }, [sel, prop]);
check("dock floats with rounded corners", (await css('[data-bd="dock"]', "borderRadius")) === "22px" && (await css('[data-bd="dock"]', "bottom")) === "12px");
check("play button is a round #A238FF disc", (await css('[data-bd-role="play"]', "backgroundColor")) === "rgb(162, 56, 255)" && (await css('[data-bd-role="play"]', "borderRadius")) !== "0px");
await page.click('[data-bd-role="like"]');
await page.waitForTimeout(100);
check("liked heart is filled accent", (await css('[data-bd-role="like"] svg', "fill")) === "rgb(162, 56, 255)", await css('[data-bd-role="like"] svg', "fill"));
check("progress fill is accent", (await css('[data-bd-role="progress-fill"]', "backgroundColor")) === "rgb(162, 56, 255)");
const order = await $eval(() => ["time-elapsed", "progress", "time-remaining"].map((r) => document.querySelector(`[data-bd-slot="${r}"]`)?.getBoundingClientRect().left ?? -1));
check("times on each side of the bar", order[0] >= 0 && order[0] < order[1] && order[1] < order[2], order.join(" < "));
const pbox = await page.locator('[data-bd-slot="progress"]').boundingBox();
await page.mouse.move(pbox.x + pbox.width / 2, pbox.y + pbox.height / 2);
const seekBefore = await $eval(() => Number(document.querySelector('[data-testid="progress_bar"]').value));
await page.mouse.wheel(0, -100);
await page.waitForTimeout(100);
const seekAfter = await $eval(() => Number(document.querySelector('[data-testid="progress_bar"]').value));
check("wheel over the seek bar seeks +5 s", seekAfter - seekBefore === 5, `${seekBefore} -> ${seekAfter}`);
await shot("4-dock");
await $eval(() => window.__betterDeezer.theme("light"));
await shot("4-dock-light");
await $eval(() => window.__betterDeezer.theme("dark"));

// ---------- 5. Overlays ----------
await page.click('[data-testid="search_field"]');
check("search pill gets a 2px accent border on focus", /inset.*0px 0px 0px 2px|0px 0px 0px 2px.*inset/.test(await css('[data-bd="search-field-group"]', "boxShadow")));
await page.click('[data-testid="topbar-profile"]');
await page.waitForTimeout(150);
check("profile menu tagged and rounded 22", (await css('[data-bd="account-menu"]', "borderRadius")) === "22px");
check("theme switch + settings entry injected in the profile menu", await $eval(() => !!document.querySelector('.bd-account .bd-seg[data-value="light"]') && !!document.querySelector(".bd-account-link")));
await page.click('.bd-account .bd-seg[data-value="light"]');
check("theme switch in the profile menu works", (await $eval(() => document.documentElement.dataset.bdTheme)) === "light");
await shot("5-account-light");
await page.click('.bd-account .bd-seg[data-value="dark"]');
await shot("5-account-dark");
await $eval(() => document.querySelector(".chakra-popover__popper")?.remove());
await $eval(() => __openModal());
await page.waitForTimeout(400);
check("modal: r=22 surface-1", (await css('[data-bd="modal"]', "borderRadius")) === "22px" && (await css('[data-bd="modal"]', "backgroundColor")) === "rgb(20, 19, 22)");
check("modal scrim: #050405 at 80%", (await css('[data-bd="scrim"]', "backgroundColor")) === "rgba(5, 4, 5, 0.8)");
check("modal primary button is solid text color", (await css('[data-bd="modal"] [data-bd-role="primary"]', "backgroundColor")) === "rgb(244, 242, 246)", JSON.stringify(await $eval(() => [...document.querySelectorAll("[data-bd=modal] button")].map((b) => b.dataset.testid + ":" + b.dataset.bdRole + ":" + getComputedStyle(b).backgroundColor))));
await shot("5-modal");
await $eval(() => document.querySelector(".chakra-portal")?.remove());
await $eval(() => __toast());
await page.waitForTimeout(150);
check("toast is a light pill", (await css('[data-bd="toast"] > *', "backgroundColor")) === "rgb(244, 242, 246)");
await $eval(() => __openNotifications());
await page.waitForTimeout(150);
check("notifications panel tagged", (await css('[data-bd="notifications"]', "borderRadius")) === "22px");
await page.click('.bd-notif-filters [data-value="social"]');
check("notification filter hides releases", (await css('[data-bd="notifications"] li[data-bd-kind="release"]', "display")) === "none");
await shot("5-notifications");
await $eval(() => document.querySelectorAll(".chakra-popover__popper, #chakra-toast-manager-bottom li").forEach((e) => e.remove()));

//@@CHECKS@@

check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ${out}`);
process.exit(failed.length ? 1 : 0);
