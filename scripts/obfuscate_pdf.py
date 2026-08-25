#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Obfuscate a PDF into a scrambled .dat so raw files cannot be pulled
straight from GitHub Pages. The viewer (assets/js/fss-viewer.js) reverses
this at runtime with the matching key. Pure obfuscation, NOT real
encryption: the key ships with the page. Purpose: raise the bar against
naive scrapers/bots, not stop a determined attacker.

Algorithm (must stay in sync with assets/js/fss-viewer.js::deobfuscate):
  for each 4096-byte chunk:
      XOR every byte with a continuous xorshift32 keystream,
      then reverse the chunk in place.
  Verified: deobfuscate(obfuscate(x)) == x.

Usage (default = fss-notes, for backward compat):
  python scripts/obfuscate_pdf.py
  python scripts/obfuscate_pdf.py --src assets/files/engtrain-review.src.pdf \
                                  --dst assets/files/engtrain-review.dat
  python scripts/obfuscate_pdf.py --src x.pdf --dst x.dat --key "YourKey"

The KEY here MUST equal KEY in assets/js/fss-viewer.js, or the viewer's
"%PDF" sanity check will fail and the page will show "解密校验失败".
"""
import argparse
import os

MASK = 0xFFFFFFFF
# !! Keep in sync with assets/js/fss-viewer.js (KEY constant) !!
DEFAULT_KEY = "Ivy-FSS-2026-OpenFolio-ActionBlue"
CHUNK = 4096


def seed_from_key(key: str) -> int:
    s = 0
    for ch in key:
        s = ((s * 31) + ord(ch)) & MASK
    return s


def xorshift32(x: int) -> int:
    x &= MASK
    x ^= (x << 13) & MASK
    x ^= x >> 17
    x ^= (x << 5) & MASK
    return x & MASK


def obfuscate(src: str, dst: str, key: str, chunk: int = CHUNK):
    if not os.path.exists(src):
        raise SystemExit(f"missing source PDF: {src}")
    total = os.path.getsize(src)
    state = seed_from_key(key)
    with open(src, "rb") as fin, open(dst, "wb") as fout:
        while True:
            data = fin.read(chunk)
            if not data:
                break
            n = len(data)
            mixed = bytearray(n)
            # keystream bytes (continuous state across chunks), XOR, then reverse chunk
            for i in range(n):
                state = xorshift32(state)
                mixed[i] = data[n - 1 - i] ^ (state & 0xFF)
            fout.write(mixed)
    print(f"ok: {src} -> {dst} ({total} bytes, obfuscated)")


def main():
    base = os.path.join(os.path.dirname(__file__), "..", "assets", "files")
    ap = argparse.ArgumentParser(description="Obfuscate a PDF into a .dat for the blog's protected PDF viewer.")
    ap.add_argument("--src", default=os.path.abspath(os.path.join(base, "fss-notes.src.pdf")),
                    help="source PDF path (default: assets/files/fss-notes.src.pdf)")
    ap.add_argument("--dst", default=os.path.abspath(os.path.join(base, "fss-notes.dat")),
                    help="output .dat path (default: assets/files/fss-notes.dat)")
    ap.add_argument("--key", default=DEFAULT_KEY, help="obfuscation key (must match fss-viewer.js)")
    ap.add_argument("--chunk", type=int, default=CHUNK, help="chunk size in bytes (default 4096)")
    args = ap.parse_args()
    obfuscate(args.src, args.dst, args.key, args.chunk)


if __name__ == "__main__":
    main()
