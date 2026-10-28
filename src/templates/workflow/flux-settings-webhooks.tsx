import type { ComponentType } from "react";
import {
  Bot,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  ListChecks,
  MoreVertical,
  Plus,
  RefreshCw,
  Shield,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import type { FluxEndpoint, FluxSettingsModel } from "./flux-settings-model";
import "@/blocks/reference.css";
import "./flux-settings.css";

const endpointIcons: Record<FluxEndpoint["icon"], ComponentType<{ className?: string }>> = {
  bot: Bot,
  list: ListChecks,
  retry: RefreshCw,
  wallet: WalletCards,
  shield: Shield,
};
function EndpointUrl({ endpoint }: { endpoint: FluxEndpoint }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  return (
    <ItemDescription className="flux-endpoint-url font-mono">
      <span className="truncate" title={endpoint.url}>
        {endpoint.url}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="flux-endpoint-copy"
        aria-label={
          isCopied
            ? `Endpoint URL copied for ${endpoint.name}`
            : `Copy endpoint URL for ${endpoint.name}`
        }
        onClick={() => {
          if (typeof navigator.clipboard?.writeText === "function") copyToClipboard(endpoint.url);
          else
            toast.info("Copy endpoint URL", {
              description: "Clipboard access is unavailable in this browser.",
            });
        }}
      >
        {isCopied ? <Check /> : <Copy />}
      </Button>
    </ItemDescription>
  );
}
export type FluxWebhookModel = Pick<
  FluxSettingsModel,
  "endpoints" | "setEndpointEnabled" | "removeEndpoint" | "rotateEndpoint"
>;

function EndpointRow({ endpoint, model }: { endpoint: FluxEndpoint; model: FluxWebhookModel }) {
  const Icon = endpointIcons[endpoint.icon];
  const status = endpoint.enabled ? endpoint.delivery : "Paused";
  const info = (title: string, description: string) =>
    toast.info(title, { description, cancel: { label: "Dismiss", onClick: () => undefined } });
  return (
    <Item className="flux-settings-item flux-endpoint-item">
      <ItemMedia>
        <IconTile variant="frame">
          <Icon />
        </IconTile>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <span className="min-w-0 truncate">{endpoint.name}</span>
          <span className="flex shrink-0 items-center gap-1">
            {endpoint.health.map((health) => {
              const HealthIcon =
                health.level === "healthy"
                  ? CircleCheck
                  : health.level === "critical"
                    ? CircleX
                    : TriangleAlert;
              const description = `${health.level[0].toUpperCase()}${health.level.slice(1)}. ${health.message}`;
              return (
                <Button
                  key={description}
                  variant="ghost"
                  size="icon-sm"
                  className={`flux-endpoint-health flux-endpoint-${health.level}`}
                  aria-label={description}
                  title={description}
                >
                  <HealthIcon />
                </Button>
              );
            })}
          </span>
          <Badge
            variant={
              status === "Paused"
                ? "outline"
                : status === "Retrying"
                  ? "warning-light"
                  : "success-light"
            }
            radius="full"
          >
            {status}
          </Badge>
        </ItemTitle>
        <EndpointUrl endpoint={endpoint} />
      </ItemContent>
      <ItemActions className="self-start md:self-auto">
        <Switch
          aria-label={`Toggle ${endpoint.url}`}
          checked={endpoint.enabled}
          onCheckedChange={(value) => model.setEndpointEnabled(endpoint.id, value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={`Open actions for ${endpoint.name}`}
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="reui-reference">
            <DropdownMenuItem
              onSelect={() => info("Endpoint settings", `Open rules for ${endpoint.name}.`)}
            >
              Manage endpoint
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                info(
                  "Delivery history",
                  `${endpoint.name} last delivered ${endpoint.lastDelivery}.`,
                )
              }
            >
              View deliveries
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const rotated = model.rotateEndpoint(endpoint.id);
                if (rotated)
                  info(
                    "Preview secret rotated",
                    `${endpoint.name} now uses preview signing secret version ${rotated.secretVersion}.`,
                  );
              }}
            >
              Rotate secret
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                model.removeEndpoint(endpoint.id);
                info(
                  "Endpoint removed",
                  `${endpoint.name} was removed from this preview's delivery routes.`,
                );
              }}
            >
              Remove endpoint
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}
export function FluxWebhookSettings({
  model,
  onAddEndpoint,
}: {
  model: FluxWebhookModel;
  onAddEndpoint?: () => void;
}) {
  return (
    <section
      className="flux-settings-page flux-webhooks-page"
      aria-labelledby="flux-webhooks-heading"
    >
      <h1 className="sr-only" id="flux-webhooks-heading">
        Webhook endpoints
      </h1>
      <Frame dense spacing="sm">
        <FrameHeader className="flex-row items-center justify-between gap-3">
          <div className="space-y-px">
            <FrameTitle>Webhook Endpoints</FrameTitle>
            <FrameDescription>Routes and status</FrameDescription>
          </div>
          <Button
            size="default"
            className="rounded-full"
            onClick={
              onAddEndpoint ??
              (() =>
                toast.info("Add endpoint", {
                  description: "Add a destination URL and subscribed events.",
                  cancel: { label: "Dismiss", onClick: () => undefined },
                }))
            }
          >
            <Plus />
            Add Endpoint
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          {model.endpoints.length ? (
            <ItemGroup className="gap-0">
              {model.endpoints.map((endpoint, index) => (
                <div key={endpoint.id}>
                  {index > 0 && <ItemSeparator className="m-0" />}
                  <EndpointRow endpoint={endpoint} model={model} />
                </div>
              ))}
            </ItemGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No webhook endpoints</EmptyTitle>
                <EmptyDescription>This preview has no destinations configured.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </FramePanel>
      </Frame>
    </section>
  );
}
