# 开发规范文档

## 当前规范结论

当前命名规范遵循以下组合标准，属于工程上常见且可维护的方案：

- Next.js App Router 约定式路由标准（`page.tsx`、`layout.tsx`、`route.ts`、`[segment]`）。
- React/TypeScript 社区惯例（Hook 以 `use-` 开头，组件导出用 PascalCase）。
- 文件系统可读性规范（文件名使用 kebab-case，目录按领域分组）。

## 当前目录结构

核心代码位于 `src`，结构如下：

```text
src/
├── app/
│   ├── [language]/                 # 国际化路由段（Next.js 动态段）
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── console/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── submit/
│   │   │   ├── page.tsx
│   │   │   └── submission-form.tsx
│   │   └── works/[id]/
│   │       ├── page.tsx
│   │       └── work-detail-view.tsx
│   ├── api/
│   ├── test/
│   └── layout.tsx
├── assets/
│   ├── globals.css
│   └── translations/
├── components/
│   ├── ui/                         # shadcn 基础组件
│   ├── common/                     # 通用业务组件
│   ├── layout/                     # 布局组件
│   ├── work/                       # 作品域组件
│   └── crud/                       # CRUD 相关组件
├── hooks/
│   └── use-feedback.ts
├── lib/
│   ├── language/                   # i18n 路由与请求配置
│   ├── crud.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── auth.ts
│   ├── prisma.ts
│   └── supabase.ts
└── middleware.ts
```

## 命名规则

### 1) 路由与文件名

- 路由保留 Next.js 约定文件名：`page.tsx`、`layout.tsx`、`route.ts`。
- 动态路由必须使用方括号：如 `[language]`、`[id]`。
- 非约定页面文件使用语义化 kebab-case：如 `submission-form.tsx`、`work-detail-view.tsx`。

### 2) 组件命名

- 组件文件名统一 kebab-case：`site-layout.tsx`、`work-card.tsx`。
- 组件导出名统一 PascalCase：`SiteLayout`、`WorkCard`。
- 按业务域分目录：`layout/`、`work/`、`crud/`、`common/`、`ui/`。

### 3) Hook 命名

- Hook 文件统一 `use-*.ts`：如 `use-feedback.ts`。
- Hook 放 `src/hooks/`，避免与 UI 组件混放，职责更清晰。

### 4) 国际化命名

- 路由段使用 `[language]`，表示 URL 语言参数。
- i18n 配置统一放 `src/lib/language/`。
- 翻译资源统一放 `src/assets/translations/`。

## 开发流程规范

1. 新建页面  
   - 在 `src/app/[language]/...` 新建路由目录及 `page.tsx`。  
   - 页面复杂逻辑可以拆到同级语义文件（如 `xxx-view.tsx`、`xxx-form.tsx`）。

2. 新建组件  
   - 根据用途放入 `components/common|layout|work|crud|ui`。  
   - 文件名使用 kebab-case，导出名使用 PascalCase。

3. 新建 Hook  
   - 放在 `src/hooks/`，命名 `use-*.ts`。  
   - 避免把 hook 放在 `components/` 内，除非该 hook 仅服务某个组件且不复用。

4. 类型与工具  
   - 通用类型放 `src/lib/types.ts`。  
   - 公共常量与过滤参数放 `src/lib/crud.ts`。  
   - 公共函数放 `src/lib/utils.ts`。

5. 国际化  
   - 所有用户可见文案走 `next-intl`。  
   - 文案文件放在 `src/assets/translations/*.json`。

## E2E 测试

项目使用 **Playwright** 进行端到端测试，用例位于 `e2e/` 目录。

*   **运行测试**：`npm run test:e2e`（需先启动开发服务 `npm run dev`，或由 Playwright 复用已有服务）。
*   **UI 模式**：`npm run test:e2e:ui` 可打开 Playwright 界面调试。
*   **覆盖范围**：首页展示与导航、作品详情页、浏览量/点赞展示、未登录点赞跳转登录等。
