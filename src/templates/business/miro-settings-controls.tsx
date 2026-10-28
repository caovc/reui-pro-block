import type { ReactNode } from "react";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import {
  SettingsChoice,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  miroAlertTypes,
  miroChairColors,
  miroPaymentTerms,
  miroProcedures,
  type MiroChairColor,
} from "./miro-settings-data";
import type { MiroSettingsModel } from "./miro-settings-model";

export function MiroSettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Frame className="miro-settings-card">
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
        <FrameDescription>{description}</FrameDescription>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
      {footer && <FrameFooter className="miro-settings-actions flex-row">{footer}</FrameFooter>}
    </Frame>
  );
}
const hourLabel = (hour: number) => `${hour % 12 || 12}:00 ${hour % 24 < 12 ? "am" : "pm"}`;
const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export function MiroHoursSettings({ model }: { model: MiroSettingsModel }) {
  const opens = Array.from({ length: 24 }, (_, hour) => hourLabel(hour));
  const closes = Array.from({ length: 24 - model.hours.opens }, (_, index) =>
    hourLabel(model.hours.opens + index + 1),
  );
  return (
    <MiroSettingsCard
      title="Opening hours"
      description="The opening and closing hours shown on your appointment calendars."
    >
      <SettingsRow
        id="miro-opens"
        title="Opens"
        description="The first hour on the board, and where it scrolls to."
        className="miro-setting-compact"
      >
        <SettingsChoice
          id="miro-opens"
          value={hourLabel(model.hours.opens)}
          options={opens}
          onChange={(label) => model.setOpeningHour(opens.indexOf(label))}
          describedBy="miro-opens-description"
        />
      </SettingsRow>
      <SettingsRow
        id="miro-closes"
        title="Closes"
        description="The last hour drawn. Only hours after opening are offered, so the day cannot invert."
        className="miro-setting-compact"
      >
        <SettingsChoice
          id="miro-closes"
          value={hourLabel(model.hours.closes)}
          options={closes}
          onChange={(label) => model.setClosingHour(model.hours.opens + closes.indexOf(label) + 1)}
          describedBy="miro-closes-description"
        />
      </SettingsRow>
    </MiroSettingsCard>
  );
}
export function MiroChairsSettings({ model }: { model: MiroSettingsModel }) {
  return (
    <MiroSettingsCard
      title="Chairs"
      description={`${model.chairs.filter((chair) => chair.visible).length} of ${model.chairs.length} on the board.`}
    >
      {model.chairs.map((chair) => (
        <SettingsRow
          key={chair.id}
          title={chair.name}
          description={chair.specialty}
          className="miro-chair-row"
        >
          <Select
            value={chair.color}
            onValueChange={(color) =>
              model.updateChair(chair.id, { color: color as MiroChairColor })
            }
          >
            <SelectTrigger aria-label={`Colour for ${chair.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              {miroChairColors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Switch
            aria-label={chair.name}
            checked={chair.visible}
            onCheckedChange={(visible) => model.updateChair(chair.id, { visible })}
          />
        </SettingsRow>
      ))}
    </MiroSettingsCard>
  );
}
export function MiroProcedureSettings({ model }: { model: MiroSettingsModel }) {
  return (
    <form
      aria-label="Procedure prices"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        model.savePrices();
      }}
    >
      <MiroSettingsCard
        title="Procedures"
        description="Maintain the treatment price list for your practice."
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={model.resetPrices}>
              Reset to list price
            </Button>
            <Button type="submit" size="sm">
              Save prices
            </Button>
          </>
        }
      >
        {miroProcedures.map((procedure) => (
          <SettingsRow
            key={procedure.id}
            id={`miro-price-${procedure.id}`}
            title={procedure.name}
            description={`${procedure.minutes} minutes in the chair`}
            invalid={Boolean(model.priceErrors[procedure.id])}
            className="miro-setting-compact"
          >
            <InputGroup className="miro-price-input">
              <InputGroupAddon>$</InputGroupAddon>
              <NumberField
                id={`miro-price-${procedure.id}`}
                value={model.pricesDraft[procedure.id]}
                min={0}
                step={1}
                format={{ maximumFractionDigits: 2 }}
                onValueChange={(value) => model.setPrice(procedure.id, value)}
              >
                <NumberFieldGroup>
                  <NumberFieldInput
                    id={`miro-price-${procedure.id}`}
                    aria-label={procedure.name}
                    aria-invalid={Boolean(model.priceErrors[procedure.id])}
                    aria-describedby={`miro-price-${procedure.id}-description${model.priceErrors[procedure.id] ? ` miro-price-${procedure.id}-error` : ""}`}
                  />
                </NumberFieldGroup>
              </NumberField>
            </InputGroup>
            {model.priceErrors[procedure.id] && (
              <FieldError id={`miro-price-${procedure.id}-error`}>
                {model.priceErrors[procedure.id]}
              </FieldError>
            )}
          </SettingsRow>
        ))}
      </MiroSettingsCard>
    </form>
  );
}
export function MiroBillingSettings({ model }: { model: MiroSettingsModel }) {
  const summary = model.invoiceSummary;
  const labels = miroPaymentTerms.map((days) => (days === 0 ? "Due on receipt" : `Net ${days}`));
  return (
    <MiroSettingsCard
      title="Billing"
      description="The terms every invoice is raised on and aged against."
    >
      <SettingsRow
        id="miro-payment-terms"
        title="Payment terms"
        description="Counted from the day the chair ran. Changing it re-ages every invoice in the ledger."
        className="miro-setting-compact"
      >
        <SettingsChoice
          id="miro-payment-terms"
          value={model.paymentTerms === 0 ? "Due on receipt" : `Net ${model.paymentTerms}`}
          options={labels}
          describedBy="miro-payment-terms-description"
          onChange={(value) => model.setPaymentTerms(miroPaymentTerms[labels.indexOf(value)])}
        />
      </SettingsRow>
      <SettingsRow
        title="Outstanding today"
        description="What these terms leave unpaid across the whole ledger."
        className="miro-setting-summary"
      >
        <span>
          {dollars(summary.outstanding)} over {summary.outstandingCount} invoices
        </span>
      </SettingsRow>
      <SettingsRow
        title="Past due today"
        description="Invoices these terms have already made late."
        className="miro-setting-summary"
      >
        <span>
          {summary.pastDueCount
            ? `${dollars(summary.pastDue)} over ${summary.pastDueCount} invoices`
            : "None"}
        </span>
      </SettingsRow>
    </MiroSettingsCard>
  );
}
export function MiroNotificationSettings({ model }: { model: MiroSettingsModel }) {
  return (
    <MiroSettingsCard
      title="Activity alerts"
      description="The board logs every one of these. Choose which reach the bell."
    >
      {miroAlertTypes.map((alert) => (
        <SettingsRow
          key={alert.id}
          id={`miro-alert-${alert.id}`}
          title={alert.label}
          description={alert.description}
          className="miro-alert-row"
        >
          <span>{model.activityCounts[alert.id]} so far</span>
          <Switch
            id={`miro-alert-${alert.id}`}
            checked={model.alerts[alert.id]}
            onCheckedChange={(value) => model.setAlert(alert.id, value)}
          />
        </SettingsRow>
      ))}
    </MiroSettingsCard>
  );
}
