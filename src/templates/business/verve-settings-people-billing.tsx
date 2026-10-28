import { useEffect, useMemo } from "react";
import {
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  FileText,
  Info,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { useDomainGrid, type DomainColumn } from "@/blocks/data/grid-advanced-model-grid";
import {
  SettingsRow,
  SettingsChoice,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Sheet, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import {
  VerveSettingsSheet,
  VerveCompanyCard,
  VerveSaveIcon,
} from "./verve-settings-people-billing-surfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  verveBillingInvoices,
  verveBillingPlan,
  verveBillingRegions,
  verveMemberAuthentication,
  verveMemberBilling,
  verveMemberDate,
  verveInvoiceDate,
  verveMemberRoles,
  verveMoney,
  type VerveBillingInvoice,
  type VerveSettingsMember,
} from "./verve-settings-people-billing-data";
import type { VervePeopleBillingModel } from "./verve-settings-people-billing-model";
import "@/blocks/reference.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";
import "./verve-settings-people-billing.css";

function MemberIdentity({ member }: { member: VerveSettingsMember }) {
  return (
    <div className="vp-member-identity">
      <Avatar className="size-8">
        <AvatarFallback>
          {member.name
            .split(" ")
            .map((word) => word[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      <span>
        <strong>{member.name}</strong>
        <small>{member.username}</small>
      </span>
    </div>
  );
}
function MemberAction({
  member,
  kind,
}: {
  member: VerveSettingsMember;
  kind: "view" | "edit" | "delete";
}) {
  const Icon = kind === "view" ? Eye : kind === "edit" ? Pencil : Trash2;
  const label = kind === "view" ? "View" : kind === "edit" ? "Edit" : "Delete";
  function action() {
    if (kind === "view")
      toast("Open member", { description: `Review ${member.name}'s profile and recent activity.` });
    else if (kind === "edit")
      toast("Edit member", {
        description: `Open the access and profile editor for ${member.name}.`,
      });
    else
      toast("Delete member", {
        description: "Member removal is not connected in this local preview.",
      });
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`${label} ${member.name}`}
      onClick={action}
    >
      <Icon aria-hidden />
    </Button>
  );
}
function InviteMembers({ model }: { model: VervePeopleBillingModel }) {
  const formId = "verve-invite-members";
  return (
    <Sheet open={model.inviteOpen} onOpenChange={model.setInviteOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm">
          Add member
        </Button>
      </SheetTrigger>
      <VerveSettingsSheet
        className="vp-invite-sheet"
        title="Add member"
        description="Invite teammates by email and set their role."
        footer={
          <>
            <SheetClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" form={formId}>
              Send invites
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            model.sendInvites();
          }}
        >
          <SettingsRow
            id="verve-invite-email"
            title="Email addresses"
            invalid={Boolean(model.inviteError)}
          >
            <Combobox
              multiple
              items={model.inviteEmails}
              value={model.inviteEmails}
              onValueChange={model.setInviteEmails}
              inputValue={model.inviteInput}
              onInputValueChange={model.setInviteInput}
              open={false}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(emails: string[]) => (
                    <>
                      {emails.map((email) => (
                        <ComboboxChip key={email}>{email}</ComboboxChip>
                      ))}
                    </>
                  )}
                </ComboboxValue>
                <ComboboxChipsInput
                  id="verve-invite-email"
                  aria-describedby={`verve-invite-email-description${model.inviteError ? " verve-invite-error" : ""}`}
                  aria-invalid={Boolean(model.inviteError)}
                  placeholder="name@bricklane.example"
                  onKeyDown={(event) => {
                    if (
                      !event.nativeEvent.isComposing &&
                      (event.key === "Enter" || event.key === ",") &&
                      model.inviteInput.trim()
                    ) {
                      event.preventDefault();
                      model.addInviteToken();
                    }
                  }}
                />
              </ComboboxChips>
            </Combobox>
            <FieldDescription id="verve-invite-email-description">
              Press Enter or comma to add each address.
            </FieldDescription>
            {model.inviteError && (
              <FieldError id="verve-invite-error">{model.inviteError}</FieldError>
            )}
          </SettingsRow>
          <SettingsRow id="verve-invite-role" title="Role">
            <SettingsChoice
              id="verve-invite-role"
              value={model.inviteRole}
              options={verveMemberRoles}
              onChange={(role) => model.setInviteRole(role as typeof model.inviteRole)}
            />
          </SettingsRow>
          <SettingsRow id="verve-invite-authentication" title="Authentication method">
            <SettingsChoice
              id="verve-invite-authentication"
              value={model.inviteAuthentication}
              options={verveMemberAuthentication}
              onChange={(auth) =>
                model.setInviteAuthentication(auth as typeof model.inviteAuthentication)
              }
            />
          </SettingsRow>
          <SettingsRow
            id="verve-invite-send-email"
            className="vp-switch-row"
            title="Send invite email"
            description="Email each person a join link."
          >
            <Switch
              id="verve-invite-send-email"
              checked={model.inviteSendEmail}
              onCheckedChange={model.setInviteSendEmail}
              aria-describedby="verve-invite-send-email-description"
            />
          </SettingsRow>
          <p className="vp-invite-summary">
            Invited as {model.inviteRole} using {model.inviteAuthentication}.
          </p>
        </form>
      </VerveSettingsSheet>
    </Sheet>
  );
}

function MemberFilters({ model }: { model: VervePeopleBillingModel }) {
  const groups = [
    {
      id: "role",
      label: "Role",
      options: verveMemberRoles,
      value: model.roles,
      change: model.setRoles,
    },
    {
      id: "billing",
      label: "Billing",
      options: verveMemberBilling,
      value: model.billingStatuses,
      change: model.setBillingStatuses,
    },
    {
      id: "authentication",
      label: "Auth",
      options: verveMemberAuthentication,
      value: model.authentication,
      change: model.setAuthentication,
    },
  ];
  const count = model.roles.length + model.billingStatuses.length + model.authentication.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" aria-label="Filter members">
          Filters{count > 0 && <Badge variant="secondary">{count}</Badge>}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="vp-team-filter reui-reference">
        <Tabs defaultValue="role">
          <TabsList aria-label="Member filter groups">
            {groups.map((group) => (
              <TabsTrigger key={group.id} value={group.id}>
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((group) => (
            <TabsContent key={group.id} value={group.id}>
              <DropdownMenuGroup>
                {group.options.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={group.value.includes(value)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) =>
                      group.change(
                        checked
                          ? [...group.value, value]
                          : group.value.filter((item) => item !== value),
                      )
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </TabsContent>
          ))}
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VerveTeamSettings({ model }: { model: VervePeopleBillingModel }) {
  const { setInviteOpen } = model;
  useEffect(() => () => setInviteOpen(false), [setInviteOpen]);
  const columns: DomainColumn<VerveSettingsMember>[] = [
    {
      id: "member",
      accessorKey: "name",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Member" />,
      size: 280,
      cell: ({ row }) => (
        <div className="vp-member-cell">
          <MemberIdentity member={row.original} />
          <div className="vp-member-actions">
            <MemberAction kind="view" member={row.original} />
            <MemberAction kind="edit" member={row.original} />
            <MemberAction kind="delete" member={row.original} />
          </div>
        </div>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      size: 250,
      cell: ({ row }) => <a href={`mailto:${row.original.email}`}>{row.original.email}</a>,
    },
    {
      id: "role",
      accessorKey: "role",
      header: "Role",
      filterFn: (row, id, values: string[]) => values.includes(String(row.getValue(id))),
      size: 134,
      cell: ({ row }) => <span className="vp-role">{row.original.role}</span>,
    },
    {
      id: "billing",
      accessorKey: "billing",
      header: "Billing status",
      filterFn: (row, id, values: string[]) => values.includes(String(row.getValue(id))),
      size: 170,
      cell: ({ row }) => (
        <span className="vp-member-billing">
          <i aria-hidden data-status={row.original.billing} />
          {row.original.billing}
        </span>
      ),
    },
    {
      id: "authentication",
      accessorKey: "authentication",
      header: "Authentication",
      filterFn: (row, id, values: string[]) => values.includes(String(row.getValue(id))),
      size: 145,
    },
    {
      id: "joined",
      accessorKey: "joined",
      header: "Joining date",
      size: 140,
      cell: ({ row }) => <span className="vp-muted">{verveMemberDate(row.original.joined)}</span>,
    },
  ];
  const filters = useMemo(
    () =>
      [
        { id: "role", value: model.roles },
        { id: "billing", value: model.billingStatuses },
        { id: "authentication", value: model.authentication },
      ].filter((filter) => filter.value.length),
    [model.roles, model.billingStatuses, model.authentication],
  );
  // Native column filters, search, sorting and pagination consume the controlled domain state.
  const table = useDomainGrid({
    data: model.members,
    columns,
    search: model.search,
    filters,
    sorting: model.sorting,
    onSortingChange: model.setSorting,
    pagination: model.pagination,
    onPaginationChange: model.setPagination,
    getRowId: (member) => member.id,
    globalFilterFn: (member, search) =>
      `${member.name} ${member.username} ${member.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  });
  return (
    <section className="vp-settings vp-team reui-reference" aria-label="Team members">
      <h1 className="sr-only">Team members</h1>
      <DataGrid
        table={table}
        recordCount={table.getFilteredRowModel().rows.length}
        tableLayout={{
          dense: true,
          rowBorder: true,
          headerBorder: true,
          headerBackground: false,
          width: "auto",
        }}
        tableClassNames={{
          base: "vp-members-table",
          headerRow: "vp-members-header",
          bodyRow: "vp-members-row",
        }}
        emptyMessage="No members match your search."
      >
        <Frame className="vp-team-frame">
          <FramePanel className="vp-team-panel">
            <FrameHeader className="vp-team-toolbar">
              <div className="vp-team-title">
                <FrameTitle>
                  <h2>Members</h2>
                </FrameTitle>
                <Badge variant="outline">{model.members.length}</Badge>
              </div>
              <div className="vp-team-controls">
                <InputGroup className="vp-team-search">
                  <InputGroupAddon>
                    <Search aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Search members"
                    placeholder="Search..."
                    value={model.search}
                    onChange={(event) => model.setSearch(event.target.value)}
                  />
                </InputGroup>
                <MemberFilters model={model} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast("Import members", {
                      description:
                        "Connect this button to your CSV import, directory sync, or SCIM provisioning flow.",
                    })
                  }
                >
                  Import
                </Button>
                <InviteMembers model={model} />
              </div>
            </FrameHeader>
            <DataGridContainer className="vp-grid-container">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <DataGridPagination
              sizes={[5, 10, 20, 50]}
              info="{from} - {to} of {count} members"
              previousPageLabel="Go to previous page"
              nextPageLabel="Go to next page"
              className="vp-team-pagination"
            />
          </FramePanel>
        </Frame>
      </DataGrid>
    </section>
  );
}

function InfoLabel({ title, description }: { title: string; description: string }) {
  return (
    <span className="vp-info-label">
      {title}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" size="icon-xs" variant="ghost" aria-label={`${title} details`}>
              <Info aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="reui-reference">{description}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
function EditBilling({ model }: { model: VervePeopleBillingModel }) {
  const formId = "verve-edit-billing";
  return (
    <Sheet open={model.billingOpen} onOpenChange={model.setBillingOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil aria-hidden />
          Edit details
        </Button>
      </SheetTrigger>
      <VerveSettingsSheet
        className="vp-billing-edit"
        title="Edit billing details"
        description="Update your invoice contact and payment method."
        footer={
          <>
            <SheetClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" form={formId}>
              <VerveSaveIcon />
              Save changes
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            model.saveBilling();
          }}
        >
          {[
            {
              id: "contact" as const,
              title: "Billing contact",
              description: "Receives invoices and renewal notices.",
              placeholder: "finance@company.com",
              type: "email",
            },
            {
              id: "legalEntity" as const,
              title: "Legal entity",
              description: "Shown on invoices and receipts.",
              placeholder: "Company legal name",
              type: "text",
            },
          ].map((field) => (
            <SettingsRow
              key={field.id}
              id={`verve-billing-${field.id}`}
              title={field.title}
              description={field.description}
              invalid={Boolean(model.billingErrors[field.id])}
            >
              <Input
                id={`verve-billing-${field.id}`}
                type={field.type}
                placeholder={field.placeholder}
                value={model.billingDraft[field.id]}
                onChange={(event) => model.updateBilling(field.id, event.target.value)}
                aria-invalid={Boolean(model.billingErrors[field.id])}
                aria-describedby={`verve-billing-${field.id}-description${model.billingErrors[field.id] ? ` verve-billing-${field.id}-error` : ""}`}
              />
              {model.billingErrors[field.id] && (
                <FieldError id={`verve-billing-${field.id}-error`}>
                  {model.billingErrors[field.id]}
                </FieldError>
              )}
            </SettingsRow>
          ))}
          <SettingsRow
            id="verve-billing-region"
            title="Region"
            description="Used for tax and invoice formatting."
            invalid={Boolean(model.billingErrors.region)}
          >
            <SettingsChoice
              id="verve-billing-region"
              value={model.billingDraft.region}
              options={verveBillingRegions}
              onChange={(value) => model.updateBilling("region", value)}
              invalid={Boolean(model.billingErrors.region)}
              describedBy={`verve-billing-region-description${model.billingErrors.region ? " verve-billing-region-error" : ""}`}
            />
            {model.billingErrors.region && (
              <FieldError id="verve-billing-region-error">{model.billingErrors.region}</FieldError>
            )}
          </SettingsRow>
          <SettingsRow
            title={
              <>
                Payment method{" "}
                <Badge
                  variant={
                    model.renewalReady
                      ? "success-light"
                      : model.companyCard
                        ? "secondary"
                        : "warning-light"
                  }
                >
                  {model.renewalReady ? "Ready" : model.companyCard ? "Saved" : "Action required"}
                </Badge>
              </>
            }
            description={
              model.companyCard ? `Card ending ${model.companyCard.last4}` : "No company card added"
            }
            className="vp-payment-readiness"
          >
            <VerveCompanyCard model={model} entry="details">
              <Button type="button" size="sm">
                {model.companyCard ? "Update card" : "Add card"}
              </Button>
            </VerveCompanyCard>
          </SettingsRow>
        </form>
      </VerveSettingsSheet>
    </Sheet>
  );
}
export function VerveBillingSettings({ model }: { model: VervePeopleBillingModel }) {
  const { closeCard, closeBilling } = model;
  useEffect(
    () => () => {
      closeCard();
      closeBilling();
    },
    [closeCard, closeBilling],
  );
  const plan = verveBillingPlan;
  const renewal = verveInvoiceDate(plan.renewal);
  const columns: DomainColumn<VerveBillingInvoice>[] = [
    { id: "invoice", accessorKey: "id", header: () => "Invoice", enableSorting: false, size: 210 },
    {
      id: "period",
      accessorKey: "period",
      header: () => "Period",
      enableSorting: false,
      size: 200,
    },
    {
      id: "date",
      accessorKey: "issued",
      header: () => "Date",
      enableSorting: false,
      size: 210,
      cell: ({ row }) => verveInvoiceDate(row.original.issued),
    },
    {
      id: "total",
      accessorKey: "amount",
      header: () => "Total",
      enableSorting: false,
      size: 170,
      cell: ({ row }) => verveMoney(row.original.amount),
    },
    {
      id: "status",
      accessorKey: "status",
      header: () => "Status",
      enableSorting: false,
      size: 170,
      cell: ({ row }) => (
        <Badge variant={row.original.status === "Paid" ? "success-light" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "download",
      header: () => "Download",
      enableSorting: false,
      size: 100,
      cell: ({ row }) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Download ${row.original.id}`}
          onClick={() => model.downloadInvoice(row.original)}
        >
          <Download aria-hidden />
        </Button>
      ),
    },
  ];
  const table = useDomainGrid({
    data: [...verveBillingInvoices],
    columns,
    getRowId: (invoice) => invoice.id,
  });
  return (
    <div className="vp-settings vp-billing reui-reference">
      <h1 className="sr-only">Billing</h1>
      <Alert variant={model.renewalReady ? "success" : "destructive"} className="vp-renewal-alert">
        <ShieldAlert aria-hidden />
        <AlertTitle>
          {model.renewalReady ? "Company card is ready." : "Renewal is blocked."}
        </AlertTitle>
        <AlertDescription>
          {model.renewalReady
            ? `Demo card ending ${model.companyCard?.last4} is set as the default for this local workspace.`
            : model.companyCard
              ? "Set a demo card as the default payment method before this local subscription renews."
              : `No company card is saved. Add one before ${renewal} so renewal, seat changes, and receipt delivery can continue normally.`}
        </AlertDescription>
        <AlertAction>
          <VerveCompanyCard model={model} entry="alert">
            <Button size="sm">
              {model.companyCard ? "Update company card" : "Add company card"}
            </Button>
          </VerveCompanyCard>
        </AlertAction>
      </Alert>
      <div className="vp-section-heading">
        <div>
          <h2>Plan</h2>
          <p>Current subscription and core usage.</p>
        </div>
      </div>
      <Frame className="vp-billing-card">
        <FramePanel className="vp-plan-panel">
          <div className="vp-plan-copy">
            <IconTile variant="frame">
              <CreditCard aria-hidden />
            </IconTile>
            <div>
              <strong>
                {plan.name} <Badge variant="warning-light">Trial</Badge>
              </strong>
              <p>
                <span>{verveMoney(plan.unitPrice)}</span> per seat / month
              </p>
              <p>
                Growth keeps deal history, pipeline automations, and workspace permissions on one
                monthly plan.
              </p>
            </div>
          </div>
          <dl>
            {[
              ["Renewal date", renewal],
              ["Renewal status", model.renewalReady ? "Ready" : "Card required"],
              ["Billing owner", plan.owner],
            ].map(([title, value]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </FramePanel>
        <FrameFooter className="vp-billing-footer">
          <p>
            {model.companyCard
              ? "A demo company card is available for this local subscription."
              : "Renewal stays paused until a company card is added."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast("Manage plan", { description: "Change or cancel your Verve subscription." })
            }
          >
            Manage plan
          </Button>
        </FrameFooter>
      </Frame>
      <Frame className="vp-billing-card">
        <FramePanel className="vp-usage-panel">
          {[
            ["Seats", "Active reps", `${model.members.length} of ${plan.seats}`, Users],
            [
              "Tracked contacts",
              "Used this month",
              plan.contacts.toLocaleString("en-US"),
              FileText,
            ],
            [
              "Automation credits",
              "Used this month",
              plan.credits.toLocaleString("en-US"),
              CircleDollarSign,
            ],
          ].map(([title, description, value, Icon]) => {
            const UsageIcon = Icon as typeof Users;
            return (
              <div key={String(title)}>
                <div className="vp-usage-heading">
                  <IconTile variant="frame">
                    <UsageIcon aria-hidden />
                  </IconTile>
                  <span>
                    <strong>{String(title)}</strong>
                    <small>{String(description)}</small>
                  </span>
                </div>
                <b>{String(value)}</b>
              </div>
            );
          })}
        </FramePanel>
        <FrameFooter className="vp-billing-footer">
          <p>Usage counters reset on {renewal} with the next billing cycle.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast("Usage", { description: "Current workspace usage is shown above." })
            }
          >
            View usage
          </Button>
        </FrameFooter>
      </Frame>
      <div className="vp-section-heading">
        <div>
          <h2>Billing Details</h2>
          <p>Invoice contact and payment readiness.</p>
        </div>
        <EditBilling model={model} />
      </div>
      <Frame className="vp-billing-card">
        <FramePanel className="vp-billing-rows">
          <SettingsRow
            title={
              <InfoLabel
                title="Billing contact"
                description="Receives invoices and renewal notices."
              />
            }
            description="Receives invoices and renewal notices."
          >
            <span>{model.billing.contact}</span>
          </SettingsRow>
          <SettingsRow title="Legal entity" description="Shown on invoices and receipts.">
            <span>{model.billing.legalEntity}</span>
          </SettingsRow>
          <SettingsRow
            title={<InfoLabel title="Region" description="Used for tax and invoice formatting." />}
            description="Used for tax and invoice formatting."
          >
            <span>{model.billing.region}</span>
          </SettingsRow>
          <SettingsRow
            title={
              <>
                <InfoLabel title="Payment method" description="Required before the trial renews." />
                <Badge
                  variant={
                    model.renewalReady
                      ? "success-light"
                      : model.companyCard
                        ? "secondary"
                        : "warning-light"
                  }
                >
                  {model.renewalReady ? "Ready" : model.companyCard ? "Saved" : "Action required"}
                </Badge>
              </>
            }
            description="Required before the trial renews."
          >
            <span>
              {model.companyCard
                ? `Card ending ${model.companyCard.last4}`
                : "No company card added"}
            </span>
          </SettingsRow>
        </FramePanel>
      </Frame>
      <div className="vp-section-heading">
        <div>
          <h2>Invoice History</h2>
          <p>Recent invoices.</p>
        </div>
        <Button variant="outline" size="sm" onClick={model.downloadAllInvoices}>
          Download all
        </Button>
      </div>
      <Frame className="vp-billing-card">
        <FramePanel className="vp-invoices-panel">
          <DataGrid
            table={table}
            recordCount={verveBillingInvoices.length}
            tableLayout={{ dense: true, rowBorder: true, headerBorder: true, width: "auto" }}
            tableClassNames={{ base: "vp-invoices-table" }}
          >
            <DataGridContainer className="vp-grid-container">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </DataGrid>
        </FramePanel>
      </Frame>
    </div>
  );
}
