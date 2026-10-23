/**
 * Adapted from ReUI's free c-sidebar-1/c-sidebar-2 shell composition (MIT).
 * https://reui.io/components/sidebar/c-sidebar-2
 * The provider, inset, responsive Sheet, rail and trigger share one state.
 */
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppShellLayout({
  children,
  mobileBreakpoint = 768,
}: ComponentProps<"div"> & { mobileBreakpoint?: number }) {
  return (
    <TooltipProvider>
      <SidebarProvider
        mobileBreakpoint={mobileBreakpoint}
        className="reui-shell-layout relative h-dvh min-h-0 w-full overflow-hidden"
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}

export function AppShellInset({ className, ...props }: ComponentProps<typeof SidebarInset>) {
  return <SidebarInset className={cn("min-h-0 min-w-0 overflow-hidden", className)} {...props} />;
}

// Compatibility with shells that also show/hide labels in their header/footer.
// The provider owns the state; no second local collapsed boolean is maintained.
export function useShellSidebarState(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const { open, setOpen, isMobile } = useSidebar();
  const setCollapsed = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => setOpen(!(typeof value === "function" ? value(!open) : value)),
    [open, setOpen],
  );
  return [!isMobile && !open, setCollapsed];
}
