import { expect, type Locator, type Page } from "@playwright/test";

export async function selectedTabGeometry(tab: Locator) {
  return tab.evaluate((element) => {
    const box = (rect: DOMRect) => ({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    const rect = element.getBoundingClientRect();
    const list = element.closest<HTMLElement>('[role="tablist"]')!;
    const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textBoxes = [];
    let node: Node | null;
    while ((node = text.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      textBoxes.push(box(range.getBoundingClientRect()));
    }
    const clips = [];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor);
      const x = /^(auto|scroll|hidden|clip)$/.test(css.overflowX);
      const y = /^(auto|scroll|hidden|clip)$/.test(css.overflowY);
      if (!x && !y) continue;
      const bounds = ancestor.getBoundingClientRect();
      const left = bounds.left + ancestor.clientLeft;
      const top = bounds.top + ancestor.clientTop;
      clips.push({
        slot: ancestor.getAttribute("data-slot"),
        className: ancestor.className,
        x,
        y,
        left,
        right: left + ancestor.clientWidth,
        top,
        bottom: top + ancestor.clientHeight,
      });
    }
    const css = getComputedStyle(element);
    const points = [
      { x: rect.left + 2, y: rect.top + rect.height / 2 },
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      { x: rect.right - 2, y: rect.top + rect.height / 2 },
    ];
    return {
      text: element.textContent?.trim(),
      selected: element.getAttribute("aria-selected"),
      slot: element.getAttribute("data-slot"),
      rect: box(rect),
      textBoxes,
      clips,
      points: points.map((point) => {
        const hit = document.elementFromPoint(point.x, point.y);
        return { ...point, hitsSelf: hit !== null && (hit === element || element.contains(hit)) };
      }),
      focused: document.activeElement === element,
      focusVisible: element.matches(":focus-visible"),
      outline: {
        width: parseFloat(css.outlineWidth),
        offset: parseFloat(css.outlineOffset),
        style: css.outlineStyle,
        color: css.outlineColor,
      },
      scrollport: {
        left: list.scrollLeft,
        top: list.scrollTop,
        clientWidth: list.clientWidth,
        scrollWidth: list.scrollWidth,
        clientHeight: list.clientHeight,
        scrollHeight: list.scrollHeight,
      },
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
    };
  });
}

export function expectSelectedTabContained(
  geometry: Awaited<ReturnType<typeof selectedTabGeometry>>,
) {
  expect(geometry.slot).toBe("tabs-trigger");
  expect(geometry.selected).toBe("true");
  expect(geometry.textBoxes).toHaveLength(1);
  expect(geometry.documentWidth).toBeLessThanOrEqual(390);
  expect(geometry.scrollport.scrollWidth).toBeGreaterThan(geometry.scrollport.clientWidth);
  expect(geometry.scrollport.scrollHeight).toBeLessThanOrEqual(geometry.scrollport.clientHeight);
  expect(geometry.scrollport.top).toBe(0);
  for (const rect of [geometry.rect, ...geometry.textBoxes]) {
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(geometry.viewport.width);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeLessThanOrEqual(geometry.viewport.height);
    for (const clip of geometry.clips) {
      if (clip.x) {
        expect(rect.left, `${geometry.text} left inside ${clip.className}`).toBeGreaterThanOrEqual(
          clip.left - 0.75,
        );
        expect(rect.right, `${geometry.text} right inside ${clip.className}`).toBeLessThanOrEqual(
          clip.right + 0.75,
        );
      }
      if (clip.y) {
        expect(rect.top).toBeGreaterThanOrEqual(clip.top - 0.75);
        expect(rect.bottom).toBeLessThanOrEqual(clip.bottom + 0.75);
      }
    }
  }
  expect(geometry.points.map((point) => point.hitsSelf)).toEqual([true, true, true]);
}

export function expectSelectedTabKeyboardFocus(
  geometry: Awaited<ReturnType<typeof selectedTabGeometry>>,
) {
  expectSelectedTabContained(geometry);
  expect(geometry.focused).toBe(true);
  expect(geometry.focusVisible).toBe(true);
  expect(geometry.outline.style).not.toBe("none");
  expect(geometry.outline.width).toBeGreaterThanOrEqual(1);
  expect(geometry.outline.offset).toBeLessThanOrEqual(-geometry.outline.width);
  expect(geometry.outline.color).not.toBe("transparent");
  expect(geometry.outline.color).not.toBe("rgba(0, 0, 0, 0)");
}

export async function verticalPositions(page: Page) {
  return page.evaluate(() => ({
    window: scrollY,
    document: document.scrollingElement?.scrollTop ?? 0,
    gallery: document.querySelector<HTMLElement>(".template-surface")?.scrollTop ?? 0,
    page: document.querySelector<HTMLElement>(".strata-page-scroll")!.scrollTop,
    settings: document.querySelector<HTMLElement>(".strata-settings-content")?.scrollTop ?? 0,
    navigation: document.querySelector<HTMLElement>(".strata-settings-navigation")?.scrollTop ?? 0,
  }));
}
