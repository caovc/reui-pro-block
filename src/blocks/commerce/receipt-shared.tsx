import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Download,
  LifeBuoy,
  Mail,
  Printer,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { cn } from "@/lib/utils";
import {
  downloadReceiptFile,
  downloadReceiptPdf,
  receiptItems,
  receiptJourney,
  receiptMoney,
  receiptOrder as order,
  receiptText,
} from "./receipt-data";

export function ReceiptBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex size-9 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background"
        aria-hidden="true"
      >
        ü
      </span>
      {!compact && (
        <div>
          <p className="text-sm font-semibold">ReUI</p>
          <p className="text-xs text-muted-foreground">reui.io</p>
        </div>
      )}
    </div>
  );
}

export function PaidBadge() {
  return (
    <Badge variant="success" radius="full" size="sm">
      <Check className="size-3" />
      Paid
    </Badge>
  );
}

export function ReceiptToolbar({
  slip = false,
  bottom = false,
}: {
  slip?: boolean;
  bottom?: boolean;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState(order.email);
  const [prepared, setPrepared] = useState(false);
  function prepareEmail() {
    const content = `To: ${email}\r\nSubject: Receipt ${order.receipt}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${receiptText()}`;
    downloadReceiptFile(content, `${order.receipt}.eml`, "message/rfc822");
    setPrepared(true);
  }
  return (
    <>
      <div
        className={cn(
          "receipt-actions flex flex-wrap items-center justify-between gap-3",
          bottom && "justify-center",
        )}
      >
        {!bottom &&
          (slip ? (
            <p className="text-[10px] font-medium tracking-[.24em] text-muted-foreground">
              RECEIPT
            </p>
          ) : (
            <ReceiptBrand />
          ))}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={bottom ? "outline" : "default"}
            aria-label={`Download receipt ${order.receipt} as PDF`}
            onClick={downloadReceiptPdf}
          >
            <Download />
            Download
          </Button>
          <Button
            size={slip || !bottom ? "icon-sm" : "sm"}
            variant="outline"
            aria-label={`Email receipt ${order.receipt}`}
            onClick={() => {
              setPrepared(false);
              setEmailOpen(true);
            }}
          >
            <Mail />
            {bottom && "Email"}
          </Button>
          <Button
            size={bottom ? "sm" : "icon-sm"}
            variant="outline"
            aria-label={`Print receipt ${order.receipt}`}
            onClick={() => window.print()}
          >
            <Printer />
            {bottom && "Print"}
          </Button>
        </div>
      </div>
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email receipt</DialogTitle>
            <DialogDescription>
              Prepare an email draft on this device. This preview does not send email.
            </DialogDescription>
          </DialogHeader>
          {prepared ? (
            <Alert variant="success">
              <Check />
              <AlertTitle>Email draft downloaded</AlertTitle>
              <AlertDescription>
                Open the .eml file in your mail application to review the receipt for {email}.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                prepareEmail();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="receipt-recipient">Recipient email</Label>
                <Input
                  id="receipt-recipient"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <p className="rounded-lg bg-muted/40 p-3 text-sm">
                {order.receipt} · {receiptMoney(order.total)} · {order.customer}
              </p>
              <Button type="submit" className="w-full">
                <Download />
                Download email draft
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReceiptTotals({ slip = false }: { slip?: boolean }) {
  const rows: [string, number][] = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shipping],
    ["Discount (WELCOME15)", -order.discount],
    [slip ? "Tax" : "Estimated tax", order.tax],
  ];
  return (
    <dl className={cn("ml-auto w-full max-w-72 space-y-2.5 text-sm", slip && "max-w-none text-xs")}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={cn("shrink-0 tabular-nums", value < 0 && "text-success")}>
            {value < 0 ? "−" : ""}
            {receiptMoney(Math.abs(value))}
          </dd>
        </div>
      ))}
      <div
        className={cn(
          "flex items-center justify-between gap-4 border-t pt-3 font-semibold",
          slip && "border-y-2 border-foreground py-4 tracking-[.18em]",
        )}
      >
        <dt>{slip ? "TOTAL" : "Total"}</dt>
        <dd className={slip ? "text-base" : "text-lg"} data-receipt-total>
          {receiptMoney(order.total)}
        </dd>
      </div>
    </dl>
  );
}

