import { useState } from "react";
import { ArrowLeftRight, Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ComparisonCartAction } from "../cart";
import {
  compareMoney,
  pickFeatures,
  productById,
  type ComparisonProduct,
  type ComparisonProductId,
} from "../data";
import { ComparisonLayout, ComparisonRating } from "../shared";

const shortlist: ComparisonProductId[] = ["field", "sora", "studio", "arc"];

function FeatureChecklist({
  product,
  compact = false,
}: {
  product: ComparisonProduct;
  compact?: boolean;
}) {
  return (
    <ul
      className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}
      aria-label={`${product.name} features`}
    >
      {pickFeatures.map(({ id, label }) => (
        <li
          key={id}
          className="flex items-center gap-2 text-xs"
          data-alternative-feature={id}
          data-included={product[id]}
        >
          {product[id] ? (
            <Check className="size-3.5 shrink-0 text-success" />
          ) : (
            <X className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {product[id] ? (
            <span>{label}</span>
          ) : (
            <del className="text-muted-foreground">{label}</del>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Actual c-frame-3 panels and c-item-2 image/content/actions composition. */
export function AlternativesSwitcher() {
  const [focusedId, setFocusedId] = useState<ComparisonProductId>("field");
  const focused = productById[focusedId];
  const alternatives = shortlist.filter((id) => id !== focusedId).map((id) => productById[id]);
  return (
    <ComparisonLayout
      variant={5}
      title="Meet the alternatives."
      description="Start with a favorite. Switch perspective to see how the other three stack up."
      actions={
        <Button variant="outline" onClick={() => setFocusedId("field")}>
          Reset focus
        </Button>
      }
    >
      <p className="sr-only" aria-live="polite">
        Now comparing alternatives to {focused.name}.
      </p>
      <div className="grid items-start gap-5 lg:grid-cols-[.95fr_1.25fr]">
        <Frame stacked data-focused-model={focused.id}>
          <FramePanel fit>
            <Badge variant="primary-light">In focus</Badge>
            <img
              src={focused.image}
              alt={`${focused.name} original headphone illustration`}
              className="my-4 h-64 w-full rounded-xl object-contain sm:h-72"
            />
            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold tracking-tight">{focused.name}</h3>
              <p className="text-sm text-muted-foreground">{focused.tagline}</p>
              <ComparisonRating product={focused} />
            </div>
          </FramePanel>
          <FramePanel fit>
            <FeatureChecklist product={focused} />
          </FramePanel>
          <FramePanel fit>
            <div className="mb-4 flex items-center justify-between gap-2">
              <strong className="text-3xl tracking-tight" data-focused-price>
                {compareMoney(focused.price)}
              </strong>
              <span className="text-xs text-muted-foreground">Sample price · USD</span>
            </div>
            <ComparisonCartAction id={focused.id} />
          </FramePanel>
        </Frame>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Three other ways to listen</h3>
            <Badge variant="secondary" size="sm">
              vs {focused.name}
            </Badge>
          </div>
          <ItemGroup>
            {alternatives.map((product) => {
              const delta = product.price - focused.price;
              return (
                <Item
                  key={product.id}
                  variant="outline"
                  className="items-start gap-4 p-4"
                  data-alternative={product.id}
                >
                  <ItemMedia>
                    <img
                      src={product.image}
                      alt={`${product.name} original headphone illustration`}
                      className="size-20 rounded-lg object-contain sm:size-24"
                    />
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-2">
                    <ItemTitle>
                      <h4>{product.name}</h4>
                    </ItemTitle>
                    <ComparisonRating product={product} />
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{compareMoney(product.price)}</strong>
                      <Badge
                        variant={delta < 0 ? "success-light" : "secondary"}
                        size="sm"
                        data-price-delta={delta}
                      >
                        {delta === 0 ? (
                          <>
                            <Minus />
                            Same price
                          </>
                        ) : (
                          `${compareMoney(Math.abs(delta))} ${delta < 0 ? "less" : "more"}`
                        )}
                      </Badge>
                    </div>
                  </ItemContent>
                  <div className="w-full">
                    <FeatureChecklist product={product} compact />
                  </div>
                  <ItemActions className="w-full justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Switch focus to ${product.name}`}
                      onClick={() => setFocusedId(product.id)}
                    >
                      <ArrowLeftRight data-icon="inline-start" />
                      Switch
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        </div>
      </div>
    </ComparisonLayout>
  );
}
