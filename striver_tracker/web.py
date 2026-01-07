import csv
import io
import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from striver_tracker.db import load_unit_status, set_unit_status
from striver_tracker.grouping import apply_sheet_grouping
from striver_tracker.importers import parse_csv_text, parse_xlsx_lessons
from striver_tracker.service import (
        compute_stats,
        filter_questions,
        find_question_by_id,
        load_and_sync_state,
    )
from striver_tracker.storage import load_lessons, merge_lessons, resolve_sheet_id, save_lessons, save_state
from striver_tracker.utils import now_iso

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
