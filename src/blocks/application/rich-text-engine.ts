import { Extension, Mark, Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ContentsView } from "./rich-text-contents";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Mention from "@tiptap/extension-mention";

const Contents = Node.create({
  name: "contents",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML: () => [{ tag: "nav[data-type=contents]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "nav",
    mergeAttributes(HTMLAttributes, { "data-type": "contents" }),
    "Contents",
  ],
  addNodeView: () => ReactNodeViewRenderer(ContentsView),
});

const revisionMark = (name: string, tag: string) =>
  Mark.create({
    name,
    inclusive: false,
    addAttributes: () => ({
      revision: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-revision"),
        renderHTML: (attributes) => ({ "data-revision": attributes.revision }),
      },
    }),
    parseHTML: () => [{ tag: `${tag}[data-revision]` }],
    renderHTML: ({ HTMLAttributes }) => [tag, mergeAttributes(HTMLAttributes), 0],
  });
const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  addAttributes: () => ({
    id: {
      default: null,
      parseHTML: (element) => element.getAttribute("data-comment"),
      renderHTML: (attributes) => ({ "data-comment": attributes.id }),
    },
  }),
  parseHTML: () => [{ tag: "mark[data-comment]" }],
  renderHTML: ({ HTMLAttributes }) => ["mark", mergeAttributes(HTMLAttributes), 0],
});
const DocumentAttributes = Extension.create({
  name: "documentAttributes",
  addGlobalAttributes: () => [
    { types: ["paragraph"], attributes: { class: { default: null } } },
    { types: ["heading"], attributes: { id: { default: null } } },
  ],
});

export function editorExtensions() {
  return [
    StarterKit.configure({
      link: { openOnClick: false, protocols: ["https", "http", "mailto"] },
      undoRedo: { newGroupDelay: 300 },
    }),
    TableKit.configure({ table: { resizable: true, allowTableNodeSelection: true } }),
    TextStyleKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Contents,
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Mention.configure({
      HTMLAttributes: { class: "document-mention" },
      renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
    }),
    revisionMark("revisionInsert", "ins"),
    revisionMark("revisionDelete", "del"),
    CommentMark,
    DocumentAttributes,
  ];
}

/** Preserve older independent sample documents while moving them into Tiptap's schema. */
export function normalizeDocument(html: string) {
  const root = new DOMParser().parseFromString(html, "text/html");
  root.querySelectorAll("ul[data-task-list]").forEach((list) => {
    list.setAttribute("data-type", "taskList");
    for (const item of Array.from(list.children)) {
      const input = item.querySelector("input");
      item.setAttribute("data-type", "taskItem");
      item.setAttribute("data-checked", String(input?.hasAttribute("checked") ?? false));
      input?.remove();
      if (!item.querySelector("p")) {
        const paragraph = document.createElement("p");
        paragraph.append(...Array.from(item.childNodes));
        item.append(paragraph);
      }
    }
  });
  return root.body.innerHTML;
}

export function runEditorCommand(editor: Editor, name: string, value?: string) {
  const chain = editor.chain().focus();
  switch (name) {
    case "bold":
      return chain.toggleBold().run();
    case "italic":
      return chain.toggleItalic().run();
    case "underline":
      return chain.toggleUnderline().run();
    case "strikeThrough":
      return chain.toggleStrike().run();
    case "insertUnorderedList":
      return chain.toggleBulletList().run();
    case "insertOrderedList":
      return chain.toggleOrderedList().run();
    case "formatBlock":
      if (value === "blockquote") return chain.toggleBlockquote().run();
      if (value && /^h[123]$/.test(value))
        return chain.toggleHeading({ level: Number(value[1]) as 1 | 2 | 3 }).run();
      return chain.setParagraph().run();
    case "foreColor":
      return chain.setColor(value || "#262626").run();
    case "hiliteColor":
      return chain.toggleHighlight({ color: value || "#fef08a" }).run();
    case "insertText":
      return chain.insertContent(value || "").run();
    case "insertHTML":
      return chain.insertContent(normalizeDocument(value || "")).run();
    default:
      return false;
  }
}
