import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apiKeyEnabled,
  createStrataApiKeys,
  updateStrataApiKey,
} from "../src/templates/workflow/strata-settings-api-model.ts";
import {
  addStrataPendingDomain,
  configureStrataProvider,
  createStrataSecurityPolicy,
  strataDemoScimToken,
  validateStrataProviderUrl,
  validateStrataSecurityPolicy,
} from "../src/templates/workflow/strata-settings-security-model.ts";
import {
  STRATA_BILLING_INVOICES,
  STRATA_BILLING_PLANS,
  strataBillingUsage,
  strataBillingUsageCsv,
  strataInvoicePdf,
  strataPlanQuote,
} from "../src/templates/workflow/strata-settings-billing-model.ts";

test("API fixture has 31 unique explicitly fake keys and pause preserves local settings", () => {
  const keys = createStrataApiKeys();
  assert.equal(keys.length, 31);
  assert.equal(new Set(keys.map((key) => key.id)).size, 31);
  assert.equal(new Set(keys.map((key) => key.token)).size, 31);
  assert.ok(keys.every((key) => key.token.startsWith("bl_demo_not_a_secret_")));
  assert.equal(keys[0].name, "AI Summarizer");
  assert.equal(keys[9].name, "Deploy Reviews");
  const snapshot = structuredClone(keys);
  assert.ok(keys.every((key) => apiKeyEnabled(key, true) === false));
  assert.deepEqual(
    keys.map((key) => apiKeyEnabled(key, false)),
    keys.map((key) => key.enabled),
  );
  assert.deepEqual(keys, snapshot);
  keys[0].name = "Changed";
  assert.equal(createStrataApiKeys()[0].name, "AI Summarizer");
});

test("API edits validate scopes while preserving token, ID and historical calls", () => {
  const keys = createStrataApiKeys();
  const draft = {
    name: " Renamed intake ",
    purpose: " New local purpose ",
    enabled: true,
    scopes: ["logs:write", "logs:write"],
  };
  const result = updateStrataApiKey(keys, keys[0].id, draft);
  assert.equal(result.ok, true);
  assert.equal(result.keys[0].name, "Renamed intake");
  assert.equal(result.keys[0].token, keys[0].token);
  assert.equal(result.keys[0].dailyCalls, keys[0].dailyCalls);
  assert.deepEqual(result.keys[0].scopes, ["logs:write"]);
  assert.notEqual(result.keys[0], keys[0]);
  assert.equal(updateStrataApiKey(keys, keys[0].id, { ...draft, scopes: [] }).ok, false);
  assert.equal(
    updateStrataApiKey(keys, keys[0].id, { ...draft, scopes: ["admin:delete"] }).ok,
    false,
  );
  assert.equal(updateStrataApiKey(keys, "missing", draft).ok, false);
});

test("required 2FA cannot be saved with no allowed factors", () => {
  const policy = createStrataSecurityPolicy();
  assert.equal(validateStrataSecurityPolicy(policy), "");
  const noFactors = {
    ...policy,
    factors: { totp: false, passkey: false, securityKey: false, sms: false },
  };
  assert.ok(validateStrataSecurityPolicy(noFactors));
  assert.equal(validateStrataSecurityPolicy({ ...noFactors, twoFactor: "Optional" }), "");
  assert.ok(validateStrataSecurityPolicy({ ...policy, idle: "forever" }));
  policy.factors.totp = false;
  assert.equal(createStrataSecurityPolicy().factors.totp, true);
});

test("added domains remain pending and cannot duplicate an existing verified fixture", () => {
  const domains = [{ name: "bricklane.test", status: "Verified fixture" }];
  const result = addStrataPendingDomain(domains, " TEAM.Bricklane.TEST ");
  assert.equal(result.ok, true);
  assert.equal(result.domains[1].name, "team.bricklane.test");
  assert.equal(result.domains[1].status, "Pending verification");
  assert.ok(result.domains[1].record.startsWith("bricklane-demo-verification-"));
  assert.equal(domains.length, 1);
  assert.equal(addStrataPendingDomain(domains, "BRICKLANE.TEST").ok, false);
  assert.equal(addStrataPendingDomain(domains, "https://team.bricklane.test").ok, false);
  assert.equal(addStrataPendingDomain(domains, "-invalid.test").ok, false);
});

