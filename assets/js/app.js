/* Ivy's blog — interactivity (no dependencies)
   - System-following theme with manual override
   - Mobile sidebar drawer
   - Active nav highlighting
   - Client-side search & category filter
   - Dynamic recent / archive rendering
   - Staggered entrance reveals
*/
(function () {
  "use strict";

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

  /* ---------- Active nav ---------- */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(function (a) {
    var href = a.getAttribute("href").split("/").pop();
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- Helpers ---------- */
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.getFullYear() + " 年 " + (d.getMonth() + 1) + " 月 " + d.getDate() + " 日";
  }
  function cardHTML(p, i) {
    var cover = p.cover || "";
    var delay = (i || 0) % 6 * 80;
    return (
      '<a class="card reveal" data-delay="' + delay + '" data-cat="' + p.cat + '" href="posts/' + p.slug + '.html">' +
        '<span class="accent-bar"></span>' +
        (cover ? '<div class="card-cover"><div class="cover-art" style="background-image:url(' + cover + ')"></div></div>' : "") +
        '<span class="card-cat">' + p.cat + "</span>" +
        "<h3><span>" + p.title + "</span></h3>" +
        "<p>" + p.excerpt + "</p>" +
        '<div class="card-meta"><span>' + fmtDate(p.date) + '</span>' +
          '<span class="dot"></span><span>' + p.readTime + "</span></div>" +
      "</a>"
    );
  }
  function byDateDesc(a, b) { return a.date < b.date ? 1 : -1; }
  // Helper: render a list of posts with sequential reveal delays
  function renderCards(list) {
    return list.map(function (p, i) { return cardHTML(p, i); }).join("");
  }

  /* ---------- Render recent on home ---------- */
  var recent = document.getElementById("recent-posts");
  if (recent && window.POSTS) {
    recent.innerHTML = renderCards(window.POSTS.slice().sort(byDateDesc).slice(0, 4));
    initReveals();
  }

  /* ---------- Archive list + filter + search ---------- */
  var archive = document.getElementById("archive-list");
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

    var state = { cat: "全部", q: "" };
    function render() {
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
    }
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

  /* ---------- Notes page (only 笔记 posts) ---------- */
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

  /* ---------- Search box in sidebar (home archive jump) ---------- */
  var navSearch = document.getElementById("nav-search");
  if (navSearch) {
    navSearch.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && navSearch.value.trim()) {
        location.href = "posts.html?q=" + encodeURIComponent(navSearch.value.trim());
      }
    });
  }
  // Pre-fill archive search from ?q=
  if (archive) {
    var params = new URLSearchParams(location.search);
    var q = params.get("q");
    if (q) {
      var as = document.getElementById("archive-search");
      if (as) { as.value = q; state.q = q; render(); }
    }
  }

  /* ---------- Home right-rail tags widget ---------- */
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
  initReveals();

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

  /* ---------- Count-up stats (about page) ---------- */
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

  /* ---------- Subtle hero parallax ---------- */
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

  /* ---------- Liquid-glass tilt on cards (fine pointers only) ---------- */
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

  /* ---------- Tags page (tag cloud + filter) ---------- */
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

  /* ---------- Resource search filter (resources page) ---------- */
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

  /* ---------- NetEase-style mini player (home right rail) ---------- */
  var npPlayer = document.getElementById("np-player");
  if (npPlayer) {
    var npPlayBtn = document.getElementById("np-play");
    var npBarFill = document.getElementById("np-bar-fill");
    var npTimeCur = document.getElementById("np-time-cur");
    var npTimeTotal = document.getElementById("np-time-total");
    var npPlaying = false;
    var npDur = 210; // seconds (3:30 demo)
    var npCur = 0;
    var npTick = null;

    function npFmt(s) {
      s = Math.max(0, Math.floor(s));
      var m = Math.floor(s / 60), r = s % 60;
      return m + ":" + (r < 10 ? "0" : "") + r;
    }
    npTimeTotal.textContent = npFmt(npDur);

    function npStart() {
      npPlaying = true;
      npPlayer.classList.add("playing");
      npPlayBtn.setAttribute("aria-label", "暂停");
      npTick = setInterval(function () {
        npCur += 0.5;
        if (npCur >= npDur) { npCur = 0; }
        npBarFill.style.width = (npCur / npDur * 100) + "%";
        npTimeCur.textContent = npFmt(npCur);
      }, 500);
    }
    function npStop() {
      npPlaying = false;
      npPlayer.classList.remove("playing");
      npPlayBtn.setAttribute("aria-label", "播放");
      clearInterval(npTick);
    }
    npPlayBtn.addEventListener("click", function () {
      if (npPlaying) npStop(); else npStart();
    });
    // Click on progress bar to seek
    var npBar = document.querySelector(".np-bar");
    if (npBar) {
      npBar.addEventListener("click", function (e) {
        var r = npBar.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        npCur = ratio * npDur;
        npBarFill.style.width = (ratio * 100) + "%";
        npTimeCur.textContent = npFmt(npCur);
      });
    }
  }

  /* ---------- Sidebar drag-to-resize (desktop only) ---------- */
  var sidebarEl = document.querySelector(".sidebar");
  var resizeHandle = document.querySelector("[data-sidebar-resize]");
  if (sidebarEl && resizeHandle && window.matchMedia("(min-width: 981px)").matches) {
    var MIN_W = 235, MAX_W = 290;
    function applySidebarWidth(w) {
      root.style.setProperty("--sidebar-w", w + "px");
      try { localStorage.setItem("Ivy-sidebar-w", w); } catch (e) {}
    }
    // Restore saved width
    var savedW = null;
    try { savedW = parseInt(localStorage.getItem("Ivy-sidebar-w"), 10); } catch (e) {}
    if (savedW && savedW >= MIN_W && savedW <= MAX_W) applySidebarWidth(savedW);

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
})();
