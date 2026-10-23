import { useState } from "react";
import { Building2, Info } from "lucide-react";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceDialog, WorkspaceStage } from "./support";

const initialRoles = [
  { name: "Owner", members: true, edit: true },
  { name: "Editor", members: false, edit: true },
  { name: "Reviewer", members: false, edit: false },
];

export default function OrganizationsEmpty() {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [organization, setOrganization] = useState<{ name: string; slug: string } | null>(null);
  const [roles, setRoles] = useState(initialRoles);

  return (
    <WorkspaceStage id={14}>
      <section className="empty-workspace-org-page" aria-label="Organizations">
        <header className="empty-workspace-header">
          <h1>Organizations</h1>
        </header>
        <Separator />
        <Frame aria-label="Organizations setup">
          <FramePanel className="empty-workspace-org-panel">
            {organization ? (
              <div className="empty-workspace-permissions">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2>{organization.name}</h2>
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      Organization ID: {organization.slug}
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled locally</Badge>
                </div>
                <div className="empty-workspace-results-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Manage members</TableHead>
                        <TableHead className="text-center">Edit content</TableHead>
                        <TableHead className="text-center">View content</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.name}>
                          <TableCell>{role.name}</TableCell>
                          {(["members", "edit"] as const).map((permission) => (
                            <TableCell className="text-center" key={permission}>
                              <Checkbox
                                aria-label={`${role.name} ${permission === "members" ? "manage members" : "edit content"}`}
                                disabled={role.name === "Owner"}
                                checked={role[permission]}
                                onCheckedChange={(checked) =>
                                  setRoles((current) =>
                                    current.map((entry) =>
                                      entry.name === role.name
                                        ? { ...entry, [permission]: !!checked }
                                        : entry,
                                    ),
                                  )
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                            <Checkbox checked disabled aria-label={`${role.name} view content`} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  These local permissions are illustrative. No organization was created in a backend
                  and no access was granted.
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    setOrganization(null);
                    setRoles(initialRoles);
                  }}
                >
                  Disable local organizations
                </Button>
              </div>
            ) : (
              <Empty className="empty-workspace-org-empty">
                <EmptyHeader>
                  <EmptyMedia>
                    <IconStack>
                      <Building2 className="size-7" strokeWidth={1.5} />
                    </IconStack>
                  </EmptyMedia>
                  <EmptyTitle>Enable organizations</EmptyTitle>
                  <EmptyDescription>
                    Enable your users to create organizations, manage team members, and control
                    access with role-based permissions.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setOpen(true)}>Enable organizations</Button>
                </EmptyContent>
              </Empty>
            )}
          </FramePanel>
          <FrameFooter className="empty-workspace-org-footer">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    className="text-muted-foreground"
                    onClick={() => setHelp(true)}
                  >
                    <Info className="size-3.5" />
                    Learn more about <span className="text-foreground">Organizations</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Organizations group users, teams, roles, and permissions under one account
                  boundary.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FrameFooter>
        </Frame>
      </section>
      <WorkspaceDialog
        title="Enable organizations"
        description="Create a local organization preview. This does not enable a feature or grant access in an external account."
        open={open}
        onOpenChange={setOpen}
      >
        <form
          className="empty-workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !slug.trim()) return;
            setOrganization({ name: name.trim(), slug: slug.trim() });
            setOpen(false);
          }}
        >
          <label>
            Organization name
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 48),
                );
              }}
              placeholder="Harbor workspace"
            />
          </label>
          <label>
            Organization ID
            <Input
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={48}
              placeholder="harbor-workspace"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use lowercase letters, numbers and hyphens for the local identifier.
          </p>
          <Button type="submit">Enable locally</Button>
        </form>
      </WorkspaceDialog>
      <WorkspaceDialog
        title="About Organizations"
        description="A local preview of grouping people and permissions."
        open={help}
        onOpenChange={setHelp}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Organizations group users, teams, roles, and permissions under one account boundary. In a
          connected application, your backend must enforce membership and role rules.
        </p>
        <p className="text-sm leading-relaxed">
          Use the setup form to inspect a local role matrix. The preview never creates an account,
          sends an invitation or changes real permissions.
        </p>
      </WorkspaceDialog>
    </WorkspaceStage>
  );
}
