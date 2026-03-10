import os
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path
from typing import Optional


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "fitness_coach.db"
DB_PATH = Path(os.getenv("FITNESS_DB_PATH", str(DEFAULT_DB_PATH))).expanduser()


def _get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with closing(_get_connection()) as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS weight_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                weight REAL NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def log_weight(user_id: str, weight: float) -> None:
    with closing(_get_connection()) as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO weight_logs (user_id, weight, created_at)
            VALUES (?, ?, ?)
            """,
            (user_id, weight, datetime.utcnow().isoformat(timespec="seconds")),
        )
        connection.commit()


def get_recent_weights(user_id: str, limit: int = 5) -> list[dict]:
    with closing(_get_connection()) as connection:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT weight, created_at
            FROM weight_logs
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (user_id, limit),
        )
        rows = cursor.fetchall()

    return [
        {"weight": row["weight"], "created_at": row["created_at"]}
        for row in rows
    ]


def get_progress_summary(user_id: str) -> Optional[dict]:
    history = get_recent_weights(user_id, limit=2)
    if not history:
        return None

    latest = history[0]
    previous = history[1] if len(history) > 1 else None
    delta = None
    if previous is not None:
        delta = round(latest["weight"] - previous["weight"], 2)

    return {
        "latest_weight": latest["weight"],
        "latest_logged_at": latest["created_at"],
        "previous_weight": previous["weight"] if previous else None,
        "change_from_previous": delta,
    }


init_db()
