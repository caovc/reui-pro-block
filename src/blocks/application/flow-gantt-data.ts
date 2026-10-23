export type RunState =
  | "Idle"
  | "Queued"
  | "Running"
  | "Succeeded"
  | "Failed"
  | "Waiting"
  | "Skipped";
export type FlowNode = {
  id: string;
  title: string;
  detail: string;
  x: number;
  y: number;
  parent?: string;
  branch?: string;
  owner: string;
  status: RunState;
  duration: string;
  role?: string;
  value?: number[];
  change?: number[];
  progress?: number;
  correlation?: string;
};

const ownerNames = ["Ines Marchetti", "Tomas Lindqvist", "Hanna Berg"];
const node = (
  id: string,
  title: string,
  detail: string,
  x: number,
  y: number,
  parent?: string,
  extras: Partial<FlowNode> = {},
): FlowNode => ({
  id,
  title,
  detail,
  x,
  y,
  parent,
  owner: ownerNames[0],
  status: "Succeeded",
  duration: "0.2s",
  ...extras,
});
export function seed(index: number): FlowNode[] {
  if (index === 1)
    return [
      node("trigger", "Stripe", "Invoice 3 days overdue", 385, 25, undefined, {
        duration: "inv_9412 · EUR 4,180",
      }),
      node("query", "Neon", "Runs query_db on invoices", 385, 150, "trigger", {
        duration: "1 row · 42ms",
      }),
      node("model", "Claude Sonnet 5", "Triages the account", 385, 275, "query", {
        duration: "1,842 tokens · USD 0.031",
      }),
      node("guard", "PII Guardrail", "Scans outbound text", 65, 440, "model", {
        branch: "No reply",
        status: "Skipped",
        duration: "Branch not taken",
      }),
      node("plan", "Stripe", "Offers a payment plan", 385, 440, "model", {
        branch: "Promised",
        duration: "3 instalments · EUR 1,393",
      }),
      node("dispute", "Stripe", "Pulls the dispute evidence", 705, 440, "model", {
        branch: "Disputed",
        status: "Skipped",
        duration: "Branch not taken",
      }),
      node("slack", "Slack", "Posts to #collections", 65, 580, "guard", {
        status: "Skipped",
        duration: "Upstream skipped",
      }),
      node("email", "Resend", "Emails the terms to Maren", 385, 580, "plan", {
        status: "Failed",
        duration: "Bounced · Retry queued",
      }),
      node("assign", "ClickUp", "Assigns Hanna Berg", 705, 580, "dispute", {
        status: "Skipped",
        duration: "Upstream skipped",
      }),
    ];
  if (index === 2)
    return [
      node("nightly", "Nightly", "02:00 UTC", 20, 230, undefined, {
        duration: "Scheduled",
      }),
      node("stripe", "extract_stripe", "Stripe connection", 260, 70, "nightly", {
        duration: "2m 10s",
      }),
      node("paypal", "extract_paypal", "PayPal connection", 260, 390, "nightly", {
        duration: "1m 48s",
      }),
      node("dedupe", "dedupe_payments", "1.5M rows · unique_charge", 500, 230, "stripe", {
        duration: "3m 12s",
      }),
      node("reconcile", "reconcile_ledger", "Duplicate charge id", 740, 70, "dedupe", {
        status: "Failed",
        duration: "Failed · ledger_v3",
      }),
      node("publish", "publish_mrr", "Awaiting Approval", 740, 390, "dedupe", {
        status: "Waiting",
        duration: "Finance approval",
      }),
      node("invoices", "build_invoices", "Blocked upstream", 980, 70, "reconcile", {
        status: "Queued",
        duration: "Not run",
      }),
      node("notify", "notify_finance", "Holds for Approval", 980, 390, "publish", {
        status: "Waiting",
        duration: "Not run",
      }),
    ];
  if (index === 3)
    return [
      node("returns", "Free first returns", "GitHub Project · 3 open", 15, 60, undefined, {
        role: "Initiative",
        progress: 62,
      }),
      node("sms", "SMS restock alerts", "Growth Team · 5 open", 15, 235, undefined, {
        role: "Initiative",
        progress: 40,
      }),
      node("loyalty", "Loyalty upgrade email", "Lifecycle Team · 4 open", 15, 410, undefined, {
        role: "Initiative",
        progress: 0,
      }),
      node("checkout", "Checkout completion", "Average", 310, 60, "returns", {
        role: "Input",
        value: [68.4, 66.9, 61.2],
        change: [1.2, 2.8, 9.4],
        correlation: "0.91",
      }),
      node("optin", "Restock alert opt-ins", "Sum", 310, 235, "sms", {
        role: "Input",
        value: [1240, 7905, 61880],
        change: [3.1, 5.4, 41.2],
        correlation: "0.88",
      }),
      node("discount", "Average discount depth", "Average", 310, 410, "loyalty", {
        role: "Input",
        value: [14.2, 15.1, 17.6],
        change: [-0.8, -1.1, -6.9],
        progress: 58,
        correlation: "-0.58",
      }),
      node("north", "Weekly repeat orders", "Sum", 605, 235, "optin", {
        role: "North Star",
        value: [3912, 22408, 168730],
        change: [0.9, 2.6, 31.8],
        correlation: undefined,
      }),
      node("rate", "Repeat purchase rate", "Average", 900, 120, "north", {
        role: "KPI",
        value: [36.4, 35.1, 31.8],
        change: [0.6, 1.9, 9.2],
        correlation: "0.97",
      }),
      node("margin", "Contribution margin", "Sum", 900, 350, "north", {
        role: "KPI",
        value: [412000, 2300000, 17900000],
        change: [1.4, 3.2, 22.6],
        correlation: "0.84",
      }),
    ];
  return [
    node("form", "Form submitted", "Webhook: demo.request", 20, 240),
    node("condition", "Plan is Enterprise", "company.size > 200", 300, 240, "form", {
      duration: "0.1s",
    }),
    node("enrich", "Enrich company", "Clearbit lookup", 580, 110, "condition", {
      branch: "Yes",
      owner: ownerNames[1],
      status: "Failed",
      duration: "8.0s",
    }),
    node("notify", "Notify sales", "Slack #inbound-leads", 580, 370, "condition", {
      branch: "No",
      owner: ownerNames[2],
      status: "Skipped",
      duration: "Not run",
    }),
    node("deal", "Create deal", "HubSpot pipeline: Inbound", 860, 110, "enrich", {
      owner: ownerNames[1],
      status: "Idle",
      duration: "Not run",
    }),
  ];
}
export const graphTitles = [
  "Lead Routing",
  "Collections Agent",
  "Nightly Ledger Sync",
  "Repeat Order Growth",
];
