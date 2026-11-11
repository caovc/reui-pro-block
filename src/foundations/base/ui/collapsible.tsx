import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { ControlSlot } from "./control-slot";

function Collapsible({
  asChild = false,
  children,
  ...props
}: CollapsiblePrimitive.Root.Props & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      render={(rootProps, { open }) => {
        const state = open ? "open" : "closed";
        return asChild ? (
          <ControlSlot {...rootProps} data-state={state}>
            {children}
          </ControlSlot>
        ) : (
          <div {...rootProps} data-state={state} />
        );
      }}
      {...props}
    >
      {asChild ? undefined : children}
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  asChild = false,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      render={(triggerProps, { open }) => {
        const state = open ? "open" : "closed";
        return asChild ? (
          <ControlSlot {...triggerProps} data-state={state}>
            {children}
          </ControlSlot>
        ) : (
          <button {...triggerProps} data-state={state} />
        );
      }}
      {...props}
    >
      {asChild ? undefined : children}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({
  asChild = false,
  children,
  forceMount,
  style,
  ...props
}: CollapsiblePrimitive.Panel.Props & { asChild?: boolean; forceMount?: boolean }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      keepMounted={forceMount}
      render={(panelProps, { open }) => {
        const state = open ? "open" : "closed";
        return asChild ? (
          <ControlSlot {...panelProps} data-state={state}>
            {children}
          </ControlSlot>
        ) : (
          <div {...panelProps} data-state={state} />
        );
      }}
      style={(state) =>
        ({
          "--radix-collapsible-content-height": "var(--collapsible-panel-height)",
          "--radix-collapsible-content-width": "var(--collapsible-panel-width)",
          ...(typeof style === "function" ? style(state) : style),
        }) as React.CSSProperties
      }
      {...props}
    >
      {asChild ? undefined : children}
    </CollapsiblePrimitive.Panel>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
