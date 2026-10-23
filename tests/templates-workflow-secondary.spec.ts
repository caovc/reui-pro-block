import { expect, test } from "@playwright/test";

test("Mesh reuses the document editor with editable Route Planner content, undo and outline", async ({
  page,
}) => {
  await page.goto("/#/template-preview/mesh");
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await expect(editor).toContainText("Route Planner Product Brief");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(" QA addition");
  await expect(editor).toContainText("QA addition");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).not.toContainText("QA addition");
  await expect(
    page.getByRole("navigation", { name: "Document outline", exact: true }),
  ).not.toContainText("QA addition");
  await page
    .getByRole("navigation", { name: "Document outline", exact: true })
    .getByRole("button", { name: /^Goals/ })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Document outline", exact: true })
      .getByRole("button", { name: "Open Questions", exact: true }),
  ).toBeVisible();
});

test("Existing standalone rich editor retains its default seed when no template content is passed", async ({
  page,
}) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
  await expect(
    page.getByRole("textbox", { name: "Rich text document", exact: true }),
  ).toContainText("Product design handbook");
});

test("Flux feature flags toggle independently, filter by stage and create a new flag", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Flags", exact: true }).click();
  const toggle = page.getByRole("switch", {
    name: "Enable Risk summary prompt canary",
    exact: true,
  });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Enable Provider fallback router", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Payment action guardrail", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Enable Risk summary prompt canary", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "New Flag", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("QA privacy review");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByLabel("Filter feature flags", { exact: true }).fill("QA privacy review");
  await expect(page.getByRole("button", { name: "QA privacy review", exact: true })).toBeVisible();
});

test("Tempo Analytics has its own cohorts and creates a segment instead of repeating Home", async ({
  page,
}) => {
  await page.goto("/#/template-preview/tempo");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByText("Activation Funnel", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Retained workspace segment mix", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New segment", exact: true }).click();
  await page.getByLabel("Segment name", { exact: true }).fill("QA activation cohort");
  await page.getByRole("button", { name: "Create segment", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "QA activation cohort", exact: true }),
  ).toBeVisible();
});

test("Echo Artifacts switches only its sidebar then opens and downloads the selected file", async ({
  page,
}) => {
  await page.goto("/#/template-preview/echo");
  await page.getByRole("button", { name: "Artifacts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "How can I help you?", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Recent artifacts", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "stripe-webhook.ts", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Artifact preview", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next artifact", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("churn-q3.csv");
  await page.getByRole("button", { name: "Close artifact preview", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Artifact preview", exact: true }),
  ).toHaveCount(0);
});
