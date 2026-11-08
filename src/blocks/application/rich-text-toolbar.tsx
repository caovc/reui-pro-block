import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowUpRight,
  Bold,
  Check,
  ChevronDown,
  Code,
  CodeSquare,
  Highlighter,
  Italic,
  Keyboard,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@/components/reui/color-picker";

const highlights = [
  { value: "#fef08a", label: "Yellow highlight" },
  { value: "#bbf7d0", label: "Green highlight" },
  { value: "#bfdbfe", label: "Blue highlight" },
  { value: "#fbcfe8", label: "Pink highlight" },
  { value: "#ddd6fe", label: "Violet highlight" },
];
const alignments = [
  { value: "left", label: "Align left", Icon: AlignLeft },
  { value: "center", label: "Align center", Icon: AlignCenter },
  { value: "right", label: "Align right", Icon: AlignRight },
  { value: "justify", label: "Align justify", Icon: AlignJustify },
];
const blockTypes = [
  { value: "paragraph", label: "Text", shortcut: "0" },
  { value: "h1", label: "Heading 1", shortcut: "1" },
  { value: "h2", label: "Heading 2", shortcut: "2" },
  { value: "h3", label: "Heading 3", shortcut: "3" },
];

/** Separate deliberate block-format choices from typing and adjacent choices. */
function runBlockFormatCommand<T>(editor: Editor, command: () => T): T {
  editor.view.dispatch(closeHistory(editor.state.tr));
  try {
    return command();
  } finally {
    if (!editor.isDestroyed) editor.view.dispatch(closeHistory(editor.state.tr));
  }
}

