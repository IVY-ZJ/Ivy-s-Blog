# Ivy 个人博客

一个用于分享**学习笔记**与**资源**的个人博客。

## 特性

- **iOS 设计语言**：系统字体、毛玻璃侧边栏、圆角卡片、系统配色、明暗自动切换（可手动覆盖）
- **壁纸背景 + 液态玻璃**：两张 4K iOS 壁纸作为明暗两套背景，卡片与侧边栏为「液态玻璃」半透明毛玻璃，不干扰阅读
- **媒体内容**：文章支持直接嵌入图片、音频、视频，以及大文件（网盘直链）
- **侧边栏导航**：首页 / 全部文章 / 学习笔记 / 资源分享 / 关于我，移动端折叠为抽屉
- **右侧栏（全站）**：每个页面（除音乐页/登录页）右侧都有无轮廓的浮动小部件栏（标签云 / 音乐迷你播放器），宽屏下**滚动吸附**——浏览长文章时标签与音乐面板固定在视口内不随内容滚走；由 `app.js` 统一注入（含 PJAX 换页后自动重建）
- **全局音乐播放器**：`<audio>` 由 `app.js` 的单例控制器托管在 `<body>` 上，站内换页（PJAX）**不打断播放**；右栏迷你播放器与音乐页黑胶播放器是同一控制器的两个「视图」，曲目 / 进度 / 播放暂停始终同步；支持上一首 / 下一首 / 点列表切歌 / **进度条点击定位与按住拖动（拖动实时预览，松手跳转）** / 播完自动下一首（循环）
- **部署路径自适应**：歌单音频路径按 `assets/js/tracks.js` 自身 URL 自动推导站点根（`SITE_MUSIC_BASE`），域名根路径、GitHub Pages 项目子路径（`https://<user>.github.io/<repo>/`）、本地 `file://` 双击打开都能正常播放
- **可拖动侧边栏**：桌面端拖动侧边栏右缘可自由调整宽度（230–260px），偏好会被记住
- **标签系统**：「标签」页按主题聚合文章，点击标签即可筛选；首页右侧栏也展示标签
- **站内搜索 + 分类筛选**：「全部文章」页可按关键词与分类过滤，「资源分享」页可搜索资源，「学习笔记」页可搜索笔记
- **小鸟头像**：侧边栏、关于页、文章作者位均使用小鸟头像
- **登录页**：全屏照片背景 + 玻璃拟态卡片，右侧竖排展示 60 句积极诗句（每次随机、可手动切换），内置「拖动图形到目标位置」的人机验证；登录态保存在 localStorage（30 天），侧边栏显示用户胶囊并支持一键退出，首页右栏顶部显示单行问候「Hello, 用户名」
- **课程资料页**：`course-food-safety.html` / `course-engdraw.html` 收口各门课程的资料（每份资料一个独立阅读页）；PDF 笔记在浏览器内本地解密为 blob（不提供原始下载），阅读页采用 `#view=Fit` 让单页 PDF 整页可见；页头 `.course-meta` 只保留「N 份资料」一个信息标签，不放课程名 / 学期标签 / 「持续更新」，新增课程页同样遵守
- **易扩展**：新增文章只需两步（见下）
- **稳定**：纯静态文件，可托管在 GitHub Pages / Vercel / Netlify / 任意静态空间，无数据库、无后端

> 🎓 **新手看这篇**：[写博客、推链接、传图片的完整教程](posts/writing-guide.html) —— 手把手教你发文章、加链接、传图片/音频、分享大文件、推送到 GitHub。也可以直接看本文件下方的「新增一篇文章」。


## 目录结构

