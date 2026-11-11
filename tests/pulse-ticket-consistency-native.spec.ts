import { expect, test, type Locator, type Page } from "@playwright/test";

// Run with W1/R0/max-failures=1 and a fresh output directory. Prior failure
// screenshots/traces stay historical. Geometry here is a local acceptance check.
test.describe.configure({ mode: "serial", retries: 0 });
test.use({
  deviceScaleFactor: 1,
  colorScheme: "light",
  actionTimeout: 5000,
  trace: "retain-on-failure",
});

const faults = new WeakMap<Page, string[]>();
const nightlySubject = "Data export failed on 3 consecutive nightly runs";
const checkoutSubject = "Checkout fails with a card error the bank cannot see";

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) messages.push(message.text());
  });
});
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus || faults.get(page)?.length) {
    await page.screenshot({
      path: info.outputPath("first-failure-observed-v2.png"),
      fullPage: true,
    });
    await info.attach("page-text-observed-v2", {
      body: await page.locator("body").innerText(),
      contentType: "text/plain",
    });
  }
  expect(faults.get(page)).toEqual([]);
});

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running" || animation.pending).length,
      ),
    )
    .toBe(0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
async function openPulse(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/pulse");
  await expect(page.getByText("10 of 10 open escalations", { exact: true })).toBeVisible();
  await settle(page);
}
async function navigate(page: Page, width: number, name: string) {
  if (width === 390) {
    const trigger = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Sidebar", exact: true });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Search...", exact: true })).toBeFocused();
    await expect
      .poll(async () => Math.abs((await drawer.boundingBox())!.width - 390 * 0.75))
      .toBeLessThanOrEqual(0.75);
    await drawer.getByRole("button", { name, exact: true }).click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  } else {
    await page.getByRole("button", { name, exact: true }).first().click();
  }
}
function cards(page: Page) {
  return page.locator(".ct-ticket-card");
}
async function setPriority(page: Page, current: string, next: string) {
  await page.getByRole("button", { name: current, exact: true }).click();
  await page.getByRole("menuitem", { name: next, exact: true }).click();
}
async function openEditor(page: Page, details: Locator) {
  await details.getByRole("button", { name: "More ticket actions", exact: true }).click();
  // Edit is the explicit local More-menu extension; Reply stays the primary
  // observed footer action. This does not certify original editing behavior.
  await page.getByRole("menuitem", { name: "Edit ticket", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit ticket", exact: true });
  await expect(editor).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  return editor;
}
async function choose(page: Page, editor: Locator, label: string, option: string) {
  await editor.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

for (const width of [1440, 390]) {
  test(`Pulse ${width}: priority/query share Board/List and subject-named detail keeps Reply before edit/delete`, async ({
    page,
  }, info) => {
    await openPulse(page, width);
    await navigate(page, width, "Tickets");
    await expect(cards(page)).toHaveCount(18);
    await setPriority(page, "Filters", "Urgent");
    await expect(cards(page)).toHaveCount(2);
    await expect(cards(page).filter({ hasText: "TCK-4960" })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: "TCK-4972" })).toHaveCount(1);
    await expect(cards(page).filter({ hasText: "TCK-4979" })).toHaveCount(0);
    await page.getByRole("button", { name: "List view", exact: true }).click();
    await expect(page.getByText("2 of 18 tickets", { exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "TCK-" })).toHaveCount(2);
    const search = page.getByRole("textbox", { name: "Search tickets", exact: true });
    await search.fill("nightly");
    await expect(page.getByText("1 of 18 tickets", { exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "TCK-4960" })).toHaveCount(1);
    await page.getByRole("button", { name: "Board view", exact: true }).click();
    await expect(cards(page)).toHaveCount(1);
    await cards(page).filter({ hasText: "TCK-4960" }).click();
    const details = page.getByRole("dialog", { name: nightlySubject, exact: true });
    await expect(details).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(details).toContainText("TCK-4960");
    await details.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(page.getByText("Reply started", { exact: true })).toBeVisible();
    await expect(details).toBeVisible();
    await settle(page);
    await page.screenshot({ path: info.outputPath(`pulse-detail-${width}.png`), fullPage: true });
    const editor = await openEditor(page, details);
    const updated = "Nightly export reviewed by QA";
    await editor.getByRole("textbox", { name: "What is blocking it", exact: true }).fill(updated);
    await editor.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).filter({ hasText: "TCK-4960" })).toContainText(updated);
    await page.getByRole("button", { name: "List view", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "TCK-4960" });
    await expect(row).toHaveCount(1);
    await row.click();
    const updatedDetails = page.getByRole("dialog", { name: updated, exact: true });
    await expect(updatedDetails).toBeVisible();
    await updatedDetails.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(updatedDetails).toBeHidden();
    await expect(row).toHaveCount(0);
    await search.fill("");
    await expect(page.getByText("1 of 17 tickets", { exact: true })).toBeVisible();
    await setPriority(page, "Urgent", "All priorities");
    await expect(page.getByText("17 of 17 tickets", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Board view", exact: true }).click();
    await expect(cards(page)).toHaveCount(17);
    await expect(cards(page).filter({ hasText: "TCK-4960" })).toHaveCount(0);
    await navigate(page, width, "Dashboard");
    await expect(page.getByText("10 of 10 open escalations", { exact: true })).toBeVisible();
  });

  test(`Pulse ${width}: observed New ticket fields validate and create New TCK-5039 in both views only`, async ({
    page,
  }, info) => {
    await openPulse(page, width);
    await navigate(page, width, "Tickets");
    await page.getByRole("button", { name: "New ticket", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "New ticket", exact: true });
    await expect(editor).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const form = editor.locator("form");
    const subject = editor.getByRole("textbox", { name: "What happened", exact: true });
    const requester = editor.getByRole("textbox", { name: "Reported by", exact: true });
    const customer = editor.getByRole("textbox", { name: "Account", exact: true });
    const priority = editor.getByRole("combobox", { name: "Priority", exact: true });
    await expect(subject).toBeVisible();
    await expect(requester).toBeVisible();
    await expect(customer).toBeVisible();
    await expect(priority).toHaveText("Normal");
    const nativeFields = await form.evaluate((element) => {
      const nativeForm = element as HTMLFormElement;
      return ["subject", "requester", "customer", "queue", "priority", "agent"].map((name) => {
        const control = nativeForm.elements.namedItem(name);
        if (
          !(
            control instanceof HTMLInputElement ||
            control instanceof HTMLTextAreaElement ||
            control instanceof HTMLSelectElement
          )
        )
          throw new Error(`Missing native form control: ${name}`);
        return { name, required: control.required, valueMissing: control.validity.valueMissing };
      });
    });
    expect(nativeFields.map(({ name }) => name)).toEqual([
      "subject",
      "requester",
      "customer",
      "queue",
      "priority",
      "agent",
    ]);
    expect(nativeFields.every(({ required }) => required)).toBe(true);
    expect(nativeFields.find(({ name }) => name === "priority")?.valueMissing).toBe(false);
    await editor.getByRole("button", { name: "Create ticket", exact: true }).click();
    await expect(editor).toBeVisible();
    await expect(subject).toBeFocused();
    expect(
      await subject.evaluate((control) => (control as HTMLTextAreaElement).validity.valueMissing),
    ).toBe(true);
    const title = `Native create ticket ${width}`;
    await subject.fill(title);
    await requester.fill("QA Example");
    await customer.fill("Bricklane Local");
    await choose(page, editor, "Queue", "Billing");
    await priority.click();
    for (const option of ["Low", "Normal", "High", "Urgent"])
      await expect(page.getByRole("option", { name: option, exact: true })).toBeVisible();
    await page.getByRole("option", { name: "Normal", exact: true }).click();
    await choose(page, editor, "Assign to", "Priya Patel");
    await settle(page);
    const geometry = {
      dialog: await editor.boundingBox(),
      form: await form.boundingBox(),
      fieldGroup: await form.locator(':scope > [data-slot="field-group"]').boundingBox(),
      header: await editor.locator(".ct-sheet-heading").boundingBox(),
      subjectLabel: await editor
        .locator('label[for="pulse-new-ticket-form-subject"]')
        .boundingBox(),
      subject: await subject.boundingBox(),
      requester: await requester.boundingBox(),
      customer: await customer.boundingBox(),
      footer: await editor.locator(".ct-sheet-footer").boundingBox(),
      cancel: await editor.getByRole("button", { name: "Cancel", exact: true }).boundingBox(),
      submit: await editor
        .getByRole("button", { name: "Create ticket", exact: true })
        .boundingBox(),
      dialogBorders: await editor.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          left: Number.parseFloat(style.borderLeftWidth),
          right: Number.parseFloat(style.borderRightWidth),
        };
      }),
    };
    // Current shared Sheet has border:0. Measure from its actual outer box,
    // not a guessed text baseline or an injected style/scroll position.
    expect(geometry.dialogBorders).toEqual({ left: 0, right: 0 });
    expect(Math.abs(geometry.subject!.x - geometry.dialog!.x - 20)).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(
        geometry.dialog!.x +
          geometry.dialog!.width -
          geometry.subject!.x -
          geometry.subject!.width -
          20,
      ),
    ).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(geometry.subjectLabel!.y - geometry.header!.y - geometry.header!.height - 20),
    ).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.form!.x - geometry.dialog!.x)).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.form!.width - geometry.dialog!.width)).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.fieldGroup!.x - geometry.subject!.x)).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.fieldGroup!.width - geometry.subject!.width)).toBeLessThanOrEqual(
      0.75,
    );
    expect(geometry.subject!.height).toBeGreaterThanOrEqual(64);
    expect(Math.abs(geometry.requester!.y - geometry.customer!.y)).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.requester!.width - geometry.customer!.width)).toBeLessThanOrEqual(
      0.75,
    );
    expect(
      Math.abs(geometry.customer!.x - geometry.requester!.x - geometry.requester!.width - 16),
    ).toBeLessThanOrEqual(0.75);
    expect(geometry.requester!.x + geometry.requester!.width).toBeLessThan(geometry.customer!.x);
    expect(geometry.customer!.x + geometry.customer!.width).toBeLessThanOrEqual(
      geometry.dialog!.x + geometry.dialog!.width,
    );
    expect(
      Math.abs(
        geometry.dialog!.x +
          geometry.dialog!.width -
          geometry.submit!.x -
          geometry.submit!.width -
          20,
      ),
    ).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(geometry.submit!.x - geometry.cancel!.x - geometry.cancel!.width - 8),
    ).toBeLessThanOrEqual(0.75);
    expect(Math.abs(geometry.cancel!.y - geometry.submit!.y)).toBeLessThanOrEqual(0.75);
    await info.attach(`new-ticket-geometry-${width}`, {
      body: JSON.stringify(geometry, null, 2),
      contentType: "application/json",
    });
    await page.screenshot({
      path: info.outputPath(`pulse-new-ticket-${width}.png`),
      fullPage: true,
    });
    await editor.getByRole("button", { name: "Create ticket", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(cards(page)).toHaveCount(19);
    const created = cards(page).filter({ hasText: "TCK-5039" });
    await expect(created).toHaveCount(1);
    await expect(created).toContainText(title);
    await expect(created).toContainText("Normal");
    await expect(
      page.locator(".ct-board-col").filter({ has: created }).getByRole("heading"),
    ).toHaveText(/^New\s+4$/);
    await page.getByRole("button", { name: "List view", exact: true }).click();
    await expect(page.getByText("19 of 19 tickets", { exact: true })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "TCK-5039" })).toHaveCount(1);
    await page.getByRole("button", { name: "Board view", exact: true }).click();
    await expect(cards(page)).toHaveCount(19);
    await navigate(page, width, "Dashboard");
    await expect(page.getByText("10 of 10 open escalations", { exact: true })).toBeVisible();
  });
}

