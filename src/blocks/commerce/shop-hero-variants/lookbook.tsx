import { ArrowRight } from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { wishlistArtwork } from "../wishlist-artwork";
import { CollectionBrowser, CollectionSaveProvider } from "./collection-dialog";
import { ShopImageCard } from "./image-card";
import { ArchiveOffers } from "./archive-offers";
import { archiveOffers, seasonalCategories, seasonalPieces } from "./release-data";
import { ReleaseStatus } from "./release-status";

export function SeasonalLookbookHero() {
  return (
    <CollectionSaveProvider>
      <section
        className="mx-auto w-full max-w-[1440px] bg-background p-4 text-foreground sm:p-7"
        data-shop-hero-variant="6"
        aria-label="Seasonal lookbook"
      >
        <Card className="grid gap-0 overflow-hidden p-0 lg:grid-cols-2">
          <CardContent className="flex flex-col items-start gap-6 p-6 sm:p-9 lg:p-12">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandGlyph className="size-8" />
                <span className="text-[11px] font-semibold uppercase tracking-[.2em]">
                  Bricklane Goods
                </span>
              </div>
              <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border border-foreground/30 text-center">
                <span className="text-[8px] uppercase tracking-wider">Edition</span>
                <strong className="font-mono text-xl leading-tight">03</strong>
              </span>
            </div>
            <ReleaseStatus phase="live" label="The new season is here" ping />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[.18em] text-muted-foreground">
                Spring / Summer 2026
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] leading-[1.04] sm:text-5xl xl:text-6xl">
                Nothing extra.
                <br />
                Everything considered.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
                {seasonalPieces.length} new pieces, made for the everyday. Easy layers, useful
                companions and the details you notice over time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CollectionBrowser title="The seasonal edit" categories={seasonalCategories}>
                <Button>
                  Shop The Edit <ArrowRight className="size-4" />
                </Button>
              </CollectionBrowser>
              <ArchiveOffers>
                <Button variant="outline">
                  Shop Sale{" "}
                  <Badge variant="destructive-light" size="sm">
                    Up to 40%
                  </Badge>
                </Button>
              </ArchiveOffers>
            </div>
            <div className="mt-auto grid w-full grid-cols-2 gap-5 border-t pt-5">
              <div>
                <p className="text-2xl font-semibold tabular-nums" data-seasonal-new>
                  {seasonalPieces.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">New pieces in the edit</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums" data-seasonal-archive>
                  {archiveOffers.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Pieces in the archive</p>
              </div>
            </div>
          </CardContent>
          <ShopImageCard
            image={wishlistArtwork("coat", "#a49a7c")}
            alt="Original Bricklane seasonal coat still life"
            className="h-[29rem] rounded-none ring-0 [&>img]:rounded-none! sm:h-[35rem] lg:h-full lg:min-h-[40rem]"
          >
            <div className="mb-auto">
              <ReleaseStatus phase="new" label="New Drop" onImage />
            </div>
            <p className="text-xs uppercase tracking-[.2em] text-white/85">
              Edition 03 · <span data-seasonal-image-count>{seasonalPieces.length}</span> pieces
            </p>
          </ShopImageCard>
        </Card>
      </section>
    </CollectionSaveProvider>
  );
}
