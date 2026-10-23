import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { collaborators, workspaceRecords } from "./data";
import { PersonAvatar, PresenceGroup } from "./free/presence";

export function LocalNotice({ children }: { children: string | null }) {
  return children ? (
    <Alert className="m-5 w-auto" role="status">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  ) : null;
}
export function CollaboratorsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-1" aria-label="View 12 collaborators">
          <PresenceGroup names={collaborators} extra={9} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-3">
          <strong className="text-sm">
            Collaborators <span className="text-muted-foreground">12</span>
          </strong>
          <div className="flex max-h-72 flex-col gap-3 overflow-auto">
            {collaborators.map((name, index) => (
              <div key={name} className="flex items-center gap-2">
                <PersonAvatar name={name} online={index < 4} />
                <span className="flex-1 text-sm">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {index === 0 ? "You" : index < 4 ? "Online" : "Member"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export function WorkspaceSearch({ onSelect }: { onSelect: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = workspaceRecords.filter((record) =>
    record.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Search projects">
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <Field>
          <FieldLabel htmlFor="navbar-project-search">Search projects</FieldLabel>
          <Input
            id="navbar-project-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a project…"
          />
        </Field>
        <div className="mt-3 flex flex-col gap-1">
          {filtered.length ? (
            filtered.map((record) => (
              <Button
                key={record.name}
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onSelect(record.name);
                  setOpen(false);
                }}
              >
                {record.name}
              </Button>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No projects found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
