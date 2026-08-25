/* Ivy's blog — interactivity (no dependencies)
   - System-following theme with manual override
   - Mobile sidebar drawer
   - Active nav highlighting
   - Client-side search & category filter
   - Dynamic recent / archive rendering
   - Staggered entrance reveals
   - PJAX in-site navigation (right rail is re-injected on every swap)
   - Global singleton mini-player (audio survives PJAX page swaps;
     the right-rail widget and music.html vinyl are views over it)
*/
(function () {
  "use strict";

  /* ---------- Anti-clickjacking (frame-buster) ----------
     Backstop for the frame-ancestors CSP directive, which is ignored when
     CSP is delivered via a <meta> element. If this page is framed, escape. */
  (function frameBust() {
    if (window.self === window.top) return;
    try {
      window.top.location = window.self.location;
    } catch (e) {
      document.documentElement.style.display = "none";
      document.addEventListener("DOMContentLoaded", function () {
        document.body.style.display = "none";
      });
    }
  })();

  /* ---------- Site root ----------
     Derived from this very <script> URL so it stays correct at the
     domain root, under sub-path deployments (GitHub Pages project
     sites like /<repo>/…), and under file:// alike. The old per-page
     depth heuristic cannot know the deploy base and broke on
     project-site URLs. */
  var SITE_ROOT = (function () {
    var s = document.querySelector('script[src*="app.js"]');
    if (s && s.src) {
      var parts = s.src.split("/");
      if (parts.length > 3) {
        parts.pop(); // app.js
        parts.pop(); // js/
        parts.pop(); // assets/
        return parts.join("/") + "/";
      }
    }
    return null;
  })();
  function siteUrl(rel) {
    return (SITE_ROOT || "") + rel;
  }
  function assetRoot() { return siteUrl("assets/"); }

  /* ---------- Login guard ----------
     Any site page that loads app.js is gated. Without a valid session
     (missing or past the 30-day TTL), bounce to login.html — this stops
     visitors from deep-linking index.html / posts to skip the login.
     login.html itself loads login.js (not app.js), so no redirect loop. */
  function loginPathFor() {
    // SITE_ROOT keeps this correct at domain root, under sub-path
    // deployments (/<repo>/login.html), and on subdirectory pages alike.
    return siteUrl("login.html");
  }
  function guardSession() {
    var valid = false;
    try {
      var s = JSON.parse(localStorage.getItem("ivy-session") || "null");
      valid = !!(s && s.loggedAt && Date.now() - s.loggedAt < 30 * 24 * 3600 * 1000);
    } catch (e) { valid = false; }
    if (valid) return false;
    var pop = location.pathname.split("/").pop();
    var isSub = location.pathname.split("/").filter(Boolean).length > 1;
    var back = (isSub ? "posts/" : "") + pop + (location.search || "");
    // for subdir pages other than posts/, keep the directory in the back path
    if (isSub && location.pathname.indexOf("/posts/") < 0) {
      var dir = location.pathname.split("/").slice(0, -1).pop();
      back = dir + "/" + pop + (location.search || "");
    }
    location.replace(loginPathFor() + "?back=" + encodeURIComponent(back));
    return true;
  }
  if (guardSession()) return;

  /* ---------- Email obfuscation ----------
     data-mail holds the address reversed; decode at runtime so naive HTML
     scrapers harvesting the source don't get a valid mailto:. */
  (function deobfuscateMail() {
    var links = document.querySelectorAll("a[data-mail]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var addr = a.getAttribute("data-mail").split("").reverse().join("");
      a.setAttribute("href", "mailto:" + addr);
      if (!a.textContent.trim()) a.textContent = addr;
    }
  })();

  /* ---------- Global right-rail (tags + mini player) ----------
     The rail is injected into every page (except music.html and
     login.html). Injection runs on every initPage() — including after
     each PJAX swap — because a swapped-in <main> comes from the server
     without a rail, so it must be re-added and re-mounted every time. */
  function shouldShowRail() {
    /* 全站（除音乐页 / 登录页）都注入右栏；配合宽屏下的 position:sticky，
       滚动文章时标签与音乐面板吸附在视口内不随内容滚走。 */
    var pop = location.pathname.split("/").pop() || "";
    return pop !== "music.html" && pop !== "login.html";
  }
  function ensureTracks() {
    return new Promise(function (resolve) {
      if (window.SITE_TRACKS) { resolve(); return; }
      var s = document.createElement("script");
      s.src = assetRoot() + "js/tracks.js";
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  /* ---------- Global mini-player controller (singleton) ----------
     One <audio> lives on <body>, outside <main>, so PJAX swaps never
     destroy it and music keeps playing across page changes. Each
     visible widget (right rail / music-page vinyl) registers as a
     lightweight "view"; the controller notifies live views on every
     state change. Track sources resolve against SITE_MUSIC_BASE
     (see tracks.js), derived from tracks.js's own URL — playback works
     at domain root, in sub-path deployments, and under file:// alike. */
  function npController() {
    if (window.__npController) return window.__npController;

    var audio = document.createElement("audio");
    audio.preload = "metadata";
    document.body.appendChild(audio);

    var views = [];
    var cur = -1;
    // While the user is dragging a progress bar we hold the tentative
    // ratio here so views can preview it without touching audio.currentTime
    // (committing on every mousemove would re-buffer the stream constantly).
    var previewRatio = null;

    function tracks() { return window.SITE_TRACKS || []; }
    function trackSrc(t) { return (window.SITE_MUSIC_BASE || "/") + t.src; }
    function fmt(s) {
      s = Math.max(0, Math.floor(s || 0));
      var m = Math.floor(s / 60), r = s % 60;
      return m + ":" + (r < 10 ? "0" : "") + r;
    }
    // Drop views whose DOM was removed (e.g. the old page after PJAX swap)
    function notify() {
      views = views.filter(function (v) { return v.root && v.root.isConnected; });
      views.forEach(function (v) { v.sync(); });
    }
    function load(i, autoplay) {
      var list = tracks();
      if (!list.length) return;
      i = ((i % list.length) + list.length) % list.length; // wrap both ways
      cur = i;
      previewRatio = null;
      audio.src = trackSrc(list[i]);
      if (autoplay) play();
      else notify();
    }
    function play() { audio.play().catch(function () {}); }
    function togglePlay() {
      if (cur === -1) { load(0, true); return; }
      if (audio.paused) play(); else audio.pause();
    }
    function toggle(i) {
      if (i === cur) togglePlay();
      else load(i, true);
    }
    function next() { load(cur + 1, true); }
    function prev() { load(cur - 1, true); }
    function seek(ratio) {
      if (!audio.duration || !isFinite(audio.duration)) return;
      var target = Math.max(0, Math.min(1, ratio)) * audio.duration;
      audio.currentTime = target;
      // Detect servers without HTTP Range support (e.g. `python -m
      // http.server`): the browser cannot fetch a byte range and instead
      // re-downloads from 0:00 — the user sees the song "restart". GitHub
      // Pages / Vercel / Netlify all support Range; only local previews hit this.
      if (target > 5) {
        setTimeout(function () {
          if (audio.currentTime < Math.min(target * 0.1, target - 3)) {
            console.warn(
              "[player] 当前进度跳转被重置：本地服务器不支持 HTTP Range。" +
              "请改用 python scripts/server.py 或 npx serve 启动预览（线上部署不受影响）。"
            );
          }
        }, 800);
      }
    }
    // Live preview while dragging (null = stop previewing)
    function setPreview(ratio) {
      previewRatio = ratio == null ? null : Math.max(0, Math.min(1, ratio));
      notify();
    }

    /* Shared drag-to-seek for every progress bar (rail + music page).
       pointerdown/move only PREVIEW; pointerup commits one real seek. */
    function attachSeek(bar) {
      if (!bar || bar.dataset.seekBound) return;
      bar.dataset.seekBound = "1";
      var dragging = false;
      function ratioFrom(e) {
        var r = bar.getBoundingClientRect();
        return r.width ? (e.clientX - r.left) / r.width : 0;
      }
      bar.addEventListener("pointerdown", function (e) {
        if (!audio.duration || !isFinite(audio.duration)) return;
        dragging = true;
        bar.classList.add("dragging");
        try { bar.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
        setPreview(ratioFrom(e));
        e.preventDefault();
      });
      bar.addEventListener("pointermove", function (e) {
        if (dragging) setPreview(ratioFrom(e));
      });
      function commit() {
        if (!dragging) return;
        dragging = false;
        bar.classList.remove("dragging");
        if (previewRatio != null) seek(previewRatio);
        setPreview(null);
      }
      bar.addEventListener("pointerup", commit);
      bar.addEventListener("pointercancel", commit);
    }

    audio.addEventListener("play", notify);
    audio.addEventListener("pause", notify);
    audio.addEventListener("ended", function () { next(); });
    audio.addEventListener("timeupdate", notify);
    audio.addEventListener("loadedmetadata", notify);

    window.__npController = {
      audio: audio,
      current: function () { return cur; },
      tracks: tracks,
      trackSrc: trackSrc,
      fmt: fmt,
      togglePlay: togglePlay,
      toggle: toggle,
      next: next,
      prev: prev,
      seek: seek,
      preview: function () { return previewRatio; },
      attachSeek: attachSeek,
      mount: function (view) { views.push(view); view.sync(); }
    };
    return window.__npController;
  }
  // Exposed for assets/js/music-player.js (the vinyl player is just
  // another view over this same controller).
  window.npController = npController;

  function injectRightRail() {
    if (document.querySelector(".right-rail")) return;
    var main = document.querySelector(".main");
    if (!main) return;

    var rail = document.createElement("aside");
    rail.className = "right-rail";
    var railSticky = document.createElement("div");
    railSticky.className = "rail-sticky";
    railSticky.innerHTML =
      '<div class="rail-card reveal" data-delay="2">' +
        '<div class="rail-title">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 11 3.8a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v5.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l5.6-5.6a2 2 0 0 0 0-2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>' +
          "标签" +
        "</div>" +
        '<div class="rail-tags" id="rail-tags"></div>' +
      "</div>" +
      '<div class="rail-card reveal" data-delay="4">' +
        '<div class="rail-title">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
          "音乐" +
        "</div>" +
        '<div class="rail-music">' +
          '<div class="np-player" id="np-player">' +
            '<div class="np-disc-wrap"><div class="np-disc" id="np-disc"><div class="np-disc-art">♫</div></div><div class="np-arm"></div></div>' +
            '<div class="np-info"><div class="np-track" id="np-track">选择一首曲子</div></div>' +
            '<div class="np-controls">' +
              '<button class="np-btn" id="np-prev" type="button" aria-label="上一首"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg></button>' +
              '<button class="np-btn np-play" id="np-play" type="button" aria-label="播放/暂停"><svg class="np-ic-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><svg class="np-ic-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>' +
              '<button class="np-btn" id="np-next" type="button" aria-label="下一首"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg></button>' +
            "</div>" +
            '<div class="np-progress"><span class="np-time" id="np-time-cur">0:00</span><div class="np-bar" id="np-bar"><div class="np-bar-fill" id="np-bar-fill"></div></div><span class="np-time" id="np-time-total">0:00</span></div>' +
            '<div class="np-actions"><a class="np-open" href="' + siteUrl("music.html") + '">进入音乐页<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>' +
          "</div>" +
        "</div>" +
      "</div>";

    // Wrap everything except the footer: <main> becomes
    // .home-layout > (.home-main + aside.right-rail); .foot stays full-width.
    var homeLayout = document.createElement("div");
    homeLayout.className = "home-layout";
    var homeMain = document.createElement("div");
    homeMain.className = "home-main";
    var moved = [];
    Array.prototype.forEach.call(main.children, function (n) {
      if (!(n.classList && n.classList.contains("foot"))) moved.push(n);
    });
    moved.forEach(function (n) { homeMain.appendChild(n); });
    rail.appendChild(railSticky);
    homeLayout.appendChild(homeMain);
    homeLayout.appendChild(rail);
    main.insertBefore(homeLayout, main.firstChild);
  }

  /* Pin the rail like the navbar: position:fixed keeps it motionless for
     the entire page (sticky alone still releases near the page bottom). */
  function pinRail() {
    var aside = document.querySelector(".right-rail");
    if (!aside) return;
    var st = aside.querySelector(".rail-sticky");
    if (!st) return;
    if (!window.matchMedia("(min-width: 1281px)").matches) {
      st.style.position = "";
      st.style.top = "";
      st.style.left = "";
      st.style.width = "";
      return;
    }
    // Anchor the rail's right edge to the right edge of the top navbar so
    // the floating widget column visually lines up with the navbar envelope
    // (.main is wider than .globalnav by design, so a naive aside bounding
    // rect leaves the rail noticeably inset from the navbar's right side).
    var nav = document.querySelector(".globalnav");
    var railW = Math.round(aside.getBoundingClientRect().width) || 285;
    if (nav) {
      var nr = nav.getBoundingClientRect();
      st.style.position = "fixed";
      st.style.top = "79px";
      st.style.left = Math.round(nr.right - railW) + "px";
      st.style.width = railW + "px";
    } else {
      var r = aside.getBoundingClientRect();
      st.style.position = "fixed";
      st.style.top = "79px";
      st.style.left = Math.round(r.left) + "px";
      st.style.width = railW + "px";
    }
  }
  window.addEventListener("resize", pinRail);

  /* Mount the right-rail mini player as one view of the shared controller. */
  function mountRailPlayer(root) {
    if (!root || root.dataset.npBound) return;
    root.dataset.npBound = "1";
    var np = npController();

    var el = {
      play: root.querySelector("#np-play"),
      prev: root.querySelector("#np-prev"),
      next: root.querySelector("#np-next"),
      bar: root.querySelector("#np-bar"),
      fill: root.querySelector("#np-bar-fill"),
      tCur: root.querySelector("#np-time-cur"),
      tTotal: root.querySelector("#np-time-total"),
      track: root.querySelector("#np-track")
    };

    function sync() {
      var curIdx = np.current();
      var list = np.tracks();
      var t = curIdx >= 0 ? list[curIdx] : null;
      el.track.textContent = t ? t.title : "选择一首曲子";
      var playing = !!t && !np.audio.paused;
      root.classList.toggle("playing", playing);
      el.play.setAttribute("aria-label", playing ? "暂停" : "播放");
      var d = np.audio.duration || 0;
      // While dragging, show the tentative position instead of playback time
      var pr = np.preview();
      var shown = (pr != null && d) ? pr * d : np.audio.currentTime;
      el.tCur.textContent = np.fmt(shown);
      el.tTotal.textContent = np.fmt(d);
      el.fill.style.width = (d ? (shown / d * 100) : 0) + "%";
    }

    el.play.addEventListener("click", function () { np.togglePlay(); });
    el.prev.addEventListener("click", function () { np.prev(); });
    el.next.addEventListener("click", function () { np.next(); });
    np.attachSeek(el.bar);

    np.mount({ root: root, sync: sync });
  }

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var saved = localStorage.getItem("Ivy-theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function setTheme(mode) {
    if (mode === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    localStorage.setItem("Ivy-theme", mode);
    syncThemeUI();
  }

  // Keep the switch thumb's aria state in sync with the actual theme.
  function syncThemeUI() {
    var cur = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-checked", cur === "dark" ? "true" : "false");
    });
  }

  // Toggle cycles light <-> dark
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    var cur = root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var next = cur === "dark" ? "light" : "dark";
    setTheme(next);
  });

  // Follow system changes when no explicit override
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!localStorage.getItem("Ivy-theme") ||
        localStorage.getItem("Ivy-theme") === "system") {
      root.removeAttribute("data-theme");
    }
    syncThemeUI();
  });
  syncThemeUI();

  /* ---------- Session pill (login state surfaced in every sidebar) ---------- */
  function readSession() {
    try {
      var s = JSON.parse(localStorage.getItem("ivy-session") || "null");
      if (s && s.loggedAt && Date.now() - s.loggedAt < 30 * 24 * 3600 * 1000) return s;
    } catch (e) { /* ignore */ }
    return null;
  }
  function clearSession() {
    localStorage.removeItem("ivy-session");
  }
  function ensureSessionNodes() {
    // Inject session pill + login cta into every .sidebar-foot that doesn't already have them.
    var feet = document.querySelectorAll(".sidebar-foot");
    feet.forEach(function (foot) {
      var has = foot.querySelector("[data-session-pill]");
      if (!has) {
        var pill = document.createElement("div");
        pill.className = "session-pill";
        pill.setAttribute("data-session-pill", "");
        pill.hidden = true;
        pill.innerHTML =
          '<span class="sp-dot"></span>' +
          '<span class="sp-name" data-session-name>Ivy</span>' +
          '<button type="button" class="sp-logout" data-session-logout aria-label="退出登录">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 17l-5-5 5-5"/><path d="M15 12H4"/></svg>' +
          '</button>';
        foot.insertBefore(pill, foot.firstChild);
      }
      var hasLogin = foot.querySelector("[data-login-cta]");
      if (!hasLogin) {
        var loginPath = loginPathFor();
        var cta = document.createElement("a");
        cta.className = "login-cta";
        cta.setAttribute("data-login-cta", "");
        cta.href = loginPath;
        cta.innerHTML =
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>' +
          '<span>登录</span>';
        foot.insertBefore(cta, foot.firstChild);
      }
    });
  }
  function renderSession() {
    var sess = readSession();
    document.querySelectorAll("[data-session-pill]").forEach(function (pill) {
      var nameEl = pill.querySelector("[data-session-name]");
      if (sess) {
        if (nameEl) nameEl.textContent = sess.username || "Ivy";
        pill.hidden = false;
      } else {
        pill.hidden = true;
      }
    });
    document.querySelectorAll("[data-login-cta]").forEach(function (cta) {
      cta.style.display = sess ? "none" : "";
    });
  }
  function bindLogout() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-session-logout]");
      if (!btn) return;
      clearSession();
      renderSession();
      // Soft redirect to login if we were on home
      if (/\/(index\.html)?$/.test(location.pathname)) {
        location.href = "login.html";
      }
    });
  }
  ensureSessionNodes();
  renderSession();
  bindLogout();

  /* ---------- Mobile sidebar ---------- */
  var body = document.body;
  function openNav() { body.classList.add("nav-open"); }
  function closeNav() { body.classList.remove("nav-open"); }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-menu-open]")) { openNav(); return; }
    if (e.target.closest("[data-menu-close]") || e.target.classList.contains("scrim")) {
      closeNav(); return;
    }
  });
  // Close drawer after picking a link (mobile)
  document.addEventListener("click", function (e) {
    if (e.target.closest(".nav-link")) closeNav();
  });

  /* ---------- Helpers ---------- */
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";
  }
  function cardHTML(p, i) {
    var cover = p.cover || "";
    var delay = (i || 0) % 6 * 80;
    var tagsHtml = (p.tags && p.tags.length)
      ? '<div class="card-tags">' +
          p.tags.map(function (t) { return '<span class="pill">' + t + "</span>"; }).join("") +
        "</div>"
      : "";
    var href = p.href || ("posts/" + p.slug + ".html");
    return (
      '<a class="card reveal" data-delay="' + delay + '" data-cat="' + p.cat + '" href="' + href + '">' +
        (cover ? '<div class="card-cover"></div>' : "") +
        '<div class="card-body">' +
          '<span class="card-cat">' + p.cat + "</span>" +
          tagsHtml +
          "<h3><span>" + p.title + "</span></h3>" +
          "<p>" + p.excerpt + "</p>" +
          '<div class="card-meta"><span>' + fmtDate(p.date) + '</span>' +
            '<span class="dot"></span><span>' + p.readTime + "</span></div>" +
        "</div>" +
      "</a>"
    );
  }
  function byDateDesc(a, b) { return a.date < b.date ? 1 : -1; }
  // Helper: render a list of posts with sequential reveal delays
  function renderCards(list) {
    return list.map(function (p, i) { return cardHTML(p, i); }).join("");
  }

  /* ---------- Sidebar archive search (delegated, because sidebar persists across PJAX) ---------- */
  document.addEventListener("keydown", function (e) {
    var navSearch = e.target.closest("#nav-search");
    if (!navSearch) return;
    if (e.key === "Enter" && navSearch.value.trim()) {
      location.href = siteUrl("posts.html?q=" + encodeURIComponent(navSearch.value.trim()));
    }
  });

  /* ---------- Entrance reveals (reusable, call after dynamic renders) ---------- */
  var revealIO = null;
  function initReveals() {
    var els = document.querySelectorAll(".reveal:not(.in)");
    if (!els.length) return;
    if ("IntersectionObserver" in window) {
      if (!revealIO) {
        revealIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              var el = en.target;
              setTimeout(function () { el.classList.add("in"); }, (el.dataset.delay || 0) * 1);
              revealIO.unobserve(el);
            }
          });
        }, { threshold: 0.08, rootMargin: "0px 0px 10% 0px" });
      }
      // Assign stagger delays to any elements that don't have one yet
      els.forEach(function (el, i) {
        if (!el.dataset.delay) el.dataset.delay = (i % 6) * 60;
        revealIO.observe(el);
      });
      // Safety net: some headless/automated environments never fire IO.
      setTimeout(function () {
        els.forEach(function (el) { if (!el.classList.contains("in")) el.classList.add("in"); });
      }, 1500);
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* ---------- Per-page init (called on first load and after PJAX swaps) ---------- */
  function initPage() {
    /* Right rail: re-inject on every page (re)entry — a PJAX-swapped
       <main> never carries one. Must run before anything binds to it. */
    if (shouldShowRail()) injectRightRail();
    pinRail();

    /* Active nav */
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.remove("active");
      var href = a.getAttribute("href").split("/").pop();
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });

    ensureSessionNodes();
    renderSession();

    /* Render recent on home */
    var recent = document.getElementById("recent-posts");
    if (recent && window.POSTS) {
      recent.innerHTML = renderCards(window.POSTS.slice().sort(byDateDesc).slice(0, 4));
    }

    /* Archive list + filter + search */
    var archive = document.getElementById("archive-list");
    var render, state; // hoisted; only defined if archive exists
    if (archive && window.POSTS) {
      var all = window.POSTS.slice().sort(byDateDesc);
      var cats = ["全部"].concat(Array.from(new Set(all.map(function (p) { return p.cat; }))));

      // Build filter pills
      var filterBar = document.getElementById("filter-bar");
      if (filterBar) {
        filterBar.innerHTML = cats.map(function (c, i) {
          return '<button class="pill' + (i === 0 ? " active" : "") +
            '" data-cat="' + c + '">' + c + "</button>";
        }).join("");
      }

      state = { cat: "全部", q: "" };
      render = function () {
        var list = all.filter(function (p) {
          var okCat = state.cat === "全部" || p.cat === state.cat;
          var q = state.q.trim().toLowerCase();
          var okQ = !q || (p.title + p.excerpt + p.cat).toLowerCase().indexOf(q) > -1;
          return okCat && okQ;
        });
        if (!list.length) {
          archive.innerHTML =
            '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
            "<div>没有找到匹配的内容</div></div>";
          return;
        }
        archive.innerHTML = renderCards(list);
        initReveals();
      };
      render();

      if (filterBar) {
        filterBar.addEventListener("click", function (e) {
          var b = e.target.closest(".pill"); if (!b) return;
          filterBar.querySelectorAll(".pill").forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
          state.cat = b.getAttribute("data-cat");
          render();
        });
      }
      var search = document.getElementById("archive-search");
      if (search) {
        search.addEventListener("input", function () {
          state.q = search.value; render();
        });
      }
    }

    /* Notes page (only 笔记 posts) */
    var notesList = document.getElementById("notes-list");
    if (notesList && window.POSTS) {
      var notesAll = window.POSTS.filter(function (p) { return p.cat === "笔记"; });
      var notesState = { q: "" };
      function renderNotes() {
        var q = notesState.q.trim().toLowerCase();
        var list = notesAll.filter(function (p) {
          return !q || (p.title + p.excerpt + (p.tags || []).join(" ")).toLowerCase().indexOf(q) > -1;
        });
        if (!list.length) {
          notesList.innerHTML =
            '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
            "<div>没有找到匹配的笔记</div></div>";
          return;
        }
        notesList.innerHTML = renderCards(list);
        initReveals();
      }
      renderNotes();
      var notesSearch = document.getElementById("notes-search");
      if (notesSearch) {
        notesSearch.addEventListener("input", function () {
          notesState.q = notesSearch.value; renderNotes();
        });
      }
    }

    // Pre-fill archive search from ?q=
    if (archive && typeof render === "function") {
      var params = new URLSearchParams(location.search);
      var q = params.get("q");
      if (q) {
        var as = document.getElementById("archive-search");
        if (as) { as.value = q; state.q = q; render(); }
      }
    }

    /* Home right-rail tags widget */
    var railTags = document.getElementById("rail-tags");
    if (railTags && window.POSTS) {
      var rtMap = {};
      window.POSTS.forEach(function (p) {
        (p.tags || []).forEach(function (t) {
          if (!rtMap[t]) rtMap[t] = 0;
          rtMap[t]++;
        });
      });
      var rtNames = Object.keys(rtMap).sort();
      railTags.innerHTML = rtNames.map(function (t) {
        return '<a class="rail-tag" href="' + siteUrl("tags.html?tag=" + encodeURIComponent(t)) + '" title="' + t + '">' + t +
          '<span class="rt-count">' + rtMap[t] + "</span></a>";
      }).join("");
    }

    /* In-article tag chips (posts/*.html, course/*.html) */
    var atContainer = document.getElementById("article-tags");
    if (atContainer && window.POSTS) {
      var atSlug = location.pathname.split("/").pop().replace(/\.html$/, "");
      var atPost = window.POSTS.filter(function (p) { return p.slug === atSlug; })[0];
      if (atPost && atPost.tags && atPost.tags.length) {
        atContainer.innerHTML = atPost.tags.map(function (t) {
          return '<a class="article-tag" href="' + siteUrl("tags.html?tag=" + encodeURIComponent(t)) +
            '" title="' + t + '">#' + t + "</a>";
        }).join("");
      }
    }

    initReveals();

    updateProgress();

    /* Count-up stats (about page) */
    var statNum = document.getElementById("stat-posts");
    if (statNum) {
      var target = parseInt(statNum.textContent, 10) || 0;
      if ("IntersectionObserver" in window) {
        var so = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (e.isIntersecting) {
              var start = 0, dur = 900, t0 = null;
              function step(ts) {
                if (!t0) t0 = ts;
                var k = Math.min((ts - t0) / dur, 1);
                statNum.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - k, 3)));
                if (k < 1) requestAnimationFrame(step);
              }
              requestAnimationFrame(step);
              so.unobserve(e.target);
            }
          });
        }, { threshold: 0.5 });
        so.observe(statNum);
      }
    }

    /* Subtle hero parallax */
    var heroEl = document.querySelector(".hero");
    if (heroEl && window.matchMedia("(pointer:fine)").matches) {
      heroEl.addEventListener("mousemove", function (e) {
        var r = heroEl.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        heroEl.querySelectorAll(".orb").forEach(function (o, i) {
          var d = (i + 1) * 10;
          o.style.transform = "translate(" + (dx * d) + "px," + (dy * d) + "px)";
        });
      });
      heroEl.addEventListener("mouseleave", function () {
        heroEl.querySelectorAll(".orb").forEach(function (o) { o.style.transform = ""; });
      });
    }

    /* Liquid-glass tilt on cards (fine pointers only) */
    if (window.matchMedia("(pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".card, .resource, .stat, .media-block").forEach(function (el) {
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = "perspective(900px) rotateY(" + (px * 5) + "deg) rotateX(" + (-py * 5) + "deg) translateY(-3px)";
        });
        el.addEventListener("mouseleave", function () {
          el.style.transform = "";
        });
      });
    }

    /* Tags page (tag cloud + filter) */
    var tagCloud = document.getElementById("tag-cloud");
    var tagList = document.getElementById("tag-list");
    if (tagCloud && tagList && window.POSTS) {
      // Build tag -> posts map
      var tagMap = {};
      window.POSTS.forEach(function (p) {
        (p.tags || []).forEach(function (t) {
          if (!tagMap[t]) tagMap[t] = [];
          tagMap[t].push(p);
        });
      });
      var tagNames = Object.keys(tagMap).sort();

      tagCloud.innerHTML = tagNames.map(function (t) {
        return '<button class="tag" data-tag="' + t + '">' + t +
          '<span class="tag-count">' + tagMap[t].length + "</span></button>";
      }).join("");

      var activeTag = null;
      function renderTagList() {
        if (!activeTag) {
          tagList.innerHTML = "";
          return;
        }
        var posts = tagMap[activeTag].slice().sort(byDateDesc);
        tagList.innerHTML = posts.map(function (p, i) {
          var href = p.href || ("posts/" + p.slug + ".html");
          return '<a class="tag-post reveal" data-delay="' + (i % 6) * 60 + '" href="' + href + '">' +
            '<span class="tp-cat">' + p.cat + "</span>" +
            '<span class="tp-title">' + p.title + "</span>" +
            '<span class="tp-date">' + p.date.replace(/-/g, "/") + "</span></a>";
        }).join("");
        initReveals();
      }
      function selectTag(name, scroll) {
        if (!tagMap[name]) return;
        tagCloud.querySelectorAll(".tag").forEach(function (x) {
          x.classList.toggle("active", x.getAttribute("data-tag") === name);
        });
        activeTag = name;
        renderTagList();
        if (scroll) {
          var el = tagList;
          setTimeout(function () {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 60);
        }
      }

      tagCloud.addEventListener("click", function (e) {
        var t = e.target.closest(".tag"); if (!t) return;
        var name = t.getAttribute("data-tag");
        if (activeTag === name) { activeTag = null; }
        selectTag(name);
      });

      // Support ?tag=xxx from the home right-rail tags
      var urlParams = new URLSearchParams(location.search);
      var urlTag = urlParams.get("tag");
      if (urlTag && tagMap[urlTag]) {
        selectTag(urlTag, true);
      }
    }

    /* Resource search filter (resources page) */
    var resourceSearch = document.getElementById("resource-search");
    if (resourceSearch) {
      var resources = Array.prototype.slice.call(document.querySelectorAll("#resource-list .resource"));
      resourceSearch.addEventListener("input", function () {
        var q = resourceSearch.value.trim().toLowerCase();
        resources.forEach(function (r) {
          var hit = !q || r.textContent.toLowerCase().indexOf(q) > -1;
          r.style.display = hit ? "" : "none";
        });
      });
    }

    /* NetEase-style mini player (right rail) */
    /* A thin view over the global controller — the audio element itself
       lives on <body>, so playback survives PJAX navigation and stays in
       sync with music.html's vinyl player. */
    var npRoot = document.getElementById("np-player");
    if (npRoot) mountRailPlayer(npRoot);

    /* Page-specific viewers (music vinyl / course file readers) live in
       scripts that load AFTER app.js (defer order) and, under PJAX, only
       execute before the DOM swap — so app.js owns the call timing and
       waits for DOMContentLoaded on cold loads (all defer scripts done),
       then mounts immediately after PJAX swaps (readyState "complete"). */
    function mountWhenReady(fnName) {
      var fired = false;
      var run = function () {
        if (fired) return;
        fired = true;
        if (typeof window[fnName] === "function") window[fnName]();
      };
      if (document.readyState === "complete") run();
      else {
        document.addEventListener("DOMContentLoaded", run);
        setTimeout(run, 1200);
      }
    }
    if (document.getElementById("musicPlayer")) mountWhenReady("mountMusicPlayer");
    /* Course file readers (fss-viewer.js: protected PDF / guide / QA) */
    if (document.body.hasAttribute("data-fss")) mountWhenReady("mountFssViewers");
  }

  /* ---------- PJAX in-site navigation (no blank-white flash) ---------- */
  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
  function ensureScript(absSrc) {
    return new Promise(function (resolve) {
      if (document.querySelector('script[src="' + absSrc + '"]')) { resolve(); return; }
      var s = document.createElement("script");
      s.src = absSrc;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  }
  function loadPage(url, push) {
    if (!readSession()) { location.href = url; return; }
    if (url.indexOf("login.html") !== -1) { location.href = url; return; }
    var main = document.querySelector(".main");
    if (!main) { location.href = url; return; }
    main.classList.add("pjax-out");

    var fetchedHtml = null;
    Promise.all([
      fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
        .then(function (r) { if (!r.ok) throw new Error("fetch failed"); return r.text(); })
        .then(function (html) { fetchedHtml = html; }),
      delay(220)
    ]).then(function () {
      var parser = new DOMParser();
      var doc = parser.parseFromString(fetchedHtml, "text/html");
      var newMain = doc.querySelector(".main");
      if (!newMain) { location.href = url; return; }

      var newTitle = doc.querySelector("title");
      if (newTitle) document.title = newTitle.textContent;

      if (doc.body) {
        document.body.className = doc.body.className;
        // Keep page-type attributes in sync too — body[data-fss] tells
        // initPage which course-file viewer to mount after the swap.
        var fssMode = doc.body.getAttribute("data-fss");
        if (fssMode) document.body.setAttribute("data-fss", fssMode);
        else document.body.removeAttribute("data-fss");
      }

      // Collect any scripts present in the new page that we haven't loaded yet (by absolute URL).
      var existingScripts = Array.prototype.map.call(document.querySelectorAll("script[src]"), function (s) {
        return new URL(s.getAttribute("src"), location.href).href;
      });
      var neededScripts = [];
      doc.querySelectorAll("script[src]").forEach(function (s) {
        var src = s.getAttribute("src");
        if (!src) return;
        var absSrc = new URL(src, url).href;
        if (existingScripts.indexOf(absSrc) === -1) neededScripts.push(absSrc);
      });

      return Promise.all(neededScripts.map(ensureScript)).then(function () { return doc; });
    }).then(function (doc) {
      if (!doc) return;
      var newMain = doc.querySelector(".main");
      if (!newMain) { location.href = url; return; }
      main.outerHTML = newMain.outerHTML;
      window.scrollTo(0, 0);

      var newMainEl = document.querySelector(".main");
      if (newMainEl) {
        newMainEl.classList.add("pjax-in");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            newMainEl.classList.add("pjax-in-active");
          });
        });
      }
      if (push) history.pushState({}, "", url);
      initPage();
    }).catch(function () {
      location.href = url;
    });
  }
  function bindPjax() {
    if (!history.pushState) return;
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest("a");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href) return;
      if (href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var dest;
      try { dest = new URL(href, location.href); } catch (err) { return; }
      if (dest.origin !== location.origin) return;
      if (dest.pathname === location.pathname && dest.search === location.search) return;
      e.preventDefault();
      loadPage(dest.href, true);
    });

    window.addEventListener("popstate", function () {
      loadPage(location.href, false);
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  var ticking = false;
  function updateProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    bar.style.width = pct + "%";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  updateProgress();

  /* ---------- Sidebar drag-to-resize (desktop only) ---------- */
  var sidebarEl = document.querySelector(".sidebar");
  var resizeHandle = document.querySelector("[data-sidebar-resize]");
  if (sidebarEl && resizeHandle && window.matchMedia("(min-width: 981px)").matches) {
    var MIN_W = 230, MAX_W = 260;
    function applySidebarWidth(w) {
      root.style.setProperty("--sidebar-w", w + "px");
      try { localStorage.setItem("Ivy-sidebar-w", w); } catch (e) {}
    }
    // Restore saved width
    var savedW = null;
    try { savedW = parseInt(localStorage.getItem("Ivy-sidebar-w"), 10); } catch (e) {}
    if (savedW && !isNaN(savedW)) applySidebarWidth(Math.max(MIN_W, Math.min(MAX_W, savedW)));

    resizeHandle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      body.classList.add("resizing");
      var startX = e.clientX;
      var startW = sidebarEl.getBoundingClientRect().width;
      function onMove(ev) {
        var w = startW + (ev.clientX - startX);
        w = Math.max(MIN_W, Math.min(MAX_W, w));
        applySidebarWidth(w);
      }
      function onUp() {
        body.classList.remove("resizing");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
    // Touch support for tablets
    resizeHandle.addEventListener("touchstart", function (e) {
      e.preventDefault();
      body.classList.add("resizing");
      var startX = e.touches[0].clientX;
      var startW = sidebarEl.getBoundingClientRect().width;
      function onMove(ev) {
        var w = startW + (ev.touches[0].clientX - startX);
        w = Math.max(MIN_W, Math.min(MAX_W, w));
        applySidebarWidth(w);
      }
      function onUp() {
        body.classList.remove("resizing");
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
      }
      window.addEventListener("touchmove", onMove);
      window.addEventListener("touchend", onUp);
    });
  }

  ensureTracks().then(function () {
    initPage();
    bindPjax();
  });
})();
