import { useRef, useState } from "react";
import { ArrowLeftRight, Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { DialogSurface } from "../../../application/dialog-variants/first-run/free/dialog-surface";
import { ComparisonCartAction } from "../cart";
import {
  compareMoney,
  comparisonGroups,
  pickFeatures,
  productById,
  type ComparisonProduct,
  type ComparisonProductId,
} from "../data";
import { ComparisonLayout, ComparisonRating, ComparisonValue, SpecLabel } from "../shared";
import "./visual-followups.css";

// Same fixed candidate ordering, with the current focus excluded after every switch.
const shortlist: ComparisonProductId[] = ["field", "sora", "studio", "arc"];
const displayedFeatures = pickFeatures.filter(({ id }) =>
  ["anc", "multipoint", "hires", "foldable"].includes(id),
);

function FeatureChecklist({ product }: { product: ComparisonProduct }) {
  return (
    <ul className="comparison-alternative-features" aria-label={`${product.name} features`}>
      {displayedFeatures.map(({ id, label }) => (
        <li
          key={id}
          className="flex min-h-5 items-center gap-2 text-xs"
          data-alternative-feature={id}
          data-included={product[id]}
        >
          {product[id] ? (
            <Check className="size-3.5 shrink-0" />
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

function LocalModelDetails({ product }: { product: ComparisonProduct }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`View ${product.name} sample details`}>
          Details
        </Button>
      </DialogTrigger>
      <DialogSurface
        id={0}
        title={`${product.name} — sample details`}
        description="Independent local specifications for a fictional model. The original Details destination was not verified."
        initialFocus={() => closeButton.current?.focus()}
        footer={
          <DialogClose asChild>
            <Button ref={closeButton}>Back to alternatives</Button>
          </DialogClose>
        }
      >
        <Frame stacked spacing="sm">
          {comparisonGroups.map((group) => (
            <FramePanel key={group.id} fit>
              <h4 className="mb-3 text-sm font-semibold">{group.name}</h4>
              <dl className="flex flex-col gap-3">
                {group.specs.map((spec) => (
                  <div key={spec.id} className="grid grid-cols-2 items-start gap-3">
                    <dt className="text-xs text-muted-foreground">
                      <SpecLabel spec={spec} />
                    </dt>
                    <dd>
                      <ComparisonValue product={product} spec={spec} />
                    </dd>
                  </div>
                ))}
              </dl>
            </FramePanel>
          ))}
        </Frame>
      </DialogSurface>
    </Dialog>
  );
}

/** Actual c-frame-3 stacked panels plus c-item-2 media/content/actions composition. */
export function AlternativesSwitcher() {
  const [focusedId, setFocusedId] = useState<ComparisonProductId>("field");
  const focused = productById[focusedId];
  const alternatives = shortlist.filter((id) => id !== focusedId).map((id) => productById[id]);
  return (
    <ComparisonLayout
      variant={5}
      eyebrow="Before you decide"
      title="Compare with similar models"
      description={`You're looking at ${focused.name}. Here are three alternatives worth considering.`}
      actions={
        <Button variant="outline" onClick={() => setFocusedId("field")}>
          Reset focus
        </Button>
      }
    >
      <p className="sr-only" aria-live="polite">
        Now comparing alternatives to {focused.name}.
      </p>
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Frame dense stacked spacing="lg" data-focused-model={focused.id}>
          <FramePanel fit className="p-0!">
            <Badge variant="secondary" className="absolute top-3 left-3">
              You're viewing
            </Badge>
            <img
              src={focused.image}
              alt={`${focused.name} original headphone illustration`}
              className="aspect-5/4 w-full bg-muted/30 object-contain"
              data-focused-image
            />
          </FramePanel>
          <FramePanel fit className="comparison-focus-body">
            <div className="comparison-focus-meta">
              <div>
                <h3 className="text-xl font-semibold leading-7 tracking-tight">{focused.name}</h3>
                <p className="mt-1 text-xs leading-4 text-muted-foreground">Over-ear headphones</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{focused.tagline}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong
                  className="text-3xl font-semibold leading-9 tracking-tight"
                  data-focused-price
                >
                  {compareMoney(focused.price)}
                </strong>
                <ComparisonRating product={focused} />
              </div>
            </div>
            {/* Actual free c-separator-5 centered-label composition. */}
            <div className="relative h-[16.5px]" data-included-features>
              <Separator className="absolute top-1/2" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[11px] leading-[16.5px] font-medium whitespace-nowrap uppercase tracking-wider text-muted-foreground">
                Included features
              </span>
            </div>
            <div className="mt-3">
              <FeatureChecklist product={focused} />
            </div>
            <div className="mt-4">
              <ComparisonCartAction id={focused.id} />
            </div>
          </FramePanel>
        </Frame>
        <ItemGroup className="gap-3">
          {alternatives.map((product) => {
            const delta = product.price - focused.price;
            return (
              <Item
                key={product.id}
                variant="outline"
                className="comparison-rival"
                data-alternative={product.id}
              >
                <ItemMedia>
                  <img
                    src={product.image}
                    alt={`${product.name} original headphone illustration`}
                    className="size-24 rounded-lg object-contain"
                  />
                </ItemMedia>
                <ItemContent className="min-w-0 gap-1">
                  <ItemTitle>
                    <h4 className="text-base font-semibold leading-6">{product.name}</h4>
                  </ItemTitle>
                  <p className="text-xs leading-4 text-muted-foreground">Over-ear headphones</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm leading-5">{compareMoney(product.price)}</strong>
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
                        `${delta < 0 ? "−" : "+"}${compareMoney(Math.abs(delta))}`
                      )}
                    </Badge>
                  </div>
                  <ComparisonRating product={product} />
                </ItemContent>
                <div className="col-span-2 self-center">
                  <FeatureChecklist product={product} />
                </div>
                <ItemActions className="col-span-2 w-full justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Switch focus to ${product.name}`}
                    onClick={() => setFocusedId(product.id)}
                  >
                    <ArrowLeftRight data-icon="inline-start" />
                    Switch to this
                  </Button>
                  <LocalModelDetails product={product} />
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </div>
    </ComparisonLayout>
  );
}
