import type { ReactNode } from "react";
import { CreditCard, Check } from "lucide-react";
import { SettingsRow } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import type { VervePeopleBillingModel } from "./verve-settings-people-billing-model";

/** The actual free Sheet supplies modal, native trigger/close/Escape and focus behavior. */
export function VerveSettingsSheet({
  title,
  description,
  children,
  footer,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <SheetContent className={`vp-sheet reui-reference ${className}`}>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <div className="vp-sheet-body">{children}</div>
      <SheetFooter>{footer}</SheetFooter>
    </SheetContent>
  );
}
export function VerveCompanyCard({
  model,
  entry,
  children,
}: {
  model: VervePeopleBillingModel;
  entry: "alert" | "details";
  children: ReactNode;
}) {
  const draft = model.cardDraft;
  const formId = `verve-company-card-${entry}`;
  function field(
    id: "holder" | "number" | "expiry" | "cvc" | "zip",
    title: string,
    placeholder: string,
  ) {
    return (
      <SettingsRow id={`${formId}-${id}`} title={title} invalid={Boolean(model.cardErrors[id])}>
        <Input
          id={`${formId}-${id}`}
          value={draft[id]}
          onChange={(event) => model.updateCard(id, event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          inputMode={id === "number" || id === "cvc" ? "numeric" : "text"}
          maxLength={id === "number" ? 23 : id === "expiry" ? 5 : id === "cvc" ? 4 : 120}
          aria-invalid={Boolean(model.cardErrors[id])}
          aria-describedby={model.cardErrors[id] ? `${formId}-${id}-error` : undefined}
        />
        {model.cardErrors[id] && (
          <FieldError id={`${formId}-${id}-error`}>{model.cardErrors[id]}</FieldError>
        )}
      </SettingsRow>
    );
  }
  return (
    <Sheet
      open={model.cardEntry === entry}
      onOpenChange={(open) => (open ? model.openCard(entry) : model.closeCard())}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <VerveSettingsSheet
        className="vp-card-sheet"
        title="Add company card"
        description="Save a card so renewal and receipts continue."
        footer={
          <>
            <SheetClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" form={formId}>
              <CreditCard aria-hidden />
              Add card
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            model.saveCard();
          }}
        >
          <div className="vp-demo-card" aria-label="Demo card preview">
            <span className="vp-card-chip" aria-hidden />
            <span>Card</span>
            <strong>
              {draft.number
                ? draft.number
                    .replaceAll(/\s/g, "")
                    .replace(/(.{4})/g, "$1 ")
                    .trim()
                : "•••• •••• •••• ••••"}
            </strong>
            <small>{draft.holder || "CARDHOLDER NAME"}</small>
            <small>{draft.expiry || "MM/YY"}</small>
          </div>
          {field("holder", "Cardholder name", "e.g. Ava Mercer")}
          {field("number", "Card number", "1234 5678 9012 3456")}
          <div className="vp-card-fields-grid">
            {field("expiry", "Expiry", "MM/YY")}
            {field("cvc", "CVC", "123")}
          </div>
          {field("zip", "Billing ZIP", "Postal code")}
          <SettingsRow
            id={`${formId}-default`}
            title="Set as default payment method"
            description="Renewals and receipts will use this card."
            className="vp-switch-row"
          >
            <Switch
              id={`${formId}-default`}
              checked={draft.isDefault}
              onCheckedChange={(value) => model.updateCard("isDefault", value)}
              aria-describedby={`${formId}-default-description`}
            />
          </SettingsRow>
          <FieldDescription className="vp-card-demo-note">
            Demo only — no real card is stored.
          </FieldDescription>
        </form>
      </VerveSettingsSheet>
    </Sheet>
  );
}
export function VerveSaveIcon() {
  return <Check aria-hidden />;
}
