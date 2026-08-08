# Prisma 目录说明

## 📁 目录内容

```
prisma/
├── schema.prisma             ← 数据库模型定义（核心文件）
├── seed.ts                   ← 种子数据脚本（初始化基础数据）
├── seed-data-countries.ts    ← 省份/城市字典数据（424 条，独立文件避免 seed.ts 臃肿）
└── README.md                 ← 本说明文档
```

---

## 📝 文件说明

### 1. `schema.prisma` - 数据库模型定义

**用途：** ⭐ **核心文件，数据库结构的唯一权威来源**

包含 18 张表的定义、字段约束与关联关系：

- 系统用户模块（sys_user, sys_role, sys_user_role）
- 系统字典模块（sys_dict, sys_dict_item）
- 作品模块（work_base, work_detail, work_image, work_tag, work_like, work_statistic, work_honor）
- 审计日志模块（sys_auth_log, sys_operation_log）
- NextAuth 会话模块（account, session, verification_token）

**约束：**
- 数据库结构变更必须修改此文件，禁止直接改库
- 所有 API 路由统一通过 Prisma Client 访问数据库，禁止原生 SQL

---

### 2. `seed.ts` - 种子数据脚本

**用途：** ⭐ 首次部署或重置数据库后，初始化系统基础数据。

**执行时机：**
- Docker 部署：`entrypoint.sh` 先执行 `prisma db push` 同步表结构，再运行本脚本（幂等，可重复执行）
- 本地开发：手动运行 `npm run seed`

**初始化内容：**

#### (1) 系统角色（3 个，脚本内硬编码）
| 角色编码 | 角色名称 | 说明 |
|---------|---------|------|
| root | 根用户 | 系统最高权限用户 |
| admin | 管理员 | 日常运营管理 |
| common | 普通角色 | 仅可使用前台功能 |

> 系统角色已固定为以上三个，不支持通过控制台新增/修改/删除。

#### (2) 核心业务字典（脚本内硬编码）
| 字典编码 | 字典名称 | 说明 |
|---------|---------|------|
| audit_status | 审核状态 | 作品审核流程状态 |
| dev_status | 开发状态 | 作品当前的开发阶段 |
| category_code | 作品分类 | 作品所属的类别 |
| honor_type | 荣誉类型 | 作品获得的荣誉类型 |

#### (3) 省份/城市数据（424 条）
从 `./seed-data-countries.ts` 导入（`country` + `city` 两级字典，数据量大故独立成文件）。

#### (4) 默认管理员账号
| 字段 | 值 |
|-----|-----|
| 用户名 | `trae` |
| 邮箱 | `trae@example.com` |
| 密码 | `trae1234` |
| 角色 | root (根用户) |

**幂等策略（先查后创）：**
- 脚本对每条数据先查询是否存在，存在则跳过、不存在才创建
- 重复执行安全，并在控制台输出详细执行报告（`✅ 创建成功` / `⏭️ 跳过（已存在）` + 分类统计），便于区分首次初始化与增量执行
- 密码使用 bcrypt 加密存储
- ⚠️ **例外：默认管理员账号**若已存在，每次执行会将其密码重置为 `trae1234`（防止密码泄露后无法恢复访问）。生产环境修改密码后请勿再重复执行 seed

**使用方法：**
```bash
npm run seed
```

---

### 3. 数据库资料归档

**位置：** `docs/database/`

| 内容 | 说明 |
|------|------|
| `schema.sql` | 数据库结构 SQL 参考 |
| `migrations/` | 历史迁移记录归档 |
| `seed-data/` | 历史种子数据导出备份 |

仅作开发参考与变更审计，不参与运行时流程（Docker 初始化走 `prisma db push`，无需迁移历史）。

---

## 🚀 初始化流程

### 本地开发

```bash
# 1. 启动开发数据库（db-dev，端口 5433）与 Redis
docker compose up -d db-dev redis

# 2. 配置 .env，连接指向开发库
#    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/trae_demo_wall_dev?schema=public"

# 3. 同步表结构
npx prisma db push

# 4. 生成 Prisma Client
npx prisma generate

# 5. 初始化基础数据
npm run seed

# 6. 启动开发服务器
npm run dev
```

### Docker 部署

由 `app-init` 容器自动完成：`prisma db push` + `npm run seed`（仅首次初始化时执行），无需手动操作。

> 项目为双库架构：`db`（生产库，端口 5432，库名 `trae_demo_wall`）与 `db-dev`（开发库，端口 5433，库名 `trae_demo_wall_dev`），互不干扰。

---

## 🔧 常用命令

```bash
# 生成 Prisma Client
npx prisma generate

# 同步表结构（以 schema.prisma 为准推送建表）
npx prisma db push

# 执行种子数据
npm run seed

# 打开 Prisma Studio 可视化界面
npx prisma studio

# 查看数据库连接状态
npx prisma validate
```

---

## 🔐 安全建议

1. **修改默认密码**：生产环境登录后立即修改 `trae` 默认密码
2. **备份数据库**：定期使用 `pg_dump` 备份，保留至少 7 天
3. **环境变量保护**：`.env` 不提交仓库，生产环境通过环境变量注入

---

## 📚 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs)
- [项目概要设计](../docs/design/)
- [Docker 部署指南](../docs/guides/docker-deployment.md)
- [数据库资料归档](../docs/database/)
