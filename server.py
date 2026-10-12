#!/usr/bin/env python3
"""Serveur de développement NUANCE (PWA).

Sert l'app statique avec les bons types MIME (manifest, modules JS)
et désactive le cache pour le service worker afin de faciliter les mises à jour.

Usage : python3 server.py [port]
"""
import http.server
import mimetypes
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Le SW doit toujours être revalidé pour capter les nouvelles versions.
        if self.path.endswith('/sw.js') or self.path.endswith('.webmanifest'):
            self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('[nuance] %s\n' % (fmt % args))


if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f'NUANCE — http://0.0.0.0:{PORT}')
        httpd.serve_forever()
