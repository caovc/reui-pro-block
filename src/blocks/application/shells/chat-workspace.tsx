import { useState } from "react";
import {
  Archive,
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock,
  Copy,
  Folder,
  MoreHorizontal,
  PanelLeft,
  Pin,
  Plus,
  Settings2,
  Share2,
  SquarePen,
  Star,
  Trash2,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
} from "./chrome";
import { Segments, Sidebar } from "./primitives";
const threads = [
  "Stripe webhook 500s on charge.refunded",
  "Q3 release notes draft",
  "Stream chat responses",
  "Churn by plan tier",
  "Mobile onboarding revamp scope",
  "Why is p95 latency up on eu-west",
  "Rewrite the trial expiry email",
  "Postgres index for events table",
];
const artifacts = ["Release summary", "Revenue dashboard", "API documentation"];
function ChatPlaceholders() {
  return (
    <div className="chat-reference-canvas" aria-label="Conversation placeholders">
      <div className="chat-reference-turns" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div className="chat-reference-turn" key={i}>
            <Message align="end">
              <MessageContent>
                {Array.from({ length: i === 1 ? 2 : 1 }, (_, j) => (
                  <Bubble
                    key={j}
                    variant="muted"
                    className="chat-empty-user"
                    style={{
                      width: i === 0 ? 208 : i === 1 ? (j ? 144 : 288) : i === 2 ? 176 : 256,
                    }}
                  >
                    <BubbleContent />
                  </Bubble>
                ))}
              </MessageContent>
            </Message>
            {i < 3 && (
              <Message>
                <MessageAvatar className="chat-empty-avatar" />
                <MessageContent>
                  <div className="chat-empty-answer">
                    {(i === 1 ? [100, 100, 84, 50] : i === 2 ? [100, 84, 60] : [100, 92, 67]).map(
                      (w, j) => (
                        <span key={j} style={{ width: `${w}%` }} />
                      ),
                    )}
                  </div>
                </MessageContent>
              </Message>
            )}
          </div>
        ))}
      </div>
      <div className="chat-empty-composer" aria-hidden="true">
        <div />
        <span />
      </div>
    </div>
  );
}
function ThreadRow({
  name,
  active,
  pinned,
  onPin,
  onSelect,
}: {
  name: string;
  active: string;
  pinned: boolean;
  onPin: (name: string) => void;
  onSelect: (name: string) => void;
}) {
  return (
    <div className={`chat-thread-row group ${active === name ? "active" : ""}`}>
      <Button variant="ghost" className="chat-thread-label" onClick={() => onSelect(name)}>
        <span>{name}</span>
      </Button>
      <div className="chat-thread-actions">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`${pinned ? "Unpin" : "Pin"} ${name}`}
          onClick={() => onPin(name)}
        >
          <Pin />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`Thread actions for ${name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="reui-reference">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onPin(name)}>
                <Pin />
                {pinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SquarePen />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 />
                Share link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
export default function ChatWorkspace() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState(threads[0]);
  const [pinned, setPinned] = useState(threads.slice(0, 2));
  const [tab, setTab] = useState("Chats");
  const [model, setModel] = useState("Claude Sonnet 5");
  const [memory, setMemory] = useState(true);
  const pin = (name: string) =>
    setPinned((v) => (v.includes(name) ? v.filter((n) => n !== name) : [...v, name]));

  return (
    <div className="shell-reference reui-reference chat-workspace" data-shell-variant="21">
      <ResizablePanelGroup orientation="horizontal" key={String(collapsed)}>
        <ResizablePanel
          defaultSize={collapsed ? "48px" : "248px"}
          minSize={collapsed ? "48px" : "210px"}
          maxSize={collapsed ? "48px" : "40%"}
        >
          <Sidebar
            collapsed={collapsed}
            className="chat-workspace-sidebar !w-full !h-full"
            drawerClassName="chat-workspace"
          >
            <header className="chat-workspace-brand">
              <ReuiMark small />
              {!collapsed && <strong>ReUI Chat</strong>}
              <SearchPalette iconOnly collapsed={collapsed} routes={threads} onSelect={setActive} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle Sidebar"
                onClick={() => setCollapsed(!collapsed)}
              >
                <PanelLeft />
              </Button>
            </header>
            {collapsed ? (
              <div className="chat-collapsed-navigation">
                {(
                  [
                    ["New chat", Plus],
                    ["Projects", Folder],
                    ["Scheduled", Clock],
                    ["Customize", Settings2],
                  ] as const
                ).map(([name, Icon]) => (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    key={name}
                    aria-label={name}
                    onClick={() => setActive(name)}
                  >
                    <Icon />
                  </Button>
                ))}
                {["Pinned", "Recent"].map((group) => (
                  <DropdownMenu key={group}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`${group} chats`}>
                        {group === "Pinned" ? <Pin /> : <Clock />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="reui-reference">
                      <DropdownMenuGroup>
                        {threads
                          .filter((t) =>
                            group === "Pinned" ? pinned.includes(t) : !pinned.includes(t),
                          )
                          .map((name) => (
                            <DropdownMenuItem key={name} onSelect={() => setActive(name)}>
                              {name}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </div>
            ) : (
              <>
                <div className="chat-workspace-tabs">
                  <Segments
                    label="Thread content"
                    items={["Chats", "Artifacts"]}
                    value={tab}
                    onChange={setTab}
                  />
                </div>
                <nav className="chat-primary-navigation" aria-label="Chat navigation">
                  <Button variant="ghost" onClick={() => setActive("New Chat")}>
                    <Plus />
                    New Chat
                  </Button>
                  {(
                    [
                      ["Projects", Folder, 4],
                      ["Scheduled", Clock, 2],
                      ["Customize", Settings2, undefined],
                    ] as const
                  ).map(([name, Icon, count]) => (
                    <Button variant="ghost" key={name} onClick={() => setActive(name)}>
                      <Icon />
                      <span>{name}</span>
                      {count && <small>{count}</small>}
                    </Button>
                  ))}
                </nav>
                <div className="chat-thread-scroll">
                  {tab === "Artifacts"
                    ? artifacts.map((name) => (
                        <ThreadRow
                          key={name}
                          name={name}
                          active={active}
                          pinned={pinned.includes(name)}
                          onPin={pin}
                          onSelect={setActive}
                        />
                      ))
                    : ["Pinned", "Recent"].map((group) => (
                        <Collapsible defaultOpen key={group} className="chat-thread-group">
                          <CollapsibleTrigger className="chat-group-heading">
                            <span>{group}</span>
                            <span>
                              {
                                threads.filter((t) =>
                                  group === "Pinned" ? pinned.includes(t) : !pinned.includes(t),
                                ).length
                              }
                            </span>
                            <ChevronUp />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {threads
                              .filter((t) =>
                                group === "Pinned" ? pinned.includes(t) : !pinned.includes(t),
                              )
                              .map((name) => (
                                <ThreadRow
                                  key={name}
                                  name={name}
                                  active={active}
                                  pinned={pinned.includes(name)}
                                  onPin={pin}
                                  onSelect={setActive}
                                />
                              ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                </div>
              </>
            )}
            <footer className="chat-sidebar-footer">
              {(
                [
                  ["Docs", BookOpen],
                  ["What is new", Star],
                  ["Help", CircleHelp],
                ] as const
              ).map(([name, Icon]) => (
                <Button variant="ghost" key={name} aria-label={name} onClick={() => toast(name)}>
                  <Icon />
                  {!collapsed && name}
                </Button>
              ))}
              <div className="chat-account">
                <WorkspaceMenu
                  collapsed={collapsed}
                  user
                  displayName="shadcn"
                  initial="Atlas"
                  subtitle="Atlas · Max"
                />
              </div>
            </footer>
          </Sidebar>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="50%">
          <main className="shell-content-frame h-full">
            <header className="chat-workspace-header">
              <h1>{active}</h1>
              <div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Chat memory"
                  aria-pressed={memory}
                  onClick={() => setMemory(!memory)}
                >
                  <Bookmark />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="Chat model">
                      {model}
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="reui-reference">
                    <DropdownMenuGroup>
                      {["Claude Sonnet 5", "GPT-4", "Gemini"].map((m) => (
                        <DropdownMenuItem key={m} onSelect={() => setModel(m)}>
                          {m}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <div className="flex items-center justify-between gap-3 border-t p-2 text-xs">
                      <span>Memory</span>
                      <Switch checked={memory} onCheckedChange={setMemory} aria-label="Memory" />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Chat options">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="reui-reference">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <SquarePen />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 />
                        Share link
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <ChatPlaceholders />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
