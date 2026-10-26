import { NodeViewWrapper, useEditorState, type NodeViewProps } from "@tiptap/react";

export function ContentsView({ editor }: NodeViewProps) {
  const headings = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      const items: { text: string; level: number; pos: number }[] = [];
      instance.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading")
          items.push({ text: node.textContent, level: node.attrs.level, pos });
      });
      return items;
    },
  });
  return (
    <NodeViewWrapper className="rich-text-contents" contentEditable={false}>
      <strong>Contents</strong>
      <nav aria-label="Contents">
        {headings.map((heading) => (
          <button
            key={heading.pos}
            type="button"
            style={{ paddingLeft: (heading.level - 1) * 16 }}
            onClick={() => {
              const node = editor.view.nodeDOM(heading.pos);
              if (node instanceof HTMLElement)
                node.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            {heading.text || "Untitled section"}
          </button>
        ))}
      </nav>
    </NodeViewWrapper>
  );
}
