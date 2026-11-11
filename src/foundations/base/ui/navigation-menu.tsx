// Base Nova dependency used by ReUI's free c-navigation-menu-4 example (MIT).
// https://ui.shadcn.com/r/styles/base-nova/navigation-menu.json
"use client";

import * as React from "react";
import { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
import { NavigationMenu as Native } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { mergeMotionStyle, useMotionPolicy } from "@/components/ui/motion-policy";
import { childRender, openState, stateRender, type AsChild, type MenuSelect } from "./menu-compat";

const NavigationMenuContext = React.createContext<{
  host: React.RefObject<HTMLElement | null>;
  actions: React.RefObject<Native.Root.Actions | null>;
  orientation: "horizontal" | "vertical";
} | null>(null);

function NavigationMenu({
  className,
  children,
  viewport = true,
  value,
  defaultValue,
  onValueChange,
  delayDuration = 200,
  actionsRef,
  orientation = "horizontal",
  dir,
  ...props
}: Omit<Native.Root.Props<string>, "value" | "defaultValue" | "onValueChange"> & {
  viewport?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  delayDuration?: number;
  dir?: "ltr" | "rtl";
}) {
  const root = React.useRef<HTMLElement>(null);
  const defaultActions = React.useRef<Native.Root.Actions>(null);
  const actions = actionsRef ?? defaultActions;

  const menu = (
    <NavigationMenuContext.Provider value={{ host: root, actions, orientation }}>
      <Native.Root
        data-slot="navigation-menu"
        data-viewport={viewport}
        className={cn(
          "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
          className,
        )}
        ref={root}
        actionsRef={actions}
        orientation={orientation}
        delay={delayDuration}
        {...props}
        value={value === "" ? null : value}
        defaultValue={defaultValue || null}
        onValueChange={(next) => onValueChange?.(next ?? "")}
      >
        {children}
        <NavigationMenuViewport framed={viewport} />
      </Native.Root>
    </NavigationMenuContext.Provider>
  );
  return dir ? <DirectionProvider direction={dir}>{menu}</DirectionProvider> : menu;
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof Native.List>) {
  return (
    <Native.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-0", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof Native.Item>) {
  return (
    <Native.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted",
);

function focusFirstMenuLink(trigger: HTMLElement) {
  const popupId = trigger.getAttribute("aria-controls");
  if (!popupId) return false;
  const popup = trigger.ownerDocument.getElementById(popupId);
  const firstLink = popup?.querySelector<HTMLElement>(
    '[data-slot="navigation-menu-content"][data-state="open"] a[href]:not([aria-disabled="true"])',
  );
  firstLink?.focus();
  return firstLink !== null && firstLink === trigger.ownerDocument.activeElement;
}

function NavigationMenuTrigger({
  className,
  children,
  asChild,
  render,
  onClick,
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<typeof Native.Trigger>, "render"> &
  AsChild & {
    render?: React.ReactElement;
  }) {
  const menu = React.useContext(NavigationMenuContext);
  const direction = useDirection();
  const openKey =
    menu?.orientation === "vertical"
      ? direction === "rtl"
        ? "ArrowLeft"
        : "ArrowRight"
      : "ArrowDown";
  const element = render ?? childRender(asChild, children);
  return (
    <Native.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.currentTarget.getAttribute("aria-expanded") !== "true")
          return;
        // Base UI delays closing after a hover. Existing consumers toggle immediately.
        (event as typeof event & { preventBaseUIHandler(): void }).preventBaseUIHandler();
        menu?.actions.current?.close();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== openKey) return;
        const trigger = event.currentTarget;
        // Keep the existing Arrow key behavior once the native popup is open.
        // Base UI still owns opening, closing, and navigation within the popup.
        if (focusFirstMenuLink(trigger)) {
          event.preventDefault();
          (event as typeof event & { preventBaseUIHandler(): void }).preventBaseUIHandler();
          return;
        }
        trigger.ownerDocument.defaultView?.requestAnimationFrame(() => {
          if (trigger.ownerDocument.activeElement === trigger) focusFirstMenuLink(trigger);
        });
      }}
      render={stateRender<Native.Trigger.State>("button", element, openState)}
    >
      {!asChild && (
        <>
          {children}
          <ChevronDownIcon
            className="relative top-px ml-1 size-3 transition duration-300 group-data-popup-open/navigation-menu-trigger:rotate-180"
            aria-hidden="true"
          />
        </>
      )}
    </Native.Trigger>
  );
}

