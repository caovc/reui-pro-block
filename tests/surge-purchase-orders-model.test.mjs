import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyPurchaseOrderOperation,
  initialSurgePurchaseOrders,
  purchaseOrderDate,
  purchaseOrderDateLabel,
  purchaseOrderTotalCents,
  purchaseOrderUnits,
} from "../src/templates/business/surge-purchase-orders-model.ts";

const product = (sku, stock) => ({ sku, stock, name: sku, price: 20, category: "Demo", image: "" });

test("Purchase receipt aggregates repeated SKU units, preserves other products and cannot apply twice", () => {
  const orders = initialSurgePurchaseOrders();
  orders[0].lines.push({ sku: "AC-1240", units: 3, unitCostCents: 1200 });
  const products = [product("AC-1240", 5), product("AC-1241", 7), product("other", 9)];
  const result = applyPurchaseOrderOperation(orders, products, orders[0].id, "Receive");
  assert.equal(result.changed, true);
  assert.deepEqual(
    result.products.map(({ stock }) => stock),
    [32, 17, 9],
  );
  assert.equal(result.orders[0].status, "Received");
  assert.equal(result.products[2], products[2]);
  assert.equal(orders[0].status, "Draft");
  assert.deepEqual(
    products.map(({ stock }) => stock),
    [5, 7, 9],
  );
  const again = applyPurchaseOrderOperation(
    result.orders,
    result.products,
    orders[0].id,
    "Receive",
  );
  assert.equal(again.changed, false);
  assert.equal(again.orders, result.orders);
  assert.equal(again.products, result.products);
});

test("Cancelling changes only status and preserves total, expected date and original inventory", () => {
  const orders = initialSurgePurchaseOrders();
  const products = [product("AC-1240", 5)];
  const result = applyPurchaseOrderOperation(orders, products, orders[0].id, "Cancel");
  assert.equal(result.changed, true);
  assert.equal(result.products, products);
  assert.equal(result.orders[0].status, "Cancelled");
  assert.equal(purchaseOrderTotalCents(result.orders[0]), purchaseOrderTotalCents(orders[0]));
  assert.equal(purchaseOrderDate(result.orders[0]), orders[0].expectedAt);
  assert.equal(purchaseOrderDateLabel(result.orders[0]), "Expected");
  assert.equal(
    applyPurchaseOrderOperation(result.orders, products, orders[0].id, "Receive").changed,
    false,
  );
  assert.equal(applyPurchaseOrderOperation(orders, products, "missing", "Cancel").changed, false);
});

test("Procurement totals use integer costs and date semantics follow the actual status", () => {
  const orders = initialSurgePurchaseOrders();
  assert.equal(purchaseOrderTotalCents(orders[0]), 37800);
  assert.equal(purchaseOrderUnits(orders[0]), 34);
  assert.equal(purchaseOrderDateLabel(orders[0]), "Expected");
  const received = applyPurchaseOrderOperation(
    orders,
    [product("AC-1240", 1), product("AC-1241", 1)],
    orders[0].id,
    "Receive",
    "2026-08-02",
  );
  assert.equal(purchaseOrderDate(received.orders[0]), "2026-08-02");
  assert.equal(purchaseOrderDateLabel(received.orders[0]), "Received");
});

test("Receiving refuses unavailable items without partially changing order or stock", () => {
  const orders = initialSurgePurchaseOrders();
  const products = [product("AC-1240", 5)];
  const result = applyPurchaseOrderOperation(orders, products, orders[0].id, "Receive");
  assert.equal(result.changed, false);
  assert.equal(result.orders, orders);
  assert.equal(result.products, products);
  assert.equal(applyPurchaseOrderOperation(orders, products, orders[0].id, "Cancel").changed, true);
});
