/*
 * "Better Deezer settings" panel: our own modal, opened from the profile menu
 * (features/overlays.js), with Ctrl/Cmd + , or __betterDeezer.settings().
 * Tabs (artboard "Settings"): Appearance, Playback & volume, Home,
 * Recommendations, Shortcuts, About. Everything is stored in localStorage (bd:*).
 *
 * Also owns our extra shortcut Q (queue). Deezer already binds M (mute),
 * L (like), S (search), Space, arrows, 0-9 and H (its shortcut panel).
 */
BD.feature({
  id: "settings",

  setup() {
    BD.openSettings = (tab) => this.open(tab);

    document.addEventListener(
      "keydown",
      (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === ",") {
          e.preventDefault();
          e.stopPropagation();
          this.isOpen() ? this.close() : this.open();
          return;
        }
        if (this.isOpen()) {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            this.close();
          } else if (e.key === "Tab") this.trapFocus(e);
          return;
        }
        if (this.typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === "q" || e.key === "Q") {
          const queue = BD.q('[data-testid="queue_list_button"]');
          if (queue) {
            e.preventDefault();
            queue.click();
          }
        }
      },
      true
    );
  },

  typing(e) {
    const t = e.target;
    return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
  },

  isOpen() {
    return Boolean(document.getElementById("bd-settings"));
  },

  close() {
    const root = document.getElementById("bd-settings");
    if (!root) return;
    BD.skins.apply(); // drop any unsaved theme preview
    root.setAttribute("data-closing", "true");
    setTimeout(() => root.remove(), 160);
    this.lastFocus?.focus?.();
  },

  trapFocus(e) {
    const panel = BD.q("#bd-settings .bd-settings-panel");
    const items = BD.qa("button, input, select, [tabindex='0']", panel).filter((el) => !el.disabled && el.offsetParent);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },

  /** Built-in tabs, plus the ones other files register with BD.settingsTab (sorted by order). */
  builtinTabs: [
    { id: "appearance", order: 10, label: ["Apparence", "Appearance"] },
    { id: "playback", order: 30, label: ["Lecture et volume", "Playback & volume"] },
    { id: "home", order: 50, label: ["Accueil", "Home"] },
    { id: "reco", order: 60, label: ["Recommandations", "Recommendations"] },
    { id: "shortcuts", order: 80, label: ["Raccourcis", "Shortcuts"] },
    { id: "about", order: 90, label: ["À propos", "About"] }
  ],

  get tabs() {
    return [...this.builtinTabs, ...BD.settingsTabs].sort((a, b) => a.order - b.order);
  },

  open(tab = BD.settings.get("settings:tab", "themes")) {
    if (!this.tabs.some((t) => t.id === tab)) tab = this.tabs[0].id;
    this.lastFocus = document.activeElement;
    document.getElementById("bd-settings")?.remove();

    const body = BD.h("div", { class: "bd-settings-body", role: "tabpanel", tabindex: "-1" });
    const nav = BD.h("nav", { class: "bd-settings-nav", role: "tablist", "aria-orientation": "vertical" });
    const select = (id) => {
      BD.settings.set("settings:tab", id);
      BD.qa("button", nav).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
      body.replaceChildren(...this.render(id));
      body.setAttribute("aria-label", BD.t(...this.tabs.find((t) => t.id === id).label));
      body.scrollTop = 0;
    };
    this.select = select;
    for (const t of this.tabs) {
      nav.append(BD.h("button", { type: "button", role: "tab", "data-tab": t.id, onclick: () => select(t.id) }, BD.t(...t.label)));
    }

    const root = BD.h(
      "div",
      { id: "bd-settings", class: "bd-settings" },
      BD.h("div", { class: "bd-settings-scrim", onclick: () => this.close() }),
      BD.h(
        "section",
        { class: "bd-settings-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "bd-settings-title" },
        BD.h(
          "header",
          { class: "bd-settings-head" },
          BD.h("h2", { id: "bd-settings-title" }, BD.t("Réglages Better Deezer", "Better Deezer settings")),
          BD.h("span", { class: "bd-settings-version" }, `v${BD.version}`),
          BD.h(
            "button",
            { type: "button", class: "bd-icon-btn", "aria-label": BD.t("Fermer", "Close"), onclick: () => this.close() },
            this.icon("M6 6l12 12M18 6L6 18")
          )
        ),
        BD.h("div", { class: "bd-settings-main" }, nav, body)
      )
    );
    document.body.appendChild(root);
    select(tab);
    BD.q(`[data-tab="${tab}"]`, nav)?.focus();
  },

  icon(d) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
    return svg;
  },

  // ---------- building blocks ----------
  section(title, ...rows) {
    return BD.h("div", { class: "bd-set-section" }, title ? BD.h("h3", {}, title) : null, ...rows);
  },

  row(label, hint, control, opts = {}) {
    return BD.h(
      "div",
      { class: "bd-set-row", "data-soon": opts.soon ? "true" : null },
      BD.h(
        "div",
        { class: "bd-set-text" },
        BD.h("span", { class: "bd-set-label" }, label, opts.soon ? BD.h("em", { class: "bd-soon" }, BD.t("Bientôt", "Soon")) : null),
        hint ? BD.h("span", { class: "bd-set-hint" }, hint) : null
      ),
      control
    );
  },

  toggle(key, fallback, onChange, disabled) {
    const input = BD.h("input", {
      type: "checkbox",
      role: "switch",
      class: "bd-switch",
      disabled,
      onchange: () => {
        BD.settings.set(key, input.checked);
        onChange?.(input.checked);
      }
    });
    input.checked = BD.settings.get(key, fallback) !== false;
    return input;
  },

  /** Toggle for a feature. Live features (`live: true`) apply at once, others ask for a reload. */
  featureToggle(id, hint) {
    const f = BD.features.find((x) => x.id === id);
    if (!f?.label) return null;
    const desc = hint || (f.description ? BD.t(...f.description) : null);
    return this.row(BD.t(...f.label), desc, this.toggle(`feature:${id}`, !BD.defaultOff.has(id), () => !f.live && this.needsReload()));
  },

  segmented(key, fallback, options, onChange, disabled) {
    const current = BD.settings.get(key, fallback);
    const group = BD.h("div", { class: "bd-segmented", role: "radiogroup" });
    for (const [value, fr, en] of options) {
      group.append(
        BD.h(
          "button",
          {
            type: "button",
            role: "radio",
            class: "bd-seg",
            disabled,
            "data-value": value,
            "aria-checked": String(current === value),
            onclick: () => {
              BD.qa(".bd-seg", group).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.value === value)));
              onChange ? onChange(value) : BD.settings.set(key, value);
            }
          },
          BD.t(fr, en)
        )
      );
    }
    return group;
  },

  needsReload() {
    const bar = BD.q("#bd-settings .bd-reload");
    if (bar) bar.hidden = false;
  },

  reloadBar() {
    return BD.h(
      "div",
      { class: "bd-reload", hidden: true },
      BD.h("span", {}, BD.t("Rechargez la page pour appliquer.", "Reload the page to apply.")),
      BD.h("button", { type: "button", class: "bd-btn", onclick: () => location.reload() }, BD.t("Recharger", "Reload"))
    );
  },

  // ---------- tabs ----------
  render(tab) {
    const extra = BD.settingsTabs.find((t) => t.id === tab);
    const nodes = extra ? extra.render(this) : this[`tab_${tab}`]();
    return nodes.filter(Boolean).concat(this.reloadBar());
  },

  /** Re-render the current tab (after an install, a delete...). */
  refresh() {
    const current = BD.settings.get("settings:tab", "themes");
    if (this.isOpen()) this.select?.(current);
  },

  tab_appearance() {
    return [
      this.section(
        BD.t("Interface", "Interface"),
        this.featureToggle("content"),
        this.featureToggle("ambient"),
        this.featureToggle("pages"),
        this.featureToggle("overlays"),
        this.featureToggle("now-playing"),
        this.row(BD.t("Badge au démarrage", "Startup badge"), BD.t("« Better Deezer x.y.z » pendant 3 s.", "“Better Deezer x.y.z” for 3 s."), this.toggle("badge", true))
      )
    ];
  },

  tab_playback() {
    return [
      this.section(
        BD.t("Barre de lecture", "Player bar"),
        this.featureToggle("player"),
        this.featureToggle("seek-wheel"),
        this.featureToggle("dock-gestures"),
        this.featureToggle("tooltips"),
        this.featureToggle("tips")
      ),
      this.section(
        BD.t("Volume", "Volume"),
        this.featureToggle("volume"),
        this.row(
          BD.t("Pas de la molette", "Wheel step"),
          BD.t("Maj + molette : 1 %.", "Shift + wheel: 1%."),
          this.segmented("volume:step", 5, [[2, "2 %", "2%"], [5, "5 %", "5%"], [10, "10 %", "10%"]])
        )
      )
    ];
  },

  tab_home() {
    const sections = BD.home?.sections?.() || [];
    const hidden = new Set(BD.settings.get("home:hidden", []));
    const rows = sections.length
      ? sections.map((title) =>
          this.row(
            title,
            null,
            (() => {
              const input = BD.h("input", {
                type: "checkbox",
                role: "switch",
                class: "bd-switch",
                onchange: () => {
                  const set = new Set(BD.settings.get("home:hidden", []));
                  input.checked ? set.delete(title) : set.add(title);
                  BD.settings.set("home:hidden", [...set]);
                }
              });
              input.checked = !hidden.has(title);
              return input;
            })()
          )
        )
      : [BD.h("p", { class: "bd-set-empty" }, BD.t("Ouvrez l'accueil de Deezer pour lister ses sections.", "Open Deezer's home page to list its sections."))];
    return [
      this.section(
        BD.t("Sections de l'accueil", "Home sections"),
        this.featureToggle("home"),
        BD.h("p", { class: "bd-set-hint" }, BD.t("Masquez les carrousels qui ne vous servent pas. « Reprendre l'écoute » reste en haut.", "Hide the carousels you don't use. “Recently played” stays on top.")),
        ...rows,
        hidden.size
          ? BD.h(
              "button",
              { type: "button", class: "bd-btn bd-btn-ghost", onclick: () => (BD.settings.set("home:hidden", []), this.open("home")) },
              BD.t("Tout réafficher", "Show all again")
            )
          : null
      )
    ];
  },

  tab_reco() {
    const list = BD.settings.get("reco:blocklist", []);
    const input = BD.h("input", {
      type: "text",
      class: "bd-input",
      placeholder: BD.t("Artiste, genre ou ambiance…", "Artist, genre or mood…"),
      "aria-label": BD.t("Ajouter à la liste", "Add to the list")
    });
    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      BD.settings.set("reco:blocklist", [...new Set([...BD.settings.get("reco:blocklist", []), v])]);
      this.open("reco");
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && add());
    return [
      this.section(
        BD.t("Équilibre", "Balance"),
        this.row(
          BD.t("Flow et mixes", "Flow and mixes"),
          BD.t("Familier : surtout des titres connus. Découverte : surtout du neuf.", "Familiar: mostly known tracks. Discovery: mostly new ones."),
          this.segmented("reco:mode", "balanced", [["familiar", "Familier", "Familiar"], ["balanced", "Équilibré", "Balanced"], ["discovery", "Découverte", "Discovery"]], null, true),
          { soon: true }
        ),
        this.row(BD.t("« Pourquoi ce titre ? »", "“Why this track?”"), BD.t("Une étiquette sous les cartes recommandées.", "A label under recommended cards."), this.toggle("reco:why", false, null, true), { soon: true }),
        this.row(BD.t("Éviter les répétitions pendant 7 jours", "Avoid repeats for 7 days"), null, this.toggle("reco:norepeat", false, null, true), { soon: true }),
        this.row(BD.t("Accueil selon l'heure", "Home by time of day"), BD.t("Calme le matin, énergique le soir.", "Calm in the morning, upbeat at night."), this.toggle("reco:timeofday", false, null, true), { soon: true })
      ),
      this.section(
        BD.t("Ne plus me recommander", "Don't recommend"),
        BD.h("p", { class: "bd-set-hint" }, BD.t("Les cartes et titres qui correspondent sont masqués partout, uniquement sur cet appareil.", "Matching cards and tracks are hidden everywhere, on this device only.")),
        BD.h("div", { class: "bd-inline-form" }, input, BD.h("button", { type: "button", class: "bd-btn", onclick: add }, BD.t("Ajouter", "Add"))),
        BD.h(
          "ul",
          { class: "bd-taglist" },
          list.map((name) =>
            BD.h(
              "li",
              {},
              BD.h("span", {}, name),
              BD.h(
                "button",
                {
                  type: "button",
                  class: "bd-icon-btn",
                  "aria-label": BD.t(`Retirer ${name}`, `Remove ${name}`),
                  onclick: () => {
                    BD.settings.set("reco:blocklist", BD.settings.get("reco:blocklist", []).filter((x) => x !== name));
                    this.open("reco");
                  }
                },
                this.icon("M6 6l12 12M18 6L6 18")
              )
            )
          )
        )
      )
    ];
  },

  tab_shortcuts() {
    const mac = navigator.platform.startsWith("Mac");
    const mod = mac ? "⌘" : "Ctrl";
    const line = (keys, fr, en) => BD.h("li", {}, BD.h("span", { class: "bd-keys" }, keys.map((k) => BD.h("kbd", {}, k))), BD.h("span", {}, BD.t(fr, en)));
    return [
      this.section(
        "Better Deezer",
        BD.h(
          "ul",
          { class: "bd-shortcuts" },
          line([mod, "K"], "Rechercher", "Search"),
          line([mod, ","], "Réglages Better Deezer", "Better Deezer settings"),
          line(["Q"], "File d'attente", "Queue"),
          line([BD.t("Molette", "Wheel")], "Sur le volume : ±5 % · sur la barre de progression : ±5 s", "On volume: ±5% · on the seek bar: ±5 s"),
          line([BD.t("Maj", "Shift"), BD.t("Molette", "Wheel")], "Volume ±1 % · progression ±15 s", "Volume ±1% · seek ±15 s"),
          line(["Alt", BD.t("Clic", "Click")], "Sur le volume : muet", "On volume: mute")
        )
      ),
      this.section(
        BD.t("Deezer (natifs)", "Deezer (built in)"),
        BD.h(
          "ul",
          { class: "bd-shortcuts" },
          line([BD.t("Espace", "Space")], "Lecture / pause", "Play / pause"),
          line(["←", "→"], "Reculer / avancer", "Seek back / forward"),
          line([BD.t("Maj", "Shift"), "←"], "Titre précédent", "Previous track"),
          line([BD.t("Maj", "Shift"), "→"], "Titre suivant", "Next track"),
          line([BD.t("Maj", "Shift"), "↑ ↓"], "Volume", "Volume"),
          line(["M"], "Muet", "Mute"),
          line(["L"], "Coup de cœur", "Like"),
          line(["S"], "Rechercher", "Search"),
          line(["R"], "Rejouer le titre", "Replay track"),
          line(["0…9"], "Aller à la position", "Jump to position"),
          line(["H"], "Tous les raccourcis Deezer", "All Deezer shortcuts")
        )
      )
    ];
  },

  tab_about() {
    const health = BD.checkHealth();
    const broken = Object.keys(health).filter((k) => health[k] === false);
    return [
      this.section(
        "Better Deezer",
        BD.h(
          "p",
          { class: "bd-set-hint" },
          `v${BD.version} · ${BD.target === "desktop" ? BD.t("application Windows", "Windows app") : BD.t("extension navigateur", "browser extension")} · MIT`
        ),
        this.row(
          BD.t("Éléments de Deezer reconnus", "Deezer elements found"),
          broken.length ? BD.t(`Introuvables : ${broken.join(", ")}`, `Not found: ${broken.join(", ")}`) : BD.t("Tout est en place.", "Everything is in place."),
          BD.h("span", { class: "bd-pill", "data-ok": String(!broken.length) }, broken.length ? `${broken.length} ⚠` : "OK")
        ),
        BD.h(
          "div",
          { class: "bd-actions" },
          BD.h(
            "a",
            { class: "bd-btn bd-btn-ghost", href: "https://github.com/Gabizoc/Better-Deezer", target: "_blank", rel: "noopener" },
            BD.t("Code source", "Source code")
          ),
          BD.h(
            "button",
            {
              type: "button",
              class: "bd-btn bd-btn-danger",
              onclick: () => {
                BD.settings.set("enabled", false);
                location.reload();
              }
            },
            BD.t("Désactiver Better Deezer", "Turn Better Deezer off")
          )
        ),
        BD.h("p", { class: "bd-set-hint" }, BD.t("Pour le réactiver : Ctrl , puis OK.", "To turn it back on: Ctrl , then OK."))
      )
    ];
  }
});
