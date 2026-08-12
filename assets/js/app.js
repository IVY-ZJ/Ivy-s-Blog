/* Ivy's blog — interactivity (no dependencies)
   - System-following theme with manual override
   - Mobile sidebar drawer
   - Active nav highlighting
   - Client-side search & category filter
   - Dynamic recent / archive rendering
   - Staggered entrance reveals
   - PJAX in-site navigation
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

  /* ---------- Login guard ----------
     Any site page that loads app.js is gated. Without a valid session
     (missing or past the 30-day TTL), bounce to login.html — this stops
     visitors from deep-linking index.html / posts to skip the login.
     login.html itself loads login.js (not app.js), so no redirect loop. */
  function loginPathFor() {
    return (location.pathname.indexOf("/posts/") >= 0) ? "../login.html" : "login.html";
  }
  function guardSession() {
    var valid = false;
    try {
      var s = JSON.parse(localStorage.getItem("ivy-session") || "null");
      valid = !!(s && s.loggedAt && Date.now() - s.loggedAt < 30 * 24 * 3600 * 1000);
    } catch (e) { valid = false; }
    if (valid) return false;
    var pop = location.pathname.split("/").pop();
    var back = (location.pathname.indexOf("/posts/") >= 0 ? "posts/" : "") + pop + (location.search || "");
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
  }

  // Toggle cycles system -> light -> dark -> system
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
  });

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
    // On the home page (which is the only page with a right-rail), drop a small
    // single-line greeting above the tags card. The greeting is rendered as a
    // fixed element pinned to the right column so it never disturbs the sidebar
    // or the tags/music layout.
    var hasRail = !!document.querySelector(".right-rail");
    if (hasRail && !document.querySelector("[data-rail-greeting]")) {
      var g = document.createElement("div");
      g.className = "rail-greeting";
      g.setAttribute("data-rail-greeting", "");
      g.setAttribute("data-hello-line", "");
      g.hidden = true;
      g.innerHTML =
        'Hello, <b class="hello-name" data-hello-name>Ivy</b>' +
        '<span class="rg-wave" aria-hidden="true">👋</span>';
      document.body.appendChild(g);
    }

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
        var loginPath = (location.pathname.indexOf("/posts/") >= 0) ? "../login.html" : "login.html";
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
    document.querySelectorAll("[data-hello-line]").forEach(function (hello) {
      var nameEl = hello.querySelector("[data-hello-name]");
      if (sess) {
        if (nameEl) nameEl.textContent = sess.username || "Ivy";
        hello.hidden = false;
        hello.classList.add("is-shown");
      } else {
        hello.hidden = true;
        hello.classList.remove("is-shown");
      }
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
    return (
      '<a class="card reveal" data-delay="' + delay + '" data-cat="' + p.cat + '" href="posts/' + p.slug + '.html">' +
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
      var prefix = location.pathname.indexOf("/posts/") >= 0 ? "../" : "";
      location.href = prefix + "posts.html?q=" + encodeURIComponent(navSearch.value.trim());
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
        }, { threshold: 0.08 });
      }
      // Assign stagger delays to any elements that don't have one yet
      els.forEach(function (el, i) {
        if (!el.dataset.delay) el.dataset.delay = (i % 6) * 60;
        revealIO.observe(el);
      });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* ---------- Per-page init (called on first load and after PJAX swaps) ---------- */
  function initPage() {
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
      var rtNames = Object.keys(rtMap).sort().slice(0, 12);
      railTags.innerHTML = rtNames.map(function (t) {
        return '<a class="rail-tag" href="tags.html?tag=' + encodeURIComponent(t) + '" title="' + t + '">' + t +
          '<span class="rt-count">' + rtMap[t] + "</span></a>";
      }).join("");
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
          return '<a class="tag-post reveal" data-delay="' + (i % 6) * 60 + '" href="posts/' + p.slug + '.html">' +
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

    /* NetEase-style mini player (home right rail) */
    /* Uses the same SITE_TRACKS data as music.html, so the two stay in sync. */
    var npPlayer = document.getElementById("np-player");
    if (npPlayer) {
      var npAudio = document.getElementById("np-audio");
      var npPlayBtn = document.getElementById("np-play");
      var npPrevBtn = document.getElementById("np-prev");
      var npNextBtn = document.getElementById("np-next");
      var npBar = document.getElementById("np-bar");
      var npBarFill = document.getElementById("np-bar-fill");
      var npTimeCur = document.getElementById("np-time-cur");
      var npTimeTotal = document.getElementById("np-time-total");
      var npTrackEl = document.getElementById("np-track");
      var npArtistEl = document.getElementById("np-artist");
      var npListEl = document.getElementById("np-list");
      var TRACKS = window.SITE_TRACKS || [];
      var npIdx = -1;

      function npFmt(s) {
        s = Math.max(0, Math.floor(s || 0));
        var m = Math.floor(s / 60), r = s % 60;
        return m + ":" + (r < 10 ? "0" : "") + r;
      }

      // Build the synced playlist (identical to music.html)
      TRACKS.forEach(function (t, i) {
        var li = document.createElement("li");
        li.className = "np-item";
        li.setAttribute("role", "button");
        li.setAttribute("tabindex", "0");
        li.innerHTML = '<span class="np-item-idx">' + (i + 1) + '</span><span class="np-item-name"></span>';
        li.querySelector(".np-item-name").textContent = t.title;
        li.addEventListener("click", function () { npToggle(i); });
        li.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); npToggle(i); }
        });
        npListEl.appendChild(li);
      });

      function npSyncActive() {
        Array.prototype.forEach.call(npListEl.children, function (el, idx) {
          el.classList.toggle("is-active", idx === npIdx);
        });
      }

      function npLoad(i, autoplay) {
        if (!TRACKS.length) return;
        if (i < 0) i = TRACKS.length - 1;
        if (i >= TRACKS.length) i = 0;
        npIdx = i;
        var t = TRACKS[i];
        npAudio.src = t.src;
        npTrackEl.textContent = t.title;
        npArtistEl.textContent = "";
        npSyncActive();
        npTimeCur.textContent = "0:00";
        npBarFill.style.width = "0%";
        npTimeTotal.textContent = "0:00";
        if (autoplay) npAudio.play().catch(function () {});
      }

      function npPlay() {
        if (npIdx === -1) { npLoad(0, true); return; }
        npAudio.play().catch(function () {});
      }

      function npToggle(i) {
        if (i === npIdx) { if (npAudio.paused) npPlay(); else npAudio.pause(); }
        else npLoad(i, true);
      }

      npPlayBtn.addEventListener("click", function () {
        if (npIdx === -1) npPlay();
        else if (npAudio.paused) npPlay();
        else npAudio.pause();
      });
      npPrevBtn.addEventListener("click", function () { npLoad(npIdx - 1, true); });
      npNextBtn.addEventListener("click", function () { npLoad(npIdx + 1, true); });

      npAudio.addEventListener("play", function () {
        npPlayer.classList.add("playing");
        npPlayBtn.setAttribute("aria-label", "暂停");
      });
      npAudio.addEventListener("pause", function () {
        npPlayer.classList.remove("playing");
        npPlayBtn.setAttribute("aria-label", "播放");
      });
      npAudio.addEventListener("ended", function () { npLoad(npIdx + 1, true); });
      npAudio.addEventListener("timeupdate", function () {
        var d = npAudio.duration || 0;
        npTimeCur.textContent = npFmt(npAudio.currentTime);
        npTimeTotal.textContent = npFmt(d);
        npBarFill.style.width = (d ? (npAudio.currentTime / d * 100) : 0) + "%";
      });
      npAudio.addEventListener("loadedmetadata", function () {
        npTimeTotal.textContent = npFmt(npAudio.duration);
      });
      if (npBar) {
        npBar.addEventListener("click", function (e) {
          var d = npAudio.duration;
          if (!d) return;
          var r = npBar.getBoundingClientRect();
          var ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
          npAudio.currentTime = ratio * d;
        });
      }
    }
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

      if (doc.body) document.body.className = doc.body.className;

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

  initPage();
  bindPjax();
})();
