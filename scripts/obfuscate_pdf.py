#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Obfuscate a PDF into a scrambled .dat so raw files cannot be pulled
straight from GitHub Pages. The viewer (fss-viewer.js) reverses this at
runtime with the matching key. Pure obfuscation, NOT real encryption:
the key ships with the page. Purpose: raise the bar against naive
scrapers/bots, not stop a determined attacker."""
import os

MASK = 0xFFFFFFFF

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

def obfuscate(src: str, dst: str, key: str, chunk: int = 4096):
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
    print(f"ok: {src} -> {dst} ({total} bytes)")

if __name__ == "__main__":
    KEY = "Ivy-FSS-2026-OpenFolio-ActionBlue"
    base = os.path.join(os.path.dirname(__file__), "..", "assets", "files")
    src = os.path.abspath(os.path.join(base, "fss-notes.src.pdf"))
    dst = os.path.abspath(os.path.join(base, "fss-notes.dat"))
    if not os.path.exists(src):
        raise SystemExit(f"missing {src}")
    obfuscate(src, dst, KEY)
