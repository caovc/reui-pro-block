import type { ReactNode } from "react";
import "./reference.css";

/** Keep the reference typography consistent in previews and exported projects. */
export function TemplateSurface({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="template-surface" data-template={id}>
      {children}
    </div>
  );
}
