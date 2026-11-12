import { useId, useRef, useState, type FormEvent } from "react";
import {
  Building2,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  EllipsisVertical,
  Eye,
  EyeOff,
  Globe,
  Link,
  LockKeyhole,
  RotateCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import {
  StrataSettingsRow,
  StrataSettingsSection,
  StrataSettingsSelect,
} from "./strata-settings-shared";
import {
  STRATA_SECURITY_OPTIONS,
  validateStrataProviderUrl,
  validateStrataSecurityPolicy,
  type StrataIdentityProvider,
  type StrataSecurityPolicy,
  type useStrataSettingsSecurityModel,
} from "./strata-settings-security-model";
import "./strata-settings-leaves.css";

type SecurityModel = ReturnType<typeof useStrataSettingsSecurityModel>;
const factors = [
  ["totp", "Authenticator (TOTP)", "One-time codes from an authenticator app."],
  ["passkey", "Passkey", "Device-bound biometric or PIN sign-in."],
  ["securityKey", "Security key", "Hardware FIDO2 keys for high-risk roles."],
  ["sms", "SMS", "Codes sent by text as a last resort."],
] as const;

function CopySetting({ value, label }: { value: string; label: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const [unavailable, setUnavailable] = useState(false);
  return (
    <span className="strata-security-copy">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={isCopied ? `Copied ${label}` : `Copy ${label}`}
        onClick={() => {
          if (typeof navigator.clipboard?.writeText === "function") {
            setUnavailable(false);
            copyToClipboard(value);
          } else setUnavailable(true);
        }}
      >
        {isCopied ? <Check /> : <Copy />}
      </Button>
      {unavailable && (
        <span role="status" className="strata-settings-inline-error">
          Clipboard unavailable.
        </span>
      )}
    </span>
  );
}

function ProviderDraft({
  provider,
  model,
}: {
  provider: StrataIdentityProvider;
  model: SecurityModel;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(provider.url);
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = model.configureProvider(provider.id, value);
    if (result.ok) setOpen(false);
    else setError(result.error);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setValue(provider.url);
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={provider.status === "Not configured" ? "default" : "outline"}
          size="sm"
          disabled={model.memberView}
        >
          <Link />
          {provider.status === "Not configured" ? "Connect" : "Edit draft"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{provider.name} configuration</DialogTitle>
          <DialogDescription>
            Save a local configuration draft. Connecting a real identity provider is unavailable in
            this preview.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={id}>Metadata URL</FieldLabel>
              <Input
                id={id}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save local configuration</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Provider({ provider, model }: { provider: StrataIdentityProvider; model: SecurityModel }) {
  const [inspection, setInspection] = useState(false);
  const inspectionOpener = useRef<HTMLButtonElement | null>(null);
  const menuOpener = useRef<HTMLButtonElement | null>(null);
  const Icon = provider.id === "okta" ? ShieldCheck : provider.id === "entra" ? Building2 : Globe;
  const StatusIcon =
    provider.status === "Connected"
      ? CircleCheck
      : provider.status === "Error"
        ? CircleAlert
        : TriangleAlert;
  return (
    <StrataSettingsRow
      compact
      title={
        <span className="strata-security-provider">
          <IconTile size="sm" variant="frame">
            <Icon />
          </IconTile>
          <span>{provider.name}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="strata-security-health"
                data-status={provider.status}
                aria-label={provider.detail}
              >
                <StatusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{provider.detail}</TooltipContent>
          </Tooltip>
          <Badge
            variant={
              provider.status === "Connected"
                ? "success-light"
                : provider.status === "Error"
                  ? "destructive-light"
                  : "outline"
            }
          >
            {provider.status}
          </Badge>
        </span>
      }
      description={
        <span className="strata-security-metadata">
          <code>{provider.url}</code>
          <CopySetting value={provider.url} label={`${provider.name} metadata URL`} />
        </span>
      }
    >
      <div className="strata-security-provider-actions">
        {provider.status === "Not configured" || provider.status === "Configured locally" ? (
          <ProviderDraft provider={provider} model={model} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              inspectionOpener.current = event.currentTarget;
              setInspection(true);
            }}
            disabled={model.memberView}
          >
            <ShieldCheck />
            Test
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              ref={menuOpener}
              aria-label={`Open actions for ${provider.name}`}
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                inspectionOpener.current = menuOpener.current;
                setInspection(true);
              }}
            >
              Inspect local configuration
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={inspection} onOpenChange={setInspection}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            const target = inspectionOpener.current;
            if (target?.isConnected && target.getClientRects().length) {
              event.preventDefault();
              target.focus({ preventScroll: true });
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{provider.name} local check</DialogTitle>
            <DialogDescription>
              {validateStrataProviderUrl(provider.url) ||
                "The metadata URL has a valid HTTPS format. No request was sent and sign-in was not tested."}
            </DialogDescription>
          </DialogHeader>
          <code className="strata-settings-wrap-code">{provider.url}</code>
          <p className="text-sm text-muted-foreground">{provider.detail}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StrataSettingsRow>
  );
}

export function StrataSettingsSecurity({ model }: { model: SecurityModel }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [notice, setNotice] = useState("");
  const policyError = validateStrataSecurityPolicy(model.draft);
  const factorControl = (
    name: keyof StrataSecurityPolicy["factors"],
    label: string,
    description: string,
  ) => (
    <Field key={name} orientation="horizontal" className="strata-security-factor">
      <Switch
        id={`${id}-${name}`}
        checked={model.draft.factors[name]}
        onCheckedChange={(enabled) => model.setFactor(name, enabled)}
        disabled={model.memberView}
      />
      <FieldContent>
        <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
    </Field>
  );
  return (
    <section className="strata-settings-security" aria-label="Security settings">
      <StrataSettingsSection
        title="SSO & SCIM"
        description="Enterprise sign-in for bricklane.test"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => model.setMemberView(!model.memberView)}
          >
            <LockKeyhole />
            {model.memberView ? "Return to Admin view" : "View as Member"}
          </Button>
        }
        footer={
          <>
            <span className="strata-security-save-state" role="status">
              {policyError ||
                (model.dirty ? "Unsaved changes" : notice || "All changes saved in this preview")}
            </span>
            <div className="strata-settings-footer-actions">
              <Button
                variant="outline"
                disabled={!model.dirty || model.memberView}
                onClick={() => {
                  model.discard();
                  setNotice("");
                }}
              >
                Discard
              </Button>
              <Button
                disabled={!model.dirty || Boolean(policyError) || model.memberView}
                onClick={() => {
                  const result = model.save();
                  setNotice(result.ok ? "Saved in this preview" : result.error);
                }}
              >
                Save changes
              </Button>
            </div>
          </>
        }
      >
        <div className="strata-security-stack">
          <StrataSettingsSection
            title="Single Sign-On"
            description="84% coverage · 1 provider needs attention"
          >
            {model.providers.map((provider) => (
              <Provider key={provider.id} provider={provider} model={model} />
            ))}
          </StrataSettingsSection>
          <StrataSettingsSection
            title="SCIM Provisioning"
            description="Last sync 12 min ago · 57 members in scope"
          >
            <StrataSettingsRow
              id={`${id}-endpoint`}
              title="Endpoint URL"
              description="Point your identity provider at this SCIM v2 endpoint."
            >
              <div className="strata-security-value-copy">
                <Input id={`${id}-endpoint`} value={model.endpoint} readOnly />
                <CopySetting value={model.endpoint} label="SCIM endpoint URL" />
              </div>
            </StrataSettingsRow>
            <StrataSettingsRow
              id={`${id}-token`}
              title="Bearer token"
              description="Rotate the demo token locally. A real identity provider is not updated."
            >
              <div className="strata-security-token">
                <InputGroup>
                  <InputGroupInput
                    id={`${id}-token`}
                    readOnly
                    type={reveal && !model.memberView ? "text" : "password"}
                    value={model.token}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      disabled={model.memberView}
                      size="icon-xs"
                      aria-label={reveal ? "Hide bearer token" : "Reveal bearer token"}
                      onClick={() => setReveal(!reveal)}
                    >
                      {reveal && !model.memberView ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  variant="outline"
                  disabled={model.memberView}
                  onClick={() => {
                    model.rotateToken();
                    setNotice("Demo token rotated locally");
                  }}
                >
                  <RotateCw />
                  Rotate
                </Button>
              </div>
            </StrataSettingsRow>
            <StrataSettingsRow
              title="Mapped attributes"
              description="Attributes pushed from your directory on each sync."
            >
              <div className="strata-settings-badges">
                {["userName", "emails", "displayName", "title", "department"].map((attribute) => (
                  <Badge variant="outline" key={attribute}>
                    {attribute}
                  </Badge>
                ))}
              </div>
            </StrataSettingsRow>
          </StrataSettingsSection>
          <StrataSettingsSection
            title="Authentication Policy"
            description={`${model.draft.twoFactor === "Required" ? "2FA required" : "2FA optional"} · 78% of members enrolled`}
          >
            <StrataSettingsRow
              id={`${id}-2fa`}
              title="Require 2FA"
              description="Set whether members must add a second factor to sign in."
            >
              <StrataSettingsSelect
                id={`${id}-2fa`}
                label="Require 2FA"
                value={model.draft.twoFactor}
                options={STRATA_SECURITY_OPTIONS.twoFactor}
                onChange={(value) => model.update("twoFactor", value)}
                disabled={model.memberView}
              />
            </StrataSettingsRow>
            <StrataSettingsRow
              title="Allowed factors"
              description="Choose which second factors members may enroll."
            >
              <div role="group" aria-label="Allowed factors" className="strata-security-factors">
                {factors.map(([name, label, description]) =>
                  factorControl(name, label, description),
                )}
              </div>
            </StrataSettingsRow>
            <StrataSettingsRow
              id={`${id}-password`}
              title="Password policy"
              description="Minimum strength for members who still use a password."
            >
              <StrataSettingsSelect
                id={`${id}-password`}
                label="Password policy"
                value={model.draft.password}
                options={STRATA_SECURITY_OPTIONS.password}
                onChange={(value) => model.update("password", value)}
                disabled={model.memberView}
              />
            </StrataSettingsRow>
          </StrataSettingsSection>
          <StrataSettingsSection
            title="Session Policy"
            description={`Idle ${model.draft.idle} · sessions expire after ${model.draft.sessionLength}`}
          >
            <StrataSettingsRow
              id={`${id}-idle`}
              title="Idle timeout"
              description="Sign members out after this long without activity."
            >
              <StrataSettingsSelect
                id={`${id}-idle`}
                label="Idle timeout"
                value={model.draft.idle}
                options={STRATA_SECURITY_OPTIONS.idle}
                onChange={(value) => model.update("idle", value)}
                disabled={model.memberView}
              />
            </StrataSettingsRow>
            <StrataSettingsRow
              id={`${id}-length`}
              title="Max session length"
              description="Force a fresh sign-in once a session reaches this age."
            >
              <StrataSettingsSelect
                id={`${id}-length`}
                label="Max session length"
                value={model.draft.sessionLength}
                options={STRATA_SECURITY_OPTIONS.sessionLength}
                onChange={(value) => model.update("sessionLength", value)}
                disabled={model.memberView}
              />
            </StrataSettingsRow>
            <StrataSettingsRow
              title="Re-authentication"
              description="Add an extra check before high-risk changes."
            >
              <div role="group" aria-label="Re-authentication" className="strata-security-factors">
                {(
                  [
                    [
                      "reauthenticate",
                      "Force re-auth on sensitive actions",
                      "Re-prompt before role or billing changes.",
                    ],
                    [
                      "singleSession",
                      "One active session per member",
                      "Sign out other devices on new sign-in.",
                    ],
                  ] as const
                ).map(([name, label, description]) => (
                  <Field key={name} orientation="horizontal" className="strata-security-factor">
                    <Switch
                      id={`${id}-${name}`}
                      checked={model.draft[name]}
                      onCheckedChange={(enabled) => model.update(name, enabled)}
                      disabled={model.memberView}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
                      <FieldDescription>{description}</FieldDescription>
                    </FieldContent>
                  </Field>
                ))}
              </div>
            </StrataSettingsRow>
          </StrataSettingsSection>
          <StrataSettingsSection
            title="Allowed Email Domains"
            description={`${model.domains.filter((item) => item.status === "Verified fixture").length} verified fixture domains`}
          >
            <StrataSettingsRow
              title="Verified domains"
              description="Members with these email domains are matched to your org."
            >
              <div className="strata-settings-badges">
                {model.domains
                  .filter((item) => item.status === "Verified fixture")
                  .map((item) => (
                    <Badge key={item.name} variant="outline">
                      {item.name}
                    </Badge>
                  ))}
              </div>
            </StrataSettingsRow>
            <StrataSettingsRow
              id={`${id}-domain`}
              title="Add a domain"
              description="Verify ownership with a DNS TXT record before it goes live."
            >
              <form
                className="strata-security-domain"
                onSubmit={(event) => {
                  event.preventDefault();
                  const result = model.addDomain(domain);
                  if (result.ok) {
                    setDomain("");
                    setDomainError("");
                  } else setDomainError(result.error);
                }}
              >
                <Input
                  id={`${id}-domain`}
                  aria-label="Add a domain"
                  value={domain}
                  placeholder="team.bricklane.test"
                  onChange={(event) => {
                    setDomain(event.target.value);
                    setDomainError("");
                  }}
                  disabled={model.memberView}
                  aria-invalid={Boolean(domainError)}
                  aria-describedby={domainError ? `${id}-domain-error` : undefined}
                />
                <Button type="submit" variant="outline" disabled={model.memberView}>
                  Add domain
                </Button>
                {domainError && <FieldError id={`${id}-domain-error`}>{domainError}</FieldError>}
              </form>
            </StrataSettingsRow>
            {model.domains
              .filter((item) => item.status === "Pending verification")
              .map((item) => (
                <StrataSettingsRow
                  key={item.name}
                  title={item.name}
                  badge={<Badge variant="warning-light">Pending verification</Badge>}
                  description="Local draft only. No DNS ownership check has been performed."
                >
                  <code className="strata-settings-wrap-code">{item.record}</code>
                </StrataSettingsRow>
              ))}
          </StrataSettingsSection>
        </div>
        <p className="strata-settings-local-note">
          Local security preview. Policies and demo credentials are not applied to real members or
          identity providers.
        </p>
      </StrataSettingsSection>
    </section>
  );
}
