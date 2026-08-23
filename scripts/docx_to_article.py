#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convert the food-safety review DOCX into a self-contained article HTML
that the course page can load in an <iframe> for online reading (mirroring
the protected-PDF viewing pattern). Output: assets/files/fss-review-guide.html

Usage:
    python scripts/docx_to_article.py <input.docx> <output.html>
"""
import sys
import html

try:
    from docx import Document
except ImportError:
    sys.exit("python-docx not installed: pip install python-docx")


def esc(s: str) -> str:
    return html.escape(s or "", quote=False)


def classify(style_name: str, text: str):
    """Map a Word style to an HTML block tag + content."""
    s = (style_name or "").strip().lower()
    t = (text or "").strip()
    if not t:
        return None
    # headings
    if s.startswith("heading 1") or s == "标题 1":
        return ("h1", t)
    if s.startswith("heading 2") or s == "标题 2":
        return ("h2", t)
    if s.startswith("heading 3") or s == "标题 3":
        return ("h3", t)
    if s.startswith("heading 4") or s == "标题 4":
        return ("h4", t)
    # lists
    if "list bullet" in s or "列表段落" in s or s.startswith("列表"):
        return ("li-bullet", t)
    if "list number" in s or s.startswith("编号"):
        return ("li-number", t)
    # default paragraph
    return ("p", t)


def convert(path: str) -> str:
    doc = Document(path)
    blocks = []
    list_open = None  # "ul" | "ol" | None

    def close_list():
        nonlocal list_open
        if list_open:
            blocks.append(f"</{list_open}>")
            list_open = None

    for para in doc.paragraphs:
        res = classify(para.style.name, para.text)
        if res is None:
            close_list()
            continue
        kind, text = res
        if kind in ("li-bullet", "li-number"):
            tag = "ul" if kind == "li-bullet" else "ol"
            if list_open != tag:
                close_list()
                blocks.append(f"<{tag}>")
                list_open = tag
            blocks.append(f"<li>{esc(text)}</li>")
        else:
            close_list()
            blocks.append(f"<{kind}>{esc(text)}</{kind}>")
    close_list()
    body = "\n".join(blocks)
    return body


def wrap(body: str, title: str, eyebrow: str, meta: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>{esc(title)} · Ivy</title>
<link rel="stylesheet" href="../css/style.css" />
<style>
  body {{ background: var(--canvas, #f5f5f7); }}
  .fss-article {{ max-width: 760px; margin: 0 auto; padding: 56px 32px 120px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
      "PingFang SC", "HarmonyOS Sans SC", system-ui, sans-serif;
    color: var(--ink, #1d1d1f); line-height: 1.65; }}
  .fss-article-head {{ margin-bottom: 32px; }}
  .fss-article .eyebrow {{ font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--accent, #0066cc); }}
  .fss-article h1 {{ font-size: 32px; font-weight: 700; letter-spacing: -0.02em;
    margin: 8px 0 4px; }}
  .fss-article-meta {{ font-size: 14px; color: var(--ink-tertiary, #86868b); margin: 0; }}
  .fss-article h2 {{ font-size: 23px; font-weight: 600; letter-spacing: -0.01em;
    margin: 40px 0 12px; padding-top: 16px; border-top: 1px solid var(--hairline, rgba(0,0,0,0.09)); }}
  .fss-article h3 {{ font-size: 19px; font-weight: 600; margin: 28px 0 10px; }}
  .fss-article h4 {{ font-size: 17px; font-weight: 600; margin: 22px 0 8px; }}
  .fss-article p {{ font-size: 17px; margin: 0 0 14px; }}
  .fss-article ul, .fss-article ol {{ margin: 0 0 16px; padding-left: 24px; }}
  .fss-article li {{ font-size: 17px; margin: 4px 0; }}
  @media (prefers-color-scheme: dark) {{
    body {{ background: #131316; color: #f5f5f7; }}
  }}
  :root[data-theme="dark"] body {{ background: #131316; color: #f5f5f7; }}
</style>
</head>
<body>
<article class="fss-article">
  <header class="fss-article-head">
    <div class="eyebrow">{esc(eyebrow)}</div>
    <h1>{esc(title)}</h1>
    <p class="fss-article-meta">{esc(meta)}</p>
  </header>
{body}
</article>
</body>
</html>
"""


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: docx_to_article.py <input.docx> <output.html>")
    src, dst = sys.argv[1], sys.argv[2]
    body = convert(src)
    html_doc = wrap(body,
                    title="现代食品安全科学复习纲要",
                    eyebrow="Course · 复习纲要",
                    meta="按章节整理 · 适合在线阅读或打印")
    with open(dst, "w", encoding="utf-8") as f:
        f.write(html_doc)
    print(f"wrote {dst} ({len(body)} chars body)")


if __name__ == "__main__":
    main()
