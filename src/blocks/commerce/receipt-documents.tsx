import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { receiptItems, receiptMoney, receiptOrder as order } from "./receipt-data";
import {
  PaidBadge,
  ReceiptAddress,
  ReceiptBrand,
  ReceiptItems,
  ReceiptMeta,
  ReceiptSupport,
  ReceiptToolbar,
  ReceiptTotals,
  ShipmentFooter,
  ShipmentTimeline,
  TrackingAction,
} from "./receipt-shared";
import "./receipt-refined.css";

export function OrderConfirmationReceipt() {
  return (
    <main
      className="receipt-container mx-auto max-w-3xl space-y-7 px-4 py-10 text-sm sm:px-6"
      data-receipt-variant="1"
    >
      <ReceiptToolbar />
      <Frame spacing="xs" variant="ghost">
        <FramePanel className="space-y-6 p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <PaidBadge />
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Thanks for your order</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Your receipt is ready for <span className="text-foreground">{order.email}</span>.
              </p>
            </div>
            <dl className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-right text-xs">
              <dt>Order</dt>
              <dd className="font-mono text-muted-foreground">{order.id}</dd>
              <dt>Receipt</dt>
              <dd className="font-mono text-muted-foreground">{order.receipt}</dd>
              <dt>Date</dt>
              <dd className="text-muted-foreground">{order.date}</dd>
            </dl>
          </header>
          <ReceiptMeta />
          <Separator />
          <ReceiptItems />
          <Separator />
          <ReceiptTotals />
        </FramePanel>
        <FrameFooter className="bg-muted/30 p-4 sm:p-5">
          <ShipmentFooter />
        </FrameFooter>
      </Frame>
    </main>
  );
}

export function TrackingTimelineReceipt() {
  return (
    <main
      className="receipt-container mx-auto max-w-5xl space-y-7 px-4 py-10 text-sm sm:px-6"
      data-receipt-variant="2"
    >
      <ReceiptToolbar />
      <Frame variant="ghost" spacing="xs">
        <FramePanel className="flex flex-wrap items-center justify-between gap-6 p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2">
              <PaidBadge />
              <p className="text-xs text-muted-foreground">Placed {order.date}</p>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Order {order.id}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              A receipt is available for <span className="text-foreground">{order.email}</span>.
            </p>
          </div>
          <div className="sm:border-l sm:pl-8">
            <p className="text-[10px] tracking-[.18em] text-muted-foreground">TOTAL PAID</p>
            <strong className="mt-1 block text-3xl tracking-tight">
              {receiptMoney(order.total)}
            </strong>
            <p className="mt-1 text-xs text-muted-foreground">{order.card}</p>
          </div>
        </FramePanel>
      </Frame>
      <div className="grid items-stretch gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
        <Frame variant="ghost" spacing="xs">
          <FramePanel className="space-y-5 p-4 sm:p-5">
            <h2 className="text-base font-semibold">Order journey</h2>
            <ShipmentTimeline />
            <Separator />
            <p className="text-[10px] tracking-[.18em] text-muted-foreground">NEXT STEP</p>
            <p className="break-all font-mono text-xs text-muted-foreground">
              Tracking {order.tracking}
            </p>
            <TrackingAction variant="outline" className="receipt-actions w-full" />
          </FramePanel>
        </Frame>
        <div className="min-w-0 space-y-5">
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="space-y-5 p-4 sm:p-5">
              <div>
                <p className="text-[10px] tracking-[.18em] text-muted-foreground">ORDER DETAILS</p>
                <h2 className="mt-2 font-medium">3 items</h2>
              </div>
              <ReceiptItems compact />
              <Separator />
              <ReceiptTotals />
            </FramePanel>
          </Frame>
          <Frame variant="ghost" spacing="xs">
            <FramePanel className="p-4 sm:p-5">
              <ReceiptMeta />
            </FramePanel>
          </Frame>
        </div>
      </div>
      <div className="receipt-actions text-center">
        <ReceiptSupport />
      </div>
    </main>
  );
}

export function TillSlipReceipt() {
  return (
    <main
      className="receipt-container mx-auto max-w-md space-y-4 px-4 py-10 text-sm"
      data-receipt-variant="3"
    >
      <ReceiptToolbar slip />
      <Frame variant="ghost" spacing="xs">
        <FramePanel className="space-y-4 px-5 py-9 font-mono sm:px-6">
          <header className="flex flex-col items-center gap-3">
            <ReceiptBrand compact />
            <h1 className="text-sm font-bold tracking-[.24em]">ORDER RECEIPT</h1>
            <p className="text-[10px] tracking-[.18em] text-muted-foreground">REUI · REUI.IO</p>
          </header>
          <dl className="space-y-2 border-y border-dashed py-4 text-[11px]">
            {[
              ["Receipt #", order.receipt],
              ["Order #", order.id],
              ["Date", order.date],
              ["Customer", order.email],
            ].map(([key, value]) => (
              <div key={key} className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="break-all">{value}</dd>
              </div>
            ))}
          </dl>
          <ItemGroup className="gap-4">
            {receiptItems.map((item) => (
              <Item asChild key={item.id} className="items-start border-0 p-0">
                <article>
                  <ItemContent className="gap-1">
                    <ItemTitle className="text-xs font-semibold">{item.name}</ItemTitle>
                    <ItemDescription className="text-[11px]">
                      {item.detail} · {item.qty} × {receiptMoney(item.price)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="text-xs font-semibold">
                    {receiptMoney(item.price * item.qty)}
                  </ItemActions>
                </article>
              </Item>
            ))}
          </ItemGroup>
          <div className="border-t border-dashed pt-4">
            <ReceiptTotals slip />
          </div>
          <section className="space-y-2 border-b border-dashed pb-4">
            <h2 className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground">
              PAYMENT
            </h2>
            <p className="text-xs">{order.card}</p>
            <p className="text-[10px] text-muted-foreground">Charged {order.charged}</p>
          </section>
          <section className="border-b border-dashed pb-4">
            <ReceiptAddress />
          </section>
          <section className="space-y-2">
            <h2 className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground">
              TRACKING
            </h2>
            <p className="break-all text-xs">{order.tracking}</p>
            <p className="text-[10px] leading-5 text-muted-foreground">
              {order.carrier} · Arrives {order.arrival}
            </p>
            <div className="receipt-actions">
              <TrackingAction />
            </div>
          </section>
          <footer className="pt-3 text-center">
            <p className="text-xs">Thank you for shopping with ReUI.</p>
            <div className="receipt-actions mt-3">
              <ReceiptSupport />
            </div>
          </footer>
        </FramePanel>
      </Frame>
    </main>
  );
}