test("Pulse desktop selection stays in its collection and a renamed Board key is unique with selection cleared", async ({
  page,
}, info) => {
  await openPulse(page, 1440);
  await page.getByRole("checkbox", { name: "Select TCK-4863", exact: true }).check();
  await navigate(page, 1440, "Tickets");
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  for (const name of ["Delete selected", "Mark resolved"])
    await expect(page.getByRole("menuitem", { name, exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  const search = page.getByRole("textbox", { name: "Search tickets", exact: true });
  await search.fill("TCK-5012");
  await page.getByRole("checkbox", { name: "Select TCK-5012", exact: true }).check();
  await page.getByRole("button", { name: "Open TCK-5012", exact: true }).click();
  const details = page.getByRole("dialog", { name: checkoutSubject, exact: true });
  await expect(details).toBeVisible();
  const editor = await openEditor(page, details);
  await editor.getByLabel("Ticket key", { exact: true }).fill("TCK-QA-RENAMED");
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(editor).toBeHidden();
  await search.fill("TCK-QA-RENAMED");
  await expect(page.getByRole("row").filter({ hasText: "TCK-QA-RENAMED" })).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", { name: "Select TCK-QA-RENAMED", exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  for (const name of ["Delete selected", "Mark resolved"])
    await expect(page.getByRole("menuitem", { name, exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await search.fill("");
  await page.getByRole("button", { name: "Board view", exact: true }).click();
  await expect(cards(page)).toHaveCount(18);
  await expect(cards(page).filter({ hasText: "TCK-5012" })).toHaveCount(0);
  await expect(cards(page).filter({ hasText: "TCK-QA-RENAMED" })).toHaveCount(1);
  await settle(page);
  await page.screenshot({ path: info.outputPath("pulse-renamed-board-1440.png"), fullPage: true });
  await navigate(page, 1440, "Dashboard");
  await expect(page.getByText("10 of 10 open escalations", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Select TCK-4863", exact: true }),
  ).not.toBeChecked();
});

test("Pulse desktop Dashboard duplicate key uses native validity and corrected escalation stays out of Board", async ({
  page,
}, info) => {
  await openPulse(page, 1440);
  await page.getByRole("button", { name: "New escalation", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "New escalation", exact: true });
  await expect(editor).toBeVisible();
  const key = editor.getByLabel("Ticket key", { exact: true });
  await key.fill("TCK-5012");
  await editor.getByLabel("Requester", { exact: true }).fill("QA Escalation Company");
  await editor.getByLabel("Assignee", { exact: true }).fill("QA Local Agent");
  await editor
    .getByRole("textbox", { name: "What is blocking it", exact: true })
    .fill("Dashboard-only escalation from QA");
  await choose(page, editor, "SLA state", "On Time");
  await choose(page, editor, "Queue", "Billing");
  await editor.getByRole("button", { name: "Raise escalation", exact: true }).click();
  await expect(key).toHaveJSProperty("validationMessage", "A ticket with this key already exists.");
  expect(await key.evaluate((control) => (control as HTMLInputElement).validity.customError)).toBe(
    true,
  );
  await expect(editor).toBeVisible();
  await key.fill("TCK-QA-ESCALATION");
  await expect(key).toHaveJSProperty("validationMessage", "");
  expect(await key.evaluate((control) => (control as HTMLInputElement).validity.valid)).toBe(true);
  await editor.getByRole("button", { name: "Raise escalation", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByText("11 of 11 open escalations", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "TCK-QA-ESCALATION" })).toHaveCount(1);
  await navigate(page, 1440, "Tickets");
  await expect(cards(page)).toHaveCount(18);
  await expect(cards(page).filter({ hasText: "TCK-QA-ESCALATION" })).toHaveCount(0);
  await expect(cards(page).filter({ hasText: "TCK-5012" })).toHaveCount(1);
  await settle(page);
  await page.screenshot({
    path: info.outputPath("pulse-board-after-escalation-1440.png"),
    fullPage: true,
  });
});
