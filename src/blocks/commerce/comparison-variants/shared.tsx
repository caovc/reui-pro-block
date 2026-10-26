import type { ReactNode } from "react";
import { Check, CircleHelp, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ComparisonSession, ComparisonCartDialog, ComparisonCartNotice } from "./cart";
import { compareMoney, type ComparisonProduct, type ComparisonSpec } from "./data";

export function ComparisonLayout({
  variant,
  title,
  description,
  actions,
  children,
}: {
  variant: number;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ComparisonSession>
      <TooltipProvider>
        <section
          className="mx-auto w-full max-w-6xl bg-background p-4 text-foreground sm:p-8 lg:p-10"
          data-comparison-variant={variant}
        >
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">
                Bricklane Audio · A closer listen
              </p>
              <h2 className="text-3xl font-semibold tracking-tight leading-[1.08] sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <ComparisonCartDialog />
            </div>
          </header>
          <ComparisonCartNotice />
          {children}
          <p className="mt-6 text-[11px] leading-5 text-muted-foreground">
            Original fictional demo models and specifications. Ratings and prices are illustrative;
            all cart changes stay in this preview.
          </p>
        </section>
      </TooltipProvider>
    </ComparisonSession>
  );
}
/** Actual c-rating-2 decimal rendering; no hand-painted star replacement. */
export function ComparisonRating({ product }: { product: ComparisonProduct }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
      <Rating
        rating={product.rating}
        size="sm"
        showValue
        className="gap-0.5"
        aria-label={`${product.rating} out of 5 stars`}
      />
      <span>({product.reviews})</span>
    </div>
  );
}
/** Actual c-tooltip-1 trigger/content pattern with a native focusable spec-hint control. */
export function SpecLabel({ spec }: { spec: ComparisonSpec }) {
  return (
    <span className="flex items-center gap-1.5">
      <span>{spec.label}</span>
      {spec.hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-5 shrink-0 text-muted-foreground"
              aria-label={`About ${spec.label}`}
            >
              <CircleHelp className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            <p>{spec.hint}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
export function ComparisonValue({
  product,
  spec,
  winner = false,
}: {
  product: ComparisonProduct;
  spec: ComparisonSpec;
  winner?: boolean;
}) {
  const value = product[spec.id];
  return (
    <div
      className="flex min-h-6 flex-wrap items-center gap-2 text-xs"
      data-spec={spec.id}
      data-product={product.id}
      data-winner={winner ? product.id : undefined}
    >
      {typeof value === "boolean" ? (
        <span
          className={
            value ? "flex items-center gap-1.5" : "flex items-center gap-1.5 text-muted-foreground"
          }
        >
          {value ? (
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="size-3.5 opacity-50" />
          )}
          {value ? "Included" : "Not included"}
        </span>
      ) : spec.id === "price" ? (
        <span className="font-semibold">{compareMoney(Number(value))}</span>
      ) : spec.id === "rating" ? (
        <ComparisonRating product={product} />
      ) : (
        <span>
          {value}
          {spec.unit && ` ${spec.unit}`}
        </span>
      )}
      {winner && (
        <Badge variant="success-light" size="sm">
          <Check className="size-3" />
          Better
        </Badge>
      )}
    </div>
  );
}
