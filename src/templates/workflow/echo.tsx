import { useEchoScheduledModel } from "./workflow-models";
import { echoArtifacts } from "./echo-artifact-data";
import { demoAvatar } from "@/lib/demo-artwork";
import { useState } from "react";
import {
  Bookmark,
  PanelLeft,
  CircleHelp,
  BookOpen,
  ChevronDown,
  Clock,
  Code,
  Folder,
  Menu,
  MessageSquare,
  Paperclip,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { Button, Input, Panel, Logo, Segments, CreateDialog, WorkspaceSettings } from "./shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EchoProjects, type EchoProject } from "./echo-projects";
import { EchoComposer } from "./echo-composer";
import { EchoScheduled } from "./echo-scheduled";
import { EchoArtifactList, EchoArtifactPanel } from "./echo-artifacts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const recent = [
  "Stripe webhook 500s on charge.refunded",
  "Admin guide refresh",
  "Audit log export limits",
  "Rate limit the export endpoint",
  "Search returns stale titles after rename",
  "Retry budget for the events consumer",
  "Churn by plan tier",
  "Mobile onboarding revamp scope",
  "Why is p95 latency up on eu-west",
  "Compacting long transcripts",
  "Cursor pagination for the audit log",
  "Feature flag cleanup after 3.4",
];
export default function Echo() {
  const scheduledRecords = useEchoScheduledModel();
  const [view, setView] = useState("New chat");
  const [collapsed, setCollapsed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [artifactIndex, setArtifactIndex] = useState<number | null>(null);
  const [group, setGroup] = useState("Chats");
  const [mode, setMode] = useState("Create");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [think, setThink] = useState(true);
  const [search, setSearch] = useState(false);
  const [model, setModel] = useState("Claude Sonnet 5");
  const [open, setOpen] = useState(false);
  const [create, setCreate] = useState(false);
  const [projects, setProjects] = useState<EchoProject[]>([
    { id: "admin", name: "Admin 3.4", chats: 4, changed: "1h", icon: 0 },
    { id: "billing", name: "Billing reliability", chats: 2, changed: "2m", icon: 1 },
    { id: "growth", name: "Growth analytics", chats: 1, changed: "3h", icon: 2 },
    { id: "platform", name: "Platform performance", chats: 3, changed: "12m", icon: 3 },
    { id: "search", name: "Search relevance", chats: 2, changed: "34m", icon: 4 },
  ]);
  const [scheduled, setScheduled] = useState([
    "Weekly release summary",
    "Review open incidents",
    "Monthly usage report",
  ]);
  function selectChat(title: string) {
    setView(title);
    setMessages([
      { role: "user", text: title },
      {
        role: "assistant",
        text: `Here is the saved workspace context for “${title}”.\n\n1. Confirm the expected behavior and reproduce the issue.\n2. Review the relevant changes and capture a small test case.\n3. Ship the fix with a rollback plan and monitor the outcome.\n\nThis is a local interactive preview; no AI service is connected.`,
      },
    ]);
    setOpen(false);
  }
  function send(text = input, context: string[] = []) {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: context.length ? `${text}\n\nContext: ${context.join(", ")}` : text },
      {
        role: "assistant",
        text: `Local preview response\n\nFor “${text}”, start by defining the outcome, gather the relevant workspace context, and draft a concise implementation plan.\n\n• Scope the change and its owner\n• Validate the behavior with a focused check\n• Record follow-ups and acceptance criteria\n\nConnect your model provider to generate real responses.${context.length ? `\n\nContext staged: ${context.join(", ")}.` : ""}\n\n${model} · ${[think && "Think", search && "Search"].filter(Boolean).join(" + ") || "No tools"}`,
      },
    ]);
    setView(text.slice(0, 48));
    setInput("");
  }
  const sidebar = (
    <>
      <div className="wf-brand">
        <Logo />
        <strong>Bricklane Chat</strong>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Search chats"
          onClick={() => {
            setSearch(!search);
            setView("Search");
          }}
        >
          <Search />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Collapse sidebar"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeft />
        </Button>
      </div>
      <Segments
        items={["Chats", "Artifacts"]}
        value={group}
        onChange={(x) => {
          setGroup(x);
          if (x === "Chats") setArtifactIndex(null);
        }}
      />
      {group === "Chats" ? (
        <>
          <nav className="echo-nav">
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => {
                setView("New chat");
                setMessages([]);
                setOpen(false);
              }}
            >
              <Plus />
              New Chat
            </Button>
            {[
              { label: "Projects", icon: Folder, count: projects.length },
              { label: "Scheduled", icon: Clock, count: scheduled.length },
              { label: "Settings", icon: Settings },
            ].map(({ label, icon: Icon, count }) => (
              <Button
                key={label}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  setView(label);
                  setOpen(false);
                }}
              >
                <Icon />
                {label}
                <span className="ml-auto">{count}</span>
              </Button>
            ))}
          </nav>
          <div className="echo-history">
            {["Pinned", "Today", "Yesterday"].map((x, i) => (
              <section key={x}>
                <p>
                  {x}
                  <span>{i === 0 ? 3 : i === 1 ? 4 : 5}</span>
                </p>
                {recent
                  .slice(i === 0 ? 0 : i === 1 ? 3 : 7, i === 0 ? 3 : i === 1 ? 7 : 12)
                  .map((t) => (
                    <button key={t} onClick={() => selectChat(t)}>
                      {t}
                    </button>
                  ))}
              </section>
            ))}
          </div>
        </>
      ) : (
        <EchoArtifactList
          selected={artifactIndex}
          onSelect={(index) => {
            selectChat(echoArtifacts[index].chat);
            setArtifactIndex(index);
          }}
        />
      )}
      <div className="echo-footer">
        <Button variant="ghost" onClick={() => setView("Documentation")}>
          <BookOpen />
          Docs
        </Button>
        <Button variant="ghost" onClick={() => setView("What is new")}>
          <Star />
          What is new
        </Button>
        <Button variant="ghost" onClick={() => setView("Documentation")}>
          <CircleHelp />
          Help
        </Button>
        <Button variant="outline" onClick={() => setView("Settings")}>
          <Avatar>
            <AvatarImage src={demoAvatar("Echo account")} />
            <AvatarFallback>sh</AvatarFallback>
          </Avatar>
          <span className="echo-user-name">
            shadcn<small>🟣 Atlas · Max</small>
          </span>
        </Button>
      </div>
    </>
  );
  const starter =
    mode === "Create"
      ? [
          "Draft the 3.4 release notes for admins",
          "Write a rollback plan for the webhook fix",
          "Rewrite the trial expiry email",
        ]
      : mode === "Explore"
        ? [
            "Summarize churn by plan tier",
            "What changed in our latest release?",
            "Find opportunities to simplify onboarding",
          ]
        : mode === "Code"
          ? [
              "Review the webhook retry logic",
              "Add cursor pagination to the audit log",
              "Write a test for the export endpoint",
            ]
          : [
              "Explain how webhooks work",
              "Teach me about rate limiting",
              "Compare database indexing strategies",
            ];
  return (
    <div
      className={`wf-root echo-root ${["Projects", "Scheduled", "Artifacts"].includes(view) ? "echo-secondary" : ""}`}
    >
      <aside className={`echo-sidebar ${collapsed ? "echo-collapsed" : ""}`}>{sidebar}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetTitle>Bricklane Chat</SheetTitle>
          <SheetDescription>Conversations and projects</SheetDescription>
          {sidebar}
        </SheetContent>
      </Sheet>
      <main className="echo-main">
        <header className="wf-header">
          <Button
            variant="ghost"
            size="icon"
            className="wf-mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <span>{view}</span>
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeft />
            </Button>
          )}
          <div className="wf-header-actions">
            <Button
              variant={bookmarked ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Bookmark chat"
              aria-pressed={bookmarked}
              onClick={() => setBookmarked(!bookmarked)}
            >
              <Bookmark fill={bookmarked ? "currentColor" : "none"} />
            </Button>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger aria-label="Select AI model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Claude Sonnet 5", "GPT-5", "Gemini 2.5 Pro"].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        {view === "Settings" ? (
          <div className="wf-content">
            <WorkspaceSettings />
          </div>
        ) : view === "Projects" ? (
          <EchoProjects
            projects={projects}
            open={create}
            onCreate={(name) =>
              setProjects((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  name,
                  chats: 0,
                  changed: "just now",
                  icon: current.length % 5,
                },
              ])
            }
            onClose={() => setCreate(false)}
            onOpen={selectChat}
            onNew={() => setCreate(true)}
            onRename={(id, name) =>
              setProjects((current) =>
                current.map((project) =>
                  project.id === id ? { ...project, name, changed: "just now" } : project,
                ),
              )
            }
            onDelete={(id) =>
              setProjects((current) => current.filter((project) => project.id !== id))
            }
          />
        ) : view === "Scheduled" ? (
          <EchoScheduled records={scheduledRecords} onOpen={selectChat} />
        ) : view === "Artifacts" ? (
          <div className="wf-content">
            <h1>Artifacts</h1>
            <div className="wf-grid wf-three">
              {["stripe-webhook.ts", "admin-notes-3.4.pdf", "audit-export.csv"].map((x) => (
                <Panel title={x} key={x} description="From your recent conversations">
                  <Button variant="outline" onClick={() => selectChat(x)}>
                    View artifact
                  </Button>
                </Panel>
              ))}
            </div>
          </div>
        ) : view === "Search" ? (
          <div className="wf-content">
            <Input
              aria-label="Search chat history"
              placeholder="Search conversations…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {recent
              .filter((x) => x.toLowerCase().includes(input.toLowerCase()))
              .map((x) => (
                <Button
                  key={x}
                  variant="ghost"
                  onClick={() => {
                    selectChat(x);
                    setInput("");
                  }}
                >
                  {x}
                </Button>
              ))}
          </div>
        ) : view === "Documentation" || view === "What is new" ? (
          <div className="wf-content">
            <Panel title={view} description="Your workspace for ideas, code, and research.">
              <p>
                Create conversations, organize projects, and explore saved artifacts. This
                independent preview stores session changes locally and does not call an AI provider.
              </p>
            </Panel>
          </div>
        ) : (
          <>
            <div className={`echo-conversation ${messages.length ? "has-messages" : ""}`}>
              {messages.length ? (
                messages.map((m, i) => (
                  <div key={i} className={`echo-message ${m.role}`}>
                    <strong>{m.role === "user" ? "You" : model}</strong>
                    <p>{m.text}</p>
                  </div>
                ))
              ) : (
                <>
                  <h1>How can I help you?</h1>
                  <p className="wf-muted">
                    Ask about the codebase, the data, or this week's release.
                  </p>
                  <div className="echo-modes">
                    {[
                      { x: "Create", icon: Sparkles },
                      { x: "Explore", icon: Search },
                      { x: "Code", icon: Code },
                      { x: "Learn", icon: BookOpen },
                    ].map(({ x, icon: Icon }) => (
                      <Button
                        key={x}
                        size="sm"
                        variant={x === mode ? "secondary" : "outline"}
                        onClick={() => setMode(x)}
                      >
                        <Icon />
                        {x}
                      </Button>
                    ))}
                  </div>
                  <div className="echo-suggestions">
                    {starter.map((t) => (
                      <button key={t} onClick={() => send(t)}>
                        {t}
                        <span>↵</span>
                      </button>
                    ))}
                  </div>
                  <p className="wf-muted">Recent chats</p>
                  {recent.slice(0, 4).map((t, i) => (
                    <button className="echo-recent" key={t} onClick={() => selectChat(t)}>
                      {i < 3 ? <Pin className="size-4" /> : <MessageSquare className="size-4" />}
                      <span>{t}</span>
                      {i < 3 && (
                        <span className="echo-file-chip">
                          <Paperclip className="size-3" />
                          {["stripe-webhook.ts", "admin-notes-3.4.pdf", "audit-export.csv"][i]}
                        </span>
                      )}
                      <small>{["2m", "1h", "5h", "12m"][i]}</small>
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="echo-composer">
              <div className="echo-context">
                Context 64 percent full · Plan limit resets Friday 12:00 PM{" "}
                <ChevronDown className="size-3" />
              </div>
              <EchoComposer
                value={input}
                onChange={setInput}
                think={think}
                onThink={setThink}
                search={search}
                onSearch={setSearch}
                onSend={(context) => send(input, context)}
              />
              <p className="echo-disclaimer">
                Bricklane Chat can make mistakes. Check important info.
              </p>
            </div>
          </>
        )}
      </main>
      {artifactIndex !== null && (
        <EchoArtifactPanel
          index={artifactIndex}
          onSelect={(index) => {
            selectChat(echoArtifacts[index].chat);
            setArtifactIndex(index);
          }}
          onClose={() => setArtifactIndex(null)}
        />
      )}
      <CreateDialog
        title={`New ${view === "Projects" ? "project" : "scheduled task"}`}
        open={create && view !== "Projects"}
        onClose={() => setCreate(false)}
        onCreate={(name) => setScheduled([...scheduled, name])}
      />
    </div>
  );
}
