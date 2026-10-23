import type { ReactNode } from "react";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { archiveOffers, offerPrice } from "./release-data";

/** Official Frame + c-item-2 / c-scroll-area-1 composition for local price-cut data. */
export function ArchiveOffers({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>The Bricklane archive</DialogTitle>
          <DialogDescription>
            {archiveOffers.length} sample pieces, each 40% less than its original price.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[min(56dvh,32rem)] w-full">
          <Frame spacing="sm" stacked>
            {archiveOffers.map((product) => (
              <FramePanel key={product.id} data-archive-product={product.id}>
                <Item className="flex-nowrap gap-3 p-0">
                  <ItemMedia variant="image" className="size-14 self-start!">
                    <img src={product.image} alt={product.name} />
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-1">
                    <ItemTitle className="text-xs sm:text-sm">{product.name}</ItemTitle>
                    <ItemDescription className="text-xs">{product.detail}</ItemDescription>
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <strong data-archive-sale>{offerPrice(product.salePrice)}</strong>
                      <del className="text-xs text-muted-foreground" data-archive-original>
                        {offerPrice(product.price)}
                      </del>
                    </p>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="destructive-light" size="sm">
                      −{product.discount}%
                    </Badge>
                  </ItemActions>
                </Item>
              </FramePanel>
            ))}
          </Frame>
        </ScrollArea>
        <Alert variant="info">
          <AlertDescription>
            These are local sample offers. No purchase or reservation is made in this preview.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
