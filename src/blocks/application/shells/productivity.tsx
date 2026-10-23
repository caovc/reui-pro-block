import { SidebarCollection } from "@/components/reui/sidebar";
import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { useState } from "react";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Badge as ReuiBadge } from "@/components/reui/badge";
import { ResponsiveAssistantPanel } from "./responsive-assistant";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Code2,
  FileText,
  History,
  MapPin,
  Search,
  SlidersHorizontal,
  CircleCheck,
  Flag,
  ListChecks,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Inbox,
  List,
  Mail,
  Mic,
  PanelLeft,
  Plus,
  Send,
  Settings,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Calendar } from "@/components/ui/calendar";
import {
  Button,
  Badge,
  CreateItemDialog,
  Face,
  Input,
  Navigation,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
} from "./chrome";
import { Choices, GroupedNav, PageTitle, Sidebar } from "./primitives";
import { EventCreator } from "./calendar-panel";
const models = ["GPT-4", "Claude", "Gemini"];
const recent = [
  "Quarterly revenue summary",
  "Refactor auth middleware",
  "Lisbon trip itinerary",
  "Launch checklist draft",
  "Explain vector search",
  "Optimize SQL query",
];
export function ModelChat() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [model, setModel] = useState("GPT-4");
  const [draft, setDraft] = useState("");
  const [web, setWeb] = useState(false);
  const [thread, setThread] = useState(recent[0]);
  const [history, setHistory] = useState(recent);
  return (
    <div className="shell-reference bg-muted/40 p-2 gap-2" data-shell-variant="17">
      <Sidebar width={240} collapsed={collapsed} className="rounded-xl border !bg-background ">
        <div className="flex h-10 items-center gap-2 px-1">
          <ReuiMark small />
          {!collapsed && <strong className="flex-1 text-sm">Bricklane AI</strong>}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle Sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <PanelLeft />
          </Button>
        </div>
        <Button
          size="sm"
          className="my-3 justify-between rounded-full"
          onClick={() => {
            setDraft("");
            setThread("");
          }}
        >
          New Chat
          <Sparkles />
        </Button>
        {!collapsed && (
          <>
            <p className="shell-section-label">AI Model</p>
            <div className="grid grid-cols-3 gap-2">
              {models.map((name, i) => (
                <Button
                  variant={model === name ? "secondary" : "outline"}
                  key={name}
                  aria-label={name}
                  className="h-14 flex-col gap-1 text-[11px] font-normal"
                  onClick={() => setModel(name)}
                  aria-pressed={model === name}
                >
                  <span className={i === 1 ? "text-orange-500" : i === 2 ? "text-blue-500" : ""}>
                    {["✺", "✳", "✦"][i]}
                  </span>
                  {name}
                </Button>
              ))}
            </div>
            <div className="model-chat-pinned">
              <SidebarCollection
                label="Pinned"
                onSelect={setThread}
                rows={[
                  {
                    label: "Onboarding email draft",
                    icon: <Mail />,
                    badge: <small>Claude · 7 msgs</small>,
                  },
                ]}
              />
            </div>
            <Navigation
              label="Recent"
              items={history.map((label, i) => ({
                label,
                icon: [FileText, Code2, MapPin, ListChecks, Search, Inbox][i % 6],
              }))}
              active={thread}
              onSelect={setThread}
            />
            <Navigation
              label="Quick Actions"
              items={[
                { label: "Favorites", icon: Star, badge: "2" },
                { label: "Clear History", icon: Trash2 },
                { label: "Chat History", icon: History },
                { label: "Templates", icon: FileText, badge: "5" },
                { label: "AI Settings", icon: SlidersHorizontal },
              ]}
              active={thread}
              onSelect={(value) => {
                setThread(value);
                if (value === "Clear History") {
                  setHistory([]);
                  setThread("");
                  toast.success("Chat history cleared");
                }
              }}
            />
          </>
        )}
        <div className="mt-auto">
          <WorkspaceMenu
            user
            displayName="AI Assistant"
            initial="AI Assistant"
            subtitle="Always here to help"
          />
        </div>
      </Sidebar>
      <AppShellInset className="shell-content-frame rounded-xl border">
        <header className="shell-header">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Choose model">
                {model}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuGroup>
                {models.map((name, i) => (
                  <DropdownMenuItem
                    key={name}
                    aria-label={name}
                    className="items-start p-3"
                    onSelect={() => setModel(name)}
                  >
                    <span className="mt-0.5">{["✺", "✳", "✦"][i]}</span>
                    <div className="flex-1">
                      <p className="flex items-center gap-2 font-medium">
                        {name}
                        {i < 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {i === 0 ? "Default" : "Fast"}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          [
                            "Most capable for complex reasoning.",
                            "Thoughtful, great for long writing.",
                            "Fast multimodal answers and search.",
                          ][i]
                        }
                      </p>
                    </div>
                    {model === name && <Check className="size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              toast.success("Chat link copied");
            }}
          >
            <Share2 />
            Share Chat
          </Button>
        </header>
        <div className="shell-chat-welcome flex min-h-0 flex-1 flex-col items-center px-4 pt-20">
          <ReuiMark />
          <h1 className="mt-6 text-xl font-semibold">How Can I Help?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start a chat or pick a prompt below.</p>
          <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {["Draft an email", "Summarize a file", "Write a function", "Plan a trip"].map((v) => (
              <Button
                variant="outline"
                key={v}
                className="justify-between font-normal"
                onClick={() => setDraft(v)}
              >
                <span>{v}</span>
                <ArrowUp className="rotate-45 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
        <form
          className="mx-auto mb-2 w-[calc(100%-2rem)] max-w-2xl rounded-xl border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setDraft("");
          }}
        >
          <Textarea
            aria-label="Message Bricklane AI"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message Bricklane AI…"
            className="min-h-12 resize-none border-0 p-0 shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Attach file"
              onClick={() => toast("Attach file selected")}
            >
              <Plus />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={web ? "secondary" : "ghost"}
              aria-pressed={web}
              onClick={() => setWeb((v) => !v)}
            >
              <Globe />
              Search
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">{model}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Voice input"
              onClick={() => toast("Voice input selected")}
            >
              <Mic />
            </Button>
            <Button
              type="submit"
              size="icon-sm"
              className="rounded-full"
              aria-label="Send message"
              disabled={!draft.trim()}
            >
              <ArrowUp />
            </Button>
          </div>
        </form>
        <p className="mb-3 text-center text-[11px] text-muted-foreground">
          Bricklane AI can make mistakes. Check important info.
        </p>
      </AppShellInset>
    </div>
  );
}
export function Assistant({
  title = "AI Assistant",
  onClose,
}: {
  title?: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    {
      who: "assistant",
      text: "Morning, Mira. You have 6 tasks due today and 3 are high priority.",
    },
    { who: "user", text: "What should I tackle first?" },
    {
      who: "assistant",
      text: "Start with the launch announcement copy - it blocks two other tasks and is due at 2:00 PM.",
    },
  ]);
  return (
    <ResponsiveAssistantPanel
      title={title}
      onClose={onClose}
      className="todo-assistant flex min-h-0 w-[312px] shrink-0 flex-col rounded-xl border bg-background"
    >
      <header className="flex h-12 items-center justify-between border-b px-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" />
          {title}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Close assistant" onClick={onClose}>
          <X />
        </Button>
      </header>
      <div className="shell-scroll space-y-3 p-3">
        {messages.map((m, i) => (
          <Message align={m.who === "user" ? "end" : "start"} key={i}>
            <MessageAvatar className="todo-message-avatar">
              {m.who === "user" ? (
                <Face name="Mira Stone" index={1} small />
              ) : (
                <Sparkles className="size-3.5" />
              )}
            </MessageAvatar>
            <MessageContent>
              <Bubble variant={m.who === "user" ? "default" : "muted"} className="max-w-full">
                <BubbleContent>{m.text}</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        ))}
        <p className="pt-2 text-[11px] text-muted-foreground">Suggested</p>
        <div className="flex flex-wrap gap-1">
          {["Summarize my day", "Plan the week", "Surface blockers"].map((v) => (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px]"
              key={v}
              onClick={() => setDraft(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
      <form
        className="m-2 flex flex-col rounded-lg border p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setMessages((v) => [
            ...v,
            { who: "user", text: draft },
            {
              who: "assistant",
              text:
                title === "AI Advisor"
                  ? "Review the document, line match and approval checks before releasing this purchase order. This is a local policy example."
                  : "Review the high priority items first, then confirm assignments with the team. This is a local runbook example.",
            },
          ]);
          setDraft("");
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Ask assistant"
          placeholder="Ask anything about your tasks…"
          className="min-h-12 resize-none border-0 p-0 text-xs shadow-none focus-visible:ring-0"
        />
        <Button
          className="ml-auto size-6"
          size="icon-sm"
          type="submit"
          aria-label="Send to assistant"
          disabled={!draft.trim()}
        >
          <Send />
        </Button>
      </form>
    </ResponsiveAssistantPanel>
  );
}
export function TodoShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("All Tasks");
  const [assistant, setAssistant] = useState(true);
  const [create, setCreate] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  return (
    <div
      className="shell-reference reui-reference todo-shell gap-2 bg-muted/30 p-2"
      data-shell-variant="18"
    >
      <Sidebar width={236} collapsed={collapsed} className="rounded-xl border !bg-background">
        <div className="flex h-10 items-center gap-2">
          <ReuiMark small />
          {!collapsed && <strong className="flex-1">Bricklane</strong>}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle Sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <PanelLeft />
          </Button>
        </div>
        <Button size="sm" className="my-3 justify-start" onClick={() => setCreate(true)}>
          <Plus />
          {!collapsed && "New Task"}
        </Button>
        <p className="shell-section-label">My Lists</p>
        <nav className="todo-lists" aria-label="Task lists">
          {(
            [
              ["All Tasks", ListChecks, 42],
              ["Today", CalendarDays, 6],
              ["Upcoming", Clock, 14],
              ["Priority", Flag, 4],
              ["Completed", CircleCheck, 18],
            ] as const
          ).map(([name, Icon, count]) => (
            <Button
              className="shell-nav-button justify-start"
              variant={active === name ? "secondary" : "ghost"}
              key={name}
              aria-label={name}
              onClick={() => setActive(name)}
            >
              <Icon />
              <span>{name}</span>
              <ReuiBadge variant="secondary" size="sm" className="ml-auto">
                {count}
              </ReuiBadge>
            </Button>
          ))}
        </nav>
        <p className="shell-section-label">Tags</p>
        <div className="todo-tags flex flex-wrap gap-1 px-2">
          {["Work", "Personal", "Team", "Goals"].map((tag, i) => (
            <Button
              key={tag}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setActive(tag)}
            >
              <span
                className="size-1 rounded-full"
                style={{
                  background: ["#f43f5e", "#10b981", "#f59e0b", "#3b82f6"][i],
                }}
              />
              {tag}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="todo-add-tag"
          onClick={() => setCreate(true)}
        >
          <Plus />
          Add Tag
        </Button>
        <div className="todo-focus mt-auto mb-2 rounded-lg border p-3">
          <p className="flex justify-between text-[11px] text-muted-foreground">
            Focus Progress<span className="text-foreground">18 / 32</span>
          </p>
          <div className="my-3 h-1 rounded bg-muted">
            <div className="h-full w-[56%] rounded bg-foreground" />
          </div>
          <p className="text-xs font-medium">Launch Campaign</p>
          <p className="text-[10px] text-muted-foreground">Next milestone in 3 days</p>
        </div>
        <WorkspaceMenu user displayName="Mira Stone" initial="Mira Stone" subtitle="mira@reui.io" />
      </Sidebar>
      <AppShellInset className="shell-content-frame rounded-xl border">
        <header className="shell-header border-b">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Sidebar"
              onClick={() => setCollapsed((v) => !v)}
            >
              <PanelLeft />
            </Button>
            <h1>{active}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <SearchPalette onSelect={setActive} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssistant((v) => !v)}
              aria-pressed={assistant}
            >
              <Sparkles />
              Assistant
            </Button>
          </div>
        </header>
        <PlaceholderCanvas />
        {tasks.length > 0 && (
          <div className="p-4">
            {tasks.map((t) => (
              <label className="mb-2 flex items-center gap-2 rounded border p-3" key={t}>
                <input type="checkbox" />
                {t}
              </label>
            ))}
          </div>
        )}
      </AppShellInset>
      {assistant && <Assistant onClose={() => setAssistant(false)} />}
      <CreateItemDialog
        open={create}
        onOpenChange={setCreate}
        title="New task"
        onCreate={(name) => setTasks((v) => [...v, name])}
      />
    </div>
  );
}
export function PlannerShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 14));
  const [view, setView] = useState("Week");
  const [active, setActive] = useState("Events");
  const [events, setEvents] = useState(["Morning Standup", "Sprint Planning"]);
  const title =
    date?.toLocaleDateString("en-US", { month: "long", year: "numeric" }) ?? "October 2026";
  return (
    <div className="shell-reference bg-muted/30" data-shell-variant="19">
      <Sidebar width={280} collapsed={collapsed} collapsible="offcanvas">
        <div className="flex h-12 items-center gap-2 px-2">
          <ReuiMark small />
          <strong className="flex-1">Bricklane</strong>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle Sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <PanelLeft />
          </Button>
        </div>
        <div className="shell-scroll">
          <Calendar
            selected={date}
            onSelect={setDate}
            mode="single"
            month={date}
            onMonthChange={(month) =>
              setDate(
                new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  Math.min(
                    date?.getDate() ?? 14,
                    new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
                  ),
                ),
              )
            }
            className="w-full p-2"
          />
          <p className="shell-section-label">Up Next</p>
          {events.map((name) => (
            <div className="mb-2 rounded-lg border p-3 text-xs" key={name}>
              <p className="flex justify-between gap-2 font-medium">
                {name}
                <Badge variant="outline">Meeting</Badge>
              </p>
              <p className="mt-2 text-muted-foreground">9:00 AM to 9:15 AM</p>
              <p className="mt-2 text-muted-foreground">Zoom · Room A</p>
              <div className="mt-2 flex -space-x-1">
                <Face name="Mira Stone" index={1} small />
                <Face small index={1} />
              </div>
            </div>
          ))}
          <Navigation
            label="Calendars"
            items={[
              { label: "Events", icon: CalendarDays, badge: "12" },
              { label: "Meetings", icon: Users, badge: "5" },
              { label: "Tasks", icon: ListChecks, badge: "23" },
              { label: "Reminders", icon: Clock, badge: "8" },
            ]}
            active={active}
            onSelect={setActive}
          />
        </div>
        <div className="mt-auto rounded-lg border bg-background">
          <WorkspaceMenu user displayName="Sana Qureshi" initial="Sana Qureshi" />
        </div>
      </Sidebar>
      <AppShellInset className="shell-content-frame inset">
        <PageTitle
          title={title}
          leading={
            collapsed ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Expand sidebar"
                onClick={() => setCollapsed(false)}
              >
                <PanelLeft />
              </Button>
            ) : undefined
          }
        >
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Previous month"
            onClick={() =>
              setDate((d) => new Date(d?.getFullYear() ?? 2026, (d?.getMonth() ?? 9) - 1, 14))
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Next month"
            onClick={() =>
              setDate((d) => new Date(d?.getFullYear() ?? 2026, (d?.getMonth() ?? 9) + 1, 14))
            }
          >
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date(2026, 9, 14))}>
            Today
          </Button>
          <Choices
            label="Calendar view"
            value={view}
            items={["Day", "Week", "Month"]}
            onChange={setView}
          />
          <EventCreator onCreate={(e) => setEvents((v) => [...v, e.name])} />
        </PageTitle>
        <PlaceholderCanvas solid rows={2} fill={false} />
        <div className="shell-planner-track" aria-label="Calendar timeline placeholder" />
      </AppShellInset>
    </div>
  );
}
export function WebmailShell() {
  const [folder, setFolder] = useState("Inbox");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Categories");
  const [compose, setCompose] = useState(false);
  const [label, setLabel] = useState(false);
  const [labels, setLabels] = useState(["Archive", "Snoozed", "Spam", "Trash"]);
  return (
    <div className="shell-reference bg-muted/25" data-shell-variant="20">
      <Sidebar width={240} className="!bg-transparent">
        <WorkspaceMenu user initial="Nick Bold" subtitle="nick@reui.io" />
        <Button className="my-3 h-8" onClick={() => setCompose(true)}>
          <Mail />
          New Mail
        </Button>
        <GroupedNav
          groups={[
            { label: "Mail", items: ["Inbox", "Draft", "Sent"] },
            { label: "Labels", items: labels },
            {
              label: "Direct Messages",
              items: ["Nick Bold (You)", "Sarah Chen", "Marcus Lee", "Add Teammates"],
            },
          ]}
          active={folder}
          onSelect={setFolder}
        />
        <Button variant="ghost" size="sm" onClick={() => setLabel(true)}>
          <Plus />
          Create label
        </Button>
        <div className="mt-auto">
          <GroupedNav
            groups={[{ label: "", items: ["Support", "Settings", "Feedback"] }]}
            active={folder}
            onSelect={setFolder}
          />
        </div>
      </Sidebar>
      <AppShellInset className="shell-mail-panes">
        <section className="flex min-w-0 flex-col rounded-xl border bg-background">
          <header className="flex h-12 items-center gap-2 px-3">
            <Input
              className="h-7 min-w-0"
              aria-label="Search mail"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Choices
              label="Categories"
              value={category}
              items={["All", "Primary", "Social", "Updates"]}
              onChange={setCategory}
            />
          </header>
          <div className="flex flex-1 flex-col items-center justify-center p-5 text-center">
            <Inbox className="mb-5 size-12 text-muted-foreground/30" />
            <h2 className="text-sm font-semibold">It's empty here</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Search for another email or{" "}
              <button
                className="text-foreground underline"
                onClick={() => {
                  setQuery("");
                  setCategory("Categories");
                }}
              >
                clear filters
              </button>
            </p>
          </div>
        </section>
        <section className="hidden min-w-0 flex-col rounded-xl border bg-background md:flex">
          <header className="flex h-12 items-center justify-between px-3">
            <span>‹　›　Normal</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCompose(true)}>
                Reply All
              </Button>
              <Star className="size-4" />
              <Trash2 className="size-4" />
            </div>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Mail className="mb-5 size-12 text-muted-foreground/30" />
            <h2 className="text-sm font-semibold">It's empty here</h2>
            <p className="mt-2 text-xs text-muted-foreground">Choose an email to view details</p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast("Ask AI selected")}>
                <Sparkles />
                Ask AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCompose(true)}>
                Send Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCompose(true)}>
                <Plus />
                New Email
              </Button>
            </div>
          </div>
        </section>
      </AppShellInset>
      <nav className="hidden w-10 flex-col items-center gap-3 p-2 lg:flex">
        {[Clock, List, Settings, Users, Plus].map((Icon, i) => (
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7"
            aria-label={`Mail shortcut ${i + 1}`}
            key={i}
            onClick={() => toast("Mail shortcut selected")}
          >
            <Icon />
          </Button>
        ))}
      </nav>
      <Dialog open={compose} onOpenChange={setCompose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New mail</DialogTitle>
            <DialogDescription>Compose a sample email.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setCompose(false);
            }}
          >
            <Input type="email" aria-label="To" placeholder="To" required />
            <Input aria-label="Subject" placeholder="Subject" required />
            <Textarea aria-label="Message" placeholder="Write a message…" />
            <Button type="submit">
              <Send />
              Send
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <CreateItemDialog
        open={label}
        onOpenChange={setLabel}
        title="Create label"
        onCreate={(name) => setLabels((v) => [...v, name])}
      />
    </div>
  );
}
