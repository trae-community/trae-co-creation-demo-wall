-- 站内通知表（审核结果、作品被赞等）
CREATE TABLE IF NOT EXISTS "sys_user_notification" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "sys_user"("id") ON DELETE CASCADE,
  "type" VARCHAR(64) NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "sys_user_notification_user_id_read_at_idx"
  ON "sys_user_notification" ("user_id", "read_at");

CREATE INDEX IF NOT EXISTS "sys_user_notification_user_id_created_at_idx"
  ON "sys_user_notification" ("user_id", "created_at" DESC);
