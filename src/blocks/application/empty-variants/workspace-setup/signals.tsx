import { useState } from "react";
import { Route } from "lucide-react";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WorkspaceDialog, WorkspaceStage } from "./support";

type LocalSignal = {
  name: string;
  trigger: string;
  destination: string;
  enabled: boolean;
  id: string;
};

export default function SignalsEmpty() {
  const [open, setOpen] = useState(false);
  const [signals, setSignals] = useState<LocalSignal[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("Form submitted");
  const [destination, setDestination] = useState("Project backlog");

  return (
    <WorkspaceStage id={11}>
      <section className="empty-workspace-page" aria-label="Signal routing empty state">
        <h1 className="sr-only">Signal routing empty state</h1>
        <header className="empty-workspace-header empty-workspace-signals-header">
          <div>
            <h2>Routing Signals</h2>
            <p>Shape incoming work before it reaches the roadmap.</p>
          </div>
          <Button
            onClick={() => {
              setName("");
              setOpen(true);
            }}
          >
            Add signal
          </Button>
        </header>
        <Card className="empty-workspace-signal-card bg-muted/50 py-0">
          <CardContent className="px-6 py-0">
            {signals.length ? (
              <div className="empty-workspace-signal-list py-6">
                {signals.map((signal) => (
                  <article key={signal.id}>
                    <Route className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <strong>{signal.name}</strong>
                      <p>
                        {signal.trigger} → {signal.destination}
                      </p>
                    </div>
                    <Badge variant={signal.enabled ? "success-light" : "secondary"}>
                      {signal.enabled ? "Active locally" : "Paused locally"}
                    </Badge>
                    <Switch
                      aria-label={`Activate signal ${signal.name}`}
                      checked={signal.enabled}
                      onCheckedChange={(enabled) =>
                        setSignals((current) =>
                          current.map((entry) =>
                            entry.id === signal.id ? { ...entry, enabled } : entry,
                          ),
                        )
                      }
                    />
                  </article>
                ))}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  These are local routing rules. No intake service or project destination is
                  connected.
                </p>
                <Button
                  variant="ghost"
                  className="justify-self-start"
                  onClick={() => setSignals([])}
                >
                  Reset signals
                </Button>
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack>
                      <Route className="size-7" strokeWidth={1.5} />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>Create signals to route new work</EmptyTitle>
                  <EmptyDescription>
                    Define signals so every intake item starts with context.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>
      <WorkspaceDialog
        title="Add signal"
        description="Create a local routing rule. This preview does not subscribe to events or send work to an external destination."
        open={open}
        onOpenChange={setOpen}
      >
        <form
          className="empty-workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setSignals((current) => [
              ...current,
              { name: name.trim(), trigger, destination, enabled: true, id: crypto.randomUUID() },
            ]);
            setOpen(false);
          }}
        >
          <label>
            Signal name
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Customer request intake"
            />
          </label>
          <label>
            When this happens
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Form submitted", "Task created", "File uploaded"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label>
            Route to
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Project backlog", "Team inbox", "Review queue"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button type="submit">Create local signal</Button>
        </form>
      </WorkspaceDialog>
    </WorkspaceStage>
  );
}
