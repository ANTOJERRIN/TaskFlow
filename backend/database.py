import json
import os
from contextlib import contextmanager
from pathlib import Path

import psycopg
import pymysql
from dotenv import load_dotenv
from psycopg.rows import dict_row
from pymysql.cursors import DictCursor

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

TASK_COLUMNS = (
    "id", "title", "description", "completed", "due_date",
    "priority", "project", "tags", "sort_order", "created_at", "user_id",
)
SELECT_TASKS = "SELECT * FROM tasks WHERE user_id = %s"
DATABASE_ERRORS = (pymysql.MySQLError, psycopg.Error)


def connect():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg.connect(database_url, row_factory=dict_row, connect_timeout=5)
    if os.getenv("RENDER") == "true":
        raise RuntimeError("Set DATABASE_URL to the internal Render PostgreSQL connection string.")
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "taskflow"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "taskflow"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        connect_timeout=5,
    )


@contextmanager
def transaction(task_owner=None):
    connection = connect()
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
    postgres = bool(os.getenv("DATABASE_URL"))
    schema_file = "schema.postgresql.sql" if postgres else "schema.sql"
    schema = Path(__file__).with_name(schema_file).read_text(encoding="utf-8")
    with transaction() as cursor:
        if postgres:
            # Wait for any other starting instance to finish creating the schema.
            cursor.execute("SELECT pg_advisory_xact_lock(1843476259)")
        for statement in schema.split(";"):
            if statement.strip():
                cursor.execute(statement)
        if postgres:
            return
        cursor.execute("SHOW COLUMNS FROM tasks LIKE 'user_id'")
        if cursor.fetchone() is None:
            # Legacy records stay unassigned so they cannot appear in a user's dashboard.
            cursor.execute("""
                ALTER TABLE tasks
                ADD user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
                ADD INDEX user_task_order (user_id, sort_order, id),
                ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            """)
