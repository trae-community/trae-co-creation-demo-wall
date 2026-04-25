# TRAE DEMO WALL - Code Wiki

## 1. 项目整体架构 (Overall Architecture)
该项目是一个基于 **Next.js (App Router)** 的全栈应用，旨在为用户提供一个参赛作品提交与展示平台 (TRAE DEMO WALL)。
主要技术栈与架构选型如下：
- **前端框架**: Next.js 15 (React 18) + App Router
- **样式方案**: Tailwind CSS + Radix UI (Headless UI)
- **后端接口**: Next.js API Routes (Serverless/Node.js)
- **数据库**: PostgreSQL (推荐使用 Supabase 或自建 Docker 环境)
- **ORM 框架**: Prisma
- **认证授权**: NextAuth.js (Auth.js v5) + 角色控制 (RBAC)
- **状态管理**: Zustand (全局状态) + React Query (服务端状态与数据缓存)
- **多语言 (i18n)**: next-intl
- **对象存储**: 腾讯云 COS (cos-nodejs-sdk-v5)

## 2. 主要模块职责 (Main Module Responsibilities)
代码库遵循 Next.js App Router 约定进行组织，核心目录位于 `src`。

### `src/app` (应用路由层)
- **`[language]`**: 国际化路由包裹层，支持多语言访问 (例如 `/en-US/`, `/zh-CN/`)。
  - **`console/`**: 后台管理模块。包含城市、数据字典、操作日志、标签、用户、作品等的管理后台页面。
  - **`submit/`**: 作品提交向导模块。采用多步骤表单 (向导式) 收集作品的基础信息、可视化资源、图文内容和团队信息。
  - **`works/`**: 客户端作品展示模块。包含作品列表展示页和详情页。
  - **`sign-in/` / `sign-up/`**: 用户登录与注册页面。
  - **`profile/`**: 用户个人中心页面。
- **`api/`**: 后端 API 接口层。提供 RESTful 风格的接口，用于前后端数据交互。
  - `auth/`: 认证相关接口。
  - `console/`: 后台管理相关接口。
  - `works/`: 作品的 CRUD 与统计接口 (如点赞、浏览量统计)。
  - `file/`: 文件上传相关的接口。

### `src/components` (组件层)
- **`ui/`**: 基础 UI 组件库。基于 Radix UI 和 Tailwind 构建，如 Button, Input, Dialog, Select 等原子组件。
- **`auth/`**: 认证表单组件 (登录、注册表单)。
- **`crud/`**: 封装的通用后台管理 CRUD 组件 (如通用过滤器、分页器、反馈提示)。
- **`work/`**: 领域级业务组件，如作品展示卡片 (`work-card.tsx`)、城市过滤器 (`city-filter.tsx`)、作品编辑表单等。
- **`home/` & `layout/`**: 首页布局与全局背景组件 (如 `particles-background.tsx`)。

### `src/lib` (核心工具与服务层)
- **`prisma.ts`**: 导出单例 Prisma Client 实例。
- **`auth.ts` & `auth-nextauth.ts`**: NextAuth 配置、用户信息获取及角色权限验证 (RBAC) 的核心业务逻辑。
- **`cos.ts`**: 封装腾讯云 COS 对象存储 SDK，用于处理图片与大文件上传。
- **`crud.ts`**: 封装通用的 CRUD 查询参数解析与处理方法。
- **`language/`**: i18n 相关的请求拦截和路由配置文件。

### `src/hooks` (自定义 Hooks)
- **`use-works.ts`**: 封装与作品数据获取、状态更新相关的 React Query hooks。
- **`use-feedback.ts`**: 封装全局的统一交互反馈逻辑。

### `src/store` (状态管理)
- **`works-store.ts`**: 使用 Zustand 维护前端业务所需的作品相关全局状态。

### `prisma` (数据库层)
- **`schema.prisma`**: 核心数据库建模文件，定义了所有数据库表结构及外键关联关系。
- **`seed.ts`**: 数据库初始数据种子文件。

## 3. 关键类与函数说明 (Key Classes & Functions)

### 3.1 核心数据库模型 (Database Models - `schema.prisma`)
为提高检索性能，作品相关的数据采用了**垂直分表**设计：
- **`SysUser` / `SysRole` / `SysUserRole`**: 系统用户、角色及关联表，支撑系统的 RBAC 权限控制。
- **`WorkBase`**: 作品基础表。仅包含核心元数据（名称、简介、封面、城市等），保持轻量，用于列表快速检索与展示。
- **`WorkDetail`**: 作品详情表。存储图文故事、亮点、使用场景等大文本字段，通过 `work_id` 与 `WorkBase` 关联。
- **`WorkImage` / `WorkTeam`**: 独立的图片记录表与团队信息表。
- **`WorkStatistic`**: 作品状态与统计表。分离状态管理与统计数据（如浏览量、点赞量、审核状态），降低高频更新的锁冲突。
- **`SysDict` / `SysDictItem`**: 系统字典表。用于管理城市、分类、国家等动态字典数据，支持层级关系。

