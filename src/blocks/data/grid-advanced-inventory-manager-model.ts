import {
  planningMonth,
  planningMonthDays,
  validPlanningCount,
  validPlanningMoney,
  validPlanningMonth,
  type PlanningResult,
} from "./grid-advanced-planning-common.ts";

export interface InventoryPlanningProduct {
  id: string;
  sku: string;
  name: string;
  department: string;
  supplier: string;
  openingUnits: number;
  receipts: number[];
  sales: number[];
  counts: (number | null)[];
  unitCost: number[];
  safetyStock: number;
  leadDays: number;
}
export type InventoryCell = "receipts" | "sales" | "counts" | "unitCost";
export interface InventoryPurchaseLine {
  productId: string;
  quantity: number;
  unitCost: number;
}
export interface InventoryPurchaseOrder {
  id: string;
  supplier: string;
  month: number;
  status: "draft" | "sent" | "received" | "cancelled";
  lines: InventoryPurchaseLine[];
}
export interface InventoryPlanningState {
  products: InventoryPlanningProduct[];
  orders: InventoryPurchaseOrder[];
}

const productSeeds = [
  ["REF-120", "Refill bottle 500ml", "Home", "Westhaven Goods", 120, 35, 40, 625, 20, 14],
  ["KIT-210", "Cleaning starter kit", "Home", "Westhaven Goods", 85, 30, 35, 1850, 18, 12],
  ["TOW-400", "Cotton towel set", "Home", "Fairbank Textiles", 500, 40, 45, 2400, 30, 21],
  ["CUP-101", "Travel cup", "Everyday", "Northpier Works", 90, 25, 30, 1175, 15, 16],
  ["BAG-350", "Canvas market bag", "Everyday", "Fairbank Textiles", 160, 35, 40, 875, 25, 21],
  ["DES-220", "Desk organizer", "Work", "Northpier Works", 75, 20, 25, 1525, 12, 18],
  ["PAD-080", "Weekly planner pad", "Work", "Paper Grove", 230, 65, 70, 450, 35, 10],
  ["PEN-060", "Writing set", "Work", "Paper Grove", 320, 50, 55, 725, 30, 10],
] as const;

/** Fictional products, supplier names and monthly movements; no catalog media. */
export const initialInventoryPlanning: InventoryPlanningState = {
  products: productSeeds.map(
    (
      [sku, name, department, supplier, openingUnits, received, sold, cost, safetyStock, leadDays],
      index,
    ) => ({
      id: `planning-product-${index + 1}`,
      sku,
      name,
      department,
      supplier,
      openingUnits,
      receipts: Array.from({ length: 12 }, (_, month) => (month <= planningMonth ? received : 0)),
      sales: Array.from({ length: 12 }, (_, month) => (month <= planningMonth ? sold : 0)),
      counts: Array.from({ length: 12 }, (_, month) => (month === 9 && index === 0 ? 45 : null)),
      unitCost: Array.from({ length: 12 }, () => cost),
      safetyStock,
      leadDays,
    }),
  ),
  orders: [],
};

export function inventoryStockSeries(product: InventoryPlanningProduct) {
  let opening = product.openingUnits;
  return Array.from({ length: 12 }, (_, month) => {
    const expected = opening + product.receipts[month] - product.sales[month];
    const counted = product.counts[month];
    const closing = counted ?? expected;
    const row = {
      month,
      opening,
      receipts: product.receipts[month],
      sales: product.sales[month],
      expected,
      counted,
      adjustment: counted === null ? 0 : counted - expected,
      closing,
      value: closing * product.unitCost[month],
    };
    opening = closing;
    return row;
  });
}

export function validateInventoryProduct(product: InventoryPlanningProduct): string | undefined {
  if (!product.id || !product.sku.trim() || !product.name.trim())
    return "A product name and SKU are required.";
  if (!validPlanningCount(product.openingUnits)) return "Enter a non-negative opening stock count.";
  if (
    [product.receipts, product.sales, product.counts, product.unitCost].some(
      (values) => values.length !== 12,
    )
  ) {
    return "Every product needs all twelve months.";
  }
  if (!product.receipts.every(validPlanningCount) || !product.sales.every(validPlanningCount)) {
    return "Receipts and sales must be non-negative whole units.";
  }
  if (!product.counts.every((count) => count === null || validPlanningCount(count))) {
    return "Physical counts must be whole units or not counted.";
  }
  if (!product.unitCost.every((amount) => validPlanningMoney(amount) && amount > 0))
    return "Unit cost must be a positive amount.";
  if (
    !validPlanningCount(product.safetyStock) ||
    !Number.isInteger(product.leadDays) ||
    product.leadDays < 0 ||
    product.leadDays > 365
  ) {
    return "Enter valid safety stock and a lead time of 0–365 days.";
  }
  const invalid = inventoryStockSeries(product).find(
    (month) => month.expected < 0 || !validPlanningCount(month.closing),
  );
  if (invalid) return `Month ${invalid.month + 1} sells more stock than is available.`;
  return undefined;
}

export function setInventoryPlanningCell(
  products: readonly InventoryPlanningProduct[],
  id: string,
  month: number,
  cell: InventoryCell,
  amount: number | null,
): PlanningResult<InventoryPlanningProduct[]> {
  if (!validPlanningMonth(month)) return { ok: false, error: "Choose a valid month." };
  const product = products.find((row) => row.id === id);
  if (!product) return { ok: false, error: "Product not found." };
  if (amount === null && cell !== "counts")
    return { ok: false, error: "Enter a value for this cell." };
  const next = {
    ...product,
    [cell]: product[cell].map((value, index) => (index === month ? amount : value)),
  } as InventoryPlanningProduct;
  const error = validateInventoryProduct(next);
  return error
    ? { ok: false, error }
    : { ok: true, value: products.map((row) => (row.id === id ? next : row)) };
}