test("provider draft validation never reports a newly connected remote provider", () => {
  const providers = [
    {
      id: "google",
      name: "Google Workspace",
      url: "https://identity.bricklane.test/google",
      status: "Not configured",
      detail: "Local fixture",
    },
  ];
  assert.ok(validateStrataProviderUrl("http://identity.bricklane.test"));
  assert.ok(validateStrataProviderUrl("not a URL"));
  const result = configureStrataProvider(
    providers,
    "google",
    "https://identity.bricklane.test/new",
  );
  assert.equal(result.ok, true);
  assert.equal(result.providers[0].status, "Configured locally");
  assert.equal(providers[0].status, "Not configured");
  assert.equal(configureStrataProvider(providers, "missing", providers[0].url).ok, false);
  assert.ok(strataDemoScimToken(1).startsWith("bl_demo_scim_not_a_secret_"));
  assert.notEqual(strataDemoScimToken(1), strataDemoScimToken(2));
});

test("billing quotes use integer cents without modifying the current fixture plan", () => {
  const snapshot = structuredClone(STRATA_BILLING_PLANS);
  assert.equal(strataPlanQuote("starter", "monthly").cents, 4900);
  assert.equal(strataPlanQuote("starter", "yearly").cents, 49000);
  assert.equal(strataPlanQuote("growth", "yearly").cents, 199000);
  assert.equal(strataPlanQuote("scale", "yearly").cents, 599000);
  assert.equal(strataPlanQuote("starter", "yearly").monthlyEquivalentCents, 4100);
  assert.equal(strataPlanQuote("growth", "yearly").monthlyEquivalentCents, 16600);
  assert.equal(strataPlanQuote("scale", "yearly").monthlyEquivalentCents, 49900);
  assert.equal(strataPlanQuote("growth", "yearly").freeMonths, 2);
  assert.equal(strataPlanQuote("scale", "monthly").taxIncluded, false);
  assert.throws(() => strataPlanQuote("missing", "monthly"));
  assert.deepEqual(STRATA_BILLING_PLANS, snapshot);
});

test("usage CSV retains exact numbers behind compact on-screen amounts", () => {
  const usage = strataBillingUsage();
  assert.equal(usage.find((row) => row.label === "Monitors").percent, 82);
  assert.ok(usage.every((row) => row.percent >= 0 && row.percent <= 100));
  const lines = strataBillingUsageCsv().trim().split("\r\n");
  assert.equal(lines.length, 5);
  assert.equal(lines[0], "Metric,Used,Limit,Unit");
  assert.ok(lines.includes("API Calls,773500,1000000,"));
  assert.ok(lines.includes("Log Storage,38.2,100,GB"));
});

test("all six invoices serialize to actual PDF containers with correct cross-reference offsets", () => {
  assert.equal(STRATA_BILLING_INVOICES.length, 6);
  for (const invoice of STRATA_BILLING_INVOICES) {
    const pdf = strataInvoicePdf(invoice);
    assert.ok(pdf.startsWith("%PDF-1.4\n"));
    assert.ok(pdf.endsWith("%%EOF\n"));
    assert.ok(pdf.includes(invoice.id));
    assert.ok(pdf.includes("not a payment receipt"));
    const start = Number(pdf.match(/startxref\n(\d+)/)[1]);
    assert.equal(pdf.slice(start, start + 4), "xref");
    const entries = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)];
    assert.equal(entries.length, 5);
    for (const [index, entry] of entries.entries())
      assert.ok(pdf.slice(Number(entry[1])).startsWith(`${index + 1} 0 obj`));
    const stream = pdf.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);
    assert.equal(Number(stream[1]), Buffer.byteLength(stream[2]));
  }
});
