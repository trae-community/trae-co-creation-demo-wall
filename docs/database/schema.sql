# ========================================
# 数据库 Schema 文档
# ========================================
# 导出时间: 2026-08-08
# 数据库: trae_demo_wall (PostgreSQL 16)
# ORM: Prisma ORM (prisma/schema.prisma 为唯一权威源)
# 说明: 本文件为当前数据库表结构的参考快照，结构变更请编辑
#       prisma/schema.prisma 并运行 "npx prisma migrate dev"
# ========================================

-- 数据库表结构导出
-- 导出时间: 2026-08-08T03:55:05.133Z
-- 数据库: trae_demo_wall

-- ==========================================
-- Table: account
-- ==========================================
CREATE TABLE account (
  id bigint(64,0) NOT NULL DEFAULT nextval('account_id_seq'::regclass)
  user_id bigint(64,0) NOT NULL
  type text NOT NULL
  provider text NOT NULL
  provider_account_id text NOT NULL
  refresh_token text NULL
  access_token text NULL
  expires_at integer(32,0) NULL
  token_type text NULL
  scope text NULL
  id_token text NULL
  session_state text NULL
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: session
-- ==========================================
CREATE TABLE session (
  id bigint(64,0) NOT NULL DEFAULT nextval('session_id_seq'::regclass)
  session_token text NOT NULL
  user_id bigint(64,0) NOT NULL
  expires timestamp without time zone NOT NULL
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: sys_auth_log
-- ==========================================
CREATE TABLE sys_auth_log (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_auth_log_id_seq'::regclass)
  user_id bigint(64,0) NULL
  clerk_id character varying(255) NULL
  auth_type character varying(50) NOT NULL
  auth_channel character varying(50) NULL
  auth_status character varying(20) NOT NULL
  ip_address character varying(64) NULL
  user_agent character varying(512) NULL
  metadata jsonb NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: sys_dict
-- ==========================================
CREATE TABLE sys_dict (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_dict_id_seq'::regclass)
  dict_code character varying(50) NOT NULL
  dict_name character varying(50) NOT NULL
  description character varying(255) NULL
  is_system boolean NULL DEFAULT false
  PRIMARY KEY (id)
);

-- ==========================================
-- Table: sys_dict_item
-- ==========================================
CREATE TABLE sys_dict_item (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_dict_item_id_seq'::regclass)
  dict_code character varying(50) NOT NULL
  item_label character varying(100) NOT NULL
  label_i18n jsonb NULL
  item_value character varying(100) NOT NULL
  parent_value character varying(100) NULL
  sort_order integer(32,0) NULL DEFAULT 0
  status boolean NULL DEFAULT true
  PRIMARY KEY (id)
  FOREIGN KEY (dict_code) REFERENCES sys_dict(dict_code)
);

-- ==========================================
-- Table: sys_operation_log
-- ==========================================
CREATE TABLE sys_operation_log (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_operation_log_id_seq'::regclass)
  operator_id bigint(64,0) NULL
  module character varying(50) NOT NULL
  action character varying(50) NOT NULL
  target_type character varying(50) NULL
  target_id character varying(255) NULL
  success boolean NULL DEFAULT true
  error_message character varying(500) NULL
  request_method character varying(16) NULL
  request_path character varying(255) NULL
  ip_address character varying(64) NULL
  user_agent character varying(512) NULL
  payload jsonb NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (operator_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: sys_role
-- ==========================================
CREATE TABLE sys_role (
  id integer(32,0) NOT NULL DEFAULT nextval('sys_role_id_seq'::regclass)
  role_code character varying(50) NOT NULL
  role_name character varying(50) NOT NULL
  description character varying(255) NULL
  PRIMARY KEY (id)
);

-- ==========================================
-- Table: sys_user
-- ==========================================
CREATE TABLE sys_user (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_user_id_seq'::regclass)
  username character varying(255) NOT NULL
  email character varying(255) NOT NULL
  email_verified timestamp with time zone NULL
  phone character varying(50) NULL
  clerk_id character varying(255) NULL
  password_hash character varying(255) NULL
  avatar_url character varying(255) NULL
  bio text NULL
  last_sign_in_at timestamp with time zone NULL
  identities jsonb NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
);

-- ==========================================
-- Table: sys_user_role
-- ==========================================
CREATE TABLE sys_user_role (
  id bigint(64,0) NOT NULL DEFAULT nextval('sys_user_role_id_seq'::regclass)
  user_id bigint(64,0) NOT NULL
  role_id integer(32,0) NOT NULL
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
  FOREIGN KEY (role_id) REFERENCES sys_role(id)
);

-- ==========================================
-- Table: verification_token
-- ==========================================
CREATE TABLE verification_token (
  identifier text NOT NULL
  token text NOT NULL
  expires timestamp without time zone NOT NULL
);

-- ==========================================
-- Table: work_audit_log
-- ==========================================
CREATE TABLE work_audit_log (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_audit_log_id_seq'::regclass)
  work_id bigint(64,0) NOT NULL
  auditor_id bigint(64,0) NULL
  prev_status integer(32,0) NULL
  new_status integer(32,0) NULL
  reason character varying(255) NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
  FOREIGN KEY (auditor_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: work_base
-- ==========================================
CREATE TABLE work_base (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_base_id_seq'::regclass)
  user_id bigint(64,0) NOT NULL
  title character varying(255) NOT NULL
  summary character varying(255) NULL
  cover_url character varying(255) NULL
  country_code character varying(100) NULL
  city_code character varying(100) NULL
  category_code character varying(100) NULL
  dev_status_code character varying(100) NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: work_detail
-- ==========================================
CREATE TABLE work_detail (
  work_id bigint(64,0) NOT NULL
  story text NULL
  highlights jsonb NULL
  scenarios jsonb NULL
  demo_url character varying(255) NULL
  repo_url character varying(255) NULL
  PRIMARY KEY (work_id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
);

-- ==========================================
-- Table: work_honor
-- ==========================================
CREATE TABLE work_honor (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_honor_id_seq'::regclass)
  work_id bigint(64,0) NOT NULL
  honor_item_id bigint(64,0) NOT NULL
  granted_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  granted_by bigint(64,0) NULL
  PRIMARY KEY (id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
  FOREIGN KEY (honor_item_id) REFERENCES sys_dict_item(id)
  FOREIGN KEY (granted_by) REFERENCES sys_user(id)
);

-- ==========================================
-- Table: work_image
-- ==========================================
CREATE TABLE work_image (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_image_id_seq'::regclass)
  work_id bigint(64,0) NOT NULL
  image_url character varying(255) NOT NULL
  image_type character varying(50) NULL
  sort_order integer(32,0) NULL DEFAULT 0
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
);

-- ==========================================
-- Table: work_like
-- ==========================================
CREATE TABLE work_like (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_like_id_seq'::regclass)
  user_id bigint(64,0) NOT NULL
  work_id bigint(64,0) NOT NULL
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (id)
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
);

-- ==========================================
-- Table: work_statistic
-- ==========================================
CREATE TABLE work_statistic (
  work_id bigint(64,0) NOT NULL
  audit_status integer(32,0) NULL DEFAULT 0
  display_status integer(32,0) NULL DEFAULT 0
  view_count bigint(64,0) NULL DEFAULT 0
  like_count bigint(64,0) NULL DEFAULT 0
  last_audit_at timestamp with time zone NULL
  PRIMARY KEY (work_id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
);

-- ==========================================
-- Table: work_tag
-- ==========================================
CREATE TABLE work_tag (
  id integer(32,0) NOT NULL DEFAULT nextval('work_tag_id_seq'::regclass)
  name character varying(100) NOT NULL
  is_auto_audit boolean NULL DEFAULT false
  audit_start_time timestamp with time zone NULL
  audit_end_time timestamp with time zone NULL
  PRIMARY KEY (id)
);

-- ==========================================
-- Table: work_tag_relation
-- ==========================================
CREATE TABLE work_tag_relation (
  work_id bigint(64,0) NOT NULL
  tag_id integer(32,0) NOT NULL
  PRIMARY KEY (work_id, tag_id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
  FOREIGN KEY (tag_id) REFERENCES work_tag(id)
);

-- ==========================================
-- Table: work_team
-- ==========================================
CREATE TABLE work_team (
  id bigint(64,0) NOT NULL DEFAULT nextval('work_team_id_seq'::regclass)
  work_id bigint(64,0) NOT NULL
  team_intro text NULL
  members jsonb NULL
  contact_phone character varying(50) NULL
  contact_email character varying(255) NULL
  PRIMARY KEY (id)
  FOREIGN KEY (work_id) REFERENCES work_base(id)
);