function NavigationMenuContent({
  className,
  asChild,
  children,
  render,
  style,
  forceMount,
  ...props
}: Omit<React.ComponentProps<typeof Native.Content>, "render"> &
  AsChild & {
    render?: React.ReactElement;
    forceMount?: boolean;
  }) {
  const reducedMotion = useMotionPolicy();
  const element = render ?? childRender(asChild, children);
  return (
    <Native.Content
      data-slot="navigation-menu-content"
      className={cn(
        "h-full w-auto p-1 transition-[opacity,transform,translate] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-[activation-direction=left]:data-starting-style:-translate-x-1/2 data-[activation-direction=right]:data-starting-style:translate-x-1/2 data-[activation-direction=left]:data-ending-style:translate-x-1/2 data-[activation-direction=right]:data-ending-style:-translate-x-1/2 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
        className,
      )}
      keepMounted={forceMount}
      {...props}
      render={stateRender<Native.Content.State>("div", element, openState)}
      style={reducedMotion ? mergeMotionStyle(style) : style}
    >
      {asChild ? undefined : children}
    </Native.Content>
  );
}

function NavigationMenuViewport({
  className,
  framed = true,
  forceMount,
  style,
  ...props
}: React.ComponentProps<typeof Native.Viewport> & { framed?: boolean; forceMount?: boolean }) {
  const host = React.useContext(NavigationMenuContext)?.host;
  const reducedMotion = useMotionPolicy();
  return (
    <Native.Portal container={host ?? undefined} keepMounted={forceMount}>
      <Native.Positioner
        side="bottom"
        align="start"
        sideOffset={6}
        className="isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none"
        style={reducedMotion ? mergeMotionStyle(undefined) : undefined}
      >
        <Native.Popup
          data-slot={framed ? "navigation-menu-viewport" : undefined}
          className="relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow ring-1 ring-foreground/10 outline-none transition-[opacity,transform,width,height,scale,translate] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0"
          render={stateRender<Native.Popup.State>("div", undefined, openState)}
          style={reducedMotion ? mergeMotionStyle(undefined) : undefined}
        >
          <Native.Viewport
            className={cn("relative size-full overflow-hidden", className)}
            {...props}
            style={reducedMotion ? mergeMotionStyle(style) : style}
          />
        </Native.Popup>
      </Native.Positioner>
    </Native.Portal>
  );
}

function NavigationMenuLink({
  className,
  asChild,
  children,
  render,
  onClick,
  onSelect,
  closeOnClick = true,
  ...props
}: Omit<React.ComponentProps<typeof Native.Link>, "render" | "onSelect"> &
  AsChild &
  MenuSelect & { render?: React.ReactElement }) {
  const element = render ?? childRender(asChild, children);
  return (
    <Native.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 in-data-[slot=navigation-menu-content]:rounded-md data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      closeOnClick={closeOnClick}
      {...props}
      render={element}
      onClick={(event) => {
        onClick?.(event);
        if (!onSelect || event.defaultPrevented) return;
        const selection = new CustomEvent("navigationMenu.linkSelect", {
          bubbles: true,
          cancelable: true,
        });
        event.currentTarget.addEventListener(selection.type, onSelect, { once: true });
        if (!event.currentTarget.dispatchEvent(selection)) {
          (event as typeof event & { preventBaseUIHandler(): void }).preventBaseUIHandler();
        }
      }}
    >
      {asChild ? undefined : children}
    </Native.Link>
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof Native.Icon>) {
  return (
    <Native.Icon
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-1 hidden h-1.5 items-end justify-center overflow-hidden data-popup-open:flex",
        className,
      )}
      {...props}
    >
      <span className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </Native.Icon>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
