import { useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Gauge,
  MoreVertical,
  Plus,
  Rocket,
  TrendingDown,
  TriangleAlert,
  Tags,
  Inbox,
  Package,
} from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Button, Input } from "./shared";
import { Choice, SideForm } from "./controls";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type ScheduledTask = {
  id: number;
  name: string;
  prompt: string;
  repeat: string;
  time: string;
  status: string;
  next: string;
};
const initial: ScheduledTask[] = [
  {
    id: 1,
    name: "Rate limit review",
    prompt: "Review rate limit changes and summarize findings.",
    repeat: "Daily",
    time: "Afternoon",
    status: "Active",
    next: "Tomorrow at 3:00 PM",
  },
  {
    id: 2,
    name: "Churn by plan tier",
    prompt: "Summarize churn by plan tier.",
    repeat: "Weekly",
    time: "Morning",
    status: "Active",
    next: "October 30 at 9:00 AM",
  },
  {
    id: 3,
    name: "Weekly billing digest",
    prompt: "Create a weekly billing digest.",
    repeat: "Weekly",
    time: "Morning",
    status: "Paused",
    next: "",
  },
  {
    id: 4,
    name: "Audit log export limits",
    prompt: "Review audit log export limits.",
    repeat: "Monthly",
    time: "Morning",
    status: "Active",
    next: "November 22 at 9:00 AM",
  },
  {
    id: 5,
    name: "Admin 3.4 release watch",
    prompt: "Watch the Admin 3.4 release.",
    repeat: "Daily",
    time: "Morning",
    status: "Completed",
    next: "",
  },
];
const suggestions = [
  {
    name: "Incident recap",
    prompt: "Every Monday morning, summarise last week's incidents and what is still open",
    icon: TriangleAlert,
  },
  {
    name: "Competitor pricing watch",
    prompt: "Monthly, check whether the plans we benchmark against have moved",
    icon: Tags,
  },
  {
    name: "Support backlog digest",
    prompt: "Each evening, the tickets that aged past their first reply target",
    icon: Inbox,
  },
  {
    name: "Dependency update check",
    prompt: "Weekly, which dependencies moved and which carry a security note",
    icon: Package,
  },
];
export function EchoScheduled({ onOpen }: { onOpen: (name: string) => void }) {
  const [tasks, setTasks] = useState(initial);
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [repeat, setRepeat] = useState("Weekly");
  const [time, setTime] = useState("Morning");
  function edit(task?: ScheduledTask) {
    setEditing(task?.id ?? null);
    setName(task?.name ?? "");
    setPrompt(task?.prompt ?? "");
    setRepeat(task?.repeat ?? "Weekly");
    setTime(task?.time ?? "Morning");
    setOpen(true);
  }
  return (
    <div className="echo-scheduled">
      <div className="wf-page-heading">
        <div>
          <h1>Scheduled</h1>
          <p>Tasks that run on a schedule and write their results into a chat</p>
        </div>
      </div>
      <div className="echo-scheduled-toolbar">
        <Choice
          label="Filter scheduled tasks"
          value={filter}
          onChange={setFilter}
          items={["All", "Active", "Paused", "Completed"]}
        />
        <Button onClick={() => edit()}>
          <Plus />
          New Task
        </Button>
      </div>
      <Frame dense spacing="sm" className="echo-schedule-list">
        <FramePanel className="p-0">
          {tasks
            .filter((task) => filter === "All" || task.status === filter)
            .map((task, i) => {
              const Icon = [Gauge, TrendingDown, CalendarClock, ClipboardList, Rocket][i % 5];
              return (
                <div className="echo-schedule-row" key={task.id}>
                  <IconTile variant="frame">
                    <Icon />
                  </IconTile>
                  <button className="echo-schedule-copy" onClick={() => edit(task)}>
                    <span>
                      {task.name}
                      <Badge variant="secondary" className="ml-2">
                        {task.status}
                      </Badge>
                    </span>
                    <small>
                      {task.repeat},{" "}
                      {task.status === "Active"
                        ? `next run ${task.next}`
                        : task.status.toLowerCase()}
                    </small>
                  </button>
                  <Switch
                    aria-label={`Enable ${task.name}`}
                    checked={task.status === "Active"}
                    disabled={task.status === "Completed"}
                    onCheckedChange={(checked) =>
                      setTasks(
                        tasks.map((t) =>
                          t.id === task.id
                            ? {
                                ...t,
                                status: checked ? "Active" : "Paused",
                                next: checked ? "Tomorrow at 9:00 AM" : t.next,
                              }
                            : t,
                        ),
                      )
                    }
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions ${task.name}`}>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => edit(task)}>Edit task</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onOpen(task.name)}>
                        Open chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                      >
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
        </FramePanel>
      </Frame>
      <Frame dense spacing="sm" className="echo-schedule-suggestions">
        <FrameHeader>
          <FrameTitle>Suggested Tasks</FrameTitle>
          <FrameDescription>Ready to schedule</FrameDescription>
        </FrameHeader>
        <FramePanel className="p-0">
          {suggestions.map(({ name: title, prompt: text, icon: Icon }) => (
            <div key={title} className="echo-schedule-row">
              <IconTile variant="frame">
                <Icon />
              </IconTile>
              <div className="echo-schedule-copy">
                <span>{title}</span>
                <small>{text}</small>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  edit();
                  setName(title);
                  setPrompt(text);
                }}
              >
                <Plus />
                Add
              </Button>
            </div>
          ))}
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        title={editing === null ? "New Task" : "Edit Task"}
        description="Scheduled task"
        onClose={() => setOpen(false)}
        submit={editing === null ? "Add Task" : "Save Task"}
        onSubmit={() => {
          if (!name.trim() || !prompt.trim()) return;
          const task = {
            id: editing ?? Date.now(),
            name: name.trim(),
            prompt,
            repeat,
            time,
            status: tasks.find((t) => t.id === editing)?.status ?? "Active",
            next: `Tomorrow at ${time === "Morning" ? "9:00 AM" : time === "Afternoon" ? "3:00 PM" : "7:00 PM"}`,
          };
          setTasks(
            editing === null ? [...tasks, task] : tasks.map((t) => (t.id === editing ? task : t)),
          );
          setOpen(false);
        }}
      >
        <h3>Task</h3>
        <label>
          Name
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Prompt
          <Textarea required rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>
        <h3>Schedule</h3>
        <Choice
          label="Repeat"
          value={repeat}
          onChange={setRepeat}
          items={["Daily", "Weekly", "Monthly"]}
        />
        <Choice
          label="Time of Day"
          value={time}
          onChange={setTime}
          items={["Morning", "Afternoon", "Evening"]}
        />
        <label>
          End Repeat
          <Input type="date" />
        </label>
      </SideForm>
    </div>
  );
}
