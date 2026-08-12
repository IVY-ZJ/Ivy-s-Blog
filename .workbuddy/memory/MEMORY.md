# 项目长期记忆 · Ivy 博客

> 提炼自每日工作日志。不可从代码直接推导的经验、决策与待办才写这里。
> 日常细节见 `memory/YYYY-MM-DD.md`。

## 项目概况
- 个人静态博客「Ivy 学习笔记与资源分享」，纯 HTML/CSS/原生 JS，**无后端**。
- 工作区：`C:\Users\Li Xiang\Desktop\my blog`（含 `posts/`、`assets/css|js|img`、`music/`、`index.html` 等）。
- 设计语言：iOS 风格（玻璃拟态、SF Pro 字体、系统色）。主题键统一为 `localStorage['Ivy-theme']`（light/dark）。
- **品牌词（2026-08-12 起）**：左侧边栏 / 登录页左上角的品牌文字统一为 **`Ivy's Open Folio`**（原为 `Ivy`）。涉及 `<span class="brand-name">`、登录页 `<strong>` + `aria-label`、首页移动端 `<span class="topbar-title">`。注意：更长，sidebar 内约 146px < 183px 可用宽，单行星号足够；正文里的 "Ivy"/"IVY"（作者署名、标题、版权、头像 alt）未改。

## 登录系统（2026-08 搭建，已完成 R1–R3）
架构：登录页 `login.html` + `assets/css/login.css` + `assets/js/login.js`；站点通用 `assets/js/app.js` 负责注入登录态 UI 与守卫。

### 核心文件职责
- `login.html`：全屏照片背景、玻璃登录卡、右侧竖排诗句、左上品牌头像、主题切换。
- `assets/js/login.js`：
  - `POETRY`：60 句积极立意 couplet，格式 `["上句","下句","作者"]`，`sessionStorage['ivy-last-couplet']` 防连续重复。
  - `initCaptcha()`：6 种 SVG 图形（月/日/心/雪花/星/叶）拖动到右侧虚线轮廓，容差 14px，pointer events + 键盘方向键；成功解锁按钮。暴露 `window.__ivyCaptcha = { refresh, isVerified }`。
  - `initForm()`：校验 用户名非空 + 邮箱正则 + 人机验证，写 `localStorage['ivy-session']`（username/email/hash/loggedAt/verified，30 天 TTL）。
  - `maybeSkipIfLoggedIn()`：已登录访问 login.html 自动跳回首页。
- `assets/js/app.js`：`ensureSessionNodes()` 在有 `.right-rail` 的页面（仅首页）向 body 注入 `position: fixed` 的 `.rail-greeting`（紧贴 tags 卡片上方、单行 "Hello, {name} 👋"）；无右栏页面**不再注入**任何登录问候元素。`renderSession()` 控制 rail-greeting 显隐并加 `is-shown` 类触发淡入；`bindLogout()` 退出清 session。
- 背景图：`assets/img/login-bg.jpg`（亮，沙漠黄昏）、`login-bg-dark.jpg`（暗，星空巨石阵，来自根目录原图）。

### 关键决策
- 登录**不需要密码**，只需 用户名 + 邮箱 + 人机验证（用户明确 Round 2）。
- 登录态仅靠 `localStorage`，**纯前端演示，非安全方案**；真正的鉴权必须放服务端。
- 主题键在 login.js 与 app.js 间统一为 `Ivy-theme`（曾因 `ivy-theme`/`Ivy-theme` 不一致踩坑）。

### 已知坑（已解决，记录备查）
- 主样式 `body::before` 全局壁纸层（z-index -2）会盖住 `.login-bg`（z-index -3）→ 用 `.login-body::before/::after { content: none !important }` 关闭。
- agent-browser 自带 Chrome 在 Windows 报 exit code 3 → 改用 `--executable-path "C:\Program Files\Google\Chrome\Application\chrome.exe"` + 全路径 `node.exe` 驱动 `agent-browser.js`。
- 移动端诗句栏与 fixed 品牌重叠 → brand `position: fixed; z-index:100` 兜底 + poetry `position: static; margin: 64px auto 6px`。
- agent-browser 截图子命令没有 `--viewport` 参数，viewport 用 `set viewport <w> <h>` 单独设；不要把 `--viewport 1280x900` 加在 `screenshot` 后，会被当成保存路径。
- 自动登录态模拟：用 `--init-script <path>` 注入 JS，在 page scripts 之前预写 `localStorage['ivy-session']` 走完整页面（guard 不会跳 login.html）。

## 品牌区与首页右栏布局（2026-08-11 R5）
- 13 个 HTML 全部删除 `<span class="brand-sub">学习笔记 · 资源分享</span>`；`posts/*.html` 是单行内联形式，主站其它页是多行带缩进，统一用 Python 脚本 regex 一次处理。
- `.brand` CSS：`min-height: 48px`，`.brand-text` 用 `justify-content: center; min-height: 44px`，`.brand-name` 升级到 `18px / weight 800`。配合原 `align-items: center`，`getBoundingClientRect` 验证 avatar center 与 brand-name center 完全重合（都 y=53）。
- 侧栏拖宽边界：app.js `MIN_W = 230, MAX_W = 260`（CSS 默认 `--sidebar-w: 260px` 不变）。
- 音乐页副标题音乐：`music.html` `play()` 中 `"本地音频 · " + 文件名` 已改为 `"— " + 文件名`；首页右侧 mini 播放器的 `npArtistEl.textContent` 已设为 `""`（选中曲目后不再显示副标题）。
- `.rail-greeting`（fixed 浮层）位于右栏正上方、tags 卡片之前；top=`calc(env + 14px)`、right=18、宽 220、单行（`Hello, {name} 👋`）。`@media (max-width: 1280px)` 隐藏。

