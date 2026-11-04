import { useRef, useState } from "react";
import type { CatalogProduct } from "./catalog-data";

export interface SurgeProduct {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface SurgeReorderRow {
  id: string;
  product: SurgeProduct;
  available: number;
  reorderPoint: number;
  deficit: number;
  suggestedOrder: number;
  supplier: string;
  daysOfCover: number;
  urgency: "Out of stock" | "Low stock";
  atRiskValue: number;
}

// The supplied product model has no procurement policy, cost or sales velocity.
// Keep the preview's planning assumptions in one place, rather than presenting
// copied reference aggregates or a second inventory as authoritative records.
export const surgePlanningPolicy = {
  reorderPoint: 40,
  unitsPerDay: 2,
  orderMultiple: 10,
  deficitCoverage: 2,
} as const;

export function deriveSurgeReorderRows(
  products: SurgeProduct[],
  catalog: CatalogProduct[] = [],
): SurgeReorderRow[] {
  const policy = surgePlanningPolicy;
  return products
    .map((product) => {
      const available = Math.max(0, product.stock);
      const deficit = Math.max(0, policy.reorderPoint - available);
      return {
        id: product.sku,
        product,
        available,
        reorderPoint: policy.reorderPoint,
        deficit,
        suggestedOrder:
          Math.ceil((deficit * policy.deficitCoverage) / policy.orderMultiple) *
          policy.orderMultiple,
        supplier: catalog.find((entry) => entry.name === product.name)?.vendor || "Unassigned",
        daysOfCover: Math.floor(available / policy.unitsPerDay),
        urgency: available === 0 ? ("Out of stock" as const) : ("Low stock" as const),
        atRiskValue: deficit * Math.max(0, product.price),
      };
    })
    .filter((row) => row.deficit > 0)
    .sort((left, right) => right.deficit - left.deficit);
}

export interface SurgeCustomer {
  key: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
}

type SurgeMembership = "all" | "early-access" | "wholesale" | "vip" | "at-risk" | "manual";

export interface SurgeGroupDefinition {
  id: string;
  name: string;
  description: string;
  membership: SurgeMembership;
  memberKeys: string[];
  createdAt: string | null;
}

export interface SurgeCustomerGroup extends SurgeGroupDefinition {
  members: SurgeCustomer[];
  memberCount: number;
  share: number;
  orders: number;
  spent: number;
}

function readAmount(value: string | undefined) {
  const amount = Number((value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

export function deriveSurgeCustomers(customers: string[][]): SurgeCustomer[] {
  return customers.map(([name, email, orders, spent], index) => ({
    key: email || `${name}-${index}`,
    name: name || "Unnamed customer",
    email: email || "",
    orders: Math.floor(readAmount(orders)),
    spent: readAmount(spent),
  }));
}

function initialGroupDefinitions(): SurgeGroupDefinition[] {
  return [
    {
      id: "newsletter",
      name: "Newsletter",
      description: "All customers in this workspace",
      membership: "all",
    },
    {
      id: "early-access",
      name: "Early access",
      description: "The first two customers in this workspace",
      membership: "early-access",
    },
    {
      id: "wholesale",
      name: "Wholesale",
      description: "Customers with at least five orders",
      membership: "wholesale",
    },
    {
      id: "vip",
      name: "VIP",
      description: "Customers who spent $1,000 or more",
      membership: "vip",
    },
    {
      id: "at-risk",
      name: "At risk",
      description: "Customers with three orders or fewer",
      membership: "at-risk",
    },
  ].map((group) => ({
    ...group,
    membership: group.membership as SurgeMembership,
    memberKeys: [],
    createdAt: null,
  }));
}

export function deriveSurgeCustomerGroups(
  definitions: SurgeGroupDefinition[],
  customerRows: string[][],
): SurgeCustomerGroup[] {
  const customers = deriveSurgeCustomers(customerRows);
  return definitions.map((group) => {
    const members = customers.filter((customer, index) => {
      switch (group.membership) {
        case "all":
          return true;
        case "early-access":
          return index < 2;
        case "wholesale":
          return customer.orders >= 5;
        case "vip":
          return customer.spent >= 1000;
        case "at-risk":
          return customer.orders <= 3;
        case "manual":
          return group.memberKeys.includes(customer.key);
      }
    });
    return {
      ...group,
      members,
      memberCount: members.length,
      share: customers.length ? Math.round((members.length / customers.length) * 100) : 0,
      orders: members.reduce((sum, customer) => sum + customer.orders, 0),
      spent: members.reduce((sum, customer) => sum + customer.spent, 0),
    };
  });
}

export function validateSurgeGroup(
  name: string,
  description: string,
  groups: SurgeGroupDefinition[],
): string | null {
  if (!name.trim()) return "Enter a group name.";
  if (name.trim().length > 80) return "Use 80 characters or fewer for the group name.";
  if (description.trim().length > 500) return "Use 500 characters or fewer for the description.";
  if (groups.some((group) => group.name.toLowerCase() === name.trim().toLowerCase())) {
    return "A group with this name already exists.";
  }
  return null;
}

/** Mounted once by the owning template; leaf navigation does not reset groups. */
export function useSurgeOperationsState() {
  const [groups, setGroups] = useState(initialGroupDefinitions);
  const nextId = useRef(1);
  function addGroup(name: string, description: string) {
    const error = validateSurgeGroup(name, description, groups);
    if (error) return { error };
    const id = `custom-group-${nextId.current++}`;
    setGroups((current) => [
      ...current,
      {
        id,
        name: name.trim(),
        description: description.trim(),
        membership: "manual",
        memberKeys: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    return { id };
  }
  return { groups, addGroup };
}

export type SurgeOperationsModel = ReturnType<typeof useSurgeOperationsState>;
