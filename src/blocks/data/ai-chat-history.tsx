/** App-specific pinned/recent thread picker using the actual installed free
 * Popover/Tabs/Input/Button components; free REUI chat examples supply the
 * surrounding transcript, but not a complete thread-store controller.
 */
import { useState } from "react";
import { ChevronDown, MessageSquare, Pin, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChatSession } from "./ai-chat-session";

export default function ChatHistory({ session }: { session: ChatSession }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const rows = session.state.threads.filter(
    (thread) =>
      (filter === "All" || (filter === "Pinned" && thread.pinned) || thread.group === filter) &&
      thread.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="max-w-64 min-w-0 gap-2 text-xs"
          aria-label="Chat history"
        >
          <MessageSquare />
          <span className="truncate">{session.thread?.title ?? "New conversation"}</span>
          <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(21rem,calc(100vw-2rem))] p-0">
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Conversations</p>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="New conversation"
              onClick={() => {
                session.selectThread("new");
                setOpen(false);
              }}
            >
              <SquarePen />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-3 text-muted-foreground" />
            <Input
              aria-label="Search conversations"
              placeholder="Search conversations…"
              className="h-8 ps-8 text-xs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-4">
              {["All", "Pinned", "Today", "Earlier"].map((value) => (
                <TabsTrigger key={value} value={value} className="text-xs">
                  {value}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-1 p-2">
            {rows.length ? (
              rows.map((thread) => (
                <div
                  key={thread.id}
                  className="group flex min-w-0 items-center rounded-md hover:bg-muted"
                >
                  <Button
                    size="sm"
                    variant={thread.id === session.state.activeId ? "secondary" : "ghost"}
                    className="h-9 min-w-0 flex-1 justify-start font-normal"
                    onClick={() => {
                      session.selectThread(thread.id);
                      setOpen(false);
                    }}
                  >
                    <MessageSquare className="size-3 shrink-0" />
                    <span className="truncate">{thread.title}</span>
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`${thread.pinned ? "Unpin" : "Pin"} ${thread.title}`}
                    aria-pressed={thread.pinned}
                    onClick={() => session.togglePin(thread.id)}
                  >
                    <Pin className={thread.pinned ? "fill-current" : ""} />
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No matching conversations.
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
