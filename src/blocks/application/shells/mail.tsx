import { useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FileText,
  Filter,
  Inbox,
  Paperclip,
  RefreshCw,
  ReplyAll,
  Send,
  Shield,
  SquarePen,
  Star,
  Trash2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button, Badge, Face, PlaceholderCanvas, ReuiMark, WorkspaceMenu, toast } from "./chrome";
type MailItem = {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  starred?: boolean;
  file?: string;
  label?: string;
  action?: string[];
  priority?: boolean;
  folder?: string;
};
const initialMail: MailItem[] = [
  {
    id: 1,
    sender: "Sarah Chen",
    subject: "Design review · component library v2.0",
    preview:
      "Hey Nick, I’ve reviewed the latest Figma handoff and left comments on the spacing tokens and hover states.",
    time: "10:42 AM",
    unread: true,
    starred: true,
    label: "Design",
    priority: true,
  },
  {
    id: 2,
    sender: "Marcus Lee",
    subject: "Q4 Sprint planning, your input needed",
    preview:
      "Sharing the draft sprint board for Q4. We have three major milestones for launch, icons, and onboarding.",
    time: "9:15 AM",
    unread: true,
    file: "Q4-Sprint-Board.pdf (1.2 MB)",
    label: "Work",
  },
  {
    id: 3,
    sender: "Emma Wilson",
    subject: "Partnership proposal · ReUI integration",
    preview: "We’ve been using ReUI for six months and would love to explore a formal partnership.",
    time: "Yesterday",
    unread: true,
    label: "Business",
    action: ["Schedule Call", "View Proposal"],
  },
  {
    id: 4,
    sender: "GitHub",
    subject: "[keenthemes] Security advisory on rollup affects your repositories",
    preview:
      "A dependency security advisory affects one or more repositories. Review the recommended update.",
    time: "Yesterday",
    label: "Security",
  },
  {
    id: 5,
    sender: "Stripe",
    subject: "Payment received · $299 from Acme Corp",
    preview: "A payment of $299 has been received. Your current account balance is $1,248.",
    time: "Mon",
    label: "Finance",
  },
  {
    id: 6,
    sender: "Alex Martin",
    subject: "Invoice #1024 · November services",
    preview:
      "Attached is the invoice for November consulting services. Thank you for the continued partnership.",
    time: "Mon",
    file: "Invoice-1024.pdf (243 KB)",
    starred: true,
  },
  {
    id: 7,
    sender: "Vercel",
    subject: "✓ Deployment successful · reui.io/pro",
    preview:
      "Your latest deployment to production is live. Build time: 47 seconds. All checks passed.",
    time: "Sun",
    label: "Production",
  },
  {
    id: 8,
    sender: "Jessica Brooks",
    subject: "Following up on your Config 2024 talk",
    preview:
      "I enjoyed your talk about design systems and would love to discuss your component workflow.",
    time: "Nov 22",
    unread: true,
    priority: true,
  },
  {
    id: 9,
    sender: "Linear",
    subject: "Sprint review: 18 issues closed this week",
    preview: "Your team closed eighteen issues, moved five to review, and created eight new tasks.",
    time: "Nov 21",
    starred: true,
  },
  {
    id: 10,
    sender: "James Kim",
    subject: "Figma Config 2025 · Speaker confirmation",
    preview: "Congratulations! Your session on production-ready design systems has been approved.",
    time: "Nov 20",
    label: "Events",
    action: ["Confirm Attendance"],
  },
];
export default function MailInbox() {
  const [mails, setMails] = useState(initialMail);
  const [selected, setSelected] = useState(1);
  const [folder, setFolder] = useState("Inbox");
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [compose, setCompose] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [listHidden, setListHidden] = useState(false);
  const [sort, setSort] = useState(false);
  const current = mails.find((m) => m.id === selected);
  const filtered = mails
    .filter((m) => (folder === "Starred" ? m.starred : (m.folder ?? "Inbox") === folder))
    .filter((m) =>
      `${m.sender} ${m.subject} ${m.preview}`.toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (m) =>
        tab === "All" ||
        (tab === "Unread" && m.unread) ||
        (tab === "Starred" && m.starred) ||
        (tab === "Files" && m.file),
    )
    .sort((a, b) => (sort ? a.sender.localeCompare(b.sender) : a.id - b.id));
  const folders = [
    ["Inbox", Inbox],
    ["Starred", Star],
    ["Sent", Send],
    ["Drafts", FileText],
    ["Archive", Archive],
    ["Spam", Shield],
    ["Trash", Trash2],
  ] as const;
  function openReply() {
    setTo(current?.sender ?? "");
    setSubject(`Re: ${current?.subject ?? ""}`);
    setCompose(true);
  }
  return (
    <div className="shell-reference" data-shell-variant="4" data-panel-hidden={listHidden}>
      <nav className="shell-icon-rail">
        <ReuiMark />
        <div className="mt-5 flex flex-col gap-1.5">
          {folders.map(([name, Icon]) => (
            <Button
              key={name}
              variant={folder === name ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={name}
              onClick={() => {
                setFolder(name);
                if (name === "Starred") setTab("Starred");
                else setTab("All");
              }}
            >
              <Icon />
            </Button>
          ))}
        </div>
        <div className="mt-auto">
          <WorkspaceMenu collapsed user />
        </div>
      </nav>
      {!listHidden && (
        <aside className="shell-secondary !w-[392px] max-md:!w-[calc(100vw-48px)]">
          <div className="flex h-[49px] shrink-0 items-center gap-2 border-b px-3">
            <span className="flex-1 text-xs font-semibold">
              {folder}{" "}
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                {mails.filter((m) => m.unread).length}
              </Badge>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh inbox"
              onClick={() => toast.success("Inbox is up to date")}
            >
              <RefreshCw />
            </Button>
            <Button
              variant={sort ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Sort by sender"
              onClick={() => setSort(!sort)}
            >
              <Filter />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Compose new email"
              onClick={() => {
                setTo("");
                setSubject("");
                setBody("");
                setCompose(true);
              }}
            >
              <SquarePen />
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-b px-2 py-2">
            <Input
              aria-label="Search mail"
              placeholder="Search mail…"
              className="h-7 text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList variant="line" className="h-7 w-full justify-start gap-2">
                {["All", "Unread", "Starred", "Files"].map((t) => (
                  <TabsTrigger value={t} key={t} className="h-6 rounded-full px-2 text-[10px]">
                    {t}
                    {t !== "All" && (
                      <span className="ml-1 text-[9px]">
                        {
                          mails.filter((m) =>
                            t === "Unread" ? m.unread : t === "Starred" ? m.starred : m.file,
                          ).length
                        }
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="shell-scroll">
            {filtered.map((m, i) => (
              <div key={m.id} className={`border-b p-3 ${m.id === selected ? "bg-muted/30" : ""}`}>
                <button
                  className="flex w-full gap-2 text-left"
                  onClick={() => {
                    setSelected(m.id);
                    if (matchMedia("(max-width:767px)").matches) setListHidden(true);
                    setMails(mails.map((v) => (v.id === m.id ? { ...v, unread: false } : v)));
                  }}
                >
                  <div className="flex w-2 shrink-0 items-start pt-3">
                    {m.unread && <span className="size-1.5 rounded-full bg-foreground" />}
                  </div>
                  <Face name={m.sender} index={i} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-xs ${m.unread ? "font-semibold" : ""}`}>
                        {m.sender}
                        {m.priority && <span className="ml-0.5 text-destructive">!</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                        {m.starred && (
                          <Star className="size-3 fill-[var(--chart-4)] text-[var(--chart-4)]" />
                        )}
                        {m.file && <Paperclip className="size-3" />}
                        {m.time}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px]">{m.subject}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">{m.preview}</p>
                  </div>
                </button>
                <div className="ml-12 mt-3 flex flex-wrap items-center gap-1.5">
                  {m.id === 1 && (
                    <div className="mr-1 flex [&>*+*]:-ml-1">
                      {[0, 1, 2].map((j) => (
                        <Face key={j} small index={j} />
                      ))}
                    </div>
                  )}
                  {m.label && (
                    <Badge variant="outline" className="h-4 rounded px-1 text-[9px] font-normal">
                      {m.label}
                    </Badge>
                  )}
                  {m.action?.map((action) => (
                    <Button
                      key={action}
                      variant={action.startsWith("View") ? "outline" : "default"}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => toast(`${action} selected`, { description: m.subject })}
                    >
                      {action}
                    </Button>
                  ))}
                  {m.file && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 max-w-full gap-1 px-2 text-[10px]"
                      onClick={() =>
                        toast("Demo attachment selected", {
                          description: m.file,
                        })
                      }
                    >
                      <Paperclip />
                      <span className="max-w-32 truncate">{m.file}</span>
                      <ArrowDownToLine />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                No messages match your search.
              </p>
            )}
          </div>
        </aside>
      )}
      <main className={`shell-content-frame ${!listHidden ? "max-md:hidden" : ""}`}>
        <header className="shell-header border-b">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={listHidden ? "Show message list" : "Previous message"}
              onClick={() => {
                if (listHidden) {
                  setListHidden(false);
                } else {
                  const i = mails.findIndex((m) => m.id === selected);
                  setSelected(mails[Math.max(0, i - 1)]?.id);
                }
              }}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next message"
              onClick={() => {
                const i = mails.findIndex((m) => m.id === selected);
                setSelected(mails[Math.min(mails.length - 1, i + 1)]?.id);
              }}
            >
              <ChevronRight />
            </Button>
            <span className="ml-2 truncate text-xs font-semibold">
              {current?.subject ?? "No message selected"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={openReply}>
              <ReplyAll />
              Reply all
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={current?.starred ? "Unstar message" : "Star message"}
              onClick={() =>
                setMails(mails.map((m) => (m.id === selected ? { ...m, starred: !m.starred } : m)))
              }
            >
              <Star
                className={current?.starred ? "fill-[var(--chart-4)] text-[var(--chart-4)]" : ""}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Bookmark message"
              aria-pressed={bookmarked}
              onClick={() => setBookmarked(!bookmarked)}
            >
              <Bookmark className={bookmarked ? "fill-current" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete message"
              onClick={() => {
                setMails(mails.map((m) => (m.id === selected ? { ...m, folder: "Trash" } : m)));
                setSelected(mails.find((m) => m.id !== selected)?.id ?? 0);
                toast("Message deleted in demo");
              }}
            >
              <Trash2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hide message list"
              onClick={() => setListHidden(!listHidden)}
            >
              <Ellipsis />
            </Button>
          </div>
        </header>
        <PlaceholderCanvas />
      </main>
      <Dialog open={compose} onOpenChange={setCompose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subject.startsWith("Re:") ? "Reply to message" : "New message"}
            </DialogTitle>
            <DialogDescription>Messages remain in this local demo.</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              setMails([
                {
                  id: Date.now(),
                  sender: "Nick Bold",
                  subject,
                  preview: body,
                  time: "Just now",
                  label: "Sent",
                  folder: "Sent",
                },
                ...mails,
              ]);
              setCompose(false);
              toast.success("Message added to demo outbox");
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="mail-to">To</FieldLabel>
                <Input
                  id="mail-to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="mail-subject">Subject</FieldLabel>
                <Input
                  id="mail-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="mail-body">Message</FieldLabel>
                <Textarea
                  id="mail-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit">
              <Send />
              Send demo message
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
