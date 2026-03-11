<template>
  <div class="rich-text-editor">
    <div v-if="editor" class="rich-text-editor-toolbar">
      <button
        type="button"
        :class="{ active: editor.isActive('bold') }"
        title="Tučné"
        @click="editor.chain().focus().toggleBold().run()"
      >
        B
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('italic') }"
        title="Kurzíva"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        I
      </button>
      <span class="toolbar-separator"></span>
      <button
        type="button"
        :class="{ active: editor.isActive('heading', { level: 2 }) }"
        title="Nadpis 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        H2
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('heading', { level: 3 }) }"
        title="Nadpis 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        H3
      </button>
      <span class="toolbar-separator"></span>
      <button
        type="button"
        :class="{ active: editor.isActive('bulletList') }"
        title="Odrážky"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        &bull;
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('orderedList') }"
        title="Číslovaný seznam"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        1.
      </button>
      <button
        type="button"
        :class="{ active: editor.isActive('blockquote') }"
        title="Citace"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        &ldquo;
      </button>
      <span class="toolbar-separator"></span>
      <button
        type="button"
        :class="{ active: editor.isActive('link') }"
        title="Odkaz"
        @click="toggleLink"
      >
        🔗
      </button>
      <span class="toolbar-separator"></span>
      <button
        type="button"
        title="Zpět"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        ↩
      </button>
      <button
        type="button"
        title="Vpřed"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        ↪
      </button>
    </div>
    <EditorContent :editor class="rich-text-editor-content" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"

const model = defineModel<string>({ default: "" })

const editor = useEditor({
  content: model.value,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
    }),
    Link.configure({
      openOnClick: false,
    }),
  ],
  onUpdate({ editor }) {
    const html = editor.getHTML()
    model.value = html === "<p></p>" ? "" : html
  },
})

watch(model, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue || "", { emitUpdate: false })
  }
})

function toggleLink() {
  if (!editor.value) {
    return
  }

  if (editor.value.isActive("link")) {
    editor.value.chain().focus().unsetLink().run()
    return
  }

  const url = window.prompt("URL odkazu:")
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.rich-text-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: var(--space-xs, 0.5rem);
  border-bottom: 1px solid #ccc;
  background-color: #f8f8f8;
}

.rich-text-editor-toolbar button {
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  min-width: 2rem;
  text-align: center;
}

.rich-text-editor-toolbar button:hover {
  background-color: #e0e0e0;
}

.rich-text-editor-toolbar button.active {
  background-color: #d0d0d0;
  border-color: #aaa;
}

.rich-text-editor-toolbar button:disabled {
  opacity: 0.3;
  cursor: default;
}

.toolbar-separator {
  width: 1px;
  background-color: #ccc;
  margin: 2px 4px;
}

.rich-text-editor-content {
  padding: var(--space-s, 0.75rem);
}

.rich-text-editor-content :deep(.tiptap) {
  min-height: 20rem;
  outline: none;
}

.rich-text-editor-content :deep(.tiptap h2) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.rich-text-editor-content :deep(.tiptap h3) {
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.rich-text-editor-content :deep(.tiptap p) {
  margin-bottom: 0.5rem;
}

.rich-text-editor-content :deep(.tiptap ul),
.rich-text-editor-content :deep(.tiptap ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.rich-text-editor-content :deep(.tiptap blockquote) {
  border-left: 3px solid #ccc;
  padding-left: 1rem;
  margin-left: 0;
  color: #666;
}

.rich-text-editor-content :deep(.tiptap a) {
  color: #1a73e8;
  text-decoration: underline;
}
</style>
