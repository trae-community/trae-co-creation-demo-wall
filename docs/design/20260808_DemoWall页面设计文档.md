# 页面设计文档

## 1. 总体风格 (Visual Style)

- **主题色**: 科技蓝 (`#0066FF`)
- **背景色**: 浅灰 (`#F5F5F5`) / 白 (`#FFFFFF`)
- **字体**: 系统默认无衬线字体 (Inter, Roboto, system-ui, etc.)
- **布局**: 响应式网格布局 (Grid System)
- **圆角**: `rounded-lg` (8px) 或 `rounded-xl` (12px)
- **阴影**: `shadow-sm` (默认), `shadow-md` (悬停)

## 2. 页面详细设计

### 2.1 首页 (Home)

- **Header (顶部导航)**
  - Logo / 活动名称 (左侧)
  - 导航链接: 首页, 提交作品 (右侧)
- **Hero Section (Banner)**
  - 全宽背景图/渐变色
  - 标题: "比赛作品展示平台"
  - 副标题/简介: "展示优秀参赛作品"
  - 装饰元素: 科技感线条/粒子
- **Filter Bar (筛选栏)**
  - 城市下拉菜单 (Select)
  - "城市优选" 开关/Tab
- **Project Grid (项目列表)**
  - 响应式布局: 
    - Desktop: 4列
    - Tablet: 2-3列
    - Mobile: 1列
  - **Project Card (项目卡片)**
    - 封面图 (16:9, 顶部)
    - 内容区 (白色背景, padding)
      - 标题 (截断, 2行)
      - 简介 (截断, 2行, text-gray-500)
      - 底部信息:
        - 城市标签 (可点击)
        - 团队成员 (Avatar 或 文本)
        - "优选" 徽章 (右上角或标题旁)
- **Footer (页脚)**
  - 版权信息
  - 联系方式

### 2.2 城市分赛区页 (City Page)

- **Header**: 复用全局 Header
- **City Hero**:
  - 城市名称 (大标题)
  - 城市简介 (文本)
- **Project List**:
  - 复用首页的 Project Grid
  - 默认筛选该城市的所有项目
  - 排序: 优选项目置顶

### 2.3 项目独立页 (Project Detail)

- **Header**: 复用全局 Header
- **Top Info (顶部信息区)**
  - 左右布局 (Desktop) / 上下布局 (Mobile)
  - **左侧**: 封面图 (大图, 圆角)
  - **右侧**:
    - 项目名称 (H1)
    - 标签组: 城市, 优选
    - 一句话简介 (Lead text)
    - 团队成员列表
    - 外部链接按钮组 (Demo - 主要按钮, Repo - 次要按钮)
    - 分享按钮 (Icon Button)
- **Content Section (内容详情区)**
  - 卡片式容器 (白色背景, shadow)
  - **Tab 1: 解决的问题** (富文本/Markdown 渲染)
  - **Tab 2: 实现方案** (富文本/Markdown 渲染)
  - (或者直接垂直排列，使用标题分隔)

### 2.4 作品提交页 (Submit)

- **Layout**: 单栏居中布局 (最大宽度 800px)
- **Form Header**: 标题 "提交参赛作品"
- **Form Sections**:
  1. **基础信息**
     - 项目名称 (Input)
     - 一句话简介 (Textarea, 限制字数)
     - 所属城市 (Select)
     - 团队成员 (Dynamic Input List / Tag Input)
  2. **项目封面**
     - 图片上传区域 (Drag & Drop)
     - 预览图
  3. **项目内容**
     - 解决的问题 (Rich Text Editor / Textarea)
     - 实现方案 (Rich Text Editor / Textarea)
  4. **外部链接**
     - Demo 链接 (Input URL)
     - 代码仓库链接 (Input URL, Optional)
     - 视频链接 (Input URL, Optional)
- **Form Footer**:
  - 提交按钮 (Primary, Large)
  - 导出 JSON 按钮 (Secondary) - *注: 提交后生成并下载*

## 3. 组件清单 (Component List)

- `Button` (Primary, Secondary, Outline, Ghost)
- `Input`, `Textarea`, `Select`
- `Card` (Container)
- `Badge` (Tag)
- `ProjectCard` (业务组件)
- `Layout` (Header + Main + Footer)
- `RichTextEditor` (Simple wrapper around textarea or library)
- `ImageUpload` (File input + Preview)
