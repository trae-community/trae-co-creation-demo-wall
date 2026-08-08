-- CreateTable
CREATE TABLE "sys_dict" (
    "id" BIGSERIAL NOT NULL,
    "dict_code" VARCHAR(50) NOT NULL,
    "dict_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "is_system" BOOLEAN DEFAULT false,

    CONSTRAINT "sys_dict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_dict_item" (
    "id" BIGSERIAL NOT NULL,
    "dict_code" VARCHAR(50) NOT NULL,
    "item_label" VARCHAR(100) NOT NULL,
    "label_i18n" JSONB,
    "item_value" VARCHAR(100) NOT NULL,
    "parent_value" VARCHAR(100),
    "sort_order" INTEGER DEFAULT 0,
    "status" BOOLEAN DEFAULT true,

    CONSTRAINT "sys_dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" TIMESTAMPTZ,
    "phone" VARCHAR(50),
    "clerk_id" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "avatar_url" VARCHAR(255),
    "bio" TEXT,
    "last_sign_in_at" TIMESTAMPTZ,
    "identities" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "id" SERIAL NOT NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_base" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" VARCHAR(255),
    "cover_url" VARCHAR(255),
    "country_code" VARCHAR(100),
    "city_code" VARCHAR(100),
    "category_code" VARCHAR(100),
    "dev_status_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_detail" (
    "work_id" BIGINT NOT NULL,
    "story" TEXT,
    "highlights" JSONB,
    "scenarios" JSONB,
    "demo_url" VARCHAR(255),
    "repo_url" VARCHAR(255),

    CONSTRAINT "work_detail_pkey" PRIMARY KEY ("work_id")
);

-- CreateTable
CREATE TABLE "work_image" (
    "id" BIGSERIAL NOT NULL,
    "work_id" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "image_type" VARCHAR(50),
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_team" (
    "id" BIGSERIAL NOT NULL,
    "work_id" BIGINT NOT NULL,
    "team_intro" TEXT,
    "members" JSONB,
    "contact_phone" VARCHAR(50),
    "contact_email" VARCHAR(255),

    CONSTRAINT "work_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_statistic" (
    "work_id" BIGINT NOT NULL,
    "audit_status" INTEGER DEFAULT 0,
    "display_status" INTEGER DEFAULT 0,
    "view_count" BIGINT DEFAULT 0,
    "like_count" BIGINT DEFAULT 0,
    "last_audit_at" TIMESTAMPTZ,

    CONSTRAINT "work_statistic_pkey" PRIMARY KEY ("work_id")
);

-- CreateTable
CREATE TABLE "work_honor" (
    "id" BIGSERIAL NOT NULL,
    "work_id" BIGINT NOT NULL,
    "honor_item_id" BIGINT NOT NULL,
    "granted_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "granted_by" BIGINT,

    CONSTRAINT "work_honor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_audit_log" (
    "id" BIGSERIAL NOT NULL,
    "work_id" BIGINT NOT NULL,
    "auditor_id" BIGINT,
    "prev_status" INTEGER,
    "new_status" INTEGER,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_auto_audit" BOOLEAN DEFAULT false,
    "audit_start_time" TIMESTAMPTZ,
    "audit_end_time" TIMESTAMPTZ,

    CONSTRAINT "work_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_tag_relation" (
    "work_id" BIGINT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "work_tag_relation_pkey" PRIMARY KEY ("work_id","tag_id")
);

-- CreateTable
CREATE TABLE "work_like" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "work_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_auth_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "clerk_id" VARCHAR(255),
    "auth_type" VARCHAR(50) NOT NULL,
    "auth_channel" VARCHAR(50),
    "auth_status" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_auth_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_operation_log" (
    "id" BIGSERIAL NOT NULL,
    "operator_id" BIGINT,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(255),
    "success" BOOLEAN DEFAULT true,
    "error_message" VARCHAR(500),
    "request_method" VARCHAR(16),
    "request_path" VARCHAR(255),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "payload" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_operation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" BIGSERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_dict_code_key" ON "sys_dict"("dict_code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_item_dict_code_item_value_key" ON "sys_dict_item"("dict_code", "item_value");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_email_key" ON "sys_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_clerk_id_key" ON "sys_user"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_role_code_key" ON "sys_role"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_role_user_id_role_id_key" ON "sys_user_role"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "work_base_user_id_idx" ON "work_base"("user_id");

-- CreateIndex
CREATE INDEX "work_base_country_code_idx" ON "work_base"("country_code");

-- CreateIndex
CREATE INDEX "work_base_city_code_idx" ON "work_base"("city_code");

-- CreateIndex
CREATE INDEX "work_base_category_code_idx" ON "work_base"("category_code");

-- CreateIndex
CREATE INDEX "work_image_work_id_idx" ON "work_image"("work_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_team_work_id_key" ON "work_team"("work_id");

-- CreateIndex
CREATE INDEX "work_team_work_id_idx" ON "work_team"("work_id");

-- CreateIndex
CREATE INDEX "work_honor_work_id_idx" ON "work_honor"("work_id");

-- CreateIndex
CREATE INDEX "work_audit_log_work_id_idx" ON "work_audit_log"("work_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_tag_name_key" ON "work_tag"("name");

-- CreateIndex
CREATE INDEX "work_like_work_id_idx" ON "work_like"("work_id");

-- CreateIndex
CREATE INDEX "work_like_user_id_idx" ON "work_like"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_like_user_id_work_id_key" ON "work_like"("user_id", "work_id");

-- CreateIndex
CREATE INDEX "sys_auth_log_user_id_idx" ON "sys_auth_log"("user_id");

-- CreateIndex
CREATE INDEX "sys_auth_log_clerk_id_idx" ON "sys_auth_log"("clerk_id");

-- CreateIndex
CREATE INDEX "sys_auth_log_auth_type_idx" ON "sys_auth_log"("auth_type");

-- CreateIndex
CREATE INDEX "sys_auth_log_created_at_idx" ON "sys_auth_log"("created_at");

-- CreateIndex
CREATE INDEX "sys_operation_log_operator_id_idx" ON "sys_operation_log"("operator_id");

-- CreateIndex
CREATE INDEX "sys_operation_log_module_action_idx" ON "sys_operation_log"("module", "action");

-- CreateIndex
CREATE INDEX "sys_operation_log_created_at_idx" ON "sys_operation_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_provider_account_id_key" ON "account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- AddForeignKey
ALTER TABLE "sys_dict_item" ADD CONSTRAINT "sys_dict_item_dict_code_fkey" FOREIGN KEY ("dict_code") REFERENCES "sys_dict"("dict_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_base" ADD CONSTRAINT "work_base_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_detail" ADD CONSTRAINT "work_detail_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_image" ADD CONSTRAINT "work_image_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_team" ADD CONSTRAINT "work_team_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_statistic" ADD CONSTRAINT "work_statistic_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_honor" ADD CONSTRAINT "work_honor_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_honor" ADD CONSTRAINT "work_honor_honor_item_id_fkey" FOREIGN KEY ("honor_item_id") REFERENCES "sys_dict_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_honor" ADD CONSTRAINT "work_honor_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_audit_log" ADD CONSTRAINT "work_audit_log_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_audit_log" ADD CONSTRAINT "work_audit_log_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tag_relation" ADD CONSTRAINT "work_tag_relation_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_tag_relation" ADD CONSTRAINT "work_tag_relation_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "work_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_like" ADD CONSTRAINT "work_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_like" ADD CONSTRAINT "work_like_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_auth_log" ADD CONSTRAINT "sys_auth_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_operation_log" ADD CONSTRAINT "sys_operation_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
