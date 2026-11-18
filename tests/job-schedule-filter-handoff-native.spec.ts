import { expect, test } from "@playwright/test";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({
  viewport: { width: 1440, height: 1000 },
  actionTimeout: 5000,
  trace: "on",
});

test("Base Job filters retain the direct menu during an immediate generic-value handoff", async ({
  page,
}) => {
  await page.goto("./base/#/preview/data-grid/advanced/data-grid-advanced-22");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", "base");
  const frame = page.getByRole("region", { name: "Job schedule", exact: true });
  await expect(frame.getByRole("heading", { name: "Job Schedule", exact: true })).toBeVisible();
  const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
  const attention = frame.getByRole("region", { name: "Schedule attention", exact: true });
  const attentionBefore = await attention.innerText();
  const crewBefore = await frame.locator("tfoot").innerText();
  await frame.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("option", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "is", exact: true }).click();
  const late = page.getByRole("option", { name: "Late", exact: true });
  await expect(late).toBeVisible();
  const lateBox = await late.boundingBox();
  const showBox = await show.boundingBox();
  if (!lateBox || !showBox) throw new Error("Visible controls must expose native pointer bounds");
  // Use actual control centers so locator auto-waiting does not serialize the
  // old popup's exit before the user's next pointer action.
  await page.mouse.click(lateBox.x + lateBox.width / 2, lateBox.y + lateBox.height / 2);
  await page.mouse.click(showBox.x + showBox.width / 2, showBox.y + showBox.height / 2);
  await page.getByRole("option", { name: /^Lost Days(?:\s+\d+)?$/ }).click();
  await expect(show).toHaveAttribute("aria-expanded", "false");
  await expect(show).toBeFocused();
  await expect(show).toContainText("Lost Days");
  await expect(frame.locator("table tbody tr[data-row-id]")).toHaveCount(1);
  await expect(frame.getByRole("button", { name: "Dawson Exterior", exact: true })).toBeVisible();
  await expect(attention).toHaveText(attentionBefore, { useInnerText: true });
  await expect(frame.locator("tfoot")).toHaveText(crewBefore, { useInnerText: true });
  await frame.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(show).toHaveText("All Jobs");
  await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
  await expect(attention).toHaveText(attentionBefore, { useInnerText: true });
  await expect(frame.locator("tfoot")).toHaveText(crewBefore, { useInnerText: true });
});
