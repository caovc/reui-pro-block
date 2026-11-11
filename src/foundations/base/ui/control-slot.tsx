import * as React from "react";
import { useRender } from "@base-ui/react/use-render";

type ControlSlotProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> };

export function ControlSlot({ children, ref, ...props }: ControlSlotProps) {
  const child = React.isValidElement(children) ? children : undefined;
  return useRender({ render: child, ref, props, enabled: child !== undefined });
}
