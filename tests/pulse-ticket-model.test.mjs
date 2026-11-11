import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import {
  pulseBoardSeedGroups,
  pulseEscalationSeedTickets,
} from "../src/templates/collaboration/pulse-ticket-data.ts";

const modelURL = new URL("../src/templates/collaboration/pulse-ticket-model.ts", import.meta.url);
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === modelURL.href && specifier === "./pulse-ticket-data") {
      return nextResolve(new URL("./pulse-ticket-data.ts", modelURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});
let model;
try {
  model = await import(modelURL.href);
} finally {
  hook.deregister();
}
const {
  applyPulseTicketColumns,
  createInitialPulseTickets,
  createPulseBoardTicket,
  filterPulseTickets,
  pulseTicketCollection,
  pulseTicketColumns,
  removePulseTickets,
  resolvePulseTickets,
  savePulseTicket,
} = model;

function immutableTickets() {
  return Object.freeze(createInitialPulseTickets().map((ticket) => Object.freeze(ticket)));
}

function allColumnIds(columns) {
  return Object.values(columns).flatMap((rows) => rows.map((ticket) => ticket.id));
}

test("Pulse retains every original escalation and Board record under one owner", () => {
  const tickets = createInitialPulseTickets();
  assert.equal(tickets.length, 28);
  assert.equal(new Set(tickets.map((ticket) => ticket.id)).size, 28);
  const dashboard = pulseTicketCollection(tickets, true);
  assert.equal(dashboard.length, 10);
  assert.deepEqual(
    dashboard.map(({ escalation: _escalation, ...ticket }) => ticket),
    pulseEscalationSeedTickets,
  );
  assert.equal(pulseTicketCollection(tickets, false).length, 18);
  for (const [stage, rows] of pulseBoardSeedGroups) {
    for (const row of rows) {
      const fact = tickets.find((ticket) => ticket.id === row[0]);
      assert.ok(fact);
      assert.deepEqual(
        [fact.id, fact.priority, fact.subject, fact.requester, fact.customer, fact.agent, fact.due],
        row,
      );
      assert.equal(fact.stage, stage);
      assert.equal(fact.queue, "Technical");
      assert.equal(fact.sla, stage === "SLA Risk" ? "At Risk" : "On Time");
    }
  }
});

test("Pulse query and queue/SLA filters select the same current IDs for List and Board", () => {
  const tickets = immutableTickets();
  assert.deepEqual(
    filterPulseTickets(tickets, "APEX", "Billing").map((ticket) => ticket.id),
    ["TCK-4927"],
  );
  assert.deepEqual(
    filterPulseTickets(tickets, "nightly", "Technical").map((ticket) => ticket.id),
    ["TCK-4863", "TCK-4960"],
  );
  for (const filter of ["All", "Billing", "Onboarding", "Account", "At Risk", "Resolved"]) {
    const list = filterPulseTickets(pulseTicketCollection(tickets, false), "", filter).map(
      (ticket) => ticket.id,
    );
    assert.deepEqual(new Set(allColumnIds(pulseTicketColumns(tickets, "", filter))), new Set(list));
  }
  assert.deepEqual(filterPulseTickets(tickets, "true", "All"), []);
});

test("Pulse Board edits preserve its original requester/priority while every projection updates", () => {
  const tickets = immutableTickets();
  const original = tickets.find((ticket) => ticket.id === "TCK-5012");
  const { requester, priority, escalation: _escalation, ...formValues } = original;
  const saved = savePulseTicket(
    tickets,
    { ...formValues, subject: "Reproduced checkout failure" },
    original.id,
    false,
  );
  assert.equal(saved.error, null);
  const edited = saved.tickets.find((ticket) => ticket.id === original.id);
  assert.equal(edited.requester, requester);
  assert.equal(edited.priority, priority);
  assert.equal(edited.escalation, false);
  assert.equal(edited.subject, "Reproduced checkout failure");
  assert.equal(pulseTicketCollection(saved.tickets, true).length, 10);
  assert.equal(filterPulseTickets(saved.tickets, "Reproduced checkout", "All").length, 1);
  assert.equal(
    allColumnIds(pulseTicketColumns(saved.tickets, "Reproduced checkout", "All")).length,
    1,
  );
  assert.equal(original.subject, "Checkout fails with a card error the bank cannot see");
});

test("Pulse creates once in the intended collection and rejects duplicate keys without replacing facts", () => {
  const tickets = immutableTickets();
  const values = { ...tickets[0], id: "TCK-9000", subject: "New current ticket" };
  for (const dashboard of [true, false]) {
    const result = savePulseTicket(tickets, values, undefined, dashboard);
    assert.equal(result.error, null);
    assert.equal(result.tickets.length, 29);
    assert.equal(result.tickets[0].escalation, dashboard);
    assert.equal(pulseTicketCollection(result.tickets, true).length, dashboard ? 11 : 10);
    assert.equal(
      allColumnIds(pulseTicketColumns(result.tickets, "TCK-9000", "All")).length,
      dashboard ? 0 : 1,
    );
    assert.equal(pulseTicketCollection(result.tickets, false).length, dashboard ? 18 : 19);
  }
  const duplicate = savePulseTicket(tickets, tickets[0], undefined, false);
  assert.match(duplicate.error, /already exists/);
  assert.deepEqual(duplicate.tickets, tickets);
  const missing = savePulseTicket(tickets, values, "TCK-MISSING", false);
  assert.match(missing.error, /no longer exists/);
  assert.deepEqual(missing.tickets, tickets);
});

test("Pulse deletion and resolution update shared projections without mutating hidden records", () => {
  const tickets = immutableTickets();
  const removed = removePulseTickets(tickets, ["TCK-5012", "TCK-4927"]);
  assert.equal(removed.length, 26);
  assert.equal(pulseTicketCollection(removed, true).length, 9);
  assert.ok(!allColumnIds(pulseTicketColumns(removed, "", "All")).includes("TCK-5012"));
  const resolved = resolvePulseTickets(tickets, ["TCK-5012"]);
  const fact = resolved.find((ticket) => ticket.id === "TCK-5012");
  assert.equal(fact.stage, "Resolved");
  assert.equal(fact.sla, "On Time");
  assert.ok(
    pulseTicketColumns(resolved, "", "All").Resolved.some((ticket) => ticket.id === fact.id),
  );
  assert.strictEqual(resolved[0], tickets[0]);
  assert.equal(tickets.find((ticket) => ticket.id === fact.id).stage, "New");
});

test("Pulse filtered Kanban moves preserve hidden facts and ignore stale callback fields", () => {
  const tickets = immutableTickets();
  const columns = pulseTicketColumns(tickets, "nightly", "Technical");
  const visible = filterPulseTickets(
    pulseTicketCollection(tickets, false),
    "nightly",
    "Technical",
  ).map((ticket) => ticket.id);
  const movedId = "TCK-4960";
  for (const stage of Object.keys(columns)) {
    columns[stage] = columns[stage].filter((ticket) => ticket.id !== movedId);
  }
  columns.Resolved.push({
    ...tickets.find((ticket) => ticket.id === movedId),
    subject: "Stale payload",
  });
  const result = applyPulseTicketColumns(tickets, columns, visible);
  assert.equal(result.length, 28);
  assert.equal(new Set(result.map((ticket) => ticket.id)).size, 28);
  const moved = result.find((ticket) => ticket.id === movedId);
  assert.equal(moved.stage, "Resolved");
  assert.equal(moved.subject, "Data export failed on 3 consecutive nightly runs");
  for (const original of tickets.filter((ticket) => !visible.includes(ticket.id))) {
    assert.strictEqual(
      result.find((ticket) => ticket.id === original.id),
      original,
    );
  }
});

test("Pulse rejects missing, unknown and duplicate drag IDs instead of losing records", () => {
  const tickets = immutableTickets();
  const visible = ["TCK-5012", "TCK-5019"];
  const a = tickets.find((ticket) => ticket.id === visible[0]);
  const b = tickets.find((ticket) => ticket.id === visible[1]);
  for (const payload of [
    { New: [a] },
    { New: [a, a] },
    { New: [a, { ...b, id: "TCK-UNKNOWN" }] },
    { "Invented stage": [a, b] },
  ]) {
    assert.deepEqual(applyPulseTicketColumns(tickets, payload, visible), tickets);
  }
});

test("Pulse Board retains the original six columns and membership without escalation aliases", () => {
  const tickets = immutableTickets();
  const columns = pulseTicketColumns(tickets, "", "All");
  for (const ticket of pulseTicketCollection(tickets, false)) {
    assert.ok(columns[ticket.stage].some((item) => item.id === ticket.id));
  }
  assert.deepEqual(
    Object.keys(columns),
    pulseBoardSeedGroups.map(([stage]) => stage),
  );
  assert.equal(allColumnIds(columns).length, 18);
  assert.ok(!allColumnIds(columns).includes("TCK-4863"));
  for (const [stage] of pulseBoardSeedGroups) assert.ok(Object.hasOwn(columns, stage));
  assert.deepEqual(
    pulseTicketCollection(tickets, true).map((ticket) => ticket.id),
    pulseEscalationSeedTickets.map((ticket) => ticket.id),
  );
});

test("Pulse observed priority menu filters the same Board and List members", () => {
  const tickets = immutableTickets();
  const board = pulseTicketCollection(tickets, false);
  for (const priority of ["All", "Urgent", "High", "Normal", "Low"]) {
    const rows = filterPulseTickets(board, "", "All", priority);
    assert.deepEqual(
      new Set(allColumnIds(pulseTicketColumns(tickets, "", "All", priority))),
      new Set(rows.map((row) => row.id)),
    );
    assert.ok(rows.every((row) => priority === "All" || row.priority === priority));
  }
  assert.deepEqual(allColumnIds(pulseTicketColumns(tickets, "nightly", "All", "Urgent")), [
    "TCK-4960",
  ]);
});

test("Pulse new ticket fields create a unique New-lane record without replacing canonical facts", () => {
  const tickets = immutableTickets();
  const values = {
    subject: "A reported incident",
    requester: "QA Person",
    customer: "QA Account",
    queue: "Billing",
    priority: "Normal",
    agent: "QA Agent",
  };
  const created = createPulseBoardTicket(tickets, values);
  assert.equal(created.id, "TCK-5039");
  assert.equal(created.stage, "New");
  assert.equal(created.escalation, false);
  assert.equal(created.requester, values.requester);
  assert.equal(created.priority, "Normal");
  const saved = savePulseTicket(tickets, created, undefined, false);
  assert.equal(saved.error, null);
  assert.equal(pulseTicketCollection(saved.tickets, true).length, 10);
  assert.equal(pulseTicketCollection(saved.tickets, false).length, 19);
  assert.equal(pulseTicketColumns(saved.tickets, "", "All").New[0].id, created.id);
  assert.equal(createPulseBoardTicket(saved.tickets, values).id, "TCK-5040");
  for (const original of tickets)
    assert.strictEqual(
      saved.tickets.find((ticket) => ticket.id === original.id),
      original,
    );
});
