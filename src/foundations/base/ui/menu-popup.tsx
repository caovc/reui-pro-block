import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";
import { mergeMotionStyle, useMotionPolicy } from "@/components/ui/motion-policy";
import {
  childRender,
  focusHandler,
  MenuGroupScope,
  MenuPortalContainer,
  menuPopupStyle,
  openState,
  stateRender,
  useMenuDismissHandlers,
  type AsChild,
  type MenuDismissHandlers,
  type MenuFocusHandlers,
} from "./menu-compat";

export type MenuContentProps = Omit<Menu.Popup.Props, "className" | "render" | "style"> &
  Pick<
    Menu.Positioner.Props,
    "side" | "sideOffset" | "align" | "alignOffset" | "collisionPadding"
  > &
  AsChild &
  MenuDismissHandlers &
  MenuFocusHandlers & {
    ref?: React.Ref<HTMLDivElement>;
    className?: string;
    style?: React.CSSProperties;
    render?: React.ReactElement;
    portalContainer?: Menu.Portal.Props["container"];
    forceMount?: boolean;
    avoidCollisions?: boolean;
    collisionBoundary?: Element | (Element | null)[] | null;
    sticky?: "partial" | "always";
    hideWhenDetached?: boolean;
  };

const popupAnimation =
  "origin-(--transform-origin) duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

export function MenuContent({
  family,
  sub = false,
  align = "start",
  alignOffset = 0,
  side = sub ? "inline-end" : family === "context-menu" ? "right" : "bottom",
  sideOffset = sub ? 0 : family === "context-menu" ? 2 : 4,
  avoidCollisions = true,
  collisionBoundary,
  collisionPadding,
  sticky,
  hideWhenDetached,
  className,
  style,
  portalContainer,
  forceMount,
  onOpenAutoFocus,
  onCloseAutoFocus,
  finalFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  asChild,
  render,
  children,
  ...props
}: MenuContentProps & { family: "dropdown-menu" | "context-menu"; sub?: boolean }) {
  const inheritedContainer = React.useContext(MenuPortalContainer);
  const container = portalContainer === undefined ? inheritedContainer : portalContainer;
  useMenuDismissHandlers({
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });
  const reducedMotion = useMotionPolicy();
  const popupStyle = menuPopupStyle(family, style);
  const element = render ?? childRender(asChild, children);
  const boundary = Array.isArray(collisionBoundary)
    ? collisionBoundary.filter((entry): entry is Element => entry !== null)
    : (collisionBoundary ?? undefined);

  return (
    <Menu.Portal container={container} keepMounted={forceMount}>
      <Menu.Positioner
        className={cn(
          "isolate z-50 outline-none",
          hideWhenDetached && "data-anchor-hidden:invisible",
        )}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionBoundary={boundary}
        collisionPadding={collisionPadding}
        collisionAvoidance={
          avoidCollisions
            ? { side: "flip", align: "shift", fallbackAxisSide: "none" }
            : { side: "none", align: "none", fallbackAxisSide: "none" }
        }
        sticky={sticky === "always"}
      >
        <MenuGroupScope.Provider value={false}>
          <MenuPortalContainer.Provider value={container}>
            <Menu.Popup
              data-slot={sub ? `${family}-sub-content` : `${family}-content`}
              className={cn(
                "rounded-lg bg-popover p-1 text-popover-foreground outline-none",
                popupAnimation,
                sub
                  ? family === "dropdown-menu"
                    ? "min-w-[96px] overflow-hidden shadow-lg ring-1 ring-foreground/10"
                    : "min-w-32 overflow-hidden border shadow-lg"
                  : cn(
                      "max-h-(--available-height) overflow-x-hidden overflow-y-auto shadow-md ring-1 ring-foreground/10",
                      family === "dropdown-menu"
                        ? "w-(--anchor-width) min-w-32 data-closed:overflow-hidden"
                        : "min-w-36",
                    ),
                className,
              )}
              {...props}
              render={stateRender<Menu.Popup.State>("div", element, openState)}
              style={reducedMotion ? mergeMotionStyle(popupStyle) : popupStyle}
              finalFocus={finalFocus ?? focusHandler("close", onCloseAutoFocus)}
              {...(onOpenAutoFocus ? { initialFocus: focusHandler("open", onOpenAutoFocus) } : {})}
            >
              {asChild ? undefined : children}
            </Menu.Popup>
          </MenuPortalContainer.Provider>
        </MenuGroupScope.Provider>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export function MenuGroup({
  asChild,
  render,
  children,
  ...props
}: Omit<Menu.Group.Props, "render"> &
  AsChild & {
    render?: React.ReactElement;
    ref?: React.Ref<HTMLDivElement>;
  }) {
  const element = render ?? childRender(asChild, children);
  return (
    <MenuGroupScope.Provider value>
      <Menu.Group render={element} {...props}>
        {asChild ? undefined : children}
      </Menu.Group>
    </MenuGroupScope.Provider>
  );
}

export function MenuLabel({
  asChild,
  render,
  children,
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<"div"> & AsChild & { inset?: boolean; render?: React.ReactElement }) {
  const grouped = React.useContext(MenuGroupScope);
  const element = render ?? childRender(asChild, children);
  const labelProps = {
    "data-inset": inset,
    className: cn(
      "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
      className,
    ),
    ...props,
    children: asChild ? undefined : children,
  };
  const ungroupedLabel = useRender({
    defaultTagName: "div",
    render: element,
    ref,
    props: labelProps,
  });
  if (!grouped) return ungroupedLabel;
  return <Menu.GroupLabel render={element} ref={ref} {...labelProps} />;
}
