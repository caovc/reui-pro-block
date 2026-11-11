import * as React from "react";
import type { ContextMenu } from "@base-ui/react/context-menu";
import type { Menu } from "@base-ui/react/menu";
import { useRender } from "@base-ui/react/use-render";

export type AsChild = { asChild?: boolean };
export type MenuSelect = { onSelect?: (event: Event) => void };

export function childRender(asChild: boolean | undefined, children: React.ReactNode) {
  return asChild && React.isValidElement(children) ? children : undefined;
}

// Keep the existing element (including its ref and handlers) when translating asChild.
function RenderElement({
  tag,
  element,
  props,
}: {
  tag: keyof React.JSX.IntrinsicElements;
  element?: React.ReactElement;
  props: React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;
}) {
  const { ref, ...elementProps } = props;
  return useRender({ defaultTagName: tag, render: element, ref, props: elementProps });
}

export function stateRender<State>(
  tag: keyof React.JSX.IntrinsicElements,
  element: React.ReactElement | undefined,
  attributes: (state: State) => Record<string, string | undefined>,
) {
  return (props: React.HTMLAttributes<HTMLElement>, state: State) => (
    <RenderElement tag={tag} element={element} props={{ ...props, ...attributes(state) }} />
  );
}

export function openState({ open }: { open: boolean }) {
  return { "data-state": open ? "open" : "closed" };
}

// The native itemPress event reaches each open ancestor. Keep the cancellation
// on the event so preventDefault keeps the entire menu tree open, while a
// checkbox or radio can still update its value.
const canceledSelections = new WeakSet<Event>();

export function selectHandler(
  onClick: React.MouseEventHandler<HTMLElement> | undefined,
  onSelect: MenuSelect["onSelect"],
): React.MouseEventHandler<HTMLElement> {
  return (event) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      canceledSelections.add(event.nativeEvent);
      return;
    }
    if (!onSelect) return;

    const selection = new CustomEvent("menu.itemSelect", { bubbles: true, cancelable: true });
    const item = event.currentTarget;
    item.addEventListener(selection.type, onSelect, { once: true });
    if (!item.dispatchEvent(selection)) canceledSelections.add(event.nativeEvent);
  };
}

export type MenuDismissHandlers = {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: CustomEvent<{ originalEvent: PointerEvent }>) => void;
  onFocusOutside?: (event: CustomEvent<{ originalEvent: FocusEvent }>) => void;
  onInteractOutside?: (event: CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>) => void;
};

export type MenuFocusHandlers = {
  onCloseAutoFocus?: (event: Event) => void;
  onOpenAutoFocus?: (event: Event) => void;
};

type RegisterDismissHandlers = (handlers: MenuDismissHandlers) => () => void;
const MenuDismissContext = React.createContext<RegisterDismissHandlers | null>(null);

export function useMenuDismiss<Details extends ContextMenu.Root.ChangeEventDetails>(
  onOpenChange: ((open: boolean, details: Details) => void) | undefined,
) {
  const dismissHandlers = React.useRef<MenuDismissHandlers>(null);
  const register = React.useCallback<RegisterDismissHandlers>((handlers) => {
    dismissHandlers.current = handlers;
    return () => {
      if (dismissHandlers.current === handlers) dismissHandlers.current = null;
    };
  }, []);

  return {
    register,
    onOpenChange(open: boolean, details: Details) {
      if (!open) {
        if (details.reason === "item-press" && canceledSelections.has(details.event)) {
          details.cancel();
          return;
        }

        const handlers = dismissHandlers.current;
        if (handlers) {
          if (details.reason === "escape-key") {
            handlers.onEscapeKeyDown?.(details.event);
            if (details.event.defaultPrevented) details.cancel();
          } else if (details.reason === "outside-press") {
            const outside = new CustomEvent("menu.pointerDownOutside", {
              cancelable: true,
              detail: { originalEvent: details.event as PointerEvent },
            });
            handlers.onPointerDownOutside?.(outside);
            handlers.onInteractOutside?.(outside);
            if (outside.defaultPrevented) details.cancel();
          } else if (details.reason === "focus-out") {
            const outside = new CustomEvent("menu.focusOutside", {
              cancelable: true,
              detail: { originalEvent: details.event as FocusEvent },
            });
            handlers.onFocusOutside?.(outside);
            handlers.onInteractOutside?.(outside);
            if (outside.defaultPrevented) details.cancel();
          }
        }
      }
      if (!details.isCanceled) onOpenChange?.(open, details);
    },
  };
}

export const MenuDismissProvider = MenuDismissContext.Provider;

export function useMenuDismissHandlers(handlers: MenuDismissHandlers) {
  const register = React.useContext(MenuDismissContext);
  React.useLayoutEffect(() => register?.(handlers), [register, handlers]);
}

export function focusHandler(type: "open" | "close", handler?: (event: Event) => void) {
  if (!handler) return undefined;
  return () => {
    const event = new Event(`menu.${type}AutoFocus`, { cancelable: true });
    handler(event);
    return !event.defaultPrevented;
  };
}

export const MenuGroupScope = React.createContext(false);
export const MenuPortalContainer = React.createContext<Menu.Portal.Props["container"]>(undefined);

export function menuPopupStyle(
  family: "dropdown-menu" | "context-menu",
  style: React.CSSProperties | undefined,
) {
  // AppShells and templates use these variables to size content against the trigger.
  return {
    [`--radix-${family}-trigger-width`]: "var(--anchor-width)",
    [`--radix-${family}-trigger-height`]: "var(--anchor-height)",
    [`--radix-${family}-content-available-width`]: "var(--available-width)",
    [`--radix-${family}-content-available-height`]: "var(--available-height)",
    [`--radix-${family}-content-transform-origin`]: "var(--transform-origin)",
    ...style,
  };
}
