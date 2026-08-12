#!/usr/bin/env python3
"""Add wallpaper preload + defer scripts to all HTML files."""
import os, re

ROOT = r"C:\Users\Li Xiang\Desktop\my blog"

# Preload tag — uses ../../assets/img/ for posts/, assets/img/ for top-level
PRELOAD_LIGHT = '<link rel="preload" as="image" href="{prefix}assets/img/wallpaper-light.webp" fetchpriority="high" />'
PRELOAD_DARK  = '<link rel="preload" as="image" href="{prefix}assets/img/wallpaper-dark.webp" fetchpriority="high" />'

files = [
    "index.html", "posts.html", "notes.html", "resources.html",
    "about.html", "login.html", "music.html",
    "posts/circuit-analysis-notes.html",
    "posts/effective-note-taking.html",
    "posts/study-resources-pack.html",
    "posts/why-i-write.html",
    "posts/writing-guide.html",
]

# Per-file image prefix (posts/ uses ../)
PREFIX = {fn: ("../" if fn.startswith("posts/") else "") for fn in files}

# Per-file script types: which scripts each page loads
# Use the actual files we found in the previous grep
PAGE_SCRIPTS = {
    "index.html": ["posts-data.js", "tracks.js", "app.js"],
    "posts.html": ["posts-data.js", "app.js"],
    "notes.html": ["posts-data.js", "app.js"],
    "resources.html": ["posts-data.js", "app.js"],
    "about.html": ["posts-data.js", "app.js"],
    "login.html": ["login.js"],
    "music.html": ["posts-data.js", "tracks.js", "app.js", "music-player.js"],
    "posts/circuit-analysis-notes.html": ["posts-data.js", "app.js"],
    "posts/effective-note-taking.html": ["posts-data.js", "app.js"],
    "posts/study-resources-pack.html": ["posts-data.js", "app.js"],
    "posts/why-i-write.html": ["posts-data.js", "app.js"],
    "posts/writing-guide.html": ["posts-data.js", "app.js"],
}

for fn in files:
    path = os.path.join(ROOT, fn)
    with open(path, encoding="utf-8") as f:
        html = f.read()

    prefix = PREFIX[fn]
    preload_block = (
        f'  {PRELOAD_LIGHT.format(prefix=prefix)}\n'
        f'  {PRELOAD_DARK.format(prefix=prefix)}\n'
    )

    # 1) Insert preload right before the first <link rel="stylesheet">
    #    (skip if already inserted by an earlier run)
    if 'rel="preload" as="image" href' in html:
        pass  # already done
    else:
        # match the first stylesheet line
        m = re.search(r'(\s*)<link rel="stylesheet"', html)
        if not m:
            print(f"[skip] no stylesheet in {fn}")
            continue
        # Replace that one occurrence with preload + original
        lead = m.group(1)
        repl = f'\n{preload_block}{lead}<link rel="stylesheet"'
        html = html[:m.start()] + repl + html[m.end():]

    # 2) Add defer to <script src="..."> for our known scripts (any path prefix)
    for s in PAGE_SCRIPTS[fn]:
        pat = re.compile(rf'(<script)(\s+src="[^"]*{re.escape(s)}"\s*>)')
        if pat.search(html) and 'defer' not in pat.search(html).group(0):
            html, n = pat.subn(rf'\1 defer\2', html, count=1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[ok] {fn}")

print("done")