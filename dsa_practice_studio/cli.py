import argparse
import sys
from pathlib import Path

from dsa_practice_studio.grouping import apply_sheet_grouping
from dsa_practice_studio.importers import parse_csv_lessons, parse_xlsx_lessons
from dsa_practice_studio.parser import parse_html_lessons
from dsa_practice_studio.service import (
    apply_import_urls,
    compute_stats,
    filter_questions,
    pick_next,
    render_list,
    resolve_question,
    sync_state,
)
from dsa_practice_studio.storage import (
    load_lessons,
    load_state,
    merge_lessons,
    resolve_sheet_id,
    save_lessons,
    save_state,
)
from dsa_practice_studio.utils import now_iso


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


def cmd_stats(state, _args):
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
    choice = pick_next(
        state["questions"],
        unit=unit,
        chapter=args.chapter or args.lesson,
        query=args.query,
        random_pick=args.random,
    )
    if not choice:
        print("No pending questions match your filters.")
        return
    unit_label = choice.get("unit") or choice.get("step") or "Unassigned"
    print(f"Next: {choice['title']} ({unit_label}) id={choice['id']}")
    if choice["url"]:
        print(f"URL: {choice['url']}")


def cmd_sync(state, _args):
    print(f"Synced {len(state['questions'])} questions.")


def cmd_import_html(state, args):
    sheet_id = resolve_sheet_id(getattr(args, "sheet", None))
    if args.path == "-":
        html_text = sys.stdin.read()
    else:
        with open(args.path, "r", encoding="utf-8") as handle:
            html_text = handle.read()

    lessons = parse_html_lessons(html_text, args.unit, args.chapter)
    lessons, _ = apply_sheet_grouping(lessons, sheet_id)
    if not lessons:
        print("No lessons found in HTML.")
        return state

    existing = load_lessons(sheet_id)
    had_existing = bool(existing)
    merged = merge_lessons(existing, lessons)
    save_lessons(merged, sheet_id)
    state = sync_state(state, sheet_id)

    label_unit = args.unit or "auto"
    print(f"Imported lessons: {len(lessons)} (unit: {label_unit})")
    if not had_existing:
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


def cmd_import_table(state, args):
    sheet_id = resolve_sheet_id(getattr(args, "sheet", None))
    path = Path(args.path)
    suffix = path.suffix.lower()
    has_header = None
    if args.header:
        has_header = True
    elif args.no_header:
        has_header = False

    if suffix == ".csv":
        lessons = parse_csv_lessons(
            path,
            default_unit=args.unit,
            default_chapter=args.chapter,
            has_header=has_header,
            delimiter=args.delimiter,
        )
    elif suffix in {".xlsx", ".xlsm"}:
        lessons = parse_xlsx_lessons(
            path,
            default_unit=args.unit,
            default_chapter=args.chapter,
            has_header=has_header,
            sheet_name=args.sheet_name,
        )
    else:
        print("Unsupported file type. Use .csv or .xlsx")
        return state

    lessons, _ = apply_sheet_grouping(lessons, sheet_id)
    if not lessons:
        print("No lessons found in file.")
        return state

    existing = load_lessons(sheet_id)
    had_existing = bool(existing)
    merged = merge_lessons(existing, lessons)
    save_lessons(merged, sheet_id)
    state = sync_state(state, sheet_id)

    print(f"Imported lessons: {len(lessons)} (format: {suffix.lstrip('.')})")
    if had_existing:
        print("Merged with existing lessons.")
    else:
        print("Using imported lessons as the source of truth.")
    return state


def build_parser():
    parser = argparse.ArgumentParser(
        description="Track DSA sheet questions and progress locally."
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

    table_cmd = sub.add_parser("import-table", help="Import lessons from CSV/XLSX")
    add_sheet_arg(table_cmd)
    table_cmd.add_argument("path", help="CSV/XLSX file path")
    table_cmd.add_argument("--unit", help="Default unit name when column is blank")
    table_cmd.add_argument("--chapter", help="Default chapter name when column is blank")
    table_cmd.add_argument("--delimiter", default=",", help="CSV delimiter (default ',')")
    table_cmd.add_argument("--sheet-name", help="Excel worksheet name (defaults to first)")
    header_group = table_cmd.add_mutually_exclusive_group()
    header_group.add_argument("--header", action="store_true", help="First row is a header")
    header_group.add_argument(
        "--no-header", action="store_true", help="Do not treat first row as header"
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
        elif args.command == "import-table":
            state = cmd_import_table(state, args)
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
