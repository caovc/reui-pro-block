import { useId, useRef, useState, type ReactElement } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getDrivePlan, type DriveWorkspace } from "./drive-workspace-model";
import "@/blocks/reference.css";
import "./drive-pricing.css";

/** Header menu. The trigger slot must be a ref-capable button, never another menu. */
export function DriveWorkspaceMenu({
  workspaces,
  value,
  onSelect,
  onCreate,
  trigger,
}: {
  workspaces: readonly DriveWorkspace[];
  value: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  trigger?: ReactElement;
}) {
  const nameId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const creatingRef = useRef(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const workspace = workspaces.find((entry) => entry.id === value);

  function changeCreateOpen(open: boolean) {
    creatingRef.current = open;
    setCreateOpen(open);
    if (!open) setName("");
  }

  return (
    <Dialog open={createOpen} onOpenChange={changeCreateOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild ref={triggerRef}>
          {trigger ?? (
            <Button
              variant="ghost"
              size="sm"
              className="drive-workspace-trigger"
              aria-label={workspace?.name ?? "Choose workspace"}
            >
              <span className="drive-workspace-mark" data-mark={workspace?.mark}>
                <BrandGlyph />
              </span>
              <span>{workspace?.name ?? "Choose workspace"}</span>
              <ChevronsUpDown aria-hidden="true" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="reui-reference drive-workspace-menu"
          onCloseAutoFocus={(event) => {
            // Menu's native focus return must not steal the opening Dialog's autofocus.
            if (creatingRef.current) event.preventDefault();
          }}
        >
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuGroup>
            {workspaces.map((entry) => (
              <DropdownMenuItem
                key={entry.id}
                className="drive-workspace-item"
                data-workspace-id={entry.id}
                data-current={entry.id === value || undefined}
                onSelect={() => onSelect(entry.id)}
              >
                <span className="drive-workspace-mark" data-mark={entry.mark}>
                  <BrandGlyph />
                </span>
                <span className="drive-workspace-item-text">
                  <span>{entry.name}</span>
                  <Badge variant="secondary" className="drive-workspace-plan">
                    {getDrivePlan(entry.plan).name}
                  </Badge>
                </span>
                {entry.id === value && <Check className="drive-workspace-check" aria-hidden />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => changeCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent
        className="reui-reference drive-workspace-create"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nameRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <form
          className="drive-workspace-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName) {
              nameRef.current?.setCustomValidity("Enter a workspace name.");
              nameRef.current?.reportValidity();
              return;
            }
            // Deliberately local: caller may append an in-memory Free workspace.
            onCreate(trimmedName);
            changeCreateOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>On the Free plan until you move it.</DialogDescription>
          </DialogHeader>
          <Field className="drive-workspace-name-field">
            <FieldLabel htmlFor={nameId}>Name</FieldLabel>
            <Input
              id={nameId}
              ref={nameRef}
              placeholder="Bricklane Studio"
              value={name}
              required
              onChange={(event) => {
                event.target.setCustomValidity("");
                setName(event.target.value);
              }}
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
