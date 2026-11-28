import { expect, test } from "@playwright/test";

for (const foundation of ["radix", "base"] as const) {
  test(`Roster ${foundation} Time links preserve their destination in new tabs and the collapsed menu`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const mount = "#/template-preview/roster";
    const query = "?routeProof=keep%2Bbytes";
    await page.goto(`${foundation === "base" ? "./base/" : "./"}${mount}${query}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", foundation);
    const time = page.getByRole("button", { name: "Time", exact: true });
    await time.press("Enter");
    const sidebar = page.locator('.ct-layout-body > [data-slot="sidebar"]');
    const leave = sidebar.getByRole("link", { name: "Time off", exact: true });
    const timesheets = sidebar.getByRole("link", { name: "Timesheets", exact: true });
    await expect(leave).toHaveAttribute("href", `${mount}/time/time-off${query}`);
    await expect(timesheets).toHaveAttribute("href", `${mount}/time/timesheets${query}`);

    const opened = context.waitForEvent("page");
    await leave.click({ modifiers: ["Control"] });
    const secondTab = await opened;
    await expect(secondTab).toHaveURL(new URL(`${mount}/time/time-off${query}`, page.url()).href);
    await expect(secondTab.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
    await expect(secondTab.locator("html")).toHaveAttribute("data-ui-primitive", foundation);
    await secondTab.close();
    await expect(page.getByText("Workforce overview", { exact: true })).toBeVisible();

    await timesheets.press("Enter");
    await expect(timesheets).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Control+b");
    await time.press("Enter");
    const menuLeave = page.getByRole("menuitem", { name: "Time off", exact: true });
    await expect(menuLeave).toHaveAttribute("href", `${mount}/time/time-off${query}`);
    await menuLeave.press("Enter");
    await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
  });
}
