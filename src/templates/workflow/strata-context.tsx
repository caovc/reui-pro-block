import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** The shell owns its header; route leaves supply their actual native controls. */
const StrataHeaderTargetContext = createContext<HTMLElement | null>(null);

export function StrataHeaderProvider({
  target,
  children,
}: {
  target: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <StrataHeaderTargetContext.Provider value={target}>
      {children}
    </StrataHeaderTargetContext.Provider>
  );
}

export function StrataHeaderActions({ children }: { children: ReactNode }) {
  const target = useContext(StrataHeaderTargetContext);
  return target ? createPortal(children, target) : null;
}
