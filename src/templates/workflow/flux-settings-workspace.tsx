import type { ComponentType, ReactNode } from "react";
import { Bot, FileText, Layers, LockKeyhole, Settings2, Shield, Timer, Users } from "lucide-react";
import { toast } from "sonner";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { demoAvatar } from "@/lib/demo-artwork";
import { fluxOperators, type FluxSettingsModel } from "./flux-settings-model";
import "@/blocks/reference.css";
import "./flux-settings.css";

function WorkspaceRow({
  icon: Icon,
  title,
  badge,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  badge: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Item className="flux-settings-item">
      <ItemMedia>
        <IconTile variant="frame">
          <Icon />
        </IconTile>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {title}
          {badge}
        </ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>{children}</ItemActions>
    </Item>
  );
}
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Frame dense spacing="sm">
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0">
        <ItemGroup className="gap-0">{children}</ItemGroup>
      </FramePanel>
    </Frame>
  );
}
const divider = <ItemSeparator className="m-0" />;
export function FluxWorkspaceSettings({ model }: { model: FluxSettingsModel }) {
  return (
    <section className="flux-settings-page" aria-labelledby="flux-workspace-heading">
      <h1 className="sr-only" id="flux-workspace-heading">
        Workspace settings
      </h1>
      <Group title="Autonomy">
        <WorkspaceRow
          icon={Bot}
          title="Retry a failed step once"
          badge={
            <Badge variant="secondary" radius="full">
              Bounded
            </Badge>
          }
          description="A step that errors re-runs before it reaches a human."
        >
          <Switch
            aria-label="Retry a failed step once"
            checked={model.workspace.retryOnce}
            onCheckedChange={(value) => model.setWorkspaceValue("retryOnce", value)}
          />
        </WorkspaceRow>
        {divider}
        <WorkspaceRow
          icon={Shield}
          title="Halt the workspace on a spend spike"
          badge={
            <Badge variant="focus-light" radius="full" className="border-dashed">
              Guard
            </Badge>
          }
          description="Runs stop when the hourly cost passes its ceiling."
        >
          <Switch
            aria-label="Halt the workspace on a spend spike"
            checked={model.workspace.haltOnSpendSpike}
            onCheckedChange={(value) => model.setWorkspaceValue("haltOnSpendSpike", value)}
          />
        </WorkspaceRow>
      </Group>
      <Group title="Run defaults">
        <WorkspaceRow
          icon={Settings2}
          title="Default model"
          badge={
            <Badge variant="outline" radius="full">
              claude-sonnet-5
            </Badge>
          }
          description="What a run starts on when its agent pins nothing."
        >
          <Button
            size="default"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              toast.info("Default model", {
                description:
                  "Currently claude-sonnet-5. A change applies to runs whose agent pins no model of its own; runs already in flight keep what they started on.",
              })
            }
          >
            Change model
          </Button>
        </WorkspaceRow>
        {divider}
        <WorkspaceRow
          icon={Layers}
          title="Concurrency ceiling"
          badge={
            <Badge variant="success-light" radius="full">
              24 runs
            </Badge>
          }
          description="How many runs this workspace may hold in flight."
        >
          <Button
            size="default"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              toast.info("Concurrency ceiling", {
                description:
                  "Currently 24 runs in flight. Raising it needs headroom on every provider in the routing chain, not just the primary.",
              })
            }
          >
            Adjust ceiling
          </Button>
        </WorkspaceRow>
        {divider}
        <WorkspaceRow
          icon={Timer}
          title="Step timeout"
          badge={
            <Badge variant="warning-light" radius="full">
              90s
            </Badge>
          }
          description="How long one step runs before the orchestrator cuts it."
        >
          <Button
            size="default"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              toast.info("Step timeout", {
                description:
                  "Currently 90s per step. Runs already in flight keep the timeout they started with.",
              })
            }
          >
            Change timeout
          </Button>
        </WorkspaceRow>
      </Group>
      <Group title="Operators">
        <Item className="flux-settings-item">
          <ItemMedia>
            <IconTile variant="frame">
              <Users />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              Workspace operators
              <Badge variant="outline" radius="full">
                4 operators
              </Badge>
            </ItemTitle>
            <AvatarGroup aria-label="Four workspace operators">
              {fluxOperators.slice(0, 3).map((operator) => (
                <Avatar key={operator.name} className="size-7">
                  <AvatarImage src={demoAvatar(operator.name)} alt={operator.name} />
                  <AvatarFallback>
                    {operator.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              <AvatarGroupCount className="size-7 text-xs">+1</AvatarGroupCount>
            </AvatarGroup>
          </ItemContent>
          <ItemActions>
            <Button
              size="default"
              variant="outline"
              className="rounded-full"
              onClick={() =>
                toast.info("Workspace operators", {
                  description: fluxOperators
                    .map((operator) => `${operator.name} (${operator.role.toLowerCase()})`)
                    .join(", "),
                })
              }
            >
              Manage operators
            </Button>
          </ItemActions>
        </Item>
      </Group>
      <Group title="Trace retention">
        <WorkspaceRow
          icon={FileText}
          title="Keep full run traces"
          badge={
            <Badge variant="outline" radius="full">
              30 days
            </Badge>
          }
          description="Every prompt, tool call and response, kept for 30 days."
        >
          <Switch
            aria-label="Keep full run traces"
            checked={model.workspace.keepTraces}
            onCheckedChange={(value) => model.setWorkspaceValue("keepTraces", value)}
          />
        </WorkspaceRow>
        {divider}
        <WorkspaceRow
          icon={LockKeyhole}
          title="Redact secrets in traces"
          badge={
            <Badge variant="focus-light" radius="full" className="border-dashed">
              Always
            </Badge>
          }
          description="Keys and tokens are masked before a trace is stored."
        >
          <Switch
            aria-label="Redact secrets in traces"
            checked={model.workspace.redactSecrets}
            onCheckedChange={(value) => model.setWorkspaceValue("redactSecrets", value)}
          />
        </WorkspaceRow>
      </Group>
    </section>
  );
}
