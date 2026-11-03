import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useEditorState } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { Selection, TextSelection, type SelectionBookmark } from "@tiptap/pm/state";
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
  ArrowDown,
  ArrowUp,
  Copy,
  RefreshCw,
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
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
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

const blockTypes = [
  ["Text", "paragraph"],
  ["Heading 1", "h1"],
  ["Heading 2", "h2"],
  ["Heading 3", "h3"],
  ["Bullet List", "bulletList"],
  ["Numbered List", "orderedList"],
  ["To-do List", "taskList"],
  ["Quote", "quote"],
  ["Code Block", "codeBlock"],
] as const;

type BlockType = (typeof blockTypes)[number][1];
type BlockAction = BlockType | "duplicate" | "delete" | "up" | "down";

function currentBlockType(node: Editor["state"]["doc"] | null): string {
  if (!node) return "paragraph";
  if (node.type.name === "heading") return `h${node.attrs.level}`;
  if (node.type.name === "blockquote") return "quote";
  return node.type.name;
}

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
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const menuOwner = useId();
  const menuSession = useRef(0);
  const [renderedMenuSession, setRenderedMenuSession] = useState(0);
  const menuOpen = useRef(false);
  const menuTarget = useRef(-1);
  const previousSelection = useRef<SelectionBookmark | null>(null);
  const closeReason = useRef<"cancel" | "command" | "outside">("cancel");
  const apple = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const modifier = apple ? "⌘" : "Ctrl+";
  const shift = apple ? "⇧" : "Shift+";
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
  const changeBlock = useCallback(
    (action: BlockAction, target: number) => {
      if (
        editor.isDestroyed ||
        !editor.isEditable ||
        target < 0 ||
        target >= editor.state.doc.content.size
      )
        return false;
      const node = editor.state.doc.nodeAt(target);
      if (!node) return false;
      const end = target + node.nodeSize;
      const previous = editor.state.doc.resolve(target).nodeBefore;
      const next = editor.state.doc.resolve(end).nodeAfter;
      if ((action === "up" && !previous) || (action === "down" && !next)) return false;
      editor.view.dispatch(closeHistory(editor.state.tr));
      try {
        if (action === "delete")
          return editor.chain().focus().deleteRange({ from: target, to: end }).run();
        if (action === "duplicate")
          return editor.chain().focus().insertContentAt(end, node.toJSON()).run();
        if (action === "up" && previous)
          return editor
            .chain()
            .focus()
            .deleteRange({ from: target, to: end })
            .insertContentAt(target - previous.nodeSize, node.toJSON())
            .run();
        if (action === "down" && next)
          return editor
            .chain()
            .focus()
            .deleteRange({ from: target, to: end })
            .insertContentAt(target + next.nodeSize, node.toJSON())
            .run();
        const convertible =
          node.isTextblock ||
          ["bulletList", "orderedList", "taskList", "blockquote"].includes(node.type.name);
        if (!convertible) return false;
        const chain = editor.chain().focus().setNodeSelection(target).clearNodes();
        if (action === "paragraph") chain.setParagraph();
        if (action === "h1") chain.setHeading({ level: 1 });
        if (action === "h2") chain.setHeading({ level: 2 });
        if (action === "h3") chain.setHeading({ level: 3 });
        if (action === "bulletList") chain.toggleBulletList();
        if (action === "orderedList") chain.toggleOrderedList();
        if (action === "taskList") chain.toggleTaskList();
        if (action === "quote") chain.toggleBlockquote();
        if (action === "codeBlock") chain.setCodeBlock();
        return chain
          .command(({ tr }) => {
            tr.setSelection(
              Selection.near(tr.doc.resolve(Math.min(target + 1, tr.doc.content.size)), 1),
            );
            return true;
          })
          .run();
      } finally {
        if (!editor.isDestroyed) editor.view.dispatch(closeHistory(editor.state.tr));
      }
    },
    [editor],
  );

  function selectMenuBlock(target: number) {
    const { doc } = editor.state;
    const node = target >= 0 && target < doc.content.size ? doc.nodeAt(target) : null;
    if (!node) return false;
    const start = Selection.findFrom(doc.resolve(target + 1), 1, true);
    const end = Selection.findFrom(doc.resolve(target + node.nodeSize - 1), -1, true);
    if (start && end && start.from <= end.to)
      editor.commands.setTextSelection({ from: start.from, to: end.to });
    else editor.commands.setNodeSelection(target);
    return true;
  }

  function currentBlockPosition() {
    if (position >= 0) return position;
    const { selection } = editor.state;
    return selection.$from.depth ? selection.$from.before(1) : selection.from;
  }

  function changeMenuOpen(open: boolean) {
    if (open) {
      if (editor.isDestroyed || !editor.isEditable) return;
      // Native DragHandle clears hover on editor keydown (including Tab).
      // Keyboard activation can still operate on the user's real caret block.
      const target = currentBlockPosition();
      if (target < 0 || target >= editor.state.doc.content.size) return;
      setPosition(target);
      menuSession.current += 1;
      setRenderedMenuSession(menuSession.current);
      previousSelection.current = editor.state.selection.getBookmark();
      menuTarget.current = target;
      closeReason.current = "cancel";
      menuOpen.current = true;
      // React DragHandle registers its native plugin, not the extension's command set.
      editor.commands.setMeta("lockDragHandle", true);
      if (!selectMenuBlock(target)) {
        menuOpen.current = false;
        editor.commands.setMeta("lockDragHandle", false);
        return;
      }
    }
    setBlockMenuOpen(open);
  }

  function runMenuAction(action: BlockAction) {
    closeReason.current = "command";
    if (!changeBlock(action, menuTarget.current)) closeReason.current = "cancel";
    setBlockMenuOpen(false);
  }

  useEffect(() => {
    const view = editor.view;
    const ownerWindow = view.dom.ownerDocument.defaultView;
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        !editor.isEditable ||
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey
      )
        return;
      const action =
        !event.shiftKey && event.key.toLowerCase() === "d"
          ? "duplicate"
          : event.shiftKey && event.key === "ArrowUp"
            ? "up"
            : event.shiftKey && event.key === "ArrowDown"
              ? "down"
              : null;
      if (!action) return;
      const element = event.target instanceof Element ? event.target : null;
      const fromMenu =
        element?.closest("[data-block-menu-owner]")?.getAttribute("data-block-menu-owner") ===
        menuOwner;
      if (!view.hasFocus() && !fromMenu) return;
      const selection = editor.state.selection;
      const target = fromMenu
        ? menuTarget.current
        : selection.$from.depth
          ? selection.$from.before(1)
          : selection.from;
      // ProseMirror's DOM key handler has synchronized the real caret before this bubble listener.
      event.preventDefault();
      if (changeBlock(action, target)) {
        closeReason.current = "command";
        setBlockMenuOpen(false);
      }
    };
    ownerWindow?.addEventListener("keydown", handleShortcut);
    return () => ownerWindow?.removeEventListener("keydown", handleShortcut);
  }, [editor, changeBlock, menuOwner]);

  useEffect(
    () => () => {
      if (!editor.isDestroyed && menuOpen.current) editor.commands.setMeta("lockDragHandle", false);
    },
    [editor],
  );

  const blockNode =
    position >= 0 && position < editor.state.doc.content.size
      ? editor.state.doc.nodeAt(position)
      : null;
  const type = currentBlockType(blockNode);
  const otherLabels: Record<string, string> = {
    table: "Table",
    contents: "Contents",
    horizontalRule: "Divider",
  };
  const typeLabel =
    blockTypes.find(([, value]) => value === type)?.[0] ??
    otherLabels[type] ??
    blockNode?.type.name ??
    "Text";
  const convertible = Boolean(
    blockNode &&
    (blockNode.isTextblock ||
      ["bulletList", "orderedList", "taskList", "blockquote"].includes(blockNode.type.name)),
  );
  const canMoveUp = position > 0;
  const canMoveDown = Boolean(
    blockNode && position + blockNode.nodeSize < editor.state.doc.content.size,
  );
  return (
    <>
      {editor.isEditable && (
        <DragHandle
          editor={editor}
          onNodeChange={({ pos }) => setPosition(pos)}
          onElementDragStart={() => {
            closeReason.current = "outside";
            setBlockMenuOpen(false);
            menuOpen.current = false;
            editor.commands.setMeta("lockDragHandle", false);
          }}
        >
          <div className="rich-text-gutter">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Add block below"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (editor.isDestroyed || !editor.isEditable) return;
                const target = currentBlockPosition();
                if (target < 0 || target >= editor.state.doc.content.size) return;
                const node = editor.state.doc.nodeAt(target);
                if (!node) return;
                // Suggestion evaluates focus during the insertion transaction.
                // chain.focus() defers DOM focus, so focus the real view first when
                // the user adds a block before ever placing a caret in the page.
                editor.view.focus();
                editor.view.dispatch(closeHistory(editor.state.tr));
                editor
                  .chain()
                  .focus()
                  .insertContentAt(target + node.nodeSize, {
                    type: "paragraph",
                    content: [{ type: "text", text: "/" }],
                  })
                  .setTextSelection(target + node.nodeSize + 2)
                  .run();
                editor.view.dispatch(closeHistory(editor.state.tr));
                onInsert();
              }}
            >
              <Plus />
            </Button>
            <DropdownMenu open={blockMenuOpen} onOpenChange={changeMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Block actions"
                  title="Drag to move block"
                  className="relative cursor-grab active:cursor-grabbing"
                  onClick={() => changeMenuOpen(!blockMenuOpen)}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <GripVertical />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="rich-text-handle-menu w-52"
                aria-label="Block actions"
                data-block-menu-owner={menuOwner}
                onInteractOutside={() => {
                  if (closeReason.current !== "command") closeReason.current = "outside";
                }}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  // An older FocusScope can finish closing after a fresh menu opens.
                  // Its callback must not restore or unlock the new session.
                  if (menuSession.current !== renderedMenuSession) return;
                  if (!editor.isDestroyed) {
                    if (closeReason.current === "cancel" && previousSelection.current) {
                      try {
                        editor.view.dispatch(
                          editor.state.tr
                            .setSelection(previousSelection.current.resolve(editor.state.doc))
                            .setMeta("addToHistory", false),
                        );
                      } catch {
                        // An external document replacement owns its new selection.
                      }
                    }
                    if (closeReason.current !== "outside") editor.commands.focus();
                    if (menuSession.current !== renderedMenuSession) return;
                    menuOpen.current = false;
                    editor.commands.setMeta("lockDragHandle", false);
                  }
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{typeLabel}</DropdownMenuLabel>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={!convertible}>
                      <RefreshCw />
                      Turn Into
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      className="rich-text-handle-types min-w-40"
                      aria-label="Turn Into"
                      data-block-menu-owner={menuOwner}
                    >
                      <DropdownMenuRadioGroup
                        value={type}
                        onValueChange={(value) => runMenuAction(value as BlockType)}
                      >
                        {blockTypes.map(([label, value]) => (
                          <DropdownMenuRadioItem value={value} key={value}>
                            {label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onSelect={() => runMenuAction("duplicate")}
                    aria-keyshortcuts={apple ? "Meta+D" : "Control+D"}
                  >
                    <Copy />
                    Duplicate
                    <DropdownMenuShortcut>{modifier}D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canMoveUp}
                    onSelect={() => runMenuAction("up")}
                    aria-keyshortcuts={apple ? "Meta+Shift+ArrowUp" : "Control+Shift+ArrowUp"}
                  >
                    <ArrowUp />
                    Move Up
                    <DropdownMenuShortcut>
                      {modifier}
                      {shift}↑
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canMoveDown}
                    onSelect={() => runMenuAction("down")}
                    aria-keyshortcuts={apple ? "Meta+Shift+ArrowDown" : "Control+Shift+ArrowDown"}
                  >
                    <ArrowDown />
                    Move Down
                    <DropdownMenuShortcut>
                      {modifier}
                      {shift}↓
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => runMenuAction("delete")}>
                  <Trash2 />
                  Delete
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
          !menuOpen.current &&
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
