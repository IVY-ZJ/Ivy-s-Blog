// 全站音乐歌单的唯一数据源（single source of truth）。
// 曲名 = 文件名（去扩展名）；中文路径已做 URL 编码，避免某些服务器 404。
// music.html 与首页右侧栏 mini 播放器都从这里读取，保证两端始终同步。
window.SITE_TRACKS = [
  { title: "Eutopia",    src: "music/Eutopia.flac" },
  { title: "卡农",        src: "music/%E5%8D%A1%E5%86%9C.mp3" },
  { title: "夜的钢琴曲5",  src: "music/%E5%A4%9C%E7%9A%84%E9%92%A2%E7%90%B4%E6%9B%B25.mp3" },
  { title: "菊次郎的夏天", src: "music/%E8%8F%8A%E6%AC%A1%E9%83%8E%E7%9A%84%E5%A4%8F%E5%A4%A9.mp3" }
];
