# 🎨 品牌资源 (Brand Assets)

## 📁 目录结构

```
src/assets/brand/
├── logo.png           ← Logo PNG 格式（黑色背景）
└── logo.svg           ← Logo SVG 格式（黑色背景）
```

---

## 🖼️ Logo 文件说明

### 绿色品牌色 Logo（主Logo）
- **位置**: `src/assets/logo.svg`
- **用途**: Header、页面主体、所有应用内展示
- **特点**: 透明背景，品牌绿 (#32F08C)
- **使用方式**: `import logo from '@/assets/logo.svg'`

### 黑色背景 Logo（辅助Logo）
- **位置**: `src/assets/brand/logo.svg` / `logo.png`
- **用途**: 演示素材、设计参考、特定场景
- **特点**: 黑色背景，品牌绿
- **来源**: 需求分析阶段提供

---

## 🎯 使用指南

### 1. Header 导航栏（使用绿色品牌色 Logo）

```tsx
// src/components/layout/site-layout.tsx
import logo from '@/assets/logo.svg';

<img src={logo} alt="TRAE Demo Wall" className="h-8 w-auto" />
```

### 2. Favicon（浏览器标签页图标）

```html
<!-- src/app/[language]/layout.tsx -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/trae.ico" type="image/x-icon" />
```

---

## 🎨 品牌颜色

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 品牌绿 | `#32F08C` | Logo、主要操作按钮、高亮 |
| 深黑 | `#0A0B0D` | 背景、文字 |
| 纯白 | `#FFFFFF` | 文字、卡片背景 |

---

## 📐 Logo 规范

### 最小尺寸
- **水平排列**: 最小高度 32px
- **方形排列**: 最小尺寸 32×32px

### 安全间距
- Logo 周围至少保留 1 倍 Logo 高度的空白空间

### 错误用法
- ❌ 修改 Logo 颜色
- ❌ 拉伸或压缩 Logo
- ❌ 添加阴影、描边等效果
- ❌ 在复杂背景上使用（除非确保对比度）

---

## 📦 其他静态资源

### Favicon
- **位置**: `public/favicon.svg` (32×32px, SVG)
- **位置**: `public/trae.ico` (ICO 格式，兼容旧版浏览器)
- **访问方式**: `/favicon.svg`, `/trae.ico`

### 占位图
- **位置**: `public/images/work-placeholder.svg`
- **用途**: 作品封面加载失败时的占位显示
- **访问方式**: `/images/work-placeholder.svg`

---

## 🔗 相关文档

- [Next.js 静态资源指南](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [品牌设计规范](../../docs/design/)
- [项目概要设计](../../docs/design/)

---

## ⚠️ 注意事项

1. **不要删除或重命名**这些文件，它们被代码直接引用
2. **不要提交**大型品牌源文件（如 PSD、AI）到 Git
3. **更新 Logo 时**，需要同步更新：
   - `src/assets/logo.svg`（主 Logo）
   - `public/favicon.svg`（浏览器图标）
   - `public/trae.ico`（兼容图标）
4. **国际化**: Logo 的 SVG 文件中包含多语言文本时需特别注意

---

*最后更新: 2026-08-08*
