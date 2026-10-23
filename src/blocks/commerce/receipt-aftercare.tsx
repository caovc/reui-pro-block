import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Download, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Rating } from "@/components/reui/rating";
import {
  downloadReceiptFile,
  receiptItems,
  receiptMoney,
  receiptOrder as order,
} from "./receipt-data";

type AftercareAction = {
  kind: "reorder" | "return" | "review" | "support" | "product";
  itemId?: string;
};
type ItemReview = { rating: number; title: string; text: string; date: string };
interface AftercareControls {
  open: (action: AftercareAction) => void;
  reviews: Record<string, ItemReview>;
  bagCount: number;
}

export function ReceiptAftercare({
  children,
}: {
  children: (controls: AftercareControls) => ReactNode;
}) {
  const [action, setAction] = useState<AftercareAction | null>(null);
  const [bagCount, setBagCount] = useState(0);
  const [reviews, setReviews] = useState<Record<string, ItemReview>>({
    jacket: {
      rating: 4,
      title: "A dependable daily layer",
      text: "Comfortable on a cool morning and easy to pack.",
      date: "May 24, 2026",
    },
    shirt: {
      rating: 5,
      title: "Ready for a summer trip",
      text: "A relaxed fit with a light texture that feels comfortable all day.",
      date: "May 25, 2026",
    },
  });
  return (
    <>
      {children({ open: setAction, reviews, bagCount })}
      {action && (
        <AftercareDialog
          key={`${action.kind}-${action.itemId ?? "all"}`}
          action={action}
          onClose={() => setAction(null)}
          onReorder={(count) => setBagCount((value) => value + count)}
          onReview={(id, review) => setReviews((value) => ({ ...value, [id]: review }))}
        />
      )}
    </>
  );
}

