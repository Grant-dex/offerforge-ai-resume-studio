CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT DEFAULT '',
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  wechat_openid TEXT UNIQUE,
  avatar_url TEXT DEFAULT '',
  is_pro INTEGER DEFAULT 0,
  pro_expires_at TEXT,
  status INTEGER DEFAULT 1,
  login_count INTEGER DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS verify_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  used INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_verify_codes_target_type ON verify_codes (target, type);

CREATE TABLE IF NOT EXISTS wechat_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id TEXT NOT NULL UNIQUE,
  ticket TEXT,
  qr_url TEXT,
  openid TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanned', 'confirmed', 'expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_wechat_tickets_scene_id ON wechat_tickets (scene_id);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
