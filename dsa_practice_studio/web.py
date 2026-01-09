import csv
import io
import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from dsa_practice_studio.db import (
    delete_unit_status,
    load_app_state,
    load_unit_status,
    save_app_state,
    set_unit_status,
)
from dsa_practice_studio.grouping import apply_sheet_grouping
from dsa_practice_studio.importers import parse_csv_text, parse_xlsx_lessons
from dsa_practice_studio.service import (
    compute_stats,
    filter_questions,
    find_question_by_id,
    load_and_sync_state,
)
from dsa_practice_studio.storage import (
    create_sheet_entry,
    delete_sheet_entry,
    duplicate_sheet_entry,
    ensure_sheet_entry,
    ensure_sheet_registry,
    get_lessons_path,
    get_state_path,
    load_lessons,
    load_state,
    merge_lessons,
    regenerate_sheet_from_html,
    rename_sheet_entry,
    resolve_sheet_id,
    save_lessons,
    save_state,
)
from dsa_practice_studio.utils import now_iso

BASE_DIR = Path(__file__).resolve().parents[1]
DASHBOARD_DIR = BASE_DIR / "dashboard"


def create_app():
    app = Flask(__name__, static_folder=str(DASHBOARD_DIR), static_url_path="/static")

    def read_state(sheet_id=None):
        return load_and_sync_state(sheet_id)

    def get_sheet_id():
        return resolve_sheet_id(request.args.get("sheet"))

    @app.route("/")
    def index():
        return send_from_directory(DASHBOARD_DIR, "index.html")

    @app.route("/admin")
    def admin():
        return send_from_directory(DASHBOARD_DIR, "admin.html")

    @app.get("/api/sheets")
    def api_sheets():
        entries = ensure_sheet_registry()
        sheets = []
        for entry in entries:
            sheet_id = entry["id"]
            state = load_and_sync_state(sheet_id)
            stats = compute_stats(state["questions"])
            sheets.append(
                {
                    **entry,
                    "stats": {
                        "total": stats.get("total", 0),
                        "done": stats.get("done", 0),
                        "percent": stats.get("percent", 0),
                        "difficulty": stats.get("difficulty", {}),
                    },
                }
            )
        return jsonify({"sheets": sheets})

    @app.get("/api/ui-settings")
    def api_get_ui_settings():
        settings = load_app_state("ui_settings", {})
        return jsonify({"settings": settings})

    @app.post("/api/ui-settings")
    def api_set_ui_settings():
        payload = request.get_json(silent=True) or {}
        if "settings" not in payload:
            return jsonify({"error": "Invalid payload"}), 400
        save_app_state("ui_settings", payload["settings"])
        return jsonify({"settings": payload["settings"]})

    @app.get("/api/view-state")
    def api_get_view_state():
        state = load_app_state("view_state", {})
        return jsonify({"state": state})

    @app.post("/api/view-state")
    def api_set_view_state():
        payload = request.get_json(silent=True) or {}
        if "state" not in payload:
            return jsonify({"error": "Invalid payload"}), 400
        save_app_state("view_state", payload["state"])
        return jsonify({"state": payload["state"]})

    @app.get("/api/active-sheet")
    def api_get_active_sheet():
        sheet = load_app_state("active_sheet", "")
        return jsonify({"sheet": sheet})

    @app.post("/api/active-sheet")
    def api_set_active_sheet():
        payload = request.get_json(silent=True) or {}
        if "sheet" not in payload:
            return jsonify({"error": "Invalid payload"}), 400
        sheet = resolve_sheet_id(payload.get("sheet"))
        save_app_state("active_sheet", sheet)
        return jsonify({"sheet": sheet})

    @app.get("/api/admin-state")
    def api_get_admin_state():
        panel = load_app_state("admin_panel", "")
        return jsonify({"panel": panel})

    @app.post("/api/admin-state")
    def api_set_admin_state():
        payload = request.get_json(silent=True) or {}
        if "panel" not in payload:
            return jsonify({"error": "Invalid payload"}), 400
        panel = str(payload.get("panel") or "").strip()
        save_app_state("admin_panel", panel)
        return jsonify({"panel": panel})

    @app.post("/api/sheets")
    def api_create_sheet():
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        if not name:
            return jsonify({"error": "Missing sheet name"}), 400
        entry = create_sheet_entry(name)
        if not entry:
            return jsonify({"error": "Invalid sheet name"}), 400
        return jsonify(entry)

    @app.patch("/api/sheets/<path:sheet_id>")
    def api_rename_sheet(sheet_id):
        sheet_id = resolve_sheet_id(sheet_id)
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        if not name:
            return jsonify({"error": "Missing sheet name"}), 400
        entry = rename_sheet_entry(sheet_id, name)
        if not entry:
            return jsonify({"error": "Sheet not found"}), 404
        return jsonify(entry)

    @app.delete("/api/sheets/<path:sheet_id>")
    def api_delete_sheet(sheet_id):
        sheet_id = resolve_sheet_id(sheet_id)
        entries = ensure_sheet_registry()
        entry = next((item for item in entries if item.get("id") == sheet_id), None)
        if entry and entry.get("source") == "sample":
            return jsonify({"error": "Sample sheets cannot be deleted"}), 400
        deleted = delete_sheet_entry(sheet_id)
        if not deleted:
            return jsonify({"error": "Sheet not found"}), 404
        state_path = get_state_path(sheet_id)
        lessons_path = get_lessons_path(sheet_id)
        state_path.unlink(missing_ok=True)
        lessons_path.unlink(missing_ok=True)
        delete_unit_status(sheet_id)
        return jsonify({"deleted": sheet_id})

    @app.post("/api/sheets/<path:sheet_id>/duplicate")
    def api_duplicate_sheet(sheet_id):
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        if not name:
            return jsonify({"error": "Missing sheet name"}), 400
        entry = duplicate_sheet_entry(sheet_id, name)
        if not entry:
            return jsonify({"error": "Could not duplicate sheet"}), 400
        source_lessons = load_lessons(sheet_id)
        source_state = load_state(sheet_id)
        if source_lessons:
            save_lessons(source_lessons, entry["id"])
        if source_state.get("questions"):
            save_state(source_state, entry["id"])
        return jsonify(entry)

    @app.post("/api/sheets/<path:sheet_id>/reset")
    def api_reset_sheet(sheet_id):
        sheet_id = resolve_sheet_id(sheet_id)
        payload = request.get_json(silent=True) or {}
        clear_done = payload.get("clear_done", True)
        clear_notes = payload.get("clear_notes", False)
        state = load_and_sync_state(sheet_id)
        for question in state["questions"]:
            if clear_done:
                question["done"] = False
                question["last_done_at"] = ""
            if clear_notes:
                question["notes"] = ""
        if clear_done:
            delete_unit_status(sheet_id)
        save_state(state, sheet_id)
        return jsonify({"sheet": sheet_id, "cleared": {"done": clear_done, "notes": clear_notes}})

    @app.post("/api/sheets/<path:sheet_id>/regenerate")
    def api_regenerate_sheet(sheet_id):
        sheet_id = resolve_sheet_id(sheet_id)
        refreshed = regenerate_sheet_from_html(sheet_id)
        if refreshed is None:
            return jsonify({"error": "No HTML source for this sheet"}), 400
        state = load_and_sync_state(sheet_id)
        save_state(state, sheet_id)
        return jsonify({"sheet": sheet_id, "count": len(refreshed)})

    @app.post("/api/refactor/rename")
    def api_refactor_rename():
        payload = request.get_json(silent=True) or {}
        sheet_id = resolve_sheet_id(payload.get("sheet"))
        scope = str(payload.get("scope", "")).strip().lower()
        from_name = str(payload.get("from", "")).strip()
        to_name = str(payload.get("to", "")).strip()
        if scope not in {"unit", "chapter"}:
            return jsonify({"error": "Invalid scope"}), 400
        if not from_name or not to_name:
            return jsonify({"error": "Missing rename fields"}), 400
        lessons = load_lessons(sheet_id)
        for lesson in lessons:
            if scope == "unit" and lesson.get("unit") == from_name:
                lesson["unit"] = to_name
            if scope == "chapter" and lesson.get("chapter") == from_name:
                lesson["chapter"] = to_name
        save_lessons(lessons, sheet_id)
        state = load_and_sync_state(sheet_id)
        for question in state["questions"]:
            if scope == "unit" and question.get("unit") == from_name:
                question["unit"] = to_name
            if scope == "chapter" and question.get("chapter") == from_name:
                question["chapter"] = to_name
        save_state(state, sheet_id)
        return jsonify({"sheet": sheet_id, "scope": scope, "from": from_name, "to": to_name})

    @app.post("/api/refactor/difficulty")
    def api_refactor_difficulty():
        payload = request.get_json(silent=True) or {}
        sheet_id = resolve_sheet_id(payload.get("sheet"))
        unit = str(payload.get("unit", "")).strip()
        chapter = str(payload.get("chapter", "")).strip()
        difficulty = str(payload.get("difficulty", "")).strip()
        only_missing = bool(payload.get("only_missing", False))
        if not difficulty:
            return jsonify({"error": "Missing difficulty"}), 400

        lessons = load_lessons(sheet_id)
        for lesson in lessons:
            if unit and lesson.get("unit") != unit:
                continue
            if chapter and lesson.get("chapter") != chapter:
                continue
            if only_missing and lesson.get("difficulty"):
                continue
            lesson["difficulty"] = difficulty
        save_lessons(lessons, sheet_id)

        state = load_and_sync_state(sheet_id)
        for question in state["questions"]:
            if unit and question.get("unit") != unit:
                continue
            if chapter and question.get("chapter") != chapter:
                continue
            if only_missing and question.get("difficulty"):
                continue
            question["difficulty"] = difficulty
        save_state(state, sheet_id)
        return jsonify(
            {
                "sheet": sheet_id,
                "difficulty": difficulty,
                "unit": unit,
                "chapter": chapter,
                "only_missing": only_missing,
            }
        )

    @app.get("/api/questions")
    def api_questions():
        sheet_id = get_sheet_id()
        unit = request.args.get("unit") or request.args.get("step")
        chapter = request.args.get("chapter") or request.args.get("lesson")
        status = request.args.get("status")
        if status == "all":
            status = None
        query = request.args.get("query")

        state = read_state(sheet_id)
        questions = filter_questions(
            state["questions"], unit=unit, chapter=chapter, status=status, query=query
        )
        return jsonify(
            {
                "questions": questions,
                "stats": compute_stats(state["questions"]),
                "unit_status": load_unit_status(sheet_id),
                "updated_at": state.get("updated_at", ""),
            }
        )

    @app.post("/api/sync")
    def api_sync():
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        save_state(state, sheet_id)
        return jsonify(
            {
                "stats": compute_stats(state["questions"]),
                "unit_status": load_unit_status(sheet_id),
                "updated_at": state.get("updated_at", ""),
            }
        )

    @app.post("/api/questions/<path:qid>/done")
    def api_done(qid):
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        question = find_question_by_id(state["questions"], qid)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        payload = request.get_json(silent=True) or {}
        if "done" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        question["done"] = bool(payload["done"])
        if question["done"]:
            question["last_done_at"] = now_iso()
        save_state(state, sheet_id)
        return jsonify(
            {
                "question": question,
                "stats": compute_stats(state["questions"]),
            }
        )

    @app.post("/api/questions/<path:qid>/url")
    def api_url(qid):
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        question = find_question_by_id(state["questions"], qid)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        payload = request.get_json(silent=True) or {}
        if "url" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        url = str(payload["url"]).strip()
        question["url"] = url
        question["leetcode_url"] = url
        save_state(state, sheet_id)
        return jsonify(
            {
                "question": question,
                "stats": compute_stats(state["questions"]),
            }
        )

    @app.post("/api/questions/<path:qid>/youtube")
    def api_youtube(qid):
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        question = find_question_by_id(state["questions"], qid)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        payload = request.get_json(silent=True) or {}
        if "url" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        question["youtube_url"] = str(payload["url"]).strip()
        save_state(state, sheet_id)
        return jsonify(
            {
                "question": question,
                "stats": compute_stats(state["questions"]),
            }
        )

    @app.post("/api/questions/<path:qid>/note")
    def api_note(qid):
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        question = find_question_by_id(state["questions"], qid)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        payload = request.get_json(silent=True) or {}
        if "note" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        question["notes"] = str(payload["note"]).strip()
        save_state(state, sheet_id)
        return jsonify(
            {
                "question": question,
                "stats": compute_stats(state["questions"]),
            }
        )

    @app.post("/api/questions/<path:qid>/star")
    def api_star(qid):
        sheet_id = get_sheet_id()
        state = read_state(sheet_id)
        question = find_question_by_id(state["questions"], qid)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        payload = request.get_json(silent=True) or {}
        if "starred" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        question["starred"] = bool(payload["starred"])
        save_state(state, sheet_id)
        return jsonify(
            {
                "question": question,
                "stats": compute_stats(state["questions"]),
            }
        )

    @app.post("/api/units/<path:unit>/done")
    def api_unit_done(unit):
        sheet_id = get_sheet_id()
        payload = request.get_json(silent=True) or {}
        if "done" not in payload:
            return jsonify({"error": "Invalid payload"}), 400

        set_unit_status(sheet_id, unit, bool(payload["done"]))
        return jsonify({"unit": unit, "done": bool(payload["done"])})

    @app.post("/api/import-table")
    def api_import_table():
        sheet_id = get_sheet_id()
        ensure_sheet_entry(sheet_id)
        if "file" not in request.files:
            return jsonify({"error": "Missing file"}), 400
        file = request.files["file"]
        filename = file.filename or ""
        suffix = Path(filename).suffix.lower()
        delimiter = request.form.get("delimiter", ",") or ","
        header_mode = request.form.get("header", "auto")
        has_header = None
        if header_mode == "true":
            has_header = True
        elif header_mode == "false":
            has_header = False
        if delimiter in {"\\t", "tab"}:
            delimiter = "\t"

        if suffix == ".csv":
            text = file.stream.read().decode("utf-8", errors="ignore")
            lessons = parse_csv_text(
                text,
                default_unit=request.form.get("unit"),
                default_chapter=request.form.get("chapter"),
                has_header=has_header,
                delimiter=delimiter,
            )
        elif suffix in {".xlsx", ".xlsm"}:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file.stream.read())
                tmp_path = tmp.name
            try:
                lessons = parse_xlsx_lessons(
                    tmp_path,
                    default_unit=request.form.get("unit"),
                    default_chapter=request.form.get("chapter"),
                    has_header=has_header,
                    sheet_name=request.form.get("sheet_name"),
                )
            finally:
                Path(tmp_path).unlink(missing_ok=True)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        lessons, _ = apply_sheet_grouping(lessons, sheet_id)
        if not lessons:
            return jsonify({"error": "No lessons found"}), 400

        merged = merge_lessons(load_lessons(sheet_id), lessons)
        save_lessons(merged, sheet_id)
        state = load_and_sync_state(sheet_id)
        save_state(state, sheet_id)
        return jsonify(
            {
                "stats": compute_stats(state["questions"]),
                "unit_status": load_unit_status(sheet_id),
                "updated_at": state.get("updated_at", ""),
            }
        )

    @app.get("/api/export")
    def api_export():
        sheet_id = get_sheet_id()
        fmt = request.args.get("format", "csv").lower()
        state = read_state(sheet_id)
        questions = state["questions"]
        if fmt == "json":
            return jsonify({"sheet": sheet_id, "questions": questions})

        header = [
            "Unit",
            "Chapter",
            "Question",
            "LeetCode",
            "YT",
            "Default Note",
            "Difficulty",
            "Done",
            "Starred",
        ]
        output = []
        output.append(header)
        for q in questions:
            output.append(
                [
                    q.get("unit") or q.get("step") or "",
                    q.get("chapter") or q.get("lesson") or q.get("group") or "",
                    q.get("title") or "",
                    q.get("leetcode_url") or q.get("url") or "",
                    q.get("youtube_url") or "",
                    q.get("notes") or "",
                    q.get("difficulty") or "",
                    "yes" if q.get("done") else "no",
                    "yes" if q.get("starred") else "no",
                ]
            )
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerows(output)
        csv_text = csv_buffer.getvalue()
        response = app.response_class(csv_text, mimetype="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={sheet_id}_export.csv"
        return response

    return app


def run_server(host="127.0.0.1", port=8000):
    app = create_app()
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    host = os.environ.get("STRIVER_HOST", "127.0.0.1")
    port = int(os.environ.get("STRIVER_PORT", "8000"))
    run_server(host=host, port=port)
