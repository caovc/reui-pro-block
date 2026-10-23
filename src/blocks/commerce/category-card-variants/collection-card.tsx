import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CollectionBrowser } from "../shop-hero-variants/collection-dialog";
import { ShopImageCard } from "../shop-hero-variants/image-card";
import type { CategoryCollection } from "./data";

/** Real c-card-7 Card/Content/media/Badge/action composition + existing c-card-8 hover image. */
export function CategoryCollectionCard({
  collection,
  variant = "browse",
}: {
  collection: CategoryCollection;
  variant?: "browse" | "filter" | "tinted";
}) {
  const Icon = collection.icon;
  return (
    <Card
      className={cn(
        "group/category gap-0 bg-transparent p-0 ring-0",
        variant === "tinted" && collection.tint,
      )}
      data-category-collection={collection.id}
      onDragStart={(event) => event.preventDefault()}
    >
      <CardContent className="flex min-w-0 flex-col gap-4 p-0">
        <div className="relative overflow-hidden rounded-xl">
          <ShopImageCard
            image={collection.image}
            alt={`${collection.name} original Bricklane still life`}
            className={cn(
              "h-auto aspect-[4/5] ring-0 [&>div:last-child]:p-3",
              variant === "filter" && "aspect-[16/11]",
            )}
          >
            <div className="absolute start-3 top-3">
              {collection.badge && (
                <Badge variant={collection.badgeVariant}>{collection.badge}</Badge>
              )}
            </div>
            <div className="translate-y-0 opacity-100 transition-all duration-300 motion-reduce:transition-none md:translate-y-3 md:opacity-0 md:group-hover/category:translate-y-0 md:group-hover/category:opacity-100 md:group-focus-within/category:translate-y-0 md:group-focus-within/category:opacity-100">
              <CollectionBrowser title={collection.name} categories={collection.categories}>
                <Button
                  className="w-full bg-white text-black hover:bg-white/90"
                  aria-label={`Browse ${collection.name}`}
                >
                  Browse <ArrowUpRight className="size-4" />
                </Button>
              </CollectionBrowser>
            </div>
          </ShopImageCard>
        </div>
        <div className={cn("space-y-2 pb-4", variant === "tinted" && "px-4 pb-5")}>
          <div
            className={cn(
              "flex items-start justify-between gap-3",
              variant === "tinted" && "flex-col gap-1 xl:flex-row xl:gap-3",
            )}
          >
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-medium leading-5">
              {variant === "tinted" && <Icon className="size-4 shrink-0" />}
              {collection.name}
            </h3>
            <span
              className="shrink-0 text-[11px] leading-5 text-muted-foreground"
              data-category-count
            >
              {collection.count} pieces
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{collection.description}</p>
          {variant === "filter" && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-muted-foreground">
              {collection.fits.map((fit) => (
                <span key={fit} className="rounded-full border px-2 py-0.5">
                  {fit}
                </span>
              ))}
              <span className="ms-auto">
                {collection.available ? "Available now" : "Coming soon"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
