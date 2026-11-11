import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { ControlSlot } from "./control-slot";

const ActivationContext = React.createContext(true);

function Tabs({
  className,
  orientation = "horizontal",
  activationMode = "automatic",
  ...props
}: TabsPrimitive.Root.Props & { activationMode?: "automatic" | "manual" }) {
  return (
    <ActivationContext.Provider value={activationMode === "automatic"}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
        {...props}
      />
    </ActivationContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex h-8 w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const activateOnFocus = React.useContext(ActivationContext);
  return (
    <TabsPrimitive.List
      activateOnFocus={activateOnFocus}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function revealFocusedTab(trigger: HTMLElement) {
  let viewport = trigger.parentElement;
  while (viewport && viewport !== trigger.ownerDocument.body) {
    const style = getComputedStyle(viewport);
    if (/^(auto|scroll)$/.test(style.overflowX) && viewport.scrollWidth > viewport.clientWidth) {
      const bounds = viewport.getBoundingClientRect();
      const item = trigger.getBoundingClientRect();
      const focusStyle = getComputedStyle(trigger);
      const left = bounds.left + viewport.clientLeft;
      const right = left + viewport.clientWidth;
      const start = item.left - (parseFloat(focusStyle.scrollMarginLeft) || 0);
      const end = item.right + (parseFloat(focusStyle.scrollMarginRight) || 0);
      const delta = start < left ? start - left : end > right ? end - right : 0;
      if (delta) viewport.scrollBy({ left: delta, behavior: "instant" });
      return;
    }
    viewport = viewport.parentElement;
  }
}

function TabsTrigger({
  className,
  onFocus,
  asChild = false,
  children,
  ...props
}: TabsPrimitive.Tab.Props & { asChild?: boolean }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      nativeButton={!asChild || (React.isValidElement(children) && children.type === "button")}
      render={(tabProps, { active }) => {
        const state = active ? "active" : "inactive";
        return asChild ? (
          <ControlSlot {...tabProps} data-state={state}>
            {children}
          </ControlSlot>
        ) : (
          <button {...tabProps} data-state={state} />
        );
      }}
      children={asChild ? undefined : children}
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 scroll-mx-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:hidden after:bg-foreground after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:after:block group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        const trigger = event.currentTarget;
        requestAnimationFrame(() => {
          if (trigger.isConnected && trigger.ownerDocument.activeElement === trigger) {
            revealFocusedTab(trigger);
          }
        });
      }}
      {...props}
    />
  );
}

function TabsContent({
  className,
  forceMount,
  ...props
}: TabsPrimitive.Panel.Props & { forceMount?: boolean }) {
  return (
    <TabsPrimitive.Panel
      keepMounted={forceMount}
      render={(panelProps, { hidden }) => (
        <div {...panelProps} data-state={hidden ? "inactive" : "active"} />
      )}
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
