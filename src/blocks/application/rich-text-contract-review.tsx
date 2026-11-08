import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { ChevronDown, ChevronUp, Check, MessageSquare, MoreHorizontal, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemGroup } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DocumentRevision } from "./rich-text-revisions";

export type ContractMode = "editing" | "suggesting" | "viewing";
export type ContractMarkup = "all" | "final" | "original";

type RevisionRange = { id: string; fragments: { from: number; to: number }[] };

/** Fresh native positions, never cached DOM matches or offsets from a previous document. */
function currentRevisionRanges(doc: Node): RevisionRange[] {
  const groups = new Map<string, RevisionRange>();
  doc.descendants((node, position) => {
    if (!node.isInline) return;
    for (const mark of node.marks) {
      if (!["revisionInsert", "revisionDelete"].includes(mark.type.name)) continue;
      const id: unknown = mark.attrs.revision;
      if (typeof id !== "string" || !id) continue;
      const group = groups.get(id) ?? { id, fragments: [] };
      group.fragments.push({ from: position, to: position + node.nodeSize });
      groups.set(id, group);
    }
  });
  return [...groups.values()];
}

function activateRevision(
  editor: Editor,
  id: string,
  onActiveChange: (id: string) => void,
  focusEditor = true,
) {
  if (editor.isDestroyed) return;
  const target = currentRevisionRanges(editor.state.doc).find((revision) => revision.id === id);
  const first = target?.fragments[0];
  if (!first) return;
  onActiveChange(id);
  const chain = editor.chain();
  if (focusEditor) chain.focus(undefined, { scrollIntoView: false });
  chain.setTextSelection(first.from).setMeta("addToHistory", false).run();
  // A Final/Original projection can hide the first fragment; its paragraph still locates the edit.
  const node = editor.view.domAtPos(first.from).node;
  const element = node instanceof Element ? node : node.parentElement;
  const block = element?.closest("p, li, blockquote, h1, h2, h3, pre") ?? element;
  block?.scrollIntoView({ block: "center", behavior: "smooth" });
}

const modes = [
  { value: "editing", label: "Editing", description: "Edits apply directly" },
  { value: "suggesting", label: "Suggesting", description: "Text edits become suggestions" },
  { value: "viewing", label: "Viewing", description: "Read only, no edits" },
] as const;

