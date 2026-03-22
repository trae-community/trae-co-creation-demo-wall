'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Link as LinkIcon, RemoveFormatting
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  hasError?: boolean
}

const ToolbarButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded-md transition-colors text-zinc-400 hover:text-white hover:bg-white/10",
      active && "bg-white/10 text-white"
    )}
  >
    {children}
  </button>
)

export function RichTextEditor({ value, onChange, placeholder, hasError }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Disable code block to keep toolbar simple
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        protocols: ['http', 'https', 'mailto'],
        validate: (href) => /^https?:\/\//.test(href) || href.startsWith('mailto:'),
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || '请填写创作故事...',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-zinc-200 leading-relaxed',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. form reset or initialData load)
  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (value !== undefined && value !== currentHtml) {
      // Only update if content actually differs, to avoid cursor reset
      // Use false to keep cursor position; the overloaded signature only takes 2 args in this version
      editor.commands.setContent(value || '')
    }
  }, [editor, value])

  if (!editor) return null

  const handleSetLink = () => {
    const url = window.prompt('请输入链接地址 (https://...)')
    if (!url) return
    if (!/^https?:\/\//.test(url) && !url.startsWith('mailto:')) {
      window.alert('请输入有效的 http/https 或 mailto 链接')
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        hasError ? "border-red-500/60" : "border-zinc-700",
        "focus-within:border-green-500/50"
      )}
      style={{ background: 'rgba(24, 24, 27, 0.5)' }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-zinc-700/60">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="加粗 (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="下划线 (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="二级标题">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="三级标题">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <ToolbarButton onClick={handleSetLink} active={editor.isActive('link')} title="插入链接">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="清除格式">
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
