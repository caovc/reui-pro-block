import { useState } from "react";
import { Check, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Frame, FramePanel } from "@/components/reui/frame";
import { Alert, AlertDescription } from "@/components/reui/alert";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { shopArtwork } from "./artwork";
import { shopMoney, shopProducts, type ShopProduct } from "./data";
import type { ShopCart } from "./use-shop-cart";

/** Actual official c-item-2 media/content/actions anatomy; domain content is local. */
export function ShopProductRow({ product, cart }: { product: ShopProduct; cart: ShopCart }) {
  return (
    <Item variant="outline" className="flex-nowrap items-start gap-3 p-3">
      <ItemMedia variant="image" className="size-16 self-start!">
        <img src={shopArtwork(product.artwork)} alt={product.name} />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="text-sm">{product.name}</ItemTitle>
        <ItemDescription>{product.detail}</ItemDescription>
        <span className="font-medium">{shopMoney(product.price)}</span>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline" onClick={() => cart.add(product)}>
          Add
          <span className="sr-only"> {product.name}</span>
        </Button>
      </ItemActions>
    </Item>
  );
}

export function ShopCollectionDialog({
  title,
  cart,
  children,
}: {
  title: string;
  cart: ShopCart;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Small-batch essentials from the Bricklane sample collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {shopProducts.map((product) => (
            <ShopProductRow key={product.id} product={product} cart={cart} />
          ))}
        </div>
        {cart.message && (
          <Alert variant="success">
            <Check />
            <AlertDescription>{cart.message}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ShopCartDialog({ cart }: { cart: ShopCart }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Dialog onOpenChange={() => setConfirmed(false)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Cart with ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
        >
          <ShoppingBag className="size-4" /> Cart <span data-shop-cart-count>{cart.count}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Your cart</DialogTitle>
          <DialogDescription>{cart.count} items in your local shopping bag.</DialogDescription>
        </DialogHeader>
        {cart.count ? (
          <>
            <Frame spacing="sm" stacked>
              {shopProducts
                .filter((product) => cart.quantities[product.id])
                .map((product) => (
                  <FramePanel key={product.id}>
                    <Item className="gap-3 p-0">
                      <ItemMedia variant="image" className="size-14">
                        <img src={shopArtwork(product.artwork)} alt={product.name} />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle>{product.name}</ItemTitle>
                        <ItemDescription>{shopMoney(product.price)}</ItemDescription>
                      </ItemContent>
                      <ItemActions className="w-full justify-end">
                        <NumberField
                          min={1}
                          max={20}
                          value={cart.quantities[product.id]}
                          onValueChange={(value) => cart.update(product.id, value || 1)}
                        >
                          <NumberFieldGroup className="w-28">
                            <NumberFieldDecrement aria-label={`Decrease ${product.name}`} />
                            <NumberFieldInput aria-label={`Quantity of ${product.name}`} />
                            <NumberFieldIncrement aria-label={`Increase ${product.name}`} />
                          </NumberFieldGroup>
                        </NumberField>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${product.name}`}
                          onClick={() => cart.update(product.id, 0)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </ItemActions>
                    </Item>
                  </FramePanel>
                ))}
            </Frame>
            <div className="flex items-center justify-between font-semibold">
              <span>Subtotal</span>
              <span data-shop-cart-total>{shopMoney(cart.total)}</span>
            </div>
            <Button onClick={() => setConfirmed(true)}>Review order</Button>
            {confirmed && (
              <Alert variant="success">
                <Check />
                <AlertDescription>
                  Order review ready for {cart.count} items · {shopMoney(cart.total)}. This local
                  demo does not collect payment.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ShoppingBag className="size-9 text-muted-foreground" />
            <p>Your bag is empty.</p>
            <p className="text-sm text-muted-foreground">Add a piece from the edit to begin.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
