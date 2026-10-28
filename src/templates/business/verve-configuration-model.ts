import { useRef, useState } from "react";
import {
  createVerveApiKeys,
  createVerveEndpointDraft,
  createVerveEndpoints,
  createVerveIntegrations,
  createVerveKeyDraft,
  type VerveApiKey,
  type VerveEndpoint,
  type VerveKeyDraft,
  type VerveKeyStack,
} from "./verve-configuration-data";

/** Parent-held demo configuration. All credentials/domains are original dummy
 * values; no external integration/authentication/webhook request is performed. */
export function useVerveConfigurationModel() {
  const [integrations, setIntegrations] = useState(createVerveIntegrations);
  const [integrationDetails, setIntegrationDetails] = useState<string | null>(null);
  const [keys, setKeys] = useState(createVerveApiKeys);
  const [stack, setStack] = useState<VerveKeyStack>("Next.js");
  const [revealedKeyIds, setRevealedKeyIds] = useState<string[]>([]);
  const [showKeyAlert, setShowKeyAlert] = useState(true);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState(createVerveKeyDraft);
  const [keyErrors, setKeyErrors] = useState<Partial<Record<keyof VerveKeyDraft, string>>>({});
  const [endpoints, setEndpoints] = useState(createVerveEndpoints);
  const [endpointDialogOpen, setEndpointDialogOpen] = useState(false);
  const [endpointDraft, setEndpointDraft] = useState(createVerveEndpointDraft);
  const [endpointErrors, setEndpointErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const sequence = useRef(0);
  function nextId(prefix: string) {
    sequence.current += 1;
    return `${prefix}-${sequence.current}`;
  }
  function setIntegrationConnected(id: string, connected: boolean) {
    setIntegrations((current) =>
      current.map((row) => (row.id === id ? { ...row, connected } : row)),
    );
    setStatus(
      `Integration ${connected ? "connected" : "disconnected"} in this local preview. No external account was changed.`,
    );
  }
  function openKeyDialog() {
    setKeyDraft(createVerveKeyDraft());
    setKeyErrors({});
    setKeyDialogOpen(true);
  }
  function updateKeyDraft<K extends keyof VerveKeyDraft>(key: K, value: VerveKeyDraft[K]) {
    setKeyDraft((current) => ({ ...current, [key]: value }));
    setKeyErrors((current) => ({ ...current, [key]: undefined }));
  }
  function createKey() {
    const errors: Partial<Record<keyof VerveKeyDraft, string>> = {};
    if (!keyDraft.name.trim()) errors.name = "Enter a key name.";
    if (!keyDraft.owners.length) errors.owners = "Assign at least one access owner.";
    if (!keyDraft.scopes.length) errors.scopes = "Select at least one scope.";
    setKeyErrors(errors);
    if (Object.keys(errors).length) return false;
    const id = nextId("key");
    const key: VerveApiKey = {
      ...keyDraft,
      name: keyDraft.name.trim(),
      owners: [...keyDraft.owners],
      scopes: [...keyDraft.scopes],
      id,
      kind: "secret",
      status: "Active",
      value: `bk_demo_secret_${id}_v1`,
      version: 1,
      lastUsed: "Not used yet",
    };
    setKeys((current) => [...current, key]);
    setKeyDialogOpen(false);
    setStatus("A dummy key was created in this preview. It cannot authenticate API requests.");
    return true;
  }
  function toggleKeyReveal(id: string) {
    setRevealedKeyIds((current) =>
      current.includes(id) ? current.filter((key) => key !== id) : [...current, id],
    );
  }
  function rotateKey(id: string) {
    setKeys((current) =>
      current.map((row) =>
        row.id === id && row.status !== "Revoked"
          ? {
              ...row,
              version: row.version + 1,
              value: `bk_demo_secret_${row.id}_v${row.version + 1}`,
              status: "Active",
            }
          : row,
      ),
    );
    setRevealedKeyIds((current) => current.filter((key) => key !== id));
    setStatus("This preview key was rotated. No external credential changed.");
  }
  function revokeKey(id: string) {
    setKeys((current) =>
      current.map((row) => (row.id === id ? { ...row, status: "Revoked" } : row)),
    );
    setRevealedKeyIds((current) => current.filter((key) => key !== id));
    setStatus("The selected dummy key was revoked in this preview.");
  }
  function openEndpointDialog() {
    setEndpointDraft({
      ...createVerveEndpointDraft(),
      signingSecret: `bk_demo_webhook_${nextId("draft")}`,
    });
    setEndpointErrors({});
    setEndpointDialogOpen(true);
  }
  function updateEndpointDraft<K extends keyof typeof endpointDraft>(
    key: K,
    value: (typeof endpointDraft)[K],
  ) {
    setEndpointDraft((current) => ({ ...current, [key]: value }));
    setEndpointErrors((current) => ({ ...current, [key]: "" }));
  }
  function addEndpoint() {
    const errors: Record<string, string> = {};
    if (!endpointDraft.name.trim()) errors.name = "Enter an endpoint name.";
    let url = "";
    try {
      const parsed = new URL(`https://${endpointDraft.hostPath.trim()}`);
      if (!parsed.hostname.includes(".") || parsed.username || parsed.password)
        throw new Error("Invalid destination");
      url = parsed.toString();
    } catch {
      errors.hostPath = "Enter a valid destination host and path.";
    }
    if (!endpointDraft.events.length) errors.events = "Select at least one event.";
    if (!endpointDraft.signingSecret.trim()) errors.signingSecret = "Enter a signing secret.";
    setEndpointErrors(errors);
    if (Object.keys(errors).length) return false;
    const next: VerveEndpoint = {
      id: nextId("endpoint"),
      name: endpointDraft.name.trim(),
      url,
      icon: "bot",
      enabled: endpointDraft.enabled,
      delivery: "Delivering",
      health: [
        {
          level: "healthy",
          message: "This local preview endpoint has no recorded delivery issues.",
        },
      ],
      secretVersion: 1,
      signingSecret: endpointDraft.signingSecret,
      lastDelivery: "No deliveries yet",
      events: [...endpointDraft.events],
    };
    setEndpoints((current) => [...current, next]);
    setEndpointDialogOpen(false);
    setStatus("Endpoint configuration added locally. No webhook request was sent.");
    return true;
  }
  function setEndpointEnabled(id: string, enabled: boolean) {
    setEndpoints((current) => current.map((row) => (row.id === id ? { ...row, enabled } : row)));
  }
  function removeEndpoint(id: string) {
    setEndpoints((current) => current.filter((row) => row.id !== id));
  }
  function rotateEndpoint(id: string) {
    const row = endpoints.find((endpoint) => endpoint.id === id);
    if (!row) return;
    const secretVersion = row.secretVersion + 1;
    const signingSecret = `bk_demo_webhook_${id}_v${secretVersion}`;
    setEndpoints((current) =>
      current.map((endpoint) =>
        endpoint.id === id ? { ...endpoint, secretVersion, signingSecret } : endpoint,
      ),
    );
    return { secretVersion, signingSecret };
  }
  return {
    integrations,
    integrationDetails,
    setIntegrationDetails,
    setIntegrationConnected,
    keys,
    stack,
    setStack,
    revealedKeyIds,
    showKeyAlert,
    setShowKeyAlert,
    keyDialogOpen,
    setKeyDialogOpen,
    keyDraft,
    keyErrors,
    openKeyDialog,
    updateKeyDraft,
    createKey,
    toggleKeyReveal,
    rotateKey,
    revokeKey,
    endpoints,
    endpointDialogOpen,
    setEndpointDialogOpen,
    endpointDraft,
    endpointErrors,
    openEndpointDialog,
    updateEndpointDraft,
    addEndpoint,
    webhookModel: { endpoints, setEndpointEnabled, removeEndpoint, rotateEndpoint },
    status,
    setStatus,
  };
}
export type VerveConfigurationModel = ReturnType<typeof useVerveConfigurationModel>;
