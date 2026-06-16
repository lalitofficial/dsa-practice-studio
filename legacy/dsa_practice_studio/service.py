import random
import sys

from dsa_practice_studio.config import BASE_DIR, DEFAULT_SHEET_ID, QUESTION_EXTS, SHEET_DIR
from dsa_practice_studio.storage import load_lessons, load_state, save_state
from dsa_practice_studio.utils import normalize_title, pretty_title, slugify


def scan_questions(sheet_id=DEFAULT_SHEET_ID):
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
                "notes": lesson.get("notes", ""),
                "starred": bool(lesson.get("starred", False)),
                "order": lesson.get("order", 0),
            }
        )
    return items


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
        prev_notes = prev.get("notes", "")
        merged.append(
            {
                **item,
                "done": bool(prev.get("done", False)),
                "url": leetcode_url,
                "leetcode_url": leetcode_url,
                "youtube_url": prev.get("youtube_url", item.get("youtube_url", "")),
                "resource_url": item.get("resource_url", prev.get("resource_url", "")),
                "difficulty": item.get("difficulty", prev.get("difficulty", "")),
                "notes": prev_notes if prev_notes else item.get("notes", ""),
                "last_done_at": prev.get("last_done_at", ""),
                "starred": bool(prev.get("starred", item.get("starred", False))),
            }
        )
    state["questions"] = merged
    return state


def load_and_sync_state(sheet_id=DEFAULT_SHEET_ID):
    state = load_state(sheet_id)
    return sync_state(state, sheet_id)


def compute_stats(questions):
    total = len(questions)
    done = sum(1 for q in questions if q["done"])
    by_unit = {}
    difficulty_counts = {"Easy": 0, "Medium": 0, "Hard": 0, "Unknown": 0}
    for q in questions:
        unit = q.get("unit") or q.get("step") or "Unassigned"
        bucket = by_unit.setdefault(unit, {"done": 0, "total": 0})
        bucket["total"] += 1
        if q["done"]:
            bucket["done"] += 1
        diff_value = str(q.get("difficulty") or "").strip().lower()
        if "easy" in diff_value:
            difficulty_counts["Easy"] += 1
        elif "medium" in diff_value:
            difficulty_counts["Medium"] += 1
        elif "hard" in diff_value:
            difficulty_counts["Hard"] += 1
        else:
            difficulty_counts["Unknown"] += 1
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
        "difficulty": difficulty_counts,
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
            if chapter_lower
            in (q.get("chapter") or q.get("lesson") or q.get("group") or "").lower()
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


def pick_next(questions, unit=None, chapter=None, query=None, random_pick=False):
    filtered = filter_questions(
        questions, unit=unit, chapter=chapter, status="todo", query=query
    )
    if not filtered:
        return None
    return random.choice(filtered) if random_pick else filtered[0]


def sync_and_save(sheet_id):
    state = load_state(sheet_id)
    state = sync_state(state, sheet_id)
    save_state(state, sheet_id)
    return state
