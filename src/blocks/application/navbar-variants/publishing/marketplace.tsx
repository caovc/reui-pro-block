import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Rocket } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { useToolbarTheme } from "../toolbars/use-theme";
import { AgentCategories } from "./free/categories";
import { AgentPicker } from "./free/agent-picker";
import { MarketplaceAccountMenu } from "./free/account-menu";
import { AgentNotifications } from "./notifications";
import { agents } from "./data";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "./support";

export default function AgentMarketplaceNavbar() {
  const { theme, setTheme, dark } = useToolbarTheme();
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(agents[0].id);
  const [deployOpen, setDeployOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployments, setDeployments] = useState<string[]>([]);
  const [accountPanel, setAccountPanel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const filtered = agents.filter((agent) => category === "all" || agent.category === category);
  const selectedAgent = filtered.find((agent) => agent.id === selected) ?? filtered[0];
  function deploy() {
    if (deploying || !selectedAgent) return;
    const name = selectedAgent.name;
    setDeploying(true);
    timer.current = setTimeout(() => {
      setDeployments((current) => [...current, name]);
      setDeploying(false);
      setDeployOpen(false);
      setNotice(`${name} deployed in the local simulator. No cloud resource or API was created.`);
    }, 1200);
  }
  function accountAction(value: string) {
    if (["My Agents", "Usage", "API Keys"].includes(value)) setAccountPanel(value);
    else setNotice(`${value}: local account demonstration.`);
  }
  return (
    <ToolbarScene id={8} dark={dark}>
      <header className="publishing-marketplace-header">
        <div className="publishing-brand">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold">Bricklane AI</span>
        </div>
        <AgentCategories
          value={category}
          onChange={(value) => {
            setCategory(value);
            setSelected(agents.find((agent) => value === "all" || agent.category === value)!.id);
          }}
        />
        <div className="publishing-actions">
          <Button size="sm" onClick={() => setDeployOpen(true)}>
            <Rocket data-icon="inline-start" />
            Deploy
          </Button>
          <AgentNotifications />
          <Separator orientation="vertical" className="h-5" />
          <MarketplaceAccountMenu
            agentCount={deployments.length}
            dark={dark}
            theme={theme}
            onThemeChange={setTheme}
            onAction={accountAction}
          />
        </div>
      </header>
      <PlaceholderPanel>
        <output className="sr-only" aria-live="polite">
          {category} agents: {filtered.map((agent) => agent.name).join(", ")}. Local deployments:{" "}
          {deployments.length}.
        </output>
      </PlaceholderPanel>
      <ToolbarNotice>{notice}</ToolbarNotice>
      <Dialog
        open={deployOpen}
        onOpenChange={(value) => {
          if (!deploying) setDeployOpen(value);
        }}
      >
        <DialogSurface
          id={211}
          title="Deploy local agent"
          description="Preview a deployment using fictional agents. No cloud connection is configured."
          footer={
            <>
              <Button variant="outline" disabled={deploying} onClick={() => setDeployOpen(false)}>
                Cancel
              </Button>
              <Button disabled={deploying || !selectedAgent} onClick={deploy}>
                {deploying && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                {deploying ? "Deploying…" : "Deploy demo"}
              </Button>
            </>
          }
        >
          <Field>
            <FieldLabel>Agent</FieldLabel>
            <AgentPicker
              value={selectedAgent?.id ?? ""}
              onChange={setSelected}
              items={filtered.map((agent) => ({ value: agent.id, label: agent.name }))}
            />
          </Field>
          <p className="mt-3 text-sm text-muted-foreground">{selectedAgent?.description}</p>
        </DialogSurface>
      </Dialog>
      <Dialog
        open={accountPanel !== null}
        onOpenChange={(value) => {
          if (!value) setAccountPanel(null);
        }}
      >
        <DialogSurface
          id={212}
          title={accountPanel ?? "Account"}
          description="Local preview account details only."
          footer={
            <Button variant="outline" onClick={() => setAccountPanel(null)}>
              Close account details
            </Button>
          }
        >
          {accountPanel === "My Agents" &&
            (deployments.length ? (
              <ol className="flex flex-col gap-3">
                {deployments.map((name, index) => (
                  <li
                    key={`${name}-${index}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{name}</span>
                    <Badge variant="success-light">Local demo</Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No local agents deployed yet.</p>
            ))}
          {accountPanel === "Usage" && (
            <p className="text-sm">
              {deployments.length} local deployments · {deployments.length * 125} sample credits. No
              billing usage was recorded.
            </p>
          )}
          {accountPanel === "API Keys" && (
            <p className="text-sm text-muted-foreground">
              No API keys are stored or issued by this demo. Connect your own service to manage real
              credentials.
            </p>
          )}
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
