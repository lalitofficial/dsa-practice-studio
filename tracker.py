#!/usr/bin/env python3
import argparse
import json
import random
import re
import sqlite3
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SHEET_DIR = BASE_DIR / "leetcode-striver"
DATA_DIR = BASE_DIR / ".striver_tracker"
STATE_PATH = DATA_DIR / "state.json"
LESSONS_PATH = DATA_DIR / "lessons.json"
UNIT_DB_PATH = DATA_DIR / "tracker.db"

QUESTION_EXTS = {".py", ".ipynb"}

DEFAULT_SHEET_ID = "striver"
SHEETS = {
    "striver": {"name": "Striver A2Z", "html": BASE_DIR / "striver_ref_file.html"},
    "algomaster": {"name": "AlgoMaster", "html": BASE_DIR / "algomaster_ref.html"},
}


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def resolve_sheet_id(sheet_id):
    if not sheet_id:
        return DEFAULT_SHEET_ID
    if sheet_id in SHEETS:
        return sheet_id
    return DEFAULT_SHEET_ID


def get_state_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    if sheet_id == DEFAULT_SHEET_ID:
        return STATE_PATH
    return DATA_DIR / f"state_{slugify(sheet_id)}.json"


def get_lessons_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    if sheet_id == DEFAULT_SHEET_ID:
        return LESSONS_PATH
    return DATA_DIR / f"lessons_{slugify(sheet_id)}.json"


def get_sheet_html_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    sheet = SHEETS.get(sheet_id, {})
    html_path = sheet.get("html")
    if html_path and Path(html_path).exists():
        return html_path
    if sheet_id == "striver":
        fallback = BASE_DIR / "ref_file.html"
        if fallback.exists():
            return fallback
    return html_path


def pretty_title(stem):
    cleaned = stem.replace("_", "-")
    parts = [p for p in re.split(r"[-\s]+", cleaned) if p]
    out = []
    for part in parts:
        if part.isdigit():
            out.append(part)
            continue
        if part.isupper() and len(part) <= 4:
            out.append(part)
            continue
        if any(ch.isdigit() for ch in part):
            out.append(part)
            continue
        out.append(part.capitalize())
    return " ".join(out)


def normalize_title(value):
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def clean_heading_text(value):
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = re.sub(r"\b\d+\s*/\s*\d+\b", "", cleaned)
    cleaned = re.sub(r"\b\d+%\b", "", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" -")
    return cleaned


def _needs_reparse(sheet_id, lessons):
    if sheet_id == DEFAULT_SHEET_ID:
        return False
    if not lessons:
        return False
    units = {str(lesson.get("unit", "")).strip().lower() for lesson in lessons}
    if len(units) <= 1:
        only = next(iter(units)) if units else ""
        if only in {"", "imported", "general"}:
            return True
    return False


def load_lessons(sheet_id=DEFAULT_SHEET_ID):
    path = get_lessons_path(sheet_id)
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            lessons = json.load(handle)
        cleaned = [
            lesson
            for lesson in lessons
            if not (
                str(lesson.get("title", "")).strip().lower() in {"problem", "difficulty"}
                and not lesson.get("leetcode_url")
                and not lesson.get("youtube_url")
                and not lesson.get("resource_url")
            )
        ]
        if len(cleaned) != len(lessons):
            save_lessons(cleaned, sheet_id)
        if _needs_reparse(sheet_id, cleaned):
            html_path = get_sheet_html_path(sheet_id)
            if html_path and Path(html_path).exists():
                html_text = Path(html_path).read_text(encoding="utf-8")
                parsed = parse_html_lessons(html_text, None, None)
                if parsed:
                    save_lessons(parsed, sheet_id)
                    return parsed
        return cleaned

    html_path = get_sheet_html_path(sheet_id)
    if html_path and Path(html_path).exists():
        html_text = Path(html_path).read_text(encoding="utf-8")
        lessons = parse_html_lessons(html_text, None, None)
        if lessons:
            save_lessons(lessons, sheet_id)
            return lessons
    return []


