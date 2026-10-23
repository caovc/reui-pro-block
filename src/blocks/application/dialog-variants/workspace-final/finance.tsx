import { useRef, useState } from "react";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DialogLauncher } from "../first-run/support";

const defaults = { name: "Cedar Operating", tag: "cedar_ops", statement: "CEDAR STUDIO" };
export default function FinanceAccountDialog() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(defaults);
  const [saved, setSaved] = useState<typeof defaults | null>(null);
  const [disclosures, setDisclosures] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const displayName = draft.name.trim() || defaults.name;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={11}
        title="Finance account setup"
        description="Preview an account identity before saving a local draft."
        icon={<Landmark />}
        action="Open finance account setup"
        result={
          saved && (
            <span>
              {saved.name} · acct_{saved.tag} · {saved.statement}. Local identity draft only; no
              financial account was opened and no money was moved.
            </span>
          )
        }
      >
        <div className="flex flex-col gap-2">
          <strong>{defaults.name}</strong>
          <p className="text-sm text-muted-foreground">
            Account identity, tag and statement label.
          </p>
        </div>
      </DialogLauncher>
      <DialogContent
        className="final-finance-dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nameInput.current?.focus();
        }}
      >
        <div className="final-finance-form">
          <header className="flex flex-col gap-2">
            <DialogTitle>Create your finance account</DialogTitle>
            <DialogDescription>
              Set the account identity used for payouts and transfers.
            </DialogDescription>
          </header>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="finance-account-name">Account name</FieldLabel>
              <Input
                ref={nameInput}
                id="finance-account-name"
                value={draft.name}
                maxLength={60}
                onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="finance-account-tag">Account tag</FieldLabel>
              <InputGroup>
                <InputGroupAddon>acct_</InputGroupAddon>
                <InputGroupInput
                  id="finance-account-tag"
                  value={draft.tag}
                  maxLength={22}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      tag: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 22),
                    }))
                  }
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="finance-statement-label">Statement label</FieldLabel>
              <Input
                id="finance-statement-label"
                value={draft.statement}
                maxLength={18}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    statement: event.target.value.toUpperCase().slice(0, 18),
                  }))
                }
              />
            </Field>
          </FieldGroup>
          <div className="final-finance-mobile-preview" />
          <footer className="final-finance-footer">
            <Button
              variant="link"
              className="justify-start px-0"
              onClick={() => setDisclosures((value) => !value)}
            >
              Terms &amp; disclosures
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Not now</Button>
              </DialogClose>
              <Button
                disabled={!draft.name.trim() || !draft.tag.trim() || !draft.statement.trim()}
                onClick={() => {
                  setSaved({ ...draft });
                  setOpen(false);
                }}
              >
                Create account
              </Button>
            </div>
          </footer>
          {disclosures && (
            <p className="text-xs text-muted-foreground" role="status">
              Bricklane demonstration only. This form stores a local identity draft. The displayed
              balance, account type and routing reference are fictional preview data, not a banking
              offer or agreement.
            </p>
          )}
        </div>
        <aside className="final-finance-art" aria-label="Live account preview">
          <Card className="w-full gap-5 bg-card/95 shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background text-sm font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <CardTitle className="break-words text-base">{displayName}</CardTitle>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  acct_{draft.tag || defaults.tag}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="text-xs text-muted-foreground">Available balance</p>
                <p className="mt-1 text-2xl font-semibold">$86,240.00</p>
              </div>
              <dl className="flex flex-col gap-4 border-t pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Account type</dt>
                  <dd>USD operating</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Statement label</dt>
                  <dd className="break-all text-right">{draft.statement || defaults.statement}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Routing</dt>
                  <dd>DEMO-000021</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </DialogContent>
    </Dialog>
  );
}
