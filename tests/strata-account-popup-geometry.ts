import { expect, type Locator } from "@playwright/test";

export type Box = {
  x: number;
  y: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export function insideWithClearance(inner: Box, outer: Box, clearance: number, label: string) {
  expect(inner.x, `${label}: left clearance`).toBeGreaterThanOrEqual(outer.x + clearance - 0.75);
  expect(inner.y, `${label}: top clearance`).toBeGreaterThanOrEqual(outer.y + clearance - 0.75);
  expect(inner.right, `${label}: right clearance`).toBeLessThanOrEqual(
    outer.right - clearance + 0.75,
  );
  expect(inner.bottom, `${label}: bottom clearance`).toBeLessThanOrEqual(
    outer.bottom - clearance + 0.75,
  );
}

export async function accountPopupGeometry(menu: Locator) {
  return menu.evaluate((element) => {
    const box = (node: Element | DOMRect) => {
      const rect = node instanceof Element ? node.getBoundingClientRect() : node;
      return {
        x: rect.x,
        y: rect.y,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const pointHits = (node: Element, x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return hit !== null && (hit === node || node.contains(hit));
    };
    const textBox = (node: Element) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return box(range.getBoundingClientRect());
    };
    const email = element.querySelector<HTMLElement>(".strata-account-summary small")!;
    const emailBox = email.getBoundingClientRect();
    const controls = [
      ...element.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [data-slot="toggle-group-item"]',
      ),
    ];
    return {
      menu: box(element),
      viewport: {
        x: 0,
        y: 0,
        right: innerWidth,
        bottom: innerHeight,
        width: innerWidth,
        height: innerHeight,
      },
      documentWidth: document.documentElement.scrollWidth,
      email: {
        text: email.textContent,
        box: box(emailBox),
        textBox: textBox(email),
        clientWidth: email.clientWidth,
        scrollWidth: email.scrollWidth,
        centerHitsSelf: pointHits(
          email,
          emailBox.x + emailBox.width / 2,
          emailBox.y + emailBox.height / 2,
        ),
      },
      controls: controls.map((control) => {
        const rect = control.getBoundingClientRect();
        const icon = control.querySelector("svg");
        const iconRect = icon?.getBoundingClientRect();
        return {
          label: control.getAttribute("aria-label") ?? control.textContent?.trim(),
          role: control.getAttribute("role"),
          slot: control.getAttribute("data-slot"),
          box: box(rect),
          icon: iconRect ? box(iconRect) : null,
          centerHitsSelf: pointHits(control, rect.x + rect.width / 2, rect.y + rect.height / 2),
          iconHitsSelf: iconRect
            ? pointHits(control, iconRect.x + iconRect.width / 2, iconRect.y + iconRect.height / 2)
            : null,
          computed: {
            width: getComputedStyle(control).width,
            height: getComputedStyle(control).height,
            minWidth: getComputedStyle(control).minWidth,
          },
        };
      }),
    };
  });
}

export function expectAccountPopupReachable(
  geometry: Awaited<ReturnType<typeof accountPopupGeometry>>,
) {
  insideWithClearance(geometry.menu, geometry.viewport, 8, "Account popup");
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport.width);
  insideWithClearance(geometry.email.box, geometry.menu, 0, "Account email element");
  insideWithClearance(geometry.email.textBox, geometry.email.box, 0, "Account email text");
  expect(geometry.email.scrollWidth).toBeLessThanOrEqual(geometry.email.clientWidth + 0.75);
  expect(geometry.email.centerHitsSelf, "Account email is visible at its actual center").toBe(true);
  expect(geometry.controls.filter((control) => control.role === "menuitem")).toHaveLength(7);
  expect(geometry.controls.filter((control) => control.slot === "toggle-group-item")).toHaveLength(
    3,
  );
  for (const control of geometry.controls) {
    insideWithClearance(control.box, geometry.menu, 0, `${control.label} inside popup`);
    insideWithClearance(control.box, geometry.viewport, 0, `${control.label} inside viewport`);
    expect(control.centerHitsSelf, `${control.label} center hits its own control`).toBe(true);
    if (control.icon) {
      insideWithClearance(control.icon, control.box, 0, `${control.label} icon inside control`);
      expect(control.iconHitsSelf, `${control.label} icon hits its own control`).toBe(true);
    }
  }
}
