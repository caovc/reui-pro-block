import { useEchoScheduledModel } from "./workflow-models";
import { echoArtifacts } from "./echo-artifact-data";
import { useState } from "react";
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  Code,
  MessageSquare,
  Paperclip,
  Pin,
  Search,
  Sparkles,
} from "lucide-react";
import { Button, Input, Panel, CreateDialog } from "./shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EchoLayout, EchoInset, EchoMobileHeader, EchoSidebar } from "./echo-sidebar";
import { EchoSettings } from "./echo-settings";
import { useEchoChatHistory } from "./echo-chat-data";
import { echoModels, useEchoSettingsModel } from "./echo-settings-data";
import { EchoProjects, type EchoProject } from "./echo-projects";
import { EchoComposer } from "./echo-composer";
import { EchoScheduled } from "./echo-scheduled";
import { EchoArtifactList, EchoArtifactPanel } from "./echo-artifacts";
export default function Echo() {
  const scheduledRecords = useEchoScheduledModel();
  const history = useEchoChatHistory();
  const recent = history.records.filter((chat) => !chat.archived).map((chat) => chat.title);
  const [view, setView] = useState(history.active?.title ?? "New chat");
  const [scheduleRequest, setScheduleRequest] = useState<{
    id: number;
    title: string;
    prompt?: string;
  }>();
  const settings = useEchoSettingsModel();
  const [bookmarked, setBookmarked] = useState(false);
  const [artifactIndex, setArtifactIndex] = useState<number | null>(null);
  const [group, setGroup] = useState("Chats");
  const [mode, setMode] = useState("Create");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    history.active?.messages ?? [],
  );
  const [think, setThink] = useState(true);
  const [search, setSearch] = useState(false);
  const [model, setModel] = useState("Claude Sonnet 5");
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
    const chat = history.open(title);
    setView(chat.title);
    setMessages(chat.messages);
  }
  function send(text = input, context: string[] = []) {
    if (!text.trim()) return;
    const nextMessages = [
      ...messages,
      { role: "user", text: context.length ? `${text}\n\nContext: ${context.join(", ")}` : text },
      {
        role: "assistant",
        text: `Local preview response\n\nFor “${text}”, start by defining the outcome, gather the relevant workspace context, and draft a concise implementation plan.\n\n• Scope the change and its owner\n• Validate the behavior with a focused check\n• Record follow-ups and acceptance criteria\n\nConnect your model provider to generate real responses.${context.length ? `\n\nContext staged: ${context.join(", ")}.` : ""}\n\n${model} · ${[think && "Think", search && "Search"].filter(Boolean).join(" + ") || "No tools"}`,
      },
    ];
    setMessages(nextMessages);
    setView(history.commit(text.slice(0, 48), nextMessages));
    setInput("");
  }
  function newChat() {
    history.setActiveId(null);
    setView("New chat");
    setMessages([]);
    setArtifactIndex(null);
    setModel(String(settings.saved.defaultModel));
  }
  function clearChats() {
    history.removeAll();
    setMessages([]);
  }
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
      className={`wf-root echo-root reui-reference echo-native-root ${["Projects", "Scheduled", "Artifacts"].includes(view) ? "echo-secondary" : ""}`}
    >
      <EchoLayout>
        <EchoSidebar
          view={view}
          group={group}
          onGroupChange={(value) => {
            setGroup(value);
            if (value === "Chats") setArtifactIndex(null);
          }}
          onNavigate={setView}
          onChat={selectChat}
          onNew={newChat}
          recent={recent}
          history={history}
          onRename={(id, title) => {
            if (!history.rename(id, title)) return false;
            if (history.activeId === id) setView(title.trim());
            return true;
          }}
          onArchive={(id) => {
            const active = history.activeId === id;
            history.archive(id);
            if (active) newChat();
          }}
          onDelete={(id) => {
            const active = history.activeId === id;
            history.remove(id);
            if (active) newChat();
          }}
          onSchedule={(chat) => {
            setScheduleRequest({
              id: Date.now(),
              title: chat.title,
              prompt:
                [...chat.messages].reverse().find((message) => message.role === "user")?.text ?? "",
            });
            setView("Scheduled");
          }}
          projects={projects.length}
          scheduled={scheduledRecords[0].length}
          settings={settings}
          artifacts={
            <EchoArtifactList
              selected={artifactIndex}
              onSelect={(index) => {
                selectChat(echoArtifacts[index].chat);
                setArtifactIndex(index);
              }}
            />
          }
        />
        <EchoInset className="echo-main">
          <EchoMobileHeader recent={recent} onChat={selectChat} onNew={newChat} />
          {settings.signedOut ? (
            <div className="echo-signed-out">
              <div>
                <h1>Signed out locally</h1>
                <p>
                  This interactive preview has no external sign-in service. Continue to use the
                  current local workspace.
                </p>
                <Button onClick={() => settings.setSignedOut(false)}>Continue locally</Button>
              </div>
            </div>
          ) : (
            <>
              {view !== "Settings" && (
                <header className="wf-header">
                  <span>{view}</span>
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
                        {echoModels.map((x) => (
                          <SelectItem key={x} value={x}>
                            {x}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </header>
              )}
              {view === "Settings" ? (
                <EchoSettings
                  model={settings}
                  history={history}
                  onDeleteAccount={() => {
                    clearChats();
                    setProjects([]);
                    setScheduled([]);
                    scheduledRecords[1]([]);
                    setArtifactIndex(null);
                  }}
                />
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
                <EchoScheduled
                  records={scheduledRecords}
                  onOpen={selectChat}
                  createFromChat={scheduleRequest}
                />
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
                      independent preview stores session changes locally and does not call an AI
                      provider.
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
                            {i < 3 ? (
                              <Pin className="size-4" />
                            ) : (
                              <MessageSquare className="size-4" />
                            )}
                            <span>{t}</span>
                            {i < 3 && (
                              <span className="echo-file-chip">
                                <Paperclip className="size-3" />
                                {
                                  ["stripe-webhook.ts", "admin-notes-3.4.pdf", "audit-export.csv"][
                                    i
                                  ]
                                }
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
            </>
          )}
        </EchoInset>
      </EchoLayout>
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
