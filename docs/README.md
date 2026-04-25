# TRAE DEMO WALL - 文档目录

## 指南文档

`guides/` 目录存放开发参考文档：

| 文件 | 说明 |
|------|------|
| [api-reference.md](guides/api-reference.md) | API 接口文档（作品/字典/用户/标签/文件等） |
| [code-wiki.md](guides/code-wiki.md) | 项目架构、技术栈、目录结构总览 |
| [component-reference.md](guides/component-reference.md) | 前端组件文档（通用/CRUD/作品/UI组件） |
| [crud-guide.md](guides/crud-guide.md) | CRUD 组件与分页接口使用说明 |
| [development-guide.md](guides/development-guide.md) | 开发规范（命名/路由/文件组织） |
| [docker-deployment.md](guides/docker-deployment.md) | Docker 部署指南（生产环境） |

## 设计文档

`design/` 目录存放项目概要设计各版本，文件名含日期和版本号：

| 版本 | 日期 |
|------|------|
| v0.1 | 2026-02-28 |
| v0.2 ~ v0.4 | 2026-03-03 |
| v0.5 | 2026-03-06 |
| v0.6 | 2026-03-30 |

## 计划与规格

`superpowers/` 目录存放功能计划与规格说明：

- `plans/` — 功能实施计划（如认证迁移、列表返回状态等）
- `specs/` — 技术规格说明（如 JWT 优化、提交表单向导等）

## 归档

`archive/` 目录存放历史/备份文件，不影响项目运行：

| 子目录 | 内容 |
|--------|------|
| `db/` | 历史 schema 和迁移 SQL（v0.1 ~ v0.7） |
| `supabase_backup/` | Supabase 数据导出备份 |
| `replica_html_template/` | 早期 HTML 模板 |
| `trae_documents/` | TRAE 平台原始需求文档 |
