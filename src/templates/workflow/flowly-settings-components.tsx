// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt (included in project exports).
import { useRef, type ReactNode, type RefObject } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";

/** Controlled adaptation of official free c-sheet-1, retaining native focus/close/portal semantics. */
export function SettingsDrawer({
  title,
  description,
  children,
  footer,
  onClose,
  header,
  returnFocusRef,
  headerVariant = "default",
  headerIdentity,
  footerVariant = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  header?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
  headerVariant?: "default" | "member" | "invite";
  headerIdentity?: { leading: ReactNode; titleAccessory: ReactNode };
  footerVariant?: "default" | "member" | "invite";
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const trigger = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className={cn(
          "reui-reference fs-drawer",
          headerVariant === "member" && "fs-drawer-member",
          headerVariant === "invite" && "fs-drawer-invite",
        )}
        showCloseButton={headerVariant !== "member"}
        {...(headerVariant === "member"
          ? {
              ref: contentRef,
              // The reference member sheet initially focuses its surface, not Copy.
              // Use the primitive's autofocus event; its native trap and restoration remain.
              onOpenAutoFocus: (event: Event) => {
                event.preventDefault();
                contentRef.current?.focus();
              },
            }
          : {})}
        onCloseAutoFocus={(event) => {
          const previous = returnFocusRef?.current ?? trigger.current;
          const label = previous?.getAttribute("aria-label");
          const target = previous?.isConnected
            ? previous
            : label
              ? document.querySelector<HTMLElement>(`button[aria-label="${CSS.escape(label)}"]`)
              : null;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        {headerVariant === "default" ? (
          <SheetHeader className="fs-drawer-header">
            {header}
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              {description ?? "Local demo workspace. Changes stay in this browser session."}
            </SheetDescription>
          </SheetHeader>
        ) : headerVariant === "member" ? (
          <SheetHeader className="fs-drawer-header fs-drawer-header-member">
            <div className="fs-member-heading-top">
              {header}
              <SheetClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-mr-1"
                    aria-label="Close"
                  />
                }
              >
                <X aria-hidden="true" />
              </SheetClose>
            </div>
            <div className="fs-member-heading-identity">
              {headerIdentity?.leading}
              <div className="fs-member-heading-content">
                <div className="fs-member-heading-title">
                  <SheetTitle>{title}</SheetTitle>
                  {headerIdentity?.titleAccessory}
                </div>
                <SheetDescription>{description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
        ) : (
          <SheetHeader className="fs-drawer-header fs-drawer-header-invite">
            <div className="fs-invite-heading-title">
              <SheetTitle>{title}</SheetTitle>
            </div>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
        )}
        <div className="fs-drawer-body">{children}</div>
        {footer && (
          <SheetFooter
            className={cn(
              "fs-drawer-footer",
              footerVariant === "member" && "fs-drawer-footer-member",
              footerVariant === "invite" && "fs-drawer-footer-invite",
            )}
          >
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function RecordMenu({
  label,
  items,
}: {
  label: string;
  items: {
    label: string;
    onSelect: (trigger: HTMLButtonElement | null) => void;
    destructive?: boolean;
    disabled?: boolean;
    separator?: boolean;
  }[];
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button ref={trigger} variant="ghost" size="icon-sm" aria-label={label} />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="reui-reference fs-record-menu">
        {items.map((item) => (
          <div key={item.label}>
            {item.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              variant={item.destructive ? "destructive" : undefined}
              onSelect={() => item.onSelect(trigger.current)}
            >
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CheckOption({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  // Official free c-checkbox-5: native control followed by linked Field content.
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <Field orientation="horizontal" className="fs-check-option">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        aria-describedby={descriptionId}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      </FieldContent>
    </Field>
  );
}

export function DetailFacts({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="fs-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
