"""Local preview server for AssetViewer with caching disabled (so edits show up on refresh).

Usage:
  python dev-server.py [port]               plain static server
  python dev-server.py [port] --mock-sync   also fakes the Supabase sync API in memory

With --mock-sync, supabase-config.js is replaced by one pointing at this server, and
/rest/v1/rpc/fl_key_* behave like the SQL functions in supabase/schema.sql (versions,
conflicts, sessions, lockout). Open http://localhost:PORT and http://127.0.0.1:PORT side
by side: they have separate localStorage, so they act as two devices of one user.
Only the username + secret key sign-in can be tested this way (Google/email need a real
Supabase project). Data lives in memory and is lost when the server stops.
"""
import functools
import hashlib
import http.server
import json
import os
import secrets
import sys
import threading
import time

MOCK = '--mock-sync' in sys.argv
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]

_lock = threading.Lock()
_rows = {}       # username -> {key, version, payload, failed, locked_until}
_sessions = {}   # sha256(token) -> username


def _hash(value):
    return hashlib.sha256(value.encode()).hexdigest()


def _pull(name, since):
    row = _rows[name]
    if row['version'] == 0:
        return {'ok': True, 'version': 0}
    if since >= 0 and row['version'] <= since:
        return {'ok': True, 'version': row['version'], 'unchanged': True}
    return {'ok': True, 'version': row['version'], 'payload': row['payload']}


def _push(name, payload, base):
    row = _rows[name]
    if payload is None or len(payload.encode()) > 1500000:
        return {'ok': False, 'error': 'too_large'}
    if row['version'] != (base or 0):
        return {'ok': False, 'error': 'conflict', 'version': row['version']}
    row['version'] += 1
    row['payload'] = payload
    return {'ok': True, 'version': row['version']}


def _session(token):
    return _sessions.get(_hash(token or ''))


def _new_session(name):
    token = secrets.token_hex(32)
    _sessions[_hash(token)] = name
    return token


def mock_rpc(fn, args):
    with _lock:
        if fn == 'fl_key_register':
            name = (args.get('p_username') or '').strip().lower()
            key = args.get('p_key') or ''
            import re
            if not re.fullmatch(r'[a-z0-9][a-z0-9_.-]{2,31}', name):
                return {'ok': False, 'error': 'bad_username'}
            if len(key) < 10:
                return {'ok': False, 'error': 'weak_key'}
            if name in _rows:
                return {'ok': False, 'error': 'username_taken'}
            _rows[name] = {'key': _hash(key), 'version': 0, 'payload': '', 'failed': 0, 'locked_until': 0}
            return {'ok': True, 'token': _new_session(name), 'username': name}
        if fn == 'fl_key_login':
            name = (args.get('p_username') or '').strip().lower()
            row = _rows.get(name)
            if not row:
                return {'ok': False, 'error': 'bad_credentials'}
            if row['locked_until'] > time.time():
                return {'ok': False, 'error': 'locked'}
            if row['key'] != _hash(args.get('p_key') or ''):
                row['failed'] += 1
                if row['failed'] >= 10:
                    row['failed'] = 0
                    row['locked_until'] = time.time() + 900
                return {'ok': False, 'error': 'bad_credentials'}
            row['failed'] = 0
            return {'ok': True, 'token': _new_session(name), 'username': name}
        if fn in ('fl_key_pull', 'fl_key_push', 'fl_key_delete'):
            name = _session(args.get('p_token'))
            if not name or name not in _rows:
                return {'ok': False, 'error': 'session_expired'}
            if fn == 'fl_key_pull':
                return _pull(name, int(args.get('p_since') or 0))
            if fn == 'fl_key_push':
                return _push(name, args.get('p_payload'), int(args.get('p_base') or 0))
            del _rows[name]
            return {'ok': True}
        if fn == 'fl_key_logout':
            _sessions.pop(_hash(args.get('p_token') or ''), None)
            return {'ok': True}
    return None


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.js': 'text/javascript',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        if MOCK:
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'content-type, apikey, authorization')
        super().end_headers()

    def _json(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if MOCK and self.path.split('?')[0] == '/supabase-config.js':
            host = self.headers.get('Host')
            body = (f"window.FL_SUPABASE = {{ url: 'http://{host}', anonKey: 'mock-anon-key', "
                    "enableGoogle: false, enableEmail: false, enableUsername: true };").encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        prefix = '/rest/v1/rpc/'
        if not (MOCK and self.path.startswith(prefix)):
            return self._json(404, {'message': 'not found'})
        length = int(self.headers.get('Content-Length') or 0)
        try:
            args = json.loads(self.rfile.read(length) or b'{}')
        except ValueError:
            return self._json(400, {'message': 'bad json'})
        result = mock_rpc(self.path[len(prefix):], args)
        if result is None:
            return self._json(404, {'message': 'unknown function'})
        self._json(200, result)

    def log_message(self, fmt, *args):
        if '/rest/v1/rpc/' in (args[0] if args else ''):
            sys.stderr.write('[mock] ' + (fmt % args) + '\n')


if __name__ == '__main__':
    port = int(ARGS[0]) if ARGS else 5173
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'AssetViewer')
    handler = functools.partial(Handler, directory=root)
    print(f'Serving {root} at http://localhost:{port}/' + ('  (mock sync API on)' if MOCK else ''))
    http.server.ThreadingHTTPServer(('', port), handler).serve_forever()
