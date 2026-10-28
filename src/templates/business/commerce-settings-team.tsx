import { useCallback, useMemo, useRef, useState } from "react";
import { Ellipsis, ListFilter, Pencil, Trash2, UserPlus } from "lucide-react";
import CollaboratorInviteDialog from "@/blocks/application/dialog-variants/workspace/invites";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Identity } from "@/blocks/data/grid-base-common";
import {
  NativeGrid,
  NativePager,
  NativeSettings,
  NativeTable,
  selectionColumn,
  useGridDisplay,
  useGridTable,
  type GridColumn,
} from "@/blocks/data/grid-base-engine";
import {
  matchesRules,
  type FilterRule as LegacyFilterRule,
} from "@/blocks/data/grid-filter-controls";
import { Badge } from "@/components/reui/badge";
import {
  Filters,
  createFilterQuery,
  createFilterRule,
  flattenFilterRules,
  type FilterField,
  type FilterQuery,
} from "@/components/reui/filters/filters";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { commerceMemberRoles, type CommerceMember } from "./commerce-settings-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";
import "@/blocks/application/dialog-variants/first-run/first-run.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";

const textOperators = [
  "contains",
  "does not contain",
  "is",
  "is not",
  "starts with",
  "ends with",
  "is empty",
  "is not empty",
].map((value) => ({
  value,
  label: value,
  arity: value.includes("empty") ? ("none" as const) : ("one" as const),
}));
const choiceOperators = ["is", "is not", "is any of", "is none of"].map((value) => ({
  value,
  label: value,
  arity: value.includes(" of") ? ("many" as const) : ("one" as const),
}));
const teamFilterFields: FilterField[] = [
  {
    id: "member",
    label: "Member",
    type: "text",
    operators: textOperators,
    placeholder: "Search...",
    className: "reui-reference",
  },
  {
    id: "role",
    label: "Role",
    type: "select",
    operators: choiceOperators,
    options: commerceMemberRoles.map((value) => ({ value, label: value })),
    className: "reui-reference",
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    operators: choiceOperators,
    options: ["Active", "Invited", "Suspended", "Deactivated"].map((value) => ({
      value,
      label: value,
    })),
    className: "reui-reference",
  },
];
function initialTeamQuery() {
  return createFilterQuery([
    createFilterRule({ id: "member-search", path: ["member"], operator: "contains", value: "" }),
  ]);
}

