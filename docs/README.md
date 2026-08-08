# TRAE DEMO WALL - 文档目录

## 项目入口文档

| 文件 | 说明 |
|------|------|
| [README.md](../README.md) | 项目介绍、技术栈、本地开发/部署指南 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南（分支流程、Conventional Commits 提交规范、自检清单） |

---

## 📚 开发指南

`guides/` 目录存放开发参考文档，帮助开发者快速上手和规范开发流程。

| 文件 | 说明 |
|------|------|
| [api-reference.md](guides/api-reference.md) | API 接口文档（作品/字典/用户/标签/文件等） |
| [code-wiki.md](guides/code-wiki.md) | 项目架构、技术栈、目录结构总览 |
| [component-reference.md](guides/component-reference.md) | 前端组件文档（通用/CRUD/作品/UI组件） |
| [crud-guide.md](guides/crud-guide.md) | CRUD 组件与分页接口使用说明 |
| [development-guide.md](guides/development-guide.md) | 开发规范（命名/路由/文件组织/安全） |
| [docker-deployment.md](guides/docker-deployment.md) | Docker 部署指南（生产环境） |

---

## 📐 设计文档

`design/` 目录存放项目概要设计和需求文档，统一使用 `{日期}_DemoWall{类别}文档.md` 命名。

### 概要设计

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-02-28 | 初始概要设计 |
| v0.2 ~ v0.4 | 2026-03-03 | 迭代优化 |
| v0.5 | 2026-03-06 | 功能扩展 |
| v0.6 | 2026-03-30 | 安全加固 |
| v0.7 | 2026-08-08 | 种子数据优化 + 文档体系重构（**最新**） |

### 技术与需求文档

| 文件 | 说明 |
|------|------|
| [页面设计文档](design/20260808_DemoWall页面设计文档.md) | 页面设计和 UI 规范 |
| [产品需求文档](design/20260808_DemoWall产品需求文档.md) | 产品功能需求和业务逻辑 |
| [技术架构文档](design/20260808_DemoWall技术架构文档.md) | 系统架构和技术选型 |

---

## 🗄️ 数据库文档

`database/` 目录存放数据库相关的结构、迁移和种子数据文件。

| 文件/目录 | 说明 |
|-----------|------|
| [schema.sql](database/schema.sql) | 当前数据库表结构参考快照（权威源为 `prisma/schema.prisma`） |
| [migrations/](database/migrations/) | Prisma 迁移记录 |
| └── `archive/` | 历史迁移文件（v0.1 ~ v0.7） |
| [seed-data/countries.ts](database/seed-data/countries.ts) | 省份城市数据（TypeScript 格式，供 seed.ts 导入） |
| [seed-data/backup/](database/seed-data/backup/) | JSON 格式备份（角色、字典、省份城市） |

---

## 📦 历史归档

`archive/` 目录存放历史备份、开发记录和旧版模板，供参考和回溯使用。

| 子目录 | 内容 |
|--------|------|
| `html-templates/` | 早期 HTML 原型模板 |
| `supabase-backup/` | Supabase 时期的完整数据导出备份（含 `supabase/` 配置） |
| `development-records/` | 已完成任务的开发计划与规格记录（原 superpowers） |

---

## 📝 文档维护规范

### 更新规则

- **开发指南**：代码变更时需同步更新相关指南
- **API 文档**：新增或修改 API 时必须更新 `api-reference.md`
- **设计文档**：重大架构变更时新增概要设计版本（如 v0.8）
- **数据库文档**：Schema 变更后运行 `npx prisma migrate dev`，并同步 `schema.sql` 快照

### 命名规范

- **概要设计**：`{yyyyMMdd}_DemoWall项目概要设计_v{版本}.md`
- **功能文档**：`{yyyyMMdd}_DemoWall{功能名}文档.md`
- **指南文档**：`{类别}-reference.md` 或 `{类别}-guide.md`

### 安全要求

- ⚠️ 严禁在文档中粘贴真实密钥（NEXTAUTH_SECRET、COS_SECRET_ID 等）
- ✅ 一律使用占位符：`your-secret-key-here`
- ✅ 环境配置参考 [.env.example](../.env.example) 和 [.env.docker.example](../.env.docker.example)
