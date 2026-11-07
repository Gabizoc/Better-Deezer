/*
 * "Now playing" view (module): full-window, big cover on the left, synced
 * lyrics scrolling on the right, blurred cover in the background.
 * Open with F or the button added to the player bar; Escape closes.
 * Click a lyric line to jump there.
 *
 * Lyrics come from LRCLIB (https://lrclib.net), a free and open lyrics
 * database: when the view is open, the title, artist and duration of the
 * current track are sent there, nothing else. Results are cached per session.
 *
 * Time: Deezer's seek input (data-testid="progress_bar") holds the position in
 * seconds and moves once a second; between ticks we interpolate while playing.
 */
BD.feature({
  id: "nowplaying",
  module: true,
  live: true,
  icon: "M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z",
  label: ["Vue « En écoute » + paroles synchronisées", "“Now playing” view + synced lyrics"],
  description: [
    "Grande pochette et paroles qui défilent avec la musique. Touche F ou bouton dans la barre de lecture. Paroles : LRCLIB (titre et artiste envoyés à lrclib.net).",
    "Big cover and lyrics that scroll with the music. F key or the button in the player bar. Lyrics: LRCLIB (title and artist sent to lrclib.net)."
  ],

  cache: new Map(),
  state: null,

  setup() {
    this.onKey = (e) => {
      if (e.key === "Escape" && this.state) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        return;
      }
      const t = e.target;
      const typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if (typing || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "f" && e.key !== "F")) return;
      if (document.getElementById("bd-settings")) return;
      e.preventDefault();
      this.state ? this.close() : this.open();
    };
    document.addEventListener("keydown", this.onKey, true);
  },

  teardown() {
    this.close();
    document.removeEventListener("keydown", this.onKey, true);
    BD.q(".bd-np-btn")?.remove();
  },

  update() {
    this.injectButton();
    if (this.state) {
      const track = this.track();
      if (track && track.key !== this.state.track?.key) this.load(track);
      this.syncTransport();
    }
  },

  // ---------- current track, from the player bar ----------
  track() {
    const dock = BD.q('[data-bd="dock"]') || BD.anchors.playerRoot();
    if (!dock) return null;
    const title = BD.q('[data-testid="item_title"]', dock)?.textContent.trim();
    if (!title) return null;
    const artist = BD.q('[data-testid="item_subtitle"]', dock)?.textContent.replace(/\s+/g, " ").trim() || "";
    const img = BD.q('[data-testid="item_cover"] img', dock);
    const cover = img?.currentSrc || img?.src || "";
    const input = BD.anchors.progressInput();
    const duration = Number(input?.max) || 0;
    return { title, artist, cover: cover.replace(/\/\d+x\d+-/, "/1000x1000-"), duration, key: `${title}|${artist}` };
  },

  isPlaying() {
    return Boolean(BD.q('[data-bd="dock"] [data-testid="play_button_pause"], #page_player [data-testid="play_button_pause"]'));
  },

  /** Position in seconds, smoothed between Deezer's once-a-second updates. */
  position() {
    const input = BD.anchors.progressInput();
    const value = Number(input?.value) || 0;
    const now = performance.now();
    const s = this.state;
    if (value !== s.lastValue) {
      s.lastValue = value;
      s.lastAt = now;
    }
    if (!this.isPlaying()) return value;
    return value + Math.min(1.25, (now - s.lastAt) / 1000);
  },

  // ---------- lyrics ----------
  firstArtist: (artist) => artist.split(/,|&| feat\.? | x /i)[0].trim(),
  cleanTitle: (title) =>
    title
      .replace(/\s*[([](feat|ft|with)\.?[^)\]]*[)\]]/gi, "")
      .replace(/\s+-\s+(.*remaster.*|radio edit|live.*|single version)$/i, "")
      .trim(),

  async fetchJSON(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { credentials: "omit", signal: ctrl.signal });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  },

  async lyrics(track) {
    if (this.cache.has(track.key)) return this.cache.get(track.key);
    const api = "https://lrclib.net/api";
    const artist = this.firstArtist(track.artist);
    const params = (o) => new URLSearchParams(o).toString();
    let hit = await this.fetchJSON(`${api}/get?${params({ track_name: track.title, artist_name: artist, ...(track.duration ? { duration: Math.round(track.duration) } : {}) })}`);
    if (!hit || (!hit.syncedLyrics && !hit.plainLyrics && !hit.instrumental)) {
      const list = (await this.fetchJSON(`${api}/search?${params({ track_name: this.cleanTitle(track.title), artist_name: artist })}`)) || [];
      const score = (r) => (r.syncedLyrics ? 0 : 100) + (track.duration ? Math.abs((r.duration || 0) - track.duration) : 0);
      hit = list.filter((r) => !track.duration || Math.abs((r.duration || 0) - track.duration) < 8).sort((a, b) => score(a) - score(b))[0] || hit;
    }
    const result = !hit
      ? { kind: "none" }
      : hit.instrumental
        ? { kind: "instrumental" }
        : hit.syncedLyrics
          ? { kind: "synced", lines: this.parseLRC(hit.syncedLyrics) }
          : hit.plainLyrics
            ? { kind: "plain", lines: hit.plainLyrics.split("\n").map((text) => ({ time: null, text })) }
            : { kind: "none" };
    this.cache.set(track.key, result);
    return result;
  },

  /** "[01:02.34] text" -> [{ time: 62.34, text }] (several stamps per line allowed). */
  parseLRC(lrc) {
    const lines = [];
    for (const raw of lrc.split(/\r?\n/)) {
      const stamps = [...raw.matchAll(/\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
      if (!stamps.length) continue;
      const text = raw.replace(/\[[^\]]*\]/g, "").trim();
      for (const m of stamps) lines.push({ time: Number(m[1]) * 60 + Number(m[2].replace(":", ".")), text });
    }
    return lines.sort((a, b) => a.time - b.time);
  },

  // ---------- view ----------
  icon(d, fill = false) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    if (fill) svg.setAttribute("data-fill", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
    return svg;
  },

  injectButton() {
    const anchor = BD.q('[data-bd="dock"] [data-testid="queue_list_button"]') || BD.q('[data-bd="dock"] [data-testid="lyrics_button"]');
    if (!anchor || BD.q(".bd-np-btn")) return;
    const btn = BD.h(
      "button",
      { type: "button", class: "bd-np-btn", "aria-label": BD.t("Vue En écoute (F)", "Now playing view (F)"), onclick: () => (this.state ? this.close() : this.open()) },
      this.icon("M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5")
    );
    anchor.parentNode.insertBefore(btn, anchor);
  },

  open() {
    if (this.state) return;
    const track = this.track();
    const root = BD.h("div", { id: "bd-np", role: "dialog", "aria-modal": "true", "aria-label": BD.t("En écoute", "Now playing") });
    const bg = BD.h("div", { class: "bd-np-bg", "aria-hidden": "true" }, BD.h("img", { alt: "" }));
    const cover = BD.h("img", { class: "bd-np-cover", alt: "" });
    const title = BD.h("h2", { class: "bd-np-title" });
    const artist = BD.h("p", { class: "bd-np-artist" });
    const elapsed = BD.h("span", { class: "bd-np-time" }, "0:00");
    const total = BD.h("span", { class: "bd-np-time" }, "0:00");
    const bar = BD.h("div", { class: "bd-np-bar" }, BD.h("span"));
    bar.addEventListener("click", (e) => {
      const r = bar.getBoundingClientRect();
      const input = BD.anchors.progressInput();
      const player = BD.features.find((f) => f.id === "player");
      if (input && player?.seek) player.seek(input, ((e.clientX - r.left) / r.width) * Number(input.max || 0));
    });
    const proxy = (testid, d, label) =>
      BD.h(
        "button",
        {
          type: "button",
          class: "bd-np-ctl",
          "data-proxy": testid,
          "aria-label": label,
          onclick: () => BD.q(`[data-bd="dock"] [data-testid^="${testid}"]`)?.click()
        },
        this.icon(d, true)
      );
    const playBtn = proxy("play_button_", "M8 5v14l11-7z", BD.t("Lecture / pause", "Play / pause"));
    playBtn.classList.add("bd-np-play");
    const lyricsBox = BD.h("div", { class: "bd-np-lyrics", "aria-live": "off" });
    const lyricsList = BD.h("ol", { class: "bd-np-lines" });
    lyricsBox.append(lyricsList);

    root.append(
      bg,
      BD.h(
        "button",
        { type: "button", class: "bd-np-close", "aria-label": BD.t("Fermer (Échap)", "Close (Esc)"), onclick: () => this.close() },
        this.icon("M6 6l12 12M18 6L6 18")
      ),
      BD.h(
        "div",
        { class: "bd-np-grid" },
        BD.h(
          "section",
          { class: "bd-np-left" },
          cover,
          BD.h("div", { class: "bd-np-meta" }, title, artist),
          BD.h("div", { class: "bd-np-progress" }, elapsed, bar, total),
          BD.h(
            "div",
            { class: "bd-np-controls" },
            proxy("previous_track_button", "M6 5h2v14H6zm3 7 9-7v14z", BD.t("Précédent", "Previous")),
            playBtn,
            proxy("next_track_button", "M16 5h2v14h-2zM6 5l9 7-9 7z", BD.t("Suivant", "Next"))
          )
        ),
        BD.h("section", { class: "bd-np-right" }, lyricsBox, BD.h("p", { class: "bd-np-source" }, BD.t("Paroles : LRCLIB", "Lyrics: LRCLIB")))
      )
    );
    document.body.append(root);
    document.documentElement.setAttribute("data-bd-np", "open");
    this.state = { root, bg, cover, title, artist, elapsed, total, bar, lyricsBox, lyricsList, playBtn, lines: [], current: -1, lastValue: -1, lastAt: 0, track: null };
    if (track) this.load(track);
    else title.textContent = BD.t("Rien en lecture", "Nothing playing");
    this.syncTransport();
    this.loop();
    BD.q(".bd-np-close", root).focus();
  },

  close() {
    const s = this.state;
    if (!s) return;
    cancelAnimationFrame(s.frame);
    s.root.setAttribute("data-closing", "true");
    document.documentElement.removeAttribute("data-bd-np");
    setTimeout(() => s.root.remove(), 220);
    this.state = null;
  },

  fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  },

  syncTransport() {
    const s = this.state;
    if (!s) return;
    const playing = this.isPlaying();
    s.playBtn.replaceChildren(this.icon(playing ? "M7 5h4v14H7zm6 0h4v14h-4z" : "M8 5v14l11-7z", true));
    s.playBtn.setAttribute("aria-label", playing ? BD.t("Pause", "Pause") : BD.t("Lecture", "Play"));
  },

  async load(track) {
    const s = this.state;
    s.track = track;
    s.title.textContent = track.title;
    s.artist.textContent = track.artist;
    if (track.cover) {
      s.cover.src = track.cover;
      s.bg.firstChild.src = track.cover;
    }
    s.total.textContent = this.fmt(track.duration);
    s.lines = [];
    s.current = -1;
    s.lyricsBox.dataset.kind = "loading";
    s.lyricsList.replaceChildren(BD.h("li", { class: "bd-np-note" }, BD.t("Recherche des paroles…", "Looking for lyrics…")));
    let result;
    try {
      result = await this.lyrics(track);
    } catch (err) {
      result = { kind: "error", message: err.message };
    }
    if (this.state !== s || s.track !== track) return; // closed or track changed meanwhile
    s.lyricsBox.dataset.kind = result.kind;
    const note = (fr, en) => s.lyricsList.replaceChildren(BD.h("li", { class: "bd-np-note" }, BD.t(fr, en)));
    if (result.kind === "none") return note("Pas de paroles trouvées pour ce titre.", "No lyrics found for this track.");
    if (result.kind === "instrumental") return note("Instrumental ♪", "Instrumental ♪");
    if (result.kind === "error") return note("Paroles indisponibles (connexion à lrclib.net impossible).", "Lyrics unavailable (cannot reach lrclib.net).");
    s.lines = result.lines;
    s.lyricsList.replaceChildren(
      ...result.lines.map((line, i) => {
        const li = BD.h("li", { "data-i": String(i) }, line.text || "♪");
        if (line.time !== null) {
          li.tabIndex = 0;
          li.addEventListener("click", () => this.seekTo(line.time));
          li.addEventListener("keydown", (e) => e.key === "Enter" && this.seekTo(line.time));
        }
        return li;
      })
    );
    s.lyricsList.style.transform = "";
  },

  seekTo(time) {
    const input = BD.anchors.progressInput();
    const player = BD.features.find((f) => f.id === "player");
    if (input && player?.seek) player.seek(input, Math.max(0, time - 0.2));
  },

  loop() {
    const s = this.state;
    if (!s) return;
    const t = this.position();
    const duration = s.track?.duration || Number(BD.anchors.progressInput()?.max) || 0;
    s.elapsed.textContent = this.fmt(t);
    s.bar.firstChild.style.width = duration ? `${Math.min(100, (t / duration) * 100)}%` : "0%";
    if (s.lyricsBox.dataset.kind === "synced" && s.lines.length) {
      let i = -1;
      for (let k = 0; k < s.lines.length; k++) {
        if (s.lines[k].time <= t + 0.15) i = k;
        else break;
      }
      if (i !== s.current) {
        s.current = i;
        const items = s.lyricsList.children;
        for (let k = 0; k < items.length; k++) items[k].dataset.state = k < i ? "past" : k === i ? "current" : "next";
        const el = items[Math.max(0, i)];
        if (el) {
          const offset = el.offsetTop + el.offsetHeight / 2 - s.lyricsBox.clientHeight * 0.4;
          s.lyricsList.style.transform = `translateY(${-Math.max(0, offset)}px)`;
        }
      }
    }
    s.frame = requestAnimationFrame(() => this.loop());
  }
});
