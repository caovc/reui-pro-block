import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { STRATA_OWNERS, STRATA_SERVICES } from "./strata-domain";
import {
  SLO_OBJECTIVES,
  SLO_WINDOWS,
  sloOutageAllowanceSeconds,
  sloRequestAllowance,
  type SloIndicator,
  type SloWindowDays,
  type StrataSloDraft,
} from "./strata-slo-engine";
import { strataSloDailyRequests, type useStrataServicesModel } from "./strata-services-model";

type ServicesModel = ReturnType<typeof useStrataServicesModel>;

function defaultDraft(): StrataSloDraft {
  return {
    name: "",
    serviceId: "checkout-api",
    ownerId: STRATA_OWNERS[0].id,
    indicator: "availability",
    goodEvent: "",
    objectivePct: 99.9,
    windowDays: 28,
    alertsEnabled: true,
    fastBurnEnabled: true,
    slowBurnEnabled: true,
  };
}

function formatAllowance(seconds: number): string {
  const value = Math.floor(seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = value % 60;
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : "", `${rest}s`]
    .filter(Boolean)
    .join(" ");
}

/** Real free Field/Select/ToggleGroup/Switch composition inside the native Sheet. */
export function StrataSloForm({
  model,
  onCreated,
}: {
  model: ServicesModel;
  onCreated: (id: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof StrataSloDraft, string>>>({});
  const fieldId = (name: string) => `strata-slo-${id}-${name}`;
  const update = <K extends keyof StrataSloDraft>(field: K, value: StrataSloDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const allowance = formatAllowance(
    sloOutageAllowanceSeconds(draft.objectivePct, draft.windowDays),
  );
  const requests = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(
    sloRequestAllowance(
      draft.objectivePct,
      draft.windowDays,
      strataSloDailyRequests(draft.serviceId),
    ),
  );
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(defaultDraft());
          setErrors({});
        }
        setOpen(next);
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus />
          New SLO
        </Button>
      </SheetTrigger>
      <SheetContent className="strata-slo-sheet" aria-describedby={fieldId("description")}>
        <SheetHeader>
          <SheetTitle>New SLO</SheetTitle>
          <SheetDescription id={fieldId("description")}>
            Set an objective for a Bricklane Core service.
          </SheetDescription>
        </SheetHeader>
        <form
          className="strata-slo-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const result = model.createSlo(draft);
            if (!result.ok) {
              setErrors(result.errors);
              return;
            }
            onCreated(result.definition.id);
            setOpen(false);
            toast.success(`${result.definition.name} created`);
          }}
        >
          <div className="strata-slo-form-body">
            <FieldSet>
              <FieldLegend>Definition</FieldLegend>
              <FieldGroup className="strata-slo-definition-grid">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor={fieldId("name")}>Name</FieldLabel>
                  <Input
                    id={fieldId("name")}
                    value={draft.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Checkout API availability"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? fieldId("name-error") : undefined}
                  />
                  {errors.name && <FieldError id={fieldId("name-error")}>{errors.name}</FieldError>}
                </Field>
                <Field>
                  <FieldLabel htmlFor={fieldId("service")}>Service</FieldLabel>
                  <Select
                    value={draft.serviceId}
                    onValueChange={(value) => update("serviceId", value)}
                  >
                    <SelectTrigger id={fieldId("service")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="strata-slo-popup">
                      {STRATA_SERVICES.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceId && <FieldError>{errors.serviceId}</FieldError>}
                </Field>
                <Field>
                  <FieldLabel htmlFor={fieldId("indicator")}>Indicator</FieldLabel>
                  <Select
                    value={draft.indicator}
                    onValueChange={(value) => update("indicator", value as SloIndicator)}
                  >
                    <SelectTrigger id={fieldId("indicator")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="strata-slo-popup">
                      <SelectItem value="availability">Availability</SelectItem>
                      <SelectItem value="latency">Latency</SelectItem>
                      <SelectItem value="freshness">Freshness</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="strata-slo-wide-field">
                  <FieldLabel htmlFor={fieldId("good-event")}>Good Event</FieldLabel>
                  <Textarea
                    id={fieldId("good-event")}
                    value={draft.goodEvent}
                    onChange={(event) => update("goodEvent", event.target.value)}
                    placeholder="Share of requests answered without a 5xx"
                    rows={2}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Target</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel id={fieldId("objective-label")}>Objective</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    size="sm"
                    value={String(draft.objectivePct)}
                    onValueChange={(value) => value && update("objectivePct", Number(value))}
                    aria-labelledby={fieldId("objective-label")}
                    className="strata-slo-choice-row"
                  >
                    {SLO_OBJECTIVES.map((objective) => (
                      <ToggleGroupItem key={objective} value={String(objective)}>
                        {objective}%
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <Field>
                  <FieldLabel id={fieldId("window-label")}>Rolling Window</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    size="sm"
                    value={String(draft.windowDays)}
                    onValueChange={(value) =>
                      value && update("windowDays", Number(value) as SloWindowDays)
                    }
                    aria-labelledby={fieldId("window-label")}
                    className="strata-slo-choice-row"
                  >
                    {SLO_WINDOWS.map((days) => (
                      <ToggleGroupItem key={days} value={String(days)}>
                        {days} days
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <p className="strata-slo-allowance" aria-live="polite">
                  Allows <strong>{allowance}</strong> of full outage, or about{" "}
                  <strong>{requests} requests</strong> failing, every {draft.windowDays} days.
                </p>
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Alerting</FieldLegend>
              <FieldGroup>
                {(
                  [
                    ["alertsEnabled", "Burn alerts", "Notifies #sre-oncall."],
                    [
                      "fastBurnEnabled",
                      "Page on fast burn",
                      "Over 14.4× for 1 hour or 6× for 6 hours.",
                    ],
                    ["slowBurnEnabled", "Ticket on slow burn", "Over 1× for 3 days."],
                  ] as const
                ).map(([key, label, description]) => (
                  <Field key={key} orientation="horizontal" className="strata-slo-switch-row">
                    <div>
                      <FieldLabel htmlFor={fieldId(key)}>{label}</FieldLabel>
                      <FieldDescription>{description}</FieldDescription>
                    </div>
                    <Switch
                      id={fieldId(key)}
                      checked={draft[key]}
                      onCheckedChange={(checked) => update(key, checked)}
                      disabled={key !== "alertsEnabled" && !draft.alertsEnabled}
                    />
                  </Field>
                ))}
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend>Ownership</FieldLegend>
              <Field>
                <FieldLabel htmlFor={fieldId("owner")}>Owner</FieldLabel>
                <Select value={draft.ownerId} onValueChange={(value) => update("ownerId", value)}>
                  <SelectTrigger id={fieldId("owner")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="strata-slo-popup">
                    {STRATA_OWNERS.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ownerId && <FieldError>{errors.ownerId}</FieldError>}
              </Field>
            </FieldSet>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit">
              <Plus />
              Create SLO
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