```
blog/
├─ index.html          # 首页（Hero + 最新文章 + 分类入口 + 右侧栏）
├─ login.html          # 登录页（全屏背景 + 诗句竖排 + 拖动人机验证）
├─ posts.html          # 文章列表 / 归档（搜索 + 分类筛选）
├─ notes.html          # 学习笔记（笔记文章卡片 + 搜索）
├─ resources.html      # 资源分享（网盘卡片 + 资源搜索）
├─ tags.html           # 标签页（按主题聚合文章）
├─ music.html          # 音乐页（黑胶唱片播放器，与右栏播放器共享状态）
├─ about.html          # 关于我
├─ course-food-safety.html  # 食品安全课程资料入口
├─ course-engdraw.html       # 工程图学课程资料入口
├─ course-engtrain.html      # 工程训练课程资料入口
├─ course-ode.html           # 常微分方程课程资料入口
├─ course/                  # 每份课程资料一个独立网页
│  ├─ fss-notes.html        # 食品安全 PDF 笔记阅读页（blob 解密 + #view=Fit 整页）
│  ├─ fss-guide.html        # 复习纲要阅读页（iframe 全屏嵌入 HTML）
│  ├─ fss-qa.html           # 问题答案版阅读页（fetch md + 极简渲染）
│  └─ engdraw-terms.html    # 工程制图名词术语在线阅读页（静态 HTML + Word 下载）
├─ assets/
│  ├─ css/style.css    # 设计系统（所有样式）
│  ├─ css/login.css    # 登录页专属样式（玻璃卡片/诗句/验证轨道）
│  ├─ img/             # 图片素材（壁纸 + 小鸟头像 avatar*.jpg + 封面 + login-bg*）
│  ├─ audio/           # 音频（可按需新建）
│  ├─ video/           # 视频（可按需新建）
│  ├─ files/           # 课程资料等可下载文件（含 .dat 混淆 PDF 与可下载 docx/md）
│  └─ js/
│     ├─ posts-data.js     # 文章元数据（唯一数据源，含 tags 标签）
│     ├─ tracks.js         # 音乐歌单唯一数据源（含 SITE_MUSIC_BASE 站点根推导）
│     ├─ login.js          # 登录页逻辑（诗句库/拖拽验证/登录态）
│     ├─ music-player.js   # 音乐页黑胶播放器视图（挂到 app.js 的全局控制器）
│     ├─ fss-viewer.js     # 课程资料阅读器（PDF 解密 + md 渲染 + guide 嵌入）
│     └─ app.js            # 交互（侧边栏/主题/搜索/标签/拖动调宽/渲染/登录胶囊/PJAX/全局迷你播放器控制器）
├─ music/              # 歌曲文件（mp3，与 tracks.js 一一对应）
└─ scripts/
   └─ server.py        # 本地预览服务器（支持 HTTP Range，进度条可拖拽）
└─ posts/              # 文章正文（每篇一个 HTML）
   ├─ effective-note-taking.html
   ├─ circuit-analysis-notes.html
   ├─ study-resources-pack.html
   ├─ why-i-write.html
   └─ writing-guide.html   # 发文章/传图/加音频/推 GitHub 教程
```

## 本地预览

任选一种方式启动本地服务器，然后访问 `http://localhost:8000`：

```bash
# Python（推荐，自带脚本支持 HTTP Range，进度条可正常拖拽）
python scripts/server.py 8000

# 或 Node
npx serve .
```

> ⚠️ 不要用 `python -m http.server` 做预览：它不支持 HTTP Range，浏览器无法按区间取流，**点击/拖动音乐进度条会导致歌曲从头播放**。线上部署（GitHub Pages 等）无此问题。
>
> 直接双击 `index.html` 也能看（`file://` 下播放器已做兼容），但搜索等 `fetch` 功能受限，建议用本地服务器。

### 进度条拖拽说明

右栏迷你播放器和音乐页黑胶的进度条都支持**点击定位**和**按住拖动**（拖动时实时预览时间与进度，松手才真正跳转）。若跳转后歌曲从头播放并出现控制台提示，即说明当前服务器不支持 Range——换用上面的推荐命令即可。

## 新增一篇文章

1. **写正文**：复制 `posts/why-i-write.html`，重命名为 `posts/<你的slug>.html`，修改标题、日期、分类与 `.prose` 正文。分类目前支持：`笔记` / `资料` / `随笔` / `指南`（颜色和侧边条会按分类自动变化）。
2. **登记元数据**：在 `assets/js/posts-data.js` 的数组里加一条：

```js
{
  slug: "your-slug",          // 与文件名一致（不含 .html）
  title: "文章标题",
  cat: "笔记",                // 笔记 / 资料 / 随笔 / 指南
  date: "2026-08-09",         // YYYY-MM-DD
  readTime: "8 分钟",
  excerpt: "一句话摘要，会显示在卡片上。",
  tags: ["标签1", "标签2"],   // 可选，会出现在「标签」页
  // href: "course/xxx.html"  // 可选：自定义跳转链接（默认 posts/<slug>.html）
}
```

