-- Session 加固：改密后使旧 JWT 失效
ALTER TABLE sys_user
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
