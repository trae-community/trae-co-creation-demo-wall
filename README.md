# TRAE DEMO WALL

参赛作品提交与展示平台。

## 技术栈

- **框架**: Next.js 15 (App Router) + React 18
- **样式**: Tailwind CSS + Radix UI
- **数据库**: PostgreSQL 16 (Prisma ORM)
- **缓存**: Redis 7
- **认证**: NextAuth.js (Credentials)
- **国际化**: next-intl（zh-CN / en-US / ja-JP）
- **对象存储**: 腾讯云 COS

## 快速开始（Docker Compose 全栈）

```bash
cp .env.docker.example .env
# 编辑 .env 配置 NEXTAUTH_SECRET、对象存储凭证

docker compose up -d
```

详细指南见 [docs/guides/docker-deployment.md](docs/guides/docker-deployment.md)。

## 本地开发（推荐）

本地 Next.js dev server 热更新 + Docker 只跑数据库/Redis，代码改动即时生效，无需重复构建镜像。

### 1. 安装依赖

```bash
npm install
```

### 2. 启动数据库与 Redis

```bash
docker compose up -d db redis
```

### 3. 配置环境变量

创建 `.env`，将连接指向本地：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trae_demo_wall?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/trae_demo_wall"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<任意随机字符串>"
```

### 4. 初始化数据库并启动

```bash
npx prisma migrate deploy   # 应用迁移
npm run seed                # 初始化内置角色/字典等种子数据（首次或重置后）
npm run dev
```

访问 http://localhost:3000

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 生产构建（自动执行 prisma generate） |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |
| `npm run seed` | 执行数据库种子脚本（内置角色、字典等） |

> Schema 变更后需执行 `npx prisma generate` 重新生成客户端。

## 内置角色

系统固定三个内置角色，不可新增/修改/删除（详见角色管理页说明）：

| 角色 | 编码 | 权限范围 |
|------|------|---------|
| 根用户 | `root` | 全部控制台模块 |
| 管理员 | `admin` | 用户管理、作品管理、城市数据、标签管理、日志审计 |
| 普通用户 | `common` | 仅前台功能（浏览/点赞/评论/提交作品） |

## 项目结构

```
src/
├── app/          # 路由层（页面 + API）
│   ├── [language]/   # 前台页面 + 控制台 console/
│   └── api/          # API 路由
├── assets/       # 翻译 / 全局样式 / Logo
├── components/   # UI 组件（auth/common/crud/layout/ui/work）
└── lib/          # 工具层（auth/prisma/cos/hooks/store）
prisma/
├── schema.prisma # 数据模型
├── seed.ts       # 种子数据（内置角色、字典）
└── migrations/   # Prisma 迁移记录
```

## 贡献指南

提交代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，包含分支流程、提交规范（Conventional Commits）与自检清单。

## 文档

所有文档位于 `docs/` 目录，索引见 [docs/README.md](docs/README.md)。
