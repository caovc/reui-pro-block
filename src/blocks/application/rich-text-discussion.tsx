import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Editor } from "@tiptap/core";
import {
  getRelativeSelection,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from "@tiptap/y-tiptap";
import type { Doc } from "yjs";
import { Check, MessageSquare, Send, Undo2, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  collaborationReplies,
  collaborationThreads,
  collaborators,
  type Discussion,
  type Reply,
} from "./rich-text-collaboration";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function DiscussionAvatar({ author }: { author: string }) {
  const color = collaborators.find(({ name }) => name === author)?.color;
  return (
    <Avatar
      className="size-6 ring-1 ring-inset"
      style={{ color, outline: color ? `1px solid ${color}` : undefined }}
    >
      <AvatarFallback className="text-[9px]">{initials(author)}</AvatarFallback>
    </Avatar>
  );
}

export function CollaborationPresence({
  online,
  activity,
  onOnlineChange,
}: {
  online: boolean;
  activity: string | null;
  onOnlineChange: (online: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {online ? "3 here" : "Not synced"}
      </span>
      <div className="flex -space-x-1.5" aria-label="Collaborators">
        {collaborators.map(({ name }) => {
          const status = !online ? "Not synced" : activity === name ? "Editing" : "Viewing";
          return (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  className="rounded-full"
                  variant="ghost"
                  aria-label={`${name}, ${status}`}
                >
                  <DiscussionAvatar author={name} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {name} · {status}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <label className="flex items-center gap-1.5 text-sm">
        <Switch
          aria-label="Online mode"
          size="sm"
          checked={online}
          onCheckedChange={onOnlineChange}
        />
        <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
      </label>
    </div>
  );
}

export function seedDiscussions(doc: Doc, storageKey?: string) {
  const threads = doc.getMap<Discussion>("threads");
  const replies = doc.getMap<Reply>("replies");
  let initialThreads = collaborationThreads;
  let initialReplies = collaborationReplies;
  if (storageKey) {
    try {
      const stored = JSON.parse(localStorage.getItem(`${storageKey}:comments`) ?? "null");
      if (Array.isArray(stored)) {
        initialThreads = stored.map((thread) => ({
          ...thread,
          id: String(thread.id),
          time: thread.time ?? "",
        }));
        initialReplies = [];
      } else if (Array.isArray(stored?.threads) && Array.isArray(stored?.replies)) {
        initialThreads = stored.threads;
        initialReplies = stored.replies;
      }
    } catch {
      // A missing or unreadable draft uses the sample threads.
    }
  }
  doc.transact(() => {
    for (const thread of initialThreads) threads.set(thread.id, thread);
    for (const reply of initialReplies) replies.set(reply.id, reply);
  });
}

function observeDiscussions(
  doc: Doc,
  onChange: (threads: Discussion[], replies: Reply[]) => void,
  storageKey?: string,
) {
  const threads = doc.getMap<Discussion>("threads");
  const replies = doc.getMap<Reply>("replies");
  const refresh = () => {
    const entries = Array.from(threads.values());
    const responses = Array.from(replies.values());
    onChange(entries, responses);
    if (storageKey) {
      try {
        localStorage.setItem(
          `${storageKey}:comments`,
          JSON.stringify({ threads: entries, replies: responses }),
        );
      } catch {
        // Discussions still work for the current session.
      }
    }
  };
  threads.observe(refresh);
  replies.observe(refresh);
  refresh();
  return () => {
    threads.unobserve(refresh);
    replies.unobserve(refresh);
  };
}

export type DiscussionSelection = {
  quote: string;
  anchor: ReturnType<typeof getRelativeSelection> | null;
};

export function captureDiscussionSelection(editor: Editor): DiscussionSelection {
  const { state } = editor;
  const sync = ySyncPluginKey.getState(state);
  return {
    quote: state.doc.textBetween(state.selection.from, state.selection.to, " "),
    anchor: !state.selection.empty && sync ? getRelativeSelection(sync.binding, state) : null,
  };
}

function markDiscussion(editor: Editor, anchor: DiscussionSelection["anchor"], id: string) {
  const { state } = editor;
  const sync = ySyncPluginKey.getState(state);
  if (!anchor || !sync || !editor.isEditable) return;
  const position = (relative: NonNullable<typeof anchor.anchor>) =>
    relativePositionToAbsolutePosition(sync.doc, sync.type, relative, sync.binding.mapping);
  if (!anchor.anchor || !anchor.head) return;
  const start = position(anchor.anchor);
  const end = position(anchor.head);
  if (start === null || end === null || start === end) return;
  const mark = state.schema.marks.comment.create({ id });
  editor.view.dispatch(state.tr.addMark(Math.min(start, end), Math.max(start, end), mark));
}

export function RichTextDiscussion({
  editor,
  doc,
  storageKey,
  draft,
  onDraftChange,
}: {
  editor: Editor;
  doc: Doc;
  storageKey?: string;
  draft: DiscussionSelection | null;
  onDraftChange: (draft: DiscussionSelection | null) => void;
}) {
  const [threads, setThreads] = useState<Discussion[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      observeDiscussions(
        doc,
        (nextThreads, nextReplies) => {
          setThreads(nextThreads);
          setReplies(nextReplies);
        },
        storageKey,
      ),
    [doc, storageKey],
  );

  useEffect(() => {
    if (draft) composer.current?.focus();
  }, [draft]);

  useEffect(() => {
    const element = editor.view.dom;
    const openThread = (event: MouseEvent) => {
      const mark = (event.target as Element).closest<HTMLElement>("[data-comment]");
      if (mark?.dataset.comment) setActive(mark.dataset.comment);
    };
    element.addEventListener("click", openThread);
    return () => element.removeEventListener("click", openThread);
  }, [editor]);

  const count = threads.filter(({ resolved }) => !resolved).length;
  function createThread(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || !draft || !editor.isEditable) return;
    const id = crypto.randomUUID();
    markDiscussion(editor, draft.anchor, id);
    doc.getMap<Discussion>("threads").set(id, {
      id,
      author: "Alex Morgan",
      message: message.trim(),
      quote: draft.quote,
      resolved: false,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
    setMessage("");
    onDraftChange(null);
    setActive(id);
  }

  function addReply(event: FormEvent, thread: string) {
    event.preventDefault();
    if (!replyText.trim() || !editor.isEditable) return;
    const id = crypto.randomUUID();
    doc
      .getMap<Reply>("replies")
      .set(id, { id, thread, author: "Alex Morgan", message: replyText.trim() });
    setReplyText("");
  }

  function activate(thread: Discussion) {
    setActive(active === thread.id ? null : thread.id);
    setReplyText("");
    const fragment = Array.from(
      editor.view.dom.querySelectorAll<HTMLElement>("[data-comment]"),
    ).find((element) => element.dataset.comment === thread.id);
    fragment?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <aside className="rich-text-discussion" aria-label="Document comments">
      <Frame dense>
        <FramePanel className="p-3 shadow-none">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-medium">Comments</h3>
            <Badge variant="outline" size="sm">
              {count}
            </Badge>
            {threads.some(({ resolved }) => resolved) && (
              <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch size="sm" checked={showResolved} onCheckedChange={setShowResolved} />
                Resolved
              </label>
            )}
          </div>
          {draft && (
            <form className="mb-3 grid gap-2 rounded-lg border p-3" onSubmit={createThread}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">New comment</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Cancel comment"
                  onClick={() => {
                    onDraftChange(null);
                    setMessage("");
                  }}
                >
                  <X />
                </Button>
              </div>
              {draft.quote && (
                <blockquote className="line-clamp-2 text-xs text-muted-foreground">
                  “{draft.quote}”
                </blockquote>
              )}
              <Textarea
                ref={composer}
                aria-label="Write a comment"
                placeholder="Write a comment…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="justify-self-end"
                disabled={!message.trim()}
              >
                <Send />
                Add comment
              </Button>
            </form>
          )}
          <ItemGroup>
            {threads
              .filter(({ resolved }) => showResolved || !resolved)
              .map((thread) => {
                const responses = replies.filter(({ thread: id }) => id === thread.id);
                const open = active === thread.id;
                return (
                  <Item
                    key={thread.id}
                    size="sm"
                    variant={open ? "muted" : "default"}
                    className="rich-text-discussion-thread"
                    data-open={open}
                  >
                    <ItemMedia>
                      <DiscussionAvatar author={thread.author} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <Button
                        size="xs"
                        variant="ghost"
                        aria-expanded={open}
                        className="h-auto justify-start px-0 text-sm"
                        onClick={() => activate(thread)}
                      >
                        {thread.author}
                        <span className="text-xs font-normal text-muted-foreground">
                          {thread.time}
                        </span>
                      </Button>
                      {thread.quote && (
                        <blockquote className="rich-text-discussion-quote">
                          “{thread.quote}”
                        </blockquote>
                      )}
                      <p className="rich-text-discussion-message">{thread.message}</p>
                      {responses.length > 0 && !open && (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="w-fit px-0 font-normal text-muted-foreground"
                          onClick={() => activate(thread)}
                        >
                          {responses.length} {responses.length === 1 ? "reply" : "replies"}
                        </Button>
                      )}
                      {open &&
                        responses.map((reply) => (
                          <div className="mt-2 border-l pl-2" key={reply.id}>
                            <span className="text-xs font-medium">{reply.author}</span>
                            <p className="text-sm">{reply.message}</p>
                          </div>
                        ))}
                      {open && !thread.resolved && (
                        <form
                          className="mt-2 grid gap-1.5"
                          onSubmit={(event) => addReply(event, thread.id)}
                        >
                          <Textarea
                            rows={2}
                            aria-label="Write a reply"
                            placeholder="Write a reply…"
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                          />
                          <Button
                            type="submit"
                            size="xs"
                            className="justify-self-end"
                            disabled={!replyText.trim()}
                          >
                            Reply
                          </Button>
                        </form>
                      )}
                    </ItemContent>
                    <ItemActions className="self-start">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${thread.resolved ? "Reopen" : "Resolve"} thread from ${thread.author}`}
                        onClick={() => {
                          doc
                            .getMap<Discussion>("threads")
                            .set(thread.id, { ...thread, resolved: !thread.resolved });
                        }}
                      >
                        {thread.resolved ? <Undo2 /> : <Check />}
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })}
          </ItemGroup>
          {!count && !showResolved && (
            <p className="flex items-center gap-2 px-2 pb-2 text-sm text-muted-foreground">
              <MessageSquare className="size-4" />
              No open comments
            </p>
          )}
        </FramePanel>
      </Frame>
    </aside>
  );
}
