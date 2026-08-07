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
│   │   ├── console/                # 控制台（用户/角色/作品/标签/日志等）
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── profile/                # 个人主页
│   │   ├── submit/
│   │   │   ├── page.tsx
│   │   │   └── submission-form.tsx
│   │   └── works/[id]/
│   │       ├── page.tsx
│   │       └── work-detail-view.tsx
│   ├── api/                        # API 路由
│   └── layout.tsx
├── assets/
│   ├── globals.css
│   └── translations/               # zh-CN / en-US / ja-JP
├── components/
│   ├── ui/                         # shadcn 基础组件（含 date-picker）
│   ├── common/                     # 通用业务组件
│   ├── layout/                     # 布局组件
│   ├── work/                       # 作品域组件（city-filter/works-management 等）
│   └── crud/                       # CRUD 相关组件
├── lib/
│   ├── language/                   # i18n 路由与请求配置
│   ├── auth.ts / auth-nextauth.ts  # 鉴权与角色判断
│   ├── prisma.ts / crud.ts / types.ts / utils.ts
│   ├── use-feedback.ts / use-works.ts  # Hook
│   └── works-store.ts              # Zustand store
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

- Hook 文件统一 `use-*.ts`：如 `use-feedback.ts`、`use-works.ts`。
- Hook 放 `src/lib/`，避免与 UI 组件混放，职责更清晰。

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
   - 放在 `src/lib/`，命名 `use-*.ts`。  
   - 避免把 hook 放在 `components/` 内，除非该 hook 仅服务某个组件且不复用。

4. 类型与工具  
   - 通用类型放 `src/lib/types.ts`。  
   - 公共常量与过滤参数放 `src/lib/crud.ts`。  
   - 公共函数放 `src/lib/utils.ts`。

## 国际化
   - 所有用户可见文案走 `next-intl`。
   - 文案文件放在 `src/assets/translations/*.json`，三语（zh-CN / en-US / ja-JP）同步维护。

## 数据库迁移

项目使用 **Prisma** 作为 ORM，迁移记录位于 `prisma/migrations/`，种子数据见 `prisma/seed.ts`。

### 常用命令

```bash
# 生成 Prisma 客户端（schema 变更后需要）
npx prisma generate

# 开发环境：创建并应用迁移
npx prisma migrate dev --name <描述>

# 部署/本地初始化：应用已有迁移
npx prisma migrate deploy

# 初始化种子数据（内置角色、字典等）
npm run seed
```

### 迁移提交规范

- 迁移目录与产生它的 schema 改动一起提交。
- 历史手写 SQL 迁移已归档至 `docs/archive/db/`，仅作参考。

## 安全开发规范

### 后台 API 鉴权

所有后台管理接口必须添加角色鉴权：

```typescript
import { isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // 业务逻辑
}
```

### 作品可见性控制

前台作品详情接口必须检查作品状态：

```typescript
const isOwner = currentUser && work.userId === currentUser.userId;
const isAdminUser = isAdmin(currentUser);
const isApproved = work.statistic?.auditStatus === 1;
const isVisible = work.statistic?.displayStatus === 1;

if (!isOwner && !isAdminUser && (!isApproved || !isVisible)) {
  return NextResponse.json({ error: 'Work not found' }, { status: 404 });
}
```

### 角色体系约束

系统固定三个内置角色（`root` / `admin` / `common`），API 层禁止新增/修改/删除（见 `src/app/api/roles/route.ts`）；同时禁止给用户分配 `root` 角色：

```typescript
if (roleIds.includes(ROOT_ROLE_ID)) {
  return NextResponse.json({ error: 'Cannot assign root role' }, { status: 403 });
}
```
