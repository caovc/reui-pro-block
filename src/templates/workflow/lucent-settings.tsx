import {
  lucentServices,
  type useLucentSecurityModel,
  type useLucentIntegrationsModel,
} from "./workflow-models";
import { Children, Fragment, useState, type ReactNode } from "react";
import { ExternalLink, Plus, Zap } from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import { Button, Input } from "./shared";
import { Choice, SideForm } from "./controls";
import { integrationArtwork } from "@/lib/demo-artwork";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children);
  return (
    <Frame dense className="mb-5">
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
        <FrameDescription>{description}</FrameDescription>
      </FrameHeader>
      <FramePanel className="p-0">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {row}
            {index < rows.length - 1 && <Separator />}
          </Fragment>
        ))}
      </FramePanel>
    </Frame>
  );
}
function Setting({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Item className="px-4">
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="[&>[data-slot=select-trigger]]:w-40">{children}</ItemActions>
    </Item>
  );
}
export function LucentSecurity({ model }: { model: ReturnType<typeof useLucentSecurityModel> }) {
  const { policies, setPolicies, timeout, setTimeoutValue } = model;
  function toggle(id: string, title: string) {
    return (
      <Switch
        aria-label={title}
        checked={!!policies[id]}
        onCheckedChange={(value) => setPolicies({ ...policies, [id]: value })}
      />
    );
  }
  return (
    <div className="wf-lucent-settings space-y-5">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground">
          Define authentication rules and access boundaries for your workspace.
        </p>
      </div>
      <Group
        title="Session Policy"
        description="Configure session duration and timeout rules for your workspace."
      >
        <Setting
          title="Enforce two-factor authentication"
          description="Require all members to enable 2FA."
        >
          {toggle("twofactor", "Enforce two-factor authentication")}
        </Setting>
        <Setting title="Session timeout" description="Auto-logout after inactivity period.">
          <Choice
            label="Session timeout"
            value={timeout}
            onChange={setTimeoutValue}
            items={["30 minutes", "1 hour", "4 hours", "24 hours", "Never"]}
          />
        </Setting>
        <Setting title="Single active session" description="Limit each user to one active session.">
          {toggle("single", "Single active session")}
        </Setting>
      </Group>
      <Group
        title="Login Methods"
        description="Admins can always sign in via email. Changes apply to workspace members only."
      >
        <Setting
          title="Password authentication"
          description="Allow members to log in with a password."
        >
          {toggle("password", "Password authentication")}
        </Setting>
        <Setting title="Magic link login" description="Send a one-time link via email to sign in.">
          {toggle("magic", "Magic link login")}
        </Setting>
        <Setting title="SAML single sign-on" description="Authenticate via your identity provider.">
          <Badge variant="outline">Team</Badge>
        </Setting>
      </Group>
      <Group
        title="Access Restrictions"
        description="See which access controls your plan unlocks for this workspace."
      >
        {[
          ["Member invitations", "Who can invite new members.", "Free"],
          ["Service creation", "Who can create new projects.", "Pro"],
          ["Custom roles", "Create and assign custom roles.", "Pro"],
          ["Audit log access", "View detailed workspace activity logs.", "Team"],
        ].map(([title, description, plan]) => (
          <Setting key={title} title={title} description={description}>
            <Badge variant="outline">{plan}</Badge>
          </Setting>
        ))}
      </Group>
    </div>
  );
}
export function LucentIntegrations({
  model,
}: {
  model: ReturnType<typeof useLucentIntegrationsModel>;
}) {
  const { connections, setConnections, webhooks, setWebhooks } = model;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="wf-lucent-settings">
      <div className="wf-page-heading">
        <div>
          <h1>Integrations</h1>
          <p>Send releases, alerts and approvals to the tools your team already works in.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Add webhook
        </Button>
      </div>
      <div className="wf-grid wf-three wf-integration-grid">
        {lucentServices.map((service) => (
          <Frame dense spacing="sm" key={service.name}>
            <FramePanel>
              <div className="wf-inline wf-between">
                <IconTile variant="frame">
                  <img
                    alt={`${service.name} original substitute artwork`}
                    src={integrationArtwork(service.name, "#6366f1")}
                  />
                </IconTile>
                <ExternalLink className="size-4 text-muted-foreground" />
              </div>
              <p>{service.description}</p>
            </FramePanel>
            <footer>
              <Button
                size="sm"
                variant={connections[service.name] ? "outline" : "default"}
                aria-label={`${connections[service.name] ? "Disconnect" : "Connect"} ${service.name}`}
                onClick={() =>
                  setConnections({ ...connections, [service.name]: !connections[service.name] })
                }
              >
                {!connections[service.name] && <Zap />}
                {connections[service.name] ? "Disconnect" : "Connect"}
              </Button>
              <Switch
                aria-label={`${service.name} connection`}
                checked={connections[service.name]}
                onCheckedChange={(value) =>
                  setConnections({ ...connections, [service.name]: value })
                }
              />
            </footer>
          </Frame>
        ))}
      </div>
      {webhooks.map((hook) => (
        <div key={hook.url} className="wf-policy-row">
          <div>
            <strong>{hook.name}</strong>
            <p>{hook.url}</p>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      ))}
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title="Add webhook"
        description="Send workspace events to your endpoint."
        submit="Create webhook"
        onSubmit={() => {
          if (!name.trim() || !url.trim()) return;
          setWebhooks([...webhooks, { name, url }]);
          setOpen(false);
          setName("");
          setUrl("");
        }}
      >
        <label>
          Name
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Endpoint URL
          <Input
            required
            type="url"
            placeholder="https://example.com/webhooks"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
      </SideForm>
    </div>
  );
}
