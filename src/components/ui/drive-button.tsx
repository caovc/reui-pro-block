// Official ReUI free c-button-27 (Radix Nova), MIT (c) 2025 Keenthemes.
// https://reui.io/r/radix-nova/c-button-27.json
// Its Button dependency preserves MIT (c) 2023 shadcn in project exports.
import type { ComponentProps } from "react";
import { Button as FoundationButton } from "./button";

function Button({ type = "button", ...props }: ComponentProps<typeof FoundationButton>) {
  return <FoundationButton type={type} {...props} />;
}

type NavigationButtonProps = ComponentProps<"a"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size">;

function NavigationButton({
  children,
  variant,
  size,
  onKeyDown,
  onKeyUp,
  ...props
}: NavigationButtonProps) {
  return (
    <FoundationButton asChild variant={variant} size={size}>
      <a
        role="button"
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // Match the existing Base link: Space does not scroll; Enter stays native.
          if (event.target === event.currentTarget && event.key === " ") {
            event.preventDefault();
          }
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.target !== event.currentTarget || event.defaultPrevented || event.key !== " ") {
            return;
          }
          const target = event.currentTarget;
          const view = target.ownerDocument.defaultView;
          if (!view) return;
          target.dispatchEvent(
            new view.PointerEvent("click", {
              bubbles: true,
              cancelable: true,
              composed: true,
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              altKey: event.altKey,
              metaKey: event.metaKey,
            }),
          );
        }}
      >
        {children}
      </a>
    </FoundationButton>
  );
}

export { Button, NavigationButton };
