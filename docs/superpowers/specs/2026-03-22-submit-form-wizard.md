# 提交表单重设计：Step Wizard + 富文本故事

**Status**: Reviewed & Updated

## XSS 防护

story 字段需要服务端 sanitization，安装 `sanitize-html`：

```bash
npm install sanitize-html @types/sanitize-html
```

在 `src/app/api/submit/route.ts` 提交前对 story 做 sanitization：

```ts
import sanitizeHtml from 'sanitize-html';

const cleanStory = sanitizeHtml(data.story, {
  allowedTags: ['p','br','strong','em','u','s','h2','h3','ul','ol','li','a','blockquote','code'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
});
```

Tiptap Link extension 配置限制协议：

```ts
Link.configure({
  protocols: ['http', 'https', 'mailto'],
  validate: href => /^https?:\/\//.test(href) || href.startsWith('mailto:'),
})
```

详情页渲染：

```tsx
<div
  className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
  dangerouslySetInnerHTML={{ __html: work.story || '<p>-</p>' }}
/>
```

## story 后端校验修正

去标签后校验纯文本长度：

```ts
story: z.string()
  .transform(s => ({ raw: s, text: s.replace(/<[^>]*>/g, '').trim() }))
  .refine(({ text }) => text.length >= 10, '创作故事至少10个字')
  .transform(({ raw }) => raw),
```

## 导航行为规范

### handleBack
`handleBack` 直接 `setCurrentStep(s => s - 1)`，**不调用 trigger()**，保留已填内容，不阻塞回退。

### handleNext
```ts
const [isNavigating, setIsNavigating] = useState(false)

const handleNext = async () => {
  setIsNavigating(true)
  const valid = await trigger(STEP_FIELDS[currentStep])
  setIsNavigating(false)
  if (valid) setCurrentStep(s => (s + 1) as StepNumber)
}
```
Next 按钮在 `isNavigating` 期间禁用，防止重复点击。

### StepIndicator 点击
已完成步骤**可以点击**回退（不需要重新校验），等价于 `setCurrentStep(n)`。
**不允许**点击未到达的步骤跳进（防止跳过校验）。

```ts
// StepIndicator 点击处理
const handleStepClick = (n: StepNumber) => {
  if (n < currentStep) setCurrentStep(n) // 只允许回退
}
```

## 组件挂载策略

所有步骤组件**始终挂载**，使用 CSS 控制显示/隐藏，保护上传预览的 state：

```tsx
<div className={currentStep === 1 ? 'block' : 'hidden'}><Step1 ... /></div>
<div className={currentStep === 2 ? 'block' : 'hidden'}><Step2 ... /></div>
...
```

上传相关状态（`previewCoverUrl`、`previewScreenshots`）保留在各步骤组件内部，因为组件不卸载所以 state 不会丢失。

## EditForm 兼容

`src/components/work/edit-form.tsx` 中的 `story` 字段也需要同步升级为 Tiptap 编辑器，否则编辑时会显示 HTML 源码。

文件改动清单新增：`src/components/work/edit-form.tsx`（story textarea → Tiptap RichTextEditor）

## Tiptap Controller 集成方式

```tsx
<Controller
  name="story"
  control={control}
  render={({ field }) => (
    <RichTextEditor value={field.value} onChange={field.onChange} />
  )}
/>
```

## STEP_FIELDS 类型

```ts
type StepNumber = 1 | 2 | 3 | 4

const STEP_FIELDS: Record<StepNumber, (keyof SubmissionFormValues)[]> = {
  1: ['name', 'intro', 'country', 'city', 'category', 'devStatus', 'tags'],
  2: ['coverUrl', 'screenshots'],
  3: ['story', 'highlights', 'scenarios', 'demoUrl'],
  4: ['team'],
} as const
```

## 历史数据兼容

已有 DB 记录的 story 是纯文本，加载进 Tiptap 时会被自动包裹为 `<p>` 标签。`dangerouslySetInnerHTML` 渲染纯文本也是安全的（纯文本不含标签）。无需数据迁移。

## 目标

1. 将单页长表单（~710行，20+输入项）重构为 4 步向导（Step Wizard）
2. 「创作故事」字段改为 Tiptap 富文本编辑器，存储 HTML
3. 保持所有已有的校验逻辑、字段定义和 API 接口不变

---

## 步骤划分

| Step | 标题 | 字段 |
|------|------|------|
| 1 | 基本信息 | 项目名称、一句话简介、国家、城市、项目类别、开发状态、标签 |
| 2 | 视觉素材 | 封面图、项目截图（1-5张） |
| 3 | 创作详情 | 创作故事（富文本）、核心亮点（3-5条）、使用场景、Demo链接、Repo链接 |
| 4 | 团队信息 | 团队成员、团队介绍、联系电话、联系邮箱 |

---

## 架构设计

### 组件结构

```
src/app/[language]/submit/
  page.tsx                     ← 不变，引用 SubmissionForm
  submission-form.tsx          ← 重写：Step Wizard 容器
  steps/
    StepIndicator.tsx          ← 顶部进度条组件
    Step1BasicInfo.tsx         ← 步骤1
    Step2VisualAssets.tsx      ← 步骤2
    Step3Content.tsx           ← 步骤3（含 Tiptap）
    Step4Team.tsx              ← 步骤4
  editor/
    RichTextEditor.tsx         ← Tiptap 封装组件
```

