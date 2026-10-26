// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt (included in project exports).
import { useMemo, useState } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Filter, Search, UserRoundPlus } from "lucide-react";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { demoAvatar } from "@/lib/demo-artwork";
import { CheckOption, DetailFacts, RecordMenu, SettingsDrawer } from "./flowly-settings-components";
import type { FlowlySettingsModel } from "./flowly-settings-model";
import type { FlowlyMember, MemberArea, MemberLevel, MemberStatus } from "./flowly-settings-data";

const levels: MemberLevel[] = ["Owner", "Admin", "Editor", "Viewer"];
const levelDescriptions: Record<MemberLevel, string> = {
  Owner: "Everything, including billing and owners.",
  Admin: "Members, integrations and every workflow.",
  Editor: "Builds, runs and publishes in their areas.",
  Viewer: "Sees runs and results, changes nothing.",
};
const areas: readonly [MemberArea, string][] = [
  ["Workflows", "Build and run"],
  ["Agents", "Configure AI agents"],
  ["Billing", "Plans and invoices"],
  ["Integrations", "Connected tools"],
];
const teams = ["Platform", "Operations", "Engineering", "Support", "Data", "Finance"];
const statuses: MemberStatus[] = ["Active", "Invited", "Needs review"];

export function FlowlyMembersPage({ model }: { model: FlowlySettingsModel }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MemberStatus[]>([]);
  const rows = useMemo(
    () =>
      model.members.filter(
        (member) =>
          (!selected.length || selected.includes(member.status)) &&
          `${member.name} ${member.email} ${member.role} ${member.team}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [model.members, search, selected],
  );
  const columns: ColumnDef<DataGridFeatures, FlowlyMember>[] = [
    {
      id: "member",
      accessorFn: (row) => row.name,
      size: 500,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Member" />,
      cell: ({ row }) => (
        <button
          className="fs-member-identity"
          onClick={() => model.setDialog({ kind: "member", id: row.original.id, mode: "details" })}
        >
          <Avatar className="size-8">
            <AvatarImage src={demoAvatar(row.original.name)} alt="" />
            <AvatarFallback>
              {row.original.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span>
            <span className="fs-member-name">
              {row.original.name}
              <Badge
                variant="outline"
                className={`fs-level fs-level-${row.original.level.toLowerCase()}`}
              >
                {row.original.level}
              </Badge>
            </span>
            <span className="fs-muted">{row.original.email}</span>
          </span>
        </button>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.role,
      size: 290,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <div>
          {row.original.role}
          <p className="fs-muted">{row.original.team}</p>
        </div>
      ),
    },
    {
      id: "activity",
      accessorFn: (row) => row.status,
      size: 205,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Activity" />,
      cell: ({ row }) => (
        <div>
          {row.original.status}
          <p className="fs-muted">{row.original.activity}</p>
        </div>
      ),
    },
    {
      id: "actions",
      size: 44,
      enableSorting: false,
      cell: ({ row }) => (
        <RecordMenu
          label={`Open ${row.original.name} actions`}
          items={[
            {
              label: "View member",
              onSelect: (trigger) =>
                model.setDialog({ kind: "member", id: row.original.id, mode: "details" }, trigger),
            },
            {
              label: "Change access",
              onSelect: (trigger) =>
                model.setDialog({ kind: "member", id: row.original.id, mode: "access" }, trigger),
            },
            {
              label: "Reset session",
              onSelect: () =>
                model.updateMembers(
                  model.members.map((member) =>
                    member.id === row.original.id
                      ? { ...member, activity: "Session reset locally" }
                      : member,
                  ),
                  "Demo member session reset",
                ),
            },
            {
              label: "Remove access",
              separator: true,
              destructive: true,
              disabled: row.original.level === "Owner",
              onSelect: (trigger) =>
                model.setDialog({ kind: "member", id: row.original.id, mode: "access" }, trigger),
            },
          ]}
        />
      ),
    },
  ];
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
      sorting: [{ id: "member", desc: false }],
    },
  });
  return (
    <Frame dense className="fs-frame fs-members-frame">
      <FramePanel className="fs-panel">
        <DataGrid
          table={table}
          recordCount={rows.length}
          tableLayout={{ rowBorder: true, width: "fixed" }}
          tableClassNames={{ base: "fs-member-grid", headerRow: "h-8", bodyRow: "h-14" }}
        >
          <div className="fs-member-toolbar">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search members"
                placeholder="Search members..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" aria-label="Filter members by status">
                  <Filter />
                  Status
                  {selected.length > 0 && <Badge variant="secondary">{selected.length}</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="reui-reference fs-status-filter">
                <p>Filter by status</p>
                {statuses.map((status) => (
                  <div className="fs-status-option" key={status}>
                    <CheckOption
                      id={`settings-member-status-${status.toLowerCase().replaceAll(" ", "-")}`}
                      label={status}
                      checked={selected.includes(status)}
                      onChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? [...current, status]
                            : current.filter((item) => item !== status),
                        )
                      }
                    />
                    <span>{model.members.filter((member) => member.status === status).length}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="outline" onClick={() => model.setDialog({ kind: "invite" })}>
              <UserRoundPlus />
              Invite member
            </Button>
          </div>
          <DataGridContainer className="rounded-none border-0">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <DataGridPagination
            className="fs-grid-footer"
            sizes={[5, 10, 25, 50, 100]}
            info="{from} - {to} of {count}"
          />
        </DataGrid>
      </FramePanel>
    </Frame>
  );
}

function MemberAreas({
  value,
  onChange,
  prefix,
}: {
  value: MemberArea[];
  onChange: (next: MemberArea[]) => void;
  prefix: string;
}) {
  return (
    <fieldset className="fs-fieldset">
      <legend>Areas</legend>
      {areas.map(([area, description]) => (
        <CheckOption
          key={area}
          id={`${prefix}-${area.toLowerCase()}`}
          label={area}
          description={description}
          checked={value.includes(area)}
          onChange={(checked) =>
            onChange(checked ? [...value, area] : value.filter((item) => item !== area))
          }
        />
      ))}
    </fieldset>
  );
}
function AccessLevels({
  value,
  onChange,
  includeOwner = true,
  prefix,
}: {
  value: MemberLevel;
  onChange: (next: MemberLevel) => void;
  includeOwner?: boolean;
  prefix: string;
}) {
  return (
    <fieldset className="fs-fieldset">
      <legend>Level</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as MemberLevel)}
        className="fs-level-options"
      >
        {levels
          .filter((level) => includeOwner || level !== "Owner")
          .map((level) => (
            <div className="fs-radio-option" key={level}>
              <RadioGroupItem id={`${prefix}-${level.toLowerCase()}`} value={level} />
              <div>
                <Label htmlFor={`${prefix}-${level.toLowerCase()}`}>{level}</Label>
                {includeOwner && <p className="fs-hint">{levelDescriptions[level]}</p>}
              </div>
            </div>
          ))}
      </RadioGroup>
      {!includeOwner && <p className="fs-hint">{levelDescriptions[value]}</p>}
    </fieldset>
  );
}

export function FlowlyInviteDrawer({ model }: { model: FlowlySettingsModel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("Platform");
  const [level, setLevel] = useState<MemberLevel>("Editor");
  const [selected, setSelected] = useState<MemberArea[]>(["Workflows", "Agents"]);
  const [message, setMessage] = useState("");
  const seats = Math.max(0, 10 - model.members.length);
  return (
    <SettingsDrawer
      title="Invite Member"
      description="Add someone to Bricklane Labs with the access they need. Local demo; no email will be sent."
      onClose={() => model.setDialog(null)}
      returnFocusRef={model.returnFocusRef}
      footer={
        <>
          <span className="fs-hint">
            Joins as {level}, {seats} of the plan's seats left
          </span>
          <div>
            <Button variant="outline" onClick={() => model.setDialog(null)}>
              Cancel
            </Button>
            <Button type="submit" form="flowly-invite-form" disabled={seats === 0}>
              Send Invite
            </Button>
          </div>
        </>
      }
    >
      <form
        id="flowly-invite-form"
        className="fs-detail-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !email.trim() || !seats) return;
          model.updateMembers(
            [
              ...model.members,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                email: email.trim(),
                role: role.trim() || "Member",
                team,
                level,
                status: "Invited",
                activity: "Invited just now",
                areas: selected,
                inviteMessage: message,
              },
            ],
            "Demo invitation added",
          );
          model.setDialog(null);
        }}
      >
        <fieldset className="fs-fieldset">
          <legend>Person</legend>
          <div className="fs-two-columns">
            <div className="fs-input-field">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                required
                placeholder="Ana Lopez"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="fs-input-field">
              <Label htmlFor="invite-email">Work Email</Label>
              <Input
                id="invite-email"
                required
                type="email"
                placeholder="ana@brick.test"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="fs-input-field">
              <Label htmlFor="invite-role">Role</Label>
              <Input
                id="invite-role"
                placeholder="Automation Engineer"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
            </div>
            <div className="fs-input-field">
              <Label htmlFor="invite-team">Team</Label>
              <SettingsChoice id="invite-team" value={team} options={teams} onChange={setTeam} />
            </div>
          </div>
        </fieldset>
        <section>
          <h3>Access</h3>
          <AccessLevels
            prefix="invite-level"
            includeOwner={false}
            value={level}
            onChange={setLevel}
          />
          <MemberAreas prefix="invite-area" value={selected} onChange={setSelected} />
        </section>
        <fieldset className="fs-fieldset">
          <legend>Message</legend>
          <div className="fs-input-field">
            <Label htmlFor="invite-message">Message</Label>
            <Textarea
              id="invite-message"
              placeholder="Welcome aboard. Start with the Lead Enrichment workflow."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="fs-hint">Added to the local invitation draft.</p>
          </div>
        </fieldset>
      </form>
    </SettingsDrawer>
  );
}

export function FlowlyMemberDrawer({
  model,
  id,
  mode,
}: {
  model: FlowlySettingsModel;
  id: string;
  mode: "details" | "access";
}) {
  const member = model.members.find((item) => item.id === id);
  const [draft, setDraft] = useState(() => (member ? structuredClone(member) : null));
  const [tab, setTab] = useState("details");
  const [remove, setRemove] = useState(false);
  if (!member || !draft) return null;
  const dirty = JSON.stringify(member) !== JSON.stringify(draft);
  const index = model.members.findIndex((item) => item.id === id);
  const header = (
    <div className="fs-record-heading">
      <span>{member.email}</span>
      {mode === "details" && (
        <div>
          <span>
            {index + 1} of {model.members.length}
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Previous member"
            disabled={index === 0}
            onClick={() =>
              model.setDialog({ kind: "member", id: model.members[index - 1].id, mode })
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Next member"
            disabled={index === model.members.length - 1}
            onClick={() =>
              model.setDialog({ kind: "member", id: model.members[index + 1].id, mode })
            }
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
  function save() {
    if (!draft) return;
    model.updateMembers(
      model.members.map((item) => (item.id === id ? draft : item)),
      "Demo member access updated",
    );
    model.setDialog({ kind: "member", id, mode: "details" });
  }
  return (
    <SettingsDrawer
      title={member.name}
      description={`${member.role} · ${member.team} · ${member.activity}`}
      header={header}
      returnFocusRef={model.returnFocusRef}
      onClose={() => model.setDialog(null)}
      footer={
        mode === "access" ? (
          <>
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={member.level === "Owner"}
              onClick={() => setRemove(true)}
            >
              Remove Access
            </Button>
            <div>
              <Button
                variant="outline"
                onClick={() => model.setDialog({ kind: "member", id, mode: "details" })}
              >
                Cancel
              </Button>
              <Button disabled={!dirty} onClick={save}>
                Save Access
              </Button>
            </div>
          </>
        ) : undefined
      }
    >
      <Badge variant="outline" className={`fs-level fs-level-${member.level.toLowerCase()}`}>
        {member.level}
      </Badge>
      {remove ? (
        <section className="fs-confirmation">
          <h3>Remove {member.name}'s access?</h3>
          <p className="fs-hint">
            This removes only the local demo member. No external account will be changed.
          </p>
          <div>
            <Button variant="outline" onClick={() => setRemove(false)}>
              Keep member
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                model.updateMembers(
                  model.members.filter((item) => item.id !== id),
                  "Demo member removed",
                );
                model.setDialog(null);
              }}
            >
              Remove Access
            </Button>
          </div>
        </section>
      ) : mode === "access" ? (
        <div className="fs-detail-form">
          <AccessLevels
            prefix="member-access"
            value={draft.level}
            onChange={(level) => setDraft({ ...draft, level })}
          />
          <MemberAreas
            prefix="member-area"
            value={draft.areas}
            onChange={(areas) => setDraft({ ...draft, areas })}
          />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="fs-detail-tabs">
          <TabsList variant="line">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            {member.status === "Needs review" && (
              <section className="fs-notice">
                <h3>Access review due</h3>
                <p className="fs-hint">
                  {member.name.split(" ")[0]}'s access has not been reviewed in 90 days. Confirm it
                  or change it.
                </p>
              </section>
            )}
            <h3>Member</h3>
            <DetailFacts
              items={[
                ["Email", member.email],
                ["Role", member.role],
                ["Team", member.team],
              ]}
            />
            <h3>Activity</h3>
            <DetailFacts
              items={[
                ["Status", member.status],
                ["Last active", member.activity],
              ]}
            />
            <div className="fs-button-row">
              <Button
                variant="outline"
                onClick={() =>
                  model.updateMembers(
                    model.members.map((item) =>
                      item.id === id ? { ...item, activity: "Session reset locally" } : item,
                    ),
                    "Demo member session reset",
                  )
                }
              >
                Reset Session
              </Button>
              <Button onClick={() => model.setDialog({ kind: "member", id, mode: "access" })}>
                Change Access
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="access">
            <DetailFacts
              items={[
                ["Level", member.level],
                ["Areas", member.areas.join(", ")],
              ]}
            />
            <Button
              variant="outline"
              onClick={() => model.setDialog({ kind: "member", id, mode: "access" })}
            >
              Change Access
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </SettingsDrawer>
  );
}
