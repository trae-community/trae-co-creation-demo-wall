# 开发规范文档

## 目录结构

本项目采用 Next.js App Router 架构，并遵循 `src` 目录规范。核心代码位于 `src` 目录下，`app` 目录仅作为路由定义层。

### 根目录结构

```
/
├── docs/                   # 项目开发文档
├── prisma/                 # 数据库模型与迁移脚本
│   ├── schema.prisma       # Prisma 数据模型定义
│   └── schema.sql          # 数据库初始化 SQL
├── public/                 # 静态资源 (favicon, robots.txt 等)
├── src/                    # 核心源码
│   ├── app/                # 路由定义层 (Next.js App Router)
│   ├── assets/             # 静态资源 (css, images 等)
│   ├── components/         # 通用组件
│   ├── data/               # 静态数据/Mock数据
│   ├── hooks/              # 自定义 Hooks
│   ├── i18n/               # 国际化配置
│   ├── lib/                # 工具函数与库封装
│   ├── messages/           # 国际化语言包 (json)
│   ├── features/              # 页面业务逻辑实现 (View Layer)
│   ├── services/           # 后端业务逻辑实现 (Service Layer)
│   ├── types/              # TypeScript 类型定义
│   └── middleware.ts       # 中间件
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略配置
├── components.json         # shadcn/ui 配置文件
├── eslint.config.js        # ESLint 配置文件
├── next.config.ts          # Next.js 配置文件
├── package.json            # 项目依赖配置
├── postcss.config.js       # PostCSS 配置文件
├── tailwind.config.js      # Tailwind CSS 配置文件
├── tsconfig.json           # TypeScript 配置文件
└── vercel.json             # Vercel 部署配置
```

### 详细说明

#### 1. `src/app/` (Route Layer)
*   **职责**：仅负责定义 URL 路由结构、Layout 布局嵌套、Loading/Error 状态处理以及 Metadata 配置。
*   **规范**：`page.tsx` 文件中应尽量减少业务逻辑，主要负责引入并渲染 `src/features/` 下对应的页面组件。

#### 2. `src/features/` (View Layer)
*   **职责**：包含具体的页面业务逻辑、状态管理和视图渲染。
*   **规范**：与 `src/app` 目录下的路由结构尽量保持映射关系，方便查找。
    *   例如：`src/app/[locale]/home/page.tsx` -> `src/features/home/page.tsx`

#### 3. `src/components/`
*   **职责**：存放可复用的 UI 组件。
*   **规范**：
    *   `ui/`：存放基础 UI 组件（如 Button, Input 等）。
    *   其他：存放业务相关的复用组件。

#### 4. `src/i18n/` & `src/messages/`
*   **职责**：国际化相关配置。
*   **规范**：
    *   `messages/*.json`：存放各语言的翻译文本。
    *   `i18n/request.ts`：Next-intl 的请求配置。

#### 5. `src/lib/` & `src/hooks/`
*   **职责**：
    *   `lib/`：存放工具函数、API 客户端封装、数据库连接等。
    *   `hooks/`：存放 React Custom Hooks。

#### 6. `src/services/` (Service Layer)
*   **职责**：存放后端业务逻辑，被 `src/app/api/` 下的路由处理函数调用。
*   **规范**：
    *   处理数据库操作、第三方 API 调用等核心业务逻辑。
    *   保持 `src/app/api/` 层轻量，仅负责请求参数解析和响应格式化。

## 开发流程规范

1.  **新建页面**：
    *   在 `src/app/[locale]/` 下创建路由文件夹和 `page.tsx`。
    *   在 `src/features/` 下创建对应的页面组件文件。
    *   在 `src/app/**/page.tsx` 中引入并使用 `src/features/**` 组件。

2.  **样式管理**：
    *   全局样式：`src/assets/globals.css`。
    *   组件样式：推荐使用 Tailwind CSS。

3.  **类型定义**：
    *   通用类型定义在 `src/types/index.ts`。
    *   组件特定类型可定义在组件文件内或同级目录。

4.  **国际化**：
    *   所有用户可见文本必须使用 `next-intl` 进行国际化处理。
    *   翻译键值对存放在 `src/messages/` 下的 JSON 文件中。
