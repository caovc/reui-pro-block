import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { cn } from "@/lib/utils";
import "./toolbar.css";
import "../../dialog-variants/first-run/first-run.css";
export function ToolbarScene({
  id,
  dark = false,
  children,
}: {
  id: number;
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("refined-toolbar-scene", dark && "dark")} data-navbar-entry={id}>
      <h1 className="toolbar-demo-heading">Navbar</h1>
      {children}
    </section>
  );
}
export function ToolbarNotice({ children }: { children: string | null }) {
  return children ? (
    <Alert role="status" className="mt-5">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  ) : null;
}
export function PlaceholderPanel({ children }: { children?: ReactNode }) {
  return (
    <div className="toolbar-placeholder" aria-label="Page content placeholder">
      {children}
    </div>
  );
}
