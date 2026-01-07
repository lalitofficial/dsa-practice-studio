#!/usr/bin/env python3
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from tracker import (
    compute_stats,
    filter_questions,
    find_question_by_id,
    load_and_sync_state,
    load_unit_status,
    now_iso,
    save_state,
    set_unit_status,
    resolve_sheet_id,
)

BASE_DIR = Path(__file__).resolve().parent
DASHBOARD_DIR = BASE_DIR / "dashboard"

app = Flask(__name__, static_folder="dashboard", static_url_path="/static")


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


def run_server(host="127.0.0.1", port=8000):
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    host = os.environ.get("STRIVER_HOST", "127.0.0.1")
    port = int(os.environ.get("STRIVER_PORT", "8000"))
    run_server(host=host, port=port)
