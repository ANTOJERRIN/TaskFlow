import json
import os
from datetime import date, datetime, timezone
from uuid import uuid4

import click
import pymysql
from flask import Flask, abort, g, jsonify, request
from werkzeug.exceptions import HTTPException

from .auth import auth, current_user
from .database import ROOT, SELECT_TASKS, init_db, insert_task, serialize_task, transaction


def task_fields(body, existing):
    title = body.get("title")
    if not isinstance(title, str) or not title.strip():
        abort(400, "Task title cannot be empty.")
    title = title.strip()
    if len(title) > 160:
        abort(400, "Task title must be 160 characters or fewer.")
    fields = {**existing, "title": title}
    if isinstance(body.get("description"), str):
        fields["description"] = body["description"].strip()[:1000]
    if isinstance(body.get("completed"), bool) and existing.get("id"):
        fields["completed"] = body["completed"]
    if "dueDate" in body:
        raw = body["dueDate"]
        try:
            value = raw.strip() if isinstance(raw, str) else ""
            parsed = date.fromisoformat(value)
            fields["due_date"] = parsed if parsed.isoformat() == value and parsed.year >= 1000 else None
        except ValueError:
            fields["due_date"] = None
    if "priority" in body:
        value = body["priority"]
        fields["priority"] = value if value in ("low", "medium", "high") else "medium"
    if "project" in body:
        value = body["project"]
        fields["project"] = (value.strip()[:40] if isinstance(value, str) else "") or "Product"
    if "tags" in body:
        tags = {}
        if isinstance(body["tags"], list):
            for raw in body["tags"]:
                tag = raw.strip().lstrip("#").strip()[:24] if isinstance(raw, str) else ""
                if tag:
                    tags.setdefault(tag.casefold(), tag)
                if len(tags) == 5:
                    break
        fields["tags"] = json.dumps(list(tags.values()))
    return fields


def json_body():
    body = request.get_json()
    if not isinstance(body, dict):
        abort(400, "Expected a JSON object.")
    return body


def find_task(cursor, task_id):
    if len(task_id) > 100:
        abort(400, "Invalid task identifier.")
    cursor.execute(SELECT_TASKS + " AND id = %s", (g.user["id"], task_id))
    task = cursor.fetchone()
    if task is None:
        abort(404, "Task not found.")
    return task


def create_app():
    app = Flask(__name__, static_folder=ROOT / "dist", static_url_path="")
    app.config["MAX_CONTENT_LENGTH"] = 65536
    app.register_blueprint(auth)

    @app.before_request
    def protect_api():
        if not request.path.startswith("/api/"):
            return
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            origin = request.headers.get("Origin")
            if origin and origin != request.host_url.rstrip("/"):
                abort(403, "Cross-origin requests are not allowed.")
        if request.path == "/api/tasks" or request.path.startswith("/api/tasks/"):
            g.user = current_user()
            if g.user is None:
                abort(401, "Sign in to access your tasks.")

    @app.after_request
    def prevent_api_caching(response):
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.cli.command("init-db")
    def initialize():
        try:
            init_db()
        except (pymysql.MySQLError, OSError) as error:
            raise click.ClickException(str(error)) from error
        click.echo("MySQL schema ready.")

    @app.errorhandler(HTTPException)
    def http_error(error):
        if request.path == "/api" or request.path.startswith("/api/"):
            return jsonify(error=error.description), error.code
        return error

    @app.errorhandler(pymysql.MySQLError)
    def database_error(error):
        app.logger.error("MySQL operation failed: %s", error.args[0])
        return jsonify(error="Task database unavailable."), 503

    @app.get("/")
    @app.get("/login")
    @app.get("/dashboard")
    def index():
        return app.send_static_file("index.html")

    @app.get("/api/health")
    def health():
        with transaction() as cursor:
            cursor.execute("SELECT 1 FROM login_sessions LIMIT 1")
            cursor.execute("SELECT user_id FROM tasks LIMIT 1")
        return jsonify(ok=True)

    @app.get("/api/tasks")
    def list_tasks():
        status = request.args.get("status")
        with transaction() as cursor:
            condition = " AND completed = %s" if status in ("active", "done") else ""
            params = (g.user["id"], status == "done") if condition else (g.user["id"],)
            cursor.execute(SELECT_TASKS + condition + " ORDER BY sort_order, id", params)
            return jsonify([serialize_task(task) for task in cursor.fetchall()])

    @app.post("/api/tasks")
    def create_task():
        task = task_fields(json_body(), {
            "description": "", "completed": False, "due_date": None,
            "priority": "medium", "project": "Product", "tags": "[]",
        })
        owner = g.user["id"]
        task.update(id=str(uuid4()), user_id=owner, sort_order=0,
                    created_at=datetime.now(timezone.utc).replace(tzinfo=None))
        with transaction(task_owner=owner) as cursor:
            cursor.execute("UPDATE tasks SET sort_order = sort_order + 1 WHERE user_id = %s",
                           (owner,))
            insert_task(cursor, task)
        return jsonify(serialize_task(task)), 201

    @app.put("/api/tasks/<task_id>")
    def update_task(task_id):
        body = json_body()
        with transaction(task_owner=g.user["id"]) as cursor:
            task = task_fields(body, find_task(cursor, task_id))
            cursor.execute(
                """UPDATE tasks SET title = %(title)s, description = %(description)s,
                   completed = %(completed)s, due_date = %(due_date)s, priority = %(priority)s,
                   project = %(project)s, tags = %(tags)s
                   WHERE id = %(id)s AND user_id = %(user_id)s""",
                task,
            )
        return jsonify(serialize_task(task))

    @app.patch("/api/tasks/<task_id>/toggle")
    def toggle_task(task_id):
        with transaction(task_owner=g.user["id"]) as cursor:
            task = find_task(cursor, task_id)
            task["completed"] = not task["completed"]
            cursor.execute("UPDATE tasks SET completed = %s WHERE id = %s AND user_id = %s",
                           (task["completed"], task_id, g.user["id"]))
        return jsonify(serialize_task(task))

    @app.patch("/api/tasks/reorder")
    def reorder_tasks():
        ids = json_body().get("orderedIds")
        if not isinstance(ids, list) or any(not isinstance(item, str) for item in ids):
            abort(400, "orderedIds must be an array of task IDs.")
        owner = g.user["id"]
        with transaction(task_owner=owner) as cursor:
            cursor.execute(SELECT_TASKS + " ORDER BY sort_order, id", (owner,))
            by_id = {task["id"]: task for task in cursor.fetchall()}
            ordered = [by_id.pop(item) for item in ids if item in by_id]
            ordered.extend(by_id.values())
            for position, task in enumerate(ordered):
                task["sort_order"] = position
            if ordered:
                cursor.executemany("UPDATE tasks SET sort_order = %s WHERE id = %s AND user_id = %s",
                                   [(task["sort_order"], task["id"], owner) for task in ordered])
        return jsonify([serialize_task(task) for task in ordered])

    @app.delete("/api/tasks/<task_id>")
    def delete_task(task_id):
        owner = g.user["id"]
        with transaction(task_owner=owner) as cursor:
            task = find_task(cursor, task_id)
            cursor.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, owner))
            cursor.execute("UPDATE tasks SET sort_order = sort_order - 1 "
                           "WHERE user_id = %s AND sort_order > %s", (owner, task["sort_order"]))
        return "", 204

    return app


if __name__ == "__main__":
    create_app().run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "3000")))
