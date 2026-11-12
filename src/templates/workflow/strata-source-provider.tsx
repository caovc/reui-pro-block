import { useId, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Circle, Info, PlugZap, Search } from "lucide-react";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { STRATA_OWNERS, type StrataEnvironment } from "./strata-domain";
import {
  STRATA_SOURCE_PROVIDERS,
  backStrataSourceSetup,
  continueStrataSourceSetup,
  createStrataSourceSetup,
  searchStrataSourceProviders,
  validateStrataNeonDraft,
  type StrataNeonDraft,
} from "./strata-source-providers";

/** The observed Source and Neon Configure steps. No connection or Datasets step is simulated. */
export function StrataSourceProviderSetup() {
  const [state, setState] = useState(createStrataSourceSetup);
  const [checkedLocally, setCheckedLocally] = useState(false);
  const [requiredProvider, setRequiredProvider] = useState(false);
  const id = useId();
  const selected = STRATA_SOURCE_PROVIDERS.find((provider) => provider.id === state.providerId);
  const providers = searchStrataSourceProviders(state.search);
  const errors = validateStrataNeonDraft(state.neon);
  const canCheck = Object.keys(errors).length === 0;
  const unknownConfiguration = !!selected && selected.id !== "neon";
  const update = <K extends keyof StrataNeonDraft>(key: K, value: StrataNeonDraft[K]) => {
    setState((current) => ({ ...current, neon: { ...current.neon, [key]: value } }));
    setCheckedLocally(false);
  };
  return (
    <>
      <SheetHeader>
        <SheetTitle>New Source</SheetTitle>
        <SheetDescription>
          {state.step === 1 ? "Pick what to connect." : "Point it at your account."}
        </SheetDescription>
        <Stepper
          value={state.step}
          onValueChange={(step) => {
            if (step === 1) setState(backStrataSourceSetup);
          }}
          aria-label="New source steps"
          className="strata-source-setup-steps"
          indicators={{ completed: <Check className="size-3.5" /> }}
        >
          <StepperNav>
            {["Source", "Configure", "Datasets"].map((title, index) => (
              <StepperItem key={title} step={index + 1} disabled={index + 1 > state.step}>
                <StepperTrigger>
                  <StepperIndicator>{index + 1}</StepperIndicator>
                  <StepperTitle>{title}</StepperTitle>
                </StepperTrigger>
                {index < 2 && <StepperSeparator />}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>
      </SheetHeader>
      <div
        className="strata-source-setup-scroll"
        role="tabpanel"
        id={`stepper-panel-${state.step}`}
        aria-labelledby={`stepper-tab-${state.step}`}
      >
        {state.step === 1 ? (
          <>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search integrations"
                placeholder="Search integrations..."
                value={state.search}
                onChange={(event) =>
                  setState((current) => ({ ...current, search: event.target.value }))
                }
                autoFocus
              />
            </InputGroup>
            <div className="strata-source-provider-grid" aria-label="Source integrations">
              {providers.map((provider) => (
                <Item
                  key={provider.id}
                  variant="outline"
                  size="xs"
                  asChild
                  className="strata-source-provider-card"
                >
                  <button
                    type="button"
                    aria-pressed={state.providerId === provider.id}
                    onClick={() => {
                      setRequiredProvider(false);
                      setState((current) => ({ ...current, providerId: provider.id }));
                    }}
                  >
                    <ItemMedia>
                      <span className="strata-source-provider-mark" aria-hidden="true">
                        {provider.name.replace(/[^A-Z]/g, "").slice(0, 2)}
                      </span>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{provider.name}</ItemTitle>
                      <ItemDescription>{provider.technology}</ItemDescription>
                    </ItemContent>
                  </button>
                </Item>
              ))}
            </div>
            {!providers.length && (
              <p className="strata-source-provider-empty" role="status">
                No integrations match your search.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="strata-source-selected-provider">
              <span className="strata-source-provider-mark" aria-hidden="true">
                N
              </span>
              <div>
                <strong>Neon</strong>
                <p>Postgres, Database</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setState(backStrataSourceSetup)}>
                Change
              </Button>
            </div>
            <FieldSet>
              <FieldLegend>Source</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
                  <Input
                    id={`${id}-name`}
                    placeholder="neon-production"
                    value={state.neon.name}
                    onChange={(event) => update("name", event.target.value)}
                    autoComplete="off"
                  />
                </Field>
                <Field>
                  <FieldLabel>Environment</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    aria-label="Environment"
                    value={state.neon.environment}
                    onValueChange={(value) =>
                      value && update("environment", value as StrataEnvironment)
                    }
                  >
                    {["Production", "Staging", "Sandbox"].map((value) => (
                      <ToggleGroupItem key={value} value={value}>
                        {value}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-host`}>Host</FieldLabel>
                  <Input
                    id={`${id}-host`}
                    placeholder="ep-name.us-east-1.aws.neon.tech"
                    value={state.neon.host}
                    onChange={(event) => update("host", event.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
                  <Input
                    id={`${id}-password`}
                    type="password"
                    value={state.neon.password}
                    onChange={(event) => update("password", event.target.value)}
                    autoComplete="new-password"
                  />
                  <FieldDescription>
                    Uses strata_sync. Credentials stay in this local form and are not sent to a
                    service.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Sync</FieldLegend>
              <FieldGroup>
                <div className="strata-source-sync-fields">
                  <Field>
                    <FieldLabel htmlFor={`${id}-frequency`}>Frequency</FieldLabel>
                    <Select
                      value={state.neon.frequency}
                      onValueChange={() => update("frequency", "every-15m")}
                    >
                      <SelectTrigger id={`${id}-frequency`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every-15m">Every 15 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-owner`}>Owner</FieldLabel>
                    <Select
                      value={state.neon.ownerId}
                      onValueChange={(value) => update("ownerId", value)}
                    >
                      <SelectTrigger id={`${id}-owner`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STRATA_OWNERS.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field orientation="horizontal">
                  <div>
                    <FieldLabel htmlFor={`${id}-alert`}>Alert on failure</FieldLabel>
                    <FieldDescription>
                      Notifies #sre-oncall after three failed runs in a row.
                    </FieldDescription>
                  </div>
                  <Switch
                    id={`${id}-alert`}
                    checked={state.neon.alertOnFailure}
                    onCheckedChange={(value) => update("alertOnFailure", value)}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <Frame dense className="strata-source-connection-test">
              <FrameHeader>
                <FrameTitle>Connection Test</FrameTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Network, sign in and read access"
                    >
                      <Info />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    This local demo validates the fields without contacting Neon.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canCheck}
                      onClick={() => setCheckedLocally(true)}
                    >
                      <PlugZap />
                      Test Connection
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Validate locally; no network connection is made.</TooltipContent>
                </Tooltip>
              </FrameHeader>
              <FramePanel>
                <ul>
                  {["Reach Neon", "Authenticate", "Read datasets"].map((name) => (
                    <li key={name}>
                      <Circle />
                      <div>
                        <strong>{name}</strong>
                        <p>Not run yet</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </FramePanel>
            </Frame>
            {checkedLocally && (
              <p className="strata-source-local-check" role="status">
                Local configuration is valid. Network access, authentication and datasets have not
                been tested.
              </p>
            )}
          </>
        )}
      </div>
      <SheetFooter className="strata-source-setup-footer">
        <div>
          {requiredProvider ? (
            <FieldError>Pick an integration to continue</FieldError>
          ) : (
            <p>
              {state.step === 2
                ? checkedLocally
                  ? "Configuration checked locally; no connection was made"
                  : "Fill in the source to test it"
                : unknownConfiguration
                  ? "Neon configuration is available in this local demo"
                  : "Pick an integration to continue"}
            </p>
          )}
        </div>
        {state.step === 1 ? (
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        ) : (
          <Button variant="outline" onClick={() => setState(backStrataSourceSetup)}>
            <ChevronLeft />
            Back
          </Button>
        )}
        <Button
          disabled={state.step === 2 || unknownConfiguration}
          onClick={() => {
            if (!selected) setRequiredProvider(true);
            else setState(continueStrataSourceSetup);
          }}
        >
          Continue
          <ChevronRight />
        </Button>
      </SheetFooter>
    </>
  );
}
