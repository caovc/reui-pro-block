import { LifeBuoy, MoreHorizontal, RotateCcw, ShoppingBag, Star, Truck } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { Rating } from "@/components/reui/rating";
import { ReceiptAftercare } from "./receipt-aftercare";
import { receiptItems, receiptMoney, receiptOrder as order } from "./receipt-data";
import {
  PaidBadge,
  ReceiptAddress,
  ReceiptBrand,
  ReceiptItems,
  ReceiptPayment,
  ReceiptToolbar,
  ReceiptTotals,
  TrackingAction,
} from "./receipt-shared";
import "./receipt-refined.css";

function OrderHero({ delivered = false }: { delivered?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div>
        {delivered ? (
          <Badge variant="success" radius="full" size="sm">
            Delivered
          </Badge>
        ) : (
          <PaidBadge />
        )}
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Order {order.id}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {delivered ? "Arrived May 23, 2026 to Brooklyn, NY." : `Confirmed on ${order.date}.`}{" "}
          Receipt for <span className="text-foreground">{order.email}</span>.
        </p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="text-[10px] tracking-[.18em] text-muted-foreground">TOTAL PAID</p>
        <strong className="mt-1 block text-3xl tracking-tight">{receiptMoney(order.total)}</strong>
        <p className="mt-1 text-xs text-muted-foreground">{order.card}</p>
      </div>
    </div>
  );
}

