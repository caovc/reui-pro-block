import { useState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
} from "@/components/reui/number-field";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
export function TradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [quantity, setQuantity] = useState<number | null>(0.01);
  const [side, setSide] = useState("buy");
  const [simulated, setSimulated] = useState(false);
  const quote = 93725.75;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo trading</DialogTitle>
          <DialogDescription>
            Static BTS/USD sample quote · no exchange is connected.
          </DialogDescription>
        </DialogHeader>
        <Alert variant="info">
          <FlaskConical />
          <AlertTitle>Practice mode</AlertTitle>
          <AlertDescription>This preview simulates an order locally.</AlertDescription>
        </Alert>
        <ToggleGroup
          type="single"
          value={side}
          onValueChange={(v) => {
            if (v) {
              setSide(v);
              setSimulated(false);
            }
          }}
          className="w-full"
        >
          <ToggleGroupItem value="buy" className="flex-1">
            Buy
          </ToggleGroupItem>
          <ToggleGroupItem value="sell" className="flex-1">
            Sell
          </ToggleGroupItem>
        </ToggleGroup>
        <Field>
          <FieldLabel htmlFor="demo-quantity">Quantity</FieldLabel>
          <NumberField
            id="demo-quantity"
            value={quantity}
            onValueChange={(v) => {
              setQuantity(v);
              setSimulated(false);
            }}
            min={0.001}
            max={100}
            step={0.001}
            format={{ maximumFractionDigits: 3 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement aria-label="Decrease quantity" />
              <NumberFieldInput aria-label="Quantity" />
              <NumberFieldIncrement aria-label="Increase quantity" />
            </NumberFieldGroup>
          </NumberField>
        </Field>
        <dl className="flex items-center justify-between rounded-lg border p-4 text-sm">
          <dt>Sample order total</dt>
          <dd className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format((quantity ?? 0) * quote)}
          </dd>
        </dl>
        {simulated ? (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Simulated {side} complete</AlertTitle>
            <AlertDescription>{quantity} BTS · saved in this preview only.</AlertDescription>
          </Alert>
        ) : null}
        <Button disabled={!quantity} onClick={() => setSimulated(true)}>
          Simulate {side} order
        </Button>
      </DialogContent>
    </Dialog>
  );
}