def save_lessons(lessons, sheet_id=DEFAULT_SHEET_ID):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = get_lessons_path(sheet_id)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(lessons, handle, indent=2, sort_keys=False)


def _open_unit_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(UNIT_DB_PATH)
    columns = [
        row[1] for row in conn.execute("PRAGMA table_info(unit_status)").fetchall()
    ]
    if not columns:
        conn.execute(
            "CREATE TABLE unit_status ("
            "sheet TEXT NOT NULL, "
            "unit TEXT NOT NULL, "
            "done INTEGER NOT NULL, "
            "updated_at TEXT NOT NULL, "
            "PRIMARY KEY (sheet, unit))"
        )
        conn.commit()
        return conn

    if "sheet" not in columns:
        rows = conn.execute("SELECT unit, done, updated_at FROM unit_status").fetchall()
        conn.execute("ALTER TABLE unit_status RENAME TO unit_status_old")
        conn.execute(
            "CREATE TABLE unit_status ("
            "sheet TEXT NOT NULL, "
            "unit TEXT NOT NULL, "
            "done INTEGER NOT NULL, "
            "updated_at TEXT NOT NULL, "
            "PRIMARY KEY (sheet, unit))"
        )
        conn.executemany(
            "INSERT INTO unit_status (sheet, unit, done, updated_at) VALUES (?, ?, ?, ?)",
            [(DEFAULT_SHEET_ID, unit, done, updated_at) for unit, done, updated_at in rows],
        )
        conn.execute("DROP TABLE unit_status_old")
        conn.commit()
    return conn


def load_unit_status(sheet_id=DEFAULT_SHEET_ID):
    sheet_id = resolve_sheet_id(sheet_id)
    conn = _open_unit_db()
    rows = conn.execute(
        "SELECT unit, done, updated_at FROM unit_status WHERE sheet = ?",
        (sheet_id,),
    ).fetchall()
    conn.close()
    status = {}
    for unit, done, updated_at in rows:
        status[unit] = {"done": bool(done), "updated_at": updated_at}
    return status


def set_unit_status(sheet_id, unit, done):
    sheet_id = resolve_sheet_id(sheet_id)
    conn = _open_unit_db()
    conn.execute(
        "INSERT INTO unit_status (sheet, unit, done, updated_at) VALUES (?, ?, ?, ?) "
        "ON CONFLICT(sheet, unit) DO UPDATE SET done=excluded.done, updated_at=excluded.updated_at",
        (sheet_id, unit, int(bool(done)), now_iso()),
    )
    conn.commit()
    conn.close()


class SheetHTMLExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_unit = ""
        self.current_chapter = ""
        self._heading_tag = ""
        self._heading_text = []
        self._heading_has_unit = False
        self._heading_has_chapter = False
        self._capture_unit_tag = ""
        self._capture_chapter_tag = ""
        self._capture_unit_text = []
        self._capture_chapter_text = []
        self._capture_paragraph = False
        self._paragraph_text = []
        self._pending_unit = ""
        self._in_table = False
        self._in_tr = False
        self._in_cell = False
        self._in_a = False
        self._cells = []
        self._cell_text = []
        self._cell_links = []
        self._anchor_text = []
        self._anchor_href = ""

    def handle_starttag(self, tag, attrs):
        if tag in {"h1", "h2", "h3", "h4"}:
            self._heading_tag = tag
            self._heading_text = []
            self._heading_has_unit = False
            self._heading_has_chapter = False
        if tag == "table":
            self._in_table = True
            if self._pending_unit:
                self.current_unit = self._pending_unit
                self.current_chapter = ""
                self._pending_unit = ""
        if tag == "tr":
            self._in_tr = True
            self._cells = []
        if self._in_tr and tag in {"td", "th"}:
            self._in_cell = True
            self._cell_text = []
            self._cell_links = []
        if tag == "p" and not self._in_table and not self._in_tr and not self._in_cell:
            self._capture_paragraph = True
            self._paragraph_text = []
        if self._in_cell and tag == "a":
            self._in_a = True
            self._anchor_text = []
            attrs_map = dict(attrs)
            self._anchor_href = attrs_map.get("href", "")
        attrs_map = dict(attrs)
        class_attr = attrs_map.get("class", "")
        if tag in {"span", "div"} and "tuf-accordion-title" in class_attr:
            self._capture_unit_tag = tag
            self._capture_unit_text = []
        if tag == "button" and "tuf-subrow-btn" in class_attr:
            self._capture_chapter_tag = tag
            self._capture_chapter_text = []

    def handle_data(self, data):
        if self._capture_paragraph:
            self._paragraph_text.append(data)
            return
        if self._capture_unit_tag:
            self._capture_unit_text.append(data)
            return
        if self._capture_chapter_tag:
            self._capture_chapter_text.append(data)
            return
        if self._heading_tag:
            self._heading_text.append(data)
            return
        if self._in_a:
            self._anchor_text.append(data)
        elif self._in_cell:
            self._cell_text.append(data)

    def handle_endtag(self, tag):
        if tag == "table":
            self._in_table = False
        if tag == "p" and self._capture_paragraph:
            heading = " ".join(part.strip() for part in self._paragraph_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self._pending_unit = heading
            self._capture_paragraph = False
            self._paragraph_text = []
        if tag == self._capture_unit_tag and self._capture_unit_tag:
            heading = " ".join(part.strip() for part in self._capture_unit_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self.current_unit = heading
                self.current_chapter = ""
                if self._heading_tag:
                    self._heading_has_unit = True
            self._capture_unit_tag = ""
            self._capture_unit_text = []
        if tag == self._capture_chapter_tag and self._capture_chapter_tag:
            heading = " ".join(part.strip() for part in self._capture_chapter_text if part.strip())
            heading = clean_heading_text(heading)
            if heading:
                self.current_chapter = heading
                if self._heading_tag:
                    self._heading_has_chapter = True
            self._capture_chapter_tag = ""
            self._capture_chapter_text = []
        if tag in {"h1", "h2", "h3", "h4"} and tag == self._heading_tag:
            heading = " ".join(part.strip() for part in self._heading_text if part.strip())
            heading = clean_heading_text(heading)
            if heading and not self._heading_has_unit and not self._heading_has_chapter:
                if tag in {"h1", "h2"}:
                    self.current_unit = heading
                    self.current_chapter = ""
                elif tag == "h3":
                    if not self.current_unit:
                        self.current_unit = heading
                    else:
                        self.current_chapter = heading
                else:
                    if not self.current_unit:
                        self.current_unit = heading
                    else:
                        self.current_chapter = heading
            self._heading_tag = ""
            self._heading_text = []
            return

        if tag == "a" and self._in_a:
            text = "".join(self._anchor_text).strip()
            self._cell_links.append({"href": self._anchor_href, "text": text})
            self._in_a = False
            self._anchor_text = []
            self._anchor_href = ""
        if tag in {"td", "th"} and self._in_cell:
            text = " ".join(part.strip() for part in self._cell_text if part.strip())
            self._cells.append({"text": text.strip(), "links": self._cell_links})
            self._in_cell = False
            self._cell_text = []
            self._cell_links = []
        if tag == "tr" and self._in_tr:
            if any(cell["text"] or cell["links"] for cell in self._cells):
                self.rows.append(
                    {
                        "cells": self._cells,
                        "unit": self.current_unit,
                        "chapter": self.current_chapter,
                    }
                )
            self._in_tr = False
            self._cells = []


def parse_html_lessons(html_text, default_unit=None, default_chapter=None):
    parser = SheetHTMLExtractor()
    parser.feed(html_text)
    lessons = []

    order = 1
    for row in parser.rows:
        cells = row["cells"]
        header_text = " ".join(cell["text"] for cell in cells).lower()
        if ("problem" in header_text and "status" in header_text) or (
            "problem" in header_text and "difficulty" in header_text
        ):
            continue

        all_links = []
        for cell in cells:
            all_links.extend(cell["links"])

        title = ""
        for link in all_links:
            if link["text"] and link["text"].strip().lower() != "solve":
                title = link["text"].strip()
                break
        if not title and cells:
            title = cells[1]["text"] if len(cells) > 1 else cells[0]["text"]
        title = title.strip()
        if not title:
            continue

        unit = row["unit"] or default_unit or "Imported"
        chapter = row["chapter"] or default_chapter or "General"
        difficulty = cells[-1]["text"].strip() if cells else ""

        leetcode_url = ""
        youtube_url = ""
        solve_url = ""
        resource_url = ""
        for link in all_links:
            href = link["href"] or ""
            if "leetcode.com" in href:
                leetcode_url = href
                break
        for link in all_links:
            href = link["href"] or ""
            if "youtu.be" in href or "youtube.com" in href:
                youtube_url = href
                break
        if not leetcode_url:
            for link in all_links:
                if link["text"].strip().lower() == "solve":
                    solve_url = link["href"]
                    break
        for link in all_links:
            href = link["href"] or ""
            if href and href not in {leetcode_url, solve_url, youtube_url}:
                resource_url = href
                break

        lesson_id = f"sheet-{slugify(unit)}-{slugify(chapter)}-{slugify(title)}"
        lessons.append(
            {
                "id": lesson_id,
                "title": title,
                "unit": unit,
                "chapter": chapter,
                "kind": "sheet",
                "leetcode_url": leetcode_url or "",
                "youtube_url": youtube_url or "",
                "resource_url": resource_url,
                "difficulty": difficulty,
                "order": order,
            }
        )
        order += 1

    return lessons


def merge_lessons(existing, incoming):
    existing_map = {lesson["id"]: lesson for lesson in existing}
    merged = []
    seen = set()
    for lesson in incoming:
        prev = existing_map.get(lesson["id"], {})
        merged.append({**prev, **lesson})
        seen.add(lesson["id"])
    for lesson in existing:
        if lesson["id"] not in seen:
            merged.append(lesson)
    return merged


def scan_questions(sheet_id=DEFAULT_SHEET_ID):
    sheet_id = resolve_sheet_id(sheet_id)
    lessons = load_lessons(sheet_id)
    if lessons:
        return build_items_from_lessons(lessons)

    if sheet_id != DEFAULT_SHEET_ID:
        return []

    if not SHEET_DIR.exists():
        print(f"Missing sheet directory: {SHEET_DIR}", file=sys.stderr)
        sys.exit(1)

    items = []
    for path in sorted(SHEET_DIR.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix not in QUESTION_EXTS:
            continue
        rel_path = path.relative_to(BASE_DIR)
        parts = rel_path.parts
        step = parts[1] if parts[0] == "leetcode-striver" and len(parts) > 1 else parts[0]
        group = " / ".join(parts[2:-1]) if parts[0] == "leetcode-striver" and len(parts) > 3 else ""
        stem = path.stem
        item_id = slugify(str(path.relative_to(SHEET_DIR).with_suffix("")))
        unit = step
        chapter = group if group else "Practice"
        items.append(
            {
                "id": item_id,
                "title": pretty_title(stem),
                "step": step,
                "unit": unit,
                "group": group,
                "lesson": chapter,
                "chapter": chapter,
                "path": str(rel_path),
                "kind": "problem",
            }
        )
    return items


def build_items_from_lessons(lessons):
    items = []
    ordered = sorted(lessons, key=lambda lesson: lesson.get("order", 10**9))
    for lesson in ordered:
        unit = lesson.get("unit") or lesson.get("step") or ""
        chapter = (
            lesson.get("chapter")
            or lesson.get("lesson")
            or lesson.get("group")
            or "General"
        )
        leetcode_url = lesson.get("leetcode_url") or lesson.get("url") or ""
        items.append(
            {
                "id": lesson["id"],
                "title": lesson["title"],
                "step": unit,
                "unit": unit,
                "group": chapter,
                "lesson": chapter,
                "chapter": chapter,
                "path": "",
                "kind": lesson.get("kind", "sheet"),
                "url": leetcode_url,
                "leetcode_url": leetcode_url,
                "youtube_url": lesson.get("youtube_url", ""),
                "resource_url": lesson.get("resource_url", ""),
                "difficulty": lesson.get("difficulty", ""),
                "order": lesson.get("order", 0),
            }
        )
    return items


def load_state(sheet_id=DEFAULT_SHEET_ID):
    path = get_state_path(sheet_id)
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {"version": 1, "updated_at": "", "questions": []}


def save_state(state, sheet_id=DEFAULT_SHEET_ID):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = now_iso()
    path = get_state_path(sheet_id)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2, sort_keys=False)


def sync_state(state, sheet_id=DEFAULT_SHEET_ID):
    scanned = scan_questions(sheet_id)
    existing = {q["id"]: q for q in state.get("questions", [])}
    title_index = {}
    for q in state.get("questions", []):
        key = normalize_title(q.get("title", ""))
        title_index.setdefault(key, []).append(q)
    merged = []
    for item in scanned:
        prev = existing.get(item["id"])
        if prev is None:
            key = normalize_title(item.get("title", ""))
            matches = title_index.get(key, [])
            if len(matches) == 1:
                prev = matches[0]
        if prev is None:
            prev = {}
        leetcode_url = (
            prev.get("leetcode_url")
            or prev.get("url")
            or item.get("leetcode_url")
            or item.get("url", "")
        )
        merged.append(
            {
                **item,
                "done": bool(prev.get("done", False)),
                "url": leetcode_url,
                "leetcode_url": leetcode_url,
                "youtube_url": prev.get("youtube_url", item.get("youtube_url", "")),
                "resource_url": item.get("resource_url", prev.get("resource_url", "")),
                "difficulty": item.get("difficulty", prev.get("difficulty", "")),
                "notes": prev.get("notes", ""),
                "last_done_at": prev.get("last_done_at", ""),
            }
        )
    state["questions"] = merged
    return state


def load_and_sync_state(sheet_id=DEFAULT_SHEET_ID):
    sheet_id = resolve_sheet_id(sheet_id)
    state = load_state(sheet_id)
    return sync_state(state, sheet_id)


def compute_stats(questions):
    total = len(questions)
    done = sum(1 for q in questions if q["done"])
    by_unit = {}
    for q in questions:
        unit = q.get("unit") or q.get("step") or "Unassigned"
        bucket = by_unit.setdefault(unit, {"done": 0, "total": 0})
        bucket["total"] += 1
        if q["done"]:
            bucket["done"] += 1
    units = []
    for unit in sorted(by_unit.keys()):
        bucket = by_unit[unit]
        pct = (bucket["done"] / bucket["total"] * 100) if bucket["total"] else 0
        units.append(
            {
                "unit": unit,
                "done": bucket["done"],
                "total": bucket["total"],
                "percent": pct,
            }
        )
    pct = (done / total * 100) if total else 0
    return {
        "total": total,
        "done": done,
        "todo": total - done,
        "percent": pct,
        "by_unit": units,
    }


def find_question_by_id(questions, qid):
    for q in questions:
        if q["id"] == qid:
            return q
    return None


def filter_questions(
    questions, unit=None, chapter=None, status=None, query=None, step=None, lesson=None
):
    filtered = questions
    unit = unit or step
    if unit:
        unit_lower = unit.lower()
        filtered = [
            q
            for q in filtered
            if unit_lower in (q.get("unit") or q.get("step") or "").lower()
        ]
    chapter = chapter or lesson
    if chapter:
        chapter_lower = chapter.lower()
        filtered = [
            q
            for q in filtered
            if chapter_lower in (q.get("chapter") or q.get("lesson") or q.get("group") or "").lower()
        ]
    if status == "done":
        filtered = [q for q in filtered if q["done"]]
    elif status == "todo":
        filtered = [q for q in filtered if not q["done"]]
    if query:
        ql = query.lower()
        filtered = [q for q in filtered if ql in q["title"].lower() or ql in q["id"]]
    return filtered


def render_list(questions, show_ids=False, show_urls=False):
    lines = []
    for idx, q in enumerate(questions, start=1):
        status = "x" if q["done"] else " "
        unit = q.get("unit") or q.get("step") or "Unassigned"
        chapter = q.get("chapter") or q.get("lesson") or q.get("group") or ""
        unit_label = f"{unit} / {chapter}" if chapter else unit
        line = f"{idx:>3}. [{status}] {q['title']} ({unit_label})"
        if show_ids:
            line += f" id={q['id']}"
        if show_urls and q["url"]:
            line += f" url={q['url']}"
        lines.append(line)
    return "\n".join(lines)


def resolve_question(questions, token):
    if token.isdigit():
        index = int(token)
        if index < 1 or index > len(questions):
            raise ValueError(f"Index out of range: {token}")
        return questions[index - 1]

    exact = [q for q in questions if q["id"] == token]
    if len(exact) == 1:
        return exact[0]

    prefix = [q for q in questions if q["id"].startswith(token)]
    if len(prefix) == 1:
        return prefix[0]

    title_hits = [q for q in questions if token.lower() in q["title"].lower()]
    if len(title_hits) == 1:
        return title_hits[0]

    candidates = exact or prefix or title_hits
    if not candidates:
        raise ValueError(f"No match for: {token}")

    sample = ", ".join(q["id"] for q in candidates[:5])
    raise ValueError(f"Multiple matches for '{token}'. Try a longer id. Matches: {sample}")


def cmd_list(state, args):
    unit = args.unit or args.step
    questions = filter_questions(
        state["questions"],
        unit=unit,
        chapter=args.chapter or args.lesson,
        status=args.status,
        query=args.query,
    )
    if not questions:
        print("No questions match your filters.")
        return
    print(render_list(questions, show_ids=args.ids, show_urls=args.urls))


def cmd_stats(state, args):
    stats = compute_stats(state["questions"])
    print(f"Total: {stats['done']}/{stats['total']} ({stats['percent']:.1f}%)")
    for unit in stats["by_unit"]:
        print(
            f"- {unit['unit']}: {unit['done']}/{unit['total']} ({unit['percent']:.1f}%)"
        )


def cmd_show(state, args):
    question = resolve_question(state["questions"], args.query)
    print(f"Title: {question['title']}")
    unit = question.get("unit") or question.get("step") or "Unassigned"
    chapter = question.get("chapter") or question.get("lesson") or question.get("group") or ""
    print(f"Unit: {unit}")
    if chapter:
        print(f"Chapter: {chapter}")
    print(f"Type: {question.get('kind', 'problem')}")
    if question.get("difficulty"):
        print(f"Difficulty: {question['difficulty']}")
    if question["path"]:
        print(f"Path: {question['path']}")
    print(f"Done: {question['done']}")
    if question["last_done_at"]:
        print(f"Last done: {question['last_done_at']}")
    leetcode_url = question.get("leetcode_url") or question.get("url") or ""
    if leetcode_url:
        print(f"LeetCode: {leetcode_url}")
    if question.get("resource_url"):
        print(f"Resource: {question['resource_url']}")
    if question.get("youtube_url"):
        print(f"YouTube: {question['youtube_url']}")
    if question["notes"]:
        print(f"Notes: {question['notes']}")


def cmd_done(state, args, done_value):
    question = resolve_question(state["questions"], args.query)
    question["done"] = done_value
    if done_value:
        question["last_done_at"] = now_iso()
    print(f"Updated: {question['title']} -> {'done' if done_value else 'todo'}")


def cmd_toggle(state, args):
    question = resolve_question(state["questions"], args.query)
    question["done"] = not question["done"]
    if question["done"]:
        question["last_done_at"] = now_iso()
    print(f"Updated: {question['title']} -> {'done' if question['done'] else 'todo'}")


def cmd_url(state, args):
    question = resolve_question(state["questions"], args.query)
    if args.url:
        url = args.url.strip()
        question["leetcode_url"] = url
        question["url"] = url
        print(f"Saved LeetCode URL for {question['title']}")
        return
    leetcode_url = question.get("leetcode_url") or question.get("url") or ""
    if leetcode_url:
        print(leetcode_url)
        return
    search = f"https://leetcode.com/problemset/?search={question['title'].replace(' ', '%20')}"
    print(f"No URL set. Search: {search}")


def cmd_note(state, args):
    question = resolve_question(state["questions"], args.query)
    if args.note:
        question["notes"] = args.note.strip()
        print(f"Saved note for {question['title']}")
        return
    if question["notes"]:
        print(question["notes"])
        return
    print("No notes set.")


def cmd_youtube(state, args):
    question = resolve_question(state["questions"], args.query)
    if args.url:
        question["youtube_url"] = args.url.strip()
        print(f"Saved YouTube URL for {question['title']}")
        return
    if question.get("youtube_url"):
        print(question["youtube_url"])
        return
    print("No YouTube URL set.")


def cmd_next(state, args):
    unit = args.unit or args.step
    filtered = filter_questions(
        state["questions"],
        unit=unit,
        chapter=args.chapter or args.lesson,
        status="todo",
        query=args.query,
    )
    if not filtered:
        print("No pending questions match your filters.")
        return
    choice = random.choice(filtered) if args.random else filtered[0]
    unit_label = choice.get("unit") or choice.get("step") or "Unassigned"
    print(f"Next: {choice['title']} ({unit_label}) id={choice['id']}")
    if choice["url"]:
        print(f"URL: {choice['url']}")


def cmd_sync(state, args):
    print(f"Synced {len(state['questions'])} questions.")


def apply_import_urls(questions, lessons, overwrite=False):
    index = {}
    for question in questions:
        key = normalize_title(question["title"])
        index.setdefault(key, []).append(question)

    updated = 0
    skipped = 0
    missing = 0
    ambiguous = 0

    for lesson in lessons:
        url = lesson.get("leetcode_url") or lesson.get("url") or ""
        if not url:
            missing += 1
            continue
        key = normalize_title(lesson["title"])
        matches = index.get(key, [])
        if len(matches) == 1:
            question = matches[0]
            if (question.get("leetcode_url") or question.get("url")) and not overwrite:
                skipped += 1
                continue
            question["url"] = url
            question["leetcode_url"] = url
            updated += 1
        elif len(matches) == 0:
            missing += 1
        else:
            ambiguous += 1

    return updated, skipped, missing, ambiguous


def cmd_import_html(state, args):
    sheet_id = resolve_sheet_id(getattr(args, "sheet", None))
    if args.path == "-":
        html_text = sys.stdin.read()
    else:
        with open(args.path, "r", encoding="utf-8") as handle:
            html_text = handle.read()

    lessons = parse_html_lessons(html_text, args.unit, args.chapter)
    if not lessons:
        print("No lessons found in HTML.")
        return state

    merged = merge_lessons(load_lessons(sheet_id), lessons)
    save_lessons(merged, sheet_id)
    state = sync_state(state, sheet_id)

    label_unit = args.unit or "auto"
    print(f"Imported lessons: {len(lessons)} (unit: {label_unit})")
    if not load_lessons(sheet_id):
        updated, skipped, missing, ambiguous = apply_import_urls(
            state["questions"], lessons, overwrite=args.overwrite
        )
        print(f"Updated URLs: {updated}")
        print(f"Skipped existing URLs: {skipped}")
        print(f"Missing/No match: {missing}")
        if ambiguous:
            print(f"Ambiguous matches: {ambiguous}")
    else:
        print("Using ref_file lessons as the source of truth.")
    return state


def build_parser():
    parser = argparse.ArgumentParser(
        description="Track Striver A2Z LeetCode questions from this repository."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    def add_sheet_arg(target):
        target.add_argument("--sheet", help="Sheet id (striver or algomaster)")

    list_cmd = sub.add_parser("list", help="List questions")
    add_sheet_arg(list_cmd)
    list_cmd.add_argument("--unit", help="Filter by unit name")
    list_cmd.add_argument("--chapter", help="Filter by chapter name")
    list_cmd.add_argument("--lesson", help="(Deprecated) Filter by chapter name")
    list_cmd.add_argument("--step", help="(Deprecated) Filter by step name")
    list_cmd.add_argument("--status", choices=["done", "todo", "all"], default="all")
    list_cmd.add_argument("--query", help="Search by title or id")
    list_cmd.add_argument("--ids", action="store_true", help="Show ids")
    list_cmd.add_argument("--urls", action="store_true", help="Show urls")

    stats_cmd = sub.add_parser("stats", help="Show progress stats")
    add_sheet_arg(stats_cmd)

    show_cmd = sub.add_parser("show", help="Show details for one question")
    add_sheet_arg(show_cmd)
    show_cmd.add_argument("query", help="Index, id, or title substring")

    done_cmd = sub.add_parser("done", help="Mark a question as done")
    add_sheet_arg(done_cmd)
    done_cmd.add_argument("query", help="Index, id, or title substring")

    todo_cmd = sub.add_parser("todo", help="Mark a question as todo")
    add_sheet_arg(todo_cmd)
    todo_cmd.add_argument("query", help="Index, id, or title substring")

    toggle_cmd = sub.add_parser("toggle", help="Toggle done/todo")
    add_sheet_arg(toggle_cmd)
    toggle_cmd.add_argument("query", help="Index, id, or title substring")

    url_cmd = sub.add_parser("url", help="Show or set a LeetCode URL")
    add_sheet_arg(url_cmd)
    url_cmd.add_argument("query", help="Index, id, or title substring")
    url_cmd.add_argument("url", nargs="?", help="LeetCode URL")

    youtube_cmd = sub.add_parser("youtube", help="Show or set a YouTube solution URL")
    add_sheet_arg(youtube_cmd)
    youtube_cmd.add_argument("query", help="Index, id, or title substring")
    youtube_cmd.add_argument("url", nargs="?", help="YouTube URL")

    note_cmd = sub.add_parser("note", help="Show or set a note")
    add_sheet_arg(note_cmd)
    note_cmd.add_argument("query", help="Index, id, or title substring")
    note_cmd.add_argument("note", nargs="?", help="Note text")

    next_cmd = sub.add_parser("next", help="Suggest the next question")
    add_sheet_arg(next_cmd)
    next_cmd.add_argument("--unit", help="Filter by unit name")
    next_cmd.add_argument("--chapter", help="Filter by chapter name")
    next_cmd.add_argument("--lesson", help="(Deprecated) Filter by chapter name")
    next_cmd.add_argument("--step", help="(Deprecated) Filter by step name")
    next_cmd.add_argument("--query", help="Search by title or id")
    next_cmd.add_argument("--random", action="store_true", help="Pick a random question")

    sync_cmd = sub.add_parser("sync", help="Sync questions with filesystem")
    add_sheet_arg(sync_cmd)
    import_cmd = sub.add_parser("import-html", help="Import lessons and URLs from sheet HTML")
    add_sheet_arg(import_cmd)
    import_cmd.add_argument("path", help="HTML file path or '-' for stdin")
    import_cmd.add_argument("--unit", help="Default unit name when HTML has no headings")
    import_cmd.add_argument(
        "--chapter",
        help="Default chapter name when HTML has no headings",
    )
    import_cmd.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing URLs when matches are found",
    )

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    sheet_id = resolve_sheet_id(getattr(args, "sheet", None))
    state = load_state(sheet_id)
    state = sync_state(state, sheet_id)

    try:
        if args.command == "list":
            cmd_list(state, args)
        elif args.command == "stats":
            cmd_stats(state, args)
        elif args.command == "show":
            cmd_show(state, args)
        elif args.command == "done":
            cmd_done(state, args, True)
        elif args.command == "todo":
            cmd_done(state, args, False)
        elif args.command == "toggle":
            cmd_toggle(state, args)
        elif args.command == "url":
            cmd_url(state, args)
        elif args.command == "youtube":
            cmd_youtube(state, args)
        elif args.command == "note":
            cmd_note(state, args)
        elif args.command == "next":
            cmd_next(state, args)
        elif args.command == "sync":
            cmd_sync(state, args)
        elif args.command == "import-html":
            state = cmd_import_html(state, args)
        else:
            parser.print_help()
            return 1
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    finally:
        save_state(state, sheet_id)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
