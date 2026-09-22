#!/usr/bin/env python3
"""
Pokopia 防快取靜態檔案伺服器
為所有靜態資源（HTML、CSS、JS、圖片）注入 no-cache 標頭，
確保手機瀏覽器每次都載入最新版本。
"""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8899

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """覆寫 end_headers，為每個回應注入防快取標頭"""
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('', PORT), NoCacheHandler) as httpd:
        print(f'🚀 Pokopia ThreadingNoCacheServer running on port {PORT}')
        httpd.serve_forever()
