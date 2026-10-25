-- 模糊搜索加速（pg_trgm）：改善 ILIKE '%keyword%' 类查询
-- 应用方式：在 PostgreSQL 上手动执行本文件（与 prisma db push 并列，不修改 schema.prisma）
-- 例：psql "$DATABASE_URL" -f docs/database/migrations/20261025100000_pg_trgm_search/migration.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_work_base_title_trgm
  ON work_base USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_base_summary_trgm
  ON work_base USING gin (summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sys_user_username_trgm
  ON sys_user USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sys_user_email_trgm
  ON sys_user USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sys_user_phone_trgm
  ON sys_user USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_poster_nickname_trgm
  ON work_posters USING gin (nickname gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_work_poster_description_trgm
  ON work_posters USING gin (description gin_trgm_ops);
