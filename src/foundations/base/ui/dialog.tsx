"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
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

// ReUI free c-dialog-1 composes the shadcn Base Nova dialog.
// Adapted from https://ui.shadcn.com/r/styles/base-nova/dialog.json (MIT).
const DialogDismissContext = overlayDismissContext();

function Dialog<Payload>({
  onOpenChange,
  ...props
}: Omit<DialogPrimitive.Root.Props<Payload>, "children"> & { children?: React.ReactNode }) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  return (
    <DialogDismissContext.Provider value={register}>
      <DialogPrimitive.Root
        {...props}
        onOpenChange={(open, details) => {
          if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
      />
    </DialogDismissContext.Provider>
  );
}

function DialogTrigger<Payload>({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<DialogPrimitive.Trigger.Props<Payload>>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

function DialogPortal({
  forceMount,
  keepMounted = forceMount,
  ...props
}: DialogPrimitive.Portal.Props & { forceMount?: true }) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" keepMounted={keepMounted} {...props} />;
}

function DialogClose({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<DialogPrimitive.Close.Props>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

function DialogOverlay({
  asChild,
  className,
  children,
  render,
  style,
  forceMount,
  forceRender = forceMount,
  ...props
}: OverlayChildProps<DialogPrimitive.Backdrop.Props> & { forceMount?: true }) {
  const reduceAnimations = useMotionPolicy();
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
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

function DialogContent({
  asChild,
  className,
  children,
  render,
  ref,
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
  showCloseButton = true,
  ...props
}: OverlayChildProps<DialogPrimitive.Popup.Props> &
  OverlayDismissHandlers & {
    ref?: React.Ref<HTMLDivElement>;
    portalContainer?: DialogPrimitive.Portal.Props["container"];
    forceMount?: true;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    showCloseButton?: boolean;
  }) {
  const reduceAnimations = useMotionPolicy();
  const popup = React.useRef<HTMLDivElement>(null);
  const setPopup = React.useCallback(
    (element: HTMLDivElement | null) => {
      popup.current = element;
      if (typeof ref === "function") {
        const cleanup = ref(element);
        if (cleanup)
          return () => {
            popup.current = null;
            cleanup();
          };
      } else if (ref) ref.current = element;
    },
    [ref],
  );
  useOverlayDismissHandlers(DialogDismissContext, {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });
  const closeButton = showCloseButton && (
    <DialogClose
      render={<Button variant="ghost" className="absolute top-2 right-2" size="icon-sm" />}
    >
      <XIcon />
      <span className="sr-only">Close</span>
    </DialogClose>
  );
  const element = overlayChild(asChild, children, render, closeButton);
  return (
    <DialogPortal container={portalContainer} forceMount={forceMount}>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        ref={setPopup}
        className={overlayClassName(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        style={overlayMotionStyle(style, reduceAnimations)}
        initialFocus={overlayFocus(onOpenAutoFocus, initialFocus, popup)}
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
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<DialogPrimitive.Title.Props>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={overlayClassName("font-heading text-base leading-none font-medium", className)}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

function DialogDescription({
  asChild,
  className,
  children,
  render,
  ...props
}: OverlayChildProps<DialogPrimitive.Description.Props>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={overlayClassName(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...overlayChild(asChild, children, render)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
