// 全站音乐歌单的唯一数据源（single source of truth）。
// 曲名 = 文件名（去扩展名）；中文文件名已做 URL 编码，避免某些服务器 404。
//
// src 一律写成「站点根相对路径」（不带前导斜杠）。播放器在播放时会把它拼到
// SITE_MUSIC_BASE 后面，而 SITE_MUSIC_BASE 由本脚本自身的 <script src> 推导：
// 无论站点部署在域名根路径、子目录（如 GitHub Pages 项目站
// https://<user>.github.io/<repo>/），还是本地 file:// 双击打开，都能正确找到音频。
// music.html 的黑胶播放器与各页右栏迷你播放器都从这里读取，保证两端始终同步。
(function () {
  var base = "/";
  try {
    var s = document.currentScript;
    if (s && s.src) {
      // …/assets/js/tracks.js → 去掉文件名与两级目录，得到站点根
      var parts = s.src.split("/");
      parts.pop(); // tracks.js
      parts.pop(); // js/
      parts.pop(); // assets/
      if (parts.length) base = parts.join("/") + "/";
    }
  } catch (e) { /* 保持回退值 "/" */ }
  window.SITE_MUSIC_BASE = base;

  window.SITE_TRACKS = [
    { title: "Eutopia",      src: "music/Eutopia.mp3" },
    { title: "夜的钢琴曲5",   src: "music/%E5%A4%9C%E7%9A%84%E9%92%A2%E7%90%B4%E6%9B%B25.mp3" },
    { title: "菊次郎的夏天",  src: "music/%E8%8F%8A%E6%AC%A1%E9%83%8E%E7%9A%84%E5%A4%8F%E5%A4%A9.mp3" },
    { title: "Flower Dance", src: "music/Flower%20Dance.mp3" }
  ];
})();
