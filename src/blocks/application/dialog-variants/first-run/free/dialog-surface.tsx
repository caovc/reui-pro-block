// Official free REUI c-dialog-3 / c-dialog-6 composition. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dialog-3.json
// https://reui.io/r/radix-nova/c-dialog-6.json
// Retains installed upstream Dialog, header/body/footer separation and scrolling body.
// Adapters: content slots, per-entry width, bounded small-screen height and local domain forms.
import type { ComponentProps, ReactNode } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DialogSurface({
  id,
  title,
  description,
  media,
  children,
  footer,
  initialFocus,
  onEscapeKeyDown,
}: {
  id: number;
  title: ReactNode;
  description: string;
  media?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  initialFocus?: () => void;
  onEscapeKeyDown?: ComponentProps<typeof DialogContent>["onEscapeKeyDown"];
}) {
  return (
    <DialogContent
      data-dialog-entry={id}
      className="refined-dialog-surface flex max-h-[calc(100svh-2rem)] flex-col overflow-hidden p-0"
      onEscapeKeyDown={onEscapeKeyDown}
      onOpenAutoFocus={
        initialFocus
          ? (event) => {
              event.preventDefault();
              initialFocus();
            }
          : undefined
      }
    >
      <DialogHeader className="refined-dialog-header shrink-0">
        {media ? (
          <div className="flex items-start gap-3">
            {media}
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        ) : (
          <>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </>
        )}
      </DialogHeader>
      <div className="refined-dialog-body min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      <DialogFooter className="refined-dialog-footer shrink-0">{footer}</DialogFooter>
    </DialogContent>
  );
}
