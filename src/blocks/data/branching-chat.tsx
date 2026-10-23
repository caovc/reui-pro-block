import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Brain,
  ChevronDown,
  ChevronRight,
  Minimize2,
  Maximize2,
  Copy,
  CornerDownRight,
  FileText,
  GitBranch,
  MoreVertical,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Star,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  X,
} from "lucide-react";
import Artifact from "./branching-chat-artifact";
import Sources from "./branching-chat-sources";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageHeader, MessageFooter } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { MessageScroller, MessageScrollerProvider, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton, useMessageScroller } from "@/components/ui/message-scroller";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  chatModels,
  chatModelGroups,
  chatPath,
  chatSources,
  chatThreads,
  composeChatReply,
  seedChatTree,
} from "./branching-chat-data";
import type { ChatNode, ChatThread, ChatTree } from "./branching-chat-data";
import "../reference.css";
import "./branching-chat.css";

function ModelMark({ name }: { name: string }) {
  if (name.startsWith("Claude") || name === "Anthropic")
    return (
      <svg viewBox="0 0 24 20" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M1 17 7 3h3l6 14h-3l-1.5-4h-6L4 17Zm6-7h3L8.5 6Z"
        />
        <path fill="currentColor" d="M13 3h3l6 14h-3Z" />
      </svg>
    );
  return name.startsWith("GPT") || name === "OpenAI" ? <Bot /> : <Sparkles />;
}

const displayModel = (name?: string) =>
  name?.replace("Claude ", "").replace("Gemini ", "") || "Original";
const skills = ["Rewrite the opener", "Compare with 3.3", "Verify the numbers"];
const skillPrompts: Record<string, string> = {
  "Rewrite the opener": "rewrite the opener as one paragraph, no bullets",
  "Compare with 3.3": "how does this read against the 3.3 opener",
  "Verify the numbers": "list every number I need to verify",
};
const attachOptions = [
  { title: "Release notes", detail: "release-notes-3.4.md", icon: FileText },
  { title: "Previous release", detail: "release-notes-3.3.md", icon: FileText },
  {
    title: "Incident thread",
    detail: "Aug 19 incident thread",
    icon: MessageSquare,
  },
  { title: "Export tickets", detail: "EXP-412 to EXP-424", icon: Ticket },
];
const now = () => "Now";

function insertReply(tree: ChatTree, reply: ChatNode): ChatTree {
  const parent = tree.nodes[reply.parent!];
  return { nodes: { ...tree.nodes, [parent.id]: { ...parent, children: [...parent.children, reply.id] }, [reply.id]: reply }, selection: { ...tree.selection, [parent.id]: reply.id } };
}

export default function BranchingChat() {
  return <MessageScrollerProvider autoScroll defaultScrollPosition="end"><BranchingChatContent /></MessageScrollerProvider>;
}

