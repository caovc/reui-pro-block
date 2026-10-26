import type { FilterNode, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import type {
  Prospect,
  ProspectIntent,
  ProspectList,
  ProspectOwnerId,
  ProspectStatus,
} from "./grid-advanced-prospect-database-data";

export function prospectIntent(score: number): ProspectIntent {
  return score >= 70 ? "high" : score >= 40 ? "medium" : "low";
}

export function prospectGrowth(record: Pick<Prospect, "headcount">): number | null {
  const first = record.headcount[0];
  const last = record.headcount[5];
  return first !== null && first > 0 && last !== null
    ? Math.round(((last - first) / first) * 100)
    : null;
}

export function prospectIntentSummary(records: readonly Prospect[]) {
  return (["high", "medium", "low"] as const).map((tier) => {
    const matching = records.filter((record) => prospectIntent(record.intent) === tier);
    return {
      tier,
      count: matching.length,
      share: records.length ? Math.round((matching.length / records.length) * 100) : 0,
      unassigned: matching.filter((record) => record.ownerId === null).length,
    };
  });
}

function fieldValue(record: Prospect, field: string): unknown {
  if (field === "growth") return prospectGrowth(record);
  if (field === "owner") return record.ownerId;
  if (field === "list") return record.listIds;
  if (field === "size") return record.employees;
  if (field === "hqCity") return record.city;
  if (["industry", "country", "funding", "intent", "status", "contacts"].includes(field)) {
    return record[field as keyof Prospect];
  }
  return undefined;
}

const numericFields = new Set(["size", "growth", "intent", "contacts"]);
const valuelessOperators = new Set(["is_empty", "is_not_empty", "empty", "not_empty"]);

function evaluateRule(record: Prospect, rule: FilterRule): boolean | undefined {
  const field = rule.path.join(".");
  const raw = fieldValue(record, field);
  if (!rule.operator || raw === undefined) return undefined;
  const operator = rule.operator;
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  const present = values.filter(
    (value) => value !== undefined && value !== null && String(value).trim() !== "",
  );
  if (!valuelessOperators.has(operator)) {
    if (!present.length || (["between", "not_between"].includes(operator) && present.length !== 2))
      return undefined;
    if (numericFields.has(field) && present.some((value) => !Number.isFinite(Number(value))))
      return undefined;
  }
  const cells = Array.isArray(raw) ? raw : [raw];
  const text = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLocaleLowerCase();
  const empty = raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);
  const equal = (value: unknown) =>
    numericFields.has(field)
      ? raw !== null && Number(raw) === Number(value)
      : cells.some((cell) => text(cell) === text(value));
  let result: boolean;
  switch (operator) {
    case "is_empty":
    case "empty":
      result = empty;
      break;
    case "is_not_empty":
    case "not_empty":
      result = !empty;
      break;
    case "is":
    case "eq":
      result = equal(present[0]);
      break;
    case "is_not":
    case "neq":
      result = !equal(present[0]);
      break;
    case "in":
    case "contains_any":
    case "is_any_of":
    case "has_any_of":
      result = present.some(equal);
      break;
    case "not_in":
    case "contains_none":
    case "is_none_of":
    case "has_none_of":
      result = !present.some(equal);
      break;
    case "contains_all":
    case "has_all_of":
      result = present.every(equal);
      break;
    case "contains":
      result = cells.some((cell) => text(cell).includes(text(present[0])));
      break;
    case "not_contains":
      result = !cells.some((cell) => text(cell).includes(text(present[0])));
      break;
    case "starts_with":
      result = text(raw).startsWith(text(present[0]));
      break;
    case "ends_with":
      result = text(raw).endsWith(text(present[0]));
      break;
    case "gt":
      result = raw !== null && Number(raw) > Number(present[0]);
      break;
    case "gte":
      result = raw !== null && Number(raw) >= Number(present[0]);
      break;
    case "lt":
      result = raw !== null && Number(raw) < Number(present[0]);
      break;
    case "lte":
      result = raw !== null && Number(raw) <= Number(present[0]);
      break;
    case "between":
      result =
        raw !== null && Number(raw) >= Number(present[0]) && Number(raw) <= Number(present[1]);
      break;
    case "not_between":
      result =
        raw !== null && (Number(raw) < Number(present[0]) || Number(raw) > Number(present[1]));
      break;
    default:
      return undefined;
  }
  return rule.negated ? !result : result;
}

// Filters owns the complete query UI/tree. This domain compiler alone maps its
// typed fields to account values. undefined skips drafts, including empty OR
// groups, instead of incorrectly letting an unfinished branch match everything.
export function evaluateProspectNode(record: Prospect, node: FilterNode): boolean | undefined {
  if (node.type === "rule") return evaluateRule(record, node);
  const values = node.rules
    .map((child) => evaluateProspectNode(record, child))
    .filter((value): value is boolean => value !== undefined);
  if (!values.length) return undefined;
  return node.combinator === "and" ? values.every(Boolean) : values.some(Boolean);
}

export function prospectMatchesQuery(record: Prospect, query: FilterQuery) {
  return evaluateProspectNode(record, query) ?? true;
}

