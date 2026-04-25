# CRUD 组件与分页接口使用说明

## 1. 组件与 Hook 位置

当前目录已按领域拆分，CRUD 相关能力统一位于：

- `src/components/crud/crud-feedback.tsx`
- `src/components/crud/crud-filter-bar.tsx`
- `src/components/crud/crud-pagination.tsx`
- `src/hooks/use-feedback.ts`

### 1.1 CrudFeedback
用于展示统一的成功/失败/提示反馈。

**使用方式**
```tsx
import { CrudFeedback } from '@/components/crud/crud-feedback'
import { useFeedback } from '@/hooks/use-feedback'

const { feedback, showFeedback } = useFeedback()

<CrudFeedback feedback={feedback} />
```

### 1.2 CrudFilterBar
用于统一搜索与筛选 UI。

**使用方式**
```tsx
import { CrudFilterBar } from '@/components/crud/crud-filter-bar'

<CrudFilterBar
  searchPlaceholder="搜索标签名称..."
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  filterValue={filterMode}
  filterOptions={[
    { value: 'all', label: '全部标签' },
    { value: 'auto', label: '自动过审' },
    { value: 'manual', label: '手动审核' },
  ]}
  onFilterChange={(val) => setFilterMode(val as TagFilter)}
  filterPlaceholder="筛选标签"
/>
```

### 1.3 CrudPagination
用于统一分页 UI。

**使用方式**
```tsx
import { CrudPagination } from '@/components/crud/crud-pagination'

<CrudPagination
  totalItems={totalItems}
  startIndex={startIndex}
  endIndex={endIndex}
  current={current}
  totalPages={totalPages}
  onPrev={() => setCurrentPage(current - 1)}
  onNext={() => setCurrentPage(current + 1)}
/>
```

### 1.4 useFeedback
用于统一反馈状态管理（显示与自动消失）。

**使用方式**
```tsx
import { useFeedback } from '@/hooks/use-feedback'

const { feedback, showFeedback } = useFeedback()
showFeedback('success', '保存成功')
```

## 2. 统一查询参数

统一参数定义位于：
```
src/lib/crud.ts
```

包含：
- CRUD_QUERY_PARAMS: page, pageSize, query, filter
- DICT_FILTERS: all | system | custom
- TAG_FILTERS: all | auto | manual
- normalizeFilter: 过滤参数的安全兜底

## 3. 字典管理 API

### 3.1 分页查询
```
GET /api/dictionaries?page=1&pageSize=6&query=gender&filter=system
```

响应结构：
```json
{
  "items": [],
  "total": 120,
  "page": 1,
  "pageSize": 6
}
```

### 3.2 新建字典
```
POST /api/dictionaries
```
```json
{
  "type": "dict",
  "data": {
    "dictCode": "gender",
    "dictName": "性别",
    "description": "性别字典",
    "isSystem": false
  }
}
```

### 3.3 新建字典项
```
POST /api/dictionaries
```
```json
{
  "type": "item",
  "data": {
    "dictCode": "gender",
    "itemLabel": "男",
    "itemValue": "1",
    "labelI18n": {"zh-CN": "男", "en-US": "Male"},
    "sortOrder": 0,
    "status": true
  }
}
```

**v0.5 新增：层级关系**

对于需要层级关系的字典（如城市属于国家），可使用 `parentValue` 字段：
```json
{
  "type": "item",
  "data": {
    "dictCode": "city",
    "itemLabel": "北京",
    "itemValue": "110100",
    "labelI18n": {"zh-CN": "北京", "en-US": "Beijing"},
    "parentValue": "CN",
    "sortOrder": 0,
    "status": true
  }
}
```
- `parentValue`：父级值，用于建立层级关系（如城市→国家）
- 前端会根据选择的父级自动过滤子级选项

### 3.4 更新字典
```
PUT /api/dictionaries
```
```json
{
  "type": "dict",
  "id": "1",
  "data": {
    "dictName": "性别",
    "description": "更新说明"
  }
}
```

### 3.5 更新字典项
```
PUT /api/dictionaries
```
```json
{
  "type": "item",
  "id": "10",
  "data": {
    "itemLabel": "Male",
    "itemValue": "1",
    "labelI18n": {"zh-CN": "男", "en-US": "Male"},
    "parentValue": "CN",
    "sortOrder": 0,
    "status": true
  }
}
```

### 3.6 删除
```
DELETE /api/dictionaries?type=dict&id=1
DELETE /api/dictionaries?type=item&id=10
```

## 4. 标签管理 API

### 4.1 分页查询
```
GET /api/tags?page=1&pageSize=8&query=hack&filter=auto
```

响应结构：
```json
{
  "items": [],
  "total": 120,
  "page": 1,
  "pageSize": 8
}
```

### 4.2 新建标签
```
POST /api/tags
```
```json
{
  "name": "2026春季黑客松",
  "isAutoAudit": true,
  "auditStartTime": "2026-03-01T00:00:00",
  "auditEndTime": "2026-03-31T23:59:59"
}
```

### 4.3 更新标签
```
PUT /api/tags
```
```json
{
  "id": 3,
  "name": "社区推荐",
  "isAutoAudit": false,
  "auditStartTime": null,
  "auditEndTime": null
}
```

### 4.4 删除标签
```
DELETE /api/tags?id=3
```