## 待办 / 进行中
- ~~Round 4（已完成 2026-08-11）~~：见 `2026-08-11.md`「第四轮迭代」段。要点：
  - `.mark-avatar` 用渐变环；卡头无头像。
  - `app.js` IIFE 顶部 `guardSession()` 全局登录守卫（顶层页 + `/posts/`），无 session 跳 `login.html?back=...`；`login.html` 不加载 `app.js`，无重定向循环。
  - 诗句列无横杠，表单无 "遇到问题？"。
  - 邮箱正则升级为 `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/`；按钮只在「用户名 ∧ 通过的邮箱 ∧ 人机验证」齐备时启用（`syncLoginBtn()`）。
- Round 5（已完成 2026-08-11）：见 `2026-08-11.md`「第五轮迭代」段。要点：
  - 13 个 HTML 删 brand-sub，`Ivy` 18px/800 与 44px 头像完全居中对齐。
  - 问候语从 sidebar 底部搬到首页右栏 fixed 上方（与头像齐平或略高）；其它页面保持 brand 下方插入兜底。
  - "本地音频" 两个地方（app.js npArtist、music.html mpSub）都已替换/清空。
  - 侧栏拖宽边界改为 230~260，clamp 测试通过。
- Round 6（已完成 2026-08-11）：见 `2026-08-11.md`「第六轮迭代」段。要点：
  - 删除兜底逻辑：所有页面 sidebar 不再注入任何 hello-line；左侧栏彻底没了"Hello, xxx"。
  - 首页右栏问候语单行化：去掉"欢迎回来"eyebrow、缩小尺寸、top 调到 `env+14`（实测不再遮挡 tags 卡片，间距 14.5px）。
  - 登录 captcha 6 图形中替换掉 yin-yang/太极（用户叫它"八卦"），改成粉色心形；六图变：月/日/❤️ 雪花/星/叶。
  - 登录页用户名 placeholder 从 "Ivy" 改为 "你的名字"。
  - **踩坑**：`eval localStorage.clear()` 不会清掉 init-script，init-script 在每次页面加载时都重新写；要测未登录态必须 `close --all` 重启 daemon 且不带 `--init-script`。

## 验证方式
- 用 agent-browser + 系统 Chrome 截图测试：亮/暗主题、拖动验证、完整登录→跳转→胶囊/Hello、退出→回 login、移动端 390px。
- agent-browser 截图路径必须用 Windows 形式 `C:/Users/...`（不要用 Git Bash 的 `/c/...`）；静态测试用 `python -m http.server` 在博客根起 8080。
- 拖动验证可走 eval 合成 PointerEvent（pointerdown 在 piece 上、pointermove/up 在 window 上，clientX 直接给到目标中心），不必走真实鼠标拖拽。

## 安全防护（2026-08-12 起，前端轻量加固）
- 本站纯静态、无后端 → 反爬/反自动化只能「增加成本」，真正防护在服务端/CDN。GitHub 调研结论：最强 bot 防护都在 CDN/WAF 层。
- 已落地（前端层）：13 个 HTML 注入 CSP `<meta>` + referrer meta；全站无内联脚本/on* 处理器（music.html 内联已外置 music-player.js）；app.js + login.js 各一份 frameBust() 反点击劫持；about.html 邮箱倒序存 data-mail 运行时还原；login.js 蜜罐字段 #hp-field + 客户端限流 ivy-login-attempts（60s≥8 锁）；robots.txt 拦 /assets/js/、/assets/css/。
- 已知局限：CSP 经 `<meta>` 投递时 `frame-ancestors` 被浏览器忽略（实测），frame-buster JS 仅兜底。X-Content-Type-Options/nosniff、HSTS、真正的 frame-ancestors、Permissions-Policy 只能靠 HTTP 响应头 → 需用 Cloudflare（免费即可加这些头 + WAF + 速率限制 + Bot Fight Mode）或 Netlify _headers / Vercel vercel.json。GitHub Pages 不支持自定义响应头。
- 登录态纯 localStorage，是前端演示非真鉴权。

## 工具坑（环境相关）
- Bash 的 `rm` 被 fail-closed 的 safe-delete 包装拦截：`/c/Users/...` 路径会被转成 `\c\Users\...` 后被判「非绝对路径」而拒绝删除（SAFE_DELETE_FAIL_CLOSED，文件没删掉）。解决：删除时传 Windows 形式绝对路径 `C:/Users/.../file`（含盘符、正斜杠），包装会正常送回收站。PowerShell `Remove-Item` 同样被拦。
