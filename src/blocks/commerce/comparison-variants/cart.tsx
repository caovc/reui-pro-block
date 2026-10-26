import { useState, type ReactNode } from "react";
import { DialogSurface } from "../../application/dialog-variants/first-run/free/dialog-surface";
import "../../application/dialog-variants/first-run/first-run.css";
import { Check, ShoppingBag, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { comparisonProducts, compareMoney, productById, type ComparisonProductId } from "./data";
import { ComparisonCartContext, useComparisonCart } from "./cart-context";

export function ComparisonSession({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Partial<Record<ComparisonProductId, number>>>({});
  const [message, setMessage] = useState("");
  const count = Object.values(quantities).reduce((sum, value) => sum + (value || 0), 0);
  const total = comparisonProducts.reduce(
    (sum, product) => sum + (quantities[product.id] || 0) * product.price,
    0,
  );
  const update = (id: ComparisonProductId, quantity: number) => {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(5, Math.round(quantity))),
    }));
    setMessage(
      quantity ? "Cart quantity updated." : `${productById[id].name} removed from your cart.`,
    );
  };
  const add = (id: ComparisonProductId) => {
    setQuantities((current) => ({ ...current, [id]: Math.min(5, (current[id] || 0) + 1) }));
    setMessage(`${productById[id].name} added to your cart.`);
  };
  const clear = () => {
    setQuantities({});
    setMessage("Your cart is now empty.");
  };
  return (
    <ComparisonCartContext.Provider
      value={{ quantities, update, add, clear, count, total, message }}
    >
      {children}
    </ComparisonCartContext.Provider>
  );
}

/** Reuses the existing actual free c-dialog-3/6 surface, c-number-field-1
 * behavior and c-frame-3 panels. Cart records and arithmetic are local domain state.
 */
export function ComparisonCartDialog() {
  const cart = useComparisonCart();
  const items = comparisonProducts.filter((product) => (cart.quantities[product.id] || 0) > 0);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Cart with ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
        >
          <ShoppingBag className="size-4" />
          Cart
          <Badge variant="secondary" size="sm" data-comparison-cart-count>
            {cart.count}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogSurface
        id={0}
        title="Your cart"
        description="Fictional Bricklane Audio samples. This local preview does not place an order."
        footer={
          <>
            {items.length > 0 && (
              <Button variant="outline" onClick={cart.clear}>
                Clear cart
              </Button>
            )}
            <DialogClose asChild>
              <Button>{items.length ? "Continue browsing" : "Continue comparing"}</Button>
            </DialogClose>
          </>
        }
      >
        {items.length ? (
          <>
            <ScrollArea className="h-[min(55dvh,28rem)]">
              <Frame stacked spacing="sm">
                {items.map((product) => (
                  <FramePanel key={product.id}>
                    <Item className="gap-3 border-0 p-0" data-comparison-cart-item={product.id}>
                      <ItemMedia>
                        <img
                          src={product.image}
                          alt=""
                          className="size-14 rounded-lg object-cover"
                        />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle>{product.name}</ItemTitle>
                        <p className="text-xs text-muted-foreground">
                          {compareMoney(product.price)} each
                        </p>
                      </ItemContent>
                      <ItemActions className="w-full flex-wrap justify-between ps-[4.25rem] sm:w-auto sm:ps-0">
                        <NumberField
                          className="w-28"
                          min={1}
                          max={5}
                          step={1}
                          value={cart.quantities[product.id] || 1}
                          onValueChange={(value) => cart.update(product.id, value ?? 1)}
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement
                              aria-label={`Decrease ${product.name} quantity`}
                            />
                            <NumberFieldInput aria-label={`${product.name} quantity`} />
                            <NumberFieldIncrement
                              aria-label={`Increase ${product.name} quantity`}
                            />
                          </NumberFieldGroup>
                        </NumberField>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${product.name} from cart`}
                          onClick={() => cart.update(product.id, 0)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </ItemActions>
                    </Item>
                  </FramePanel>
                ))}
              </Frame>
            </ScrollArea>
            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span>
                Subtotal · {cart.count} {cart.count === 1 ? "item" : "items"}
              </span>
              <strong data-comparison-cart-total>{compareMoney(cart.total)}</strong>
            </div>
          </>
        ) : (
          <Empty className="bg-muted">
            <EmptyHeader>
              <EmptyTitle role="heading" aria-level={3}>
                Your cart is empty
              </EmptyTitle>
              <EmptyDescription>
                Add a sample model from the comparison to see quantities and totals here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </DialogSurface>
    </Dialog>
  );
}
export function ComparisonCartAction({
  id,
  compact = false,
}: {
  id: ComparisonProductId;
  compact?: boolean;
}) {
  const cart = useComparisonCart();
  const quantity = cart.quantities[id] || 0;
  return (
    <Button
      size={compact ? "sm" : "default"}
      className="w-full"
      disabled={quantity >= 5}
      aria-label={`Add ${productById[id].name} to cart`}
      onClick={() => cart.add(id)}
    >
      <ShoppingBag className="size-3.5" />
      {quantity >= 5 ? "Limit reached" : quantity ? "Add another" : "Add to cart"}
      {quantity > 0 && <span className="ms-1 text-[10px] opacity-75">({quantity})</span>}
    </Button>
  );
}
export function ComparisonCartNotice() {
  const { message } = useComparisonCart();
  return message ? (
    <Alert variant="success" className="mb-5">
      <Check />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  ) : null;
}