export function CommerceTeamSettings({ model }: { model: CommerceSettingsModel }) {
  const [query, setQuery] = useState<FilterQuery>(initialTeamQuery);
  const [editing, setEditing] = useState<CommerceMember | null>(null);
  const [removing, setRemoving] = useState<CommerceMember | null>(null);
  const [error, setError] = useState("");
  const memberOpener = useRef<HTMLButtonElement | null>(null);
  const inviteButton = useRef<HTMLButtonElement | null>(null);
  const openingDialog = useRef(false);
  const display = useGridDisplay();
  const fields = useMemo<GridColumn<CommerceMember>[]>(
    () => [
      selectionColumn<CommerceMember>(),
      {
        id: "member",
        title: "Member",
        width: 216,
        value: (member) => member.name,
        cell: (member) => <Identity name={member.name} detail={member.email} photo={false} />,
      },
      {
        id: "role",
        title: "Role",
        width: 120,
        cell: (member) => <Badge variant="secondary">{member.role}</Badge>,
      },
      {
        id: "teams",
        title: "Teams",
        width: 200,
        value: (member) => member.teams.join(", "),
        cell: (member) => (
          <div className="csd-team-badges">
            {member.teams.map((team) => (
              <Badge key={team} variant="secondary">
                {team}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "status",
        title: "Status",
        width: 120,
        cell: (member) => (
          <Badge
            variant={
              member.status === "Active"
                ? "success-light"
                : member.status === "Invited"
                  ? "warning-light"
                  : member.status === "Suspended"
                    ? "destructive-light"
                    : "secondary"
            }
          >
            {member.status}
          </Badge>
        ),
      },
      {
        id: "auth",
        title: "Auth",
        width: 220,
        cell: (member) => (
          <div className="csd-team-badges">
            <Badge variant={member.auth === "Password" ? "warning-light" : "success-light"}>
              {member.auth}
            </Badge>
            <Badge
              variant={member.secondFactor === "No 2FA" ? "destructive-light" : "success-light"}
            >
              {member.secondFactor}
            </Badge>
          </div>
        ),
      },
      {
        id: "lastActive",
        title: "Last Active",
        width: 130,
        cell: (member) => <span className="text-muted-foreground">{member.lastActive}</span>,
      },
      {
        id: "_actions",
        width: 60,
        minWidth: 40,
        cell: (member) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${member.name}`}
                onClick={(event) => {
                  memberOpener.current = event.currentTarget;
                }}
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="reui-reference"
              onCloseAutoFocus={(event) => {
                const handoff = openingDialog.current;
                openingDialog.current = false;
                if (handoff) event.preventDefault();
              }}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    openingDialog.current = true;
                    setError("");
                    setEditing({ ...member });
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Edit member
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    openingDialog.current = true;
                    setRemoving(member);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Remove member
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );
  const filter = useCallback(
    (member: CommerceMember) => {
      const rules: LegacyFilterRule[] = flattenFilterRules(query).map((rule) => ({
        id: rule.id,
        field: rule.path[0],
        operator: rule.operator,
        values:
          rule.value === undefined
            ? []
            : (Array.isArray(rule.value) ? rule.value : [rule.value]).map(String),
        negated: rule.negated,
      }));
      return matchesRules({ ...member, member: `${member.name} ${member.email}` }, rules);
    },
    [query],
  );
  const table = useGridTable({ data: model.members, fields, pageSize: 10, filter });
  const pending = model.members.filter((member) => member.status === "Invited").length;
  function restoreMemberFocus(event: Event) {
    const target = memberOpener.current?.isConnected ? memberOpener.current : inviteButton.current;
    memberOpener.current = null;
    if (!target || target.disabled) return;
    target.focus();
    if (target.ownerDocument.activeElement === target) event.preventDefault();
  }

  return (
    <>
      <header className="csd-page-heading">
        <div className="csd-team-heading">
          <h1>Team</h1>
          <Badge variant="secondary">
            {model.members.length} of 10 seats · {pending} pending
          </Badge>
        </div>
        <CollaboratorInviteDialog
          trigger={
            <Button ref={inviteButton}>
              <UserPlus aria-hidden="true" />
              Invite people
            </Button>
          }
          onInvite={(rows) =>
            model.inviteMembers(
              rows.map((row) => ({
                email: row.email,
                role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
              })),
            )
          }
        />
      </header>
      <Frame dense className="csd-frame">
        <FramePanel fit className="csd-fit-panel csd-team-panel">
          <NativeGrid
            table={table}
            density={display.density}
            resizable={display.resizable}
            className="csd-team-table"
          >
            <div className="csd-team-toolbar">
              <Filters
                fields={teamFilterFields}
                query={query}
                onQueryChange={(next) => {
                  setQuery(next);
                  table.setPageIndex(0);
                }}
                showClear
                menuClassName="reui-reference"
                fieldPickerClassName="reui-reference"
                trigger={
                  <Button variant="outline">
                    <ListFilter aria-hidden="true" />
                    Filters
                  </Button>
                }
                className="csd-team-filters"
              />
              <NativeSettings table={table} {...display} />
            </div>
            <NativeTable />
            <NativePager />
          </NativeGrid>
        </FramePanel>
      </Frame>
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="reui-reference" onCloseAutoFocus={restoreMemberFocus}>
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>
              Local demo fields. Real account identity and access are unchanged.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const failure = model.updateMember(editing.id, editing);
                if (failure) setError(failure);
                else setEditing(null);
              }}
              noValidate
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="commerce-member-name">Name</FieldLabel>
                  <Input
                    id="commerce-member-name"
                    value={editing.name}
                    maxLength={100}
                    onChange={(event) => {
                      setEditing({ ...editing, name: event.target.value });
                      setError("");
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="commerce-member-email">Email</FieldLabel>
                  <Input
                    id="commerce-member-email"
                    type="email"
                    value={editing.email}
                    maxLength={160}
                    onChange={(event) => {
                      setEditing({ ...editing, email: event.target.value });
                      setError("");
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="commerce-member-role">Role</FieldLabel>
                  <SettingsChoice
                    id="commerce-member-role"
                    value={editing.role}
                    options={commerceMemberRoles}
                    onChange={(role) => setEditing({ ...editing, role })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="commerce-member-status">Status</FieldLabel>
                  <SettingsChoice
                    id="commerce-member-status"
                    value={editing.status}
                    options={["Active", "Invited", "Suspended", "Deactivated"]}
                    onChange={(status) => {
                      if (["Active", "Invited", "Suspended", "Deactivated"].includes(status))
                        setEditing({ ...editing, status: status as CommerceMember["status"] });
                    }}
                  />
                </Field>
                {error && <FieldError role="alert">{error}</FieldError>}
              </FieldGroup>
              <DialogFooter className="mt-5">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save member</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent className="reui-reference" onCloseAutoFocus={restoreMemberFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the member from the local preview only. No access is revoked and no
              message is sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) model.removeMember(removing.id);
                table.resetRowSelection();
                setRemoving(null);
              }}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
