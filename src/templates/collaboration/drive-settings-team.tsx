// Actual ReUI DataGrid and native menu/dialog composition; MIT notice at REUI-LICENSE.txt.
import { useMemo, useRef, useState } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Copy, Funnel, MoreHorizontal, Search, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { copyDriveMemberValue } from "./drive-settings-downloads";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { demoAvatar } from "@/lib/demo-artwork";
import { DriveSettingsCard, DriveSettingsDialog } from "./drive-settings-components";
import { DriveRichChoice } from "./drive-settings-free";
import { driveAccessOptions } from "./drive-settings-options";
import {
  driveMemberPageSizes,
  type DriveMemberAccess,
  type DriveMemberStatus,
  type DriveSettingsMember,
} from "./drive-settings-data";
import type { DriveSettingsModel } from "./drive-settings-model";
import type { DriveSettingsNavigation } from "./drive-settings-types";

const statuses: DriveMemberStatus[] = ["Active", "Invited", "Limited", "Suspended"];
export function DriveMemberStatusBadge({ status }: { status: DriveMemberStatus }) {
  return (
    <Badge
      size="sm"
      variant={
        status === "Active"
          ? "success-light"
          : status === "Limited"
            ? "warning-light"
            : status === "Suspended"
              ? "destructive-light"
              : "secondary"
      }
    >
      {status}
    </Badge>
  );
}
export function DriveMemberAvatar({ name }: { name: string }) {
  return (
    <Avatar className="size-8">
      <AvatarImage src={demoAvatar(name)} alt="" />
      <AvatarFallback>
        {name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}
export function DriveTeamSettings({
  model,
  navigation,
}: {
  model: DriveSettingsModel;
  navigation: DriveSettingsNavigation;
}) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DriveMemberStatus[]>([]);
  const [dialog, setDialog] = useState<{
    kind: "invite" | "role" | "remove";
    member?: DriveSettingsMember;
    trigger: HTMLElement | null;
  } | null>(null);
  const rows = useMemo(
    () =>
      model.members.filter(
        (member) =>
          (!selected.length || selected.includes(member.status)) &&
          `${member.name} ${member.email} ${member.role} ${member.department}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [model.members, query, selected],
  );
  const columns: ColumnDef<DataGridFeatures, DriveSettingsMember>[] = [
    {
      id: "member",
      accessorFn: (member) => member.name,
      size: 300,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Member" />,
      cell: ({ row }) => (
        <div className="ds-member-identity">
          <DriveMemberAvatar name={row.original.name} />
          <div>
            <div className="ds-member-name">
              <a
                href={navigation.href("team", row.original.id)}
                onClick={(event) => {
                  if (
                    event.button === 0 &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    navigation.onNavigate("team", row.original.id);
                  }
                }}
              >
                {row.original.name}
              </a>
              <Badge
                variant={row.original.access === "Owner" ? "primary-light" : "outline"}
                size="sm"
              >
                {row.original.access}
              </Badge>
            </div>
            <p className="ds-muted">{row.original.email}</p>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 md:hidden">
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.role}
              </span>
              <span
                aria-hidden="true"
                className="size-1 shrink-0 rounded-full bg-muted-foreground/40"
              />
              <DriveMemberStatusBadge status={row.original.status} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      accessorFn: (member) => member.role,
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <div className="ds-member-role">
          {row.original.role}
          <p className="ds-muted">{row.original.department}</p>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (member) => member.status,
      size: 120,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <DriveMemberStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      size: 50,
      enableSorting: false,
      cell: ({ row }) => (
        <DriveMemberMenu
          member={row.original}
          navigation={navigation}
          onDialog={(kind, trigger) => setDialog({ kind, member: row.original, trigger })}
          onReset={() => model.resetSession(row.original.id)}
        />
      ),
    },
  ];
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (member) => member.id,
    autoResetPageIndex: true,
    state: { columnVisibility: { role: !isMobile, status: !isMobile } },
    initialState: {
      sorting: [{ id: "member", desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });
  return (
    <>
      <DataGrid
        table={table}
        recordCount={rows.length}
        emptyMessage="No members match your filters."
        tableLayout={{
          width: isMobile ? "auto" : "fixed",
          dense: true,
          rowBorder: true,
          headerBorder: true,
        }}
        tableClassNames={{ base: "ds-member-grid", edgeCell: "first:ps-5 last:pe-5" }}
      >
        <DriveSettingsCard
          title="Workspace Team"
          description="Manage members and access."
          className="ds-team-card"
          footer={
            <DataGridPagination
              sizes={[...driveMemberPageSizes]}
              info="{from} - {to} of {count}"
              className="w-full ds-grid-pagination"
            />
          }
          action={
            <Button
              className="ds-team-invite"
              onClick={(event) => setDialog({ kind: "invite", trigger: event.currentTarget })}
            >
              <UserRoundPlus />
              Invite member
            </Button>
          }
        >
          <div className="ds-team-toolbar">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search team"
                placeholder="Search team"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" aria-label="Filter by member status">
                  <Funnel />
                  Status
                </Button>
              </PopoverTrigger>
              <PopoverContent className="reui-reference ds-status-filter" align="start">
                {statuses.map((status) => (
                  <Label key={status}>
                    <Checkbox
                      checked={selected.includes(status)}
                      onCheckedChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? [...current, status]
                            : current.filter((item) => item !== status),
                        )
                      }
                    />
                    {status}
                    <span>{model.members.filter((member) => member.status === status).length}</span>
                  </Label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          {(query || selected.length > 0) && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setQuery("");
                setSelected([]);
              }}
            >
              Clear filters
            </Button>
          )}
          <Separator />
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
        </DriveSettingsCard>
      </DataGrid>
      {dialog?.kind === "invite" && (
        <DriveInviteMember model={model} trigger={dialog.trigger} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "role" && dialog.member && (
        <DriveChangeMemberRole
          model={model}
          member={dialog.member}
          trigger={dialog.trigger}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "remove" && dialog.member && (
        <DriveSettingsDialog
          title="Remove member?"
          description={`Remove ${dialog.member.name} from the local preview only.`}
          onClose={() => setDialog(null)}
          returnFocus={dialog.trigger}
          footer={
            <>
              <Button variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const previous = model.members;
                  model.setMembers((current) =>
                    current.filter((member) => member.id !== dialog.member?.id),
                  );
                  setDialog(null);
                  toast.success("Member removed locally", {
                    description: "No real access changed.",
                    action: { label: "Undo", onClick: () => model.setMembers(previous) },
                  });
                }}
              >
                Remove member
              </Button>
            </>
          }
        >
          <p>Only this preview's member list changes. No account is contacted.</p>
        </DriveSettingsDialog>
      )}
    </>
  );
}
function DriveMemberMenu({
  member,
  navigation,
  onDialog,
  onReset,
}: {
  member: DriveSettingsMember;
  navigation: DriveSettingsNavigation;
  onDialog: (kind: "role" | "remove", trigger: HTMLElement | null) => void;
  onReset: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          aria-label={`Open ${member.name} actions`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="reui-reference" align="end">
        <DropdownMenuItem onSelect={() => navigation.onNavigate("team", member.id)}>
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDialog("role", trigger.current)}>
          Change role
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReset}>Reset session</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => copyDriveMemberValue(member.id, "ID")}>
          <Copy />
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDialog("remove", trigger.current)}
        >
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function DriveChangeMemberRole({
  model,
  member,
  onClose,
  trigger,
}: {
  model: DriveSettingsModel;
  member: DriveSettingsMember;
  onClose: () => void;
  trigger: HTMLElement | null;
}) {
  const [access, setAccess] = useState<DriveMemberAccess>(member.access);
  return (
    <DriveSettingsDialog
      title="Change role"
      description={`What ${member.name} can do in this workspace.`}
      onClose={onClose}
      returnFocus={trigger}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              model.changeAccess(member.id, access);
              onClose();
            }}
          >
            Change role
          </Button>
        </>
      }
    >
      <RadioGroup value={access} onValueChange={(value) => setAccess(value as DriveMemberAccess)}>
        {driveAccessOptions.map(([label, description]) => (
          <Label key={label} className="ds-access-option">
            <RadioGroupItem value={label} />
            <span>
              <strong>{label}</strong>
              <span>{description}.</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
    </DriveSettingsDialog>
  );
}
function DriveInviteMember({
  model,
  onClose,
  trigger,
}: {
  model: DriveSettingsModel;
  onClose: () => void;
  trigger: HTMLElement | null;
}) {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<DriveMemberAccess>("Member");
  const [note, setNote] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <DriveSettingsDialog
      title="Invite member"
      description="They join the workspace with the access you pick here. You can change it afterwards from their row."
      onClose={onClose}
      returnFocus={trigger}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              model.invite(email, access, note);
              onClose();
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <Label htmlFor="drive-invite-email">Email address</Label>
      <Input
        id="drive-invite-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Label htmlFor="drive-invite-access">Access</Label>
      <DriveRichChoice
        id="drive-invite-access"
        value={access}
        options={driveAccessOptions}
        onChange={(value) => setAccess(value as DriveMemberAccess)}
      />
      <Label htmlFor="drive-invite-note">Note</Label>
      <Textarea
        id="drive-invite-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p className="ds-muted">Local preview only. No invitation email is sent.</p>
    </DriveSettingsDialog>
  );
}
