-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT,
  invite_code TEXT UNIQUE,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  nickname TEXT NOT NULL,
  joined_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(family_id, user_id)
);

-- 宝宝表
CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date INTEGER NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- 喂养记录表
CREATE TABLE IF NOT EXISTS feeding_records (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  feeding_type TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  duration INTEGER,
  feeding_time INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- 提醒设置表
CREATE TABLE IF NOT EXISTS reminder_settings (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  baby_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  interval_hours INTEGER NOT NULL DEFAULT 3,
  interval_minutes INTEGER NOT NULL DEFAULT 0,
  reminder_method TEXT NOT NULL DEFAULT 'both',
  ringtone TEXT NOT NULL DEFAULT 'default',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
  UNIQUE(family_id, baby_id)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_babies_family_id ON babies(family_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_baby_id ON feeding_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_family_id ON feeding_records(family_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_feeding_time ON feeding_records(feeding_time);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_family_id ON reminder_settings(family_id);
