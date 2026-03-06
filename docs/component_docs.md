# 组件文档

## 目录

- [通用组件](#通用组件)
- [CRUD 组件](#crud-组件)
- [作品相关组件](#作品相关组件)
- [UI 组件](#ui-组件)

---

## 通用组件

### ActionButton

通用按钮组件，支持加载状态。

**位置**: `src/components/common/action-button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  children: React.ReactNode
}
```

**使用示例**:
```tsx
import { Button } from '@/components/common/action-button'

<Button variant="default" size="lg" onClick={handleSubmit}>
  提交
</Button>

<Button isLoading={isSaving}>
  保存中...
</Button>
```

---

### EmptyState

空状态展示组件。

**位置**: `src/components/common/empty-state.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}
```

---

### FormSelect

表单下拉选择组件。

**位置**: `src/components/common/form-select.tsx`

**Props**:
```typescript
interface SelectProps {
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  icon?: React.ReactNode
}
```

---

### LoadingOverlay

加载遮罩层组件。

**位置**: `src/components/common/loading-overlay.tsx`

---

## CRUD 组件

### CrudFeedback

统一反馈组件，展示操作成功/失败信息。

**位置**: `src/components/crud/crud-feedback.tsx`

**使用**:
```tsx
import { CrudFeedback } from '@/components/crud/crud-feedback'
import { useFeedback } from '@/hooks/use-feedback'

const { feedback, showFeedback } = useFeedback()

<CrudFeedback feedback={feedback} />

// 显示反馈
showFeedback('success', '保存成功')
showFeedback('error', '操作失败')
```

---

### CrudFilterBar

统一搜索筛选栏组件。

**位置**: `src/components/crud/crud-filter-bar.tsx`

**Props**:
```typescript
interface CrudFilterBarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterValue: string
  filterOptions: Array<{ value: string; label: string }>
  onFilterChange: (value: string) => void
  filterPlaceholder?: string
}
```

---

### CrudPagination

统一分页组件。

**位置**: `src/components/crud/crud-pagination.tsx`

**Props**:
```typescript
interface CrudPaginationProps {
  totalItems: number
  startIndex: number
  endIndex: number
  current: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}
```

**显示格式**: `显示 1-10 共 100 条记录`

---

## 作品相关组件

### WorkCard

作品卡片组件，用于列表展示。

**位置**: `src/components/work/work-card.tsx`

**Props**:
```typescript
interface WorkCardProps {
  work: {
    id: string
    name: string
    intro: string
    coverUrl: string
    views: number
    likes: number
    tags: string[]
    author: {
      name: string
      avatar: string | null
    }
  }
}
```

---

### LikedWorks

我的点赞列表组件。

**位置**: `src/components/work/liked-works.tsx`

**特性**:
- 分页展示点赞作品（每页 3 条）
- 支持上一页/下一页翻页
- 显示分页信息：`显示 1-3 共 5 条记录`

**Props**:
```typescript
interface LikedWorksProps {
  userId: string
}
```

---

### EditForm

作品编辑表单组件。

**位置**: `src/components/work/edit-form.tsx`

**功能**:
- 编辑作品信息
- 上传封面图和截图
- 管理团队成员
- 城市选择支持层级过滤（根据选择的国家过滤城市）

---

### CityFilter

城市筛选组件（首页筛选栏）。

**位置**: `src/components/work/city-filter.tsx`

---

### WorksManagement

作品管理组件（后台管理）。

**位置**: `src/components/work/works-management.tsx`

**功能**:
- 分页列表展示作品
- 搜索过滤
- 作品审核
- 标签管理
- 荣誉授予
- 删除作品

---

## UI 组件

项目使用 [shadcn/ui](https://ui.shadcn.com/) 组件库，组件位于 `src/components/ui/`：

| 组件 | 用途 |
|------|------|
| button | 按钮 |
| card | 卡片容器 |
| checkbox | 复选框 |
| dialog | 对话框 |
| form | 表单 |
| input | 输入框 |
| label | 标签 |
| select | 下拉选择 |
| separator | 分隔线 |
| textarea | 多行文本框 |
| badge | 标签/徽章 |

---

## Hooks

### useFeedback

统一反馈状态管理 Hook。

**位置**: `src/hooks/use-feedback.ts`

**使用**:
```tsx
import { useFeedback } from '@/hooks/use-feedback'

const { feedback, showFeedback } = useFeedback()

// feedback 结构
// { type: 'success' | 'error' | 'info', message: string }

// 显示反馈（3秒后自动消失）
showFeedback('success', '操作成功')
showFeedback('error', '操作失败')
showFeedback('info', '提示信息')
```
