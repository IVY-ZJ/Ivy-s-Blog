#!/usr/bin/env python3
"""本地预览服务器（支持 HTTP Range 请求）。

为什么不用自带的 `python -m http.server`？
它不支持 HTTP Range，浏览器无法按字节区间取流，点击/拖动音频进度条时
会放弃跳转并从头缓冲——表现为「歌曲重新播放」。GitHub Pages / Vercel /
Netlify 等线上环境都支持 Range，因此该问题只出现在本地预览。

用法（在博客根目录执行）：
    python scripts/server.py            # 默认 8000 端口
    python scripts/server.py 8000
然后访问 http://localhost:8000
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


class RangeRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send_file_range(self, path, range_header):
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return
        with f:
            size = os.fstat(f.fileno()).st_size
            start, end = 0, size - 1
            partial = False
            if range_header:
                m = RANGE_RE.match(range_header.strip())
                if m and (m.group(1) or m.group(2)):
                    if m.group(1):                      # bytes=a-b / bytes=a-
                        start = int(m.group(1))
                        end = int(m.group(2)) if m.group(2) else size - 1
                    else:                               # bytes=-n（末尾 n 字节）
                        start = max(0, size - int(m.group(2)))
                    start = max(0, min(start, size - 1))
                    end = max(start, min(end, size - 1))
                    partial = True
            self.send_response(206 if partial else 200)
            if partial:
                self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                chunk = f.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                remaining -= len(chunk)

    def do_GET(self):
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if os.path.isdir(path):
            super().do_GET()          # 目录走默认逻辑（找 index.html）
            return
        self._send_file_range(path, self.headers.get("Range"))

    def do_HEAD(self):
        path = self.translate_path(self.path.split("?", 1)[0].split("#", 1)[0])
        if os.path.isdir(path):
            super().do_HEAD()
            return
        try:
            size = os.path.getsize(path)
        except OSError:
            self.send_error(404, "File not found")
            return
        self.send_response(200)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(size))
        self.send_header("Content-Type", self.guess_type(path))
        self.end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[server] %s\n" % (fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    server = ThreadingHTTPServer(("127.0.0.1", port), RangeRequestHandler)
    print("Serving %s at http://localhost:%d (Ctrl+C 退出)" % (root, port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
