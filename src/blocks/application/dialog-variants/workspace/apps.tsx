import { useEffect, useRef, useState } from "react";
import { Plus, Search, Waypoints } from "lucide-react";
import { integrationArtwork, svgImage } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import { DialogSurface } from "../first-run/free/dialog-surface";
import { DialogLauncher } from "../first-run/support";

const apps = [
  {
    id: "claude",
    name: "Claude",
    description: "Track model usage",
    initial: "C",
    color: "#b48c74",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Research and model runs",
    initial: "O",
    color: "#668f85",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Sync coding activity",
    initial: "C",
    color: "#657184",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Mirror planning holds",
    initial: "G",
    color: "#7696a8",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Monitor team activity",
    initial: "S",
    color: "#967bab",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Track revenue signals",
    initial: "S",
    color: "#8a83b8",
  },
  { id: "zoom", name: "Zoom", description: "Log meeting sessions", initial: "Z", color: "#7896b5" },
  {
    id: "loom",
    name: "Loom",
    description: "Store async walkthroughs",
    initial: "L",
    color: "#9a87b2",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Track campaign engagement",
    initial: "I",
    color: "#ba8e9c",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Watch community activity",
    initial: "D",
    color: "#858bb8",
  },
  {
    id: "meet",
    name: "Google Meet",
    description: "Capture call activity",
    initial: "M",
    color: "#839d8b",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Monitor payout events",
    initial: "P",
    color: "#6c88a9",
  },
];

export default function ConnectAppDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = apps.find((app) => app.id === selectedId);
  const visible = apps.filter((app) =>
    `${app.name} ${app.description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    if (!open) return;
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={6}
        title="Workspace apps"
        description="Bring your team's tools into one view."
        icon={<Waypoints />}
        action="Open app picker"
        result={
          saved && (
            <span>
              {saved} selected locally. No account is connected and no OAuth permission has been
              granted.
            </span>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          {apps.slice(0, 6).map((app) => (
            <Badge key={app.id} variant="outline">
              {app.name}
            </Badge>
          ))}
        </div>
      </DialogLauncher>
      <DialogSurface
        id={6}
        title="Add a workspace app"
        description="Choose one source to connect."
        initialFocus={() => search.current?.focus()}
        footer={
          <Button
            className="w-full"
            disabled={!selected}
            onClick={() => {
              if (selected) setSaved(selected.name);
              setOpen(false);
            }}
          >
            <Plus data-icon="inline-start" />
            Add app
          </Button>
        }
      >
        <div className="flex min-h-0 flex-col gap-4">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              ref={search}
              aria-label="Search integrations"
              placeholder="Search integrations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          {visible.length ? (
            <div className="workspace-dialog-app-grid">
              {visible.map((app) => (
                <FieldLabel
                  className="workspace-dialog-app-label"
                  key={app.id}
                  htmlFor={`workspace-app-${app.id}`}
                >
                  <Item
                    variant="outline"
                    className="workspace-dialog-app-tile"
                    data-selected={selectedId === app.id}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <img
                        src={svgImage(integrationArtwork(app.initial, app.color))}
                        alt=""
                        className="size-5 rounded"
                      />
                      <Checkbox
                        id={`workspace-app-${app.id}`}
                        aria-label={app.name}
                        className="rounded-full"
                        checked={selectedId === app.id}
                        onCheckedChange={(checked) => setSelectedId(checked ? app.id : null)}
                      />
                    </div>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{app.name}</ItemTitle>
                      <ItemDescription>{app.description}</ItemDescription>
                    </ItemContent>
                  </Item>
                </FieldLabel>
              ))}
            </div>
          ) : (
            <Empty className="workspace-dialog-app-empty">
              <EmptyHeader>
                <EmptyTitle>No apps match</EmptyTitle>
                <EmptyDescription>
                  Try a broader search to keep exploring integrations.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </DialogSurface>
    </Dialog>
  );
}
