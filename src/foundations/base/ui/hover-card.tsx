"use client";

import * as React from "react";
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import { cn } from "@/lib/utils";

import {
  type OverlayChildProps,
  type OverlayDismissHandlers,
  overlayChild,
  overlayClassName,
  overlayDismissContext,
  overlayMotionStyle,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
} from "./overlay-compat";

// ReUI c-hover-card-1 composes the shadcn Base Nova Hover Card (MIT).
// https://reui.io/r/base-nova/c-hover-card-1.json
// https://ui.shadcn.com/r/styles/base-nova/hover-card.json
type PositionerProps = PreviewCardPrimitive.Positioner.Props;

const HoverCardDismissContext = overlayDismissContext();
const HoverCardDelayContext = React.createContext({ delay: 700, closeDelay: 300 });
const positionerStyle = {
  "--radix-hover-card-content-transform-origin": "var(--transform-origin)",
  "--radix-hover-card-content-available-width": "var(--available-width)",
  "--radix-hover-card-content-available-height": "var(--available-height)",
  "--radix-hover-card-trigger-width": "var(--anchor-width)",
  "--radix-hover-card-trigger-height": "var(--anchor-height)",
} as React.CSSProperties;

function HoverCard<Payload>({
  openDelay = 700,
  closeDelay = 300,
  onOpenChange,
  ...props
}: PreviewCardPrimitive.Root.Props<Payload> & {
  openDelay?: number;
  closeDelay?: number;
}) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  return (
    <HoverCardDismissContext.Provider value={register}>
      <HoverCardDelayContext.Provider value={{ delay: openDelay, closeDelay }}>
        <PreviewCardPrimitive.Root
          data-slot="hover-card"
          {...props}
          onOpenChange={(open, details) => {
            const dismissal =
              details.reason === "trigger-focus" && details.event.type === "focusout"
                ? { reason: "focus-out", event: details.event }
                : details;
            if (!open && shouldCancelOverlayDismiss(dismissal, dismissHandlers.current)) {
              details.cancel();
              return;
            }
            onOpenChange?.(open, details);
          }}
        />
      </HoverCardDelayContext.Provider>
    </HoverCardDismissContext.Provider>
  );
}

function HoverCardTrigger<Payload>({
  asChild,
  children,
  render,
  delay,
  closeDelay,
  ...props
}: OverlayChildProps<PreviewCardPrimitive.Trigger.Props<Payload>>) {
  const delays = React.useContext(HoverCardDelayContext);
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      delay={delay ?? delays.delay}
      closeDelay={closeDelay ?? delays.closeDelay}
      {...props}
      {...overlayChild(asChild, children, render)}
    />
  );
}

type HoverCardContentProps = OverlayChildProps<PreviewCardPrimitive.Popup.Props> &
  OverlayDismissHandlers &
  Pick<
    PositionerProps,
    | "anchor"
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "positionMethod"
    | "collisionPadding"
    | "collisionAvoidance"
    | "arrowPadding"
    | "disableAnchorTracking"
  > & {
    collisionBoundary?:
      | Exclude<PositionerProps["collisionBoundary"], Element[]>
      | (Element | null)[]
      | null;
    sticky?: PositionerProps["sticky"] | "partial" | "always";
    avoidCollisions?: boolean;
    hideWhenDetached?: boolean;
    portalContainer?: PreviewCardPrimitive.Portal.Props["container"];
    forceMount?: true;
  };

function HoverCardContent({
  asChild,
  children,
  className,
  render,
  style,
  anchor,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  positionMethod = "fixed",
  collisionBoundary,
  collisionPadding = 0,
  collisionAvoidance,
  arrowPadding,
  sticky,
  avoidCollisions = true,
  hideWhenDetached,
  disableAnchorTracking,
  portalContainer,
  forceMount,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  ...props
}: HoverCardContentProps) {
  const reduceAnimations = useMotionPolicy();
  useOverlayDismissHandlers(HoverCardDismissContext, {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });

  const boundary = Array.isArray(collisionBoundary)
    ? collisionBoundary.filter((item): item is Element => item !== null)
    : collisionBoundary;
  return (
    <PreviewCardPrimitive.Portal
      data-slot="hover-card-portal"
      container={portalContainer}
      keepMounted={forceMount}
    >
      <PreviewCardPrimitive.Positioner
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        positionMethod={positionMethod}
        collisionBoundary={boundary ?? undefined}
        collisionPadding={collisionPadding}
        collisionAvoidance={
          avoidCollisions
            ? collisionAvoidance
            : { side: "none", align: "none", fallbackAxisSide: "none" }
        }
        arrowPadding={arrowPadding}
        sticky={sticky === "always" || sticky === true}
        disableAnchorTracking={disableAnchorTracking}
        className={cn("isolate z-50", hideWhenDetached && "data-[anchor-hidden]:invisible")}
        style={positionerStyle}
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={overlayClassName(
            "z-50 w-[var(--hover-card-width,16rem)] origin-(--transform-origin) rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          style={overlayMotionStyle(style, reduceAnimations)}
          {...overlayChild(asChild, children, render)}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
