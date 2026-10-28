import { Fragment, useId, useRef, useState, type FormEvent } from "react";
import { Ellipsis, MapPin, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import {
  commerceLocationTypes,
  type CommerceLocation,
  type CommerceSupplier,
} from "./commerce-settings-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";

type RecordKind = "locations" | "suppliers";
type RecordDraft = {
  id?: number;
  name: string;
  email: string;
  address: string;
  type: string;
  active: boolean;
};
const emptyDraft = (): RecordDraft => ({
  name: "",
  email: "",
  address: "",
  type: "Warehouse",
  active: true,
});

/** Settings-local record CRUD; the stock links belong to this model, not merchant inventory. */
export function CommerceRecordsSettings({
  kind,
  model,
}: {
  kind: RecordKind;
  model: CommerceSettingsModel;
}) {
  const [draft, setDraft] = useState<RecordDraft | null>(null);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<CommerceLocation | CommerceSupplier | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const createButton = useRef<HTMLButtonElement | null>(null);
  const recordButtons = useRef(new Map<number, HTMLButtonElement>());
  const openingDialog = useRef(false);
  const generated = useId();
  const isLocation = kind === "locations";
  const singular = isLocation ? "location" : "supplier";
  const title = isLocation ? "Locations" : "Suppliers";
  const rows = isLocation ? model.locations : model.suppliers;

  function edit(record: CommerceLocation | CommerceSupplier) {
    openingDialog.current = true;
    setError("");
    setDraft({ ...emptyDraft(), ...record });
  }
  function restoreFocus(event: Event) {
    const target = opener.current?.isConnected ? opener.current : createButton.current;
    opener.current = null;
    if (!target || target.disabled) return;
    target.focus();
    if (target.ownerDocument.activeElement === target) event.preventDefault();
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const failure = isLocation
      ? model.saveLocation(
          { name: draft.name, type: draft.type, address: draft.address, active: draft.active },
          draft.id,
        )
      : model.saveSupplier(
          { name: draft.name, email: draft.email, active: draft.active },
          draft.id,
        );
    if (failure) setError(failure);
    else setDraft(null);
  }
  function change(patch: Partial<RecordDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setError("");
  }

  return (
    <>
      <header className="csd-page-heading">
        <h1>{title}</h1>
        <Button
          ref={createButton}
          onClick={(event) => {
            opener.current = event.currentTarget;
            setError("");
            setDraft(emptyDraft());
          }}
        >
          <Plus aria-hidden="true" />
          New {singular}
        </Button>
      </header>
      <Frame dense className="csd-frame csd-records-frame">
        <FramePanel fit className="csd-fit-panel">
          <div className="csd-record-heading">
            <span>{isLocation ? "Location" : "Supplier"}</span>
            <span>{isLocation ? "Stock" : "Sourced"}</span>
          </div>
          <ItemGroup className="csd-record-list">
            {rows.map((record, index) => (
              <Fragment key={record.id}>
                {index > 0 && <ItemSeparator />}
                <Item role="listitem">
                  <ItemMedia variant="icon" className="csd-record-icon">
                    {isLocation ? <MapPin aria-hidden="true" /> : <Package aria-hidden="true" />}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {record.name}
                      {!record.active && <Badge variant="secondary">Inactive</Badge>}
                    </ItemTitle>
                    <ItemDescription>
                      {"type" in record
                        ? `${record.type}${record.address ? ` · ${record.address}` : ""}`
                        : record.email || "No contact email"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="secondary">{model.stockCount(kind, record.id)} SKUs</Badge>
                    <DropdownMenu
                      onOpenChange={(open) => {
                        if (open) opener.current = recordButtons.current.get(record.id) ?? null;
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Actions for ${record.name}`}
                          ref={(button) => {
                            if (button) recordButtons.current.set(record.id, button);
                            else recordButtons.current.delete(record.id);
                          }}
                        >
                          <Ellipsis aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="reui-reference"
                        onCloseAutoFocus={(event) => {
                          const handoff = openingDialog.current;
                          openingDialog.current = false;
                          if (handoff) event.preventDefault();
                        }}
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuItem onSelect={() => edit(record)}>
                            <Pencil aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              if ("type" in record)
                                model.saveLocation(
                                  { ...record, active: !record.active },
                                  record.id,
                                );
                              else
                                model.saveSupplier(
                                  { ...record, active: !record.active },
                                  record.id,
                                );
                            }}
                          >
                            {record.active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              openingDialog.current = true;
                              setRemoving(record);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </Item>
              </Fragment>
            ))}
          </ItemGroup>
          {rows.length === 0 && (
            <p className="csd-empty">
              No {kind} yet. Add your first {singular}.
            </p>
          )}
        </FramePanel>
      </Frame>
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="reui-reference csd-record-dialog" onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>
              {draft?.id === undefined ? "New" : "Edit"} {singular}
            </DialogTitle>
            <DialogDescription>
              {isLocation
                ? "Locations describe where sample stock sits."
                : "Suppliers describe who supplies sample stock."}{" "}
              Renaming keeps this preview’s sample links. Existing store inventory is not connected.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`${generated}-name`}>Name</FieldLabel>
                  <Input
                    id={`${generated}-name`}
                    value={draft.name}
                    maxLength={100}
                    placeholder={isLocation ? "e.g. Meadow Dispatch" : "e.g. Oakbound Trading"}
                    onChange={(event) => change({ name: event.target.value })}
                    aria-describedby={error ? `${generated}-error` : undefined}
                    aria-invalid={Boolean(error && !error.toLowerCase().includes("email"))}
                  />
                </Field>
                {isLocation ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor={`${generated}-type`}>Type</FieldLabel>
                      <SettingsChoice
                        id={`${generated}-type`}
                        value={draft.type}
                        options={commerceLocationTypes}
                        onChange={(type) => change({ type })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`${generated}-address`}>Address</FieldLabel>
                      <Input
                        id={`${generated}-address`}
                        value={draft.address}
                        maxLength={240}
                        placeholder="e.g. 42 Meadow Road, Richmond, VA"
                        onChange={(event) => change({ address: event.target.value })}
                      />
                    </Field>
                  </>
                ) : (
                  <Field>
                    <FieldLabel htmlFor={`${generated}-email`}>Contact email</FieldLabel>
                    <Input
                      id={`${generated}-email`}
                      type="email"
                      aria-invalid={Boolean(error && error.toLowerCase().includes("email"))}
                      aria-describedby={error ? `${generated}-error` : undefined}
                      value={draft.email}
                      maxLength={160}
                      placeholder="e.g. orders@oakbound.example"
                      onChange={(event) => change({ email: event.target.value })}
                    />
                  </Field>
                )}
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={`${generated}-active`}>Active</FieldLabel>
                    <FieldDescription id={`${generated}-active-description`}>
                      Inactive {kind} retain their sample stock links but are excluded from new
                      assignments.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id={`${generated}-active`}
                    aria-label={`${isLocation ? "Location" : "Supplier"} is active`}
                    aria-describedby={`${generated}-active-description`}
                    checked={draft.active}
                    onCheckedChange={(active) => change({ active })}
                  />
                </Field>
                {error && <FieldError id={`${generated}-error`}>{error}</FieldError>}
              </FieldGroup>
              <DialogFooter className="mt-5">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {draft.id === undefined ? "Create" : "Save"} {singular}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent className="reui-reference" onCloseAutoFocus={restoreFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the {singular} from this local preview. Its sample stock becomes
              unassigned; the store product inventory is unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removing) return;
                if (isLocation) model.removeLocation(removing.id);
                else model.removeSupplier(removing.id);
                setRemoving(null);
              }}
            >
              Remove {singular}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
