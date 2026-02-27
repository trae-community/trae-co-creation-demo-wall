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

- **前端框架**: React + Vite
- **样式**: Tailwind CSS
- **路由**: React Router DOM
- **表单**: React Hook Form + Zod
- **图标**: Lucide React

## 开发指南

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

3. 构建生产版本:
   ```bash
   npm run build
   ```

## 数据管理

目前项目数据存储在 `src/data/projects.ts` 中。在实际部署中，可以通过将提交的 JSON 数据合并到此文件中来更新展示内容。

## 部署指南

### Vercel (推荐)
本项目已预配置 `vercel.json`，可以直接部署：
1. 安装 Vercel CLI: `npm i -g vercel`
2. 登录并部署: `vercel`
3. 生产环境部署: `vercel --prod`

或者直接将代码推送到 GitHub，并在 Vercel 官网导入项目，Vercel 会自动识别 Vite 项目并进行部署。

### Netlify
本项目已预配置 `public/_redirects` 以支持 SPA 路由：
1. 直接拖拽 `dist` 文件夹到 Netlify Drop。
2. 或者连接 GitHub 仓库自动部署，Build command: `npm run build`, Publish directory: `dist`。

### GitHub Pages
若需部署到 GitHub Pages，请在 `vite.config.ts` 中设置 `base` 为你的仓库名（例如 `base: '/repo-name/'`），然后构建并发布 `dist` 目录。
