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

  /* ---- PDF page (course/fss-notes.html) ---- */
  function initPdfViewer() {
    var host = document.querySelector("[data-fss-pdf]");
    if (!host) return;
    var iframe = document.createElement("iframe");
    iframe.className = "fss-pdf-frame";
    iframe.setAttribute("title", "食品安全科学笔记 PDF 预览");
    host.appendChild(iframe);

    var loading = document.createElement("div");
    loading.className = "fss-loading";
    loading.innerHTML =
      '<span class="fss-loading-spin"></span>' +
      '<span>正在解密并载入笔记 PDF（约 34 MB）…</span>';
    host.appendChild(loading);

    fetch("../assets/files/fss-notes.dat")
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
        // #view=Fit makes Chromium's PDF viewer scale a whole page to the
        // viewport, so one page is fully visible without scrolling.
        iframe.src = url + "#view=Fit&toolbar=1&navpanes=1";
        host.classList.add("is-loaded");
        loading.remove();
        iframe.addEventListener("load", function () {
          host.classList.add("is-ready");
        });
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
    if (!host) return;
    var frame = document.createElement("iframe");
    frame.className = "fss-guide-frame";
    frame.setAttribute("title", "现代食品安全科学复习纲要 · 在线阅读");
    host.appendChild(frame);
    frame.addEventListener("load", function () {
      host.classList.add("is-ready");
    });
    frame.src = "../assets/files/fss-review-guide.html";
  }

  /* ---- QA page (course/fss-qa.html): fetch + render markdown ---- */
  function initQaPage() {
    var article = document.querySelector("[data-fss-qa]");
    if (!article) return;
    var loading = document.createElement("div");
    loading.className = "fss-loading";
    loading.innerHTML =
      '<span class="fss-loading-spin"></span>' +
      "<span>正在载入文章…</span>";
    article.appendChild(loading);

    fetch("../assets/files/fss-qa.md")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (txt) {
        loading.remove();
        article.innerHTML = renderMd(txt);
      })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : "网络错误";
        var hint = /^(Failed to fetch|TypeError|NetworkError)/i.test(msg) ? fetchHint() : "";
        loading.innerHTML = '<div class="fss-loading-err">载入失败：' + msg + '。请刷新重试。' + hint + '</div>';
      });
  }

  /* ---- Minimal Markdown renderer (safe: escape first, then markup) ---- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inlineMd(s) {
    s = esc(s);
    // inline code first (so * and _ inside don't get touched)
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    // bold MUST come before italic so **X** isn't misread as two *s
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return s;
  }
  function renderMd(src) {
    var lines = src.split(/\r?\n/);
    var html = [];
    var i = 0;
    var inCode = false;
    var codeBuf = [];
    var tableBuf = [];
    var listType = null;

    function flushTable() {
      if (!tableBuf.length) return;
      var rows = tableBuf.map(function (row) {
        var cells = row.split("|").slice(1, -1).map(function (c) { return c.trim(); });
        return "<tr>" + cells.map(function (c) {
          return "<td>" + inlineMd(c) + "</td>";
        }).join("") + "</tr>";
      });
      html.push("<div class='fss-md-table'><table><tbody>" + rows.join("") + "</tbody></table></div>");
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

      // table row
      if (/^\|/.test(t)) {
        flushList();
        if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
        tableBuf.push(t);
        continue;
      }
      flushTable();

      // headings
      var h = t.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        flushList();
        var lvl = h[1].length;
        html.push("<h" + lvl + ">" + inlineMd(h[2]) + "</h" + lvl + ">");
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

  /* ---- dispatch by page type ---- */
  var mode = document.body.getAttribute("data-fss");
  if (mode === "pdf") initPdfViewer();
  else if (mode === "guide") initGuideFrame();
  else if (mode === "qa") initQaPage();
})();
