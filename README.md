# TRAE DEMO WALL

参赛作品提交与展示平台。

## 技术栈

- **框架**: Next.js 15 (App Router) + React 18
- **样式**: Tailwind CSS + Radix UI
- **数据库**: PostgreSQL (Prisma ORM)
- **认证**: NextAuth.js (Credentials)
- **国际化**: next-intl
- **对象存储**: 腾讯云 COS

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入数据库地址、NextAuth 密钥、COS 凭证。

### 3. 启动

```bash
npm run dev
```

访问 http://localhost:3000

> Schema 变更后需执行 `npx prisma generate` 重新生成客户端。

## 生产部署

### Docker Compose（推荐）

```bash
cp .env.docker.example .env
# 编辑 .env 配置 NEXTAUTH_SECRET、NEXTAUTH_URL、COS 凭证

docker compose up -d
```

详细指南见 [docs/guides/docker-deployment.md](docs/guides/docker-deployment.md)。

### 手动部署

```bash
npm run build
npm run start
```

需自行配置 PostgreSQL、环境变量及反向代理。

## 项目结构

```
src/
├── app/          # 路由层（页面 + API）
├── assets/       # 翻译/CSS/Logo
├── components/   # UI 组件（auth/common/crud/layout/ui/work）
└── lib/          # 工具层（auth/prisma/cos/hooks/store）
```

## 文档

所有文档位于 `docs/` 目录，索引见 [docs/README.md](docs/README.md)。
