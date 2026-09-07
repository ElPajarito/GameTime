#!/usr/bin/env python3
"""Serve GAMEtime on the local network.

  ./serve.py            # http://<your-lan-ip>:8734/
  ./serve.py 9000       # pick another port

Unlike `python3 -m http.server`, this refuses to hand out dotfiles, so
.igdb_auth / .igdb_token (your Twitch credentials) never leave this machine.
Stop it with Ctrl-C.
"""

import http.server
import socket
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8734


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def send_head(self):
        # any path component starting with "." is off limits
        if any(p.startswith(".") for p in self.path.split("?")[0].split("/") if p):
            self.send_error(404, "Not Found")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(403, "Directory listing disabled")
        return None

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))   # no packets sent; just picks the route
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    ip = lan_ip()
    print(f"GAMEtime is live on your network:\n"
          f"  current design : http://{ip}:{PORT}/\n"
          f"  new neon den   : http://{ip}:{PORT}/v2/\n"
          f"(Ctrl-C to stop)")
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        httpd.serve_forever()
