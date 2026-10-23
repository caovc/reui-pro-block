export const echoArtifacts = [
  {
    filename: "admin-notes-3.4.pdf",
    language: "markdown",
    chat: "Admin guide refresh",
    code: "# Admin 3.4 release notes\n\n## Account administration\n- Review workspace roles before inviting members.\n- Export an audit log for every major permission change.\n\n## Release checklist\n- Verify the new export limits.\n- Confirm the rollback owner.\n\nLocal text preview of the release notes.",
  },
  {
    filename: "stripe-webhook.ts",
    language: "typescript",
    chat: "Stripe webhook 500s on charge.refunded",
    code: "type Refund = { id: string; payment_intent: string | null };\n\nexport async function resolveRefundOrder(refund: Refund) {\n  if (refund.payment_intent) {\n    return orders.byIntent(refund.payment_intent);\n  }\n  return orders.byCharge(refund.id);\n}\n\n// Preserve a successful response after the refund has been handled.\n// A missing payment intent is a supported case, not a server error.\n",
  },
  {
    filename: "churn-q3.csv",
    language: "csv",
    chat: "Churn by plan tier",
    code: "plan,accounts,churned,rate\nStarter,1200,42,3.5%\nTeam,640,12,1.9%\nBusiness,180,2,1.1%",
  },
  {
    filename: "adoption-chart.png",
    language: "markdown",
    chat: "Growth analytics",
    code: "# Adoption chart data\n\nWeek 1: 42%\nWeek 2: 54%\nWeek 3: 68%\nWeek 4: 76%\n\nLocal text alternative for the adoption chart.",
  },
  {
    filename: "retry-budget.ts",
    language: "typescript",
    chat: "Retry budget for the events consumer",
    code: "export const retryBudget = {\n  attempts: 3,\n  initialDelayMs: 500,\n  maxDelayMs: 8000,\n};\n\nexport function nextRetry(attempt: number) {\n  return Math.min(retryBudget.maxDelayMs,\n    retryBudget.initialDelayMs * 2 ** attempt);\n}",
  },
  {
    filename: "audit-log-cursor.md",
    language: "markdown",
    chat: "Cursor pagination for the audit log",
    code: "# Cursor pagination\n\nUse an opaque cursor containing the last event identifier.\n\n- Keep the event ordering stable.\n- Return a next cursor only when another page exists.\n- Reuse the active filter on every request.",
  },
  {
    filename: "p95-eu-west.csv",
    language: "csv",
    chat: "Why is p95 latency up on eu-west",
    code: "hour,p50_ms,p95_ms\n08:00,42,164\n09:00,46,212\n10:00,44,178",
  },
  {
    filename: "flag-cleanup-3.4.diff",
    language: "diff",
    chat: "Feature flag cleanup after 3.4",
    code: "- if (flags.legacyExport) return legacyExport();\n+ return auditedExport();\n\n- const release = '3.3';\n+ const release = '3.4';",
  },
];
