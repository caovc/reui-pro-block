# Checklist CI: wait for native accordion input readiness

## Failure and evidence

The preserved CI run **40266050417** at `5c6df66` had 1165 passing tests and one failure in `tests/dialog-first-run.spec.ts`: the checklist connection/manage case. Connect reported a successful pointer action, but Manage Google Calendar never appeared before the original 30-second case deadline. A later local pass alone does not explain or erase that failure.

The original artifact 12627475041 remains at `/tmp/bricklane-settings-ci-diagnostics/dialog-first-run-checklist-96448-al-connection-manage-states/trace.zip`, with its `error-context.md` and `/tmp/bricklane-settings-ci-failure.log` unchanged. Relevant actions are extracted into `/tmp/bricklane-checklist-ci-audit/original-trace-actions.json`.

| Original trace event                 |  Time (ms) |
| ------------------------------------ | ---------: |
| Connected apps click finishes        | 325076.259 |
| Connect actionability reports stable | 325141.501 |
| Connect action snapshot              | 325148.708 |
| Connect click finishes               | 325156.338 |
| Manage click reaches test deadline   | 353968.424 |

The Connect input point was `(859, 481.99)`, using button box `(822, 467.992, 74, 28)`. This followed the section switch by approximately 80 ms, while native `accordion-up` and `accordion-down` animations have 200 ms durations. Screencast frames `/tmp/checklist-ci-frame-325140.314.jpeg` and `/tmp/checklist-ci-frame-325187.79.jpeg` show the outgoing identity content still painted and the opening apps content clipped during the transition. The post-click snapshot still contains Connect Google Calendar. These are observations of the original failure; exact event dispatch inside the historical browser cannot be recovered from a screenshot alone.

CodeGraph was consulted before reading/editing code. `ChecklistDialog` changes `apps[].connected` synchronously in its existing click handler; it has no fetch or delayed authorization. The actual installed Accordion uses Radix Content with native closing/opening animation and overflow clipping. Both panel geometry and the centered dialog can move while a child button briefly meets actionability's stability checks.

## Narrow test correction

After opening Connected apps, the test now verifies `aria-expanded=true`, awaits the existing accordion subtree's native `Animation.finished` promises, and verifies that no closed panel remains visible. Cancelled animations settle normally; the closed-panel assertion still checks the resulting presence state. Filtering then proceeds, followed by a fresh pointer hover and the original Connect click.

All original filter, Manage, local-permission notice, Disconnect, reconnection and Add local app assertions remain verbatim. There is no fixed sleep, forced click, retry, increased timeout, disabled animation or weakened effect assertion. Only this existing test and this diagnostic document change. No application handler, free component, state engine, dependency, config or built asset changes.

## Deterministic native-animation control

`/tmp/bricklane-checklist-ci-audit/controlled-readiness.mjs` exercises the real production page at 1280 × 720. It pauses the actual native `accordion-up/down` animations at 40 / 200 ms through the browser's Web Animations API; it does not replace the component or synthesize a connection handler.

At that controlled phase, the apps panel already reports `open`, but the old closed identity panel remains visible. Connect's center is below the apps clipping boundary: button y590.664/h28 versus panel y404.789/h111.547. `elementFromPoint` hits the outgoing Ownership region rather than Connect. The new readiness promise demonstrably remains pending while those real animations are paused. Finishing them releases that same promise; closed content exits and the refreshed button center actually hits Connect. Connect → Manage → permission notice → Disconnect → Add local app then passes with no page errors. This controlled geometry evidence corroborates the retained CI failure without claiming an artificial rerun reproduced every historical scheduler detail.

Evidence: `controlled-readiness.json`, `controlled-readiness.log`, `controlled-before-clipped.png`, and `controlled-after-complete.png` in the same external audit directory. Production animation timing is unchanged.

## Verification and limits

The entire first-run suite passed **13/13** in 30.8 s on stable production `http://127.0.0.1:5459/`, one worker and the original 30-second per-case deadline. It covers all five dialogs at 1440 / 390, business interactions, original artwork and actual source/starter exports. Log: `/tmp/bricklane-checklist-ci-audit/full-first-run.log`; private output: `full-first-run-playwright/`. No cold build was launched. Scoped oxfmt and oxlint pass. The browser plugin/browser skill is not listed, so explicitly authorized installed Playwright was used.

The actual free ReUI/Radix composition is retained, including native Accordion/Item, DialogSurface, focus and portal behavior. No new primitive, media or branding is introduced; MIT/OFL attribution and original Bricklane demo artwork remain unchanged. This is a test input-readiness fix, not a claim of all-browser visual equivalence or a production connection workflow. Root alone coordinates commit/push and checks the next CI/deployment result; this local acceptance does not claim CI is already green.
