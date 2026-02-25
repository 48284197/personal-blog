'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { useEffect, useCallback, useRef } from 'react'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Undo, Redo, Link as LinkIcon,
  Heading1, Heading2, Heading3, RemoveFormatting, ImageIcon, Loader2,
} from 'lucide-react'
import { useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ content, onChange, placeholder, minHeight = '360px' }: RichTextEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-cyan-400 underline' } }),
      Placeholder.configure({ placeholder: placeholder || '开始写作...' }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full border border-slate-800' } }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none outline-none text-slate-300 px-4 py-3',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external content changes
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (content !== current) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('输入链接 URL：', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
      alert('图片上传失败，请重试')
    } finally {
      setUploadingImage(false)
    }
  }, [editor])

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = ''
  }, [handleImageUpload])

  if (!editor) return (
    <div className="border border-slate-800 bg-[#0e0e1a]" style={{ minHeight }} />
  )

  const Btn = ({
    onClick, active = false, title, children, disabled = false,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-sm transition-colors disabled:opacity-40 ${
        active
          ? 'text-cyan-400 bg-cyan-500/15'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
      }`}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-4 bg-slate-800 mx-0.5 self-center" />

  return (
    <div className="border border-slate-800 focus-within:border-cyan-500/40 transition-colors bg-[#0e0e1a]">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-800 bg-[#080810]/60">
        {/* Text format */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗体 (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
          <Strikethrough className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="行内代码">
          <Code className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={setLink} active={editor.isActive('link')} title="链接">
          <LinkIcon className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Headings */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="标题 1">
          <Heading1 className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="标题 2">
          <Heading2 className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="标题 3">
          <Heading3 className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
          <List className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
          <ListOrdered className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
          <Quote className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="代码块">
          <span className="text-xs font-mono leading-none px-0.5">{`</>`}</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="分割线">
          <Minus className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Image upload */}
        <Btn
          onClick={() => imageInputRef.current?.click()}
          active={false}
          title="插入图片"
          disabled={uploadingImage}
        >
          {uploadingImage
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ImageIcon className="w-3.5 h-3.5" />
          }
        </Btn>

        <Sep />

        {/* History */}
        <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} active={false} title="清除格式">
          <RemoveFormatting className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().undo().run()} active={false} title="撤销 (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} active={false} title="重做 (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </Btn>

        {/* Word count */}
        <div className="ml-auto text-xs font-mono text-slate-700 pr-1">
          {editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} 字
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}
