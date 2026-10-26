import type { ReactNode } from "react";
import { Check, CircleHelp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rating } from "@/components/reui/rating";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ComparisonSession, ComparisonCartDialog, ComparisonCartNotice } from "./cart";
import { compareMoney, type ComparisonProduct, type ComparisonSpec } from "./data";

export function ComparisonLayout({
  variant,
  title,
  description,
  eyebrow: eyebrowOverride,
  headerActions,
  actions,
  children,
}: {
  variant: number;
  title: string;
  description: string;
  eyebrow?: string;
  headerActions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const eyebrow =
    eyebrowOverride ??
    (variant === 1
      ? null
      : variant === 2
        ? "Head To Head"
        : variant === 3
          ? "Editor's Picks"
          : "Bricklane Audio · A closer listen");
  return (
    <ComparisonSession>
      <TooltipProvider>
        <section
          className="mx-auto w-full max-w-6xl bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8 lg:py-10"
          data-comparison-variant={variant}
        >
          <div data-comparison-content>
            <header
              className={cn(
                "mb-8 flex flex-wrap items-end justify-between gap-4",
                variant === 2 && "mb-6 gap-3",
              )}
            >
              <div
                className={cn(
                  "min-w-0",
                  (variant === 1 || variant === 2) && "w-full sm:w-auto",
                  variant === 3 && "min-h-32 sm:min-h-20",
                )}
              >
                {eyebrow && (
                  <p
                    className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    data-comparison-eyebrow
                  >
                    {eyebrow}
                  </p>
                )}
                <h2
                  className="text-2xl font-semibold leading-8 tracking-tight sm:text-3xl sm:leading-9"
                  data-comparison-heading
                >
                  {title}
                </h2>
                <p
                  className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground"
                  data-comparison-description
                >
                  {description}
                </p>
              </div>
              {variant === 1 && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              {headerActions && (
                <div className="flex flex-wrap items-center gap-2" data-comparison-header-actions>
                  {headerActions}
                </div>
              )}
            </header>
            <ComparisonCartNotice />
            {children}
            <footer
              className="mt-6 flex flex-wrap items-center justify-end gap-2"
              aria-label="Comparison demo actions"
            >
              {variant !== 1 && actions}
              <ComparisonCartDialog />
            </footer>
            <p className="mt-6 text-[11px] leading-5 text-muted-foreground">
              Original fictional demo models and specifications. Ratings and prices are
              illustrative; all cart changes stay in this preview.
            </p>
          </div>
        </section>
      </TooltipProvider>
    </ComparisonSession>
  );
}
/** Actual c-rating-2 decimal rendering; no hand-painted star replacement. */
export function ComparisonRating({
  product,
  compact = false,
}: {
  product: ComparisonProduct;
  compact?: boolean;
}) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Rating
        rating={product.rating}
        size="sm"
        showValue
        className={cn("gap-0.5 [&_svg]:size-3", compact && "[&>div]:hidden sm:[&>div]:flex")}
        aria-label={`${product.rating} out of 5 stars`}
      />
      <span className={compact ? "hidden sm:inline" : undefined} data-comparison-reviews>
        ({product.reviews})
      </span>
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
  compactRating = false,
}: {
  product: ComparisonProduct;
  spec: ComparisonSpec;
  winner?: boolean;
  compactRating?: boolean;
}) {
  const value = product[spec.id];
  return (
    <div
      className={cn("flex min-h-5 flex-wrap items-center gap-2 text-xs", winner && "font-semibold")}
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
          <span className={compactRating ? "sr-only sm:not-sr-only" : undefined}>
            {value ? "Included" : "Not included"}
          </span>
        </span>
      ) : spec.id === "price" ? (
        <span>{compareMoney(Number(value))}</span>
      ) : spec.id === "rating" ? (
        <ComparisonRating product={product} compact={compactRating} />
      ) : (
        <span>
          {value}
          {spec.unit && ` ${spec.unit}`}
        </span>
      )}
      {winner && <span className="sr-only">Better numeric value</span>}
    </div>
  );
}
