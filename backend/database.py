import json
import os
from contextlib import contextmanager
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

TASK_COLUMNS = (
    "id", "title", "description", "completed", "due_date",
    "priority", "project", "tags", "sort_order", "created_at", "user_id",
)
SELECT_TASKS = "SELECT * FROM tasks WHERE user_id = %s"


@contextmanager
def transaction(task_owner=None):
    connection = pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "taskflow"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "taskflow"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        connect_timeout=5,
    )
    try:
        with connection.cursor() as cursor:
            if task_owner:
                cursor.execute("SELECT id FROM users WHERE id = %s FOR UPDATE", (task_owner,))
            yield cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def serialize_task(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "completed": bool(row["completed"]),
        "dueDate": row["due_date"].isoformat() if row["due_date"] else None,
        "priority": row["priority"],
        "project": row["project"],
        "tags": json.loads(row["tags"]),
        "order": row["sort_order"],
        "createdAt": row["created_at"].isoformat(timespec="milliseconds") + "Z",
    }


def insert_task(cursor, task):
    columns = ", ".join(TASK_COLUMNS)
    placeholders = ", ".join(["%s"] * len(TASK_COLUMNS))
    cursor.execute(
        f"INSERT INTO tasks ({columns}) VALUES ({placeholders})",
        tuple(task[column] for column in TASK_COLUMNS),
    )


def init_db():
    schema = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
    with transaction() as cursor:
        for statement in schema.split(";"):
            if statement.strip():
                cursor.execute(statement)
        cursor.execute("SHOW COLUMNS FROM tasks LIKE 'user_id'")
        if cursor.fetchone() is None:
            # Legacy records stay unassigned so they cannot appear in a user's dashboard.
            cursor.execute("""
                ALTER TABLE tasks
                ADD user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
                ADD INDEX user_task_order (user_id, sort_order, id),
                ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            """)
