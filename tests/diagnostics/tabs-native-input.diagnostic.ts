import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// This probe supplements the original Tabs regression; it does not replace it.
// Both native input producers must cause real horizontal scrolling to pass.
const viewportSelector = '.template-gallery-controls > [data-slot="tabs"]';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

for (const producer of ["synthesizeScrollGesture", "dispatchTouchEvent"] as const) {
  test(`native gallery touch diagnostic: ${producer}`, async ({
    page,
    context,
    browser,
  }, testInfo) => {
    const errors: string[] = [];
    const commands: Array<Record<string, unknown>> = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./#/templates");
    const viewport = page.locator(viewportSelector);
    const tabs = viewport.getByRole("tab");
    await expect(tabs).toHaveCount(5);

    // Preserve the original case's keyboard/scroll prehistory in each fresh context.
    await tabs.first().focus();
    await tabs.first().press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("data-state", "active");
    await expect(page.getByText("2 templates", { exact: true })).toBeVisible();
    await tabs.last().press("Home");
    await expect(tabs.first()).toBeFocused();
    await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBe(0);
    await page.evaluate(() => document.fonts.ready);
    const bounds = (await viewport.boundingBox())!;
    const position = { x: bounds.width - 15, y: bounds.height / 2 };
    await viewport.click({ trial: true, position });

    const input = await viewport.evaluate((node, position) => {
      const bounds = node.getBoundingClientRect();
      const x = bounds.left + position.x;
      const y = bounds.top + position.y;
      const hit = document.elementFromPoint(x, y);
      return {
        x,
        y,
        hitsViewport: !!hit && node.contains(hit),
        insideViewport: x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom,
        scrollLeft: node.scrollLeft,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        overflowX: getComputedStyle(node).overflowX,
        pageY: scrollY,
      };
    }, position);
    expect(input.hitsViewport).toBe(true);
    expect(input.insideViewport).toBe(true);
    expect(input.scrollLeft).toBe(0);
    expect(input.scrollWidth).toBeGreaterThan(input.clientWidth);
    expect(input.overflowX).toBe("auto");
    expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);

    await page.evaluate((selector) => {
      const events: Array<Record<string, unknown>> = [];
      const describe = (target: EventTarget | null) => {
        if (!(target instanceof Element)) return String(target);
        return {
          tag: target.tagName,
          id: target.id,
          slot: target.getAttribute("data-slot"),
          role: target.getAttribute("role"),
          text: target.textContent?.slice(0, 100),
          connected: target.isConnected,
        };
      };
      const port = () => document.querySelector<HTMLElement>(selector)!;
      const snapshot = () => {
        const node = port();
        const bounds = node.getBoundingClientRect();
        const ancestors = [];
        for (let element: HTMLElement | null = node; element; element = element.parentElement) {
          const style = getComputedStyle(element);
          ancestors.push({
            target: describe(element),
            touchAction: style.touchAction,
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            overscrollBehaviorX: style.overscrollBehaviorX,
          });
        }
        return {
          scrollLeft: node.scrollLeft,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          bounds: bounds.toJSON(),
          pageX: scrollX,
          pageY: scrollY,
          activeElement: describe(document.activeElement),
          hit: describe(
            document.elementFromPoint(bounds.right - 15, bounds.top + bounds.height / 2),
          ),
          ancestors,
          fontsStatus: document.fonts.status,
          maxTouchPoints: navigator.maxTouchPoints,
          userAgent: navigator.userAgent,
          visualViewport: window.visualViewport && {
            width: visualViewport!.width,
            height: visualViewport!.height,
            scale: visualViewport!.scale,
            offsetLeft: visualViewport!.offsetLeft,
            offsetTop: visualViewport!.offsetTop,
          },
        };
      };
      Reflect.set(window, "nativeInputProbe", { events, snapshot, initial: snapshot() });
      for (const type of [
        "pointerdown",
        "pointermove",
        "pointerup",
        "pointercancel",
        "touchstart",
        "touchmove",
        "touchend",
        "touchcancel",
        "scroll",
        "focusin",
      ]) {
        document.addEventListener(
          type,
          (event) => {
            const touch =
              event instanceof TouchEvent ? event.touches[0] || event.changedTouches[0] : null;
            const pointer = event instanceof PointerEvent ? event : null;
            const x = touch?.clientX ?? pointer?.clientX;
            const y = touch?.clientY ?? pointer?.clientY;
            events.push({
              type,
              trusted: event.isTrusted,
              insideViewport: event.target instanceof Node && port().contains(event.target),
              target: describe(event.target),
              path: event.composedPath().slice(0, 8).map(describe),
              x,
              y,
              hit:
                x !== undefined && y !== undefined
                  ? describe(document.elementFromPoint(x, y))
                  : null,
              pointerType: pointer?.pointerType,
              pointerId: pointer?.pointerId,
              cancelable: event.cancelable,
              defaultPrevented: event.defaultPrevented,
              scrollLeft: port().scrollLeft,
              pageY: scrollY,
              time: performance.now(),
            });
          },
          { capture: true, passive: true },
        );
      }
    }, viewportSelector);

    const session = await context.newCDPSession(page);
    const version = await session.send("Browser.getVersion");
    try {
      if (producer === "synthesizeScrollGesture") {
        const params = {
          x: input.x,
          y: input.y,
          xDistance: -200,
          yDistance: 0,
          speed: 500,
          gestureSourceType: "touch",
        };
        commands.push({ method: "Input.synthesizeScrollGesture", params });
        await session.send("Input.synthesizeScrollGesture", params);
      } else {
        const start = { type: "touchStart", touchPoints: [{ x: input.x, y: input.y, id: 1 }] };
        commands.push({ method: "Input.dispatchTouchEvent", params: start });
        await session.send("Input.dispatchTouchEvent", start);
        await expect
          .poll(() =>
            page.evaluate(() =>
              Reflect.get(window, "nativeInputProbe").events.some(
                (event: Record<string, unknown>) =>
                  event.type === "touchstart" && event.trusted && event.insideViewport,
              ),
            ),
          )
          .toBe(true);
        for (let step = 1; step <= 12; step++) {
          const move = {
            type: "touchMove",
            touchPoints: [{ x: input.x - (200 * step) / 12, y: input.y, id: 1 }],
          };
          commands.push({ method: "Input.dispatchTouchEvent", params: move });
          await session.send("Input.dispatchTouchEvent", move);
          // A renderer frame acknowledgment per sampled position, not a fixed delay.
          await page.evaluate(
            () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
          );
        }
        const end = { type: "touchEnd", touchPoints: [] };
        commands.push({ method: "Input.dispatchTouchEvent", params: end });
        await session.send("Input.dispatchTouchEvent", end);
      }

      // Soft checks retain the final scrolling verdict even if event delivery differs.
      await expect.soft
        .poll(() =>
          page.evaluate(() =>
            Reflect.get(window, "nativeInputProbe").events.some(
              (event: Record<string, unknown>) =>
                event.type === "touchstart" && event.trusted && event.insideViewport,
            ),
          ),
        )
        .toBe(true);
      await expect.soft.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      expect.soft(await page.evaluate(() => scrollY)).toBe(input.pageY);
      expect.soft(errors).toEqual([]);
    } finally {
      const audit = await page.evaluate(() => {
        const probe = Reflect.get(window, "nativeInputProbe");
        return { initial: probe.initial, events: probe.events, final: probe.snapshot() };
      });
      const auditPath = testInfo.outputPath(`native-input-${producer}.json`);
      await mkdir(dirname(auditPath), { recursive: true });
      await writeFile(
        auditPath,
        JSON.stringify(
          { producer, input, commands, browserVersion: browser.version(), version, audit, errors },
          null,
          2,
        ),
      );
      await testInfo.attach(`native-input-${producer}`, {
        path: auditPath,
        contentType: "application/json",
      });
      await page.screenshot({ path: testInfo.outputPath(`native-input-${producer}.png`) });
      await session.detach();
    }
  });
}
