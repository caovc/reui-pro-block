import { useState } from "react";
import {
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Mail,
  Pencil,
  Plus,
  Route,
  Search,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { integrationArtwork, svgImage } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { DialogSurface } from "./free/dialog-surface";
import { DialogLauncher } from "./support";

type SetupField = { id: string; label: string; initial: string; icon: LucideIcon; section: string };
const fields: SetupField[] = [
  {
    id: "owner",
    label: "Launch owner",
    initial: "Ari Mendoza",
    icon: UserRound,
    section: "identity",
  },
  {
    id: "alias",
    label: "Workspace alias",
    initial: "growth-command",
    icon: BriefcaseBusiness,
    section: "identity",
  },
  {
    id: "window",
    label: "Review window",
    initial: "Tue, 10:00 UTC",
    icon: CalendarClock,
    section: "identity",
  },
  {
    id: "inbox",
    label: "Escalation inbox",
    initial: "ops@example.com",
    icon: Mail,
    section: "fallback",
  },
  {
    id: "approver",
    label: "Backup approver",
    initial: "Sana Qureshi",
    icon: UserRound,
    section: "fallback",
  },
  {
    id: "digest",
    label: "Digest cadence",
    initial: "Every business day",
    icon: CalendarClock,
    section: "fallback",
  },
];
const sections = [
  {
    id: "identity",
    title: "Ownership & cadence",
    description: "Lock in the primary operator, workspace alias, and review window.",
    icon: ShieldCheck,
  },
  {
    id: "apps",
    title: "Connected apps",
    description: "Choose the tools that can send events or receive rollout updates.",
    icon: Route,
  },
  {
    id: "fallback",
    title: "Fallback rules",
    description: "Set where alerts and digests land if the primary flow is paused.",
    icon: BellRing,
  },
];
const initialApps = [
  {
    id: "slack",
    name: "Slack",
    description: "Posts rollout handoffs to the release channel.",
    initial: "S",
    color: "#937cb0",
    connected: true,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Adds freeze windows and review holds to the checklist.",
    initial: "G",
    color: "#729ca6",
    connected: false,
  },
  {
    id: "loom",
    name: "Loom",
    description: "Stores quick walkthroughs for launch operators.",
    initial: "L",
    color: "#8e88b8",
    connected: true,
  },
];
const initialValues = Object.fromEntries(fields.map((field) => [field.id, field.initial]));

function EditableSetupField({
  field,
  value,
  onSave,
}: {
  field: SetupField;
  value: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const Icon = field.icon;
  function save() {
    if (!draft.trim()) return;
    onSave(draft.trim());
    setEditing(false);
  }
  return (
    <Item className="refined-checklist-field" size="xs">
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <span className="refined-checklist-label">{field.label}</span>
      {editing ? (
        <InputGroup className="refined-checklist-editor">
          <InputGroupInput
            data-checklist-inline-editor
            autoFocus
            aria-label={field.label}
            value={draft}
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setEditing(false);
                setDraft(value);
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={`Discard ${field.label}`}
              onClick={() => {
                setEditing(false);
                setDraft(value);
              }}
            >
              <X />
            </InputGroupButton>
            <InputGroupButton
              size="icon-xs"
              aria-label={`Save ${field.label}`}
              onClick={save}
              disabled={!draft.trim()}
            >
              <Check />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Button
          variant="ghost"
          className="refined-checklist-value"
          aria-label={`Edit ${field.label}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          <span>{value}</span>
          <Pencil data-icon="inline-end" />
        </Button>
      )}
    </Item>
  );
}

export default function ChecklistDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [apps, setApps] = useState(initialApps);
  const [query, setQuery] = useState("");
  const [addApp, setAddApp] = useState(false);
  const [appName, setAppName] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const managed = apps.find((app) => app.id === manageId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={4}
        title="Launch checklist"
        description="Prepare your workspace for a coordinated launch."
        icon={<ShieldCheck />}
        action="Open launch checklist"
        result={saved}
      >
        <ItemGroup>
          {sections.map((section) => (
            <Item key={section.id} size="xs">
              <ItemMedia variant="icon">
                <section.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{section.title}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Badge
                  variant={section.id === "identity" ? "success-light" : "secondary"}
                  size="sm"
                >
                  {section.id === "identity" ? "In progress" : "Pending"}
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DialogLauncher>
      <DialogSurface
        id={4}
        onEscapeKeyDown={(event) => {
          if (
            event.target instanceof Element &&
            event.target.hasAttribute("data-checklist-inline-editor")
          )
            event.preventDefault();
        }}
        title="Launch checklist"
        description="Finalize routing, apps, and fallback rules before launch."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                setSaved(
                  `${values.owner} · ${values.alias} · ${values.window}. ${apps.filter((app) => app.connected).length} local app connections. Settings are saved only in this preview; no external app is authorized.`,
                );
                setOpen(false);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Accordion
          type="single"
          collapsible
          defaultValue="identity"
          className="refined-checklist-sections"
        >
          {sections.map((section) => (
            <AccordionItem value={section.id} key={section.id}>
              <AccordionTrigger aria-label={section.title}>
                <IconTile variant="frame">
                  <section.icon />
                </IconTile>
                <span className="refined-checklist-section-copy">
                  <span>{section.title}</span>
                  <span>{section.description}</span>
                </span>
                <Badge
                  size="sm"
                  variant={section.id === "identity" ? "success-light" : "secondary"}
                >
                  {section.id === "identity" ? "In progress" : "Pending"}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                {section.id === "apps" ? (
                  <div className="refined-checklist-apps">
                    <div className="refined-checklist-app-toolbar">
                      <InputGroup>
                        <InputGroupAddon>
                          <Search />
                        </InputGroupAddon>
                        <InputGroupInput
                          aria-label="Search apps"
                          placeholder="Search apps"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </InputGroup>
                      <Button variant="outline" onClick={() => setAddApp((value) => !value)}>
                        <Plus data-icon="inline-start" />
                        Add app
                      </Button>
                    </div>
                    {addApp && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!appName.trim()) return;
                          const id = `local-${appName.trim().toLowerCase()}`;
                          if (apps.some((app) => app.id === id)) return;
                          setApps((current) => [
                            ...current,
                            {
                              id,
                              name: appName.trim(),
                              description:
                                "Locally added app example. No authorization or network connection.",
                              initial: appName
                                .trim()
                                .slice(0, 1)
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "A"),
                              color: "#6f8f80",
                              connected: false,
                            },
                          ]);
                          setAppName("");
                          setAddApp(false);
                        }}
                      >
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="refined-checklist-app-name">App name</FieldLabel>
                            <Input
                              id="refined-checklist-app-name"
                              value={appName}
                              onChange={(event) => setAppName(event.target.value)}
                              required
                              maxLength={40}
                            />
                          </Field>
                          <Button type="submit">Add local app</Button>
                        </FieldGroup>
                      </form>
                    )}
                    <ItemGroup>
                      {apps
                        .filter((app) =>
                          `${app.name} ${app.description}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                        )
                        .map((app) => (
                          <Item variant="outline" key={app.id}>
                            <ItemMedia>
                              <img
                                className="size-5 rounded"
                                src={svgImage(integrationArtwork(app.initial, app.color))}
                                alt=""
                              />
                            </ItemMedia>
                            <ItemContent className="min-w-0">
                              <ItemTitle>{app.name}</ItemTitle>
                              <ItemDescription>{app.description}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              <Badge
                                variant={app.connected ? "success-light" : "outline"}
                                size="sm"
                              >
                                {app.connected ? "Connected" : "Ready"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={app.connected ? "outline" : "default"}
                                aria-label={`${app.connected ? "Manage" : "Connect"} ${app.name}`}
                                onClick={() =>
                                  app.connected
                                    ? setManageId(app.id)
                                    : setApps((current) =>
                                        current.map((entry) =>
                                          entry.id === app.id
                                            ? { ...entry, connected: true }
                                            : entry,
                                        ),
                                      )
                                }
                              >
                                {app.connected ? "Manage" : "Connect"}
                              </Button>
                            </ItemActions>
                          </Item>
                        ))}
                    </ItemGroup>
                    {!apps.some((app) =>
                      `${app.name} ${app.description}`.toLowerCase().includes(query.toLowerCase()),
                    ) && (
                      <p className="py-3 text-sm text-muted-foreground">
                        No apps match this search.
                      </p>
                    )}
                    {managed && (
                      <Alert variant="info">
                        <AlertTitle>{managed.name} · local connection</AlertTitle>
                        <AlertDescription>
                          No OAuth permission has been granted. This setting only changes the sample
                          app list.
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setApps((current) =>
                                current.map((app) =>
                                  app.id === managed.id ? { ...app, connected: false } : app,
                                ),
                              );
                              setManageId(null);
                            }}
                          >
                            Disconnect {managed.name}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <ItemGroup className="refined-checklist-fields">
                    {fields
                      .filter((field) => field.section === section.id)
                      .map((field) => (
                        <EditableSetupField
                          key={field.id}
                          field={field}
                          value={values[field.id]}
                          onSave={(value) =>
                            setValues((current) => ({ ...current, [field.id]: value }))
                          }
                        />
                      ))}
                  </ItemGroup>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogSurface>
    </Dialog>
  );
}
