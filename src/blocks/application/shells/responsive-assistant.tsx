import { useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
const query = "(max-width: 767px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
/** Keeps the same conversation mounted as the layout changes. On phones the
 * standard modal Sheet provides focus containment, Escape and focus return. */
export function ResponsiveAssistantPanel({
  title,
  onClose,
  className,
  children,
}: {
  title: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const mobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  const returnFocus = useRef(
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  if (mobile)
    return (
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          showCloseButton={false}
          className={cn("shell-reference reui-reference shell-assistant-dialog", className)}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Conversation and suggested actions.</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  return (
    <aside className={cn("shell-assistant", className)} aria-label={title}>
      {children}
    </aside>
  );
}
