"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { useState, useEffect, useCallback } from "react";
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Undo, Redo, Save, Loader2,
} from "lucide-react";

interface WordEditorProps {
  documentId: string;
  onSaved?: () => void;
}

export default function WordEditor({ documentId, onSaved }: WordEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  useEffect(() => {
    fetch(`/api/documents/${documentId}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data.html && editor) {
          editor.commands.setContent(data.html);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentId, editor]);

  const save = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    const html = editor.getHTML();
    const res = await fetch(`/api/documents/${documentId}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("บันทึกแล้ว");
      setTimeout(() => setSavedMsg(""), 3000);
      onSaved?.();
    } else {
      setSavedMsg("เกิดข้อผิดพลาด");
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }, [editor, documentId, onSaved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">กำลังโหลดเอกสาร...</span>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}>
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}>
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })}>
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign("justify").run()} active={editor?.isActive({ textAlign: "justify" })}>
          <AlignJustify className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolbarBtn>

        {/* Heading select */}
        <select
          className="ml-1 text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") editor?.chain().focus().setParagraph().run();
            else editor?.chain().focus().toggleHeading({ level: parseInt(val) as 1|2|3 }).run();
          }}
          defaultValue="p"
        >
          <option value="p">ย่อหน้า</option>
          <option value="1">หัวข้อ 1</option>
          <option value="2">หัวข้อ 2</option>
          <option value="3">หัวข้อ 3</option>
        </select>

        <div className="flex-1" />

        {savedMsg && (
          <span className={`text-xs px-2 py-1 rounded ${savedMsg === "บันทึกแล้ว" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {savedMsg}
          </span>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