export function DeliveredOrderReceipt() {
  return (
    <ReceiptAftercare>
      {({ open, reviews, bagCount }) => (
        <main
          className="receipt-container mx-auto max-w-3xl space-y-4 px-4 py-10 text-sm sm:px-6"
          data-receipt-variant="4"
        >
          <ReceiptToolbar />
          {!!bagCount && (
            <Badge variant="info-light" className="receipt-actions">
              Local bag · {bagCount} items
            </Badge>
          )}
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="p-4 sm:p-5">
              <OrderHero delivered />
            </FramePanel>
          </Frame>
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="p-4 sm:p-5">
              <h2 className="mb-4 text-base font-semibold">3 items</h2>
              <ItemGroup className="gap-0 divide-y">
                {receiptItems.map((item) => (
                  <Item
                    key={item.id}
                    className="items-start rounded-none border-0 border-b px-0 py-5 first:pt-0 last:border-b-0"
                  >
                    <ItemMedia>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-16 rounded-lg bg-muted object-cover"
                      />
                    </ItemMedia>
                    <ItemContent className="min-w-0 gap-1">
                      <p className="text-[10px] tracking-wide text-muted-foreground">HALDEN</p>
                      <ItemTitle>{item.name}</ItemTitle>
                      <ItemDescription className="text-xs">
                        {item.detail} · Qty {item.qty}
                      </ItemDescription>
                      {reviews[item.id] && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Rating
                            size="sm"
                            rating={reviews[item.id].rating}
                            aria-label={`Your rating for ${item.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            Your review · {reviews[item.id].date}
                          </span>
                        </div>
                      )}
                      <div className="receipt-actions mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={
                            reviews[item.id]
                              ? `Buy ${item.name} again`
                              : `Write a review for ${item.name}`
                          }
                          onClick={() =>
                            open({ kind: reviews[item.id] ? "reorder" : "review", itemId: item.id })
                          }
                        >
                          {reviews[item.id] ? <ShoppingBag /> : <Star />}
                          {reviews[item.id] ? "Buy again" : "Write review"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label={`More actions for ${item.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onSelect={() => open({ kind: "reorder", itemId: item.id })}
                            >
                              Buy again
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => open({ kind: "product", itemId: item.id })}
                            >
                              View product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => open({ kind: "review", itemId: item.id })}
                            >
                              {reviews[item.id] ? "Update review" : "Write review"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => open({ kind: "return", itemId: item.id })}
                            >
                              Return item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => open({ kind: "support", itemId: item.id })}
                            >
                              Get help
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </ItemContent>
                    <ItemActions className="ml-auto flex-col items-end text-sm">
                      <strong>{receiptMoney(item.price * item.qty)}</strong>
                      {item.qty > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {receiptMoney(item.price)} each
                        </span>
                      )}
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </FramePanel>
            <FrameFooter className="bg-muted/30 p-4 sm:p-5">
              <ReceiptTotals />
            </FrameFooter>
          </Frame>
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="flex flex-wrap items-center justify-between gap-5 p-4">
              <div className="flex items-start gap-3">
                <Truck className="mt-1 size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm">
                    {order.carrier} · <span className="break-all">{order.tracking}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered May 23, 2026.{" "}
                    <TrackingAction delivered>View tracking history</TrackingAction>
                  </p>
                </div>
              </div>
              <div className="receipt-actions flex gap-2">
                <Button size="sm" variant="outline" onClick={() => open({ kind: "reorder" })}>
                  <RotateCcw />
                  Reorder all
                </Button>
                <Button size="sm" variant="ghost" onClick={() => open({ kind: "support" })}>
                  <LifeBuoy />
                  Get help
                </Button>
              </div>
            </FramePanel>
          </Frame>
        </main>
      )}
    </ReceiptAftercare>
  );
}

export function StatementReceipt() {
  return (
    <ReceiptAftercare>
      {({ open }) => (
        <main
          className="receipt-container mx-auto max-w-4xl space-y-5 px-4 py-10 text-sm sm:px-6"
          data-receipt-variant="5"
        >
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="grid gap-8 p-4 sm:grid-cols-[280px_minmax(0,1fr)] sm:p-5">
              <aside className="space-y-5 sm:border-r sm:pr-7">
                <div className="flex items-center justify-between">
                  <ReceiptBrand compact />
                  <PaidBadge />
                </div>
                <div>
                  <p className="text-[10px] tracking-[.18em] text-muted-foreground">TOTAL PAID</p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {receiptMoney(order.total)}
                  </h1>
                  <p className="mt-1 text-xs text-muted-foreground">on {order.date}</p>
                </div>
                <Separator />
                <section>
                  <h2 className="text-[10px] tracking-[.18em] text-muted-foreground">ORDER</h2>
                  <p className="mt-2 font-mono text-sm">{order.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Receipt {order.receipt}</p>
                </section>
                <section>
                  <h2 className="text-[10px] tracking-[.18em] text-muted-foreground">PAID WITH</h2>
                  <p className="mt-2">{order.card}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Expires {order.expiry}</p>
                </section>
                <section>
                  <h2 className="text-[10px] tracking-[.18em] text-muted-foreground">ARRIVES</h2>
                  <p className="mt-2">May 22 to May 25</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.carrier}</p>
                </section>
                <section>
                  <h2 className="text-[10px] tracking-[.18em] text-muted-foreground">SHIPS TO</h2>
                  <p className="mt-2 font-medium">{order.customer}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    180 Bedford Avenue, Brooklyn, NY 11211
                  </p>
                </section>
                <Separator />
                <div className="receipt-actions">
                  <TrackingAction variant="default" className="w-full">
                    Track your shipment
                  </TrackingAction>
                </div>
              </aside>
              <section className="min-w-0 space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[10px] tracking-[.18em] text-muted-foreground">
                    ORDER ITEMS
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    3 items · Confirmed {order.date}
                  </span>
                </header>
                <ReceiptItems />
                <Separator />
                <ReceiptTotals />
              </section>
            </FramePanel>
          </Frame>
          <ReceiptToolbar bottom />
          <p className="receipt-actions text-center text-xs leading-5 text-muted-foreground">
            Tracking updates are associated with{" "}
            <span className="text-foreground">{order.email}</span>.{" "}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => open({ kind: "support" })}
            >
              Contact demo support
            </Button>
            .
          </p>
        </main>
      )}
    </ReceiptAftercare>
  );
}

export function PostPurchaseActionsReceipt() {
  return (
    <ReceiptAftercare>
      {({ open, bagCount }) => (
        <main
          className="receipt-container mx-auto max-w-3xl space-y-4 px-4 py-10 text-sm sm:px-6"
          data-receipt-variant="6"
        >
          <ReceiptToolbar />
          {!!bagCount && (
            <Badge variant="info-light" className="receipt-actions">
              Local bag · {bagCount} items
            </Badge>
          )}
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="space-y-6 p-4 sm:p-5">
              <OrderHero />
              <ReceiptItems />
            </FramePanel>
            <FrameFooter className="bg-muted/30 p-4 sm:p-5">
              <ReceiptTotals />
            </FrameFooter>
          </Frame>
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="grid gap-6 p-4 sm:grid-cols-3">
              <ReceiptAddress title="Shipping to" />
              <ReceiptPayment />
              <div>
                <h2 className="mb-2 text-[10px] tracking-[.18em] text-muted-foreground">
                  TRACKING
                </h2>
                <p>{order.carrier}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {order.tracking}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Arrives {order.arrival}
                </p>
              </div>
            </FramePanel>
          </Frame>
          <div className="receipt-actions grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TrackingAction
              variant="outline"
              className="h-auto w-full flex-col gap-2 rounded-xl py-4 [&>svg:last-child]:hidden"
            >
              <Truck className="size-5" />
              <span>
                Track order
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  See where it is
                </span>
              </span>
            </TrackingAction>
            {(
              [
                { kind: "reorder", title: "Reorder", copy: "Buy items again", icon: RotateCcw },
                { kind: "return", title: "Return", copy: "Start a return", icon: RotateCcw },
                { kind: "support", title: "Get help", copy: "Contact support", icon: LifeBuoy },
              ] as const
            ).map((action) => (
              <Item
                asChild
                key={action.kind}
                variant="outline"
                className="flex-col justify-center gap-2 py-4 hover:bg-muted/40"
              >
                <button type="button" onClick={() => open({ kind: action.kind })}>
                  <ItemMedia className="self-center! translate-y-0!">
                    <action.icon className="size-5" />
                  </ItemMedia>
                  <ItemContent className="items-center gap-1">
                    <ItemTitle className="font-medium">{action.title}</ItemTitle>
                    <ItemDescription className="text-center text-xs">{action.copy}</ItemDescription>
                  </ItemContent>
                </button>
              </Item>
            ))}
          </div>
          <p className="receipt-actions pt-2 text-center text-xs leading-5 text-muted-foreground">
            Tracking updates stay associated with {order.email}.{" "}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => open({ kind: "reorder" })}
            >
              Manage this order
            </Button>
            .
          </p>
        </main>
      )}
    </ReceiptAftercare>
  );
}

/** Second independently verified receipt milestone: catalog entries4–6. */
export function ReceiptPostPurchase({ block }: BlockProps) {
  switch (block.index) {
    case 3:
      return <DeliveredOrderReceipt />;
    case 4:
      return <StatementReceipt />;
    case 5:
      return <PostPurchaseActionsReceipt />;
    default:
      throw new Error(`ReceiptPostPurchase does not own ${block.id}`);
  }
}
