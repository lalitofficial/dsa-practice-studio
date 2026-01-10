<p align="center">
  <img
    src="assets/banner.svg"
    width="960"
    height="190"
    alt="DSA Practice Studio banner"
  />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.9%2B-3776AB?logo=python&logoColor=white" alt="Python 3.9+" />
  <img src="https://img.shields.io/badge/flask-2.2%2B-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/local--first-yes-2EA44F" alt="Local-first" />
  <img src="https://img.shields.io/badge/samples-striver%20%7C%20algomaster-0B5FFF" alt="Samples" />
</p>

<p align="center">
  Local-first practice dashboard with sample Striver and AlgoMaster sheets.
</p>

## Table of contents

- [Features](#features)
- [Quickstart](#quickstart)
- [Usage guide](#usage-guide)
- [Widget studio](#widget-studio)
- [Revision panel](#revision-panel)
- [Admin console](#admin-console)
- [Tracking logic](#tracking-logic)
- [Import & export](#import--export)
- [CLI](#cli)
- [Data storage](#data-storage)
- [Project layout](#project-layout)
- [Contributing](#contributing)

## Features

- Multi-sheet support with a quick switch in the header.
- Unit and chapter grouping with a focused practice flow.
- Progress tracking, notes, and difficulty visibility.
- Star important questions and filter starred-only.
- Notes hub to review all saved notes in one place.
- Revision panel for notes and bookmarked questions.
- CSV/Excel import plus JSON/CSV export (UI and CLI).
- Local-first storage in SQLite/JSON (no browser storage).

## Tech stack

- Python 3.9+
- Flask
- SQLite (unit status + UI/view state)
- JSON (questions, notes, progress)
- OpenPyXL (Excel import)
- Vanilla HTML/CSS/JS dashboard

## Quickstart

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Open `http://127.0.0.1:8000` and switch sample sheets from the header.

## Usage guide

### Dashboard (learner view)

- Switch sheets from the header tabs.
- Use search + filters to narrow the list.
- Mark questions done and add notes as you practice.
- Star questions to revisit later.
- Open Notes to edit per-question notes.
- Greyed link icons mean a URL is missing.
- Click the floating `W` launcher in the bottom-right corner to open the widget dialog, pick which cards (clock, timer, stopwatch, custom/community widgets) stay active, and toggle the overlay so the draggable cards float over the dashboard while the launcher can keep the dialog out of the way.

### Revision panel

- Review all notes and starred questions in one place at `/revision`.
- Use search to filter notes or bookmarked questions.
- Unstar items when you are done with them.

### Admin console

- `/admin` hosts the command center and configuration tools.
- Tracking panel shows momentum, heatmap, and sheet health.
- Sheet Management handles create/rename/import/export and bulk actions.
- Unit Management refactors unit/chapter names and bulk difficulty.
- UI Management controls labels, layout, themes, and link fallback rules.
- Troubleshooting provides health checks and recovery actions.

### Tracking logic

- Heatmap counts only questions marked done.
- Heatmap scope is the currently active sheet.
- Momentum counts solved items over the last 7 days.

### Import & export

- Import is CSV or Excel only.
- Export any sheet as CSV or JSON.
- UI settings can be exported/imported as JSON in Admin → UI Management.

## Widget studio

- Visit `/widgets` or open Widget Studio from the dashboard Settings panel for the full widget workbench.
- The clock, timer, and stopwatch live as widgets, so toggling them from Settings adds or removes distinct cards; transit the floating `W` launcher to open the widget dialog and learn how to control which cards show up in the overlay, which itself continues to expose inline start/pause and reset buttons so there is no separate focus tray.
- Custom widgets created via the dashboard form (title, description, tags) show up in both the rack and overlay, remember their position, and can be removed any time.
- The community catalog inside the studio ships with a growing set of helper widgets—click any catalog card to add it to your rack/overlay instantly and drag it to the place you need.

### CLI

```bash
python3 tracker.py list --sheet striver
python3 tracker.py done 1 --sheet algomaster
python3 tracker.py url 1 https://leetcode.com/problems/two-sum/ --sheet striver
python3 tracker.py stats --sheet algomaster
```

Run `python3 tracker.py --help` to see all options.

## Import sheets (one-time)

Import is CSV/Excel only. The bundled sample sheets live in `samples/` and can be
re-imported any time if you want to reset to defaults.

### CSV / Excel format

Column order:

1) Unit name
2) Chapter name
3) Question name
4) LeetCode link (optional)
5) YouTube link (optional)
6) Default note (optional)
7) Difficulty (optional: Easy/Medium/Hard)
8) Starred (optional: yes/no)

Only columns 1-3 are required.

```bash
python3 tracker.py import-table samples/striver_sample.csv --sheet striver
python3 tracker.py import-table samples/algomaster_sample.csv --sheet algomaster
python3 tracker.py import-table /path/to/sheet.xlsx --sheet striver --sheet-name "Sheet1"
```

Sample templates live in `samples/`.

If you want to reset a sheet, delete its state files from `.dsa_practice_studio/` and
re-run the import.

## Data storage

Progress, notes, and imported lessons live in `.dsa_practice_studio/` JSON files.
UI preferences, view state, and unit completion live in `.dsa_practice_studio/tracker.db`.
All data is local and ignored by git.

## Project layout

```
dsa_practice_studio/   # Python package (parsers, storage, web, CLI)
dashboard/         # UI assets
app.py             # UI entrypoint (thin wrapper)
tracker.py         # CLI entrypoint (thin wrapper)
```

## Contributing

See `CONTRIBUTING.md` for setup and workflow notes. Please validate locally with `pip install -r requirements.txt` (and `pip install -e .` if you change Python modules) before submitting a branch, document architectural changes in the README or an ADR, and open a pull request for review so we can sync on widget/interface updates.
