import { Check, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { compareMoney, editorPicks, pickFeatures, productById } from "./data";
import { ComparisonCartAction } from "./cart";
import { ComparisonLayout, ComparisonRating } from "./shared";

/** Actual c-frame-3 stacked panel implementation and c-item-2 media/content checklist anatomy. */
export function BuyingGuidePicks() {
  return (
    <ComparisonLayout
      variant={3}
      title="The considered shortlist"
      description="Three different starting points for a good everyday listen. Original demo picks, with the trade-offs kept in view."
    >
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {editorPicks.map((pick) => {
          const product = productById[pick.id];
          return (
            <Frame
              key={pick.id}
              stacked
              spacing="sm"
              className="min-w-0"
              data-editor-pick={pick.id}
            >
              <FrameHeader>
                <Badge variant={pick.variant} className="w-fit">
                  {pick.label}
                </Badge>
                <FrameDescription className="mt-3 text-xs leading-5">{pick.pitch}</FrameDescription>
              </FrameHeader>
              <FramePanel fit>
                <img
                  src={product.image}
                  alt={`${product.name} original headphone illustration`}
                  className="h-56 w-full rounded-none! bg-[#e8e7df] object-contain scale-150"
                />
              </FramePanel>
              <FramePanel fit>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Bricklane Audio
                </p>
                <h3 className="mt-1 text-xl font-semibold leading-tight">{product.name}</h3>
                <div className="mt-3">
                  <ComparisonRating product={product} />
                </div>
                <p className="mt-4 text-2xl font-semibold">{compareMoney(product.price)}</p>
              </FramePanel>
              <FramePanel>
                <ItemGroup className="gap-1!">
                  {pickFeatures.map((feature) => {
                    const included = product[feature.id];
                    return (
                      <Item
                        key={feature.id}
                        className="gap-2 border-0 p-0 py-1"
                        data-pick-feature={feature.id}
                        data-included={included}
                      >
                        <ItemMedia className="self-start! pt-0.5">
                          {included ? (
                            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="size-3.5 text-muted-foreground/50" />
                          )}
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle
                            className={
                              included
                                ? "text-xs font-normal"
                                : "text-xs font-normal text-muted-foreground/65"
                            }
                          >
                            {included ? feature.label : <del>{feature.label}</del>}
                          </ItemTitle>
                        </ItemContent>
                      </Item>
                    );
                  })}
                </ItemGroup>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    ["Battery", `${product.battery} hrs`],
                    ["Weight", `${product.weight} g`],
                    ["Codec", product.codec],
                    ["Full charge", `${product.charging} hrs`],
                  ].map(([label, value]) => (
                    <div className="rounded-lg bg-muted/60 p-2.5" key={label} data-key-spec={label}>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="mt-1 text-xs font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </FramePanel>
              <FrameFooter>
                <ComparisonCartAction id={product.id} />
              </FrameFooter>
            </Frame>
          );
        })}
      </div>
    </ComparisonLayout>
  );
}
