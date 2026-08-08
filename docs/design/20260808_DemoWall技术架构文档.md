# 技术架构文档

## 1. 技术栈选择

- **前端框架**: React 18 + TypeScript
  - 选择理由: 组件化开发，生态丰富，类型安全，易于维护。
- **构建工具**: Vite
  - 选择理由: 极速冷启动，HMR (热模块替换)，配置简单。
- **样式方案**: Tailwind CSS
  - 选择理由: 原子化 CSS，开发效率高，易于实现响应式设计和统一的设计系统。
- **路由管理**: React Router v6
  - 选择理由: 标准的 React 路由解决方案，支持声明式路由定义。
- **状态管理**: Zustand
  - 选择理由: 轻量级，API 简洁，无样板代码，适合本项目的规模。
- **表单处理**: React Hook Form + Zod
  - 选择理由: 高性能表单处理，配合 Zod 进行强大的 Schema 校验。
- **图标库**: Lucide React
  - 选择理由: 风格统一，体积小，易于定制。
- **数据存储**: 本地 JSON 文件 (模拟后端)
  - 选择理由: 静态网站，无需复杂后端，方便部署和迁移。
- **部署**: Vercel / Cloudflare Pages
  - 选择理由: 免费，支持静态站点托管，集成 CI/CD。

## 2. 项目结构

```
src/
├── assets/          # 静态资源 (图片, SVG 等)
├── components/      # 公共组件
│   ├── ui/          # 基础 UI 组件 (Button, Input, Card 等)
│   ├── layout/      # 布局组件 (Header, Footer, Layout)
│   └── business/    # 业务组件 (ProjectCard, FilterBar)
├── hooks/           # 自定义 Hooks
├── lib/             # 工具函数 (utils, constants)
├── features/           # 页面组件
│   ├── Home/        # 首页
│   ├── City/        # 城市分赛区页
│   ├── Project/     # 项目独立页
│   └── Submit/      # 提交页
├── router/          # 路由配置
├── store/           # Zustand 状态管理
├── types/           # TypeScript 类型定义
├── App.tsx          # 根组件
└── main.tsx         # 入口文件
```

## 3. 数据结构设计

### Project (项目)

```typescript
interface Project {
  id: string;               // 唯一标识 (UUID)
  title: string;            // 项目名称
  summary: string;          // 一句话简介 (100字以内)
  city: string;             // 所属城市
  teamMembers: string[];    // 团队成员
  coverImage: string;       // 封面图 URL (Base64 或 外部链接)
  description: {            // 项目内容
    problem: string;        // 解决的问题 (HTML/Markdown)
    solution: string;       // 实现方案 (HTML/Markdown)
  };
  links: {                  // 外部链接
    demo: string;           // Demo 链接
    repo?: string;          // 代码仓库链接 (可选)
    video?: string;         // 录屏视频链接 (可选)
  };
  isRecommended?: boolean;  // 是否城市优选
  createdAt: string;        // 创建时间 (ISO 8601)
}
```

### City (城市)

```typescript
interface City {
  id: string;
  name: string;
  description?: string;
}
```

## 4. 关键技术实现

### 4.1 数据流

- **提交端**: 表单数据 -> Zod 校验 -> 生成 Project 对象 -> 导出 JSON 文件 (下载)。
- **展示端**: 加载 JSON 数据 (fetch 或 import) -> Zustand Store -> 页面渲染。

### 4.2 图片处理

- 由于是纯静态网站，图片上传将采用 `FileReader` 读取为 Base64 字符串存储在 JSON 中，或者让用户输入外部图片链接。考虑到 Base64 会显著增加 JSON 体积，建议 V1.0 版本限制图片大小或优先推荐使用图床链接。若必须本地上传，将限制图片分辨率和压缩质量。

### 4.3 路由设计

- `/`: 首页
- `/city/:cityName`: 城市分赛区页
- `/project/:projectId`: 项目独立页
- `/submit`: 作品提交页

### 4.4 扩展性设计

- **组件解耦**: UI 组件与业务逻辑分离。
- **类型定义**: 严格的 TypeScript 类型定义，方便未来接入后端 API。
- **Mock API**: 将数据获取封装为 Async 函数，未来替换为真实 API 调用即可。
