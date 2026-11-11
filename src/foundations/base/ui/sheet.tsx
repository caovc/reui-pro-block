"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import { XIcon } from "lucide-react";

import {
  type OverlayChildProps,
  type OverlayDismissHandlers,
  allowOverlayRadioNavigation,
  overlayButton,
  overlayChild,
  overlayClassName,
  overlayDismissContext,
  overlayMotionStyle,
  overlayFocus,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
} from "./overlay-compat";
import { OverlayModalElement } from "./overlay-modal";

// ReUI free c-sheet-1 composes the shadcn Base Nova sheet.
// Adapted from https://ui.shadcn.com/r/styles/base-nova/sheet.json (MIT).
const SheetDismissContext = overlayDismissContext();

function Sheet<Payload>({
  onOpenChange,
  ...props
}: Omit<SheetPrimitive.Root.Props<Payload>, "children"> & { children?: React.ReactNode }) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  return (
    <SheetDismissContext.Provider value={register}>
      <SheetPrimitive.Root
        {...props}
        onOpenChange={(open, details) => {
          if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
      />
    </SheetDismissContext.Provider>
  );
}

function SheetTrigger<Payload>({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<SheetPrimitive.Trigger.Props<Payload>>) {
  return (
    <SheetPrimitive.Trigger
      data-slot="sheet-trigger"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

function SheetClose({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<SheetPrimitive.Close.Props>) {
  return (
    <SheetPrimitive.Close
      data-slot="sheet-close"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

function SheetPortal({
  forceMount,
  keepMounted = forceMount,
  ...props
}: SheetPrimitive.Portal.Props & { forceMount?: true }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" keepMounted={keepMounted} {...props} />;
}

function SheetOverlay({
  asChild,
  className,
  children,
  render,
  style,
  forceMount,
  forceRender = forceMount,
  ...props
}: OverlayChildProps<SheetPrimitive.Backdrop.Props> & { forceMount?: true }) {
  const reduceAnimations = useMotionPolicy();
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={overlayClassName(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      style={overlayMotionStyle(style, reduceAnimations)}
      forceRender={forceRender}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function SheetContent({
  asChild,
  className,
  children,
  render,
  style,
  portalContainer,
  forceMount,
  onKeyDown,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  initialFocus,
  finalFocus,
  side = "right",
  showCloseButton = true,
  ...props
}: OverlayChildProps<SheetPrimitive.Popup.Props> &
  OverlayDismissHandlers & {
    portalContainer?: SheetPrimitive.Portal.Props["container"];
    forceMount?: true;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
  }) {
  const reduceAnimations = useMotionPolicy();
  useOverlayDismissHandlers(SheetDismissContext, {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });
  const closeButton = showCloseButton && (
    <SheetClose
      render={<Button variant="ghost" className="absolute top-3 right-3" size="icon-sm" />}
    >
      <XIcon />
      <span className="sr-only">Close</span>
    </SheetClose>
  );
  const element = overlayChild(asChild, children, render, closeButton);
  return (
    <SheetPortal container={portalContainer} forceMount={forceMount}>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={overlayClassName(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
        )}
        style={overlayMotionStyle(style, reduceAnimations)}
        initialFocus={overlayFocus(onOpenAutoFocus, initialFocus)}
        finalFocus={overlayFocus(onCloseAutoFocus, finalFocus)}
        render={(elementProps, state) => (
          <OverlayModalElement elementProps={elementProps} render={element.render} state={state} />
        )}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          allowOverlayRadioNavigation(event);
        }}
      >
        {element.children}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<SheetPrimitive.Title.Props>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={overlayClassName("font-heading text-base font-medium text-foreground", className)}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function SheetDescription({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<SheetPrimitive.Description.Props>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={overlayClassName("text-sm text-muted-foreground", className)}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
