// Official ReUI free c-button-27 (Base Nova), MIT (c) 2025 Keenthemes.
// https://reui.io/r/base-nova/c-button-27.json
// Actual Button dependency: https://ui.shadcn.com/r/styles/base-nova/button.json
// MIT (c) 2023 shadcn; full notices are preserved in project exports.
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

type NavigationButtonProps = ComponentProps<"a"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size">;

function NavigationButton({ children, variant, size, ...props }: NavigationButtonProps) {
  return (
    <Button variant={variant} size={size} render={<a {...props} />} nativeButton={false}>
      {children}
    </Button>
  );
}

export { Button, NavigationButton };
