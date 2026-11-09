import { useId, useLayoutEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  ListTree,
  Minus,
  SquareCode,
  Table2,
  TextQuote,
  Type,
  type LucideIcon,
} from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import type { InsertSuggestion } from "./rich-text-suggestion";

type BlockPresentation = {
  title: string;
  description: string;
  Icon: LucideIcon;
  shortcut?: string;
  group: "Basic Blocks" | "Advanced";
};

const blockPresentations: Record<string, BlockPresentation> = {
  Text: { title: "Text", description: "Plain paragraph", Icon: Type, group: "Basic Blocks" },
  "Heading 1": {
    title: "Heading 1",
    description: "Large section heading",
    Icon: Heading1,
    shortcut: "#",
    group: "Basic Blocks",
  },
  "Heading 2": {
    title: "Heading 2",
    description: "Medium section heading",
    Icon: Heading2,
    shortcut: "##",
    group: "Basic Blocks",
  },
  "Heading 3": {
    title: "Heading 3",
    description: "Small section heading",
    Icon: Heading3,
    shortcut: "###",
    group: "Basic Blocks",
  },
  "Bullet list": {
    title: "Bullet List",
    description: "Unordered points",
    Icon: List,
    shortcut: "-",
    group: "Basic Blocks",
  },
  "Numbered list": {
    title: "Numbered List",
    description: "Ordered steps",
    Icon: ListOrdered,
    shortcut: "1.",
    group: "Basic Blocks",
  },
  "Task list": {
    title: "To-do List",
    description: "Track tasks with checkboxes",
    Icon: ListTodo,
    shortcut: "[ ]",
    group: "Basic Blocks",
  },
  Quote: {
    title: "Quote",
    description: "Set a passage apart",
    Icon: TextQuote,
    shortcut: ">",
    group: "Basic Blocks",
  },
  "Code block": {
    title: "Code Block",
    description: "Monospaced snippet or command",
    Icon: SquareCode,
    shortcut: "```",
    group: "Basic Blocks",
  },
  Divider: {
    title: "Divider",
    description: "A line between sections",
    Icon: Minus,
    shortcut: "---",
    group: "Basic Blocks",
  },
  Table: {
    title: "Table",
    description: "Rows and columns with a header",
    Icon: Table2,
    group: "Advanced",
  },
  Contents: {
    title: "Contents",
    description: "Jump links to every heading",
    Icon: ListTree,
    group: "Advanced",
  },
};

/** Free ReUI Command/IconTile composition, positioned by the existing free Popover. */
export function RichTextInsertMenu({
  editor,
  suggestion,
  labels,
  selected,
  navigationEpoch,
  onSelectedChange,
  onSelect,
}: {
  editor: Editor;
  suggestion: InsertSuggestion;
  labels: readonly string[];
  selected: string | undefined;
  navigationEpoch: number;
  onSelectedChange: (label: string) => void;
  onSelect: (label: string) => void;
}) {
  const descriptionId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousNavigationEpoch = useRef(navigationEpoch);
  useLayoutEffect(() => {
    const navigated = navigationEpoch !== previousNavigationEpoch.current;
    previousNavigationEpoch.current = navigationEpoch;
    if (!navigated || navigationEpoch === 0 || !selected) return;
    const list = listRef.current;
    const item = itemRefs.current.get(selected);
    if (!list || !item) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    // cmdk's controlled value does not run its internal keyboard scroll helper.
    // Reveal only real editor ArrowUp/Down navigation, never initial or pointer selection.
    if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
      item.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [navigationEpoch, selected]);
  const anchor = useMemo(
    () => ({
      current: {
        contextElement: editor.view.dom,
        getBoundingClientRect: () => {
          if (!editor.isDestroyed) {
            try {
              const rect = editor.view.coordsAtPos(suggestion.range.from);
              return new DOMRect(rect.left, rect.top, 0, rect.bottom - rect.top);
            } catch {
              // A document switch can briefly leave an old suggestion awaiting its native exit.
            }
          }
          return suggestion.rect ?? new DOMRect();
        },
      },
    }),
    [editor, suggestion.range.from, suggestion.rect],
  );

  return (
    <Popover open onOpenChange={(open) => !open && suggestion.dismiss()}>
      <PopoverContent
        anchor={anchor.current}
        role="presentation"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        hideWhenDetached
        className="rich-text-slash-popover shadow-none ring-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          className="rich-text-slash-command"
          shouldFilter={false}
          value={selected ?? ""}
          onValueChange={onSelectedChange}
        >
          <CommandList
            ref={listRef}
            label="Insert block"
            className="rich-text-slash-list supports-[animation-timeline:scroll()]:scroll-fade-y [--scroll-fade-reveal:--spacing(6)]"
          >
            <CommandEmpty>No matching blocks</CommandEmpty>
            {(["Basic Blocks", "Advanced"] as const).map((group) => {
              const members = labels.filter((label) => blockPresentations[label]?.group === group);
              if (!members.length) return null;
              return (
                <CommandGroup heading={group} key={group}>
                  {members.map((label) => {
                    const { title, description, Icon, shortcut } = blockPresentations[label];
                    const id = `${descriptionId}-${label.replaceAll(" ", "-")}`;
                    return (
                      <CommandItem
                        key={label}
                        ref={(element) => {
                          if (element) itemRefs.current.set(label, element);
                          else itemRefs.current.delete(label);
                        }}
                        value={label}
                        aria-label={title}
                        aria-describedby={id}
                        className="data-selected:bg-input/50"
                        onMouseDown={(event) => event.preventDefault()}
                        onSelect={() => onSelect(label)}
                      >
                        <IconTile variant="elevated" size="sm" aria-hidden="true">
                          <Icon />
                        </IconTile>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate">{title}</span>
                          <span id={id} className="truncate text-xs text-muted-foreground">
                            {description}
                          </span>
                        </span>
                        {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
