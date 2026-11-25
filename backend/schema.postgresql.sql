CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(254) COLLATE "C" NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS login_sessions (
    token_hash BYTEA PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS session_expiry ON login_sessions (expires_at);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) COLLATE "C" PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    priority VARCHAR(6) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    project VARCHAR(40) NOT NULL,
    tags TEXT NOT NULL CHECK (json_typeof(tags::json) = 'array'),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_task_order ON tasks (user_id, sort_order, id);
