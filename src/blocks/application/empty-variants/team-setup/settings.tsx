import { useState } from "react";
import { Plus, Tag, Target, X } from "lucide-react";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamStage } from "./support";

const sections = [
  {
    id: "states" as const,
    tab: "Project states",
    title: "Set up project states",
    description: "Create a shared stage system so every project follows the same progress flow.",
    icon: Target,
    singular: "state",
  },
  {
    id: "labels" as const,
    tab: "Project labels",
    title: "Set up project labels",
    description: "Add a simple label system to keep project streams easier to sort and review.",
    icon: Tag,
    singular: "label",
  },
];
type Section = (typeof sections)[number]["id"];

export default function SettingsEmpty() {
  const [active, setActive] = useState<Section>("states");
  const [enabled, setEnabled] = useState({ states: false, labels: false });
  const [items, setItems] = useState({
    states: ["Planned", "In progress", "Complete"],
    labels: ["Design", "Engineering", "Operations"],
  });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function addItem(section: Section) {
    const name = draft.trim();
    if (!name) return;
    if (items[section].some((value) => value.toLowerCase() === name.toLowerCase())) {
      setError(`A ${section === "states" ? "state" : "label"} with this name already exists.`);
      return;
    }
    setItems((current) => ({ ...current, [section]: [...current[section], name] }));
    setDraft("");
    setError("");
  }

  return (
    <TeamStage id={8}>
      <div className="empty-team-page empty-team-settings">
        <header>
          <div>
            <h1>Projects</h1>
            <p>Manage the shared project fields your workspace uses to stay organized.</p>
          </div>
        </header>
        <Tabs
          value={active}
          onValueChange={(value) => {
            setActive(value as Section);
            setDraft("");
            setError("");
          }}
        >
          <TabsList variant="line" aria-label="Project settings sections">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.tab}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              {enabled[section.id] ? (
                <div className="empty-team-setting-list">
                  <header>
                    <span>{section.tab}</span>
                    <Badge variant="secondary">Enabled locally</Badge>
                  </header>
                  {items[section.id].map((name) => (
                    <div key={name}>
                      <section.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 break-words">{name}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${section.singular} ${name}`}
                        onClick={() =>
                          setItems((current) => ({
                            ...current,
                            [section.id]: current[section.id].filter((value) => value !== name),
                          }))
                        }
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      addItem(section.id);
                    }}
                  >
                    <Input
                      aria-label={`New ${section.singular} name`}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      maxLength={40}
                      placeholder={`Add a ${section.singular}`}
                      required
                      className="min-w-0"
                    />
                    <Button type="submit" aria-label={`Add ${section.singular}`}>
                      <Plus />
                      Add
                    </Button>
                  </form>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Changes apply only to this preview. No project workspace is connected.
                  </p>
                  <Button
                    variant="outline"
                    className="justify-self-start"
                    onClick={() => setEnabled((current) => ({ ...current, [section.id]: false }))}
                  >
                    Disable {section.tab.toLowerCase()}
                  </Button>
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <IconStack>
                        <section.icon className="size-7" strokeWidth={1.5} />
                      </IconStack>
                    </EmptyMedia>
                    <EmptyTitle>{section.title}</EmptyTitle>
                    <EmptyDescription>{section.description}</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      onClick={() => setEnabled((current) => ({ ...current, [section.id]: true }))}
                    >
                      Enable
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </TeamStage>
  );
}