export function inventoryOrderTotal(order: InventoryPurchaseOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
}

export function inventoryCommittedSpend(
  orders: readonly InventoryPurchaseOrder[],
  month: number,
): number {
  return orders
    .filter((order) => order.month === month && order.status !== "cancelled")
    .reduce((sum, order) => sum + inventoryOrderTotal(order), 0);
}

export function inventoryIncomingUnits(
  orders: readonly InventoryPurchaseOrder[],
  productId: string,
  month: number,
): number {
  return orders
    .filter(
      (order) => order.month <= month && (order.status === "draft" || order.status === "sent"),
    )
    .reduce(
      (total, order) =>
        total +
        order.lines
          .filter((line) => line.productId === productId)
          .reduce((sum, line) => sum + line.quantity, 0),
      0,
    );
}

export function inventoryReorderPlan(
  products: readonly InventoryPlanningProduct[],
  orders: readonly InventoryPurchaseOrder[],
  month: number,
  coverageDays: number,
) {
  if (
    !validPlanningMonth(month) ||
    !Number.isInteger(coverageDays) ||
    coverageDays < 1 ||
    coverageDays > 180
  ) {
    throw new RangeError("Choose a valid month and 1–180 coverage days.");
  }
  return products.map((product) => {
    const stock = inventoryStockSeries(product)[month];
    const dailyDemand = product.sales[month] / planningMonthDays(month);
    const target = Math.ceil(dailyDemand * (product.leadDays + coverageDays)) + product.safetyStock;
    const incoming = inventoryIncomingUnits(orders, product.id, month);
    const quantity = Math.max(0, target - stock.closing - incoming);
    return {
      product,
      ...stock,
      dailyDemand,
      target,
      incoming,
      quantity,
      cost: quantity * product.unitCost[month],
    };
  });
}

export function createInventoryDrafts(
  state: InventoryPlanningState,
  input: {
    idPrefix: string;
    month: number;
    coverageDays: number;
    budget: number;
    selected: readonly string[];
  },
): PlanningResult<InventoryPlanningState> {
  if (!validPlanningMonth(input.month) || !validPlanningMoney(input.budget))
    return { ok: false, error: "Choose a valid month and budget." };
  if (!Number.isInteger(input.coverageDays) || input.coverageDays < 1 || input.coverageDays > 180) {
    return { ok: false, error: "Coverage must be between 1 and 180 days." };
  }
  const selected = new Set(input.selected);
  if (!selected.size) return { ok: false, error: "Select products to reorder." };
  if ([...selected].some((id) => !state.products.some((product) => product.id === id)))
    return { ok: false, error: "A selected product no longer exists." };
  const lines = inventoryReorderPlan(
    state.products,
    state.orders,
    input.month,
    input.coverageDays,
  ).filter((line) => selected.has(line.product.id) && line.quantity > 0);
  if (!lines.length)
    return {
      ok: false,
      error: "Selected products already have sufficient stock or incoming orders.",
    };
  const cost = lines.reduce((sum, line) => sum + line.cost, 0);
  const remaining = input.budget - inventoryCommittedSpend(state.orders, input.month);
  if (cost > remaining)
    return { ok: false, error: "The selected reorder exceeds the remaining purchase budget." };
  const suppliers = [...new Set(lines.map((line) => line.product.supplier))];
  const drafts: InventoryPurchaseOrder[] = suppliers.map((supplier, index) => ({
    id: `${input.idPrefix}-${index + 1}`,
    supplier,
    month: input.month,
    status: "draft",
    lines: lines
      .filter((line) => line.product.supplier === supplier)
      .map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        unitCost: line.product.unitCost[input.month],
      })),
  }));
  if (
    !input.idPrefix.trim() ||
    drafts.some((draft) => state.orders.some((order) => order.id === draft.id))
  ) {
    return { ok: false, error: "Purchase order IDs must be unique." };
  }
  return { ok: true, value: { products: state.products, orders: [...state.orders, ...drafts] } };
}

export function transitionInventoryOrder(
  state: InventoryPlanningState,
  id: string,
  status: "sent" | "received" | "cancelled",
): PlanningResult<InventoryPlanningState> {
  const order = state.orders.find((row) => row.id === id);
  if (!order) return { ok: false, error: "Purchase order not found." };
  const valid =
    status === "sent"
      ? order.status === "draft"
      : status === "received"
        ? order.status === "sent"
        : order.status === "draft" || order.status === "sent";
  if (!valid) return { ok: false, error: "That purchase order transition is not available." };
  let products = state.products;
  if (status === "received") {
    if (order.lines.some((line) => !products.some((product) => product.id === line.productId))) {
      return { ok: false, error: "An ordered product no longer exists." };
    }
    products = products.map((product) => {
      const quantity = order.lines
        .filter((line) => line.productId === product.id)
        .reduce((sum, line) => sum + line.quantity, 0);
      if (!quantity) return product;
      return {
        ...product,
        receipts: product.receipts.map((amount, month) =>
          month === order.month ? amount + quantity : amount,
        ),
        counts: product.counts.map((amount, month) =>
          month === order.month && amount !== null ? amount + quantity : amount,
        ),
      };
    });
    for (const product of products) {
      const error = validateInventoryProduct(product);
      if (error) return { ok: false, error };
    }
  }
  return {
    ok: true,
    value: {
      products,
      orders: state.orders.map((row) => (row.id === id ? { ...row, status } : row)),
    },
  };
}
