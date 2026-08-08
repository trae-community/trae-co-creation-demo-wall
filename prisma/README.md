# Prisma 目录结构说明

## 📁 目录内容

```
prisma/
├── schema.prisma      ← 数据库模型定义（核心文件）
├── seed.ts            ← 种子数据脚本（初始化基础数据）
└── README.md          ← 本说明文档
```

---

## 📝 文件说明

### 1. `schema.prisma` - 数据库模型定义

**用途：** ⭐ **核心文件，必须保留！**

这是 Prisma ORM 的数据库模型定义文件，包含：
- 所有数据表结构定义
- 字段类型和约束
- 表间关联关系
- 数据库连接配置

**主要内容：**
- 系统用户模块（sys_user, sys_role, sys_user_role）
- 系统字典模块（sys_dict, sys_dict_item）
- 作品模块（work_base, work_detail, work_image 等）
- 审计日志模块（sys_auth_log, sys_operation_log）
- NextAuth 会话模块（account, session, verification_token）

**操作：**
```bash
# 根据 schema 生成 Prisma Client
npm run db:generate

# 同步到数据库（自动创建/更新表结构）
npm run db:migrate

# 或打开 Prisma Studio 可视化管理界面
npm run db:studio
```

---

### 2. `seed.ts` - 种子数据脚本

**用途：** ⭐ **初始化系统基础数据**

首次部署或清空数据库后，用于快速初始化系统所需的基础数据。

#### 数据来源

所有角色、字典、字典项数据从 `docs/seed-data.ts` 导入，该文件由 `_temp_export_seed.js` 脚本从当前 PostgreSQL 数据库导出。

**数据文件：**
- `docs/seed-roles.json` - 3 条角色记录
- `docs/seed-dicts.json` - 6 条字典记录
- `docs/seed-dict-items.json` - 440 条字典项记录
- `docs/seed-data.ts` - TypeScript 格式整合文件

#### (1) 系统角色（3 个）
| 角色编码 | 角色名称 | 说明 |
|---------|---------|------|
| root | 根用户 | 系统最高权限用户 |
| admin | 管理员 | 日常运营管理 |
| common | 普通角色 | 仅可使用前台功能 |

#### (2) 字典表（6 类，从数据库导出）
| 字典编码 | 字典名称 | 说明 |
|---------|---------|------|
| audit_status | 审核状态 | 作品审核流程状态 |
| dev_status | 开发状态 | 作品当前的开发阶段 |
| category_code | 作品分类 | 作品所属的类别 |
| country | 省份 | 省份列表 |
| city | 城市 | 城市列表 |
| honor_type | 荣誉类型 | 作品获得的荣誉类型 |

#### (3) 字典项（440 条，从数据库导出）
包含所有字典表的完整字典项数据，实际存在于当前数据库中。

#### (4) 默认管理员账号
| 字段 | 值 |
|-----|-----|
| 用户名 | `trae` |
| 邮箱 | `trae@example.com` |
| 密码 | `trae1234` |
| 角色 | root (根用户) |

**使用方法：**
```bash
# 执行种子脚本
npm run db:seed

# 或者直接使用 npx
npx prisma db seed
```

**注意事项：**
- ⚠️ 此脚本使用 `upsert` 操作，重复执行是安全的
- 🔒 密码使用 bcrypt 加密存储
- 🔄 如果管理员账号已存在，会自动更新密码
- 📊 所有角色、字典数据来自 `docs/seed-data.ts`（从数据库导出）

#### 更新导出的数据

如果需要从数据库重新导出数据，运行：
```bash
# 运行导出脚本
node _temp_export_seed.js

# 生成的文件位置：
# - docs/seed-roles.json
# - docs/seed-dicts.json
# - docs/seed-dict-items.json
# - docs/seed-data.ts
```

---

### 3. 历史迁移文件归档

**位置：** `docs/archive/prisma-migrations/`

**内容：**
- `migration_v0.1.sql` ~ `migration_v0.7.sql` - 历史迁移 SQL
- `schema_v0.1.prisma` ~ `schema_v0.3.prisma` - 旧版 schema 备份
- `migration_lock.toml` - 旧的 provider 锁定配置

**用途：** 
- 开发阶段回滚参考
- 数据库结构变更审计
- 从旧版本升级时参考

**注意事项：**
- ❌ 不要删除这些归档文件
- ✅ 生产环境部署时参考这些 SQL 手动执行建表

---

## 🚀 完整初始化流程

### 首次部署

```bash
# 1. 确保 PostgreSQL 数据库已创建且可访问
#    数据库名: trae_demo_wall
#    用户名: postgres
#    密码: postgres

# 2. 安装依赖
npm install

# 3. 同步数据库结构
npm run db:migrate

# 4. 初始化基础数据（角色、字典、root 用户）
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

### 重置数据库（清空所有数据）

```bash
# ⚠️ 警告：此操作将删除所有数据！

# 1. 删除迁移历史
npm run db:migrate:reset

# 2. 重新执行迁移
npm run db:migrate

# 3. 重新初始化数据
npm run db:seed
```

---

## 📊 数据库表关系图

```
sys_user ──┬── sys_user_role ── sys_role
           ├── work_base
           ├── work_like
           └── work_honor (granted_by)

sys_dict ──┬── sys_dict_item (dict_code FK)
           └── work_base (country_code FK)

sys_dict_item ──┬── work_base (city FK, honor_level FK)
                └── work_base (industry FK)
```

---

## 🔧 常用命令

```bash
# 生成 Prisma Client
npm run db:generate

# 同步数据库结构（创建/更新表）
npm run db:migrate

# 执行种子数据
npm run db:seed

# 打开 Prisma Studio 可视化界面
npm run db:studio

# 查看迁移状态
npm run db:status

# 重置数据库（⚠️ 删除所有数据）
npm run db:migrate:reset
```

---

## 🔐 安全建议

### 生产环境

1. **修改默认密码**
   ```bash
   # 登录后立即修改默认密码
   # 或通过 Prisma Studio:
   # http://localhost:5555 → sys_user → 编辑记录
   ```

2. **备份数据库**
   ```bash
   # 使用 pg_dump 备份整个数据库
   pg_dump -U postgres trae_demo_wall > backup.sql
   
   # 或使用 Prisma + Node.js 导出特定表
   ```

3. **环境变量保护**
   - 确保 `.env` 文件中的 `DATABASE_URL` 不泄露
   - 生产环境使用环境变量注入，不要提交 `.env` 文件

---

## 📚 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma Schema 参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/client-api-reference)
- [数据库架构设计](../../docs/design/)
- [数据库迁移历史](../../docs/archive/db/)

---

## ⚠️ 注意事项

1. **schema.prisma 是权威来源**
   - 所有表结构以 `.prisma` 文件为准
   - 不要手动修改数据库表结构

2. **迁移记录不自动删除**
   - 旧的迁移 SQL 会保留在 `docs/archive/prisma-migrations/`
   - 保持 Git 仓库整洁定期清理

3. **种子数据安全**
   - seed.ts 中的默认密码应定期更换
   - 生产环境应使用强密码

4. **数据库备份**
   - 定期备份 PostgreSQL 数据库
   - 保留至少 7 天的备份副本
