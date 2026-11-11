import { useEffect, useRef, useState, type FormEvent } from "react";
import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { closeHistory } from "@tiptap/pm/history";
import {
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { type DocumentRevision, resolveDocumentRevisions } from "./rich-text-revisions";
import {
  assistantTasks,
  planAssistant,
  type AssistantEdit,
  type AssistantRange,
} from "./rich-text-assistant-plan";

type Run = ReturnType<typeof planAssistant> & { index: number; id: string };
export type AssistantDock = "review" | "ask" | "findings" | null;

const assistantCaret = new PluginKey<DecorationSet>("assistantCaret");

export const AssistantCaret = Extension.create({
  name: "assistantCaret",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: assistantCaret,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, previous) {
            const position: number | null | undefined = transaction.getMeta(assistantCaret);
            if (position === undefined) return previous.map(transaction.mapping, transaction.doc);
            if (position === null) return DecorationSet.empty;
            const widget = Decoration.widget(
              position,
              () => {
                const element = document.createElement("span");
                element.className = "rich-text-assistant-caret";
                element.setAttribute("aria-hidden", "true");
                element.textContent = "Assist";
                return element;
              },
              { side: -1 },
            );
            return DecorationSet.create(transaction.doc, [widget]);
          },
        },
        props: {
          decorations: (state) => assistantCaret.getState(state),
        },
      }),
    ];
  },
});