### 状态管理

使用 `react-hook-form` 的单个 `useForm` 实例贯穿所有步骤（不拆多个 form）。

- `form` 实例在 `SubmissionForm` 中创建，通过 props 传递给各步骤组件
- 每步的「下一步」按钮触发 `trigger([...fieldsInThisStep])` 进行**局部校验**，通过后才 `setStep(step + 1)`
- 最后一步的「提交」触发 `handleSubmit(onSubmit)`

### Step 切换逻辑

```ts
const STEP_FIELDS = {
  1: ['name', 'intro', 'country', 'city', 'category', 'devStatus', 'tags'],
  2: ['coverUrl', 'screenshots'],
  3: ['story', 'highlights', 'scenarios', 'demoUrl', 'repoUrl'],
  4: ['team', 'teamIntro', 'contactPhone', 'contactEmail'],
}

const handleNext = async () => {
  const valid = await trigger(STEP_FIELDS[currentStep])
  if (valid) setCurrentStep(s => s + 1)
}
```

### StepIndicator 设计

```
[1 基本信息] — [2 视觉素材] — [3 创作详情] — [4 团队信息]
  ● filled      ● filled       ○ current      ○ pending
```

- 已完成步骤：绿色填充圆 + 勾
- 当前步骤：绿色环 + 数字
- 未到步骤：灰色环 + 数字
- 步骤之间连接线：已完成段落变绿

---

## 富文本编辑器（Tiptap）

### 安装依赖

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-underline
```

### RichTextEditor 组件

- 工具栏：**B** / *I* / <u>U</u> / ~~S~~ / H2 / H3 / 无序列表 / 有序列表 / 链接 / 清除格式
- 输出 HTML（`editor.getHTML()`）
- 通过 `onChange(html: string)` 回调与 react-hook-form 集成
- 最小高度 200px，支持暗色主题（使用 `prose-invert` 样式）

### 数据库兼容

- `story` 字段类型已是 `TEXT`，HTML 字符串直接存储，**无需 DB migration**
- 后端 `z.string().min(20)` 的校验对 HTML 字符串也适用（但要注意 HTML 标签会计入长度）
  - 建议修改为对 `strip_tags` 后的纯文本校验，改为 `min(10)` 更合理
  - 或保持现有校验，前端提示用户"内容至少20字"即可

### 详情页渲染

`work-detail-view.tsx` 里的故事区域：

```tsx
// 原来
{work.story || '-'}

// 改为
<div
  className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
  dangerouslySetInnerHTML={{ __html: work.story || '<p>-</p>' }}
/>
```

---

## 文件改动清单

| 文件 | 改动 |
|------|------|
| `src/app/[language]/submit/submission-form.tsx` | 重写为 Step Wizard 容器，保留 form/schema/submit 逻辑 |
| `src/app/[language]/submit/steps/StepIndicator.tsx` | 新建：进度条组件 |
| `src/app/[language]/submit/steps/Step1BasicInfo.tsx` | 新建：步骤1 |
| `src/app/[language]/submit/steps/Step2VisualAssets.tsx` | 新建：步骤2 |
| `src/app/[language]/submit/steps/Step3Content.tsx` | 新建：步骤3（含 Tiptap） |
| `src/app/[language]/submit/steps/Step4Team.tsx` | 新建：步骤4 |
| `src/app/[language]/submit/editor/RichTextEditor.tsx` | 新建：Tiptap 封装 |
| `src/app/[language]/works/[id]/work-detail-view.tsx` | story 区域改为 dangerouslySetInnerHTML |
| `src/app/api/submit/route.ts` | story 校验改为 `min(10)`（去标签后内容更短） |
| `package.json` | 添加 Tiptap 相关依赖 |

---

## UI 设计细节

### 整体布局
- 最大宽度 `max-w-2xl`（比原来的 `max-w-3xl` 窄一些，更聚焦）
- 顶部 StepIndicator（固定，不随内容滚动）
- 内容区 card，底部 Prev/Next 按钮区

### 步骤切换动画
- 使用 CSS `transition-all` + `translate-x` 做滑动切换
- 或简单的 `opacity` fade（改动更小）

### 按钮区
```
[← 上一步]                                [下一步 →]
                                      （最后一步为 [提交作品]）
```

### 草稿保存（Out of Scope）
暂不实现，后续迭代可加 `localStorage` 自动保存。

---

## 关键决策

### 为什么用单个 form 实例而不是每步独立 form？
多 form 实例需要在步骤间传递数据，复杂且容易出错。单实例配合局部 `trigger` 是 react-hook-form 官方推荐的多步骤表单做法。

### Tiptap starter-kit 已包含哪些扩展？
Bold、Italic、Strike、Code、CodeBlock、Blockquote、BulletList、OrderedList、ListItem、Heading、HorizontalRule、Paragraph、Text、History。
额外安装：Underline（starter-kit 不含）、Link、Placeholder。
