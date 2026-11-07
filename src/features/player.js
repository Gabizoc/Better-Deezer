/*
 * Player bar, in the user's own style: floating rounded dock, round accent play
 * button, filled accent heart when liked, elapsed / thin accent bar / remaining.
 * This file only tags the parts; the look is in styles/20-shell.css.

 * `seek()` is shared with the cover wheel (dock-gestures) and the Now playing view.
 */
BD.feature({
  id: "player",
  label: ["Barre de lecture Better Deezer", "Better Deezer player bar"],

  /** Deezer's Slider seeks on mouseup (props.onChange(e.target.value)). */
  seek(input, value) {
    const max = Number(input.max || 0);
    const next = Math.max(0, Math.min(max - 1, value));
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, String(next));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const r = input.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    input.dispatchEvent(new MouseEvent("mouseup", init));
  },

  update() {
    const dock = BD.q('[data-bd="dock"]');
    if (!dock) return;

    const play = BD.anchors.playButton();
    if (play) BD.mark(play, "play", "data-bd-role");

    const like = BD.anchors.likeButton();
    if (like) {
      BD.mark(like, "like", "data-bd-role");
      BD.mark(like, String(like.getAttribute("data-testid").endsWith("_on")), "data-bd-liked");
    }

    // Seek row: elapsed | track | remaining, as direct children of their common row.
    const track = BD.anchors.progressTrack();
    const elapsed = BD.anchors.elapsedTime();
    const remaining = BD.anchors.remainingTime();
    if (track) {
      BD.mark(track, "progress-track", "data-bd-role");
      const fill = BD.anchors.progressFill();
      if (fill) BD.mark(fill, "progress-fill", "data-bd-role");
    }
    if (track && elapsed && remaining) {
      let row = track.parentElement;
      while (row && row !== dock && !(row.contains(elapsed) && row.contains(remaining))) row = row.parentElement;
      if (row && row !== dock) {
        BD.mark(row, "progress-row", "data-bd-role");
        const childOf = (el) => {
          while (el && el.parentElement !== row) el = el.parentElement;
          return el;
        };
        BD.mark(childOf(elapsed), "time-elapsed", "data-bd-slot");
        BD.mark(childOf(track), "progress", "data-bd-slot");
        BD.mark(childOf(remaining), "time-remaining", "data-bd-slot");
      }
    }
  }
});
