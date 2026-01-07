# striver-leetcode-template

## Tracker
Use the local tracker to browse questions, mark progress, and attach LeetCode URLs.

Basic commands:

```bash
python3 tracker.py list
python3 tracker.py done 1
python3 tracker.py url 1 https://leetcode.com/problems/two-sum/
python3 tracker.py stats
```

Run `python3 tracker.py --help` to see all options.

### Dashboard
Run a local UI for browsing and updating progress:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Open `http://127.0.0.1:8000` in your browser.

### Import lessons and LeetCode URLs
Use HTML from the Striver sheet to add lessons and auto-attach URLs by title match:

```bash
python3 tracker.py import-html /path/to/sheet.html --unit "Step 01 - Basics"
```

You can also paste HTML directly:

```bash
python3 tracker.py import-html - --unit "Step 01 - Basics" < sheet.html
```

If the HTML contains headings (h2/h3/h4), units and chapters are detected automatically.
Use `--unit` and `--chapter` to supply defaults when headings are missing.
When lessons are present, the dashboard uses the ref_file lessons as the source of truth instead of the repo files.
