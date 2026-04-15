#!/usr/bin/env python3
"""Local dev server for Essentia Live.
Serves static files + proxies YouTube audio via yt-dlp.

Usage: python server.py [port]
"""

import http.server
import json
import subprocess
import sys
import threading
import urllib.parse
import urllib.request
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8019
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.audio-cache')
os.makedirs(CACHE_DIR, exist_ok=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/audio':
            self.handle_audio(parsed)
        elif parsed.path == '/api/info':
            self.handle_info(parsed)
        else:
            super().do_GET()

    def handle_info(self, parsed):
        """Get video metadata (title, duration) via yt-dlp."""
        params = urllib.parse.parse_qs(parsed.query)
        video_id = params.get('v', [None])[0]
        if not video_id or len(video_id) != 11:
            self.send_error(400, 'Missing or invalid ?v= parameter')
            return

        url = f'https://www.youtube.com/watch?v={video_id}'
        try:
            result = subprocess.run(
                ['yt-dlp', '--dump-json', '--no-download', url],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode != 0:
                self.send_error(500, result.stderr[:200])
                return

            data = json.loads(result.stdout)
            info = {
                'title': data.get('title', ''),
                'duration': data.get('duration', 0),
                'channel': data.get('channel', ''),
                'thumbnail': data.get('thumbnail', ''),
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(info).encode())
        except subprocess.TimeoutExpired:
            self.send_error(504, 'yt-dlp timed out')
        except Exception as e:
            self.send_error(500, str(e))

    def handle_audio(self, parsed):
        """Extract and serve audio for a YouTube video."""
        params = urllib.parse.parse_qs(parsed.query)
        video_id = params.get('v', [None])[0]
        if not video_id or len(video_id) != 11:
            self.send_error(400, 'Missing or invalid ?v= parameter')
            return

        # Check cache
        cached = os.path.join(CACHE_DIR, f'{video_id}.opus')
        if not os.path.exists(cached):
            cached_m4a = os.path.join(CACHE_DIR, f'{video_id}.m4a')
            if os.path.exists(cached_m4a):
                cached = cached_m4a
            else:
                # Download audio via yt-dlp
                url = f'https://www.youtube.com/watch?v={video_id}'
                out_template = os.path.join(CACHE_DIR, f'{video_id}.%(ext)s')
                print(f'[yt-dlp] Downloading audio for {video_id}...')
                try:
                    result = subprocess.run(
                        [
                            'yt-dlp',
                            '-f', 'bestaudio[ext=m4a]/bestaudio[ext=opus]/bestaudio',
                            '-o', out_template,
                            '--no-playlist',
                            '--no-post-overwrites',
                            url
                        ],
                        capture_output=True, text=True, timeout=120
                    )
                    if result.returncode != 0:
                        print(f'[yt-dlp] Error: {result.stderr[:300]}')
                        self.send_error(500, f'yt-dlp failed: {result.stderr[:200]}')
                        return
                    print(f'[yt-dlp] Done: {result.stdout.strip().split(chr(10))[-1]}')
                except subprocess.TimeoutExpired:
                    self.send_error(504, 'Download timed out')
                    return

                # Find the downloaded file
                for ext in ['opus', 'm4a', 'webm', 'ogg', 'mp3']:
                    candidate = os.path.join(CACHE_DIR, f'{video_id}.{ext}')
                    if os.path.exists(candidate):
                        cached = candidate
                        break
                else:
                    self.send_error(500, 'Downloaded file not found')
                    return

        # Serve the cached file
        ext = os.path.splitext(cached)[1].lower()
        content_types = {
            '.opus': 'audio/opus',
            '.m4a': 'audio/mp4',
            '.webm': 'audio/webm',
            '.ogg': 'audio/ogg',
            '.mp3': 'audio/mpeg',
        }
        content_type = content_types.get(ext, 'audio/mpeg')
        file_size = os.path.getsize(cached)

        # Handle Range requests for seeking
        range_header = self.headers.get('Range')
        if range_header:
            range_match = range_header.strip().replace('bytes=', '').split('-')
            start = int(range_match[0])
            end = int(range_match[1]) if range_match[1] else file_size - 1
            length = end - start + 1

            self.send_response(206)
            self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            self.send_header('Content-Length', str(length))
        else:
            start = 0
            length = file_size
            self.send_response(200)
            self.send_header('Content-Length', str(file_size))

        self.send_header('Content-Type', content_type)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=3600')
        self.end_headers()

        with open(cached, 'rb') as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(65536, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    def end_headers(self):
        # Disable caching for HTML files during dev
        if hasattr(self, 'path') and (self.path == '/' or self.path.endswith('.html')):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, format, *args):
        # Only log API calls, not static file requests
        if '/api/' in (args[0] if args else ''):
            super().log_message(format, *args)


if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('', PORT), Handler)
    print(f'Essentia Live server on http://localhost:{PORT}')
    print(f'Audio cache: {CACHE_DIR}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
