import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const moduleURL = new URL("../src/foundations/base/ui/overlay-compat.tsx", import.meta.url);
const imports = new Map([
  [
    "@/components/ui/motion-policy",
    new URL("../src/components/ui/motion-policy.ts", import.meta.url),
  ],
  ["@/lib/utils", new URL("../src/lib/utils.ts", import.meta.url)],
]);

// Load the actual TSX module, as the existing tooling tests transpile real source.
// React, motion policy and utilities remain their real installed/source dependencies.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = context.parentURL === moduleURL.href && imports.get(specifier);
    return nextResolve(resolved ? resolved.href : specifier, context);
  },
  load(url, context, nextLoad) {
    if (url !== moduleURL.href) return nextLoad(url, context);
    const output = ts.transpileModule(readFileSync(moduleURL, "utf8"), {
      fileName: moduleURL.pathname,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
      reportDiagnostics: true,
    });
    assert.equal(
      output.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length,
      0,
      "The actual overlay compatibility module must transpile",
    );
    return { format: "module", source: output.outputText, shortCircuit: true };
  },
});
let shouldCancelOverlayDismiss;
try {
  ({ shouldCancelOverlayDismiss } = await import(moduleURL.href));
} finally {
  hooks.deregister();
}

function escapeEvent() {
  const event = new Event("keydown", { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    key: { value: "Escape" },
    ctrlKey: { value: true },
  });
  return event;
}

test("Escape dismisses normally without an Escape callback", () => {
  for (const handlers of [undefined, {}, { onFocusOutside() {} }]) {
    const event = escapeEvent();
    assert.equal(shouldCancelOverlayDismiss({ reason: "escape-key", event }, handlers), false);
    assert.equal(event.defaultPrevented, false);
  }
});

test("a disabled option's pre-prevented Escape does not cancel dismissal through empty handlers", () => {
  for (const handlers of [undefined, {}, { onPointerDownOutside() {} }]) {
    const event = escapeEvent();
    event.preventDefault();
    assert.equal(shouldCancelOverlayDismiss({ reason: "escape-key", event }, handlers), false);
    assert.equal(event.defaultPrevented, true, "Native prevention is preserved, not reset");
  }
});

test("explicit Escape prevention cancels dismissal with the original event identity and fields", () => {
  const target = new EventTarget();
  const event = escapeEvent();
  let canceled;
  target.addEventListener("keydown", (dispatched) => {
    canceled = shouldCancelOverlayDismiss(
      { reason: "escape-key", event: dispatched },
      {
        onEscapeKeyDown(received) {
          assert.equal(received, event);
          assert.equal(received.target, target);
          assert.equal(received.currentTarget, target);
          assert.equal(received.key, "Escape");
          assert.equal(received.ctrlKey, true);
          assert.equal(received.bubbles, true);
          assert.equal(received.cancelable, true);
          received.preventDefault();
        },
      },
    );
  });
  assert.equal(target.dispatchEvent(event), false);
  assert.equal(canceled, true);
  assert.equal(event.defaultPrevented, true);
});

test("an Escape callback can stop propagation without canceling normal dismissal", () => {
  const event = escapeEvent();
  assert.equal(
    shouldCancelOverlayDismiss(
      { reason: "escape-key", event },
      {
        onEscapeKeyDown(received) {
          assert.equal(received, event);
          received.stopPropagation();
        },
      },
    ),
    false,
  );
  assert.equal(event.cancelBubble, true);
  assert.equal(event.defaultPrevented, false);
});

test("an explicit Escape callback retains the existing pre-prevented event cancellation contract", () => {
  const event = escapeEvent();
  event.preventDefault();
  let called = false;
  assert.equal(
    shouldCancelOverlayDismiss(
      { reason: "escape-key", event },
      {
        onEscapeKeyDown(received) {
          called = true;
          assert.equal(received, event);
          assert.equal(received.defaultPrevented, true);
        },
      },
    ),
    true,
  );
  assert.equal(called, true);
});

for (const [reason, handler, type] of [
  ["outside-press", "onPointerDownOutside", "dismissableLayer.pointerDownOutside"],
  ["focus-out", "onFocusOutside", "dismissableLayer.focusOutside"],
]) {
  test(`${reason} retains independent synthetic cancellation and the original native event`, () => {
    const event = new Event(reason, { cancelable: true });
    event.preventDefault();
    let specific;
    let interaction;
    assert.equal(
      shouldCancelOverlayDismiss(
        { reason, event },
        {
          [handler](received) {
            specific = received;
            assert.equal(received.type, type);
            assert.equal(received.cancelable, true);
            assert.equal(received.defaultPrevented, false);
            assert.equal(received.detail.originalEvent, event);
          },
          onInteractOutside(received) {
            interaction = received;
          },
        },
      ),
      false,
    );
    assert.equal(specific, interaction);
    assert.equal(event.defaultPrevented, true);

    assert.equal(
      shouldCancelOverlayDismiss(
        { reason, event },
        {
          [handler](received) {
            received.preventDefault();
          },
          onInteractOutside(received) {
            assert.equal(received.defaultPrevented, true);
            assert.equal(received.detail.originalEvent, event);
          },
        },
      ),
      true,
    );
    assert.equal(
      shouldCancelOverlayDismiss(
        { reason, event },
        { onInteractOutside: (received) => received.preventDefault() },
      ),
      true,
    );
  });
}
