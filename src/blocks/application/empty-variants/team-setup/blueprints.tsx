import { useState } from "react";
import { Check, LayoutTemplate, Plus, Upload } from "lucide-react";
import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseBlueprint, type LocalBlueprint } from "./blueprint-schema";
import { TeamDialog, TeamStage } from "./support";

export default function BlueprintsEmpty() {
  const [open, setOpen] = useState(false);
  const [blueprints, setBlueprints] = useState<LocalBlueprint[]>([]);
  const [selected, setSelected] = useState<LocalBlueprint | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function importBlueprint(files: FileWithPreview[]) {
    const file = files[0]?.file;
    if (!(file instanceof File)) return;
    setBusy(true);
    setError("");
    try {
      const blueprint = parseBlueprint(await file.text());
      setBlueprints((current) => [...current, blueprint]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not read the blueprint.");
    } finally {
      setBusy(false);
    }
  }

  const [{ errors }, { openFileDialog, getInputProps, clearFiles }] = useFileUpload({
    accept: ".json,application/json",
    maxSize: 64 * 1024,
    onFilesAdded: (files) => void importBlueprint(files),
  });

  function beginCreate() {
    setName("");
    setDescription("");
    setTasks("");
    setError("");
    setOpen(true);
  }

  return (
    <TeamStage id={10}>
      <div className="empty-team-page empty-team-library">
        <input
          {...getInputProps()}
          className="sr-only"
          tabIndex={-1}
          aria-label="Import blueprint JSON"
        />
        <header>
          <div>
            <h1>Blueprint Library</h1>
            <p>
              Turn repeatable launches, onboarding flows, and reports into reusable project
              blueprints.
            </p>
          </div>
        </header>
        {blueprints.length ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Badge variant="secondary">{blueprints.length} local blueprints</Badge>
              <div className="empty-team-actions">
                <Button onClick={beginCreate}>
                  <Plus />
                  Create blueprint
                </Button>
                <Button variant="outline" onClick={openFileDialog} disabled={busy}>
                  <Upload />
                  Import blueprint
                </Button>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3">
              {blueprints.map((blueprint, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto min-w-0 justify-start gap-4 p-4 text-left whitespace-normal"
                  onClick={() => setSelected(blueprint)}
                >
                  <LayoutTemplate className="size-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <strong className="block break-words text-sm">{blueprint.name}</strong>
                    <span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">
                      {blueprint.description || "Reusable project starting point"}
                    </span>
                  </span>
                  <Badge variant="secondary">{blueprint.tasks.length} tasks</Badge>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setBlueprints([]);
                setError("");
                clearFiles();
              }}
            >
              Reset library
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Empty className="empty-team-blueprint-empty">
                <EmptyMedia>
                  <IconStack>
                    <LayoutTemplate className="size-7" strokeWidth={1.5} />
                  </IconStack>
                </EmptyMedia>
                <div>
                  <EmptyHeader>
                    <EmptyTitle>No blueprints yet</EmptyTitle>
                    <EmptyDescription>
                      Create a reusable starting point so every new project starts structured.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="empty-team-actions">
                      <Button onClick={beginCreate}>Create blueprint</Button>
                      <Button variant="secondary" onClick={openFileDialog} disabled={busy}>
                        {busy ? "Reading…" : "Import blueprint"}
                      </Button>
                    </div>
                  </EmptyContent>
                </div>
              </Empty>
            </CardContent>
          </Card>
        )}
        {(error || errors.length > 0) && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Blueprint could not be imported</AlertTitle>
            <AlertDescription>{errors.length ? errors.join(" ") : error}</AlertDescription>
          </Alert>
        )}
      </div>
      <TeamDialog
        title="Create blueprint"
        description="Create a reusable local starting point. It is kept only while this preview is open."
        open={open}
        onOpenChange={setOpen}
      >
        <form
          className="empty-team-form"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const blueprint = parseBlueprint(
                JSON.stringify({
                  name,
                  description,
                  tasks: tasks
                    .split("\n")
                    .map((task) => task.trim())
                    .filter(Boolean),
                }),
              );
              setBlueprints((current) => [...current, blueprint]);
              setError("");
              setOpen(false);
            } catch (error) {
              setError(error instanceof Error ? error.message : "Check the blueprint fields.");
            }
          }}
        >
          <label>
            Blueprint name
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Customer onboarding"
            />
          </label>
          <label>
            Description
            <Textarea
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A repeatable launch or onboarding process…"
              rows={3}
            />
          </label>
          <label>
            Starter tasks
            <Textarea
              value={tasks}
              onChange={(event) => setTasks(event.target.value)}
              placeholder={"One task per line\nAssign an owner\nSchedule the kickoff"}
              rows={4}
            />
          </label>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit">Save blueprint</Button>
        </form>
      </TeamDialog>
      <TeamDialog
        title={selected?.name ?? "Blueprint preview"}
        description="Local blueprint preview. No project has been created in an external workspace."
        open={selected !== null}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <p className="break-words text-sm leading-relaxed text-muted-foreground">
          {selected?.description || "Reusable project starting point"}
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-2">
          {selected?.tasks.length ? (
            selected.tasks.map((task, index) => (
              <div key={index} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 break-words">{task}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No starter tasks configured.</p>
          )}
        </div>
      </TeamDialog>
    </TeamStage>
  );
}
