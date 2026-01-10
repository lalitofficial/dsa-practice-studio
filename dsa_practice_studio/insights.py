from datetime import datetime, timedelta, timezone

from dsa_practice_studio.service import compute_stats, load_and_sync_state
from dsa_practice_studio.storage import ensure_sheet_registry


def parse_timestamp(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def summarize_questions(questions):
    summary = {
        "notes": 0,
        "starred": 0,
        "starred_todo": 0,
        "missing_difficulty": 0,
        "missing_leetcode": 0,
        "missing_youtube": 0,
        "missing_resource": 0,
        "hard_total": 0,
        "hard_todo": 0,
    }
    for question in questions:
        if str(question.get("notes") or "").strip():
            summary["notes"] += 1
        starred = bool(question.get("starred"))
        done = bool(question.get("done"))
        if starred:
            summary["starred"] += 1
            if not done:
                summary["starred_todo"] += 1

        difficulty = str(question.get("difficulty") or "").strip().lower()
        if not difficulty or difficulty == "unknown":
            summary["missing_difficulty"] += 1
        if "hard" in difficulty:
            summary["hard_total"] += 1
            if not done:
                summary["hard_todo"] += 1

        if not (question.get("leetcode_url") or question.get("url")):
            summary["missing_leetcode"] += 1
        if not question.get("youtube_url"):
            summary["missing_youtube"] += 1
        if not question.get("resource_url"):
            summary["missing_resource"] += 1
    return summary


def build_activity_series(questions, days=7):
    today = datetime.now(timezone.utc).date()
    dates = [today - timedelta(days=offset) for offset in range(days - 1, -1, -1)]
    counts = {date: 0 for date in dates}
    last_seen = None
    for question in questions:
        if not question.get("done"):
            continue
        stamped = parse_timestamp(question.get("last_done_at"))
        if not stamped:
            continue
        if last_seen is None or stamped > last_seen:
            last_seen = stamped
        stamp_date = stamped.astimezone(timezone.utc).date()
        if stamp_date in counts:
            counts[stamp_date] += 1
    series = [{"date": date.isoformat(), "count": counts[date]} for date in dates]
    active_days = sum(1 for date in dates if counts[date] > 0)
    total_done = sum(counts.values())
    last_done_at = ""
    if last_seen:
        last_done_at = last_seen.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return series, active_days, total_done, last_done_at


def build_heatmap_series(questions, days=84):
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days - 1)
    dates = [start + timedelta(days=offset) for offset in range(days)]
    counts = {date: 0 for date in dates}
    for question in questions:
        if not question.get("done"):
            continue
        stamped = parse_timestamp(question.get("last_done_at"))
        if not stamped:
            continue
        stamp_date = stamped.astimezone(timezone.utc).date()
        if stamp_date in counts:
            counts[stamp_date] += 1
    series = [{"date": date.isoformat(), "count": counts[date]} for date in dates]
    max_count = max(counts.values(), default=0)
    return series, max_count


def build_admin_insights(heatmap_sheet_id=None):
    if heatmap_sheet_id:
        heatmap_sheet_id = heatmap_sheet_id.strip()
    entries = ensure_sheet_registry()
    sheets = []
    all_questions = []
    heatmap_questions = []
    heatmap_label = "All sheets"
    unit_pool = []
    for entry in entries:
        sheet_id = entry.get("id")
        label = entry.get("label") or sheet_id
        if not sheet_id:
            continue
        state = load_and_sync_state(sheet_id)
        questions = state.get("questions", [])
        all_questions.extend(questions)
        if heatmap_sheet_id and sheet_id == heatmap_sheet_id:
            heatmap_questions.extend(questions)
            heatmap_label = label
        stats = compute_stats(questions)
        meta = summarize_questions(questions)
        _, active_days, recent_done, last_done_at = build_activity_series(questions)

        unit_stats = []
        for unit in stats.get("by_unit", []):
            unit_name = unit.get("unit") or "Unassigned"
            todo = unit.get("total", 0) - unit.get("done", 0)
            unit_stats.append({**unit, "unit": unit_name, "todo": todo})
            unit_pool.append(
                {
                    "sheet_id": sheet_id,
                    "sheet_label": label,
                    "unit": unit_name,
                    "done": unit.get("done", 0),
                    "total": unit.get("total", 0),
                    "percent": unit.get("percent", 0),
                    "todo": todo,
                }
            )

        focus_units = sorted(
            unit_stats,
            key=lambda item: (item.get("percent", 0), -item.get("total", 0)),
        )[:3]

        sheets.append(
            {
                "id": sheet_id,
                "label": label,
                "source": entry.get("source", "custom"),
                "total": stats.get("total", 0),
                "done": stats.get("done", 0),
                "todo": stats.get("todo", 0),
                "percent": stats.get("percent", 0),
                "notes": meta.get("notes", 0),
                "starred": meta.get("starred", 0),
                "missing_difficulty": meta.get("missing_difficulty", 0),
                "missing_leetcode": meta.get("missing_leetcode", 0),
                "missing_youtube": meta.get("missing_youtube", 0),
                "missing_resource": meta.get("missing_resource", 0),
                "last_done_at": last_done_at,
                "recent_done": recent_done,
                "active_days": active_days,
                "focus_units": focus_units,
            }
        )

    summary_stats = compute_stats(all_questions)
    summary_meta = summarize_questions(all_questions)
    activity, active_days, recent_done, last_done_at = build_activity_series(all_questions)
    if heatmap_sheet_id and not heatmap_questions:
        heatmap_questions = all_questions
        heatmap_label = "All sheets"
    heatmap, heatmap_max = build_heatmap_series(heatmap_questions or all_questions)
    weak_units = sorted(
        unit_pool,
        key=lambda item: (item.get("percent", 0), -item.get("total", 0), -item.get("todo", 0)),
    )[:8]

    summary = {
        "total": summary_stats.get("total", 0),
        "done": summary_stats.get("done", 0),
        "todo": summary_stats.get("todo", 0),
        "percent": summary_stats.get("percent", 0),
        "notes": summary_meta.get("notes", 0),
        "starred": summary_meta.get("starred", 0),
        "starred_todo": summary_meta.get("starred_todo", 0),
        "hard_total": summary_meta.get("hard_total", 0),
        "hard_todo": summary_meta.get("hard_todo", 0),
        "missing_difficulty": summary_meta.get("missing_difficulty", 0),
        "missing_leetcode": summary_meta.get("missing_leetcode", 0),
        "missing_youtube": summary_meta.get("missing_youtube", 0),
        "missing_resource": summary_meta.get("missing_resource", 0),
        "active_days": active_days,
        "recent_done": recent_done,
        "last_done_at": last_done_at,
    }

    return {
        "summary": summary,
        "activity": activity,
        "activity_heatmap": heatmap,
        "activity_max": heatmap_max,
        "heatmap_scope": heatmap_label,
        "weak_units": weak_units,
        "sheets": sheets,
    }
