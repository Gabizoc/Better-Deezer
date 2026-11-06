/*
 * Boot: inject CSS (desktop build only, the extension declares it in the manifest),
 * apply the theme, run every feature's setup once, then update on DOM changes,
 * one frame at most. A feature that throws is disabled for the session, never the whole app.
 */
(function boot() {
  // Only the top-level Deezer page. The desktop launcher injects into every new
  // document (iframes, login pages...), so this guard matters there.
  if (window.top !== window || !/(^|\.)deezer\.com$/.test(location.hostname)) return;
  if (window.__betterDeezer) return; // already injected (desktop reloads, double inject)

  // Injected at document start by the desktop launcher: wait for the DOM.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
    return;
  }

  const html = document.documentElement;
  if (BD.settings.get("enabled", true) === false) {
    html.setAttribute("data-bd", "off");
    window.__betterDeezer = {
      version: BD.version,
      enable: () => (BD.settings.set("enabled", true), location.reload())
    };
    // Way back without the console: Ctrl/Cmd + , offers to turn it on again.
    document.addEventListener("keydown", (e) => {
      if (!((e.ctrlKey || e.metaKey) && e.key === ",")) return;
      e.preventDefault();
      if (confirm(BD.t("Réactiver Better Deezer ?", "Turn Better Deezer back on?"))) window.__betterDeezer.enable();
    });
    return;
  }

  if (typeof __BD_CSS__ === "string" && !document.getElementById("bd-style")) {
    const style = document.createElement("style");
    style.id = "bd-style";
    style.textContent = __BD_CSS__;
    (document.head || html).appendChild(style);
  }

  BD.theme.init();
  html.setAttribute("data-bd", "on");
  html.setAttribute("data-bd-version", BD.version);

  const active = BD.features.filter((f) => BD.isEnabled(f.id));
  const failed = new Set();
  BD.failed = failed;

  const safe = (f, method) => {
    if (failed.has(f.id) || typeof f[method] !== "function") return;
    try {
      f[method]();
    } catch (err) {
      failed.add(f.id);
      BD.warn(`feature "${f.id}" disabled after error in ${method}:`, err);
    }
  };

  active.forEach((f) => safe(f, "setup"));

  let frame = 0;
  const run = () => {
    frame = 0;
    active.forEach((f) => safe(f, "update"));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(run);
  };
  BD.schedule = schedule;

  new MutationObserver(schedule).observe(html, { childList: true, subtree: true });
  addEventListener("resize", schedule);
  addEventListener("popstate", schedule);
  BD.on("settings", schedule);
  run();

  // Health report a few seconds after boot: which anchors resolved.
  setTimeout(() => {
    const health = BD.checkHealth();
    const missing = Object.keys(health).filter((k) => !health[k]);
    if (missing.length) BD.warn("anchors not found (Deezer may have changed, or the element is not on screen):", missing.join(", "));
    else BD.log("all anchors resolved");
  }, 4000);

  if (BD.settings.get("badge", true) && document.body) {
    const badge = document.createElement("div");
    badge.className = "bd-badge";
    badge.textContent = `Better Deezer ${BD.version}`;
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 3000);
  }

  // Small console API for debugging and for the next maintainer.
  window.__betterDeezer = {
    version: BD.version,
    target: BD.target,
    health: () => BD.checkHealth(),
    features: () => active.map((f) => ({ id: f.id, failed: failed.has(f.id) })),
    theme: (pref) => (pref ? BD.theme.set(pref) : BD.theme.get()),
    settings: () => BD.openSettings?.(),
    disable: (id) => BD.settings.set(id ? `feature:${id}` : "enabled", false),
    enable: (id) => BD.settings.set(id ? `feature:${id}` : "enabled", true),
    debug: (on = true) => localStorage.setItem("bd:debug", on ? "1" : "0")
  };

  BD.log(`v${BD.version} (${BD.target}) running on`, location.href);
})();
