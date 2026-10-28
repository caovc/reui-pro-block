import { useState } from "react";
import { Code2, Copy, Eye, EyeOff, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { CodeBlock, CodeBlockCopyButton } from "@/components/reui/code-block/code-block";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  verveKeyOwners,
  verveKeyStacks,
  type VerveApiKey,
  type VerveKeyStack,
} from "./verve-configuration-data";
import { VerveKeyDialog } from "./verve-key-dialog";
import type { VerveConfigurationModel } from "./verve-configuration-model";
import "./verve-configuration.css";

function mask(value: string) {
  return `${value.startsWith("bk_demo_restricted") ? "bk_demo_restricted_" : "bk_demo_secret_"}••••••••••••••••`;
}
function keyStatusVariant(status: VerveApiKey["status"]) {
  return status === "Active"
    ? "success-light"
    : status === "Rotating"
      ? "warning-light"
      : status === "Restricted"
        ? "focus-light"
        : "outline";
}
function KeyRow({ record, model }: { record: VerveApiKey; model: VerveConfigurationModel }) {
  const revealed = model.revealedKeyIds.includes(record.id);
  const revoked = record.status === "Revoked";
  const displayed = record.kind === "publishable" || revealed ? record.value : mask(record.value);
  return (
    <div className="vv-key-row">
      <div className="vv-key-identity">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <strong>{record.name}</strong>
          <Badge variant={keyStatusVariant(record.status)} size="sm">
            {record.status}
          </Badge>
        </div>
        <p>
          {record.owners
            .map((id) => verveKeyOwners.find((owner) => owner.id === id)?.name ?? id)
            .join(", ")}
          <span aria-hidden="true"> · </span>
          {record.environment}
          <span aria-hidden="true"> · </span>
          {record.stack}
        </p>
      </div>
      <div className="vv-key-value">
        <InputGroup>
          <InputGroupInput
            aria-label={`${record.name} value`}
            value={revoked ? "Revoked" : displayed}
            readOnly
            className="font-mono"
          />
          <InputGroupAddon align="inline-end">
            <CodeBlockCopyButton
              value={record.value}
              position="inline"
              size="icon-xs"
              disabled={revoked}
              labels={{ copy: `Copy ${record.name}`, copied: `${record.name} copied` }}
              onCopyError={() => toast.error("The key could not be copied.")}
            />
            {record.kind !== "publishable" && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={revoked}
                  aria-label={`${revealed ? "Hide" : "Reveal"} ${record.name}`}
                  aria-pressed={revealed}
                  onClick={() => model.toggleKeyReveal(record.id)}
                >
                  {revealed ? <EyeOff /> : <Eye />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={revoked}
                  aria-label={`Rotate ${record.name}`}
                  onClick={() => model.rotateKey(record.id)}
                >
                  <RefreshCw />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  disabled={revoked}
                  aria-label={`Revoke ${record.name}`}
                  onClick={() => model.revokeKey(record.id)}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </InputGroupAddon>
        </InputGroup>
        <span className="vv-key-last-used">Last used {record.lastUsed}</span>
      </div>
    </div>
  );
}
export function VerveSettingsApiKeys({ model }: { model: VerveConfigurationModel }) {
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);
  const publishable =
    model.keys.find((row) => row.kind === "publishable" && row.status !== "Revoked")?.value ??
    "bk_demo_publishable_not_set";
  const secret =
    model.keys.find(
      (row) => row.kind !== "publishable" && row.stack === model.stack && row.status !== "Revoked",
    )?.value ??
    model.keys.find((row) => row.kind === "secret" && row.status !== "Revoked")?.value ??
    "bk_demo_secret_not_set";
  const prefix =
    model.stack === "Next.js" ? "NEXT_PUBLIC_" : model.stack === "React SPA" ? "VITE_" : "";
  const environment = (secretValue: string) =>
    `${prefix}BRICKLANE_PUBLISHABLE_KEY=${publishable}\nBRICKLANE_SECRET_KEY=${secretValue}\nBRICKLANE_API_URL=https://api.bricklane.test/v1`;
  const open = (trigger: HTMLElement) => {
    setReturnFocus(trigger);
    model.openKeyDialog();
  };
  return (
    <section className="vv-config vv-api-keys" aria-labelledby="vv-api-heading">
      <header className="vv-config-heading">
        <div>
          <h1 id="vv-api-heading">API Keys</h1>
          <p>Manage credentials and copy stack-ready environment values.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">{model.keys.length} keys</span>
          <Button type="button" size="sm" onClick={(event) => open(event.currentTarget)}>
            <Plus />
            Create Key
          </Button>
        </div>
      </header>
      <Frame dense className="vv-env-frame">
        <FrameHeader className="vv-config-frame-header">
          <div>
            <FrameTitle>Quick Copy</FrameTitle>
            <FrameDescription>Choose a stack and paste the environment block.</FrameDescription>
          </div>
          <div className="vv-stack-controls">
            <Select
              value={model.stack}
              onValueChange={(value) => model.setStack(value as VerveKeyStack)}
            >
              <SelectTrigger aria-label="Select framework stack">
                <Code2 aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="reui-reference">
                <SelectGroup>
                  {verveKeyStacks.map((stack) => (
                    <SelectItem key={stack} value={stack}>
                      {stack}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <CodeBlockCopyButton
              value={environment(secret)}
              position="inline"
              size="sm"
              variant="outline"
              labels={{ copy: "Copy environment snippet", copied: "Environment snippet copied" }}
              onCopyError={() => toast.error("The environment snippet could not be copied.")}
            >
              <Copy />
              Copy
            </CodeBlockCopyButton>
          </div>
        </FrameHeader>
        <FramePanel className="vv-code-panel">
          <div className="dark vv-env-code">
            <CodeBlock code={environment(mask(secret))} language="bash" showLineNumbers />
          </div>
        </FramePanel>
      </Frame>
      <Frame dense className="vv-keys-frame">
        <FrameHeader className="vv-config-frame-header">
          <div>
            <FrameTitle>Keys</FrameTitle>
            <FrameDescription>Copy, reveal, rotate, or revoke workspace keys.</FrameDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => open(event.currentTarget)}
          >
            <Plus />
            Add Key
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          {model.keys.map((record, index) => (
            <div key={record.id}>
              {index > 0 && <Separator />}
              <KeyRow record={record} model={model} />
            </div>
          ))}
        </FramePanel>
      </Frame>
      {model.showKeyAlert && (
        <Frame dense>
          <FramePanel className="p-0">
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>Keep secret keys server-side</AlertTitle>
              <AlertDescription>
                Rotate immediately if a key appears in client code, logs, or shared screenshots.
              </AlertDescription>
              <AlertAction>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  onClick={() => model.setShowKeyAlert(false)}
                >
                  Dismiss
                </Button>
              </AlertAction>
            </Alert>
          </FramePanel>
        </Frame>
      )}
      <p className="vv-config-status" role="status">
        {model.status}
      </p>
      {model.keyDialogOpen && <VerveKeyDialog model={model} returnFocus={returnFocus} />}
    </section>
  );
}
