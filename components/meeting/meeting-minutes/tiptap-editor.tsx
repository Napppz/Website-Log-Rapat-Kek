'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content?: JSONContent | null;
  onChange?: (json: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Tuliskan catatan di sini...',
  editable = true,
  minHeight = '140px',
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-700 underline font-medium hover:text-amber-900',
        },
      }),
    ],
    content: content || '',
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm prose-amber max-w-none focus:outline-none p-3.5 text-slate-800 leading-relaxed text-[13px]',
          'prose-headings:font-bold prose-headings:text-slate-900',
          'prose-h2:text-[16px] prose-h2:mb-1.5 prose-h2:mt-3',
          'prose-h3:text-[14px] prose-h3:mb-1 prose-h3:mt-2',
          'prose-p:my-1',
          'prose-ul:my-1.5 prose-ul:list-disc prose-ul:pl-5',
          'prose-ol:my-1.5 prose-ol:list-decimal prose-ol:pl-5',
          'prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-slate-600'
        ),
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  // Sync content when prop changes externally
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = JSON.stringify(content);
      if (currentJson !== newJson) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-amber-200/80 bg-slate-50/50 p-4 animate-pulse flex items-center justify-center text-slate-400 text-[12px]"
        style={{ minHeight }}
      >
        Memuat editor notulen...
      </div>
    );
  }

  // If read-only preview mode without toolbar
  if (!editable) {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50/20 p-2">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL Tautan:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-amber-50/60 border-b border-amber-200/80 text-slate-600 select-none">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('bold')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Tebal (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('italic')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Miring (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('underline')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Garis Bawah (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-amber-200 mx-1" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('heading', { level: 2 })
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Subjudul Utama (H2)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('heading', { level: 3 })
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Subjudul Poin (H3)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-amber-200 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('bulletList')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Daftar Poin (Bullet List)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('orderedList')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Daftar Nomor (Numbered List)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('blockquote')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Kutipan / Pernyataan Penting"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={cn(
            'p-1.5 rounded-md text-[12px] transition-colors',
            editor.isActive('link')
              ? 'bg-amber-600 text-white font-bold'
              : 'hover:bg-amber-200/60 text-slate-700'
          )}
          title="Sisipkan Tautan"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-amber-200 mx-1 ml-auto" />

        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-[12px] hover:bg-amber-200/60 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Batal (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md text-[12px] hover:bg-amber-200/60 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Ulangi (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
