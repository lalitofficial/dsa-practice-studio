#!/usr/bin/env python3
import os

from striver_tracker.web import run_server


if __name__ == "__main__":
    host = os.environ.get("STRIVER_HOST", "127.0.0.1")
    port = int(os.environ.get("STRIVER_PORT", "8000"))
    run_server(host=host, port=port)
