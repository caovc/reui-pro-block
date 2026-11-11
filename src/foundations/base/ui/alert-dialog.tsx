"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useMotionPolicy } from "@/components/ui/motion-policy";

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
  resolveOverlayFocus,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
} from "./overlay-compat";
import { OverlayModalElement } from "./overlay-modal";

// ReUI free c-alert-dialog-1 composes the shadcn Base Nova alert-dialog.
// Adapted from https://ui.shadcn.com/r/styles/base-nova/alert-dialog.json (MIT).
const AlertDialogDismissContext = overlayDismissContext();

function AlertDialog<Payload>({
  onOpenChange,
  ...props
}: Omit<AlertDialogPrimitive.Root.Props<Payload>, "children"> & { children?: React.ReactNode }) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  return (
    <AlertDialogDismissContext.Provider value={register}>
      <AlertDialogPrimitive.Root
        {...props}
        onOpenChange={(open, details) => {
          if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
      />
    </AlertDialogDismissContext.Provider>
  );
}

function AlertDialogTrigger<Payload>({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Trigger.Props<Payload>>) {
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

function AlertDialogPortal({
  forceMount,
  keepMounted = forceMount,
  ...props
}: AlertDialogPrimitive.Portal.Props & { forceMount?: true }) {
  return (
    <AlertDialogPrimitive.Portal
      data-slot="alert-dialog-portal"
      keepMounted={keepMounted}
      {...props}
    />
  );
}

function AlertDialogOverlay({
  asChild,
  className,
  children,
  render,
  style,
  forceMount,
  forceRender = forceMount,
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Backdrop.Props> & { forceMount?: true }) {
  const reduceAnimations = useMotionPolicy();
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={overlayClassName(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      style={overlayMotionStyle(style, reduceAnimations)}
      forceRender={forceRender}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function AlertDialogContent({
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
  size = "default",
  ref,
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Popup.Props> &
  OverlayDismissHandlers & {
    portalContainer?: AlertDialogPrimitive.Portal.Props["container"];
    forceMount?: true;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    size?: "default" | "sm";
  }) {
  const reduceAnimations = useMotionPolicy();
  useOverlayDismissHandlers(AlertDialogDismissContext, {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });
  const popup = React.useRef<HTMLDivElement>(null);
  const setPopup = React.useCallback(
    (node: HTMLDivElement | null) => {
      popup.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (cleanup) {
          return () => {
            popup.current = null;
            cleanup();
          };
        }
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const focusCancel = React.useCallback(
    () =>
      popup.current?.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-cancel"]:not(:disabled)',
      ) ?? true,
    [],
  );
  const element = overlayChild(asChild, children, render);
  return (
    <AlertDialogPortal container={portalContainer} forceMount={forceMount}>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        ref={setPopup}
        className={overlayClassName(
          "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        style={overlayMotionStyle(style, reduceAnimations)}
        initialFocus={(interaction) =>
          resolveOverlayFocus(interaction, onOpenAutoFocus, initialFocus, focusCancel)
        }
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
      </AlertDialogPrimitive.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Title.Props>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={overlayClassName(
        "font-heading text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className,
      )}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Description.Props>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={overlayClassName(
        "text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function AlertDialogAction({
  asChild,
  children,
  render,
  nativeButton,
  variant = "default",
  size = "default",
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Close.Props> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      {...props}
      {...overlayButton(
        asChild,
        children,
        render ?? <Button variant={variant} size={size} />,
        nativeButton,
      )}
    />
  );
}

function AlertDialogCancel({
  asChild,
  children,
  render,
  nativeButton,
  variant = "outline",
  size = "default",
  ...props
}: OverlayChildProps<AlertDialogPrimitive.Close.Props> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      {...props}
      {...overlayButton(
        asChild,
        children,
        render ?? <Button variant={variant} size={size} />,
        nativeButton,
      )}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
