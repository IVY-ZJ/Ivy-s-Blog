# Ivy 个人博客

一个用于分享**学习笔记**与**资源**的个人博客。

## 特性

- **iOS 设计语言**：系统字体、毛玻璃侧边栏、圆角卡片、系统配色、明暗自动切换（可手动覆盖）
- **壁纸背景 + 液态玻璃**：两张 4K iOS 壁纸作为明暗两套背景，卡片与侧边栏为「液态玻璃」半透明毛玻璃，不干扰阅读
- **媒体内容**：文章支持直接嵌入图片、音频、视频，以及大文件（网盘直链）
- **侧边栏导航**：首页 / 全部文章 / 学习笔记 / 资源分享 / 关于我，移动端折叠为抽屉
- **主页右侧栏**：首页右侧有一个无轮廓的浮动小部件栏（标签云 / 音乐入口 / 关于），桌面端随内容滚动吸附
- **可拖动侧边栏**：桌面端拖动侧边栏右缘可自由调整宽度（230–260px），偏好会被记住
- **标签系统**：「标签」页按主题聚合文章，点击标签即可筛选；首页右侧栏也展示标签
- **站内搜索 + 分类筛选**：「全部文章」页可按关键词与分类过滤，「资源分享」页可搜索资源，「学习笔记」页可搜索笔记
- **小鸟头像**：侧边栏、关于页、文章作者位均使用小鸟头像
- **登录页**：全屏照片背景 + 玻璃拟态卡片，右侧竖排展示 60 句积极诗句（每次随机、可手动切换），内置「拖动图形到目标位置」的人机验证；登录态保存在 localStorage（30 天），侧边栏显示用户胶囊并支持一键退出，首页右栏顶部显示单行问候「Hello, 用户名」
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
├─ music.html          # 音乐页（音频播放示例）
├─ about.html          # 关于我
├─ assets/
│  ├─ css/style.css    # 设计系统（所有样式）
│  ├─ css/login.css    # 登录页专属样式（玻璃卡片/诗句/验证轨道）
│  ├─ img/             # 图片素材（壁纸 + 小鸟头像 avatar*.jpg + 封面 + login-bg*）
│  ├─ audio/           # 音频（可按需新建）
│  ├─ video/           # 视频（可按需新建）
│  ├─ files/           # 可下载的小文件（可按需新建）
│  └─ js/
│     ├─ posts-data.js # 文章元数据（唯一数据源，含 tags 标签）
│     ├─ login.js      # 登录页逻辑（诗句库/拖拽验证/登录态）
│     └─ app.js        # 交互（侧边栏/主题/搜索/标签/拖动调宽/渲染/登录胶囊）
└─ posts/              # 文章正文（每篇一个 HTML）
   ├─ effective-note-taking.html
   ├─ circuit-analysis-notes.html
   ├─ study-resources-pack.html
   ├─ why-i-write.html
   └─ writing-guide.html   # 发文章/传图/加音频/推 GitHub 教程
```

## 本地预览

任选一种方式启动本地服务器，然后访问 `http://localhost:8000`
http://localhost:8000：

```bash
# Python（推荐）
cd blog
python -m http.server 8000

# 或 Node
npx serve blog
```

> 直接双击 `index.html` 也能看，但搜索/相对路径在 `file://` 下可能受限，建议用本地服务器。

## 新增一篇文章

1. **写正文**：复制 `posts/why-i-write.html`，重命名为 `posts/<你的slug>.html`，修改标题、日期、分类与 `.prose` 正文。分类目前支持：`笔记` / `资源` / `随笔` / `指南`（颜色和侧边条会按分类自动变化）。
2. **登记元数据**：在 `assets/js/posts-data.js` 的数组里加一条：

```js
{
  slug: "your-slug",          // 与文件名一致（不含 .html）
  title: "文章标题",
  cat: "笔记",                // 笔记 / 资源 / 随笔 / 指南
  date: "2026-08-09",         // YYYY-MM-DD
  readTime: "8 分钟",
  excerpt: "一句话摘要，会显示在卡片上。",
  tags: ["标签1", "标签2"],   // 可选，会出现在「标签」页
}
```

首页「最新文章」、归档页列表会自动更新，无需改其他文件。写了 `tags` 的文章会自动出现在 [标签页](tags.html)。

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