export function ContractModeControl({
  mode,
  onModeChange,
}: {
  mode: ContractMode;
  onModeChange: (mode: ContractMode) => void;
}) {
  return (
    <Select value={mode} onValueChange={(value) => onModeChange(value as ContractMode)}>
      <SelectTrigger size="sm" aria-label="Document mode" className="contract-mode-control">
        <SelectValue>{modes.find((item) => item.value === mode)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" position="popper" className="w-64">
        <SelectGroup>
          {modes.map(({ value, label, description }) => (
            <SelectItem key={value} value={value}>
              <span className="flex flex-col gap-0.5">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

type NavigationProps = {
  editor: Editor;
  revisions: readonly DocumentRevision[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
};

export function ContractReviewNavigation({
  editor,
  revisions,
  activeId,
  onActiveChange,
}: NavigationProps) {
  const index = revisions.findIndex((revision) => revision.id === activeId);
  function move(direction: 1 | -1) {
    if (editor.isDestroyed) return;
    const current = currentRevisionRanges(editor.state.doc);
    if (!current.length) return;
    const selected = current.findIndex((revision) => revision.id === activeId);
    // Initial Previous and forward last→first are local symmetric rules; only first→last was observed.
    const next =
      selected < 0
        ? direction === 1
          ? 0
          : current.length - 1
        : (selected + direction + current.length) % current.length;
    activateRevision(editor, current[next].id, onActiveChange);
  }
  return (
    <ButtonGroup aria-label="Suggestions" className="contract-review-navigation">
      {(
        [
          ["Previous suggestion", -1, ChevronUp],
          ["Next suggestion", 1, ChevronDown],
        ] as const
      ).map(([label, direction, Icon], position) => (
        <Fragment key={label}>
          {position === 1 && (
            <span className="contract-review-counter">
              {revisions.length === 0
                ? "None open"
                : index < 0
                  ? `${revisions.length} open`
                  : `${index + 1} of ${revisions.length}`}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  disabled={revisions.length === 0}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => move(direction)}
                />
              }
            >
              <Icon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        </Fragment>
      ))}
      <span className="sr-only" role="status">
        {index >= 0 ? `Suggestion ${index + 1} of ${revisions.length}` : ""}
      </span>
    </ButtonGroup>
  );
}

type ReviewProps = NavigationProps & {
  markup: ContractMarkup;
  onMarkupChange: (markup: ContractMarkup) => void;
  canResolve: boolean;
  onResolve: (id: string | null, accept: boolean) => void;
  children?: ReactNode;
};

function ContractReviewContent({
  mobile,
  onBulkComplete,
  ...props
}: ReviewProps & { mobile: boolean; onBulkComplete?: () => void }) {
  const {
    editor,
    revisions,
    activeId,
    onActiveChange,
    markup,
    onMarkupChange,
    canResolve,
    onResolve,
    children,
  } = props;
  const activeCard = useRef<HTMLDivElement>(null);
  const reviewActions = useRef<HTMLButtonElement>(null);
  const bulkCompleted = useRef(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [acceptAll, setAcceptAll] = useState(true);
  const [confirmationCount, setConfirmationCount] = useState(0);

  function requestBulkResolution(accept: boolean) {
    if (!canResolve || editor.isDestroyed || !editor.isEditable) return;
    const count = currentRevisionRanges(editor.state.doc).length;
    if (count === 0) return;
    bulkCompleted.current = false;
    setConfirmationCount(count);
    setAcceptAll(accept);
    setConfirmationOpen(true);
  }

  function confirmBulkResolution(event: React.MouseEvent<HTMLButtonElement>) {
    // Recheck the live document after confirmation, never act on stale card positions.
    if (
      !canResolve ||
      editor.isDestroyed ||
      !editor.isEditable ||
      currentRevisionRanges(editor.state.doc).length === 0
    ) {
      event.preventDefault();
      return;
    }
    onResolve(null, acceptAll);
    if (currentRevisionRanges(editor.state.doc).length !== 0) {
      event.preventDefault();
      return;
    }
    // Only a successful, explicitly confirmed bulk action dismisses the phone Sheet.
    bulkCompleted.current = true;
    onBulkComplete?.();
  }
  useEffect(() => {
    activeCard.current?.scrollIntoView({ block: "nearest" });
  }, [activeId]);
  return (
    <>
      <div className="contract-review-panel-heading">
        <h2 className="text-sm font-semibold">Suggestions</h2>
        <Badge variant="secondary" aria-label={mobile ? undefined : "Pending suggested changes"}>
          {revisions.length}
        </Badge>
        <DropdownMenu modal={!mobile}>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Review actions"
                title="Resolve all suggestions"
                ref={reviewActions}
                disabled={!canResolve || revisions.length === 0}
                className="ml-auto"
              />
            }
          >
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            aria-label="Review actions"
            onCloseAutoFocus={(event) => {
              if (confirmationOpen) event.preventDefault();
            }}
          >
            <DropdownMenuItem disabled={!canResolve} onSelect={() => requestBulkResolution(true)}>
              <Check aria-hidden="true" /> Accept All
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canResolve} onSelect={() => requestBulkResolution(false)}>
              <X aria-hidden="true" /> Reject All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {mobile && (
          <SheetClose
            render={
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close suggestions" />
            }
          >
            <X aria-hidden="true" />
          </SheetClose>
        )}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={markup}
        onValueChange={(value) => value && onMarkupChange(value as ContractMarkup)}
        aria-label="Markup view"
        className="contract-markup-control"
      >
        <ToggleGroupItem value="all">All markup</ToggleGroupItem>
        <ToggleGroupItem value="final">Final</ToggleGroupItem>
        <ToggleGroupItem value="original">Original</ToggleGroupItem>
      </ToggleGroup>
      <ItemGroup aria-label="Open suggestions" className="contract-review-list">
        {revisions.map((revision) => {
          const type =
            revision.before && revision.after ? "Replaced" : revision.before ? "Deleted" : "Added";
          return (
            <Item
              key={revision.id}
              ref={revision.id === activeId ? activeCard : undefined}
              role="listitem"
              variant="default"
              size="sm"
              data-current={revision.id === activeId}
              data-contract-review-card={revision.id}
              className="contract-review-card"
            >
              <ItemContent>
                <Button
                  type="button"
                  variant="ghost"
                  className="contract-review-card-select"
                  aria-label={`${revision.author} ${type} ${revision.before} ${revision.after}`}
                  aria-current={revision.id === activeId ? "true" : undefined}
                  onClick={() => activateRevision(editor, revision.id, onActiveChange, !mobile)}
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {revision.author
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="text-xs font-medium">{revision.author}</span>
                  </span>
                </Button>
                <div className="contract-review-diff">
                  <span>{type} </span>
                  {revision.before && <del>{revision.before}</del>}
                  {revision.before && revision.after && " "}
                  {revision.after && <strong>{revision.after}</strong>}
                </div>
              </ItemContent>
              <ItemActions className="contract-review-card-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Reject ${revision.id} change`}
                  disabled={!canResolve}
                  onClick={() => onResolve(revision.id, false)}
                >
                  <X aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Accept ${revision.id} change`}
                  disabled={!canResolve}
                  onClick={() => onResolve(revision.id, true)}
                >
                  <Check aria-hidden="true" />
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>
      {revisions.length === 0 && (
        <Empty className="border py-8">
          <EmptyHeader>
            <EmptyTitle>No Open Suggestions</EmptyTitle>
            <EmptyDescription>Every suggestion in this draft is resolved.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {children}
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // This controlled dialog has no Trigger. Cancel/Escape return to a persistent
            // control; a successful phone bulk action leaves restoration to its Sheet.
            if (!bulkCompleted.current) {
              event.preventDefault();
              reviewActions.current?.focus({ preventScroll: true });
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acceptAll ? "Accept All Suggestions?" : "Reject All Suggestions?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationCount} suggestions {acceptAll ? "become part of" : "are removed from"}{" "}
              this agreement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!canResolve} onClick={confirmBulkResolution}>
              {acceptAll ? "Accept All" : "Reject All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ContractSuggestions({
  placement,
  ...props
}: ReviewProps & { placement: "header" | "margin" }) {
  // Local responsive policy: keep the existing xl desktop split. Only 390/1440 were observed.
  const [open, setOpen] = useState(false);
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (placement === "margin") {
    return desktop ? (
      <aside className="contract-review-margin" aria-label="Review">
        <ContractReviewContent {...props} mobile={false} />
      </aside>
    ) : null;
  }
  if (desktop) return null;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Suggestions, ${props.revisions.length} open`}
          />
        }
      >
        <MessageSquare aria-hidden="true" />
        Suggestions
        <Badge variant="secondary" aria-label="Pending suggested changes">
          {props.revisions.length}
        </Badge>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="contract-review-sheet">
        <SheetHeader className="sr-only">
          <SheetTitle>Suggestions</SheetTitle>
          <SheetDescription>Accept or reject each proposed change.</SheetDescription>
        </SheetHeader>
        <ContractReviewContent {...props} mobile onBulkComplete={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
