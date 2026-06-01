import json
from pathlib import Path

from dsa_practice_studio.config import (
    DATA_DIR,
    DEFAULT_SHEET_ID,
    LESSONS_PATH,
    SHEETS,
    SHEETS_REGISTRY_PATH,
    STATE_PATH,
)
from dsa_practice_studio.grouping import apply_sheet_grouping
from dsa_practice_studio.importers import parse_csv_lessons
from dsa_practice_studio.utils import now_iso, slugify


def resolve_sheet_id(sheet_id):
    if not sheet_id:
        return DEFAULT_SHEET_ID
    if sheet_id in SHEETS:
        return sheet_id
    return slugify(sheet_id)


def _registry_default_label(sheet_id, meta):
    if sheet_id == "striver":
        return "Sample: Striver"
    if sheet_id == "algomaster":
        return "Sample: AlgoMaster"
    name = meta.get("name") if isinstance(meta, dict) else None
    if name:
        return f"Sample: {name}"
    return f"Sample: {sheet_id}"


def _discover_sheet_ids():
    ids = set(SHEETS.keys())
    if not DATA_DIR.exists():
        return ids
    for path in DATA_DIR.glob("state_*.json"):
        ids.add(path.stem.replace("state_", ""))
    for path in DATA_DIR.glob("lessons_*.json"):
        ids.add(path.stem.replace("lessons_", ""))
    return ids


def _sort_sheet_entries(entries):
    default_order = list(SHEETS.keys())
    order_index = {sheet_id: idx for idx, sheet_id in enumerate(default_order)}

    def sort_key(item):
        if item["id"] in order_index:
            return (0, order_index[item["id"]])
        return (1, item.get("label", item["id"]).lower())

    return sorted(entries, key=sort_key)


def load_sheet_registry():
    if SHEETS_REGISTRY_PATH.exists():
        with SHEETS_REGISTRY_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
            if isinstance(data, list):
                return data
    return []


def save_sheet_registry(entries):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with SHEETS_REGISTRY_PATH.open("w", encoding="utf-8") as handle:
        json.dump(_sort_sheet_entries(entries), handle, indent=2, sort_keys=False)


def ensure_sheet_registry():
    entries = load_sheet_registry()
    by_id = {entry.get("id"): entry for entry in entries if entry.get("id")}
    now = now_iso()

    for sheet_id in _discover_sheet_ids():
        if sheet_id in by_id:
            continue
        meta = SHEETS.get(sheet_id, {})
        by_id[sheet_id] = {
            "id": sheet_id,
            "label": _registry_default_label(sheet_id, meta)
            if sheet_id in SHEETS
            else sheet_id,
            "source": "sample" if sheet_id in SHEETS else "custom",
            "created_at": now,
            "updated_at": now,
        }

    entries = list(by_id.values())
    save_sheet_registry(entries)
    return _sort_sheet_entries(entries)


def _unique_sheet_id(base_id, existing_ids):
    candidate = base_id
    counter = 2
    while candidate in existing_ids:
        candidate = f"{base_id}-{counter}"
        counter += 1
    return candidate


def create_sheet_entry(name):
    base = slugify(name)
    if not base:
        return None
    entries = ensure_sheet_registry()
    ids = {entry["id"] for entry in entries}
    sheet_id = _unique_sheet_id(base, ids)
    now = now_iso()
    entry = {
        "id": sheet_id,
        "label": name.strip() or sheet_id,
        "source": "custom",
        "created_at": now,
        "updated_at": now,
    }
    entries.append(entry)
    save_sheet_registry(entries)
    return entry


def ensure_sheet_entry(sheet_id, label=None):
    sheet_id = resolve_sheet_id(sheet_id)
    entries = ensure_sheet_registry()
    for entry in entries:
        if entry["id"] == sheet_id:
            if label and label.strip() and entry.get("label") != label.strip():
                entry["label"] = label.strip()
                entry["updated_at"] = now_iso()
                save_sheet_registry(entries)
            return entry
    now = now_iso()
    entry = {
        "id": sheet_id,
        "label": label.strip() if label else sheet_id,
        "source": "custom",
        "created_at": now,
        "updated_at": now,
    }
    entries.append(entry)
    save_sheet_registry(entries)
    return entry


def rename_sheet_entry(sheet_id, label):
    entries = ensure_sheet_registry()
    for entry in entries:
        if entry["id"] == sheet_id:
            entry["label"] = label.strip() or entry["label"]
            entry["updated_at"] = now_iso()
            save_sheet_registry(entries)
            return entry
    return None


def delete_sheet_entry(sheet_id):
    entries = ensure_sheet_registry()
    remaining = [entry for entry in entries if entry["id"] != sheet_id]
    if len(remaining) == len(entries):
        return False
    save_sheet_registry(remaining)
    return True


def duplicate_sheet_entry(source_sheet_id, new_label):
    source_sheet_id = resolve_sheet_id(source_sheet_id)
    entries = ensure_sheet_registry()
    ids = {entry["id"] for entry in entries}
    base = slugify(new_label or f"{source_sheet_id}-copy")
    if not base:
        return None
    new_id = _unique_sheet_id(base, ids)
    now = now_iso()
    entry = {
        "id": new_id,
        "label": new_label.strip() if new_label else new_id,
        "source": "custom",
        "created_at": now,
        "updated_at": now,
    }
    entries.append(entry)
    save_sheet_registry(entries)
    return entry


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


def get_sheet_sample_path(sheet_id):
    sheet_id = resolve_sheet_id(sheet_id)
    sheet = SHEETS.get(sheet_id, {})
    sample_path = sheet.get("sample_csv")
    if sample_path and Path(sample_path).exists():
        return Path(sample_path)
    return None


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
        grouped, changed = apply_sheet_grouping(cleaned, sheet_id)
        if changed:
            save_lessons(grouped, sheet_id)
        return grouped

    sample_path = get_sheet_sample_path(sheet_id)
    if sample_path:
        lessons = parse_csv_lessons(sample_path)
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