function stageEdit(editor: Editor, edit: AssistantEdit, id: string) {
  const { state, view } = editor;
  const attrs = { revision: id };
  const insert = state.schema.marks.revisionInsert.create(attrs);
  const marks = edit.append
    ? []
    : (state.doc
        .resolve(edit.from)
        .nodeAfter?.marks.filter(
          ({ type }) => !type.name.startsWith("revision") && type.name !== "comment",
        ) ?? []);
  const text = state.schema.text(edit.text, insert.addToSet(marks));
  const transaction = state.tr;
  if (edit.append) {
    transaction.insert(
      edit.from,
      state.schema.nodes.paragraph.create({ assistantRevision: id }, text),
    );
  } else {
    transaction.addMark(edit.from, edit.to, state.schema.marks.revisionDelete.create(attrs));
    transaction.insert(edit.to, text);
  }
  const end = (edit.append ? edit.from + 1 : edit.to) + text.nodeSize;
  view.dispatch(transaction.setMeta(assistantCaret, end));
  const element = view.dom.querySelector(".rich-text-assistant-caret");
  element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function finishHistory(editor: Editor) {
  editor.view.dispatch(closeHistory(editor.state.tr).setMeta(assistantCaret, null));
}

export function RichTextAssistant({
  editor,
  revisions,
  dock,
  onDockChange,
  onRunningChange,
  canRun,
}: {
  editor: Editor;
  revisions: readonly DocumentRevision[];
  dock: AssistantDock;
  onDockChange: (dock: AssistantDock) => void;
  onRunningChange: (running: boolean) => void;
  canRun: boolean;
}) {
  const [value, setValue] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [selection, setSelection] = useState<AssistantRange | null>(null);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("Plan polished");
  const [findings, setFindings] = useState<Run["findings"]>([]);
  const view = run ? "running" : dock;
  const input = useRef<HTMLInputElement>(null);
  const index = Math.min(active, Math.max(0, revisions.length - 1));
  const revision = revisions[index];

  useEffect(() => {
    const capture = () => {
      const { from, to } = editor.state.selection;
      setSelection(from < to ? { from, to } : null);
    };
    capture();
    editor.on("transaction", capture);
    return () => {
      editor.off("transaction", capture);
    };
  }, [editor]);

  useEffect(() => {
    if (view === "ask") input.current?.focus({ preventScroll: true });
  }, [view]);

  useEffect(() => {
    if (!run) return;
    const timeout = window.setTimeout(
      () => {
        if (editor.isDestroyed) return;
        const edit = run.edits[run.index];
        if (edit) {
          stageEdit(editor, edit, `${run.id}-${run.index}`);
          setRun({ ...run, index: run.index + 1 });
          return;
        }
        finishHistory(editor);
        setStatus(run.task.label);
        setRun(null);
        onRunningChange(false);
        if (run.edits.length) {
          setActive(0);
          onDockChange("review");
        } else {
          onDockChange("findings");
          setFindings(run.findings);
        }
      },
      run.index === 0 ? 460 : 380,
    );
    return () => window.clearTimeout(timeout);
  }, [editor, run, onDockChange, onRunningChange]);

  function start(prompt: string) {
    if (run || !canRun || !prompt.trim()) return;
    const plan = planAssistant(editor, prompt, selection);
    finishHistory(editor);
    onRunningChange(true);
    setRun({ ...plan, index: 0, id: crypto.randomUUID() });
    setValue("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    start(value);
  }

  function stop() {
    finishHistory(editor);
    setRun(null);
    onRunningChange(false);
    onDockChange("ask");
  }

  function locateRevision(id: string) {
    const fragment = Array.from(
      editor.view.dom.querySelectorAll<HTMLElement>("[data-revision]"),
    ).find((element) => element.dataset.revision === id);
    fragment?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function navigate(next: number) {
    const target = revisions[next];
    if (!target) return;
    setActive(next);
    locateRevision(target.id);
  }

  function resolve(ids: string[], accept: boolean) {
    if (!resolveDocumentRevisions(editor, new Set(ids), accept)) return;
    setStatus(accept ? "Edits accepted" : "Edits rejected");
    if (ids.length === revisions.length) onDockChange("ask");
  }

  if (!dock) return null;
  return (
    <aside className="rich-text-assistant-dock" aria-label="Writing assistant">
      {view === "running" && run ? (
        <section className="rich-text-assistant-card" aria-label="Assistant progress">
          <div className="rich-text-assistant-title">
            <IconTile size="xs">
              <Sparkles />
            </IconTile>
            <span>{run.task.label}</span>
            <Button className="ml-auto" size="xs" variant="outline" onClick={stop}>
              <Square />
              Stop
            </Button>
          </div>
          <div className="rich-text-assistant-content" aria-live="polite">
            <p>{run.context}</p>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Spinner />
              {run.task.group === "Review"
                ? "Scanning for findings"
                : `Writing suggestions · ${run.index} of ${run.edits.length}`}
            </p>
          </div>
        </section>
      ) : view === "findings" ? (
        <section className="rich-text-assistant-card" aria-label="Assistant findings">
          <div className="rich-text-assistant-title">
            <IconTile size="xs">
              <Sparkles />
            </IconTile>
            <span>{status}</span>
            <Badge variant="outline">{findings.length} findings</Badge>
            <Button
              className="ml-auto"
              size="icon-xs"
              variant="ghost"
              aria-label="Back to Ask Assist"
              onClick={() => onDockChange("ask")}
            >
              <X />
            </Button>
          </div>
          <ItemGroup className="rich-text-assistant-content max-h-52 overflow-y-auto">
            {findings.length ? (
              findings.map(({ from, text }) => (
                <Item key={from} size="sm" variant="outline">
                  <ItemContent>{text}</ItemContent>
                </Item>
              ))
            ) : (
              <p role="status">No matching changes in this scope.</p>
            )}
          </ItemGroup>
        </section>
      ) : view === "review" && revision ? (
        <section className="rich-text-assistant-card" aria-label="Review assistant edits">
          <div className="rich-text-assistant-title">
            <IconTile size="xs">
              <Sparkles />
            </IconTile>
            <span>{status}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {revisions.length} edits
            </span>
            <Button
              className="ml-auto"
              size="icon-xs"
              variant="outline"
              aria-label="Review later"
              onClick={() => onDockChange("ask")}
            >
              <X />
            </Button>
          </div>
          <div className="rich-text-assistant-content">
            <Button
              variant="ghost"
              className="rich-text-assistant-diff"
              onClick={() => locateRevision(revision.id)}
            >
              {revision.before && (
                <span>
                  <span>Was</span>
                  <del>{revision.before}</del>
                </span>
              )}
              {revision.after && (
                <span>
                  <span>Now</span>
                  <ins>{revision.after}</ins>
                </span>
              )}
            </Button>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ButtonGroup aria-label="Navigate suggestions">
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="Previous edit"
                  disabled={index === 0}
                  onClick={() => navigate(index - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Badge variant="outline" className="h-6 rounded-none px-2">
                  {index + 1} of {revisions.length}
                </Badge>
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="Next edit"
                  disabled={index + 1 === revisions.length}
                  onClick={() => navigate(index + 1)}
                >
                  <ChevronRight />
                </Button>
              </ButtonGroup>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="ml-auto" variant="ghost" size="icon-xs" aria-label="All edits">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {revisions.map((item, number) => (
                    <DropdownMenuItem key={item.id} onSelect={() => navigate(number)}>
                      Edit {number + 1}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!canRun}
                    onSelect={() =>
                      resolve(
                        revisions.map(({ id }) => id),
                        false,
                      )
                    }
                  >
                    Reject all
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canRun}
                    onSelect={() =>
                      resolve(
                        revisions.map(({ id }) => id),
                        true,
                      )
                    }
                  >
                    Accept all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="xs"
                disabled={!canRun}
                onClick={() => resolve([revision.id], false)}
              >
                <X />
                Reject
              </Button>
              <Button size="xs" disabled={!canRun} onClick={() => resolve([revision.id], true)}>
                <Check />
                Accept
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <form className="rich-text-assistant-card" onSubmit={submit}>
          <InputGroup className="h-10 rounded-[inherit] border-0 bg-background">
            <InputGroupAddon>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton
                    size="icon-xs"
                    className="rounded-full border bg-background"
                    aria-label="Assistant tasks"
                  >
                    <Sparkles />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64">
                  <DropdownMenuLabel>{selection ? "Selection" : "Whole plan"}</DropdownMenuLabel>
                  {(["Edit", "Add", "Review"] as const).map((group) => (
                    <DropdownMenuGroup key={group}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{group}</DropdownMenuLabel>
                      {assistantTasks
                        .filter((task) => task.group === group)
                        .map(({ label }) => (
                          <DropdownMenuItem
                            disabled={!canRun}
                            key={label}
                            onSelect={() => start(label)}
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </InputGroupAddon>
            <InputGroupInput
              ref={input}
              aria-label="Ask Assist"
              placeholder="Ask Assist"
              disabled={!canRun}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              {selection && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Selection
                </Badge>
              )}
              {value.trim() ? (
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-xs"
                  aria-label="Run assistant"
                  disabled={!canRun}
                >
                  <ArrowUp />
                </InputGroupButton>
              ) : (
                revisions.length > 0 && (
                  <InputGroupButton
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onDockChange("review")}
                  >
                    Review {revisions.length}
                  </InputGroupButton>
                )
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
      )}
    </aside>
  );
}
