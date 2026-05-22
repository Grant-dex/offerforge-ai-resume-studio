-- OfferForge Admin System Migration
-- Run: mysql -u root -p < server/init-admin.sql

USE offerforge;

-- 1. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('super_admin', 'admin', 'viewer') DEFAULT 'admin',
  status          TINYINT(1)  DEFAULT 1,
  last_login_at   DATETIME     DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users table — add tracking columns (run once, safe to ignore "Duplicate column" errors)
ALTER TABLE users ADD COLUMN status       TINYINT(1)   DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login_at DATETIME     DEFAULT NULL;
ALTER TABLE users ADD COLUMN login_count  INT          DEFAULT 0;
ALTER TABLE users ADD COLUMN pro_expires_at DATE        DEFAULT NULL;

-- 3. Admin operation logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT          NOT NULL,
  action      VARCHAR(100) NOT NULL,
  target_type VARCHAR(50)  DEFAULT NULL,
  target_id   INT          DEFAULT NULL,
  detail      JSON         DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          DEFAULT NULL,
  action      VARCHAR(50)  NOT NULL,   -- 'score', 'suggest', 'optimize', 'jd_match'
  model       VARCHAR(50)  DEFAULT NULL,
  tokens      INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Seed super admin (password: admin123 — change immediately after login)
INSERT INTO admins (username, password_hash, role) VALUES
('admin', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9XGcXK4iP6MkEBqHG7nqXcJcUy', 'super_admin')
ON DUPLICATE KEY UPDATE username=username;
