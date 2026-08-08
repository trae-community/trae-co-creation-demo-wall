# 贡献指南

感谢参与 TRAE DEMO WALL 的开发。本文档约定了分支流程、提交规范与提交前自检清单。

## 开发环境

本地开发推荐「Next.js dev server + Docker 数据库」模式，详见 [README.md](README.md) 的「本地开发」章节。

## 分支流程

1. 主分支为 `master`，不直接向 `master` 推送未经验证的改动。
2. 功能开发使用 `feat/<描述>` 分支，修复使用 `fix/<描述>` 分支。
3. 一个分支聚焦一个功能/修复，避免混合多个不相关的改动。
4. 合并前确保本地与 `master` 同步，并解决冲突。

## 提交规范（Conventional Commits）

采用 Conventional Commits 格式，**提交信息使用英文**：

```
<type>(<scope>): <subject>
```

### type（必填）

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档变更 |
| `style` | 不影响逻辑的格式调整（空格、分号等） |
| `refactor` | 既非新功能也非修复的重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建、依赖、配置等杂项 |

### scope（建议填写）

使用受影响的模块名，常用值：`users`、`roles`、`works`、`filter`、`auth`、`city`、`tags`、`docker`、`prisma`、`i18n`。

### subject 要求

- 英文，祈使句，首字母小写，结尾不加句号
- 不超过 72 字符，说清楚「做了什么」而不是「改了哪个文件」

### 示例

```
feat(users): add role filter to user management
feat(roles): lock builtin roles and grant admin access to city data
fix(filter): prevent empty string value in role select
chore(docker): add development database service
```

### 拆分原则

- **按功能拆分提交**：一次提交只做一件事，多个功能拆成多个 commit
- **不提交本地环境改动**：`.env`、本地启动脚本调试痕迹、IDE 配置等不进入提交
- **数据库迁移**：`prisma/migrations/` 与产生它的 schema 改动一起提交

## 提交前自检清单

```bash
npm run lint        # ESLint 检查
npx tsc --noEmit    # TypeScript 类型检查
npm run build       # 生产构建验证（涉及部署时）
```

同时确认：

- [ ] 功能在本地 dev server 实际验证过（含多语言页面，如适用）
- [ ] 新增用户可见文案已同步三语翻译（`src/assets/translations/*.json`）
- [ ] 后台 API 已加角色鉴权（参考 [development-guide.md](docs/guides/development-guide.md) 安全规范）
- [ ] 无 console.log 调试残留、无未使用的导入

## 代码规范

命名、目录组织、国际化、安全开发等规范见 [docs/guides/development-guide.md](docs/guides/development-guide.md)。

## UI 一致性

新增界面元素时复用现有设计语言：

- 筛选交互统一使用 `CityFilter` 组件与 `DatePicker` 组件
- 颜色沿用绿色主题（`#22C55E` → `#16A34A` 渐变、`bg-green-500/15` 高亮）
- 卡片/弹窗沿用深色风格（`border-white/10`、圆角 `rounded-xl`）