### 3.2 关键服务端函数 (Server-side Functions)
- **`getAuthUser()`** (位于 `src/lib/auth.ts`):
  从 NextAuth 的 session 中解析当前登录用户，并从数据库中关联查询出该用户的角色列表 (`roles`)。
- **`isAdmin(user: AuthUser | null)`** (位于 `src/lib/auth.ts`):
  校验传入的用户对象是否包含 `admin` 或 `root` 角色，用于后端接口的鉴权和前端控制台路由的访问保护。
- **`cos` (COS 实例)** (位于 `src/lib/cos.ts`):
  基于系统环境变量 (`COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`) 初始化的对象存储实例，处理所有静态资源的云端存储操作。

## 4. 依赖关系 (Dependencies)

### 4.1 核心依赖 (Core)
- **`next`**: ^15.3.3 - 核心 React 全栈框架。
- **`react` / `react-dom`**: ^18.3.1
- **`@prisma/client`**: 5.10.2 - 数据库 ORM 客户端引擎。

### 4.2 认证与安全 (Auth & Security)
- **`next-auth`**: ^5.0.0-beta.30 - 提供灵活的会话与认证管理。
- **`@auth/prisma-adapter`**: NextAuth 官方的 Prisma 数据适配器。
- **`bcryptjs`**: 用于密码哈希的加密处理。

### 4.3 状态管理与数据请求 (State & Data Fetching)
- **`@tanstack/react-query`**: ^5.95.2 - 管理异步的服务端状态和数据缓存。
- **`zustand`**: ^5.0.3 - 客户端轻量级状态管理。

### 4.4 UI 与样式 (UI & Styling)
- **`tailwindcss`**: ^3.4.17 - 原子化 CSS 框架。
- **`lucide-react`**: ^0.511.0 - SVG 图标库。
- **`@radix-ui/react-*`**: 无头 (Headless) UI 组件集合 (Dialog, Label, Select, Checkbox 等)。
- **`@tiptap/react` / `@tiptap/starter-kit`**: 构建强大可扩展的富文本编辑器。

### 4.5 表单与校验 (Forms & Validation)
- **`react-hook-form`**: ^7.71.2 - 高性能表单状态管理。
- **`zod`**: ^4.3.6 - TypeScript 优先的数据 Schema 校验库。
- **`@hookform/resolvers`**: React Hook Form 与 Zod 之间的适配器。

### 4.6 存储与多语言 (Storage & I18n)
- **`cos-nodejs-sdk-v5`**: 腾讯云官方对象存储 SDK。
- **`next-intl`**: ^4.8.3 - 支持 App Router 的国际化 (i18n) 解决方案。

## 5. 项目运行方式 (How to Run the Project)

### 5.1 本地开发环境运行 (Local Development)

1. **环境准备与依赖安装**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   npm install
   ```

2. **配置环境变量**
   复制示例配置并填入相应的 Supabase/PostgreSQL 数据库地址以及腾讯云 COS 凭证：
   ```bash
   cp .env.example .env.local
   ```
   主要需配置:
   - `DATABASE_URL` 与 `DIRECT_URL`
   - `NEXTAUTH_SECRET` (可通过 `openssl rand -base64 32` 生成)
   - `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`

3. **初始化数据库**
   推送数据库结构同步，生成 Prisma Client 并在库中填充初始种子数据：
   ```bash
   npx prisma db push
   npx prisma generate
   npm run seed
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   浏览器访问 `http://localhost:3000` 即可预览项目。

### 5.2 Docker 容器化部署 (Docker Deployment)

项目提供了针对国内服务器优化的 Docker 部署方案，整体包含 App 容器、PostgreSQL 数据库容器、Redis 容器以及 Nginx 反向代理容器。

1. **配置 Docker 环境变量**
   ```bash
   cp .env.docker.example .env
   ```
   编辑 `.env` 文件，配置 `NEXTAUTH_SECRET` 和对象存储等相关信息。

2. **一键构建与启动**
   使用 Docker Compose 启动所有后台服务及应用：
   ```bash
   docker-compose up -d
   ```

3. **初始化数据库 (容器内)**
   服务启动后，执行 Prisma 的生产环境数据迁移并植入初始数据：
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma db seed
   ```

4. **常用维护命令**
   - **查看日志**: `docker-compose logs -f app`
   - **重启服务**: `docker-compose restart app`
   - **停止并删除容器及数据卷**: `docker-compose down -v`
