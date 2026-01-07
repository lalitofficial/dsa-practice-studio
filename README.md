<p align="center">
  <svg width="960" height="190" viewBox="0 0 960 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DSA Practice Studio banner">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0B0F14" />
        <stop offset="60%" stop-color="#121C28" />
        <stop offset="100%" stop-color="#1C2636" />
      </linearGradient>
      <linearGradient id="glowA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#32D1C5" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#32D1C5" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="glowB" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF9F43" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#FF9F43" stop-opacity="0" />
      </linearGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none" stroke="#1C2A3A" stroke-width="1" />
      </pattern>
      <filter id="blur20" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
    <rect width="960" height="190" rx="24" fill="url(#bg)" />
    <rect width="960" height="190" rx="24" fill="url(#grid)" opacity="0.35" />
    <ellipse cx="120" cy="40" rx="120" ry="60" fill="url(#glowA)" filter="url(#blur20)" />
    <ellipse cx="860" cy="150" rx="140" ry="70" fill="url(#glowB)" filter="url(#blur20)" />
    <path d="M0 132 C180 80 360 170 540 120 C700 80 820 110 960 70 V190 H0 Z" fill="#0E1520" opacity="0.92" />
    <rect x="48" y="52" width="7" height="86" rx="4" fill="#32D1C5" />
    <g fill="#E7EEF6">
      <text x="72" y="92" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700" letter-spacing="0.6">
        DSA Practice Studio
      </text>
      <text x="72" y="120" font-size="14" font-family="Segoe UI, Arial, sans-serif" opacity="0.8">
        Local-first practice dashboard with sample Striver and AlgoMaster sheets
      </text>
    </g>
    <g font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="#E7EEF6">
      <rect x="72" y="134" width="110" height="26" rx="13" fill="#162231" stroke="#223246" />
      <text x="92" y="151">Striver A2Z</text>
      <rect x="190" y="134" width="110" height="26" rx="13" fill="#162231" stroke="#223246" />
      <text x="210" y="151">AlgoMaster</text>
      <rect x="308" y="134" width="120" height="26" rx="13" fill="#162231" stroke="#223246" />
      <text x="328" y="151">Notes &amp; Progress</text>
    </g>
  </svg>
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
