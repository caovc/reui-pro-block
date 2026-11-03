// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt (included in project exports).
import { useMemo, useState } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  Check,
  Copy,
  RefreshCw,
  Send,
  UserRoundMinus,
  Crown,
  Eye,
  Filter,
  Pencil,
  Search,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "./free/flowly-radio-group";
import { ToggleGroup, ToggleGroupItem } from "./free/flowly-toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  SettingsChoice,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { demoAvatar } from "@/lib/demo-artwork";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
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
  context,
}: {
  value: MemberArea[];
  onChange: (next: MemberArea[]) => void;
  prefix: string;
  context: "invite" | "access";
}) {
  return (
    <FieldSet
      className={`fs-fieldset fs-member-areas fs-member-areas-${context}`}
      aria-describedby={context === "access" ? `${prefix}-description` : undefined}
    >
      <FieldLegend variant="label">Areas</FieldLegend>
      {context === "access" && (
        <FieldDescription id={`${prefix}-description`} className="text-xs">
          The parts of Bricklane this member can open.
        </FieldDescription>
      )}
      <FieldGroup className="fs-member-area-options">
        {areas.map(([area, description]) => {
          const id = `${prefix}-${area.toLowerCase()}`;
          const checked = value.includes(area);
          const change = (next: boolean) =>
            onChange(next ? [...value, area] : value.filter((item) => item !== area));
          return context === "invite" ? (
            <SettingsRow
              key={area}
              id={id}
              title={area}
              description={description}
              className="fs-invite-area-row"
            >
              <Switch
                id={id}
                size="sm"
                checked={checked}
                onCheckedChange={change}
                aria-describedby={`${id}-description`}
              />
            </SettingsRow>
          ) : (
            <CheckOption
              key={area}
              id={id}
              label={area}
              description={description}
              checked={checked}
              onChange={change}
            />
          );
        })}
      </FieldGroup>
    </FieldSet>
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
  if (!includeOwner) {
    return (
      <Field data-reui-example="c-toggle-group-5" className="fs-invite-level">
        <FieldLabel id={`${prefix}-label`}>Level</FieldLabel>
        <ToggleGroup
          value={[value]}
          onValueChange={(next) => {
            const selected = next[0];
            if (selected === "Admin" || selected === "Editor" || selected === "Viewer") {
              onChange(selected);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
          aria-labelledby={`${prefix}-label`}
          aria-describedby={`${prefix}-description`}
        >
          {levels
            .filter((level) => level !== "Owner")
            .map((level) => (
              <ToggleGroupItem key={level} value={level} className="flex-1">
                {level}
              </ToggleGroupItem>
            ))}
        </ToggleGroup>
        <FieldDescription id={`${prefix}-description`}>{levelDescriptions[value]}</FieldDescription>
      </Field>
    );
  }

  const icons = { Owner: Crown, Admin: ShieldCheck, Editor: Pencil, Viewer: Eye };
  return (
    <FieldSet className="fs-fieldset fs-access-level" data-reui-example="c-radio-group-7">
      <FieldLegend variant="label">Level</FieldLegend>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          if (levels.includes(next as MemberLevel)) onChange(next as MemberLevel);
        }}
        aria-label="Access level"
        className="sm:grid-cols-2"
      >
        {levels.map((level) => {
          const id = `${prefix}-${level.toLowerCase()}`;
          const Icon = icons[level];
          return (
            <FieldLabel key={level} id={`${id}-label`} htmlFor={id} className="cursor-pointer">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                    {level}
                  </FieldTitle>
                  <FieldDescription className="text-xs">
                    {levelDescriptions[level]}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem id={id} value={level} aria-labelledby={`${id}-label`} />
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </FieldSet>
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
      headerVariant="invite"
      footerVariant="invite"
      description="Add someone to Bricklane Labs. Demo only; no email is sent."
      onClose={() => model.setDialog(null)}
      returnFocusRef={model.returnFocusRef}
      footer={
        <>
          <p className="fs-invite-footer-caption">
            Joins as {level}, {seats} of the plan's seats left
          </p>
          <Button variant="outline" onClick={() => model.setDialog(null)}>
            Cancel
          </Button>
          <Button type="submit" form="flowly-invite-form" disabled={seats === 0}>
            <Send aria-hidden="true" />
            Send Invite
          </Button>
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
        <FieldSet className="fs-fieldset">
          <FieldLegend variant="label">Person</FieldLegend>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 min-[360px]:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invite-name">Name</FieldLabel>
                <Input
                  id="invite-name"
                  required
                  placeholder="Ana Lopez"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-email">Work Email</FieldLabel>
                <Input
                  id="invite-email"
                  required
                  type="email"
                  placeholder="ana@brick.test"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 min-[360px]:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <Input
                  id="invite-role"
                  placeholder="Automation Engineer"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-team">Team</FieldLabel>
                <SettingsChoice id="invite-team" value={team} options={teams} onChange={setTeam} />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>
        <FieldSet className="fs-fieldset">
          <FieldLegend variant="label">Access</FieldLegend>
          <AccessLevels
            prefix="invite-level"
            includeOwner={false}
            value={level}
            onChange={setLevel}
          />
        </FieldSet>
        <MemberAreas
          context="invite"
          prefix="invite-area"
          value={selected}
          onChange={setSelected}
        />
        <FieldSet className="fs-fieldset">
          <FieldLegend variant="label">Message</FieldLegend>
          <Field>
            <FieldLabel htmlFor="invite-message" className="sr-only">
              Message
            </FieldLabel>
            <Textarea
              id="invite-message"
              placeholder="Welcome aboard. Start with the Lead Enrichment workflow."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <FieldDescription>Added to the local invitation draft.</FieldDescription>
          </Field>
        </FieldSet>
      </form>
    </SettingsDrawer>
  );
}

function MemberEmailCopy({ email }: { email: string }) {
  // Actual official free useCopyToClipboard / c-button-41 feedback composition.
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isCopied ? "email copied" : "Copy email"}
      onClick={() => {
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.clipboard?.writeText === "function"
        ) {
          copyToClipboard(email);
        }
      }}
    >
      {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
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
      <span className="fs-member-email-line">
        <span>{member.email}</span>
        <MemberEmailCopy key={member.id} email={member.email} />
      </span>
      {mode === "details" && (
        <div className="fs-member-record-nav">
          <span>
            {index + 1} of {model.members.length}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous member"
            disabled={index === 0}
            onClick={() =>
              model.setDialog({ kind: "member", id: model.members[index - 1].id, mode })
            }
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next member"
            disabled={index === model.members.length - 1}
            onClick={() =>
              model.setDialog({ kind: "member", id: model.members[index + 1].id, mode })
            }
          >
            <ChevronDown aria-hidden="true" />
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
      headerVariant="member"
      footerVariant="member"
      headerIdentity={{
        leading: (
          <Avatar className="size-9">
            <AvatarImage src={demoAvatar(member.name)} alt={member.name} />
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        ),
        titleAccessory: (
          <Badge variant="outline" className="rounded-sm px-1.25">
            {member.level}
          </Badge>
        ),
      }}
      description={`${member.role} · ${member.team} · ${member.activity}`}
      header={header}
      returnFocusRef={model.returnFocusRef}
      onClose={() => model.setDialog(null)}
      footer={
        mode === "access" ? (
          <>
            <Button
              variant="destructive"
              disabled={member.level === "Owner"}
              onClick={() => setRemove(true)}
            >
              <UserRoundMinus aria-hidden="true" />
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
                <Check aria-hidden="true" />
                Save Access
              </Button>
            </div>
          </>
        ) : (
          <>
            {tab === "details" && (
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
                <RefreshCw aria-hidden="true" />
                Reset Session
              </Button>
            )}
            <Button onClick={() => model.setDialog({ kind: "member", id, mode: "access" })}>
              <ShieldCheck aria-hidden="true" />
              Change Access
            </Button>
          </>
        )
      }
    >
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
            context="access"
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
          </TabsContent>
          <TabsContent value="access">
            <DetailFacts
              items={[
                ["Level", member.level],
                ["Areas", member.areas.join(", ")],
              ]}
            />
          </TabsContent>
        </Tabs>
      )}
    </SettingsDrawer>
  );
}
