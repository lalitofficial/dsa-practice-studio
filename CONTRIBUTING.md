# Contributing

Thanks for helping improve the tracker. Keep changes small and focused.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Development flow

- Run the UI with `python3 app.py` and open `http://127.0.0.1:8000`.
- Use `python3 tracker.py --help` for CLI checks.
- Keep ref HTML files out of git; they are for one-time imports only.

## Style

- Use 4 spaces for Python.
- Keep lines under 88 chars where reasonable.
- Prefer small, well-named functions and avoid copy-paste logic.

## Pull requests

- Describe the user-facing impact.
- Mention any schema/data changes.
- Update docs if you change usage or behavior.
