import sqlite3

from dsa_practice_studio.config import DATA_DIR, DEFAULT_SHEET_ID, UNIT_DB_PATH
from dsa_practice_studio.storage import resolve_sheet_id
from dsa_practice_studio.utils import now_iso


def _open_unit_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(UNIT_DB_PATH)
    columns = [row[1] for row in conn.execute("PRAGMA table_info(unit_status)").fetchall()]
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
