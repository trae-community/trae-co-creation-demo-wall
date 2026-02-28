# TRAE DEMO WALL (Competition Showcase Platform)

这是一个用于收集和展示参赛项目的平台。

## 功能

### 1. 提交端 (Submission)
- 访问 `/submit` 页面。
- 填写项目信息：名称、简介、城市、团队、封面图、详细内容、外部链接。
- 自动生成 JSON 数据文件并下载。
- 将生成的 JSON 文件提交给管理员。

### 2. 展示端 (Showcase)
- **首页**: 展示所有项目，支持按城市筛选和关键词搜索。
- **项目详情页**: 展示项目的详细信息、团队、Demo 链接和代码仓库。

## 技术栈

- **前端框架**: Next.js + React
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **表单**: React Hook Form + Zod
- **图标**: Lucide React

## 协作开发指南

### 1. 环境准备

1.  克隆仓库并安装依赖:
    ```bash
    npm install
    ```

2.  配置环境变量:
    *   复制 `.env.example` 文件为 `.env.local`。
    *   填入您的 Supabase 项目凭证。
    *   **注意**: `.env.local` 包含敏感信息，请勿提交到代码仓库。

### 2. 数据库配置

本项目使用 Prisma 进行数据库管理。

1.  **同步数据库结构**:
    如果您是第一次拉取代码，或数据库结构有更新，请运行以下命令将 Schema 同步到您的 Supabase 数据库：
    ```bash
    npx prisma db push
    ```

2.  **生成客户端**:
    每次修改 `prisma/schema.prisma` 后，都需要重新生成客户端代码：
    ```bash
    npx prisma generate
    ```

### 3. 启动开发服务器

```bash
npm run dev
```

## 部署指南

### Vercel (推荐)
本项目已预配置，可以直接部署到 Vercel：
1.  在 Vercel控制台导入项目。
2.  在 Settings -> Environment Variables 中配置 `.env.example` 中列出的所有环境变量。
3.  Vercel 会自动识别 Next.js 项目并进行构建部署。
