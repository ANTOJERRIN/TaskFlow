CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    email VARCHAR(254) COLLATE utf8mb4_bin NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_sessions (
    token_hash BINARY(32) PRIMARY KEY,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX session_expiry (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(100) COLLATE utf8mb4_bin PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    priority ENUM('low', 'medium', 'high') NOT NULL,
    project VARCHAR(40) NOT NULL,
    tags JSON NOT NULL,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    INDEX user_task_order (user_id, sort_order, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
