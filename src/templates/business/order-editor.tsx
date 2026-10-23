import { useState } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { Alert, AlertDescription } from "@/components/reui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, Panel, Badge } from "./shared";
import { BusinessGrid } from "./grid";
import type { CatalogProduct } from "./catalog-data";

export type NewCommerceOrder = {
  customer: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  method: string;
  warehouse: string;
  lines: { product: string; variant: string; quantity: number; unitPrice: number }[];
};
type OrderLine = { id: string; product: string; variant: string; quantity: number };
const currency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const shippingMethods = { "Express Delivery": 1500, "Standard Delivery": 500, "Local Pickup": 0 };
export function OrderEditor({
  products,
  customers,
  onCancel,
  onSave,
}: {
  products: CatalogProduct[];
  customers: string[][];
  onCancel: () => void;
  onSave: (order: NewCommerceOrder) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState("Express Delivery");
  const [warehouse, setWarehouse] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([
    { id: "initial", product: "", variant: "", quantity: 1 },
  ]);
  const [error, setError] = useState("");
  function updateLine(id: string, patch: Partial<OrderLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    setError("");
  }
  function productFor(line: OrderLine) {
    return products.find((product) => product.name === line.product);
  }
  function priceFor(line: OrderLine) {
    const product = productFor(line);
    const variant = product?.variantRows?.[Number(line.variant)];
    if (!product || line.variant === "") return 0;
    return Math.round(Number(variant?.price ?? product.price.match(/[0-9.]+/)?.[0] ?? 0) * 100);
  }
  const subtotal = lines.reduce((sum, line) => sum + priceFor(line) * line.quantity, 0);
  const tax = Math.round(subtotal * 0.08);
  const shipping = shippingMethods[method as keyof typeof shippingMethods];
  const total = subtotal + tax + shipping;
  return (
    <form
      className="bt-order-page"
      onSubmit={(event) => {
        event.preventDefault();
        if (!customer) {
          setError("Choose the customer this order ships to.");
          return;
        }
        if (!lines.length || lines.some((line) => !line.product || line.variant === "")) {
          setError("Choose a product and variant for every line item.");
          return;
        }
        if (method !== "Local Pickup" && !warehouse) {
          setError("Select the location this order ships from.");
          return;
        }
        onSave({
          customer,
          subtotal,
          shipping,
          tax,
          total,
          method,
          warehouse,
          lines: lines.map((line) => ({
            product: line.product,
            variant: productFor(line)?.variantRows?.[Number(line.variant)]?.sku ?? "Default",
            quantity: line.quantity,
            unitPrice: priceFor(line),
          })),
        });
      }}
    >
      <div className="bt-heading">
        <div>
          <h1>New order</h1>
          <p>Total {currency(total)}</p>
        </div>
        <div className="bt-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create order</Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="bt-product-editor bt-order-editor">
        <div className="bt-stack">
          <Panel
            title="Customer"
            description="Who this order ships to."
            action={<Badge variant="warning-light">Required</Badge>}
          >
            <label className="bt-order-field">
              Customer
              <Select
                value={customer}
                onValueChange={(value) => {
                  setCustomer(value);
                  setError("");
                }}
              >
                <SelectTrigger className="w-full" aria-label="Order customer">
                  <SelectValue placeholder="Find customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((row) => (
                    <SelectItem key={row[1]} value={row[0]}>
                      {row[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </Panel>
          <Panel
            title="Line items"
            description="Products, variants, and quantity."
            action={
              <div className="bt-pills">
                <Badge variant="secondary">
                  {lines.length} item{lines.length === 1 ? "" : "s"}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setLines((current) => [
                      ...current,
                      { id: crypto.randomUUID(), product: "", variant: "", quantity: 1 },
                    ])
                  }
                >
                  <Plus />
                  Add item
                </Button>
              </div>
            }
          >
            <BusinessGrid
              className="bt-order-grid"
              headers={["Product", "Variant", "Qty", "Unit price", "Amount", ""]}
              rows={lines.map((line, index) => [
                <Select
                  key="product"
                  value={line.product}
                  onValueChange={(product) => updateLine(line.id, { product, variant: "" })}
                >
                  <SelectTrigger className="w-full" aria-label={`Item ${index + 1} product`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem value={product.name} key={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>,
                <Select
                  key="variant"
                  value={line.variant}
                  onValueChange={(variant) => updateLine(line.id, { variant })}
                  disabled={!line.product}
                >
                  <SelectTrigger className="w-full" aria-label={`Item ${index + 1} variant`}>
                    <SelectValue
                      placeholder={line.product ? "Select variant" : "Choose a product first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {productFor(line)?.variantRows?.length ? (
                      productFor(line)?.variantRows?.map((variant, variantIndex) => (
                        <SelectItem value={String(variantIndex)} key={variant.sku + variantIndex}>
                          {variant.color || "Default"} / {variant.size || "One size"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0">Default variant</SelectItem>
                    )}
                  </SelectContent>
                </Select>,
                <NumberField
                  key="quantity"
                  min={1}
                  max={999}
                  step={1}
                  value={line.quantity}
                  onValueChange={(value) =>
                    updateLine(line.id, { quantity: Math.max(1, Math.floor(value ?? 1)) })
                  }
                >
                  <NumberFieldGroup>
                    <NumberFieldInput aria-label={`Item ${index + 1} quantity`} />
                  </NumberFieldGroup>
                </NumberField>,
                line.product && line.variant !== "" ? currency(priceFor(line)) : "—",
                line.product && line.variant !== ""
                  ? currency(priceFor(line) * line.quantity)
                  : "—",
                <Button
                  key="remove"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() =>
                    setLines((current) => current.filter((item) => item.id !== line.id))
                  }
                >
                  <Trash2 />
                </Button>,
              ])}
            />
          </Panel>
          <Panel title="Summary" description="What this order will be charged.">
            <div className="bt-order-summary">
              <div>
                <Badge variant="secondary">
                  <Truck />
                  {method}
                </Badge>
                <p>Totals update as products, variants, and quantities change.</p>
                <p>Tax is charged at 8% of the subtotal.</p>
              </div>
              <dl className="bt-order-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{currency(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{currency(shipping)}</dd>
                </div>
                <div>
                  <dt>Tax</dt>
                  <dd>{currency(tax)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>
                    <output aria-label="Order total">{currency(total)}</output>
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>
        </div>
        <div className="bt-stack">
          <Panel title="Shipping" description="How and where this order ships from.">
            <div className="bt-form">
              <label className="bt-order-field">
                Method
                <Select
                  value={method}
                  onValueChange={(value) => {
                    setMethod(value);
                    setError("");
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Shipping method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(shippingMethods).map(([name, rate]) => (
                      <SelectItem key={name} value={name}>
                        {name} · {currency(rate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="bt-order-field">
                Ships from
                <Select
                  value={warehouse}
                  onValueChange={(value) => {
                    setWarehouse(value);
                    setError("");
                  }}
                  disabled={method === "Local Pickup"}
                >
                  <SelectTrigger className="w-full" aria-label="Shipping location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Main Warehouse", "London Store", "New York Store"].map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
