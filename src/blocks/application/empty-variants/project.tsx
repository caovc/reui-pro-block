import { useState } from "react";
import { Boxes, LayoutDashboard, LayoutTemplate, Plus, Timer } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionRow, EmptyHero, EmptyStage, LocalDialog, QuickLinks } from "./first-run/shared";

const templates = [
  {
    name: "Task board",
    icon: LayoutDashboard,
    description: "Plan work with To do, In progress, and Done columns.",
    tasks: ["Define the project outcome", "Assign task owners", "Review the first milestone"],
  },
  {
    name: "Sprint tracker",
    icon: Timer,
    description: "Organize the next sprint with a focused backlog and review.",
    tasks: [
      "Prioritize sprint backlog",
      "Estimate the first stories",
      "Schedule the sprint review",
    ],
  },
];

export default function ProjectEmpty() {
  const [modal, setModal] = useState<"create" | "templates" | null>(null);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<(typeof templates)[number] | null>(null);
  const [project, setProject] = useState<{
    name: string;
    template: string;
    tasks: string[];
  } | null>(null);

  function selectTemplate(value: (typeof templates)[number]) {
    setTemplate(value);
    setName(`${value.name} project`);
    setModal("create");
  }

  return (
    <EmptyStage id={3}>
      {project ? (
        <div className="empty-first-populated">
          <header>
            <div>
              <h1>{project.name}</h1>
              <p>{project.template} · Created in this local preview</p>
            </div>
            <Button variant="outline" onClick={() => setProject(null)}>
              Reset project
            </Button>
          </header>
          <div className="grid gap-4 sm:grid-cols-3">
            {["To do", "In progress", "Done"].map((column, index) => (
              <Card key={column} className="min-h-48">
                <CardHeader>
                  <CardTitle className="text-sm">
                    {column}{" "}
                    <Badge variant="secondary" className="ml-1">
                      {index === 0 ? project.tasks.length : 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {index === 0 ? (
                    project.tasks.map((task) => (
                      <div
                        key={task}
                        className="rounded-lg border bg-background p-3 text-xs leading-relaxed"
                      >
                        {task}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No tasks yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <EmptyHero
            media={
              <div className="empty-first-project-art" aria-hidden="true">
                <Boxes />
              </div>
            }
            title="No projects to show"
            description="Start a project from scratch or pick a template to launch your first workspace and begin tracking tasks, goals, and progress."
          >
            <ActionRow>
              <Button
                onClick={() => {
                  setTemplate(null);
                  setName("");
                  setModal("create");
                }}
              >
                <Plus />
                New project
              </Button>
              <Button variant="outline" onClick={() => setModal("templates")}>
                <LayoutTemplate />
                Explore templates
              </Button>
            </ActionRow>
          </EmptyHero>
          <div className="w-full max-w-md">
            <QuickLinks
              title="Quick starts"
              items={templates.map((item) => ({
                label: item.name,
                icon: <item.icon className="size-4" />,
                onClick: () => selectTemplate(item),
              }))}
            />
          </div>
        </>
      )}
      <LocalDialog
        title={modal === "templates" ? "Explore templates" : "New project"}
        description={
          modal === "templates"
            ? "Pick a local starter to preview its structure."
            : "Creates a project in this page only. No workspace service is connected."
        }
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
      >
        {modal === "templates" ? (
          <div className="empty-first-template-grid">
            {templates.map((item) => (
              <Button key={item.name} variant="outline" onClick={() => selectTemplate(item)}>
                <item.icon className="mr-2 size-6" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <form
            className="empty-first-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              setProject({
                name: name.trim(),
                template: template?.name ?? "Blank project",
                tasks: template?.tasks ?? ["Add your first task"],
              });
              setModal(null);
            }}
          >
            <label>
              Project name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Website launch"
                required
                autoFocus
                maxLength={80}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              Template: {template?.name ?? "Blank project"}
            </p>
            <Button type="submit">Create project</Button>
          </form>
        )}
      </LocalDialog>
    </EmptyStage>
  );
}
