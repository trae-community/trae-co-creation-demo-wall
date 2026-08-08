# Clerk 到 NextAuth 迁移实施计划

## 项目概述

**目标**: 将认证系统从 Clerk 完全迁移到 NextAuth，支持 Docker 部署到国内服务器

**当前进度**: 40% (NextAuth 基础配置完成，但应用仍在使用 Clerk)

**预估工作量**: 7-11 小时

---

## 阶段划分

### 阶段 1: 核心认证基础设施 (优先级: 🔴 最高)

#### 任务 1.1: 更新中间件
**文件**: `src/middleware.ts`
**当前状态**: 使用 `clerkMiddleware`
**目标**: 替换为 NextAuth 认证

**实施步骤**:
1. 移除 Clerk 导入
2. 导入 NextAuth 的 `auth` 函数
3. 重写路由保护逻辑
4. 保持 i18n 路由处理不变
5. 保持 webhook 路由公开访问

**验证标准**:
- [ ] 受保护路由未登录时重定向到登录页
- [ ] 公开路由正常访问
- [ ] i18n 路由正常工作
- [ ] API 路由正常处理

---

#### 任务 1.2: 重构认证工具函数
**文件**: `src/lib/auth.ts`
**当前状态**: 使用 Clerk API (`auth()`, `currentUser()`, `clerkClient()`)
**目标**: 使用 NextAuth session

**实施步骤**:
1. 重命名当前文件为 `auth-clerk-backup.ts`
2. 创建新的 `auth.ts`
3. 实现新的 `getAuthUser()` 函数
   - 使用 NextAuth 的 `auth()` 获取 session
   - 从数据库查询用户角色
   - 返回兼容的 `AuthUser` 类型
4. 移除 `syncUserFromClerk()` 函数（不再需要）

**关键代码结构**:
```typescript
export type AuthUser = {
  userId: bigint;
  email: string;
  roles: string[];
};

export async function getAuthUser(): Promise<AuthUser | null> {
  // 使用 NextAuth session
  // 查询数据库获取角色
  // 返回 AuthUser
}
```

**验证标准**:
- [ ] `getAuthUser()` 返回正确的用户信息
- [ ] 角色信息正确加载
- [ ] 类型定义兼容现有代码

---

### 阶段 2: UI 组件替换 (优先级: 🔴 高)

#### 任务 2.1: 创建登录页面
**文件**: `src/app/[language]/sign-in/[[...sign-in]]/page.tsx`
**当前状态**: 使用 Clerk 的 `<SignIn>` 组件
**目标**: 自定义登录表单

**实施步骤**:
1. 创建登录表单组件
   - 邮箱输入
   - 密码输入
   - 记住我选项
   - 提交按钮
2. 使用 `react-hook-form` + `zod` 验证
3. 调用 NextAuth `signIn()` 函数
4. 保持现有深色主题样式
5. 添加错误处理和加载状态
6. 添加"注册"链接

