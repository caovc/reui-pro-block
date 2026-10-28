import {
  ArrowUpRight,
  BrainCircuit,
  Database,
  MessageCircle,
  MessagesSquare,
  Music2,
  Plug,
  Video,
  WalletCards,
  Waypoints,
  Webcam,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { DriveSettingsDialog } from "@/templates/collaboration/drive-settings-components";
import type { VerveConfigurationModel } from "./verve-configuration-model";
import type { VerveIntegration } from "./verve-configuration-data";
import "./verve-configuration.css";

const integrationIcons = {
  chat: MessageCircle,
  payments: WalletCards,
  database: Database,
  workflow: Waypoints,
  video: Video,
  recording: Webcam,
  community: MessagesSquare,
  ai: BrainCircuit,
  music: Music2,
} satisfies Record<VerveIntegration["icon"], typeof Plug>;
export function VerveSettingsIntegrations({
  model,
  workspaceName,
}: {
  model: VerveConfigurationModel;
  workspaceName: string;
}) {
  const details = model.integrations.find((row) => row.id === model.integrationDetails);
  return (
    <section className="vv-config vv-integrations" aria-labelledby="vv-integrations-heading">
      <header className="vv-config-heading">
        <div>
          <h1 id="vv-integrations-heading">Integrations</h1>
          <p>
            Connect Bricklane to the tools {workspaceName} already runs on for calls, payments, and
            automation.
          </p>
        </div>
      </header>
      <div className="vv-integration-grid">
        {model.integrations.map((row) => {
          const Icon = integrationIcons[row.icon];
          return (
            <Frame dense key={row.id} className="vv-integration-card">
              <FramePanel fit className="vv-integration-content">
                <div className="flex items-start justify-between gap-3">
                  <IconTile variant="frame" aria-label={row.name}>
                    <Icon />
                  </IconTile>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View ${row.name} integration details`}
                    onClick={() => model.setIntegrationDetails(row.id)}
                  >
                    <ArrowUpRight />
                  </Button>
                </div>
                <FrameDescription>{row.description}</FrameDescription>
              </FramePanel>
              <FrameFooter className="vv-integration-footer">
                <Button
                  type="button"
                  size="sm"
                  variant={row.connected ? "outline" : "default"}
                  aria-label={`${row.connected ? "Disconnect" : "Connect"} ${row.name}`}
                  aria-pressed={row.connected}
                  onClick={() => model.setIntegrationConnected(row.id, !row.connected)}
                >
                  {!row.connected && <Plug aria-hidden="true" />}
                  {row.connected ? "Disconnect" : "Connect"}
                </Button>
                <Switch
                  aria-label={`Enable ${row.name}`}
                  checked={row.connected}
                  onCheckedChange={(enabled) => model.setIntegrationConnected(row.id, enabled)}
                />
              </FrameFooter>
            </Frame>
          );
        })}
      </div>
      <p className="vv-config-status" role="status">
        {model.status}
      </p>
      {details && (
        <DriveSettingsDialog
          title={`${details.name} integration`}
          description="Local integration preview. No external authorization has been performed."
          onClose={() => model.setIntegrationDetails(null)}
        >
          <FrameTitle>{details.name}</FrameTitle>
          <p>{details.description}</p>
          <p>{details.connected ? "Connected in this preview" : "Not connected in this preview"}</p>
        </DriveSettingsDialog>
      )}
    </section>
  );
}
