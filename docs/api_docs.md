# API 接口文档

## 目录

- [作品相关](#作品相关)
- [字典相关](#字典相关)
- [用户相关](#用户相关)
- [标签相关](#标签相关)
- [文件上传](#文件上传)
- [提交作品](#提交作品)

---

## 作品相关

### 获取作品列表

```
GET /api/works
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| pageSize | number | 每页数量，默认 12 |
| search | string | 搜索关键词 |
| city | string | 城市筛选（逗号分隔） |
| country | string | 国家筛选（逗号分隔） |
| category | string | 分类筛选（逗号分隔） |
| tags | string | 标签筛选（逗号分隔） |
| lang | string | 语言，zh-CN/en-US/ja-JP |
| sort | string | 排序方式，newest/likes/views |

**响应**:
```json
{
  "items": [
    {
      "id": "1",
      "name": "项目名称",
      "intro": "一句话简介",
      "coverUrl": "https://...",
      "city": "北京",
      "country": "中国",
      "category": "AI",
      "views": 100,
      "likes": 50,
      "tags": ["AI", "开源"],
      "author": {
        "name": "用户名",
        "avatar": "https://..."
      }
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 12,
  "totalPages": 9
}
```

---

### 获取作品详情

```
GET /api/works/[id]
```

**响应**:
```json
{
  "id": "1",
  "name": "项目名称",
  "intro": "一句话简介",
  "coverUrl": "https://...",
  "city": "北京",
  "country": "中国",
  "category": "AI",
  "views": 100,
  "likes": 50,
  "tags": ["AI", "开源"],
  "author": {
    "name": "用户名",
    "avatar": "https://..."
  },
  "story": "创作故事...",
  "highlights": ["亮点1", "亮点2"],
  "scenarios": ["场景1", "场景2"],
  "screenshots": ["url1", "url2"],
  "demoUrl": "https://demo...",
  "repoUrl": "https://github...",
  "team": ["成员1", "成员2"],
  "teamIntro": "团队介绍",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 点赞/取消点赞作品

```
POST /api/works/[id]/like
```

**响应**:
```json
{
  "liked": true  // true=点赞成功，false=取消点赞
}
```

---

### 获取我的点赞列表

```
GET /api/works/likes
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| pageSize | number | 每页数量，默认 12 |

**响应**:
```json
{
  "items": [
    {
      "id": "1",
      "name": "项目名称",
      "intro": "简介",
      "coverUrl": "https://...",
      "views": 100,
      "likes": 50,
      "tags": ["AI"],
      "likedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 3,
  "totalPages": 4
}
```

---

### 更新作品

```
PUT /api/works
```

**请求体**:
```json
{
  "id": "1",
  "name": "项目名称",
  "intro": "一句话简介",
  "country": "CN",
  "city": "110100",
  "category": "AI",
  "devStatus": "production",
  "tags": [1, 2, 3],
  "team": "[\"成员1\", \"成员2\"]",
  "teamIntro": "团队介绍",
  "contactPhone": "13800138000",
  "contactEmail": "test@example.com",
  "coverUrl": "https://...",
  "story": "创作故事...",
  "highlights": ["亮点1", "亮点2"],
  "scenarios": ["场景1"],
  "screenshots": ["url1", "url2"],
  "demoUrl": "https://demo...",
  "repoUrl": "https://github..."
}
```

---

## 字典相关

### 获取字典列表

```
GET /api/dictionaries
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页数量 |
| query | string | 搜索关键词 |
| filter | string | 筛选，all/system/custom |

**响应**:
```json
{
  "items": [
    {
      "id": "1",
      "dictCode": "country",
      "dictName": "国家",
      "description": "国家字典",
      "isSystem": true,
      "items": [
        {
          "id": "1",
          "dictCode": "country",
          "itemLabel": "中国",
          "itemValue": "CN",
          "labelI18n": {"zh-CN": "中国", "en-US": "China"},
          "parentValue": null,
          "sortOrder": 0,
          "status": true
        }
      ]
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 6
}
```

---

### 获取单个字典（包含所有项）

```
GET /api/dictionaries?code=country&lang=zh-CN
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 字典编码 |
| lang | string | 语言，zh-CN/en-US/ja-JP |

---

### 创建字典

```
POST /api/dictionaries
```

**请求体**:
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

---

### 创建字典项

```
POST /api/dictionaries
```

**请求体**:
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

---

### 更新字典项

```
PUT /api/dictionaries
```

**请求体**:
```json
{
  "type": "item",
  "id": "10",
  "data": {
    "itemLabel": "北京",
    "itemValue": "110100",
    "labelI18n": {"zh-CN": "北京", "en-US": "Beijing"},
    "parentValue": "CN",
    "sortOrder": 0,
    "status": true
  }
}
```

---

### 删除字典或字典项

```
DELETE /api/dictionaries?type=dict&id=1
DELETE /api/dictionaries?type=item&id=10
```

---

## 用户相关

### 获取用户列表

```
GET /api/users
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页数量 |
| query | string | 搜索关键词 |

---

### 获取个人资料

```
GET /api/profile
```

**响应**:
```json
{
  "profile": {
    "id": "1",
    "username": "用户名",
    "email": "email@example.com",
    "avatarUrl": "https://...",
    "bio": "个人简介",
    "phone": "13800138000",
    "locationCountry": "CN",
    "locationCity": "110100",
    "lastSignInAt": "2024-01-01T00:00:00Z",
    "workCount": 5,
    "totalViews": 1000,
    "totalLikes": 100
  }
}
```

---

### 更新个人资料

```
PUT /api/profile
```

**请求体**:
```json
{
  "bio": "个人简介",
  "phone": "13800138000",
  "locationCountry": "CN",
  "locationCity": "110100"
}
```

---

## 标签相关

### 获取标签列表

```
GET /api/tags
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码 |
| pageSize | number | 每页数量 |
| query | string | 搜索关键词 |
| filter | string | 筛选，all/auto/manual |

---

### 获取所有标签（无分页）

```
GET /api/tags/all
```

---

### 创建标签

```
POST /api/tags
```

**请求体**:
```json
{
  "name": "AI",
  "isAutoAudit": false
}
```

---

### 更新标签

```
PUT /api/tags
```

**请求体**:
```json
{
  "id": 1,
  "name": "AI",
  "isAutoAudit": true,
  "auditStartTime": "2024-01-01T00:00:00Z",
  "auditEndTime": "2024-12-31T23:59:59Z"
}
```

---

### 删除标签

```
DELETE /api/tags?id=1
```

---

## 文件上传

### 上传文件

```
POST /api/file
```

**请求**: multipart/form-data

**字段**: file (File)

**响应**:
```json
{
  "success": true,
  "url": "https://storage.example.com/uploads/xxx.jpg"
}
```

---

## 提交作品

### 提交新作品

```
POST /api/submit
```

**请求体**:
```json
{
  "name": "项目名称",
  "intro": "一句话简介",
  "country": "CN",
  "city": "110100",
  "category": "AI",
  "devStatus": "production",
  "tags": [1, 2, 3],
  "team": "[\"成员1\", \"成员2\"]",
  "teamIntro": "团队介绍",
  "contactPhone": "13800138000",
  "contactEmail": "test@example.com",
  "coverUrl": "https://...",
  "story": "创作故事...",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "scenarios": ["场景1"],
  "screenshots": ["url1", "url2"],
  "demoUrl": "https://demo...",
  "repoUrl": "https://github..."
}
```

**响应**:
```json
{
  "success": true,
  "id": "1"
}
```
