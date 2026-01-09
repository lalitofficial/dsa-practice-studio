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

## Features

- Multi-sheet support with a quick switch in the header.
- Unit and chapter grouping with a focused practice flow.
- Progress tracking, notes, and difficulty visibility.
- Star important questions and filter starred-only.
- Notes hub to review all saved notes in one place.
- CSV/Excel import plus JSON/CSV export (UI and CLI).
- Local storage only: data stays on your machine.

## Tech stack

- Python 3.9+
- Flask
- SQLite (unit completion state)
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

## Usage

### UI

- Use the sheet switcher to change between sample Striver and AlgoMaster sheets.
- Filter by unit/chapter/status, mark done, and add notes.
- Use the Import/Export buttons in the header for CSV/Excel/JSON flows.

### CLI

```bash
python3 tracker.py list --sheet striver
python3 tracker.py done 1 --sheet algomaster
python3 tracker.py url 1 https://leetcode.com/problems/two-sum/ --sheet striver
python3 tracker.py stats --sheet algomaster
```

Run `python3 tracker.py --help` to see all options.

## Import sheets (one-time)

Ref HTML files are for initial import only and are ignored in git. The bundled
sample names are just defaults; you can import your own sheets and use them as
your primary data source.

```bash
python3 tracker.py import-html /path/to/striver.html --sheet striver
python3 tracker.py import-html /path/to/algomaster.html --sheet algomaster
```

You can also paste HTML directly:

```bash
python3 tracker.py import-html - --sheet algomaster < algomaster.html
```

Units and chapters are detected automatically when headings are present.
Use `--unit`/`--chapter` to provide defaults if a sheet is missing headings.

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

Progress, notes, and imported lessons live in `.dsa_practice_studio/`. These files
are ignored by git so each user can keep their own progress locally.

## Project layout

```
dsa_practice_studio/   # Python package (parsers, storage, web, CLI)
dashboard/         # UI assets
app.py             # UI entrypoint (thin wrapper)
tracker.py         # CLI entrypoint (thin wrapper)
```

## Contributing

See `CONTRIBUTING.md` for setup and workflow notes.
