import { useEffect, useState } from "react";
import { useEditorState } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { TextSelection } from "@tiptap/pm/state";
import { CellSelection, isInTable, selectedRect } from "@tiptap/pm/tables";
import {
  GripVertical,
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Rows3,
  Columns3,
  Table2,
  Trash2,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

function WikiTableControls({ editor }: { editor: Editor }) {
  const [menuContainer, setMenuContainer] = useState<HTMLDivElement | null>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      const { $from } = instance.state.selection;
      const rect = isInTable(instance.state) ? selectedRect(instance.state) : null;
      let header = false;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.spec.tableRole !== "table") continue;
        const row = node.firstChild;
        header = Boolean(row?.childCount);
        row?.forEach((cell) => {
          if (cell.type.spec.tableRole !== "header_cell") header = false;
        });
        break;
      }
      return {
        header,
        addRow: instance.can().addRowAfter(),
        addColumn: instance.can().addColumnAfter(),
        toggleHeader: instance.can().toggleHeaderRow(),
        deleteRow:
          Boolean(rect && (rect.top > 0 || rect.bottom < rect.map.height)) &&
          instance.can().deleteRow(),
        deleteColumn:
          Boolean(rect && (rect.left > 0 || rect.right < rect.map.width)) &&
          instance.can().deleteColumn(),
        deleteTable: instance.can().deleteTable(),
      };
    },
  });
  function run(
    action:
      | "addRowAfter"
      | "addColumnAfter"
      | "toggleHeaderRow"
      | "deleteRow"
      | "deleteColumn"
      | "deleteTable",
  ) {
    if (!editor.isEditable || editor.isDestroyed) return;
    editor.view.dispatch(closeHistory(editor.state.tr));
    try {
      editor.chain().focus()[action]().run();
    } finally {
      if (!editor.isDestroyed) editor.view.dispatch(closeHistory(editor.state.tr));
    }
  }
  return (
    <div
      ref={setMenuContainer}
      className="rich-text-bubble max-w-[calc(100vw-24px)]"
      role="toolbar"
      aria-label="Table"
    >
      <ButtonGroup aria-label="Table actions" className="shrink-0">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Add row below"
          title="Add row below"
          disabled={!state.addRow}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => run("addRowAfter")}
        >
          <Rows3 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Add column right"
          title="Add column right"
          disabled={!state.addColumn}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => run("addColumnAfter")}
        >
          <Columns3 aria-hidden="true" />
        </Button>
        <FieldLabel
          title="Header row"
          className={[
            "shrink-0 gap-0 has-[>[data-slot=field]]:w-7 has-[>[data-slot=field]]:rounded-md",
            "has-[>[data-slot=field]]:border-0 *:data-[slot=field]:p-0",
            "has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground",
            "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
          ].join(" ")}
        >
          <Field orientation="horizontal" className="relative size-7 justify-center gap-0">
            <Checkbox
              aria-label="Header row"
              checked={state.header}
              disabled={!state.toggleHeader}
              className="absolute inset-0 size-full cursor-pointer opacity-0 after:inset-0"
              onMouseDown={(event) => event.preventDefault()}
              onCheckedChange={() => run("toggleHeaderRow")}
            />
            <Table2 className="pointer-events-none size-4" aria-hidden="true" />
          </Field>
        </FieldLabel>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Delete" title="Delete">
              <Trash2 aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            portalContainer={menuContainer}
            align="start"
            side="bottom"
            className="w-44"
          >
            <DropdownMenuLabel>Delete</DropdownMenuLabel>
            <DropdownMenuItem disabled={!state.deleteRow} onSelect={() => run("deleteRow")}>
              <Rows3 aria-hidden="true" />
              Delete Row
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!state.deleteColumn} onSelect={() => run("deleteColumn")}>
              <Columns3 aria-hidden="true" />
              Delete Column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!state.deleteTable}
              onSelect={() => run("deleteTable")}
            >
              <Trash2 aria-hidden="true" />
              Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </div>
  );
}

const wikiTableBubbleKey = "bricklane-wiki-table-menu";

export function RichTextBlockActions({
  editor,
  onInsert,
  onLink,
  fluid = false,
  wiki = false,
}: {
  editor: Editor;
  fluid?: boolean;
  wiki?: boolean;
  onInsert: () => void;
  onLink: () => void;
}) {
  const [position, setPosition] = useState(-1);
  const tableActive = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance.isActive("table"),
  });
  const tableContext = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      const selection = instance.state.selection;
      return (
        isInTable(instance.state) &&
        (selection instanceof CellSelection ||
          (selection instanceof TextSelection && selection.empty))
      );
    },
  });
  useEffect(() => {
    if (!wiki || editor.isDestroyed) return;
    // BubbleMenu updates its native placement options in its child effect.
    // Refresh through its public API after switching table/selection controls.
    editor.view.dispatch(editor.state.tr.setMeta(wikiTableBubbleKey, "updatePosition"));
  }, [editor, wiki, tableContext]);
  function wikiTableReference() {
    const { state, view } = editor;
    const selection = state.selection;
    if (
      !isInTable(state) ||
      !(
        selection instanceof CellSelection ||
        (selection instanceof TextSelection && selection.empty)
      )
    ) {
      return null;
    }
    for (let depth = selection.$from.depth; depth > 0; depth--) {
      if (selection.$from.node(depth).type.spec.tableRole !== "table") continue;
      const node = view.nodeDOM(selection.$from.before(depth));
      if (!(node instanceof HTMLElement)) return null;
      const table = node instanceof HTMLTableElement ? node : node.querySelector("table");
      if (!table) return null;
      // Let the existing native BubbleMenu/Floating UI own scrolling, collision
      // and placement; its public virtual reference reads the real table.
      return {
        contextElement: table,
        getBoundingClientRect: () => table.getBoundingClientRect(),
        getClientRects: () => table.getClientRects(),
      };
    }
    return null;
  }
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
        pluginKey={wiki ? wikiTableBubbleKey : undefined}
        editor={editor}
        getReferencedVirtualElement={wiki ? wikiTableReference : undefined}
        options={wiki ? { placement: tableContext ? "top-start" : "top" } : undefined}
        shouldShow={({ editor: instance, from, to }) =>
          instance.isEditable &&
          (from !== to || (fluid && instance.isActive("table"))) &&
          !instance.isActive("codeBlock")
        }
      >
        {wiki && tableContext ? (
          <WikiTableControls editor={editor} />
        ) : (
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
        )}
      </BubbleMenu>
    </>
  );
}
