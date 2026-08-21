/* Ivy's blog — course file viewer (food-safety course)
   ------------------------------------------------
   1) PDF viewing: fetches the obfuscated .dat, reverses the scramble
      (xorshift32 stream + 4096-byte chunk reversal) at runtime, and
      renders it in an <iframe> via a blob: URL. The raw PDF never
      exists as a public file, so naive scrapers can't download it.
      This is obfuscation, not real encryption — the key ships here.
   2) Markdown preview: tiny renderer for the review .md (headings,
      lists, tables, code, bold) shown on demand.
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

  /* ---- PDF viewer ---- */
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

    fetch("assets/files/fss-notes.dat")
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
        iframe.src = url;
        host.classList.add("is-loaded");
        loading.remove();
        iframe.addEventListener("load", function () {
          host.classList.add("is-ready");
        });
      })
      .catch(function (err) {
        loading.innerHTML =
          '<span class="fss-loading-err">载入失败：' +
          (err && err.message ? err.message : "网络错误") +
          "。请刷新重试。</span>";
      });
  }

  /* ---- Minimal Markdown renderer (safe: escape first, then markup) ---- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inlineMd(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
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

  /* ---- Markdown preview toggle ---- */
  function initMdPreview() {
    var btn = document.querySelector("[data-fss-md-toggle]");
    if (!btn) return;
    var box = document.querySelector("[data-fss-md-body]");
    if (!box) return;
    var loaded = false;
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-loading")) return;
      if (box.classList.contains("is-open")) {
        box.classList.remove("is-open");
        btn.classList.remove("is-open");
        btn.querySelector("[data-fss-md-label]").textContent = "在线预览";
        return;
      }
      btn.classList.add("is-loading");
      btn.querySelector("[data-fss-md-label]").textContent = "载入中…";
      if (loaded) {
        box.classList.add("is-open");
        btn.classList.remove("is-loading");
        btn.classList.add("is-open");
        btn.querySelector("[data-fss-md-label]").textContent = "收起预览";
        return;
      }
      fetch("assets/files/fss-qa.md")
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(function (txt) {
          box.innerHTML = renderMd(txt);
          loaded = true;
          box.classList.add("is-open");
          btn.classList.remove("is-loading");
          btn.classList.add("is-open");
          btn.querySelector("[data-fss-md-label]").textContent = "收起预览";
        })
        .catch(function () {
          btn.classList.remove("is-loading");
          btn.querySelector("[data-fss-md-label]").textContent = "载入失败，重试";
        });
    });
  }

  /* ---- light friction against saving the protected PDF ---- */
  function initDragGuard() {
    var host = document.querySelector("[data-fss-pdf]");
    if (!host) return;
    host.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    host.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  initPdfViewer();
  initMdPreview();
  initDragGuard();
})();
