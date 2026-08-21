/* Ivy's blog — music page player (externalized so the site can ship a
   strict Content-Security-Policy with script-src 'self'). */
(function () {
  "use strict";
  // 歌单来自全站唯一数据源 tracks.js，与首页右侧栏 mini 播放器保持一致。
  var TRACKS = window.SITE_TRACKS || [];
  var audio = document.getElementById("mpAudio");
  if (!audio) return;
  var playerEl = document.getElementById("musicPlayer");
  var titleEl = document.getElementById("mpTitle");
  var subEl = document.getElementById("mpSub");
  var listEl = document.getElementById("playlist");
  var current = -1;

  TRACKS.forEach(function (t, i) {
    var li = document.createElement("li");
    li.className = "track";
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.innerHTML =
      '<span class="track-idx">' + (i + 1) + '</span>' +
      '<span class="track-name"></span>' +
      '<span class="track-state" aria-hidden="true">' +
        '<svg class="ic-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="ic-eq" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h2M9 7v10M14 4v16M19 9v6"/></svg>' +
      '</span>';
    li.querySelector(".track-name").textContent = t.title;
    li.addEventListener("click", function () { toggle(i); });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); }
    });
    listEl.appendChild(li);
  });

  function toggle(i) {
    if (i === current) {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
      return;
    }
    play(i);
  }

  function play(i) {
    var t = TRACKS[i];
    current = i;
    audio.src = t.src;
    titleEl.textContent = t.title;
    subEl.textContent = "— " + decodeURIComponent(t.src.split("/").pop());
    audio.play().catch(function () {});
    syncActive();
  }

  function syncActive() {
    Array.prototype.forEach.call(listEl.children, function (el, idx) {
      var active = idx === current;
      el.classList.toggle("is-active", active);
      el.classList.toggle("is-paused", active && audio.paused);
      el.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  /* Playing state drives both the vinyl spin and the tonearm drop
     (see #musicPlayer.is-playing rules in style.css). */
  function setPlaying(on) {
    playerEl.classList.toggle("is-playing", !!on);
  }

  audio.addEventListener("play", function () { setPlaying(true); syncActive(); });
  audio.addEventListener("pause", function () { setPlaying(false); syncActive(); });
  audio.addEventListener("ended", function () {
    setPlaying(false);
    if (current + 1 < TRACKS.length) play(current + 1);
    else syncActive();
  });
})();
