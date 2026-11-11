import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createInsertSuggestions, type InsertSuggestion } from "./rich-text-suggestion";
import { collectDocumentRevisions, resolveDocumentRevisions } from "./rich-text-revisions";
import { Frame, FramePanel, FrameHeader, FrameFooter } from "@/components/reui/frame";
import { RichTextToolbar, RichTextShortcuts } from "./rich-text-toolbar";
import { AssistantCaret, RichTextAssistant } from "./rich-text-assistant";
import { Badge as ReuiBadge } from "@/components/reui/badge";
import {
  ContractModeControl,
  ContractReviewNavigation,
  ContractSuggestions,
  type ContractMarkup,
  type ContractMode,
} from "./rich-text-contract-review";
import { Command, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { RichTextBlockActions } from "./rich-text-block-actions";
import { RichTextInsertMenu } from "./rich-text-insert-menu";
import { closeHistory } from "@tiptap/pm/history";
import { Scrollspy } from "@/components/reui/scrollspy";
import { EditorContent, useEditor } from "@tiptap/react";
import { richTextEditorProps } from "./rich-text-selection";
import type { Editor, JSONContent } from "@tiptap/core";
import { editorExtensions, normalizeDocument, runEditorCommand } from "./rich-text-engine";
import type { ClipboardEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";
import {
  AlignLeft,
  ArrowDownToLine,
  ArrowRight,
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  Code2,
  FileText,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Send,
  Sparkles,
  Table2,
  Underline,
  Strikethrough as TypeIcon,
  MoreHorizontal,
  Undo2,
  Wifi,
  WifiOff,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import {
  ColorPicker,
  ColorPickerTrigger,
  ColorPickerSwatch,
  ColorPickerContent,
} from "@/components/reui/color-picker";
import type { BlockProps } from "@/data/types";
import "../reference.css";
import "./editor.css";

type Comment = {
  id: number;
  author: string;
  message: string;
  quote: string;
  resolved: boolean;
};
type Revision = { id: string; before: string; after: string; author: string };
type OutlineItem = { title: string; level: number; index: number };
const initialComments: Comment[] = [
  {
    id: 1,
    author: "Olivia Rhye",
    message:
      "Could we make the success criteria more specific? A clear target will help us stay aligned.",
    quote: "Build a more thoughtful product experience.",
    resolved: false,
  },
  {
    id: 2,
    author: "Phoenix Baker",
    message: "Love this direction. Let’s bring it into the next design review.",
    quote: "Start with the people who use it.",
    resolved: false,
  },
];
const initialRevisions: Revision[] = [
  { id: "term", before: "30 days", after: "45 days", author: "Olivia Rhye" },
  { id: "fee", before: "$8,000", after: "$9,500", author: "Phoenix Baker" },
];
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
function initialDocument(kind: number) {
  if (kind === 3)
    return [
      `<h1>Master Services Agreement</h1>`,
      `<p class="document-subtitle">ACME INC. × NORTHSTAR LABS · DRAFT FOR REVIEW</p>`,
      `<p>This agreement outlines the services, responsibilities, and expectations between Acme Inc. and Northstar Labs. The parties agree to work together in good faith throughout the engagement.</p>`,
      `<h2>1. Scope of services</h2>`,
      `<p>Acme will provide product strategy, interface design, and implementation support as detailed in the approved statement of work.</p>`,
      `<h2>2. Timeline & payment</h2>`,
      `<p>Payment is due within <del data-revision="term">30 days</del>`,
      `<ins data-revision="term">45 days</ins> of receiving an invoice. The agreed monthly service fee is <del data-revision="fee">$8,000</del>`,
      `<ins data-revision="fee">$9,500</ins>, excluding applicable taxes.</p>`,
      `<h2>3. Confidentiality</h2>`,
      `<p>Both parties will protect confidential information shared during this engagement and use it only for the purpose of fulfilling this agreement.</p>`,
      `<h2>4. Next steps</h2>`,
      `<p>Review the suggested changes in the margin. Accept or reject each change before sharing the final agreement.</p>`,
    ].join("");
  if (kind === 2)
    return [
      `<h1>Product design handbook</h1>`,
      `<p>A living guide to how we think, collaborate, and make decisions. This page belongs to all of us — add what you learn along the way.</p>`,
      `<nav data-type="contents">`,
      `</nav>`,
      `<h2>Our design principles</h2>`,
      `<p>`,
      `<strong>Start with the people who use it.</strong> Understand the task, the context, and the small details that shape an experience.</p>`,
      `<blockquote>Good design makes the important things feel obvious.</blockquote>`,
      `<h2>Working together</h2>`,
      `<ul>`,
      `<li>Share work early, while there’s still room to explore.</li>`,
      `<li>Ask clear questions and give thoughtful feedback.</li>`,
      `<li>Write down decisions so everyone has the context.</li>`,
      `</ul>`,
      `<h2>Useful resources</h2>`,
      `<table>`,
      `<tbody>`,
      `<tr>`,
      `<th>Resource</th>`,
      `<th>Owner</th>`,
      `<th>Status</th>`,
      `</tr>`,
      `<tr>`,
      `<td>Design system</td>`,
      `<td>Olivia Rhye</td>`,
      `<td>Up to date</td>`,
      `</tr>`,
      `<tr>`,
      `<td>Research library</td>`,
      `<td>Phoenix Baker</td>`,
      `<td>In progress</td>`,
      `</tr>`,
      `</tbody>`,
      `</table>`,
      `<h2>What’s next</h2>`,
      `<p>Type / to insert a block, or @ to mention a teammate.</p>`,
    ].join("");
  if (kind === 5)
    return [
      `<h1>Workspace Search Rollout</h1>`,
      `<p><del data-revision="opening">At this point in time, we plan to make workspace search available in a number of stages to give the team time to find and fix problems.</del> <ins data-revision="opening">We will release workspace search in four stages and fix regressions before expanding access.</ins></p>`,
      `<p>The rollout begins in October. This plan describes each stage, the checks that unlock it, and the team responsible for signing off.</p>`,
      `<h2>Stages</h2>`,
      `<ol><li><strong>Internal.</strong> Trial the update with the support team.</li>`,
      `<li><strong>Beta.</strong> Invite 30 workspaces. Participants will <del data-revision="beta">recieve</del><ins data-revision="beta">receive</ins> a short survey.</li>`,
      `<li><strong>General availability.</strong> Enable search for every standard workspace.</li>`,
      `<li><strong>Enterprise.</strong> Follow a week later, after reviewing indexing capacity.</li></ol>`,
      `<h2>Success metrics</h2>`,
      `<p><del data-revision="metrics">A stage can only move forward after all three metrics have remained stable for a period of three days.</del> <ins data-revision="metrics">Advance after three consecutive days of stable metrics.</ins></p>`,
      `<ul><li>Median searches complete within 250 ms.</li><li>Fewer than 5% of common queries return no results.</li><li>Support volume stays within its weekly baseline.</li></ul>`,
      `<p>Pause the rollout if a rollback has occured in the past 24 hours.</p>`,
      `<h2>Risks</h2>`,
      `<p>We are going to test large workspace indexes in order to avoid load spikes. The runbook owner is still TBD.</p>`,
      `<p>Support needs a seperate search macro for beta. Who will own the first draft?</p>`,
      `<h2>Sign-off</h2>`,
      `<ul><li>Search quality review, Nora Vale</li><li>Confirm support readiness, Leo Grant</li><li>Review release notes, Mira Stone</li></ul>`,
    ].join("");
  return [
    `<h1>Project overview</h1>`,
    `<p class="document-subtitle">ACME WORKSPACE / PRODUCT STRATEGY</p>`,
    `<p>Build a more thoughtful product experience. This document brings together our goals, the context behind them, and a clear starting point for the work ahead.</p>`,
    `<h2>What we’re building</h2>`,
    `<p>We are going to create tools that help teams focus on meaningful work. We believe the best products are clear, considered, and made with care.</p>`,
    `<blockquote>Start with the people who use it.</blockquote>`,
    `<h2>Our objectives</h2>`,
    `<ul>`,
    `<li>Make the everyday workflow simple and intuitive.</li>`,
    `<li>Share context early and keep the team connected.</li>`,
    `<li>Build, test, and learn through small improvements.</li>`,
    `</ul>`,
    `<h2>Next steps</h2>`,
    `<p>Capture your thoughts here. Add a checklist, link a resource, or invite a teammate to review.</p>`,
    `<ul data-task-list="true">`,
    `<li>`,
    `<input type="checkbox" contenteditable="false" aria-label="Complete Define success criteria"> Define success criteria</li>`,
    `<li>`,
    `<input type="checkbox" contenteditable="false" aria-label="Complete Share the first draft"> Share the first draft</li>`,
    `</ul>`,
  ].join("");
}

function FormatButton({
  label,
  Icon,
  onAction,
  pressed = false,
}: {
  label: string;
  Icon: typeof Bold;
  onAction: () => void;
  pressed?: boolean;
}) {
  return (
    <Button
      size="icon-sm"
      variant={pressed ? "secondary" : "ghost"}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onAction}
    >
      <Icon />
    </Button>
  );
}

export default function RichEditorBlock({
  block,
  initialHtml,
  documentTitle,
  onHtmlChange,
  onEditorReady,
  readOnly = false,
  compact = false,
}: BlockProps & {
  initialHtml?: string;
  documentTitle?: string;
  onHtmlChange?: (html: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const kind = Number(block.id.split("-").pop());
  const editor = useRef<HTMLDivElement>(null);
  const scrollPane = useRef<HTMLDivElement>(null);
  const savedRange = useRef<{ from: number; to: number } | null>(null);
  const [documentHtml, setDocumentHtml] = useState("");
  const storageKey = initialHtml === undefined ? `bricklane:rich-text:${block.id}` : undefined;
  const loadHtml = () => {
    try {
      const stored = storageKey && localStorage.getItem(storageKey);
      if (stored) return stored;
    } catch {
      /* Use the example when storage is unavailable. */
    }
    return initialHtml ?? initialDocument(kind);
  };
  const [initialContent] = useState(() => normalizeDocument(loadHtml()));
  const [storageError, setStorageError] = useState(false);
  const changeCallback = useRef(onHtmlChange);
  const readyCallback = useRef(onEditorReady);
  const latestHtml = useRef("");
  useLayoutEffect(() => {
    changeCallback.current = onHtmlChange;
    readyCallback.current = onEditorReady;
  }, [onHtmlChange, onEditorReady]);
  const [textColor, setTextColor] = useState("#262626");
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  useEffect(() => {
    if (documentHtml) changeCallback.current?.(documentHtml);
  }, [documentHtml]);
  const [isSaved, setIsSaved] = useState(true);
  const [locked, setLocked] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [smallText, setSmallText] = useState(false);
  const [contractMode, setContractMode] = useState<ContractMode>("suggesting");
  const [contractMarkup, setContractMarkup] = useState<ContractMarkup>("all");
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);
  const [assistantDock, setAssistantDock] = useState<"review" | "ask" | null>("review");
  const [assistantRunning, setAssistantRunning] = useState(false);
  const editable =
    !readOnly &&
    !locked &&
    (kind !== 5 || (!assistantRunning && contractMarkup === "all")) &&
    (kind !== 3 || (contractMode !== "viewing" && contractMarkup === "all"));
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [insertSuggestion, setInsertSuggestion] = useState<InsertSuggestion | null>(null);
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuNavigationEpoch, setMenuNavigationEpoch] = useState(0);
  const menuChoice = useRef<() => void>(() => {});
  const menuCount = useRef(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const saved = storageKey && localStorage.getItem(`${storageKey}:comments`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* Start with sample threads. */
    }
    return initialComments;
  });
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(`${storageKey}:comments`, JSON.stringify(comments));
      } catch {
        /* Document saving reports unavailable storage separately. */
      }
    }
  }, [comments, storageKey]);
  const [comment, setComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [online, setOnline] = useState(true);
  const [revisions, setRevisions] = useState<Revision[]>(kind === 3 ? initialRevisions : []);
  const suggesting = kind === 3 && contractMode === "suggesting";
  const [replacement, setReplacement] = useState("");
  const [panel, setPanel] = useState(kind === 2 ? "outline" : kind === 4 ? "comments" : "");

  const updateInsertSuggestion = useCallback((state: InsertSuggestion | null) => {
    setInsertSuggestion(state);
    setMenuIndex(0);
    setMenuNavigationEpoch(0);
  }, []);
  const handleInsertKey = useCallback((event: globalThis.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setMenuNavigationEpoch((epoch) => epoch + 1);
      setMenuIndex(
        (index) =>
          (index + (event.key === "ArrowDown" ? 1 : -1) + menuCount.current) %
          Math.max(1, menuCount.current),
      );
      return true;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      menuChoice.current();
      return true;
    }
    if (event.key === "Escape") {
      setInsertSuggestion(null);
      return true;
    }
    return false;
  }, []);
  const [extensions] = useState(() => [
    ...editorExtensions(),
    ...(kind === 5 ? [AssistantCaret] : []),
    createInsertSuggestions(updateInsertSuggestion, handleInsertKey),
  ]);
  const engine = useEditor({
    extensions,
    content: initialContent,
    editable,
    editorProps: richTextEditorProps,
    onCreate: ({ editor: instance }) => {
      editor.current = instance.view.dom as HTMLDivElement;
      latestHtml.current = instance.getHTML();
      setDocumentHtml(latestHtml.current);
      refreshOutline(instance);
    },
    onUpdate: ({ editor: instance }) => {
      latestHtml.current = instance.getHTML();
      setDocumentHtml(latestHtml.current);
      setIsSaved(false);
      setCanUndo(instance.can().undo());
      setCanRedo(instance.can().redo());
      refreshOutline(instance);
    },
    onTransaction: ({ editor: instance }) => {
      const next = {
        bold: instance.isActive("bold"),
        italic: instance.isActive("italic"),
        underline: instance.isActive("underline"),
      };
      setActive((previous) =>
        previous.bold === next.bold &&
        previous.italic === next.italic &&
        previous.underline === next.underline
          ? previous
          : next,
      );
      setCanUndo(instance.can().undo());
      setCanRedo(instance.can().redo());
    },
    onSelectionUpdate: ({ editor: instance }) => {
      savedRange.current = { from: instance.state.selection.from, to: instance.state.selection.to };
      setSelectedText(
        instance.state.doc.textBetween(
          instance.state.selection.from,
          instance.state.selection.to,
          " ",
        ),
      );
    },
  });
  useEffect(() => {
    if (!engine) return;
    // Subscribe only to the committed hook instance. Strict Mode may also create
    // a temporary instance whose deferred create/destroy events still run.
    let reported = false;
    const ready = () => {
      if (reported || engine.isDestroyed) return;
      reported = true;
      readyCallback.current?.(engine);
    };
    const destroyed = () => {
      if (!reported) return;
      reported = false;
      readyCallback.current?.(null);
    };
    engine.on("create", ready);
    engine.on("destroy", destroyed);
    if (engine.isInitialized) ready();
    return () => {
      engine.off("create", ready);
      engine.off("destroy", destroyed);
      destroyed();
    };
  }, [engine]);
  useEffect(() => {
    engine?.setEditable(editable);
  }, [engine, editable]);
  useEffect(() => {
    if (!engine || !documentHtml || !storageKey) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, engine.getHTML());
        setIsSaved(true);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [documentHtml, storageKey, engine]);
  useEffect(() => {
    if (!storageKey) return;
    const flush = () => {
      if (!latestHtml.current) return;
      try {
        localStorage.setItem(storageKey, latestHtml.current);
      } catch {
        // The normal save path reports unavailable storage while the page is visible.
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [storageKey]);
  function snapshot() {
    if (!engine) return;
    setDocumentHtml(engine.getHTML());
    setCanUndo(engine.can().undo());
    setCanRedo(engine.can().redo());
    setIsSaved(false);
    refreshOutline();
  }
  function refreshOutline(instance: Editor | null = engine) {
    if (!instance) return;
    const next: OutlineItem[] = [];
    const transaction = instance.state.tr;
    instance.state.doc.descendants((node, position) => {
      if (node.type.name !== "heading") return;
      const index = next.length;
      const id = `editor-heading-${index}`;
      next.push({ title: node.textContent, level: Number(node.attrs.level), index });
      if (node.attrs.id !== id)
        transaction.setNodeMarkup(position, undefined, { ...node.attrs, id });
    });
    if (transaction.docChanged) {
      transaction.setStoredMarks(instance.state.storedMarks);
      instance.view.dispatch(transaction.setMeta("addToHistory", false));
    }
    setOutline((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }
  function saveSelection() {
    if (!engine || !editor.current?.contains(window.getSelection()?.anchorNode ?? null)) return;
    savedRange.current = { from: engine.state.selection.from, to: engine.state.selection.to };
    setSelectedText(
      engine.state.doc.textBetween(engine.state.selection.from, engine.state.selection.to, " "),
    );
    setActive({
      bold: engine.isActive("bold"),
      italic: engine.isActive("italic"),
      underline: engine.isActive("underline"),
    });
  }
  function restoreSelection() {
    if (!engine) return;
    const range = savedRange.current;
    const chain = engine.chain().focus();
    if (range) {
      const max = engine.state.doc.content.size;
      chain.setTextSelection({
        from: Math.min(range.from, max),
        to: Math.min(range.to, max),
      });
    }
    chain.run();
  }
  function command(name: string, value?: string) {
    if (!engine || !editable) return;
    restoreSelection();
    runEditorCommand(engine, name, value);
    snapshot();
    saveSelection();
  }
  function insertHtml(html: string) {
    command("insertHTML", html);
  }
  function insertMention(name: string) {
    if (!engine || !editable) return;
    restoreSelection();
    engine
      .chain()
      .focus()
      .insertContent([
        { type: "mention", attrs: { id: name, label: name } },
        { type: "text", text: " " },
      ])
      .run();
    snapshot();
  }
  function keepSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }
  const refreshRevisionsFromDocument = useCallback(() => {
    if (kind !== 3 || !engine || engine.isDestroyed) return;
    setRevisions((previous) =>
      collectDocumentRevisions(
        engine,
        new Map([...initialRevisions, ...previous].map(({ id, author }) => [id, author])),
      ),
    );
  }, [engine, kind]);
  useEffect(() => {
    if (kind === 3 && documentHtml) refreshRevisionsFromDocument();
  }, [documentHtml, kind, refreshRevisionsFromDocument]);
  function undo() {
    if (!editable || !engine) return;
    engine.commands.undo();
    snapshot();
    savedRange.current = null;
    refreshRevisionsFromDocument();
  }
  function redo() {
    if (!editable || !engine) return;
    engine.commands.redo();
    snapshot();
    savedRange.current = null;
    refreshRevisionsFromDocument();
  }
  function insertRevision(
    range: { from: number; to: number },
    id: string,
    before: string,
    after: string,
  ) {
    if (!engine || !editable) return;
    const nodes: JSONContent[] = [];
    if (before)
      nodes.push({
        type: "text",
        text: before,
        marks: [{ type: "revisionDelete", attrs: { revision: id } }],
      });
    if (after)
      nodes.push({
        type: "text",
        text: after,
        marks: [{ type: "revisionInsert", attrs: { revision: id } }],
      });
    engine.chain().focus().insertContentAt(range, nodes).run();
    const position = range.from + before.length + after.length;
    engine.commands.setTextSelection(position);
    savedRange.current = { from: position, to: position };
    snapshot();
  }
  function trackedInsertion(event: InputEvent) {
    if (!editable) return;
    if (
      kind !== 3 ||
      !suggesting ||
      !event.data ||
      (event.inputType && event.inputType !== "insertText")
    )
      return;
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editor.current?.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    const parent =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    if (parent?.closest("ins[data-revision]")) return;
    event.preventDefault();
    saveSelection();
    const before = selection.toString();
    const id = `typed-${documentHtml.length}-${revisions.length}`;
    insertRevision(
      { from: engine!.state.selection.from, to: engine!.state.selection.to },
      id,
      before,
      event.data,
    );
    setRevisions([...revisions, { id, before, after: event.data, author: "Alex Morgan" }]);
  }

  // The native beforeinput event exposes inputType consistently for contenteditable.
  useEffect(() => {
    const element = editor.current;
    if (!element) return;
    const handler = (event: Event) => trackedInsertion(event as InputEvent);
    element.addEventListener("beforeinput", handler, true);
    return () => element.removeEventListener("beforeinput", handler, true);
  });

  function trackedDeletion(e: KeyboardEvent<HTMLDivElement>) {
    if (
      kind !== 3 ||
      !suggesting ||
      !["Backspace", "Delete"].includes(e.key) ||
      e.metaKey ||
      e.ctrlKey
    )
      return false;
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editor.current?.contains(selection.anchorNode)) return false;
    const range = selection.getRangeAt(0).cloneRange();
    const parent =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    if (parent?.closest("ins[data-revision]")) return false;
    if (range.collapsed && range.startContainer instanceof Text) {
      if (e.key === "Backspace" && range.startOffset > 0)
        range.setStart(range.startContainer, range.startOffset - 1);
      else if (e.key === "Delete" && range.endOffset < range.endContainer.textContent!.length)
        range.setEnd(range.endContainer, range.endOffset + 1);
    }
    const before = range.toString();
    if (!before) return false;
    e.preventDefault();
    if (!engine) return false;
    const from = engine.view.posAtDOM(range.startContainer, range.startOffset);
    const to = engine.view.posAtDOM(range.endContainer, range.endOffset);
    savedRange.current = { from, to };
    const id = `deleted-${documentHtml.length}-${revisions.length}`;
    insertRevision({ from, to }, id, before, "");
    setRevisions([...revisions, { id, before, after: "", author: "Alex Morgan" }]);
    return true;
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!editable) return;
    if (trackedDeletion(e)) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      setIsSaved(true);
      toast.success("Document saved in this preview");
      return;
    }
  }
  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!editable) return;
    const text = e.clipboardData.getData("text/plain");
    if (kind === 3 && suggesting) {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const before = selection.toString();
      const id = `paste-${documentHtml.length}-${revisions.length}`;
      insertRevision(
        { from: engine!.state.selection.from, to: engine!.state.selection.to },
        id,
        before,
        text,
      );
      setRevisions([...revisions, { id, before, after: text, author: "Alex Morgan" }]);
    } else {
      command("insertText", escapeHtml(text));
    }
  }
  useEffect(() => {
    if (!engine || kind !== 3 || !suggesting || readOnly) return;
    const element = engine.view.dom;
    const handler = (event: Event) => {
      event.stopImmediatePropagation();
      onPaste(event as unknown as ClipboardEvent<HTMLDivElement>);
    };
    element.addEventListener("paste", handler, true);
    return () => element.removeEventListener("paste", handler, true);
  });
  function insertLink(e: FormEvent) {
    e.preventDefault();
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      toast.error("Use an https, http or mailto URL");
      return;
    }
    const text = linkText.trim() || selectedText || url;
    insertHtml(
      `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`,
    );
    setLinkOpen(false);
  }
  function addComment(e: FormEvent) {
    e.preventDefault();
    if (!editable) return;
    if (!comment.trim()) return;
    const id = Math.max(0, ...comments.map((item) => item.id)) + 1;
    const quote = selectedText;
    setComments([
      ...comments,
      {
        id,
        author: "Alex Morgan",
        message: comment.trim(),
        quote,
        resolved: false,
      },
    ]);
    if (quote && engine) {
      restoreSelection();
      engine
        .chain()
        .focus()
        .setMark("comment", { id: String(id) })
        .run();
      snapshot();
    }
    setComment("");
    toast.success("Comment added locally");
  }
  function reviewRevision(id: string | null, accept: boolean) {
    if (!engine || !editable) return;
    const ids = new Set(
      id === null ? collectDocumentRevisions(engine).map((item) => item.id) : [id],
    );
    if (!resolveDocumentRevisions(engine, ids, accept)) return;
    savedRange.current = null;
    refreshRevisionsFromDocument();
    snapshot();
    if (kind === 3 && id === null) {
      toast.success(`${ids.size} suggestions ${accept ? "accepted" : "rejected"}`, {
        action: {
          label: "Undo",
          onClick: () => {
            if (!engine.isDestroyed && engine.isEditable) undo();
          },
        },
      });
    } else {
      toast.success(
        id === null
          ? accept
            ? "All changes accepted"
            : "All changes rejected"
          : accept
            ? "Change accepted"
            : "Change rejected",
      );
    }
  }
  function suggestEdit() {
    if (!replacement.trim() || !selectedText) {
      toast("Select text in the agreement, then enter a replacement");
      return;
    }
    const id = `change-${revisions.length + 3}-${documentHtml.length}`;
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    insertRevision(
      { from: engine!.state.selection.from, to: engine!.state.selection.to },
      id,
      selectedText,
      replacement,
    );
    setRevisions([
      ...revisions,
      { id, before: selectedText, after: replacement, author: "Alex Morgan" },
    ]);
    setReplacement("");
    setSelectedText("");
  }
  const assistantRevisions = kind === 5 && engine ? collectDocumentRevisions(engine) : [];
  function copyAssistantDocument(projection: ContractMarkup) {
    if (!engine) return;
    const html = engine.getHTML();
    const exported = new DOMParser().parseFromString(html, "text/html");
    if (projection !== "all") {
      exported
        .querySelectorAll(projection === "final" ? "del[data-revision]" : "ins[data-revision]")
        .forEach((fragment) => fragment.remove());
    }
    const content =
      projection === "all"
        ? html
        : Array.from(exported.body.children)
            .map((block) => block.textContent)
            .join("\n\n");
    navigator.clipboard.writeText(content).then(
      () => toast.success(projection === "all" ? "Redline HTML copied" : "Document text copied"),
      () => toast.error("Clipboard is unavailable"),
    );
  }
  function download() {
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(documentTitle ?? block.name)}</title><body>${engine?.getHTML() ?? ""}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${block.id}.html`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    toast.success("HTML document downloaded");
  }
  function changeContractMarkup(markup: ContractMarkup) {
    setLinkOpen(false);
    setContractMarkup(markup);
  }
  const contractReviewExtra = suggesting ? (
    <form
      className="flex flex-col gap-3 border-t pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (editable) suggestEdit();
      }}
    >
      <p className="text-xs font-medium">Suggest a new edit</p>
      <p className="text-[10px] leading-5 text-muted-foreground">
        Select text in the document, then write a replacement.
      </p>
      <Textarea
        aria-label="Suggested replacement"
        placeholder="Replacement text…"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        rows={3}
        disabled={!editable}
      />
      <Button size="sm" type="submit" disabled={!editable || !replacement.trim() || !selectedText}>
        Suggest edit
        <ArrowRight />
      </Button>
    </form>
  ) : null;
  const plainText = engine?.getText({ blockSeparator: "\n" }) ?? "";
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const showSidebar = kind === 2 || kind === 4;
  const documentFrame = kind === 1 && !compact;
  const EditorFrame = documentFrame ? Frame : "div";
  const EditorHeader = documentFrame ? FrameHeader : "header";
  const EditorSurface = documentFrame ? FramePanel : "div";
  const EditorFooter = documentFrame ? FrameFooter : "footer";
  function editTable(action: "row" | "column" | "delete-row" | "delete-column" | "delete-table") {
    if (!engine || !editable) return;
    restoreSelection();
    if (!engine.isActive("table")) {
      toast.info("Place the cursor in a table cell first");
      return;
    }
    const chain = engine.chain().focus();
    if (action === "row") chain.addRowAfter().run();
    if (action === "column") chain.addColumnAfter().run();
    if (action === "delete-row") chain.deleteRow().run();
    if (action === "delete-column") chain.deleteColumn().run();
    if (action === "delete-table") chain.deleteTable().run();
    snapshot();
  }
  const insertItems = [
    ["Text", FileText, "formatBlock", "p"],
    ["Heading 1", Heading1, "formatBlock", "h1"],
    ["Heading 2", Heading2, "formatBlock", "h2"],
    ["Heading 3", Heading2, "formatBlock", "h3"],
    ["Bullet list", List, "insertUnorderedList", ""],
    ["Numbered list", ListOrdered, "insertOrderedList", ""],
    [
      "Task list",
      CheckSquare,
      "insertHTML",
      '<ul data-task-list="true"><li><input type="checkbox" contenteditable="false" aria-label="Complete task"> New task</li></ul><p><br></p>',
    ],
    ["Quote", Quote, "formatBlock", "blockquote"],
    ["Code block", Code2, "insertHTML", "<pre><code>// Add your code here</code></pre><p><br></p>"],
    ["Divider", AlignLeft, "insertHTML", "<hr><p><br></p>"],
    [
      "Table",
      Table2,
      "insertHTML",
      "<table><tbody><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr><tr><td>Write here</td><td>Write here</td><td>Write here</td></tr><tr><td>Write here</td><td>Write here</td><td>Write here</td></tr></tbody></table><p><br></p>",
    ],
    ["Contents", List, "insertHTML", '<nav data-type="contents"></nav><p><br></p>'],
  ] as const;
  const mentionNames = compact
    ? ["Leo Grant", "Nora Vale", "Ravi Shah", "Ada Brooks", "Mira Stone"]
    : ["Olivia Rhye", "Phoenix Baker", "Lana Steiner"];
  const suggestionQuery = insertSuggestion?.query ?? "";
  const suggestionLabels =
    insertSuggestion?.kind === "mention"
      ? mentionNames.filter((label) => label.toLowerCase().includes(suggestionQuery.toLowerCase()))
      : insertItems
          .map(([label]) => label)
          .filter((label) => {
            const visibleLabel = label === "Task list" ? "To-do List task list" : label;
            const normalize = (value: string) => value.toLowerCase().replace(/[\s-]/g, "");
            return normalize(visibleLabel).includes(normalize(suggestionQuery));
          });
  useLayoutEffect(() => {
    menuCount.current = suggestionLabels.length;
  });
  function chooseSuggestion(label: string) {
    if (!engine || !insertSuggestion) return;
    const from = insertSuggestion.range.from;
    const kind = insertSuggestion.kind;
    if (kind === "mention") {
      engine.chain().focus().deleteRange(insertSuggestion.range).run();
      savedRange.current = { from, to: from };
      insertMention(label);
    } else {
      const item = insertItems.find(([name]) => name === label);
      if (!item) return;
      engine.view.dispatch(closeHistory(engine.state.tr));
      try {
        // Delete the trigger and apply the native command in one history event.
        // Separate dispatches can split wrapping commands (for example Quote).
        const chain = engine.chain().focus().deleteRange(insertSuggestion.range);
        switch (item[2]) {
          case "formatBlock":
            if (item[3] === "blockquote") chain.toggleBlockquote();
            else if (item[3] === "p") chain.setParagraph();
            else chain.toggleHeading({ level: Number(item[3][1]) as 1 | 2 | 3 });
            break;
          case "insertUnorderedList":
            chain.toggleBulletList();
            break;
          case "insertOrderedList":
            chain.toggleOrderedList();
            break;
          case "insertHTML":
            chain.insertContent(normalizeDocument(item[3]));
            break;
        }
        chain.run();
        snapshot();
        saveSelection();
      } finally {
        if (!engine.isDestroyed) engine.view.dispatch(closeHistory(engine.state.tr));
      }
    }
    setInsertSuggestion(null);
  }
  useLayoutEffect(() => {
    menuChoice.current = () => {
      if (suggestionLabels[menuIndex]) chooseSuggestion(suggestionLabels[menuIndex]);
    };
  });
  return (
    <EditorFrame
      {...(documentFrame ? { dense: true } : {})}
      className="reui-reference reui-editor flex min-h-[730px] flex-col bg-background"
      data-compact={compact}
      data-readonly={!editable}
      data-kind={kind}
      data-contract-markup={kind === 3 || kind === 5 ? contractMarkup : undefined}
      data-contract-mode={kind === 3 ? contractMode : undefined}
      data-full-width={fullWidth}
      data-small-text={smallText}
      data-inset-gutter={kind === 3 || kind === 4 || kind === 5}
    >
      {insertSuggestion &&
        editable &&
        engine &&
        (insertSuggestion.kind === "block" ? (
          <RichTextInsertMenu
            editor={engine}
            suggestion={insertSuggestion}
            labels={suggestionLabels}
            selected={suggestionLabels[menuIndex]}
            navigationEpoch={menuNavigationEpoch}
            onSelectedChange={(label) => setMenuIndex(Math.max(0, suggestionLabels.indexOf(label)))}
            onSelect={chooseSuggestion}
          />
        ) : (
          <div
            className="rich-text-insert-menu"
            style={{
              top: Math.min(insertSuggestion.rect?.bottom || 120, window.innerHeight - 330) + 6,
              left: Math.max(
                8,
                Math.min(insertSuggestion.rect?.left || 80, window.innerWidth - 292),
              ),
            }}
          >
            <Command shouldFilter={false} value={suggestionLabels[menuIndex]}>
              <p className="px-3 py-2 text-xs text-muted-foreground">Mention a teammate</p>
              <CommandList>
                <CommandEmpty>No matching items</CommandEmpty>
                {suggestionLabels.map((label) => (
                  <CommandItem
                    key={label}
                    value={label}
                    onMouseDown={(event) => event.preventDefault()}
                    onSelect={() => chooseSuggestion(label)}
                  >
                    {label}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
        ))}
      <EditorHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">
              {documentTitle ??
                (kind === 2
                  ? "Product design handbook"
                  : kind === 1
                    ? "Project overview"
                    : kind === 5
                      ? "Workspace Search Rollout"
                      : block.name)}
              {kind === 5 && assistantRevisions.length > 0 && (
                <ReuiBadge variant="secondary" className="ml-2">
                  {assistantRevisions.length}{" "}
                  {assistantRevisions.length === 1 ? "suggestion" : "suggestions"}
                </ReuiBadge>
              )}
            </h2>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {kind === 5 && "Rollout plan · Alex Morgan · "}
              {documentFrame && "Project brief · Edited locally · "}
              {storageError
                ? "Storage unavailable · keep this tab open"
                : isSaved
                  ? "All changes saved"
                  : online
                    ? "Unsaved changes"
                    : "Offline · edits kept in this session"}
            </p>
          </div>
          {kind === 3 && <Badge variant="outline">Draft</Badge>}
        </div>
        <div
          className={kind === 3 ? "flex flex-wrap items-center gap-2" : "flex items-center gap-2"}
        >
          {kind === 3 && (
            <ContractModeControl
              mode={contractMode}
              onModeChange={(mode) => {
                setLinkOpen(false);
                setContractMode(mode);
              }}
            />
          )}
          {kind === 3 && engine && (
            <ContractSuggestions
              placement="header"
              editor={engine}
              revisions={revisions}
              activeId={activeRevisionId}
              onActiveChange={setActiveRevisionId}
              markup={contractMarkup}
              onMarkupChange={changeContractMarkup}
              canResolve={editable}
              onResolve={reviewRevision}
            >
              {contractReviewExtra}
            </ContractSuggestions>
          )}
          {kind === 2 && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Undo"
                disabled={!canUndo}
                onMouseDown={keepSelection}
                onClick={undo}
              >
                <Undo2 />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Redo"
                disabled={!canRedo}
                onMouseDown={keepSelection}
                onClick={redo}
              >
                <Redo2 />
              </Button>
            </>
          )}
          {(kind === 1 || kind === 2 || kind === 4 || kind === 5) && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {["OR", "PB", "AM", "LS"].map((n) => (
                <Avatar className="size-7" key={n}>
                  <AvatarFallback className="text-[9px]">{n}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          {kind === 5 && (
            <>
              <Select
                value={contractMarkup}
                onValueChange={(value) => changeContractMarkup(value as ContractMarkup)}
              >
                <SelectTrigger size="sm" aria-label="Suggestion view" disabled={assistantRunning}>
                  <SelectValue>
                    {contractMarkup === "all"
                      ? "All Markup"
                      : contractMarkup === "final"
                        ? "Final"
                        : "Original"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="all">All Markup</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(location.href).then(
                    () => toast.success("Document link copied"),
                    () => toast.error("Clipboard is unavailable"),
                  );
                }}
              >
                <Share2 />
                Share
              </Button>
            </>
          )}
          {!documentFrame && kind !== 5 && (
            <Button className="editor-export" variant="outline" size="sm" onClick={download}>
              <ArrowDownToLine />
              Export
            </Button>
          )}
          {!documentFrame && kind !== 5 && (
            <Button
              className="editor-save"
              size="sm"
              onClick={() => {
                setIsSaved(true);
                toast.success("Document saved in this preview");
              }}
            >
              Save document
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={documentFrame || kind === 5 ? "Document actions" : "Page actions"}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {kind === 5 ? (
                <>
                  <DropdownMenuItem onSelect={() => copyAssistantDocument("final")}>
                    Copy Final Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => copyAssistantDocument("original")}>
                    Copy Original Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => copyAssistantDocument("all")}>
                    Copy Redline HTML
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {documentFrame && (
                    <>
                      <DropdownMenuCheckboxItem
                        checked={!locked}
                        onCheckedChange={() => setLocked(false)}
                      >
                        Editing
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={locked}
                        onCheckedChange={() => setLocked(true)}
                      >
                        Viewing
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {!documentFrame && (
                    <>
                      <DropdownMenuCheckboxItem checked={fullWidth} onCheckedChange={setFullWidth}>
                        Full Width
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={smallText} onCheckedChange={setSmallText}>
                        Small Text
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={locked} onCheckedChange={setLocked}>
                        Lock Page
                      </DropdownMenuCheckboxItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await navigator.clipboard.writeText(engine?.getHTML() || "");
                        toast.success("HTML copied");
                      } catch {
                        toast.error("Clipboard is unavailable");
                      }
                    }}
                  >
                    Copy HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await navigator.clipboard.writeText(engine?.getText() || "");
                        toast.success("Text copied");
                      } catch {
                        toast.error("Clipboard is unavailable");
                      }
                    }}
                  >
                    Copy Text
                  </DropdownMenuItem>
                  {!documentFrame && (
                    <DropdownMenuItem onSelect={download}>Export HTML</DropdownMenuItem>
                  )}
                  {documentFrame && (
                    <DropdownMenuItem
                      disabled={!editable}
                      onSelect={() => engine?.chain().focus().clearContent().run()}
                    >
                      Clear Document
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {showSidebar && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle document panel"
              onClick={() => setPanel(panel ? "" : kind === 4 ? "comments" : "outline")}
            >
              <AlignLeft />
            </Button>
          )}
        </div>
      </EditorHeader>
      {kind === 3 && engine ? (
        <div className="contract-toolbar-row">
          <fieldset className="contract-format-fieldset" disabled={!editable}>
            <RichTextToolbar
              editor={engine}
              kind={kind}
              linkOpen={editable && linkOpen}
              onLinkOpenChange={setLinkOpen}
            />
          </fieldset>
          <ContractReviewNavigation
            editor={engine}
            revisions={revisions}
            activeId={activeRevisionId}
            onActiveChange={setActiveRevisionId}
          />
        </div>
      ) : !compact && kind !== 2 && engine ? (
        <RichTextToolbar
          editor={engine}
          kind={kind}
          linkOpen={linkOpen}
          onLinkOpenChange={setLinkOpen}
          trailing={
            kind === 5 ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label="Contents">
                      <List />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56">
                    <nav className="flex flex-col" aria-label="Document contents">
                      {outline.map(({ title, index }) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            editor.current
                              ?.querySelector(`#editor-heading-${index}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          {title}
                        </Button>
                      ))}
                    </nav>
                  </PopoverContent>
                </Popover>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Ask Assist"
                  aria-pressed={assistantDock === "ask"}
                  disabled={assistantRunning}
                  onClick={() => setAssistantDock(assistantDock === "ask" ? null : "ask")}
                >
                  <Sparkles />
                </Button>
              </>
            ) : undefined
          }
        />
      ) : (
        <div
          className="editor-format-toolbar flex flex-wrap items-center gap-1 border-b bg-muted/20 px-3 py-2"
          aria-label="Document formatting"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Undo"
            disabled={!canUndo}
            onMouseDown={keepSelection}
            onClick={undo}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Redo"
            disabled={!canRedo}
            onMouseDown={keepSelection}
            onClick={redo}
          >
            <Redo2 />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Select defaultValue="p" onValueChange={(v) => command("formatBlock", v)}>
            <SelectTrigger aria-label="Text style" className="h-8 w-28 border-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="p">Paragraph</SelectItem>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="mx-1 h-5" />
          <FormatButton
            label={"Bold"}
            Icon={Bold}
            onAction={() => command("bold")}
            pressed={active.bold}
          />
          <FormatButton
            label={"Italic"}
            Icon={Italic}
            onAction={() => command("italic")}
            pressed={active.italic}
          />
          <FormatButton
            label={"Underline"}
            Icon={Underline}
            onAction={() => command("underline")}
            pressed={active.underline}
          />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <FormatButton
            label={"Bullet list"}
            Icon={List}
            onAction={() => command("insertUnorderedList")}
          />
          <FormatButton
            label={"Numbered list"}
            Icon={ListOrdered}
            onAction={() => command("insertOrderedList")}
          />
          <FormatButton
            label={"Insert task list"}
            Icon={CheckSquare}
            onAction={() =>
              insertHtml(
                '<ul data-task-list="true"><li><input type="checkbox" contenteditable="false" aria-label="Complete task"> New task</li></ul><p><br></p>',
              )
            }
          />
          <Popover
            open={linkOpen}
            onOpenChange={(open) => {
              if (open) {
                saveSelection();
                setLinkText(selectedText);
              }
              setLinkOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Insert link"
                onMouseDown={keepSelection}
              >
                <Link />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <form className="flex flex-col gap-4" onSubmit={insertLink}>
                <Field>
                  <FieldLabel htmlFor="editor-link-label">Link text</FieldLabel>
                  <Input
                    id="editor-link-label"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="editor-link-url">URL</FieldLabel>
                  <Input
                    id="editor-link-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </Field>
                <Button size="sm" type="submit">
                  Insert link
                </Button>
              </form>
            </PopoverContent>
          </Popover>
          <FormatButton
            label={"Insert table"}
            Icon={Table2}
            onAction={() =>
              insertHtml(
                "<table><tbody><tr><th>Column 1</th><th>Column 2</th></tr><tr><td>Write here</td><td>Write here</td></tr></tbody></table><p><br></p>",
              )
            }
          />
          <>
            <FormatButton
              label="Strikethrough"
              Icon={TypeIcon}
              onAction={() => command("strikeThrough")}
            />
            <FormatButton
              label="Insert quote"
              Icon={Quote}
              onAction={() => command("formatBlock", "blockquote")}
            />
            <FormatButton
              label="Insert code block"
              Icon={Code2}
              onAction={() => insertHtml("<pre><code>// Add code</code></pre><p><br></p>")}
            />
            {(
              [
                ["Text color", textColor, setTextColor, "foreColor"],
                ["Highlight color", highlightColor, setHighlightColor, "hiliteColor"],
              ] as const
            ).map(([label, value, setValue, action]) => (
              <ColorPicker
                key={label}
                value={value}
                onValueChange={(color) => {
                  if (color) {
                    setValue(color);
                    command(action, color);
                  }
                }}
              >
                <ColorPickerTrigger aria-label={label} size="icon-sm" onMouseDown={keepSelection}>
                  <ColorPickerSwatch className="size-4 rounded" />
                </ColorPickerTrigger>
                <ColorPickerContent />
              </ColorPicker>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" onMouseDown={keepSelection}>
                  Table actions
                  <ChevronDown />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex w-48 flex-col gap-1">
                {(
                  [
                    ["Add row", "row"],
                    ["Add column", "column"],
                    ["Delete row", "delete-row"],
                    ["Delete column", "delete-column"],
                    ["Delete table", "delete-table"],
                  ] as const
                ).map(([label, action]) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="ghost"
                    className="justify-start"
                    onMouseDown={keepSelection}
                    onClick={() => editTable(action)}
                  >
                    {label}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </>
        </div>
      )}
      <EditorSurface
        ref={scrollPane}
        className={`grid flex-1 ${kind === 3 ? "contract-review-layout" : showSidebar && panel ? "xl:grid-cols-[1fr_290px]" : ""}`}
      >
        <main className="relative min-w-0 bg-muted/20 p-4 sm:p-7">
          {kind === 2 && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between text-[10px] text-muted-foreground">
              <span>Workspace / Design / Handbook</span>
              <span>Type / for commands · @ to mention</span>
            </div>
          )}
          <div className="mx-auto max-w-3xl rounded-lg border bg-background shadow-sm">
            {engine && (kind !== 1 || compact) && (
              <RichTextBlockActions
                editor={engine}
                fluid={kind === 2 || compact}
                wiki={kind === 2 && !compact}
                onInsert={() => {
                  saveSelection();
                  // The gutter inserts a native slash prompt at its new paragraph.
                  // Use the same Suggestion/Command UI as keyboard insertion.
                }}
                onLink={() => {
                  saveSelection();
                  setLinkText(selectedText);
                  setLinkOpen(true);
                }}
              />
            )}
            <EditorContent editor={engine} onKeyDown={onKeyDown} />
          </div>
        </main>
        {kind === 3 && engine && (
          <ContractSuggestions
            placement="margin"
            editor={engine}
            revisions={revisions}
            activeId={activeRevisionId}
            onActiveChange={setActiveRevisionId}
            markup={contractMarkup}
            onMarkupChange={changeContractMarkup}
            canResolve={editable}
            onResolve={reviewRevision}
          >
            {contractReviewExtra}
          </ContractSuggestions>
        )}
        {showSidebar && panel && (
          <aside className="flex min-w-0 flex-col gap-5 border-t bg-background p-5 xl:border-l xl:border-t-0">
            {panel === "outline" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">On this page</h3>
                  <List className="size-4 text-muted-foreground" />
                </div>
                <nav aria-label="Document outline">
                  <Scrollspy
                    targetRef={scrollPane}
                    history={false}
                    className="flex flex-col gap-1"
                    key={outline.map((item) => item.title).join("|")}
                  >
                    {outline.map((item) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto justify-start whitespace-normal py-2 text-left text-xs"
                        style={{ paddingLeft: 8 + (item.level - 1) * 10 }}
                        key={item.index}
                        data-scrollspy-anchor={`editor-heading-${item.index}`}
                        onClick={() => {
                          const node = editor.current?.querySelectorAll("h1,h2,h3")[item.index];
                          node?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                      >
                        {item.title}
                      </Button>
                    ))}
                  </Scrollspy>
                </nav>
                <Separator />
                <p className="text-[10px] leading-5 text-muted-foreground">
                  Use the formatting toolbar, type / for blocks, or @ to mention a teammate. Tables
                  and headings are editable in place.
                </p>
              </>
            )}
            {panel === "comments" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Comments</h3>
                  <Badge variant="secondary">
                    {comments.filter((c) => !c.resolved).length} open
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-[10px]">
                  <span className="flex items-center gap-1.5">
                    {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                    {online ? "Local collaboration demo" : "Offline demo"}
                  </span>
                  <Switch
                    checked={online}
                    onCheckedChange={(v) => {
                      setOnline(v);
                      toast(
                        v
                          ? "Reconnected · local edits are retained"
                          : "Offline mode · continue editing locally",
                      );
                    }}
                    aria-label="Online mode"
                  />
                </div>
                <label className="flex items-center justify-between text-[10px] text-muted-foreground">
                  Show resolved
                  <Switch checked={showResolved} onCheckedChange={setShowResolved} />
                </label>
                {comments
                  .filter((c) => showResolved || !c.resolved)
                  .map((c) => (
                    <div className="flex flex-col gap-3 rounded-lg border p-3" key={c.id}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{c.author}</span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`${c.resolved ? "Reopen" : "Resolve"} comment ${c.id}`}
                          onClick={() =>
                            setComments(
                              comments.map((v) =>
                                v.id === c.id ? { ...v, resolved: !v.resolved } : v,
                              ),
                            )
                          }
                        >
                          {c.resolved ? <Undo2 /> : <Check />}
                        </Button>
                      </div>
                      {c.quote && (
                        <blockquote className="border-l-2 pl-2 text-[10px] text-muted-foreground">
                          {c.quote}
                        </blockquote>
                      )}
                      <p className="text-xs leading-6">{c.message}</p>
                      {c.resolved && <Badge variant="outline">Resolved</Badge>}
                    </div>
                  ))}
                <form className="flex flex-col gap-3" onSubmit={addComment}>
                  <Textarea
                    aria-label="Write a comment"
                    placeholder="Write a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  {selectedText && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      On: “{selectedText}”
                    </p>
                  )}
                  <Button type="submit" size="sm" disabled={!comment.trim()}>
                    <Send />
                    Add comment
                  </Button>
                </form>
                <p className="text-[10px] leading-5 text-muted-foreground">
                  Presence and comments are simulated locally. No network collaboration service is
                  connected.
                </p>
              </>
            )}
          </aside>
        )}
      </EditorSurface>
      {kind === 5 && engine && (
        <RichTextAssistant
          editor={engine}
          revisions={assistantRevisions}
          dock={assistantDock}
          onDockChange={setAssistantDock}
          onRunningChange={setAssistantRunning}
          canRun={editable}
        />
      )}
      <EditorFooter className="flex flex-row flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-[10px] text-muted-foreground">
        <span>
          {words.toLocaleString()} words
          <span className={documentFrame ? "rich-text-character-count" : undefined}>
            {" "}
            · {plainText.length.toLocaleString()} characters
          </span>
          {documentFrame && ` · ${Math.max(1, Math.ceil(words / 200))} min read`}
        </span>
        {documentFrame ? (
          <RichTextShortcuts />
        ) : (
          <span>
            {kind === 3
              ? `${revisions.length} changes to review`
              : kind === 4
                ? "Session-only collaboration demo"
                : "Rich HTML document"}{" "}
            · ⌘S to save
          </span>
        )}
      </EditorFooter>
    </EditorFrame>
  );
}
