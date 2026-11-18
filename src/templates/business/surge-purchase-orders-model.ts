import { useState } from "react";
import type { SurgeProduct } from "./surge-operations-model";

export type PurchaseOrderStatus = "Draft" | "Received" | "Cancelled";
export type PurchaseOrderOperation = "Receive" | "Cancel";

export interface PurchaseOrderLine {
  sku: string;
  units: number;
  unitCostCents: number;
}

export interface SurgePurchaseOrder {
  id: string;
  supplier: string;
  location: string;
  status: PurchaseOrderStatus;
  raisedAt: string;
  expectedAt?: string;
  receivedAt?: string;
  lines: PurchaseOrderLine[];
}

export const purchaseOrderDemoDay = "2026-07-30";

// Independent procurement fixtures for the existing local product SKUs. Costs
// are explicit demo records, not estimates inferred from retail prices or
// copied reference orders. Existing merchant and catalog fixtures stay intact.
export function initialSurgePurchaseOrders(): SurgePurchaseOrder[] {
  const definitions = [
    ["1101", "Boreal Supply", "Main warehouse", "Draft", "2026-07-29", "AC-1240", 24, 1200],
    ["1102", "Fieldstone Partners", "East depot", "Draft", "2026-07-28", "BG-2203", 12, 6800],
    ["1103", "Aspen Goods", "City shop", "Draft", "2026-07-27", "FW-1122", 18, 5200],
    ["1104", "Cobalt Textiles", "Main warehouse", "Draft", "2026-07-24", "AP-3102", 30, 2400],
    ["1105", "Boreal Supply", "East depot", "Draft", "2026-07-23", "AC-1241", 36, 1100],
    ["1106", "Fieldstone Partners", "Main warehouse", "Draft", "2026-07-21", "OW-4021", 16, 4600],
    ["1107", "Aspen Goods", "City shop", "Received", "2026-07-12", "BG-2203", 8, 6500],
    ["1108", "Cobalt Textiles", "East depot", "Received", "2026-07-10", "AP-3102", 20, 2200],
    ["1109", "Boreal Supply", "Main warehouse", "Received", "2026-07-08", "AC-1240", 40, 1000],
    ["1110", "Fieldstone Partners", "City shop", "Cancelled", "2026-07-06", "FW-1122", 10, 5000],
    ["1111", "Aspen Goods", "Main warehouse", "Cancelled", "2026-07-04", "OW-4021", 12, 4400],
  ] as const;
  return definitions.map(
    ([id, supplier, location, status, date, sku, units, unitCostCents], index) => ({
      id: `PO-LOCAL-${id}`,
      supplier,
      location,
      status,
      raisedAt: status === "Cancelled" ? date : "2026-07-01",
      ...(status === "Cancelled" ? {} : { expectedAt: date }),
      ...(status === "Received" ? { receivedAt: date } : {}),
      lines: [
        { sku, units, unitCostCents },
        ...(index % 3 === 0 ? [{ sku: "AC-1241", units: 10, unitCostCents: 900 }] : []),
      ],
    }),
  );
}

export function purchaseOrderTotalCents(order: SurgePurchaseOrder) {
  return order.lines.reduce((sum, line) => sum + line.units * line.unitCostCents, 0);
}

export function purchaseOrderUnits(order: SurgePurchaseOrder) {
  return order.lines.reduce((sum, line) => sum + line.units, 0);
}

export function purchaseOrderDate(order: SurgePurchaseOrder) {
  return order.receivedAt ?? order.expectedAt ?? order.raisedAt;
}

export function purchaseOrderDateLabel(order: SurgePurchaseOrder) {
  return order.receivedAt ? "Received" : order.expectedAt ? "Expected" : "Raised";
}

export function applyPurchaseOrderOperation(
  orders: SurgePurchaseOrder[],
  products: SurgeProduct[],
  id: string,
  operation: PurchaseOrderOperation,
  receivedAt = purchaseOrderDemoDay,
) {
  const order = orders.find((entry) => entry.id === id);
  if (!order || order.status !== "Draft") return { orders, products, changed: false };
  const unitsBySku = new Map<string, number>();
  for (const line of order.lines) {
    if (
      operation === "Receive" &&
      (!Number.isSafeInteger(line.units) ||
        line.units <= 0 ||
        !products.some((product) => product.sku === line.sku))
    ) {
      return { orders, products, changed: false };
    }
    unitsBySku.set(line.sku, (unitsBySku.get(line.sku) ?? 0) + line.units);
  }
  return {
    changed: true,
    orders: orders.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            status: operation === "Receive" ? ("Received" as const) : ("Cancelled" as const),
            ...(operation === "Receive" ? { receivedAt } : {}),
          }
        : entry,
    ),
    // The merchant model exposes aggregate stock, not per-location allocation.
    // Receiving updates that real local model once; cancelling never changes it.
    products:
      operation === "Receive"
        ? products.map((product) => {
            const units = unitsBySku.get(product.sku);
            return units ? { ...product, stock: product.stock + units } : product;
          })
        : products,
  };
}

export function useSurgePurchaseOrdersState() {
  const [orders, setOrders] = useState(initialSurgePurchaseOrders);
  return { orders, setOrders };
}

export type SurgePurchaseOrdersModel = ReturnType<typeof useSurgePurchaseOrdersState>;