首页「最新文章」、归档页列表会自动更新，无需改其他文件。写了 `tags` 的文章会自动出现在 [标签页](tags.html)。

> 💡 如果文章正文不在 `posts/<slug>.html`（比如复用已有的 `course/<xxx>.html` 阅读页），可在元数据里加 `href: "course/xxx.html"` 自定义跳转链接，slug 仍作为唯一标识。

## 新增一首歌曲

1. 把 mp3 文件放进 `music/` 目录（文件名建议用英文或已 URL 编码的中文）。
2. 在 `assets/js/tracks.js` 的 `SITE_TRACKS` 数组里加一条：

```js
{ title: "曲子名", src: "music/你的文件.mp3" },
```

右栏迷你播放器和音乐页黑胶播放器会同时更新，无需改其它文件。`src` 写**站点根相对路径**即可，部署在域名根、GitHub Pages 项目子目录或本地 `file://` 打开都能播。

## 内容分类规则

页面与文件按"是本地内容还是外部链接"分工，避免重复收录：

| 页面 / 区块 | 内容范围 | 同步要求 |
|---|---|---|
| **`posts.html`** 全部文章 | **所有本地文件**——随笔 / 笔记 / 资料（含课程笔记、可下载的本地文档等），全部走 `posts-data.js` | 上传到本地的笔记/资料类文章，**必须**同步登记到 `posts-data.js`，并按需在 `notes.html` 课程专区或对应课程页里加入口 |
| **`notes.html`** 学习笔记 | 课程笔记（按课程聚合，含课程专区 banner + 笔记文章卡片） | 本地笔记资源在 `notes.html`（课程 banner / 笔记列表）和 `posts.html`（全部文章列表）**双向同步** |
| **`resources.html`** 资源分享 | **仅外部链接**——百度/夸克网盘分享、第三方网址、GitHub 仓库等 | 不收录本地文件；本地文件请走 `posts.html` |

**判定流程**
1. 内容是**外部链接**（网盘分享、URL、仓库）？→ 进 `resources.html`
2. 内容是**本地文件**（自己的笔记、资料、术语释义等），哪怕只是一段定义汇编？→ 进 `posts.html`（并视情况同步到 `notes.html` 课程专区）
3. 属于**某门课**的资料合集？→ 在 `posts.html` 收录的同时，为该课程建 `course-<slug>.html`（参考 `course-food-safety.html` / `course-engdraw.html`），并在 `notes.html` 顶部加 `course-banner` 入口

### 在文章里嵌入图片 / 音频 / 视频

- **图片**：文件放 `assets/img/`，正文写 `<img src="../assets/img/xxx.png" alt="说明">`
- **音频**：文件放 `assets/audio/`，正文写 `<audio controls preload="metadata"><source src="../assets/audio/xxx.mp3" type="audio/mpeg"></audio>`
- **视频**：文件放 `assets/video/`，正文写 `<video controls preload="metadata"><source src="../assets/video/xxx.mp4" type="video/mp4"></video>`
- **大文件（>50MB）**：一律走网盘直链，见「新增一篇文章」里的链接写法；小文件可放 `assets/files/` 提供下载

详细用法（含示例代码）见 [写博客、推链接、传图片的完整教程](posts/writing-guide.html)。

## 部署到 GitHub Pages（推荐，最稳）

```bash
cd blog
git init
git add -A
git commit -m "feat: initial blog"
git branch -M main
git remote add origin https://github.com/IVY-ZJ/Ivy-s-Blog.git
git push -u origin main
```

然后在 GitHub 仓库 → **Settings → Pages → Build and deployment → Source 选 "Deploy from a branch"**，分支选 `main`、目录选 `/ (root)`，保存即可。几分钟后访问 `https://ivy-zj.github.io/Ivy-s-Blog/`。

### 绑定自己的域名（可选）
在仓库 Settings → Pages → Custom domain 填入你的域名，并按提示添加 CNAME 解析即可。

## 自定义

- **配色**：修改 `assets/css/style.css` 顶部的 `:root` 变量（系统蓝、圆角、阴影、侧边栏宽度等）。
- **字体**：默认使用系统字体（Apple 设备即 SF Pro，正文阅读用 New York 衬线）。想换字体改 `--font-ui` / `--font-read` 即可。
