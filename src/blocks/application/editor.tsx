import { useEffect, useRef, useState } from "react";
import type {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
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
  MessageSquare,
  Quote,
  Redo2,
  Send,
  Sparkles,
  Table2,
  Underline,
  Undo2,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import type { BlockProps } from "@/data/types";
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
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}
function initialDocument(kind: number) {
  if (kind === 3)
    return `<h1>Master Services Agreement</h1><p class="document-subtitle">ACME INC. × NORTHSTAR LABS · DRAFT FOR REVIEW</p><p>This agreement outlines the services, responsibilities, and expectations between Acme Inc. and Northstar Labs. The parties agree to work together in good faith throughout the engagement.</p><h2>1. Scope of services</h2><p>Acme will provide product strategy, interface design, and implementation support as detailed in the approved statement of work.</p><h2>2. Timeline & payment</h2><p>Payment is due within <del data-revision="term">30 days</del><ins data-revision="term">45 days</ins> of receiving an invoice. The agreed monthly service fee is <del data-revision="fee">$8,000</del><ins data-revision="fee">$9,500</ins>, excluding applicable taxes.</p><h2>3. Confidentiality</h2><p>Both parties will protect confidential information shared during this engagement and use it only for the purpose of fulfilling this agreement.</p><h2>4. Next steps</h2><p>Review the suggested changes in the margin. Accept or reject each change before sharing the final agreement.</p>`;
  if (kind === 2)
    return `<h1>Product design handbook</h1><p class="document-subtitle">TEAM WIKI · LAST UPDATED OCTOBER 22, 2026</p><p>A living guide to how we think, collaborate, and make decisions. This page belongs to all of us — add what you learn along the way.</p><h2>Our design principles</h2><p><strong>Start with the people who use it.</strong> Understand the task, the context, and the small details that shape an experience.</p><blockquote>Good design makes the important things feel obvious.</blockquote><h2>Working together</h2><ul><li>Share work early, while there’s still room to explore.</li><li>Ask clear questions and give thoughtful feedback.</li><li>Write down decisions so everyone has the context.</li></ul><h2>Useful resources</h2><table><tbody><tr><th>Resource</th><th>Owner</th><th>Status</th></tr><tr><td>Design system</td><td>Olivia Rhye</td><td>Up to date</td></tr><tr><td>Research library</td><td>Phoenix Baker</td><td>In progress</td></tr></tbody></table><h2>What’s next</h2><p>Type / to insert a block, or @ to mention a teammate.</p>`;
  return `<h1>${kind === 5 ? "A better way to start your next project" : "Project overview"}</h1><p class="document-subtitle">ACME WORKSPACE / PRODUCT STRATEGY</p><p>Build a more thoughtful product experience. This document brings together our goals, the context behind them, and a clear starting point for the work ahead.</p><h2>What we’re building</h2><p>We are going to create tools that help teams focus on meaningful work. We believe the best products are clear, considered, and made with care.</p><blockquote>Start with the people who use it.</blockquote><h2>Our objectives</h2><ul><li>Make the everyday workflow simple and intuitive.</li><li>Share context early and keep the team connected.</li><li>Build, test, and learn through small improvements.</li></ul><h2>Next steps</h2><p>Capture your thoughts here. Add a checklist, link a resource, or invite a teammate to review.</p><ul data-task-list="true"><li><input type="checkbox" contenteditable="false" aria-label="Complete Define success criteria"> Define success criteria</li><li><input type="checkbox" contenteditable="false" aria-label="Complete Share the first draft"> Share the first draft</li></ul>`;
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

export default function RichEditorBlock({ block }: BlockProps) {
  const kind = Number(block.id.split("-").pop());
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const history = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [documentHtml, setDocumentHtml] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [slash, setSlash] = useState(false);
  const [mentions, setMentions] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [comment, setComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [online, setOnline] = useState(true);
  const [revisions, setRevisions] = useState<Revision[]>(
    kind === 3 ? initialRevisions : [],
  );
  const [suggesting, setSuggesting] = useState(kind === 3);
  const [replacement, setReplacement] = useState("");
  const [prompt, setPrompt] = useState(
    "Make this more concise and actionable.",
  );
  const [suggestion, setSuggestion] = useState("");
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState(0);
  const [aiBase, setAiBase] = useState("");
  const [panel, setPanel] = useState(
    kind === 3
      ? "review"
      : kind === 4
        ? "comments"
        : kind === 5
          ? "assistant"
          : "outline",
  );

  useEffect(() => {
    if (!editor.current) return;
    const html = initialDocument(kind);
    editor.current.innerHTML = html;
    history.current = [html];
    future.current = [];
    setDocumentHtml(html);
    setIsSaved(true);
    setCanUndo(false);
    setCanRedo(false);
    setOutline(
      Array.from(editor.current.querySelectorAll("h1,h2,h3")).map(
        (node, index) => ({
          title: node.textContent ?? "",
          level: Number(node.tagName[1]),
          index,
        }),
      ),
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [block.id, kind]);

  function snapshot() {
    const html = editor.current?.innerHTML ?? "";
    if (history.current.at(-1) !== html) {
      history.current.push(html);
      future.current = [];
    }
    setCanUndo(history.current.length > 1);
    setCanRedo(future.current.length > 0);
    setDocumentHtml(html);
    setIsSaved(false);
    setOutline(
      Array.from(editor.current?.querySelectorAll("h1,h2,h3") ?? []).map(
        (node, index) => ({
          title: node.textContent ?? "",
          level: Number(node.tagName[1]),
          index,
        }),
      ),
    );
  }
  function saveSelection() {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editor.current?.contains(selection.anchorNode)
    ) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
      setSelectedText(selection.toString());
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    }
  }
  function restoreSelection() {
    editor.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    if (
      savedRange.current &&
      editor.current?.contains(savedRange.current.commonAncestorContainer)
    )
      selection.addRange(savedRange.current);
    else if (editor.current) {
      const range = document.createRange();
      range.selectNodeContents(editor.current);
      range.collapse(false);
      selection.addRange(range);
    }
  }
  function command(name: string, value?: string) {
    restoreSelection();
    document.execCommand(name, false, value);
    snapshot();
    saveSelection();
  }
  function insertHtml(html: string) {
    command("insertHTML", html);
    setSlash(false);
    setMentions(false);
  }
  function insertMention(name: string) {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const mention = document.createElement("span");
    mention.className = "document-mention";
    mention.contentEditable = "false";
    mention.textContent = `@${name}`;
    range.insertNode(mention);
    const space = document.createTextNode(" ");
    mention.after(space);
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange.current = range.cloneRange();
    setMentions(false);
    setSlash(false);
    snapshot();
  }
  function keepSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }
  function refreshRevisionsFromDocument() {
    if (kind !== 3 || !editor.current) return;
    const root = editor.current;
    const ids = [
      ...new Set(
        Array.from(root.querySelectorAll("[data-revision]")).map(
          (node) => (node as HTMLElement).dataset.revision!,
        ),
      ),
    ];
    setRevisions(
      ids.map((id) => ({
        id,
        before:
          root.querySelector(`del[data-revision="${id}"]`)?.textContent ?? "",
        after:
          root.querySelector(`ins[data-revision="${id}"]`)?.textContent ?? "",
        author:
          revisions.find((item) => item.id === id)?.author ??
          initialRevisions.find((item) => item.id === id)?.author ??
          "Alex Morgan",
      })),
    );
  }
  function undo() {
    if (history.current.length < 2 || !editor.current) return;
    future.current.push(history.current.pop()!);
    editor.current.innerHTML = history.current.at(-1)!;
    setDocumentHtml(editor.current.innerHTML);
    setCanUndo(history.current.length > 1);
    setCanRedo(true);
    setIsSaved(false);
    savedRange.current = null;
    refreshRevisionsFromDocument();
  }
  function redo() {
    if (!future.current.length || !editor.current) return;
    const html = future.current.pop()!;
    history.current.push(html);
    editor.current.innerHTML = html;
    setDocumentHtml(html);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    setIsSaved(false);
    savedRange.current = null;
    refreshRevisionsFromDocument();
  }
  function insertRevision(
    range: Range,
    id: string,
    before: string,
    after: string,
  ) {
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    if (before) {
      const deleted = document.createElement("del");
      deleted.dataset.revision = id;
      deleted.textContent = before;
      fragment.append(deleted);
    }
    let inserted: HTMLElement | null = null;
    if (after) {
      inserted = document.createElement("ins");
      inserted.dataset.revision = id;
      inserted.textContent = after;
      fragment.append(inserted);
    }
    const last = fragment.lastChild;
    range.insertNode(fragment);
    const caret = document.createRange();
    if (inserted) {
      caret.selectNodeContents(inserted);
      caret.collapse(false);
    } else if (last) {
      caret.setStartAfter(last);
      caret.collapse(true);
    } else return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(caret);
    savedRange.current = caret.cloneRange();
    snapshot();
  }
  function trackedInsertion(event: InputEvent) {
    if (
      kind !== 3 ||
      !suggesting ||
      !event.data ||
      (event.inputType && event.inputType !== "insertText")
    )
      return;
    const selection = window.getSelection();
    if (
      !selection?.rangeCount ||
      !editor.current?.contains(selection.anchorNode)
    )
      return;
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
    insertRevision(range, id, before, event.data);
    setRevisions([
      ...revisions,
      { id, before, after: event.data, author: "Alex Morgan" },
    ]);
  }

  // The native beforeinput event exposes inputType consistently for contenteditable.
  useEffect(() => {
    const element = editor.current;
    if (!element) return;
    const handler = (event: Event) => trackedInsertion(event as InputEvent);
    element.addEventListener("beforeinput", handler);
    return () => element.removeEventListener("beforeinput", handler);
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
    if (
      !selection?.rangeCount ||
      !editor.current?.contains(selection.anchorNode)
    )
      return false;
    const range = selection.getRangeAt(0).cloneRange();
    const parent =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    if (parent?.closest("ins[data-revision]")) return false;
    if (range.collapsed && range.startContainer instanceof Text) {
      if (e.key === "Backspace" && range.startOffset > 0)
        range.setStart(range.startContainer, range.startOffset - 1);
      else if (
        e.key === "Delete" &&
        range.endOffset < range.endContainer.textContent!.length
      )
        range.setEnd(range.endContainer, range.endOffset + 1);
    }
    const before = range.toString();
    if (!before) return false;
    e.preventDefault();
    savedRange.current = range;
    const id = `deleted-${documentHtml.length}-${revisions.length}`;
    insertRevision(range, id, before, "");
    setRevisions([
      ...revisions,
      { id, before, after: "", author: "Alex Morgan" },
    ]);
    return true;
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (trackedDeletion(e)) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      setIsSaved(true);
      toast.success("Document saved in this preview");
      return;
    }
    if (e.key === "/" && kind === 2) {
      e.preventDefault();
      saveSelection();
      setSlash(true);
    }
    if (e.key === "@" && kind === 2) {
      e.preventDefault();
      saveSelection();
      setMentions(true);
    }
    if (e.key === "Escape") {
      setSlash(false);
      setMentions(false);
    }
  }
  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (kind === 3 && suggesting) {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const before = selection.toString();
      const id = `paste-${documentHtml.length}-${revisions.length}`;
      insertRevision(selection.getRangeAt(0), id, before, text);
      setRevisions([
        ...revisions,
        { id, before, after: text, author: "Alex Morgan" },
      ]);
    } else {
      document.execCommand("insertText", false, text);
      snapshot();
    }
  }
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
    if (quote)
      insertHtml(
        `<mark data-comment="${id}" title="Comment by Alex Morgan">${escapeHtml(quote)}</mark>`,
      );
    setComment("");
    toast.success("Comment added locally");
  }
  function reviewRevision(id: string, accept: boolean) {
    const root = editor.current;
    if (!root) return;
    const changes = root.querySelectorAll(`[data-revision="${id}"]`);
    changes.forEach((node) => {
      const keep =
        (accept && node.tagName === "INS") ||
        (!accept && node.tagName === "DEL");
      if (keep) node.replaceWith(...Array.from(node.childNodes));
      else node.remove();
    });
    setRevisions(revisions.filter((r) => r.id !== id));
    snapshot();
    toast.success(accept ? "Change accepted" : "Change rejected");
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
    insertRevision(selection.getRangeAt(0), id, selectedText, replacement);
    setRevisions([
      ...revisions,
      { id, before: selectedText, after: replacement, author: "Alex Morgan" },
    ]);
    setReplacement("");
    setSelectedText("");
  }
  function runAssistant(action = "Improve writing") {
    if (running) return;
    const base =
      selectedText ||
      editor.current?.querySelector("p:not(.document-subtitle)")?.textContent ||
      "Build a more thoughtful product experience.";
    setAiBase(base);
    setSuggestion("");
    setTrace(0);
    setRunning(true);
    const output = /summary|summarize/i.test(action + " " + prompt)
      ? `Focus on a simpler workflow, share context early, and improve the experience through small, measurable steps.`
      : /expand/i.test(action + " " + prompt)
        ? `${base} Start by identifying the most important task, then define a clear success measure. Share an early version with your team and use their feedback to guide the next iteration.`
        : base
            .replace(/We are going to /g, "We will ")
            .replace(/We believe /g, "")
            .replace(/in order to /g, "to ")
            .replace(
              /a more thoughtful product experience/g,
              "a clear, thoughtful product experience",
            ) +
          " Set a clear goal, share the first draft, and improve it together.";
    let index = 0;
    timer.current = setInterval(() => {
      index += 6;
      setSuggestion(output.slice(0, index));
      setTrace(Math.min(2, Math.floor((index / output.length) * 3)));
      if (index >= output.length) {
        clearInterval(timer.current!);
        timer.current = null;
        setRunning(false);
        setTrace(3);
      }
    }, 28);
  }
  function applySuggestion() {
    if (!suggestion || running) return;
    restoreSelection();
    if (selectedText) command("insertText", suggestion);
    else
      insertHtml(
        `<h2>Suggested direction</h2><p>${escapeHtml(suggestion)}</p>`,
      );
    setSuggestion("");
    toast.success("Suggestion applied to the document");
  }
  function download() {
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(block.name)}</title><body>${editor.current?.innerHTML ?? ""}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${block.id}.html`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    toast.success("HTML document downloaded");
  }
  const plainText = documentHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ");
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const showSidebar = kind > 1;
  const insertItems = [
    ["Heading 1", Heading1, "formatBlock", "h1"],
    ["Heading 2", Heading2, "formatBlock", "h2"],
    ["Bullet list", List, "insertUnorderedList", ""],
    ["Numbered list", ListOrdered, "insertOrderedList", ""],
    [
      "Task list",
      CheckSquare,
      "insertHTML",
      '<ul data-task-list="true"><li><input type="checkbox" contenteditable="false" aria-label="Complete task"> New task</li></ul><p><br></p>',
    ],
    ["Quote", Quote, "formatBlock", "blockquote"],
    [
      "Table",
      Table2,
      "insertHTML",
      "<table><tbody><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr><tr><td>Write here</td><td>Write here</td><td>Write here</td></tr><tr><td>Write here</td><td>Write here</td><td>Write here</td></tr></tbody></table><p><br></p>",
    ],
    [
      "Code block",
      Code2,
      "insertHTML",
      "<pre><code>// Add your code here</code></pre><p><br></p>",
    ],
  ] as const;
  return (
    <div className="reui-editor flex min-h-[730px] flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">{block.name}</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {isSaved
                ? "All changes saved"
                : online
                  ? "Unsaved changes"
                  : "Offline · edits kept in this session"}
            </p>
          </div>
          {kind === 3 && <Badge variant="outline">Draft</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {kind === 4 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {["OR", "PB", "AM"].map((n) => (
                <Avatar className="size-7" key={n}>
                  <AvatarFallback className="text-[9px]">{n}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={download}>
            <ArrowDownToLine />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setIsSaved(true);
              toast.success("Document saved in this preview");
            }}
          >
            Save document
          </Button>
          {showSidebar && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle document panel"
              onClick={() =>
                setPanel(
                  panel
                    ? ""
                    : kind === 3
                      ? "review"
                      : kind === 4
                        ? "comments"
                        : kind === 5
                          ? "assistant"
                          : "outline",
                )
              }
            >
              <AlignLeft />
            </Button>
          )}
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 px-3 py-2">
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
        <Select
          defaultValue="p"
          onValueChange={(v) => command("formatBlock", v)}
        >
          <SelectTrigger
            aria-label="Text style"
            className="h-8 w-28 border-0 shadow-none"
          >
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
        {kind === 3 && (
          <>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              variant={suggesting ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSuggesting(!suggesting)}
            >
              {suggesting ? "Suggesting" : "Editing"}
              <ChevronDown />
            </Button>
          </>
        )}
        {kind === 5 && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              setPanel("assistant");
              runAssistant();
            }}
          >
            <Sparkles />
            Ask assistant
          </Button>
        )}
      </div>
      <div
        className={`grid flex-1 ${showSidebar && panel ? "xl:grid-cols-[1fr_290px]" : ""}`}
      >
        <main className="relative min-w-0 bg-muted/20 p-4 sm:p-7">
          {kind === 2 && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between text-[10px] text-muted-foreground">
              <span>Workspace / Design / Handbook</span>
              <span>Type / for commands · @ to mention</span>
            </div>
          )}
          {(slash || mentions) && (
            <div className="mx-auto mb-3 flex max-w-3xl flex-col gap-1 rounded-lg border bg-background p-3 shadow-sm">
              <div className="mb-1 flex items-center justify-between px-2 text-xs font-medium">
                <span>
                  {mentions ? "Mention a teammate" : "Insert a block"}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close insert menu"
                  onClick={() => {
                    setSlash(false);
                    setMentions(false);
                  }}
                >
                  <X />
                </Button>
              </div>
              {mentions
                ? ["Olivia Rhye", "Phoenix Baker", "Lana Steiner"].map(
                    (name) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        key={name}
                        onMouseDown={keepSelection}
                        onClick={() => insertMention(name)}
                      >
                        <Users />
                        {name}
                      </Button>
                    ),
                  )
                : insertItems.map(([label, Icon, action, value]) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      key={label}
                      onMouseDown={keepSelection}
                      onClick={() => {
                        command(action, value);
                        setSlash(false);
                      }}
                    >
                      <Icon />
                      {label}
                    </Button>
                  ))}
            </div>
          )}
          <div className="mx-auto max-w-3xl rounded-lg border bg-background shadow-sm">
            {selectedText && (
              <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-3 py-1">
                <span className="mr-2 max-w-48 truncate text-[10px] text-muted-foreground">
                  Selection: {selectedText}
                </span>
                <FormatButton
                  label={"Bold selection"}
                  Icon={Bold}
                  onAction={() => command("bold")}
                  pressed={active.bold}
                />
                <FormatButton
                  label={"Italic selection"}
                  Icon={Italic}
                  onAction={() => command("italic")}
                  pressed={active.italic}
                />
                {kind === 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPanel("comments")}
                  >
                    <MessageSquare />
                    Comment
                  </Button>
                )}
              </div>
            )}
            <div
              ref={editor}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Rich text document"
              aria-multiline="true"
              spellCheck
              className="reui-rich-document min-h-[520px] px-6 py-8 outline-none sm:px-12 sm:py-10"
              onInput={() => {
                snapshot();
                const root = editor.current;
                setRevisions(
                  revisions.map((r) => ({
                    ...r,
                    after:
                      root?.querySelector(`ins[data-revision="${r.id}"]`)
                        ?.textContent ?? r.after,
                  })),
                );
              }}
              onClick={(event) => {
                const target = event.target;
                if (
                  target instanceof HTMLInputElement &&
                  target.type === "checkbox"
                ) {
                  if (target.checked) target.setAttribute("checked", "");
                  else target.removeAttribute("checked");
                  snapshot();
                }
              }}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              onKeyDown={onKeyDown}
              onBlur={saveSelection}
              onPaste={onPaste}
            />
          </div>
        </main>
        {showSidebar && panel && (
          <aside className="flex min-w-0 flex-col gap-5 border-t bg-background p-5 xl:border-l xl:border-t-0">
            {panel === "outline" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">On this page</h3>
                  <List className="size-4 text-muted-foreground" />
                </div>
                <nav
                  className="flex flex-col gap-1"
                  aria-label="Document outline"
                >
                  {outline.map((item) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto justify-start whitespace-normal py-2 text-left text-xs"
                      style={{ paddingLeft: 8 + (item.level - 1) * 10 }}
                      key={item.index}
                      onClick={() => {
                        const node =
                          editor.current?.querySelectorAll("h1,h2,h3")[
                            item.index
                          ];
                        node?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        if (node) {
                          const range = document.createRange();
                          range.selectNodeContents(node);
                          window.getSelection()?.removeAllRanges();
                          window.getSelection()?.addRange(range);
                          saveSelection();
                        }
                      }}
                    >
                      {item.title}
                    </Button>
                  ))}
                </nav>
                <Separator />
                <p className="text-[10px] leading-5 text-muted-foreground">
                  Use the formatting toolbar, type / for blocks, or @ to mention
                  a teammate. Tables and headings are editable in place.
                </p>
              </>
            )}
            {panel === "review" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Suggested changes</h3>
                  <Badge variant="secondary">{revisions.length}</Badge>
                </div>
                <p className="text-[10px] leading-5 text-muted-foreground">
                  Review each change before finalizing the agreement. This
                  review stays in your current session.
                </p>
                {revisions.length === 0 && (
                  <div className="rounded-lg border p-4 text-xs text-muted-foreground">
                    All suggestions have been reviewed.
                  </div>
                )}
                {revisions.map((r) => (
                  <div
                    className="flex flex-col gap-3 rounded-lg border p-3"
                    key={r.id}
                  >
                    <p className="text-xs font-medium">{r.author}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Suggested a replacement
                    </p>
                    <div className="rounded bg-muted/50 p-2 text-xs leading-6">
                      <del>{r.before}</del>
                      <br />
                      <strong>{r.after}</strong>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        aria-label={`Reject ${r.id} change`}
                        onClick={() => reviewRevision(r.id, false)}
                      >
                        <X />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        aria-label={`Accept ${r.id} change`}
                        onClick={() => reviewRevision(r.id, true)}
                      >
                        <Check />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
                {suggesting && (
                  <form
                    className="flex flex-col gap-3 border-t pt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      suggestEdit();
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
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={!replacement.trim() || !selectedText}
                    >
                      Suggest edit
                      <ArrowRight />
                    </Button>
                  </form>
                )}
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
                    {online ? (
                      <Wifi className="size-3" />
                    ) : (
                      <WifiOff className="size-3" />
                    )}
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
                  <Switch
                    checked={showResolved}
                    onCheckedChange={setShowResolved}
                  />
                </label>
                {comments
                  .filter((c) => showResolved || !c.resolved)
                  .map((c) => (
                    <div
                      className="flex flex-col gap-3 rounded-lg border p-3"
                      key={c.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{c.author}</span>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`${c.resolved ? "Reopen" : "Resolve"} comment ${c.id}`}
                          onClick={() =>
                            setComments(
                              comments.map((v) =>
                                v.id === c.id
                                  ? { ...v, resolved: !v.resolved }
                                  : v,
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
                  Presence and comments are simulated locally. No network
                  collaboration service is connected.
                </p>
              </>
            )}
            {panel === "assistant" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xs font-semibold">
                    <Sparkles className="size-4" />
                    Writing assistant
                  </h3>
                  <Badge variant="outline">Local demo</Badge>
                </div>
                <p className="text-[10px] leading-5 text-muted-foreground">
                  Select a passage to work on, or improve the document’s
                  introduction.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Improve writing", "Summarize", "Expand"].map((action) => (
                    <Button
                      variant="outline"
                      size="sm"
                      key={action}
                      disabled={running}
                      onClick={() => runAssistant(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
                <Field>
                  <FieldLabel htmlFor="assistant-prompt">
                    Instructions
                  </FieldLabel>
                  <Textarea
                    id="assistant-prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="How should we improve this?"
                  />
                </Field>
                <Button
                  size="sm"
                  disabled={running}
                  onClick={() => runAssistant()}
                >
                  <Sparkles />
                  {running ? "Drafting suggestion…" : "Generate suggestion"}
                </Button>
                {(running || suggestion) && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      {[
                        "Read selected context",
                        "Draft a revision",
                        "Prepare for your review",
                      ].map((t, i) => (
                        <p
                          className="flex items-center gap-2 text-[10px] text-muted-foreground"
                          key={t}
                        >
                          {trace > i ? (
                            <Check className="size-3" />
                          ) : (
                            <span className="size-2.5 rounded-full border" />
                          )}
                          {t}
                        </p>
                      ))}
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-[10px] font-medium text-muted-foreground">
                        {running ? "DRAFTING" : "SUGGESTION"}
                      </p>
                      <p className="text-xs leading-6" aria-live="polite">
                        {suggestion || "Reading the document…"}
                      </p>
                    </div>
                    {!running && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSuggestion("");
                            setAiBase("");
                          }}
                        >
                          <X />
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={applySuggestion}
                        >
                          <Check />
                          Apply suggestion
                        </Button>
                      </div>
                    )}
                    {aiBase && (
                      <details className="text-[10px] text-muted-foreground">
                        <summary className="cursor-pointer">
                          Original passage
                        </summary>
                        <p className="mt-2 leading-5">{aiBase}</p>
                      </details>
                    )}
                  </>
                )}
                <p className="mt-auto text-[10px] leading-5 text-muted-foreground">
                  This assistant uses deterministic local text transformations.
                  No AI API is connected.
                </p>
              </>
            )}
          </aside>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-[10px] text-muted-foreground">
        <span>
          {words} words · {documentHtml.replace(/<[^>]*>/g, "").length}{" "}
          characters
        </span>
        <span>
          {kind === 3
            ? `${revisions.length} changes to review`
            : kind === 4
              ? "Session-only collaboration demo"
              : "Rich HTML document"}{" "}
          · ⌘S to save
        </span>
      </footer>
    </div>
  );
}
