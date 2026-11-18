import { test, type Page } from "@playwright/test";

type Evidence = { origin: number; rows: unknown[][]; dropped: number };
type Observed = Window & { __handoverEvidence?: Evidence };
const active = new WeakMap<Page, string[]>();
const prefix = "::notice title=Hand Over passive evidence::";
const affected = (title: string) =>
  /^base (sera|rhea): product Field, Select and native overlays$/.test(title);

export async function armHandoverFailureObserver(page: Page) {
  if (!affected(test.info().title)) return;
  if (process.env.GITHUB_ACTIONS !== "true" && process.env.HANDOVER_OBSERVER_VERIFY !== "1") return;
  const navigation: string[] = [];
  active.set(page, navigation);
  page.on("framenavigated", (frame) => {
    if (frame.parentFrame()) navigation.push(`navigate:${frame.url().split("?")[0]}`);
  });
  page.on("framedetached", (frame) => navigation.push(`detach:${frame.url().split("?")[0]}`));
  const frame = page.frameLocator('iframe[title$=" live preview"]');
  await frame.locator("html").evaluate(() => {
    const evidence: Evidence = { origin: performance.timeOrigin, rows: [], dropped: 0 };
    (window.top as Observed).__handoverEvidence = evidence;
    const ids = new WeakMap<Element, number>();
    let next = 1;
    let escaped = 0;
    const identify = (value: EventTarget | null): string => {
      if (!(value instanceof Element)) return "-";
      if (!ids.has(value)) ids.set(value, next++);
      const label = value.closest("button")?.getAttribute("aria-label");
      const kind = label ?? value.getAttribute("data-slot") ?? value.tagName;
      return `${kind.slice(0, 2)}#${ids.get(value)}`;
    };
    const selector = '[data-slot="sheet-content"], [data-slot="dialog-content"]';
    const record = (kind: string, event?: Event, changes: string[] = []) => {
      const start = performance.now();
      if (event instanceof KeyboardEvent && event.key === "Escape" && event.type === "keydown")
        escaped ||= start;
      if (!escaped) return;
      const mouse = event instanceof MouseEvent ? event : null;
      const hit = mouse ? document.elementFromPoint(mouse.clientX, mouse.clientY) : null;
      const popups = [...document.querySelectorAll(selector)].map((node) => [
        identify(node),
        node.hasAttribute("data-open"),
        !!node.closest('[inert],[aria-hidden="true"],[hidden]'),
        identify(node.closest("[data-base-ui-portal]")),
      ]);
      const row: unknown[] = [Math.round(start - escaped), kind, event?.isTrusted];
      row.push(
        ...[event?.target ?? null, hit, document.activeElement].map(identify),
        popups,
        changes,
      );
      evidence.rows.push(row);
      if (evidence.rows.length > 32) {
        evidence.rows.shift();
        evidence.dropped++;
      }
    };
    for (const type of ["keydown", "keyup", "focusin", "pointerdown", "click"]) {
      const listener = (event: Event) => {
        if (event instanceof KeyboardEvent && event.key !== "Escape") return;
        record(type, event);
      };
      document.addEventListener(type, listener, { capture: true, passive: true });
    }
    new MutationObserver((entries) => {
      const changes = entries
        .filter((entry) => entry.target instanceof Element && entry.target.matches(selector))
        .map((item) => `${identify(item.target)}:${item.attributeName}:${item.oldValue ?? "null"}`);
      record("mutation", undefined, changes.slice(-4));
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-open", "data-state", "inert", "aria-hidden", "hidden"],
    });
    window.addEventListener("pagehide", () => record("pagehide"), { passive: true });
  });
}

export function handoverNotice(data: Evidence | null, nav: string[], origin: number | null) {
  const rows = data?.rows ?? [];
  const trusted = rows.filter((row) => row[2]).map((row) => row[1]);
  const summary = {
    valid: trusted.includes("keyup") && trusted.includes("pointerdown"),
    remounted: origin !== data?.origin,
    nav: nav.slice(-4),
    dropped: data?.dropped,
    rows: [...rows],
  };
  const encode = () =>
    prefix +
    JSON.stringify(summary).replaceAll("%", "%25").replaceAll("\n", "%0A").replaceAll("\r", "%0D");
  while (Buffer.byteLength(encode()) >= 2048 && summary.rows.length > 4) summary.rows.splice(1, 1);
  return Buffer.byteLength(encode()) < 2048
    ? encode()
    : prefix + '{"collectorError":"notice exceeded budget"}';
}

test.afterEach(async ({ page }, info) => {
  if (!active.has(page)) return;
  const failed = info.status !== info.expectedStatus;
  if (!failed && process.env.HANDOVER_OBSERVER_VERIFY !== "1") return;
  try {
    const evidence = await page.evaluate(() => (window as Observed).__handoverEvidence ?? null);
    const frame = page.frames().find((value) => value.parentFrame());
    const origin = frame ? await frame.evaluate(() => performance.timeOrigin) : null;
    const navigation = active.get(page) ?? [];
    const body = JSON.stringify({ evidence, navigation, origin });
    await info.attach("handover-passive-evidence", { body, contentType: "application/json" });
    const notice = handoverNotice(evidence, navigation, origin);
    if (failed && process.env.GITHUB_ACTIONS === "true") console.log(notice);
  } catch {
    if (failed && process.env.GITHUB_ACTIONS === "true")
      console.log(prefix + '{"collectorError":"document unavailable"}');
  }
});
