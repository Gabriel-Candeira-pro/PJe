#!/usr/bin/env python3
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

PORT = 3000

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != '/api/fetch':
            self._set_headers(404)
            self.wfile.write(json.dumps({'error':'not found'}).encode())
            return
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length) if length else b''
        try:
            data = json.loads(body.decode() or '{}')
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error':'invalid json','detail':str(e)}).encode())
            return
        url = data.get('url')
        selector = data.get('selector')
        if not url or not selector:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error':'url and selector required'}).encode())
            return
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'}
            r = requests.get(url, timeout=15, headers=headers)
            html = r.text
            soup = BeautifulSoup(html, 'html.parser')
            elems = []
            for i,el in enumerate(soup.select(selector)):
                elems.append({'index':i,'text':el.get_text(separator=' ',strip=True),'html':str(el)})
            self._set_headers(200)
            self.wfile.write(json.dumps({'ok':True,'count':len(elems),'elements':elems}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error':'fetch failed','detail':str(e)}).encode())

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print('test fetch server listening on', PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