function Tool({
  label,
  shortcut,
  active,
  disabled,
  children,
  action,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  action: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={action}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <kbd className="ml-3 opacity-70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Native Tiptap commands; the document owns its selection, state, and history. */
export function RichTextToolbar({
  editor,
  kind,
  linkOpen,
  onLinkOpenChange,
  trailing,
}: {
  editor: Editor;
  kind: number;
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
  trailing?: ReactNode;
}) {
  const linkOpenRef = useRef(linkOpen);
  linkOpenRef.current = linkOpen;
  const [linkFormGeneration, setLinkFormGeneration] = useState(0);
  const changeLinkOpen = useCallback(
    (open: boolean) => {
      if (open && !linkOpenRef.current) {
        // A quick reopen must get a fresh form/focus scope even while the old
        // Popover is still completing its native exit animation.
        setLinkFormGeneration((generation) => generation + 1);
      }
      linkOpenRef.current = open;
      onLinkOpenChange(open);
    },
    [onLinkOpenChange],
  );
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      undo: current.can().undo(),
      redo: current.can().redo(),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
      task: current.isActive("taskList"),
      quote: current.isActive("blockquote"),
      codeBlock: current.isActive("codeBlock"),
      highlight: current.getAttributes("highlight").color as string | undefined,
      link: current.getAttributes("link").href as string | undefined,
      block: current.isActive("heading")
        ? `h${current.getAttributes("heading").level}`
        : "paragraph",
      align: (current.getAttributes("paragraph").textAlign ??
        current.getAttributes("heading").textAlign ??
        "left") as string,
    }),
  });
  const extended = kind === 1 || kind === 5;
  const block = blockTypes.find((item) => item.value === state.block) ?? blockTypes[0];
  const alignment = alignments.find((item) => item.value === state.align) ?? alignments[0];
  useEffect(() => {
    const element = editor.view.dom;
    const openLink = (event: KeyboardEvent) => {
      if (
        !editor.isEditable ||
        event.isComposing ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "k"
      )
        return;
      event.preventDefault();
      changeLinkOpen(true);
    };
    element.addEventListener("keydown", openLink);
    return () => element.removeEventListener("keydown", openLink);
  }, [editor, changeLinkOpen]);
  return (
    <div
      className="editor-format-toolbar rich-text-toolbar"
      role="toolbar"
      aria-label="Document formatting"
    >
      <ButtonGroup aria-label="History">
        <Tool
          label="Undo"
          shortcut="⌘Z"
          disabled={!state.undo}
          action={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </Tool>
        <Tool
          label="Redo"
          shortcut="⌘⇧Z"
          disabled={!state.redo}
          action={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </Tool>
      </ButtonGroup>
      <Separator orientation="vertical" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="rich-text-block-type"
              aria-label={`Block type, ${block.label}`}
            />
          }
        >
          <span className="rich-text-block-label">{block.label}</span>
          <span className="rich-text-block-mobile" aria-hidden="true">
            T
          </span>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Turn Into</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={state.block}
            onValueChange={(value) => {
              runBlockFormatCommand(editor, () => {
                if (value === "paragraph") editor.chain().focus().setParagraph().run();
                else
                  editor
                    .chain()
                    .focus()
                    .setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 })
                    .run();
              });
            }}
          >
            {blockTypes.map((item) => (
              <DropdownMenuRadioItem key={item.value} value={item.value}>
                {item.label}
                <kbd className="ml-auto text-xs text-muted-foreground">⌘⌥{item.shortcut}</kbd>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" />
      <ButtonGroup aria-label="Text style">
        <Tool
          label="Bold"
          shortcut="⌘B"
          active={state.bold}
          action={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </Tool>
        <Tool
          label="Italic"
          shortcut="⌘I"
          active={state.italic}
          action={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </Tool>
        <Tool
          label="Underline"
          shortcut="⌘U"
          active={state.underline}
          action={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </Tool>
        {extended && (
          <>
            <Tool
              label="Strikethrough"
              shortcut="⌘⇧S"
              active={state.strike}
              action={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough />
            </Tool>
            <Tool
              label="Inline code"
              shortcut="⌘E"
              active={state.code}
              action={() => editor.chain().focus().toggleCode().run()}
            >
              <Code />
            </Tool>
          </>
        )}
      </ButtonGroup>
      <ButtonGroup aria-label="Annotate">
        {extended && (
          <ColorPicker
            value={state.highlight ?? null}
            onValueChange={(color) => {
              if (color) editor.chain().focus().setHighlight({ color }).run();
            }}
          >
            <ColorPickerTrigger
              variant={state.highlight ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Highlight"
              onMouseDown={(event) => event.preventDefault()}
            >
              <Highlighter />
            </ColorPickerTrigger>
            <ColorPickerContent className="w-auto p-2" aria-label="Highlight color">
              <div className="flex items-center gap-2">
                <ColorPickerSwatches
                  colors={highlights}
                  shape="circle"
                  className="flex gap-2 [--color-picker-swatch-size:--spacing(5)]"
                />
                <Separator orientation="vertical" className="h-5" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove highlight"
                  disabled={!state.highlight}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                >
                  <X />
                </Button>
              </div>
            </ColorPickerContent>
          </ColorPicker>
        )}
        <Popover open={linkOpen} onOpenChange={changeLinkOpen}>
          <PopoverTrigger
            render={
              <Button
                variant={state.link ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Insert link"
                onMouseDown={(event) => event.preventDefault()}
              />
            }
          >
            <Link />
          </PopoverTrigger>
          <PopoverContent
            key={linkFormGeneration}
            className="w-80 p-2"
            aria-label="Link"
            align="start"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              // An obsolete close callback must not steal focus from a form
              // that has already reopened while the old content was exiting.
              if (!linkOpenRef.current) editor.commands.focus();
            }}
          >
            <RichTextLinkForm editor={editor} onClose={() => changeLinkOpen(false)} />
          </PopoverContent>
        </Popover>
      </ButtonGroup>
      <Separator orientation="vertical" />
      <ButtonGroup aria-label="Lists">
        <Tool
          label="Bullet list"
          active={state.bullet}
          action={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </Tool>
        <Tool
          label="Numbered list"
          active={state.ordered}
          action={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </Tool>
        {kind !== 3 && (
          <Tool
            label="Insert task list"
            shortcut="⌘⇧9"
            active={state.task}
            action={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListChecks />
          </Tool>
        )}
      </ButtonGroup>
      {extended && (
        <ButtonGroup aria-label="Blocks">
          <Tool
            label="Insert quote"
            active={state.quote}
            action={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </Tool>
          <Tool
            label="Insert code block"
            active={state.codeBlock}
            action={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <CodeSquare />
          </Tool>
          <Tool label="Divider" action={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus />
          </Tool>
        </ButtonGroup>
      )}
      {kind !== 4 && (
        <>
          <Separator orientation="vertical" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Alignment, ${alignment.label}`}
                  className="gap-1 px-1.5"
                />
              }
            >
              <alignment.Icon />
              <ChevronDown className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Alignment</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={state.align}
                onValueChange={(value) =>
                  runBlockFormatCommand(editor, () =>
                    editor.chain().focus().setTextAlign(value).run(),
                  )
                }
              >
                {alignments.map(({ value, label, Icon }, index) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    <Icon className="size-3.5" />
                    {label}
                    <kbd className="ml-auto text-xs text-muted-foreground">
                      ⌘⇧{["L", "E", "R", "J"][index]}
                    </kbd>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {trailing}
      {kind === 1 && !linkOpen && (
        <BubbleMenu
          editor={editor}
          pluginKey="document-link-bubble"
          shouldShow={({ editor: current }) => current.isEditable && current.isActive("link")}
        >
          <div className="rich-text-bubble rich-text-link-bubble" role="group" aria-label="Link">
            <a
              href={state.link}
              target="_blank"
              rel="noreferrer"
              className="max-w-56 truncate px-2 text-xs"
            >
              {state.link?.replace(/^https?:\/\//, "")}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => changeLinkOpen(true)}
            >
              <Link />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
            >
              <Unlink />
            </Button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
}

function RichTextLinkForm({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const currentLink = editor.getAttributes("link").href as string | undefined;
  const [address, setAddress] = useState(currentLink ?? "");
  const [error, setError] = useState("");
  return (
    <>
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          const raw = address.trim();
          const href = /^(https?:\/\/|mailto:)/i.test(raw) ? raw : `https://${raw}`;
          if (
            !raw ||
            !editor.schema.marks.link ||
            !/^https?:\/\/[^\s]+$|^mailto:[^\s]+$/i.test(href)
          ) {
            setError("Enter a valid web or email address.");
            return;
          }
          const chain = editor.chain().focus().extendMarkRange("link");
          if (editor.state.selection.empty && !currentLink)
            chain
              .insertContent({
                type: "text",
                text: raw,
                marks: [{ type: "link", attrs: { href } }],
              })
              .run();
          else chain.setLink({ href }).run();
          onClose();
        }}
      >
        <Input
          aria-label="Link address"
          placeholder="Paste or type a link"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="h-8 border-0 shadow-none"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Apply link"
          disabled={!address.trim()}
        >
          <Check />
        </Button>
        {currentLink && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove link"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onClose();
            }}
          >
            <Unlink />
          </Button>
        )}
      </form>
      {error && (
        <p role="alert" className="px-2 pt-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {currentLink && (
        <a
          href={currentLink}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
        >
          Open link
          <ArrowUpRight className="size-3" />
        </a>
      )}
    </>
  );
}

export function RichTextShortcuts() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="rich-text-shortcuts"
            aria-label="Shortcuts"
          />
        }
      >
        <Keyboard />
        <span>Shortcuts</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-h-[min(620px,80dvh)] overflow-y-auto text-xs"
        aria-label="Keyboard Shortcuts"
      >
        <h2 className="mb-4 text-sm font-semibold">Keyboard Shortcuts</h2>
        {(
          [
            [
              "Formatting",
              [
                ["Bold", "⌘ B"],
                ["Italic", "⌘ I"],
                ["Underline", "⌘ U"],
                ["Strikethrough", "⌘ ⇧ S"],
                ["Inline code", "⌘ E"],
                ["Highlight", "⌘ ⇧ H"],
                ["Link", "⌘ K"],
                ["Heading 1 to 3", "⌘ ⌥ 1–3"],
                ["Task list", "⌘ ⇧ 9"],
                ["Indent a task", "Tab"],
              ],
            ],
            [
              "Markdown",
              [
                ["Heading", "# Space"],
                ["Bullet list", "- Space"],
                ["Numbered list", "1. Space"],
                ["Task list", "[ ] Space"],
                ["Quote", "> Space"],
                ["Code block", "``` Space"],
                ["Divider", "---"],
                ["Highlight", "==text=="],
              ],
            ],
          ] as const
        ).map(([title, shortcuts]) => (
          <section key={title} className="mt-4">
            <h3 className="mb-2 font-medium text-muted-foreground">{title}</h3>
            <dl className="space-y-2">
              {shortcuts.map(([label, keys]) => (
                <div className="flex justify-between gap-4" key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <kbd className="text-muted-foreground">{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="mt-4 text-muted-foreground">Use Ctrl instead of ⌘ on Windows and Linux.</p>
      </PopoverContent>
    </Popover>
  );
}
