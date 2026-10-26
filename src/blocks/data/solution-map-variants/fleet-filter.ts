import type { FilterNode, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import { routeMetrics } from "./fleet-model";
import type { FleetState, FleetVehicle } from "./fleet-types";

function matchRule(rule: FilterRule, vehicle: FleetVehicle, state: FleetState): boolean | null {
  const field = rule.path.at(-1);
  const value =
    field === "status"
      ? vehicle.status
      : field === "kind"
        ? vehicle.kind
        : field === "fuel"
          ? vehicle.fuel
          : field === "parcels"
            ? routeMetrics(state, vehicle.id).parcels
            : undefined;
  if (value === undefined) return null;
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  if (
    !["empty", "not_empty"].includes(rule.operator) &&
    (values.length === 0 ||
      values.some((item) => item === undefined || item === null || item === ""))
  )
    return null;
  let result: boolean;
  switch (rule.operator) {
    case "empty":
      result = String(value) === "";
      break;
    case "not_empty":
      result = String(value) !== "";
      break;
    case "is":
    case "is_any_of":
      result = values.map(String).includes(String(value));
      break;
    case "is_not":
    case "is_none_of":
      result = !values.map(String).includes(String(value));
      break;
    case "eq":
      result = value === Number(values[0]);
      break;
    case "neq":
      result = value !== Number(values[0]);
      break;
    case "gt":
      result = Number(value) > Number(values[0]);
      break;
    case "gte":
      result = Number(value) >= Number(values[0]);
      break;
    case "lt":
      result = Number(value) < Number(values[0]);
      break;
    case "lte":
      result = Number(value) <= Number(values[0]);
      break;
    case "between":
    case "not_between": {
      if (values.length < 2 || !values.every((item) => Number.isFinite(Number(item)))) return null;
      result = Number(value) >= Number(values[0]) && Number(value) <= Number(values[1]);
      if (rule.operator === "not_between") result = !result;
      break;
    }
    default:
      return null;
  }
  return rule.negated ? !result : result;
}

/** The official Filters owns the query UI; interpreting fleet fields is domain logic. */
export function matchesFleetQuery(
  query: FilterQuery,
  vehicle: FleetVehicle,
  state: FleetState,
): boolean {
  const visit = (node: FilterNode): boolean | null => {
    if (node.type === "rule") return matchRule(node, vehicle, state);
    const matches = node.rules.map(visit).filter((value): value is boolean => value !== null);
    return matches.length === 0
      ? null
      : node.combinator === "and"
        ? matches.every(Boolean)
        : matches.some(Boolean);
  };
  return visit(query) ?? true;
}
