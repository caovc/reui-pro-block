import { pulseBoardSeedGroups, pulseEscalationSeedTickets } from "./pulse-ticket-data";

export type PulseTicket = {
  id: string;
  customer: string;
  email: string;
  agent: string;
  stage: string;
  due: string;
  queue: string;
  value: string;
  sla: string;
  subject: string;
  requester?: string;
  priority?: string;
  escalation?: boolean;
};

export type PulseTicketColumns = Record<string, PulseTicket[]>;

/** The two existing fixture sets become facts in one parent-owned collection. */
export function createInitialPulseTickets(): PulseTicket[] {
  return [
    ...pulseEscalationSeedTickets.map((ticket) => ({ ...ticket, escalation: true })),
    ...pulseBoardSeedGroups.flatMap(([stage, rows]) =>
      rows.map((row) => ({
        id: row[0],
        priority: row[1],
        subject: row[2],
        requester: row[3],
        customer: row[4],
        agent: row[5],
        due: row[6],
        stage,
        // These are the existing Board detail projections, not inferred queue data.
        email:
          row[3].toLowerCase().replace(" ", ".") +
          "@" +
          row[4].toLowerCase().replaceAll(" ", "") +
          ".com",
        queue: "Technical",
        sla: stage === "SLA Risk" ? "At Risk" : "On Time",
        value: "—",
        escalation: false,
      })),
    ),
  ];
}

/** Both original views retain their membership in the single parent collection. */
export function pulseTicketCollection(tickets: readonly PulseTicket[], dashboard: boolean) {
  return tickets.filter((ticket) => Boolean(ticket.escalation) === dashboard);
}

export function filterPulseTickets(
  tickets: readonly PulseTicket[],
  query: string,
  filter: string,
  priority = "All",
) {
  const search = query.toLowerCase();
  return tickets.filter((ticket) => {
    const text = [
      ticket.id,
      ticket.customer,
      ticket.email,
      ticket.agent,
      ticket.stage,
      ticket.due,
      ticket.queue,
      ticket.value,
      ticket.sla,
      ticket.subject,
      ticket.requester,
      ticket.priority,
    ]
      .filter((value) => value !== undefined)
      .join(" ")
      .toLowerCase();
    return (
      text.includes(search) &&
      (priority === "All" || ticket.priority === priority) &&
      (filter === "All" ||
        ticket.queue === filter ||
        ticket.stage === filter ||
        ticket.sla === filter)
    );
  });
}

export function pulseTicketColumns(
  tickets: readonly PulseTicket[],
  query: string,
  filter: string,
  priority = "All",
): PulseTicketColumns {
  const boardTickets = pulseTicketCollection(tickets, false);
  const stages = [
    ...new Set([
      ...pulseBoardSeedGroups.map(([stage]) => stage),
      ...boardTickets.map((ticket) => ticket.stage),
    ]),
  ];
  const columns: PulseTicketColumns = Object.fromEntries(stages.map((stage) => [stage, []]));
  for (const ticket of filterPulseTickets(boardTickets, query, filter, priority)) {
    columns[ticket.stage].push(ticket);
  }
  return columns;
}

/** Reconcile visible Kanban IDs against current facts, retaining hidden records. */
export function applyPulseTicketColumns(
  current: readonly PulseTicket[],
  next: PulseTicketColumns,
  visibleIds: readonly string[],
): PulseTicket[] {
  const currentById = new Map(current.map((ticket) => [ticket.id, ticket]));
  const visible = new Set(visibleIds);
  const validStages = new Set([
    ...pulseBoardSeedGroups.map(([stage]) => stage),
    ...pulseTicketCollection(current, false).map((ticket) => ticket.stage),
  ]);
  const moved: PulseTicket[] = [];
  const seen = new Set<string>();
  for (const [stage, rows] of Object.entries(next)) {
    if (!validStages.has(stage)) return [...current];
    for (const row of rows) {
      const fact = currentById.get(row.id);
      if (!fact || fact.escalation || !visible.has(row.id) || seen.has(row.id)) return [...current];
      seen.add(row.id);
      moved.push(fact.stage === stage ? fact : { ...fact, stage });
    }
  }
  if (visible.size !== visibleIds.length || seen.size !== visible.size) return [...current];
  let index = 0;
  return current.map((ticket) => (visible.has(ticket.id) ? moved[index++] : ticket));
}

export function savePulseTicket(
  current: readonly PulseTicket[],
  values: PulseTicket,
  previousId: string | undefined,
  dashboard: boolean,
): { tickets: PulseTicket[]; error: string | null } {
  const existing = previousId ? current.find((ticket) => ticket.id === previousId) : undefined;
  if (previousId && !existing) {
    return { tickets: [...current], error: "This ticket no longer exists." };
  }
  if (current.some((ticket) => ticket.id === values.id && ticket.id !== previousId)) {
    return { tickets: [...current], error: "A ticket with this key already exists." };
  }
  const ticket = {
    ...existing,
    ...values,
    escalation: existing?.escalation ?? dashboard,
  };
  return {
    tickets: previousId
      ? current.map((item) => (item.id === previousId ? ticket : item))
      : [ticket, ...current],
    error: null,
  };
}

export function removePulseTickets(tickets: readonly PulseTicket[], ids: readonly string[]) {
  const removed = new Set(ids);
  return tickets.filter((ticket) => !removed.has(ticket.id));
}

export function resolvePulseTickets(tickets: readonly PulseTicket[], ids: readonly string[]) {
  const resolved = new Set(ids);
  return tickets.map((ticket) =>
    resolved.has(ticket.id) ? { ...ticket, stage: "Resolved", sla: "On Time" } : ticket,
  );
}

/** New Board records use the observed New lane; IDs come from current canonical facts. */
export function createPulseBoardTicket(
  current: readonly PulseTicket[],
  values: Pick<PulseTicket, "subject" | "requester" | "customer" | "queue" | "priority" | "agent">,
): PulseTicket {
  const number =
    Math.max(
      0,
      ...current.map((ticket) => {
        const match = /^TCK-(\d+)$/.exec(ticket.id);
        return match ? Number(match[1]) : 0;
      }),
    ) + 1;
  return {
    id: `TCK-${number}`,
    ...values,
    email: "",
    stage: "New",
    due: "Today",
    value: "—",
    sla: "On Time",
    escalation: false,
  };
}