export function prospectMatchesSearch(record: Prospect, query: string) {
  const text = query.trim().toLocaleLowerCase();
  return (
    !text ||
    [record.name, record.domain, record.city, record.country, record.industry].some((value) =>
      value.toLocaleLowerCase().includes(text),
    )
  );
}

export function isClosedProspect(status: ProspectStatus) {
  return status === "Qualified" || status === "Disqualified";
}

export function prospectHandoverPreview(
  records: readonly Prospect[],
  from: ProspectOwnerId,
  to: ProspectOwnerId,
) {
  const owned = records.filter((record) => record.ownerId === from);
  const eligible = from === to ? [] : owned.filter((record) => !isClosedProspect(record.status));
  return {
    owned: owned.length,
    eligibleIds: eligible.map((record) => record.id),
    contacts: eligible.reduce((sum, record) => sum + record.contacts, 0),
    highIntent: eligible.filter((record) => prospectIntent(record.intent) === "high").length,
    conversations: eligible.filter((record) => record.status === "Contacted").length,
    retained: owned.filter((record) => isClosedProspect(record.status)).length,
    recipientOwned: records.filter((record) => record.ownerId === to).length,
  };
}

export function normalizeProspectDomain(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

export function validateProspectDraft(
  draft: Pick<Prospect, "id" | "name" | "domain" | "employees">,
  records: readonly Prospect[],
) {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Enter a company name.";
  const domain = normalizeProspectDomain(draft.domain);
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(domain) || domain.includes(".."))
    errors.domain = "Enter a valid company domain.";
  else if (
    records.some(
      (record) => record.id !== draft.id && normalizeProspectDomain(record.domain) === domain,
    )
  )
    errors.domain = "A company with this domain already exists.";
  if (!Number.isSafeInteger(draft.employees) || draft.employees < 0)
    errors.employees = "Use a whole number of employees, zero or more.";
  return errors;
}

type ProspectSnapshot = { companies: Prospect[]; lists: ProspectList[] };
export type ProspectBook = ProspectSnapshot & { past: ProspectSnapshot[] };
export type ProspectCommand =
  | { type: "load"; companies: Prospect[] }
  | { type: "upsert"; record: Prospect }
  | { type: "patch"; ids: string[]; patch: Partial<Omit<Prospect, "id">> }
  | { type: "remove"; ids: string[] }
  | { type: "toggle-list"; ids: string[]; listId: string }
  | { type: "create-list"; list: ProspectList; companyIds: string[] }
  | { type: "handover"; from: ProspectOwnerId; to: ProspectOwnerId }
  | { type: "undo" };

export function prospectBookReducer(state: ProspectBook, command: ProspectCommand): ProspectBook {
  if (command.type === "load")
    return { companies: command.companies, lists: state.lists, past: [] };
  if (command.type === "undo") {
    const previous = state.past.at(-1);
    return previous ? { ...previous, past: state.past.slice(0, -1) } : state;
  }
  let companies = state.companies;
  let lists = state.lists;
  if (command.type === "upsert") {
    if (Object.keys(validateProspectDraft(command.record, companies)).length) return state;
    const record = {
      ...command.record,
      headcount: [
        ...command.record.headcount.slice(0, 5),
        command.record.employees,
      ] as Prospect["headcount"],
      name: command.record.name.trim(),
      domain: normalizeProspectDomain(command.record.domain),
    };
    companies = companies.some((company) => company.id === record.id)
      ? companies.map((company) => (company.id === record.id ? record : company))
      : [...companies, record];
  } else if (command.type === "patch") {
    const selected = new Set(command.ids);
    companies = companies.map((company) =>
      selected.has(company.id) ? { ...company, ...command.patch } : company,
    );
  } else if (command.type === "remove") {
    const selected = new Set(command.ids);
    companies = companies.filter((company) => !selected.has(company.id));
  } else if (command.type === "handover") {
    const eligible = new Set(
      prospectHandoverPreview(companies, command.from, command.to).eligibleIds,
    );
    companies = companies.map((company) =>
      eligible.has(company.id) ? { ...company, ownerId: command.to } : company,
    );
  } else if (command.type === "toggle-list") {
    if (!lists.some((list) => list.id === command.listId)) return state;
    const selected = new Set(command.ids);
    const allSaved = companies
      .filter((company) => selected.has(company.id))
      .every((company) => company.listIds.includes(command.listId));
    companies = companies.map((company) =>
      selected.has(company.id)
        ? {
            ...company,
            listIds: allSaved
              ? company.listIds.filter((id) => id !== command.listId)
              : [...new Set([...company.listIds, command.listId])],
          }
        : company,
    );
  } else if (command.type === "create-list") {
    const name = command.list.name.trim();
    if (
      !name ||
      lists.some(
        (list) =>
          list.id === command.list.id || list.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      return state;
    lists = [...lists, { ...command.list, name }];
    const selected = new Set(command.companyIds);
    companies = companies.map((company) =>
      selected.has(company.id)
        ? { ...company, listIds: [...company.listIds, command.list.id] }
        : company,
    );
  }
  if (JSON.stringify(companies) === JSON.stringify(state.companies) && lists === state.lists)
    return state;
  return {
    companies,
    lists,
    past: [...state.past.slice(-29), { companies: state.companies, lists: state.lists }],
  };
}
