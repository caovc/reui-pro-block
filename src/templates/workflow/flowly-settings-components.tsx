// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt (included in project exports).
import { useRef, type ReactNode, type RefObject } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
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
import { Label } from "@/components/ui/label";

/** Controlled adaptation of official free c-sheet-1, retaining native focus/close/portal semantics. */
export function SettingsDrawer({
  title,
  description,
  children,
  footer,
  onClose,
  header,
  returnFocusRef,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  header?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
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
        className="reui-reference fs-drawer"
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
        <SheetHeader className="fs-drawer-header">
          {header}
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description ?? "Local demo workspace. Changes stay in this browser session."}
          </SheetDescription>
        </SheetHeader>
        <div className="fs-drawer-body">{children}</div>
        {footer && <SheetFooter className="fs-drawer-footer">{footer}</SheetFooter>}
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
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} variant="ghost" size="icon-sm" aria-label={label}>
          <MoreHorizontal />
        </Button>
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
  return (
    <div className="fs-check-option">
      <Checkbox id={id} checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="fs-hint">{description}</p>}
      </div>
    </div>
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
