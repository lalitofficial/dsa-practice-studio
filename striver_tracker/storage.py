import json
from pathlib import Path

from striver_tracker.config import (
    BASE_DIR,
    DATA_DIR,
    DEFAULT_SHEET_ID,
    LESSONS_PATH,
    SHEETS,
    STATE_PATH,
)
from striver_tracker.grouping import apply_sheet_grouping
from striver_tracker.parser import parse_html_lessons
from striver_tracker.utils import now_iso, slugify


def resolve_sheet_id(sheet_id):
    if not sheet_id:
        return DEFAULT_SHEET_ID
    if sheet_id in SHEETS:
        return sheet_id
    return slugify(sheet_id)


def get_state_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    if sheet_id == DEFAULT_SHEET_ID:
        return STATE_PATH
    return DATA_DIR / f"state_{sheet_id}.json"


def get_lessons_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    if sheet_id == DEFAULT_SHEET_ID:
        return LESSONS_PATH
    return DATA_DIR / f"lessons_{sheet_id}.json"


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


def _lesson_sources(lessons):
    return {lesson.get("source") for lesson in lessons if isinstance(lesson, dict)}


def _should_refresh_from_html(sheet_id, lessons, lessons_path):
    if sheet_id not in SHEETS:
        return False
    html_path = get_sheet_html_path(sheet_id)
    if not html_path or not Path(html_path).exists():
        return False
    if not lessons:
        return True
    sources = _lesson_sources(lessons)
    if sources == {"import"}:
        return False
    if None in sources:
        return True
    try:
        return Path(html_path).stat().st_mtime > lessons_path.stat().st_mtime
    except FileNotFoundError:
        return True


def _refresh_from_html(sheet_id):
    html_path = get_sheet_html_path(sheet_id)
    if not html_path or not Path(html_path).exists():
        return None
    html_text = Path(html_path).read_text(encoding="utf-8")
    parsed = parse_html_lessons(html_text, None, None)
    if not parsed:
        return None
    grouped, _ = apply_sheet_grouping(parsed, sheet_id)
    save_lessons(grouped, sheet_id)
    return grouped


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
        if _should_refresh_from_html(sheet_id, cleaned, path):
            refreshed = _refresh_from_html(sheet_id)
            if refreshed is not None:
                return refreshed
        if _needs_reparse(sheet_id, cleaned):
            html_path = get_sheet_html_path(sheet_id)
            if html_path and Path(html_path).exists():
                html_text = Path(html_path).read_text(encoding="utf-8")
                parsed = parse_html_lessons(html_text, None, None)
                if parsed:
                    grouped, _ = apply_sheet_grouping(parsed, sheet_id)
                    save_lessons(grouped, sheet_id)
                    return grouped
        grouped, changed = apply_sheet_grouping(cleaned, sheet_id)
        if changed:
            save_lessons(grouped, sheet_id)
        return grouped

    html_path = get_sheet_html_path(sheet_id)
    if html_path and Path(html_path).exists():
        html_text = Path(html_path).read_text(encoding="utf-8")
        lessons = parse_html_lessons(html_text, None, None)
        if lessons:
            grouped, _ = apply_sheet_grouping(lessons, sheet_id)
            save_lessons(grouped, sheet_id)
            return grouped
    return []


def save_lessons(lessons, sheet_id=DEFAULT_SHEET_ID):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = get_lessons_path(sheet_id)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(lessons, handle, indent=2, sort_keys=False)


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