function AftercareDialog({
  action,
  onClose,
  onReorder,
  onReview,
}: {
  action: AftercareAction;
  onClose: () => void;
  onReorder: (count: number) => void;
  onReview: (id: string, review: ItemReview) => void;
}) {
  const items = action.itemId
    ? receiptItems.filter((item) => item.id === action.itemId)
    : receiptItems;
  const [selected, setSelected] = useState(items.map((item) => item.id));
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((item) => [item.id, item.qty])),
  );
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const count = items.reduce(
    (sum, item) => sum + (selected.includes(item.id) ? quantities[item.id] : 0),
    0,
  );
  const subtotal = items.reduce(
    (sum, item) => sum + (selected.includes(item.id) ? quantities[item.id] * item.price : 0),
    0,
  );
  const refund =
    Math.round(subtotal * ((order.total - order.shipping) / order.subtotal) * 100) / 100;
  const titles = {
    reorder: "Buy again",
    return: "Start a return",
    review: "Write a product review",
    support: "Get order help",
    product: items[0].name,
  };
  const descriptions = {
    reorder: "Choose the items and quantities for a new local shopping bag.",
    return:
      "Create a local return request. No carrier label, refund or external request is issued.",
    review: "Share your experience with this item in the local preview.",
    support: `Order ${order.id}. Save a request you can review and share yourself.`,
    product: "Product details from your original order. This is an independent local preview.",
  };

  function submit() {
    if (action.kind === "review") {
      onReview(items[0].id, { rating, title, text: message, date: "Just now" });
    } else if (action.kind === "reorder") {
      onReorder(count);
    } else if (action.kind === "return") {
      const lines = items
        .filter((item) => selected.includes(item.id))
        .map((item) => `${item.name} · Qty ${quantities[item.id]}`);
      downloadReceiptFile(
        `LOCAL RETURN DEMO-18042\nOrder ${order.id}\n${lines.join("\n")}\nReason: ${reason}\n${message}\nEstimated refund excluding shipping: ${receiptMoney(refund)}\n\nNo refund or shipment was created.`,
        "return-DEMO-18042.txt",
        "text/plain",
      );
    } else if (action.kind === "support") {
      downloadReceiptFile(
        `Order ${order.id}\nCustomer ${order.email}\n\n${message}`,
        "order-support-DEMO-18042.txt",
        "text/plain",
      );
    }
    setDone(true);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titles[action.kind]}</DialogTitle>
          <DialogDescription>{descriptions[action.kind]}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-5">
            <Alert variant="success">
              <Check />
              <AlertTitle>
                {action.kind === "review"
                  ? "Your review is saved"
                  : action.kind === "reorder"
                    ? `${count} items added to your local bag`
                    : action.kind === "return"
                      ? "Return request downloaded"
                      : "Support request downloaded"}
              </AlertTitle>
              <AlertDescription>
                {action.kind === "reorder"
                  ? `New bag subtotal ${receiptMoney(subtotal)}. No payment was taken.`
                  : action.kind === "return"
                    ? `DEMO-18042 · Estimated refund ${receiptMoney(refund)} excluding shipping. This request is local only.`
                    : "Your original order history remains available in this preview."}
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : action.kind === "product" ? (
          <div className="space-y-5">
            <img
              src={items[0].image}
              alt={items[0].name}
              className="mx-auto aspect-square max-h-64 rounded-xl bg-muted object-cover"
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{items[0].name}</p>
                <p className="mt-1 text-sm text-muted-foreground">HALDEN · {items[0].detail}</p>
              </div>
              <Badge variant="secondary">{receiptMoney(items[0].price)}</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              A considered everyday piece from the order you placed on {order.date}. Use Buy again
              in the order list to choose a new quantity.
            </p>
            <Button className="w-full" variant="outline" onClick={onClose}>
              Back to receipt
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {(action.kind === "reorder" || action.kind === "return") && (
              <>
                <ItemGroup>
                  {items.map((item) => (
                    <Item key={item.id} variant="outline" className="items-start">
                      <Checkbox
                        checked={selected.includes(item.id)}
                        aria-label={`Select ${item.name}`}
                        onCheckedChange={(checked) =>
                          setSelected((value) =>
                            checked ? [...value, item.id] : value.filter((id) => id !== item.id),
                          )
                        }
                      />
                      <ItemMedia>
                        <img src={item.image} alt="" className="size-12 rounded-md object-cover" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{item.name}</ItemTitle>
                        <ItemDescription className="text-xs">{item.detail}</ItemDescription>
                        <p className="mt-1 text-xs">{receiptMoney(item.price)} each</p>
                      </ItemContent>
                      <ItemActions>
                        <NumberField
                          value={quantities[item.id]}
                          min={1}
                          max={action.kind === "return" ? item.qty : 20}
                          disabled={!selected.includes(item.id)}
                          onValueChange={(value) =>
                            setQuantities((current) => ({ ...current, [item.id]: value ?? 1 }))
                          }
                          className="w-24"
                          size="sm"
                        >
                          <NumberFieldGroup>
                            <NumberFieldDecrement aria-label={`Decrease ${item.name} quantity`} />
                            <NumberFieldInput aria-label={`${item.name} quantity`} />
                            <NumberFieldIncrement aria-label={`Increase ${item.name} quantity`} />
                          </NumberFieldGroup>
                        </NumberField>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
                <div className="flex justify-between border-t pt-4 text-sm">
                  <span>
                    {action.kind === "return"
                      ? "Estimated refund, excluding shipping"
                      : `New subtotal (${count} items)`}
                  </span>
                  <strong>{receiptMoney(action.kind === "return" ? refund : subtotal)}</strong>
                </div>
              </>
            )}
            {action.kind === "return" && (
              <div className="space-y-2">
                <Label>Return reason</Label>
                <Select value={reason} onValueChange={setReason} required>
                  <SelectTrigger className="w-full" aria-label="Return reason">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Wrong size", "Not as expected", "Faulty item", "Changed my mind"].map(
                      (value) => (
                        <SelectItem value={value} key={value}>
                          {value}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {action.kind === "review" && (
              <>
                <p className="text-sm font-medium">{items[0].name}</p>
                <Rating
                  rating={rating}
                  onRatingChange={setRating}
                  editable
                  showValue
                  aria-label="Your product rating"
                />
                <div className="space-y-2">
                  <Label htmlFor="aftercare-review-title">Review title</Label>
                  <Input
                    id="aftercare-review-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    minLength={3}
                  />
                </div>
              </>
            )}
            {action.kind !== "reorder" && (
              <div className="space-y-2">
                <Label htmlFor="aftercare-message">
                  {action.kind === "review"
                    ? "Your review"
                    : action.kind === "support"
                      ? "How can we help?"
                      : "Additional details (optional)"}
                </Label>
                <Textarea
                  id="aftercare-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required={action.kind !== "return"}
                  minLength={action.kind === "return" ? undefined : 12}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                (action.kind === "return" && (!count || !reason)) ||
                (action.kind === "reorder" && !count)
              }
            >
              {action.kind === "reorder" ? (
                <ShoppingBag />
              ) : action.kind === "return" || action.kind === "support" ? (
                <Download />
              ) : (
                <Check />
              )}
              {action.kind === "review"
                ? "Save review"
                : action.kind === "reorder"
                  ? "Add selected items to bag"
                  : action.kind === "return"
                    ? "Download return request"
                    : "Save support request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
