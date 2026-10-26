import { Check, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { compareMoney, editorPicks, pickFeatures, productById } from "./data";
import { ComparisonCartAction } from "./cart";
import { ComparisonLayout, ComparisonRating } from "./shared";

/** Actual free Frame3 panels and Item2 media/content anatomy, composed image-first. */
export function BuyingGuidePicks() {
  return (
    <ComparisonLayout
      variant={3}
      title="The considered shortlist"
      description="Three picks for a thoughtful everyday listen."
    >
      <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
        {editorPicks.map((pick) => {
          const product = productById[pick.id];
          return (
            <Frame
              key={pick.id}
              dense
              stacked
              className="min-w-0 overflow-hidden bg-background"
              data-editor-pick={pick.id}
            >
              <FramePanel fit className="m-0! border-0 p-0 shadow-none before:hidden">
                <div className="relative aspect-[5/4] w-full bg-muted" data-pick-media>
                  <img
                    src={product.image}
                    alt={`${product.name} original headphone illustration`}
                    className="absolute inset-0 size-full object-contain"
                  />
                  <Badge
                    variant={pick.variant}
                    className="absolute left-3 top-3 sm:left-4 sm:top-4"
                    data-pick-badge
                  >
                    {pick.label}
                  </Badge>
                </div>
                <div className="flex flex-col gap-4 p-5" data-pick-body>
                  <div>
                    <h3 className="text-base font-semibold leading-6">{product.name}</h3>
                    <p className="mt-1 text-xs leading-4 text-muted-foreground">
                      Wireless headphones
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-2xl font-semibold leading-8">
                      {compareMoney(product.price)}
                    </p>
                    <ComparisonRating product={product} />
                  </div>
                  <p className="min-h-10 text-sm leading-5 text-muted-foreground">{pick.pitch}</p>
                  <ItemGroup className="gap-1!">
                    {pickFeatures.map((feature) => {
                      const included = product[feature.id];
                      return (
                        <Item
                          key={feature.id}
                          className="flex-nowrap gap-2 border-0 p-0"
                          data-pick-feature={feature.id}
                          data-included={included}
                        >
                          <ItemMedia className="self-start! pt-0.5">
                            {included ? (
                              <Check className="size-3.5 text-success" />
                            ) : (
                              <X className="size-3.5 text-muted-foreground/50" />
                            )}
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle
                              className={
                                included
                                  ? "text-sm font-normal leading-5"
                                  : "text-sm font-normal leading-5 text-muted-foreground/65"
                              }
                            >
                              {included ? feature.label : <del>{feature.label}</del>}
                            </ItemTitle>
                          </ItemContent>
                        </Item>
                      );
                    })}
                  </ItemGroup>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Battery", `${product.battery} hrs`],
                      ["Weight", `${product.weight} g`],
                      ["Codec", product.codec],
                      ["Full charge", `${product.charging} hrs`],
                    ].map(([label, value]) => (
                      <div
                        className="flex min-w-0 items-center justify-between gap-1 rounded-md border border-dashed bg-background p-2 text-xs leading-4"
                        key={label}
                        data-key-spec={label}
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <ComparisonCartAction id={product.id} />
                </div>
              </FramePanel>
            </Frame>
          );
        })}
      </div>
    </ComparisonLayout>
  );
}
