import { useCallback, useSyncExternalStore } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Checkbox } from "@/components/ui/checkbox";

/** Reuse the installed registry checkbox while TaskItem owns document updates and nesting. */
export function RichTextTaskItem({ editor, node, updateAttributes }: NodeViewProps) {
  const subscribe = useCallback(
    (notify: () => void) => {
      editor.on("update", notify);
      return () => {
        editor.off("update", notify);
      };
    },
    [editor],
  );
  const editable = useSyncExternalStore(subscribe, () => editor.isEditable);
  return (
    <NodeViewWrapper className="rich-text-task-body">
      <label contentEditable={false} className="rich-text-task-check">
        <Checkbox
          checked={Boolean(node.attrs.checked)}
          disabled={!editable}
          aria-label={node.textContent.trim() || "Complete task"}
          onCheckedChange={(checked) => {
            if (editor.isEditable) updateAttributes({ checked: checked === true });
          }}
        />
      </label>
      <NodeViewContent as="div" />
    </NodeViewWrapper>
  );
}
