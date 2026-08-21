#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batch update: replace the circular theme button with the iOS slider
structure and add frame-src blob: to the CSP meta on every page."""
import re
import glob

OLD_BTN = """        <button class="theme-toggle" data-theme-toggle aria-label="切换外观">
          <svg class="tt-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
          <svg class="tt-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 13.5a8 8 0 0 1-9.9-9.9 8.5 8.5 0 1 0 9.9 9.9Z"/></svg>
        </button>"""

NEW_BTN = """        <button class="theme-toggle" data-theme-toggle role="switch" aria-checked="false" aria-label="切换外观">
          <span class="tt-track">
            <svg class="tt-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>
            <span class="tt-thumb"></span>
            <svg class="tt-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 13.5a8 8 0 0 1-9.9-9.9 8.5 8.5 0 1 0 9.9 9.9Z"/></svg>
          </span>
        </button>"""

CSP_OLD = "frame-ancestors 'self'; object-src 'none'; connect-src 'self'"
CSP_NEW = "frame-ancestors 'self'; frame-src 'self' blob:; object-src 'none'; connect-src 'self'"

files = (
    sorted(glob.glob("*.html")) + sorted(glob.glob("posts/*.html"))
)
for f in files:
    with open(f, encoding="utf-8") as fh:
        s = fh.read()
    orig = s
    if OLD_BTN in s:
        s = s.replace(OLD_BTN, NEW_BTN)
    if CSP_OLD in s and CSP_NEW not in s:
        s = s.replace(CSP_OLD, CSP_NEW)
    if s != orig:
        with open(f, "w", encoding="utf-8", newline="") as fh:
            fh.write(s)
        print("updated:", f)
    else:
        print("skipped:", f)