function BranchingChatContent() {
  const { scrollToEnd } = useMessageScroller();
  const [tree, setTree] = useState<ChatTree>(seedChatTree);
  const [threads, setThreads] = useState(chatThreads);
  const [threadId, setThreadId] = useState("release");
  const [pinned, setPinned] = useState(["release", "admin"]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(chatModels[0]);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [folded, setFolded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selectedSources, setSelectedSources] = useState<
    Record<string, number>
  >({});
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [preparing, setPreparing] = useState<ChatNode | null>(null);
  const counter = useRef(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const path = chatPath(tree, threadId);
  const pathKey = path.map((n) => n.id).join("|");
  const thread = threads.find((t) => t.id === threadId)!;
  const shown = folded ? path.slice(-2) : path;
  const activeStream = preparing?.id || (streaming && path.some((n) => n.id === streaming) ? streaming : null);
  const streamingText = streaming ? tree.nodes[streaming]?.text || "" : "";
  const nextId = () => `new-turn-${++counter.current}`;
  useLayoutEffect(() => { scrollToEnd({ behavior: "instant" }); }, [scrollToEnd, threadId, pathKey, folded]);
  useEffect(() => {
    if (!preparing) return;
    const timer = window.setTimeout(() => {
      setTree((current) => insertReply(current, preparing));
      setRevealed(0);
      setStreaming(preparing.id);
      setPreparing(null);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [preparing]);
  useEffect(() => {
    if (!streaming) return;
    let index = 0;
    const text = streamingText;
    const timer = window.setInterval(() => {
      index = Math.min(text.length, index + 4);
      setRevealed(index);
      if (index >= text.length) {
        window.clearInterval(timer);
        setStreaming(null);
      }
    }, 28);
    return () => window.clearInterval(timer);
  }, [streaming, streamingText]);


  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable");
    }
  }
  function switchThread(id: string) {
    setThreadId(id);
    setHistoryOpen(false);
    setEditing(null);
    setDraft("");
    setStreaming(null);
    setPreparing(null);
    setAttachments([]);
  }
  function newThread() {
    const id = nextId();
    setTree((current) => ({
      ...current,
      nodes: {
        ...current.nodes,
        [id]: { id, parent: null, children: [], role: "root", text: "" },
      },
    }));
    setThreads((current) => [
      { id, title: "New chat", when: "Now", group: "Today" },
      ...current,
    ]);
    switchThread(id);
  }
  function append(prompt: string, parentId = path.at(-1)?.id || threadId) {
    if (!prompt.trim() || activeStream) return;
    const userId = nextId(),
      assistantId = nextId(),
      time = now();
    setTree((current) => ({
      nodes: {
        ...current.nodes,
        [parentId]: {
          ...current.nodes[parentId],
          children: [...current.nodes[parentId].children, userId],
        },
        [userId]: {
          id: userId,
          parent: parentId,
          children: [],
          role: "user",
          text: prompt.trim(),
          time,
          attachments: [...attachments],
        },

      },
      selection: { ...current.selection, [parentId]: userId },
    }));
    setDraft("");
    setEditing(null);
    setAttachments([]);
    setFolded(false);
    setPreparing({ id: assistantId, parent: userId, children: [], role: "assistant", model, time, ...composeChatReply(prompt) });
    if (thread.title === "New chat")
      setThreads((current) =>
        current.map((t) =>
          t.id === threadId ? { ...t, title: prompt.trim().slice(0, 48) } : t,
        ),
      );
  }
  function regenerate(node: ChatNode) {
    if (activeStream) return;
    const parent = tree.nodes[node.parent!];
    setPreparing({ id: nextId(), parent: parent.id, children: [], role: "assistant", model, time: now(), ...composeChatReply(parent.text, parent.children.length) });
  }
  function stop() {
    if (preparing) {
      setTree((current) => insertReply(current, { ...preparing, text: preparing.text.slice(0, 60), stopped: true, code: undefined, heading: undefined, bullets: undefined, after: undefined, sources: [] }));
      setPreparing(null);
      return;
    }
    if (!streaming) return;
    const id = streaming;
    setTree((current) => ({ ...current, nodes: { ...current.nodes, [id]: { ...current.nodes[id], text: current.nodes[id].text.slice(0, revealed), stopped: true, code: undefined, heading: undefined, bullets: undefined, after: undefined, sources: [] } } }));
    setStreaming(null);
  }
  function citation(node: ChatNode, index: number) {
    if (node.sources?.length !== 3) return null;
    return <button className="bc-citation" aria-label={`Citation ${index + 1}, ${chatSources[index].title}`} aria-pressed={selectedSources[node.id] === index} onClick={() => setSelectedSources((current) => ({ ...current, [node.id]: current[node.id] === index ? -1 : index }))}>{index + 1}</button>;
  }
  function rail(node: ChatNode) {
    const siblings = tree.nodes[node.parent!].children;
    if (siblings.length < 2) return null;
    return (
      <Marker variant="separator"
        className="bc-versions"
        aria-label={`${node.role === "user" ? "Message" : "Reply"} versions`}
      >
        <GitBranch />
        <span className="bc-version-label">{node.role === "user" ? "Original" : "Regenerated here"}</span>
        <div className="bc-version-options">
          {siblings.map((id, index) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              aria-label={`${node.role === "user" ? "Message" : "Reply"} version ${index + 1} of ${siblings.length}`}
              aria-pressed={id === node.id}
              onClick={() => {
                setTree((current) => ({
                  ...current,
                  selection: { ...current.selection, [node.parent!]: id },
                }));
                setEditing(null);
                setStreaming(null);
                setPreparing(null);
              }}
            >
              <span>
                {node.role === "user"
                  ? index
                    ? "Edited"
                    : "Original"
                  : displayModel(tree.nodes[id].model)}
              </span>
              <time>{tree.nodes[id].time}</time>
            </Button>
          ))}
        </div>
        <span className="bc-version-count">
          {siblings.indexOf(node.id) + 1} / {siblings.length}
        </span>
      </Marker>
    );
  }
  function threadGroup(title: string, list: ChatThread[]) {
    if (!list.length) return null;
    return (
      <section key={title} className="bc-thread-group">
        {historyFilter === "All" && <h3>{title}</h3>}
        {list.map((t) => (
          <Button
            key={t.id}
            variant="ghost"
            className="bc-thread-row"
            aria-current={threadId === t.id ? "true" : undefined}
            onClick={() => switchThread(t.id)}
          >
            <span>
              <span className="bc-thread-row-title">{t.title}</span>
              {t.file && (
                <span className="bc-thread-file-row"><span className="bc-thread-file"><FileText />{t.file}</span></span>
              )}
            </span>
            <time>{t.when}</time>
          </Button>
        ))}
      </section>
    );
  }

  return (
    <div className="reui-reference bc-root">
      <header className="bc-header">
        <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="bc-thread-trigger"
              aria-label={`Threads, ${thread.title}`}
            >
              <span>{thread.title}</span>
              <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="reui-reference bc-history"
            align="start"
            sideOffset={2}
            collisionPadding={12}
          >
            <div className="bc-history-tools">
              <Tabs value={historyFilter} onValueChange={setHistoryFilter}>
                <TabsList variant="line">
                  {["All", "Pinned", "Today", "Earlier"].map((tab) => (
                    <TabsTrigger value={tab} key={tab}>
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="icon"
                aria-label="New chat"
                onClick={newThread}
              >
                <Plus />
              </Button>
            </div>
            <div className="bc-history-list">
              {historyFilter === "All" ? (
                <>
                  {threadGroup(
                    "Pinned",
                    threads.filter((t) => pinned.includes(t.id)),
                  )}
                  {(["Today", "Yesterday", "Earlier"] as const).map((group) =>
                    threadGroup(
                      group,
                      threads.filter(
                        (t) => t.group === group && !pinned.includes(t.id),
                      ),
                    ),
                  )}
                </>
              ) : historyFilter === "Pinned" ? (
                threadGroup(
                  "Pinned",
                  threads.filter((t) => pinned.includes(t.id)),
                )
              ) : (
                threadGroup(
                  historyFilter,
                  threads.filter((t) =>
                    historyFilter === "Today"
                      ? t.group === "Today"
                      : t.group !== "Today",
                  ),
                )
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="bc-header-icon"
          aria-label="Pin this thread"
          aria-pressed={pinned.includes(threadId)}
          onClick={() =>
            setPinned((current) =>
              current.includes(threadId)
                ? current.filter((id) => id !== threadId)
                : [...current, threadId],
            )
          }
        >
          <Star fill={pinned.includes(threadId) ? "currentColor" : "none"} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bc-header-icon"
              aria-label="Thread options"
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="reui-reference bc-menu bc-thread-options"
            align="start"
          >
            <DropdownMenuLabel>This thread</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => void copy(location.href)}>
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  void copy(
                    path
                      .map(
                        (n) =>
                          `${n.role}: ${n.text}${n.code ? "\n" + n.code : ""}`,
                      )
                      .join("\n\n"),
                  )
                }
              >
                Copy transcript
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="bc-collapse"
          aria-label={
            folded ? "Expand earlier turns" : "Collapse earlier turns"
          }
          aria-expanded={!folded}
          aria-pressed={folded}
          onClick={() => setFolded((value) => !value)}
        >
          {folded ? <Maximize2 /> : <Minimize2 />}
        </Button>
      </header>
      <MessageScroller className="bc-messages-wrap">
        <MessageScrollerViewport className="bc-viewport" aria-label="Messages">
          <MessageScrollerContent className="bc-transcript" aria-busy={!!activeStream}>
            {!!path.length && (
              <Marker className="bc-date"><MarkerContent>Today <span>10:28 AM</span></MarkerContent></Marker>
            )}
            {folded && path.length > 2 && (
              <Button
                variant="ghost"
                className="bc-unfold"
                onClick={() => setFolded(false)}
              >
                <ChevronDown />
                Show {path.length - 2} earlier turns
              </Button>
            )}
            {!path.length && (
              <div className="bc-welcome">
                <Bot />
                <h2>Start a conversation</h2>
                <p>Ask a question or start with a suggestion.</p>
                {skills.map((skill) => (
                  <Button
                    variant="outline"
                    key={skill}
                    onClick={() => {
                      setDraft(skillPrompts[skill]);
                      editorRef.current?.focus();
                    }}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            )}
            {shown.map((node) => (
              <MessageScrollerItem
                key={node.id}
                messageId={node.id}
                scrollAnchor={node.role === "user"}
                data-chat-node={node.id}
                className={`bc-turn bc-${node.role}`}
              >
                {rail(node)}
                <Message align={node.role === "user" ? "end" : "start"}>
                <MessageContent>
                {node.role === "user" ? (
                  editing === node.id ? (
                    <InputGroup className="bc-edit">
                      <InputGroupTextarea
                        autoFocus
                        aria-label="Edit message"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <InputGroupAddon align="block-end" className="bc-edit-actions">
                        <InputGroupButton size="sm"
                          variant="ghost"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </InputGroupButton>
                        <InputGroupButton size="sm" variant="default"
                          disabled={!editText.trim()}
                          onClick={() => append(editText, node.parent!)}
                        >
                          Send
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  ) : (
                    <div className="bc-user-content">
                      {node.attachments?.map((file) => (
                        <span key={file} className="bc-user-attachment">
                          <FileText />
                          {file}
                        </span>
                      ))}
                      <Bubble align="end" variant="muted" className="max-w-[85%]">
                        <BubbleContent className="bc-bubble"><p>{node.text}</p></BubbleContent>
                      </Bubble>
                      <MessageFooter className="bc-user-meta">
                        <time>{node.time}</time>
                        <div className="bc-user-actions">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy message"
                            onClick={() => void copy(node.text)}
                          >
                            <Copy />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit message"
                            onClick={() => {
                              setEditing(node.id);
                              setEditText(node.text);
                            }}
                          >
                            <Pencil />
                          </Button>
                        </div>
                      </MessageFooter>
                    </div>
                  )
                ) : (
                  <div className="bc-answer">
                    <MessageHeader className="bc-answer-meta">
                      <span>{node.model}</span>
                      <span>·</span>
                      <time>{node.time}</time>
                    </MessageHeader>
                    <Collapsible className="bc-thought">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="bc-reason-trigger" aria-label={`Reasoning, thought for ${node.id.includes("a0") ? 4 : 6} seconds`}>
                          <ChevronRight /><Brain />Thought for {node.id.includes("a0") ? 4 : 6}s
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ol className="bc-reason-list">
                          <li>Read the opener and its supporting release notes.</li>
                          <li>Compared the previous introduction with the current draft and its claims.</li>
                          <li>Chose the draft that puts the reader’s everyday improvements first.</li>
                        </ol>
                      </CollapsibleContent>
                    </Collapsible>
                    <Bubble variant="ghost" className="w-full max-w-full">
                    <BubbleContent className="bc-answer-body">
                      <p>
                        {streaming === node.id
                          ? node.text.slice(0, revealed)
                          : node.text}
                        {citation(node, 0)}
                        {streaming === node.id && <span className="bc-caret" />}
                      </p>
                      {node.heading && streaming !== node.id && <h3>{node.heading}</h3>}
                      {node.bullets && streaming !== node.id && (
                        <ul>
                          {node.bullets.map((text) => (
                            <li key={text}>{text}{text === node.bullets?.at(-1) && citation(node, 2)}</li>
                          ))}
                        </ul>
                      )}
                      {node.code && streaming !== node.id && (
                        <Artifact
                          node={node}
                          onCopy={() => toast.success("Copied to clipboard")}
                        />
                      )}
                      {node.after && streaming !== node.id && <p>{node.after}{citation(node, 1)}</p>}
                    </BubbleContent>
                    </Bubble>
                    {streaming !== node.id && (
                      <>
                        {!!node.sources?.length && <div className="mt-2"><Sources sources={node.sources} selectedIndex={selectedSources[node.id]} onSelect={(index) => setSelectedSources((current) => ({ ...current, [node.id]: current[node.id] === index ? -1 : index }))} /></div>}
                        <MessageFooter className="bc-answer-actions">
                          {node.stopped && <span className="bc-stopped">Stopped by you</span>}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy reply"
                            onClick={() =>
                              void copy(
                                [
                                  node.text,
                                  node.heading,
                                  ...(node.bullets || []),
                                  node.code,
                                  node.after,
                                ]
                                  .filter(Boolean)
                                  .join("\n\n"),
                              )
                            }
                          >
                            <Copy />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Regenerate reply"
                            disabled={!!activeStream}
                            onClick={() => regenerate(node)}
                          >
                            <RotateCcw />
                          </Button>
                          {["Good reply", "Bad reply"].map((label, index) => (
                            <Button
                              key={label}
                              variant="ghost"
                              size="icon"
                              aria-label={label}
                              aria-pressed={votes[node.id] === label}
                              onClick={() =>
                                setVotes((current) => ({
                                  ...current,
                                  [node.id]:
                                    current[node.id] === label ? "" : label,
                                }))
                              }
                            >
                              {index ? <ThumbsDown /> : <ThumbsUp />}
                            </Button>
                          ))}
                        </MessageFooter>
                      </>
                    )}
                  </div>
                )}
                </MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}
            {preparing && <Marker role="status" className="bc-activity"><MarkerIcon><Spinner /></MarkerIcon><MarkerContent>{path.at(-1)?.role === "assistant" ? "Trimming the figure" : "Reading the draft"}</MarkerContent><span className="bc-activity-file">release-notes-3.4.md</span></Marker>}
            {!!path.length && !activeStream && !path.at(-1)?.stopped && (
              <section className="bc-followups" aria-label="Follow ups">
                <h4>Follow Ups</h4>
                {[
                  "Check it against the 3.3 opener",
                  "List every number I need to verify",
                ].map((text) => (
                  <Bubble key={text} variant="outline" className="max-w-full">
                    <BubbleContent asChild><button onClick={() => append(text)}><CornerDownRight />{text}</button></BubbleContent>
                  </Bubble>
                ))}
              </section>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton variant="outline" className="bc-scroll-end" />
      </MessageScroller>
      <footer className="bc-footer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            append(draft);
          }}
        >
          <InputGroup className="bc-composer">
          {!!attachments.length && (
            <div className="bc-attachments">
              {attachments.map((file) => (
                <span key={file}>
                  <FileText />
                  {file}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${file}`}
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item !== file),
                      )
                    }
                  >
                    <X />
                  </Button>
                </span>
              ))}
            </div>
          )}
          <InputGroupTextarea
            ref={editorRef}
            aria-label="Message"
            placeholder="Reply to this thread..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                append(draft);
              }
            }}
          />
          <InputGroupAddon align="block-end" className="bc-composer-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton variant="ghost" size="icon-sm" aria-label="Skills">
                  <Sparkles />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="reui-reference bc-menu"
                align="start"
              >
                <DropdownMenuLabel>Skills</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {skills.map((skill) => (
                    <DropdownMenuItem
                      key={skill}
                      onSelect={() => {
                        setDraft(skillPrompts[skill]);
                        editorRef.current?.focus();
                      }}
                    >
                      {skill}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton variant="ghost" size="icon-sm" aria-label="Attach source">
                  <Paperclip />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="reui-reference bc-menu bc-attach-menu"
                align="start"
              >
                <DropdownMenuLabel>Attach</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {attachOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.title}
                      onSelect={() =>
                        setAttachments((current) =>
                          current.includes(option.detail)
                            ? current
                            : [...current, option.detail],
                        )
                      }
                    >
                      <option.icon />
                      <span>{option.title}</span>
                      <span className="bc-attach-detail">{option.detail}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  variant="ghost"
                  className="bc-model-trigger"
                  size="sm"
                  aria-label={`Model, ${model}`}
                >
                  <span className="bc-provider">
                    <ModelMark name={model} />
                  </span>
                  <span>{model}</span>
                  <ChevronDown />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="reui-reference bc-menu bc-model-menu"
                align="start"
              >
                {chatModelGroups.map((group) => (
                  <DropdownMenuGroup
                    key={group.provider}
                    className="bc-model-group"
                  >
                    <DropdownMenuLabel>
                      <ModelMark name={group.provider} />
                      {group.provider}
                    </DropdownMenuLabel>
                    {group.models.map(([name, context]) => (
                      <DropdownMenuCheckboxItem
                        key={name}
                        checked={model === name}
                        onCheckedChange={() => setModel(name)}
                      >
                        <span>{name}</span>
                        {name === chatModels[0] && (
                          <span className="bc-default">Default</span>
                        )}
                        <span className="bc-model-context">{context}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {activeStream ? (
              <InputGroupButton
                type="button"
                className="bc-send"
                size="icon-sm"
                aria-label="Stop response"
                onClick={stop}
              >
                <Square fill="currentColor" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                className="bc-send"
                size="icon-sm"
                aria-label="Send message"
              >
                <ArrowUp />
              </InputGroupButton>
            )}
          </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="bc-disclaimer">
          Chat can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
}
