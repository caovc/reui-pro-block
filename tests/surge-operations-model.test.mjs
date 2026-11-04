import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveSurgeCustomerGroups,
  deriveSurgeReorderRows,
  validateSurgeGroup,
} from "../src/templates/business/surge-operations-model.ts";

test("Surge reorder derives from its owner's current inventory without mutating or replacing products", () => {
  const shortage = Object.freeze({
    name: "Canvas Weekender",
    sku: "BG-2203",
    category: "Bags",
    price: 189,
    stock: 0,
    image: "/original-bag.svg",
  });
  const healthy = Object.freeze({
    name: "Different item",
    sku: "BG-2204",
    category: "Bags",
    price: 20,
    stock: 80,
    image: "/original-item.svg",
  });
  const source = Object.freeze([healthy, shortage]);
  const catalog = Object.freeze([{ name: "Canvas Weekender", vendor: "Field Supply" }]);
  const rows = deriveSurgeReorderRows(source, catalog);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "BG-2203");
  assert.equal(
    rows[0].product,
    shortage,
    "the product-detail callback receives the owner's object",
  );
  assert.equal(rows[0].supplier, "Field Supply");
  assert.equal(rows[0].urgency, "Out of stock");
  assert.deepEqual(source, [healthy, shortage]);
  const restocked = { ...shortage, stock: 80 };
  assert.deepEqual(deriveSurgeReorderRows([healthy, restocked], catalog), []);
  assert.equal(
    shortage.stock,
    0,
    "deriving a new inventory view does not edit the previous record",
  );
});

test("Surge group totals follow customer edits and removal instead of retaining copied member records", () => {
  const group = Object.freeze({
    id: "manual",
    name: "Store review",
    description: "Selected customers",
    membership: "manual",
    memberKeys: Object.freeze(["alice@example.test"]),
    createdAt: null,
  });
  const definitions = Object.freeze([group]);
  const alice = Object.freeze(["Alice", "alice@example.test", "3", "$1,234.50"]);
  const bob = Object.freeze(["Bob", "bob@example.test", "7", "$20.00"]);
  const customers = Object.freeze([alice, bob]);
  const [first] = deriveSurgeCustomerGroups(definitions, customers);
  assert.equal(first.memberCount, 1);
  assert.equal(first.share, 50);
  assert.equal(first.orders, 3);
  assert.equal(first.spent, 1234.5);
  assert.equal(first.createdAt, null, "missing source dates remain missing");
  const [edited] = deriveSurgeCustomerGroups(definitions, [
    ["Alice updated", "alice@example.test", "5", "$1,500.75"],
    bob,
  ]);
  assert.equal(edited.members[0].name, "Alice updated");
  assert.equal(edited.orders, 5);
  assert.equal(edited.spent, 1500.75);
  const [removed] = deriveSurgeCustomerGroups(definitions, [bob]);
  assert.equal(removed.memberCount, 0);
  assert.equal(removed.share, 0);
  assert.equal(removed.orders, 0);
  assert.equal(removed.spent, 0);
  assert.deepEqual(customers, [alice, bob]);
  assert.deepEqual(group.memberKeys, ["alice@example.test"]);
});

test("Surge group names reject blank and case-insensitive duplicates before local creation", () => {
  const groups = [{ id: "vip", name: "VIP" }];
  assert.equal(validateSurgeGroup("   ", "", groups), "Enter a group name.");
  assert.equal(
    validateSurgeGroup("  vip ", "Different description", groups),
    "A group with this name already exists.",
  );
  assert.equal(validateSurgeGroup("Upcoming review", "", groups), null);
  assert.deepEqual(groups, [{ id: "vip", name: "VIP" }]);
});
