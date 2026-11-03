// Official ReUI free c-button-27 (Base Nova), MIT (c) 2025 Keenthemes.
// https://reui.io/r/base-nova/c-button-27.json
// Actual Button dependency: https://ui.shadcn.com/r/styles/base-nova/button.json
// MIT (c) 2023 shadcn; full notices are preserved in project exports.
// Only imports adapt the official wrapper; the proven equal variants are reused.
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