/** Actual free c-item-1/5 composition: ItemGroup, media, content, description and actions. */
export function ReceiptItems({ compact = false }: { compact?: boolean }) {
  return (
    <ItemGroup className="gap-4">
      {receiptItems.map((item) => (
        <Item key={item.id} className="items-start border-0 p-0" size="sm">
          <ItemMedia>
            <img
              src={item.image}
              alt={item.name}
              className={cn("size-16 rounded-lg bg-muted object-cover", compact && "size-12")}
            />
          </ItemMedia>
          <ItemContent className="min-w-0 gap-1">
            <p className="text-[10px] tracking-wide text-muted-foreground">HALDEN</p>
            <ItemTitle>{item.name}</ItemTitle>
            <ItemDescription className="text-xs">
              {item.detail} · Qty {item.qty}
            </ItemDescription>
          </ItemContent>
          <ItemActions className="ml-auto flex-col items-end text-sm">
            <strong>{receiptMoney(item.price * item.qty)}</strong>
            {item.qty > 1 && (
              <span className="text-xs text-muted-foreground">{receiptMoney(item.price)} each</span>
            )}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

export function ReceiptAddress({ title = "Ship to" }: { title?: string }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">{title}</p>
      <p className="text-sm font-medium">{order.customer}</p>
      <address className="mt-1 text-sm not-italic leading-5 text-muted-foreground">
        {order.address.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </address>
    </div>
  );
}

export function ReceiptPayment() {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground">Payment</p>
      <div className="flex items-center gap-2">
        <IconTile size="sm" variant="outline">
          <CreditCard />
        </IconTile>
        <div>
          <p className="text-sm font-medium">{order.card}</p>
          <p className="text-xs text-muted-foreground">Expires {order.expiry}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Charged {order.charged}</p>
    </div>
  );
}

export function ReceiptMeta() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <ReceiptAddress />
      <ReceiptAddress title="Bill to" />
      <ReceiptPayment />
    </div>
  );
}

/** Actual free Timeline/c-timeline-1 direct-child composition; progress is read-only. */
export function ShipmentTimeline({
  delivered = false,
  descriptions = false,
}: {
  delivered?: boolean;
  descriptions?: boolean;
}) {
  return (
    <Timeline value={delivered ? 5 : 3} aria-label="Shipment timeline" className="w-full">
      {receiptJourney.map((stage, index) => (
        <TimelineItem key={stage.title} step={index + 1} className="gap-1">
          <TimelineHeader>
            <TimelineTitle>{stage.title}</TimelineTitle>
            <TimelineDate dateTime={stage.iso} className="mt-1 mb-0 font-normal">
              {stage.date}
            </TimelineDate>
          </TimelineHeader>
          <TimelineIndicator className="bg-background group-data-completed/timeline-item:bg-foreground" />
          <TimelineSeparator />
          {descriptions && (
            <TimelineContent className="text-xs leading-5">{stage.description}</TimelineContent>
          )}
        </TimelineItem>
      ))}
    </Timeline>
  );
}

export function TrackingAction({
  children = "Track shipment",
  variant = "link",
  className,
  delivered = false,
}: {
  children?: ReactNode;
  variant?: "link" | "outline" | "default" | "ghost";
  className?: string;
  delivered?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={cn(variant === "link" && "h-auto justify-start p-0", className)}
        onClick={() => setOpen(true)}
      >
        {children}
        <ArrowRight />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track order {order.id}</DialogTitle>
            <DialogDescription>
              {order.carrier} · {order.tracking}. Illustrative local shipment history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <ShipmentTimeline delivered={delivered} descriptions />
          </div>
          <p className="text-xs text-muted-foreground">No live carrier tracking request is made.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReceiptSupport() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <Button
        variant="link"
        size="sm"
        className="receipt-actions h-auto p-0 text-xs font-normal text-muted-foreground"
        onClick={() => {
          setSent(false);
          setOpen(true);
        }}
      >
        <LifeBuoy />
        Need help with this order?
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order support</DialogTitle>
            <DialogDescription>
              Order {order.id}. Create a local support request; nothing is sent externally.
            </DialogDescription>
          </DialogHeader>
          {sent ? (
            <Alert variant="success">
              <Check />
              <AlertTitle>Request saved locally</AlertTitle>
              <AlertDescription>
                DEMO-18042 · Your message is ready to share with support.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                downloadReceiptFile(
                  `Order ${order.id}\nCustomer ${order.email}\n\n${message}`,
                  "support-request.txt",
                  "text/plain",
                );
                setSent(true);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="receipt-support-message">How can we help?</Label>
                <Textarea
                  id="receipt-support-message"
                  required
                  minLength={10}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
              <Button type="submit">Save support request</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ShipmentFooter() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 size-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Arrives {order.arrival}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.carrier} · Standard, 3–5 business days
          </p>
          <div className="receipt-actions mt-2">
            <TrackingAction />
          </div>
        </div>
      </div>
      <ReceiptSupport />
    </div>
  );
}
