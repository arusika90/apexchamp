#!/usr/bin/env python3
"""Локальный сервер для app/ без кэширования: браузер всегда берёт свежие файлы.
Запуск: python3 serve.py  → http://localhost:5173"""
import http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == '__main__':
    print(f'ApexChamp → http://localhost:{PORT}')
    http.server.ThreadingHTTPServer(('', PORT), NoCacheHandler).serve_forever()
