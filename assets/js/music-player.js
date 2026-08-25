/* Ivy's blog — music page vinyl player.
   Externalized so the site can ship a strict Content-Security-Policy
   with script-src 'self'.

   自 2026-08 起本页不再自建 <audio>：全站共用一个由 app.js 托管的单例
   控制器（window.npController）。音频元素挂在 <body> 上、独立于
   <main>，因此：
     - 通过 PJAX 从其它页面导航进来时播放器不会失效（旧实现里脚本先于
       DOM 换页执行，找不到 #mpAudio 就直接退出了）；
     - 换页不打断播放，右栏迷你播放器与本页黑胶始终共享同一份状态
       （曲目 / 进度 / 播放暂停）。
   本文件只把 #musicPlayer 的 UI 作为「视图」挂到控制器上；挂载时机由
   app.js 的 initPage() 统一调用 window.mountMusicPlayer()。 */
(function () {
  "use strict";

  window.mountMusicPlayer = function () {
    var playerEl = document.getElementById("musicPlayer");
    var listEl = document.getElementById("playlist");
    if (!playerEl || !listEl || playerEl.dataset.bound) return;

    // 歌单与播放状态来自全局唯一数据源/控制器
    if (typeof window.npController !== "function") return;
    var np = window.npController();

    playerEl.dataset.bound = "1";

    var titleEl = document.getElementById("mpTitle");
    var subEl = document.getElementById("mpSub");
    var playBtn = document.getElementById("mpPlay");
    var bar = document.getElementById("mpBar");
    var barFill = document.getElementById("mpBarFill");
    var timeCur = document.getElementById("mpTimeCur");
    var timeTotal = document.getElementById("mpTimeTotal");

    function defaultTitle() { titleEl.textContent = "选择一首曲子"; }
    function defaultSub() { subEl.textContent = "点击下方的列表开始播放"; }
    defaultTitle();
    defaultSub();

    /* Custom transport (progress line + play/pause) — mirrors the right
       rail mini player so the two stay visually in sync. */

    // 构建歌单（与右栏迷你播放器同一数据源、同一播放状态）
    var items = [];
    np.tracks().forEach(function (t, i) {
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
      li.addEventListener("click", function () { np.toggle(i); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); np.toggle(i); }
      });
      listEl.appendChild(li);
      items.push(li);
    });

    /* Playing state drives both the vinyl spin and the tonearm drop
       (see #musicPlayer.is-playing rules in style.css). */
    function sync() {
      var cur = np.current();
      var list = np.tracks();
      var t = cur >= 0 ? list[cur] : null;
      if (t) {
        titleEl.textContent = t.title;
        subEl.textContent = "— " + decodeURIComponent(np.trackSrc(t).split("/").pop());
      } else {
        defaultTitle();
        defaultSub();
      }
      playerEl.classList.toggle("is-playing", !!t && !np.audio.paused);
      for (var i = 0; i < items.length; i++) {
        var active = i === cur;
        items[i].classList.toggle("is-active", active);
        items[i].classList.toggle("is-paused", active && np.audio.paused);
        items[i].setAttribute("aria-current", active ? "true" : "false");
      }
      var d = np.audio.duration || 0;
      // While dragging, show the tentative position instead of playback time
      var pr = np.preview();
      var shown = (pr != null && d) ? pr * d : np.audio.currentTime;
      timeCur.textContent = np.fmt(shown);
      timeTotal.textContent = np.fmt(d);
      barFill.style.width = (d ? (shown / d * 100) : 0) + "%";
    }

    if (playBtn) playBtn.addEventListener("click", function () { np.togglePlay(); });
    np.attachSeek(bar);

    np.mount({ root: playerEl, sync: sync });
  };
})();
