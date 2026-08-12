import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8090

class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
    }
    def log_message(self, *a, **kw): pass

with socketserver.TCPServer(("", PORT), H) as httpd:
    httpd.allow_reuse_address = True
    print("listening", PORT)
    httpd.serve_forever()