**UI 要求**:
- 深色背景 (#0A0A0C)
- 绿色主题色 (#22C55E)
- 粒子背景效果
- 响应式设计

**验证标准**:
- [ ] 表单验证正常工作
- [ ] 登录成功后跳转正确
- [ ] 错误信息正确显示
- [ ] 样式与原设计一致

---

#### 任务 2.2: 创建注册页面
**文件**: `src/app/[language]/sign-up/[[...sign-up]]/page.tsx`
**当前状态**: 使用 Clerk 的 `<SignUp>` 组件
**目标**: 自定义注册表单

**实施步骤**:
1. 创建注册表单组件
   - 用户名输入
   - 邮箱输入
   - 密码输入
   - 确认密码输入
   - 提交按钮
2. 使用 `react-hook-form` + `zod` 验证
3. 调用 `/api/auth/register` API
4. 注册成功后自动登录
5. 保持现有深色主题样式
6. 添加"登录"链接

**验证标准**:
- [ ] 表单验证正常工作
- [ ] 注册成功后自动登录
- [ ] 错误信息正确显示
- [ ] 样式与原设计一致

---

### 阶段 3: API 路由更新 (优先级: 🟡 中)

#### 任务 3.1: 更新使用认证的 API 路由
**影响文件** (11 个):
1. `src/app/api/works/route.ts`
2. `src/app/api/works/likes/route.ts`
3. `src/app/api/works/[id]/stats/route.ts`
4. `src/app/api/works/[id]/like/route.ts`
5. `src/app/api/users/route.ts`
6. `src/app/api/tags/route.ts`
7. `src/app/api/submit/route.ts`
8. `src/app/api/roles/route.ts`
9. `src/app/api/profile/route.ts`
10. `src/app/api/console/works/route.ts`
11. `src/app/api/console/cities/stats/route.ts`

**实施步骤**:
1. 逐个文件更新
2. 替换 `getAuthUser()` 调用（导入路径不变）
3. 保持业务逻辑完全不变
4. 测试每个端点

**验证标准**:
- [ ] 所有 API 路由认证正常工作
- [ ] 业务逻辑无变化
- [ ] 错误处理正确

---

#### 任务 3.2: 移除 Clerk 相关路由
**文件**:
- `src/app/api/webhooks/clerk/route.ts` (删除)
- `src/app/api/auth/callback/route.ts` (检查是否仅用于 Clerk)

**实施步骤**:
1. 确认这些路由不再需要
2. 删除文件
3. 更新路由配置（如有）

**验证标准**:
- [ ] 删除的路由不影响其他功能
- [ ] 无死链接

---

### 阶段 4: 环境配置和依赖清理 (优先级: 🟢 低)

#### 任务 4.1: 更新环境变量
**文件**: `.env`, `.env.example`

**实施步骤**:
1. 添加 NextAuth 配置:
   ```env
   NEXTAUTH_SECRET=<生成随机密钥>
   NEXTAUTH_URL=http://localhost:3000
   ```
2. 移除 Clerk 配置:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
3. 更新 `.env.example` 文档

**验证标准**:
- [ ] NextAuth 配置正确
- [ ] 无 Clerk 环境变量残留

---

#### 任务 4.2: 清理依赖
**文件**: `package.json`

**实施步骤**:
1. 移除 Clerk 依赖:
   ```bash
   npm uninstall @clerk/nextjs @clerk/themes
   ```
2. 确认 NextAuth 依赖已安装:
   - `next-auth@^5.0.0-beta.30`
   - `@auth/prisma-adapter@^2.11.1`
   - `bcryptjs@^3.0.3`
3. 运行 `npm install` 清理 lock 文件

**验证标准**:
- [ ] Clerk 依赖已移除
- [ ] NextAuth 依赖正常
- [ ] 项目可正常构建

---

### 阶段 5: 数据库迁移（可选）

#### 任务 5.1: 清理 Clerk 数据
**文件**: Prisma migration

**选项 A: 保留兼容性**
- 保留 `clerkId` 字段
- 不做数据迁移
- 优点: 安全，可回滚

**选项 B: 完全清理**
- 移除 `clerkId` 字段
- 清理 Clerk 相关日志
- 优点: 数据库更干净

**推荐**: 选项 A（保留兼容性）

---

### 阶段 6: 测试和验证 (优先级: 🔴 最高)

#### 任务 6.1: 本地功能测试

**测试清单**:
- [ ] 用户注册流程
  - [ ] 表单验证
  - [ ] 注册成功
  - [ ] 自动登录
  - [ ] 默认角色分配
- [ ] 用户登录流程
  - [ ] 邮箱密码登录
  - [ ] 错误处理（错误密码、不存在的用户）
  - [ ] 登录成功跳转
- [ ] 用户登出流程
- [ ] 受保护路由访问
  - [ ] `/console` 需要登录
  - [ ] `/submit` 需要登录
  - [ ] `/profile` 需要登录
- [ ] API 认证
  - [ ] 所有需要认证的 API 正常工作
  - [ ] 未认证请求返回 401
- [ ] Session 持久化
  - [ ] 刷新页面保持登录状态
  - [ ] Session 过期处理

---

#### 任务 6.2: Docker 部署测试

**测试步骤**:
1. 构建 Docker 镜像:
   ```bash
   docker-compose build
   ```
2. 启动服务:
   ```bash
   docker-compose up -d
   ```
3. 运行数据库迁移:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```
4. 验证服务:
   - [ ] 应用可访问 (http://localhost:3000)
   - [ ] 数据库连接正常
   - [ ] Redis 连接正常
   - [ ] 注册登录流程正常

**验证标准**:
- [ ] Docker 镜像构建成功
- [ ] 所有服务正常启动
- [ ] 完整功能测试通过

---

## 风险和注意事项

### 高风险项
1. **Session 管理差异**
   - Clerk 使用自己的 session 机制
   - NextAuth 使用 JWT 或数据库 session
   - 需要确保 session 数据正确传递

2. **角色权限系统**
   - Clerk 的 `publicMetadata` 存储角色
   - NextAuth 需要从数据库查询
   - 可能影响性能，需要优化

3. **现有用户数据**
   - 保留 `clerkId` 字段避免数据丢失
   - 新用户不会有 `clerkId`

### 中风险项
1. **API 路由更新**
   - 11 个文件需要更新
   - 需要逐个测试

2. **UI 组件样式**
   - 需要复刻 Clerk 的深色主题
   - 保持用户体验一致

### 低风险项
1. **环境变量更新**
   - 简单的配置替换

2. **依赖清理**
   - 标准的 npm 操作

---

## 回滚计划

如果迁移失败，可以快速回滚：

1. **代码回滚**:
   ```bash
   git checkout <previous-commit>
   ```

2. **恢复 Clerk 配置**:
   - 恢复 `.env` 中的 Clerk 配置
   - 运行 `npm install` 恢复依赖

3. **数据库无需回滚**:
   - 因为保留了 `clerkId` 字段
   - NextAuth 表不影响现有数据

---

## 成功标准

### 功能完整性
- [ ] 所有认证功能正常工作
- [ ] 所有受保护路由正确保护
- [ ] 所有 API 端点认证正常
- [ ] 用户数据完整无损

### 性能标准
- [ ] 登录响应时间 < 1s
- [ ] API 认证开销 < 50ms
- [ ] 页面加载时间无明显增加

### 部署标准
- [ ] Docker 镜像构建成功
- [ ] 生产环境部署成功
- [ ] 国内服务器访问速度正常

---

## 执行顺序

**推荐执行顺序**:
1. 阶段 1 (核心认证) → 2. 阶段 2 (UI 组件) → 3. 阶段 3 (API 路由) → 4. 阶段 6 (测试) → 5. 阶段 4 (清理) → 6. 阶段 5 (可选)

**原因**: 先建立核心功能，再逐步替换外围组件，最后清理和优化。

---

## 时间估算

| 阶段 | 预估时间 | 优先级 |
|------|---------|--------|
| 阶段 1: 核心认证 | 2-3 小时 | 🔴 最高 |
| 阶段 2: UI 组件 | 2-3 小时 | 🔴 高 |
| 阶段 3: API 路由 | 2-3 小时 | 🟡 中 |
| 阶段 4: 清理 | 0.5-1 小时 | 🟢 低 |
| 阶段 5: 数据库 | 0-1 小时 | 🟢 可选 |
| 阶段 6: 测试 | 1-2 小时 | 🔴 最高 |
| **总计** | **7.5-13 小时** | - |

---

## 下一步行动

准备好开始执行时，按以下顺序进行：

1. ✅ 确认计划无误
2. 🔄 执行阶段 1.1: 更新中间件
3. 🔄 执行阶段 1.2: 重构认证工具
4. 🔄 执行阶段 2.1: 创建登录页面
5. 🔄 执行阶段 2.2: 创建注册页面
6. 🔄 执行阶段 3.1: 更新 API 路由
7. 🔄 执行阶段 6.1: 本地测试
8. 🔄 执行阶段 4: 清理依赖
9. 🔄 执行阶段 6.2: Docker 测试

---

**计划创建时间**: 2026-03-27
**计划版本**: v1.0
**负责人**: AI Assistant + 开发团队
