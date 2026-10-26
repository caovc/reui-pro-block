import { useState } from "react";
import { Plus, Shield, Banknote, TrendingUp, Gauge, Search, MoreVertical } from "lucide-react";
import { Button, Input } from "./shared";
import { SideForm } from "./controls";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import "./echo-refinement.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
export type EchoProject = {
  id: string;
  name: string;
  chats: number;
  changed: string;
  icon: number;
};
export function EchoProjects({
  projects,
  open,
  onCreate,
  onClose,
  onOpen,
  onNew,
  onRename,
  onDelete,
}: {
  projects: EchoProject[];
  open: boolean;
  onCreate: (name: string) => void;
  onClose: () => void;
  onOpen: (name: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState("");
  return (
    <div className="echo-projects">
      <div className="wf-page-heading">
        <div>
          <h1>Projects</h1>
          <p>Chats, files, and standing instructions grouped by project</p>
        </div>
      </div>
      <div className="echo-project-search">
        <div>
          <Search className="size-4" />
          <Input
            aria-label="Search projects"
            placeholder="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setName("");
            setEditing("");
            onNew();
          }}
        >
          <Plus />
          New Project
        </Button>
      </div>
      <ItemGroup className="echo-project-list gap-0">
        {projects
          .filter((project) => project.name.toLowerCase().includes(query.toLowerCase()))
          .map((project) => {
            const { id, name: projectName, chats, changed, icon } = project;
            const Icon = [Shield, Banknote, TrendingUp, Gauge, Search][icon % 5];
            return (
              <Item variant="outline" className="echo-project-row" key={id}>
                <button onClick={() => onOpen(projectName)}>
                  <ItemMedia>
                    <IconTile variant="frame">
                      <Icon />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{projectName}</ItemTitle>
                    <ItemDescription>
                      {chats} {chats === 1 ? "chat" : "chats"}, last changed {changed}
                    </ItemDescription>
                  </ItemContent>
                </button>
                <ItemActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions ${projectName}`}>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => onOpen(projectName)}>
                        Open project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(id);
                          setName(projectName);
                          onNew();
                        }}
                      >
                        Rename project
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(id)}>
                        Delete project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            );
          })}
      </ItemGroup>
      <SideForm
        wide
        title={editing ? "Rename project" : "New project"}
        description="Instructions and files are added afterwards."
        open={open}
        onClose={onClose}
        submit={editing ? "Save project" : "Create project"}
        onSubmit={() => {
          if (name.trim()) {
            if (editing) onRename(editing, name.trim());
            else onCreate(name.trim());
            setName("");
            setEditing("");
            onClose();
          }
        }}
      >
        <label>
          Project name
          <Input
            required
            autoFocus
            placeholder="e.g. Billing reliability"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      </SideForm>
    </div>
  );
}
