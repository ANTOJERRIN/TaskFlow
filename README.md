# TaskFlow

TaskFlow is a React task manager backed by a Flask REST API and MySQL.

## Run locally on Windows

Install Node.js, Python, and Docker Desktop. From the repository in PowerShell, create the Python environment and install both sets of dependencies.

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
npm install
```

Copy `.env.example` to `.env` if it doesn't already exist. Set `MYSQL_PASSWORD` to a strong local password. The MySQL container uses `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` when it first creates its persistent volume.

```powershell
docker compose up -d mysql
.venv/Scripts/python.exe -m flask --app backend.app init-db
npm run build
.venv/Scripts/python.exe -m backend.app
```

Open [TaskFlow](http://127.0.0.1:3000) and create an account. Each account starts with an empty dashboard and can access only its own tasks. Signing in with **Keep me signed in** enabled restores the session on this browser for up to 30 days. Sign out from the dashboard to end the session.

Run `init-db` on existing installations before restarting Flask. Old unassigned records stay in MySQL and are excluded from every account. If MySQL is still starting, wait for it to accept connections and rerun `init-db`. Set `SESSION_COOKIE_SECURE=1` when serving through an HTTPS proxy.

For UI development, leave Flask running and run `npm run dev` in another terminal. Vite serves the UI and proxies `/api` to Flask. If you change the Flask port, set `TASKFLOW_API_PROXY` in the terminal running Vite.

## Deploy on Render

TaskFlow runs as a single Python web service that serves the built React frontend and Flask API. A separate reachable MySQL database must already exist; Render does not automatically run the local Compose database. MySQL must allow the database user to create and alter tables. Some hosted MySQL providers require TLS settings that this application does not yet configure.

Create a **Web Service** using the repository's `main` branch, Python runtime, and an empty root directory. Set:

- Build command: `pip install -r requirements.txt gunicorn && npm install && npm run build`
- Start command: `flask --app backend.app init-db && gunicorn --bind 0.0.0.0:$PORT 'backend.app:create_app()'`
- Optional health check path: `/api/health`

Add these environment variables in Render:

| Key | Value |
| --- | --- |
| `MYSQL_HOST` | MySQL hostname |
| `MYSQL_PORT` | MySQL port (often 3306) |
| `MYSQL_DATABASE` | Existing MySQL database name |
| `MYSQL_USER` | MySQL username |
| `MYSQL_PASSWORD` | MySQL password |
| `TRUST_PROXY` | `1` for Render's reverse proxy |
| `SESSION_COOKIE_SECURE` | `1` when served over HTTPS |

Keep passwords out of Git. Leave `VITE_API_URL` unset to use the same-origin API. The start command initializes the schema on each start and will fail until the database is available. After deployment, visit `/api/health`, create an account, and verify that a task persists after refreshing. For larger production deployments, use managed schema migrations rather than initializing on every start. Only enable `TRUST_PROXY` behind a trusted proxy.

## Task API

| Method | Path | Action |
| --- | --- | --- |
| GET | `/api/health` | Check database availability |
| GET | `/api/auth/session` | Get the signed-in account |
| POST | `/api/auth/register` | Create an account and sign in |
| POST | `/api/auth/login` | Sign in with email and password |
| POST | `/api/auth/logout` | End the current session |
| GET | `/api/tasks?status=active` | List all, active, or done tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/<id>` | Update a task |
| PATCH | `/api/tasks/<id>/toggle` | Toggle completion |
| PATCH | `/api/tasks/reorder` | Reorder using an `orderedIds` array |
| DELETE | `/api/tasks/<id>` | Delete a task |
