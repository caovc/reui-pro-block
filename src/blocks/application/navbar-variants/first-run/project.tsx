import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { WorkspaceTrail } from "./free/trail";
import { ProjectTabs } from "./free/project-tabs";
import { WorkspaceActions } from "./free/actions-menu";
import { CollaboratorsPopover, LocalNotice, WorkspaceSearch } from "./support";
import "./navbar.css";

export default function ProjectWorkspaceNavbar() {
  const [tab, setTab] = useState("overview");
  const [starred, setStarred] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <section className="refined-navbar-scene" data-navbar-entry="1">
      <h1 className="navbar-demo-heading">Navbar</h1>
      <header className="navbar-project-header">
        <WorkspaceTrail
          items={[{ label: "Workspace" }, { label: "Projects" }, { label: "Design System" }]}
          onNavigate={(label) => setNotice(`${label} selected locally.`)}
        />
        <div className="navbar-header-actions">
          <WorkspaceSearch onSelect={(value) => setNotice(`${value} selected locally.`)} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Star project"
            aria-pressed={starred}
            onClick={() => setStarred(!starred)}
          >
            <Star className={cn(starred && "fill-current")} />
          </Button>
          <WorkspaceActions
            onAction={(action) => setNotice(`${action}: local project action only.`)}
          />
          <Separator orientation="vertical" className="h-5" />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="navbar-create" aria-label="Create new">
                <Plus data-icon="inline-start" />
                <span>Create New</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Create a local draft to demonstrate this navbar action.
                </DialogDescription>
              </DialogHeader>
              <form
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!name.trim()) return;
                  setNotice(`Created ${name.trim()} as a local draft. No server request was sent.`);
                  setCreateOpen(false);
                  setName("");
                }}
              >
                <Field>
                  <FieldLabel htmlFor="navbar-new-name">Project name</FieldLabel>
                  <Input
                    id="navbar-new-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    required
                  />
                </Field>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!name.trim()}>
                    Create draft
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <ProjectTabs value={tab} onChange={setTab}>
        <CollaboratorsPopover />
      </ProjectTabs>
      <LocalNotice>{notice}</LocalNotice>
    </section>
  );
}
