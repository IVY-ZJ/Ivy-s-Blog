/* Ivy's blog — course file viewers
   ------------------------------------------------
   Each document gets its OWN page (course/ dir), opened like a blog post:
     body[data-fss="pdf"]   -> course/fss-notes.html : protected PDF, decrypted
                               blob in a full-viewport iframe
     body[data-fss="guide"] -> course/fss-guide.html : review guide (HTML) in a
                               full-viewport iframe
     body[data-fss="qa"]    -> course/fss-qa.html    : Q&A markdown rendered as
                               a full-page article
   1) PDF viewing: fetches the obfuscated .dat, reverses the scramble
      (xorshift32 stream + 4096-byte chunk reversal) at runtime, and
      renders it in an <iframe> via a blob: URL. The raw PDF never
      exists as a public file, so naive scrapers can't download it.
      This is obfuscation, not real encryption — the key ships here.
   2) Markdown renderer: tiny, safe renderer (headings, lists, tables,
      code, bold, italic) used by the QA page.
   All content is additionally behind the site login guard (app.js). */
(function () {
  "use strict";

  /* ---- shared stream cipher (must match scripts/obfuscate_pdf.py) ---- */
  var KEY = "Ivy-FSS-2026-OpenFolio-ActionBlue";
  var CHUNK = 4096;

  function seedFromKey(key) {
    var s = 0;
    for (var i = 0; i < key.length; i++) {
      s = (s * 31 + key.charCodeAt(i)) >>> 0;
    }
    return s;
  }

  function xorshift32(x) {
    x = x >>> 0;
    x ^= (x << 13) >>> 0;
    x ^= x >>> 17;
    x ^= (x << 5) >>> 0;
    return x >>> 0;
  }

  /* Inverse of the obfuscation pass (which XORs the reversed chunk):
     first XOR the continuous keystream in place, then reverse every
     CHUNK bytes. Verified against scripts/obfuscate_pdf.py. */
  function deobfuscate(buf) {
    var u8 = new Uint8Array(buf);
    var total = u8.length;
    var state = seedFromKey(KEY);
    var start = 0;
    while (start < total) {
      var end = Math.min(start + CHUNK, total);
      // XOR stream (forward)
      for (var k = start; k < end; k++) {
        state = xorshift32(state);
        u8[k] = u8[k] ^ (state & 0xFF);
      }
      // reverse chunk
      for (var i = start, j = end - 1; i < j; i++, j--) {
        var t = u8[i]; u8[i] = u8[j]; u8[j] = t;
      }
      start = end;
    }
    return u8;
  }

  /* ---- friendly fetch failure hints ---- */
  function fetchHint() {
    if (location.protocol === "file:") {
      return (
        '<br><small style="opacity:.8;">检测到 <code>file://</code> 协议，浏览器禁止读取本地静态文件。' +
        '请改用本地服务器打开（在该目录下执行 ' +
        '<code>python -m http.server 8123</code>，然后访问 ' +
        "<code>http://localhost:8123/" + location.pathname.split("/").pop() + '</code>）。</small>'
      );
    }
    return '<br><small style="opacity:.8;">网络层失败：请确认服务器已启动且文件路径可访问。</small>';
  }

  /* ---- PDF page (course/fss-notes.html & friends) ----
     Per-file settings come from data-* attributes on the host:
       data-dat   = obfuscated source path
                    (default: <page-basename>.dat, e.g. engtrain-review.dat)
       data-title = document title for the embed (default 食品安全…)
       data-size  = human-readable size shown in the loading line
     A course page can omit all three and "just work" (fss-style). */
  function initPdfViewer() {
    var host = document.querySelector("[data-fss-pdf]");
    if (!host || host.dataset.fssBound) return;
    host.dataset.fssBound = "1";

    // Default source: <current-page-basename>.dat alongside fss-notes.dat.
    // e.g. course/engtrain-review.html -> ../assets/files/engtrain-review.dat
    // A course page can therefore omit data-dat and "just work" (fss-style).
    var base = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "");
    var defaultDat = "../assets/files/" + (base || "fss-notes") + ".dat";
    var datPath = host.dataset.dat || defaultDat;
    var docTitle = host.dataset.title || "食品安全科学笔记 PDF 预览";
    var docSize = host.dataset.size || "约 34 MB";

    var loading = document.createElement("div");
    loading.className = "fss-loading";
    loading.innerHTML =
      '<span class="fss-loading-spin"></span>' +
      '<span>正在解密并载入 PDF（' + docSize + '）…</span>';
    host.appendChild(loading);

    // Mount the decrypted blob into a viewer element. <object> is preferred
    // (Chromium disables the toolbar's download/print there); if it fails to
    // render we gracefully fall back to <iframe> so the PDF still shows.
    function mountPDF(url) {
      var obj = document.createElement("object");
      obj.className = "fss-pdf-frame";
      obj.setAttribute("type", "application/pdf");
      obj.setAttribute("title", docTitle);
      var fb = document.createElement("p");
      fb.className = "fss-pdf-fallback";
      fb.textContent =
        "当前设备无法内嵌预览 PDF（部分移动端浏览器只显示第一页）。请使用桌面浏览器打开本站阅读。";
      obj.appendChild(fb);
      obj.addEventListener("error", function () { mountIframe(url); });
      obj.addEventListener("load", function () { host.classList.add("is-ready"); });
      // #view=Fit scales a whole page to the viewport, no scrolling needed.
      obj.data = url + "#view=Fit&toolbar=1&navpanes=1";
      host.insertBefore(obj, loading);
      host.classList.add("is-loaded");
      loading.remove();
    }
    function mountIframe(url) {
      if (host.querySelector("iframe.fss-pdf-frame")) return;
      var old = host.querySelector("object.fss-pdf-frame");
      if (old) old.remove();
      var ifr = document.createElement("iframe");
      ifr.className = "fss-pdf-frame";
      ifr.setAttribute("title", docTitle);
      ifr.src = url + "#view=Fit&toolbar=1&navpanes=1";
      host.insertBefore(ifr, host.firstChild);
      host.classList.add("is-loaded");
    }

    fetch(datPath)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then(deobfuscate)
      .then(function (u8) {
        // sanity check: a decrypted PDF must start with "%PDF"
        if (u8[0] !== 0x25 || u8[1] !== 0x50 || u8[2] !== 0x44 || u8[3] !== 0x46) {
          throw new Error("解密校验失败");
        }
        var blob = new Blob([u8], { type: "application/pdf" });
        var url = URL.createObjectURL(blob);
        mountPDF(url);
      })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : "网络错误";
        var hint = /^(Failed to fetch|TypeError|NetworkError)/i.test(msg) ? fetchHint() : "";
        loading.innerHTML =
          '<span class="fss-loading-err">载入失败：' + msg +
          "。请刷新重试。</span>" + hint;
      });
  }

  /* ---- Guide page (course/fss-guide.html): embed the pre-built HTML ---- */
  function initGuideFrame() {
    var host = document.querySelector("[data-fss-guide-frame]");
    if (!host || host.dataset.fssBound) return;
    host.dataset.fssBound = "1";
    var frame = document.createElement("iframe");
    frame.className = "fss-guide-frame";
    frame.setAttribute("title", "现代食品安全科学复习纲要 · 在线阅读");
    host.appendChild(frame);
    frame.addEventListener("load", function () {
      host.classList.add("is-ready");
    });
    frame.src = "../assets/files/fss-review-guide.html";
  }

  /* ---- QA page (course/fss-qa.html & friends): fetch + render markdown ----
     data-md on the article overrides the default fss-qa.md source.
     After HTML is set, KaTeX auto-render (loaded as a separate script) is
     called to render LaTeX expressions ($...$ and $$...$$). Multi-line
     $$...$$ blocks are collapsed to single lines first so the standard
     auto-render scanner can find them across paragraph boundaries. */
  function initQaPage() {
    var article = document.querySelector("[data-fss-qa]");
    if (!article || article.dataset.fssBound) return;
    article.dataset.fssBound = "1";
    var mdPath = article.dataset.md || "../assets/files/fss-qa.md";
    var loading = document.createElement("div");
    loading.className = "fss-loading";
    loading.innerHTML =
      '<span class="fss-loading-spin"></span>' +
      "<span>正在载入文章…</span>";
    article.appendChild(loading);

    fetch(mdPath)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (txt) {
        loading.remove();
        article.innerHTML = renderMd(txt);
        // KaTeX is optional — the page only ships it when course content
        // uses LaTeX. Without it, $...$ stays as raw text and degrades
        // gracefully. Two passes:
        //   1) Render the $$...$$ placeholder divs as display math.
        //   2) Auto-render any remaining $...$ inline math.
        if (typeof window.katex === "undefined") return;
        try {
          article.querySelectorAll(".math-display[data-tex]").forEach(function (div) {
            var tex = "";
            try { tex = decodeURIComponent(div.getAttribute("data-tex") || ""); } catch (e) { tex = ""; }
            window.katex.render(tex, div, { displayMode: true, throwOnError: false });
          });
        } catch (e) { /* display math failed — leave raw text */ }
        // Inline math is converted to .math-inline placeholders by renderMd,
        // so we render them directly with katex instead of relying on
        // auto-render's delimiter scanner (which can miss formulas in some
        // DOM structures or when throwOnError:false leaves raw text).
        try {
          article.querySelectorAll(".math-inline[data-tex]").forEach(function (span) {
            var tex = "";
            try { tex = decodeURIComponent(span.getAttribute("data-tex") || ""); } catch (e) { tex = ""; }
            window.katex.render(tex, span, { displayMode: false, throwOnError: false });
          });
        } catch (e) { /* inline math failed — leave raw text */ }
        // Fallback: if any raw $...$ slipped through, ask auto-render to catch it.
        if (typeof window.renderMathInElement === "function") {
          try {
            window.renderMathInElement(article, {
              delimiters: [{ left: "$", right: "$", display: false }],
              throwOnError: false
            });
          } catch (e) { /* inline math failed — leave raw text */ }
        }
      })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : "网络错误";
        var hint = /^(Failed to fetch|TypeError|NetworkError)/i.test(msg) ? fetchHint() : "";
        loading.innerHTML = '<div class="fss-loading-err">载入失败：' + msg + '。请刷新重试。' + hint + '</div>';
      });
  }

  /* ---- Minimal Markdown renderer (safe: escape first, then markup) ---- */
  /* YAML 风格 front matter（如 AIGC 隐式标识元数据块）不渲染：
     仅当文件以 --- 包裹、且块内含 key: 行时才剥离，避免误伤正文分隔线。 */
  function stripFrontMatter(src) {
    src = src.replace(/^/, "");
    var m = src.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (m && /^[A-Za-z][A-Za-z0-9_-]*\s*:/m.test(m[1])) return src.slice(m[0].length);
    return src;
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inlineMd(s) {
    // 1) Protect inline code `...` so $ / * / _ inside backticks are never
    // touched by math or emphasis regexes.
    var codeTokens = [];
    s = s.replace(/`([^`]+)`/g, function (_, code) {
      codeTokens.push(code);
      return "\u0000CODE" + (codeTokens.length - 1) + "\u0000";
    });

    // 2) Split out $...$ math and format the non-math segments separately.
    // Math becomes placeholder spans; they must NOT be escaped by esc().
    var parts = s.split(/(\$[^$\n]+?\$)/g);
    var out = parts.map(function (seg) {
      if (/^\$[^$\n]+?\$/.test(seg)) {
        var tex = seg.slice(1, -1).replace(/\s+/g, " ").trim();
        return '<span class="math-inline" data-tex="' +
          encodeURIComponent(tex) +
          '"></span>';
      }
      // --- plain text segment ---
      seg = esc(seg);
      // markdown links [text](url) — before other inline formatting
      seg = seg.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
        function (_, text, url, title) {
          var ext = /^(?:https?:|mailto:)/i.test(url);
          var attrs = ' href="' + url.replace(/"/g, "&quot;") + '"';
          if (ext) attrs += ' target="_blank" rel="noopener"';
          if (title) attrs += ' title="' + title + '"';
          return "<a" + attrs + ">" + text + "</a>";
        });
      // bold MUST come before italic so **X** isn't misread as two *s
      seg = seg.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      seg = seg.replace(/__([^_]+)__/g, "<strong>$1</strong>");
      seg = seg.replace(/~~([^~]+)~~/g, "<del>$1</del>");
      seg = seg.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return seg;
    }).join("");

    // 3) Restore inline code.
    out = out.replace(/\u0000CODE(\d+)\u0000/g, function (_, i) {
      return "<code>" + esc(codeTokens[i]) + "</code>";
    });
    return out;
  }
  function renderMd(src) {
    src = stripFrontMatter(src);
    // Replace display math $$...$$ (single or multi-line) with placeholder
    // <div>s so the main line loop emits them as block elements rather
    // than wrapping in <p>. The placeholders carry the raw TeX in a
    // data attribute and are rendered by KaTeX after innerHTML is set.
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, function (_, tex) {
      return '\n\n<div class="math-display" data-tex="' +
        encodeURIComponent(tex.replace(/\s+/g, " ").trim()) +
        '"></div>\n\n';
    });
    var lines = src.split(/\r?\n/);
    var html = [];
    var i = 0;
    var inCode = false;
    var codeBuf = [];
    var tableBuf = [];
    var listType = null;

    function flushTable() {
      if (!tableBuf.length) return;
      // First non-separator row becomes the <thead>; the rest are <tbody>.
      var header = tableBuf[0].split("|").slice(1, -1).map(function (c) { return c.trim(); });
      var bodyRows = tableBuf.slice(1).map(function (row) {
        var cells = row.split("|").slice(1, -1).map(function (c) { return c.trim(); });
        return "<tr>" + cells.map(function (c) {
          return "<td>" + inlineMd(c) + "</td>";
        }).join("") + "</tr>";
      });
      var thead = "<thead><tr>" + header.map(function (c) {
        return "<th>" + inlineMd(c) + "</th>";
      }).join("") + "</tr></thead>";
      html.push("<div class='fss-md-table'><table>" + thead + "<tbody>" + bodyRows.join("") + "</tbody></table></div>");
      tableBuf = [];
    }
    function flushList() {
      if (!listType) return;
      html.push("</" + listType + ">");
      listType = null;
    }

    for (; i < lines.length; i++) {
      var line = lines[i];

      if (inCode) {
        if (/^```/.test(line.trim())) {
          inCode = false;
          html.push("<pre><code>" + codeBuf.join("\n") + "</code></pre>");
          codeBuf = [];
        } else {
          codeBuf.push(esc(line));
        }
        continue;
      }
      if (/^```/.test(line.trim())) { inCode = true; continue; }

      var t = line.trim();
      if (!t) { flushTable(); flushList(); continue; }

      // Pre-processed display-math placeholder: emit as raw HTML (bypass
      // esc/inlineMd so KaTeX can fill it in later).
      if (/^<div class="math-display" data-tex="[^"]*"><\/div>$/.test(t)) {
        flushList();
        flushTable();
        html.push(t);
        continue;
      }

      // table row
      if (/^\|/.test(t)) {
        flushList();
        if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
        tableBuf.push(t);
        continue;
      }
      flushTable();

      // headings (h1–h6)
      var h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushList();
        var lvl = h[1].length;
        var slug = t.replace(/^#{1,6}\s+/, "").trim().replace(/\s+/g, "-");
        html.push("<h" + lvl + ' id="' + slug + '">' + inlineMd(h[2]) + "</h" + lvl + ">");
        continue;
      }
      // blockquote
      if (/^>\s?/.test(t)) {
        flushList();
        html.push("<blockquote>" + inlineMd(t.replace(/^>\s?/, "")) + "</blockquote>");
        continue;
      }
      // hr
      if (/^(-{3,}|\*{3,})$/.test(t)) {
        flushList();
        html.push("<hr />");
        continue;
      }
      // admonition: !!! type "title"  (MyST-style), body = indented block
      //   !!! note "注意"
      //       正文 ……（可含 $…$ 与 $$…$$，逐行缩进）
      var adm = t.match(/^!!!\s+(\w+)(?:\s+"([^"]*)")?\s*$/);
      if (adm) {
        flushList();
        flushTable();
        var aType = adm[1];
        var aTitle = adm[2] || aType;
        var bodyLines = [];
        var k = i + 1;
        while (k < lines.length) {
          var lk = lines[k];
          if (lk.trim() === "" || /^\s/.test(lk)) { bodyLines.push(lk); k++; }
          else break;
        }
        i = k - 1;
        var nonEmpty = bodyLines.filter(function (l) { return l.trim() !== ""; });
        var minInd = nonEmpty.length ? Math.min.apply(null, nonEmpty.map(function (l) {
          return l.length - l.replace(/^\s+/, "").length;
        })) : 0;
        var bodyText = bodyLines.map(function (l) {
          return minInd ? l.slice(minInd) : l;
        }).join("\n");
        // display-math $$…$$ in the body was already turned into placeholder
        // divs by the pre-pass above, so a recursive renderMd keeps them.
        var inner = bodyText.trim() ? renderMd(bodyText) : "";
        html.push(
          '<div class="fss-admon" data-admon="' + esc(aType) + '">' +
          '<div class="fss-admon-title">' + esc(aTitle) + "</div>" +
          '<div class="fss-admon-body">' + inner + "</div>" +
          "</div>"
        );
        continue;
      }

      // unordered list
      var ul = t.match(/^[-*+]\s+(.*)$/);
      if (ul) {
        if (listType !== "ul") { flushList(); html.push("<ul>"); listType = "ul"; }
        html.push("<li>" + inlineMd(ul[1]) + "</li>");
        continue;
      }
      // ordered list
      var ol = t.match(/^\d+[.、]\s*(.*)$/);
      if (ol) {
        if (listType !== "ol") { flushList(); html.push("<ol>"); listType = "ol"; }
        html.push("<li>" + inlineMd(ol[1]) + "</li>");
        continue;
      }
      flushList();
      html.push("<p>" + inlineMd(t) + "</p>");
    }
    if (inCode) html.push("<pre><code>" + codeBuf.join("\n") + "</code></pre>");
    flushTable();
    flushList();
    return html.join("");
  }

  /* ---- dispatch by page type ----
     不再在脚本执行时自动运行：本脚本由 app.js（更早的 defer）之后加载，
     而 PJAX 换页时脚本又会先于 DOM 换入执行——两种时序下这里都找不到
     目标元素。改为暴露挂载函数，由 app.js 的 initPage() 在 DOM 就绪后
     统一调用（与音乐页黑胶播放器同一套机制）。 */
  window.mountFssViewers = function () {
    var mode = document.body.getAttribute("data-fss");
    if (mode === "pdf") initPdfViewer();
    else if (mode === "guide") initGuideFrame();
    else if (mode === "qa") initQaPage();
  };
})();
