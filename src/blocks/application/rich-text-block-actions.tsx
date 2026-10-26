import { useState } from "react";
import { useEditorState } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import {
  GripVertical,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

export function RichTextBlockActions({
  editor,
  onInsert,
  onLink,
  fluid = false,
}: {
  editor: Editor;
  fluid?: boolean;
  onInsert: () => void;
  onLink: () => void;
}) {
  const [position, setPosition] = useState(-1);
  const tableActive = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance.isActive("table"),
  });
  function changeBlock(
    action: "duplicate" | "delete" | "up" | "down" | "paragraph" | "h1" | "h2" | "quote",
  ) {
    const node = position >= 0 ? editor.state.doc.nodeAt(position) : null;
    if (!node) return;
    const end = position + node.nodeSize;
    if (action === "delete") editor.chain().focus().deleteRange({ from: position, to: end }).run();
    else if (action === "duplicate")
      editor.chain().focus().insertContentAt(end, node.toJSON()).run();
    else if (action === "up" && position > 0) {
      const previous = editor.state.doc.resolve(position).nodeBefore;
      if (previous)
        editor
          .chain()
          .focus()
          .deleteRange({ from: position, to: end })
          .insertContentAt(position - previous.nodeSize, node.toJSON())
          .run();
    } else if (action === "down") {
      const next = editor.state.doc.resolve(end).nodeAfter;
      if (next)
        editor
          .chain()
          .focus()
          .deleteRange({ from: position, to: end })
          .insertContentAt(position + next.nodeSize, node.toJSON())
          .run();
    } else {
      const chain = editor
        .chain()
        .focus()
        .setTextSelection(position + 1);
      if (action === "paragraph") chain.setParagraph().run();
      if (action === "h1") chain.setHeading({ level: 1 }).run();
      if (action === "h2") chain.setHeading({ level: 2 }).run();
      if (action === "quote") chain.toggleBlockquote().run();
    }
  }
  return (
    <>
      {editor.isEditable && (
        <DragHandle editor={editor} onNodeChange={({ pos }) => setPosition(pos)}>
          <div className="rich-text-gutter">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Add block below"
              onClick={() => {
                const node = editor.state.doc.nodeAt(position);
                if (!node) return;
                editor
                  .chain()
                  .focus()
                  .insertContentAt(position + node.nodeSize, { type: "paragraph" })
                  .setTextSelection(position + node.nodeSize + 1)
                  .run();
                onInsert();
              }}
            >
              <Plus />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Block actions"
                  title="Drag to move block"
                >
                  <GripVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => changeBlock("duplicate")}>
                  Duplicate block
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeBlock("up")}>
                  Move block up
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeBlock("down")}>
                  Move block down
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Turn into</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(
                      [
                        ["Text", "paragraph"],
                        ["Heading 1", "h1"],
                        ["Heading 2", "h2"],
                        ["Quote", "quote"],
                      ] as const
                    ).map(([label, action]) => (
                      <DropdownMenuItem key={action} onSelect={() => changeBlock(action)}>
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => changeBlock("delete")}>
                  Delete block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DragHandle>
      )}
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: instance, from, to }) =>
          instance.isEditable &&
          (from !== to || (fluid && instance.isActive("table"))) &&
          !instance.isActive("codeBlock")
        }
      >
        <div className="rich-text-bubble" role="toolbar" aria-label="Selection formatting">
          {(
            [
              ["Bold selection", Bold, "bold"],
              ["Italic selection", Italic, "italic"],
              ["Underline selection", Underline, "underline"],
              ["Strike selection", Strikethrough, "strike"],
              ["Inline code", Code, "code"],
            ] as const
          ).map(([label, Icon, mark]) => (
            <Button
              key={mark}
              size="icon-sm"
              variant={editor.isActive(mark) ? "secondary" : "ghost"}
              aria-label={label}
              aria-pressed={editor.isActive(mark)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().toggleMark(mark).run()}
            >
              <Icon />
            </Button>
          ))}
          {fluid && tableActive && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" onMouseDown={(event) => event.preventDefault()}>
                  Table actions
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex w-44 flex-col gap-1">
                {(
                  [
                    ["Add row", "addRowAfter"],
                    ["Add column", "addColumnAfter"],
                    ["Delete row", "deleteRow"],
                    ["Delete column", "deleteColumn"],
                    ["Merge cells", "mergeCells"],
                    ["Split cell", "splitCell"],
                    ["Toggle header row", "toggleHeaderRow"],
                    ["Delete table", "deleteTable"],
                  ] as const
                ).map(([label, action]) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="ghost"
                    className="justify-start"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => editor.chain().focus()[action]().run()}
                  >
                    {label}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Edit selection link"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onLink}
          >
            <Link />
          </Button>
        </div>
      </BubbleMenu>
    </>
  );
}
