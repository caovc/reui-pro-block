# Base overlay Escape cancellation

Production candidate 5260 exposed a shared compatibility defect when Job's Show jobs Select reopened with the current Late Materials option disabled. One real Escape reached that focused option, but the Select remained open. Chart's native event recording showed the event initially unprevented; Base UI's `useFocusableWhenDisabled` then called `preventDefault()` for the disabled option. The Select's `useDismiss` requested closure, but `shouldCancelOverlayDismiss()` treated that preexisting native flag as a consumer cancellation even though no `onEscapeKeyDown` callback existed. No Sheet or overlay remained during this Escape, ruling out the earlier closing-Sheet hypothesis.

The compatibility layer now returns `false` for Escape cancellation when there is no actual consumer `onEscapeKeyDown` callback. An empty registered handlers object, or one containing only outside/focus callbacks, no longer changes that default. The original native event and its `defaultPrevented` value remain intact. Existing free ReUI/Base Select, Sheet and other overlay implementations continue to own their actual dismissal; no vendor, Job state, disabled option, simulated close, timing budget or focus behavior was changed.

When an explicit Escape callback is supplied, the adapter preserves its existing contract: it receives the same native event, including key, target, currentTarget, modifiers and propagation methods, and cancellation follows `event.defaultPrevented` after that callback. Consequently, an already-prevented event plus an explicit no-op Escape callback still cancels dismissal. This narrow fix intentionally preserves that boundary instead of adding an event proxy, resetting native flags or intercepting `preventDefault`. Explicit callback `preventDefault()` still cancels closure; `stopPropagation()` alone does not. Pointer/focus outside callbacks retain their independent cancelable custom event with `detail.originalEvent`.

## Verification

`node --test tests/base-overlay-dismiss.test.mjs` loads the actual `overlay-compat.tsx` module through the repository's existing `transpileModule`/real-source-loader pattern, resolving its real React, motion-policy and utility dependencies. It does not copy the dismissal implementation or extract a separate runtime module.

Before the fix, the contract suite recorded six passes and one failure: the pre-prevented Escape with an empty handler object incorrectly returned cancellation. After the guard, all seven tests passed. Coverage includes normal default dismissal, inherited native prevention without an Escape callback, explicit prevention, original event identity/key/targets/modifiers, propagation-only handling, the existing explicit no-op/pre-prevented boundary, and unchanged outside/focus custom-event cancellation.

The red and green logs are `/tmp/lucent-ci-sidebar-escape/base-overlay-dismiss-{red,green}.log`. The original event recording is `/tmp/job-v02-5260-escape-diagnostic-results/escape-diagnostic-Base-risk-Escape-native-event-diagnostic/native-events.json`; Chart also retained its trace, final screenshot and fully decoded Sheet/layer timeline separately. These are local private evidence paths, not shipped preview assets.

The agent's own checks are scoped formatting, lint, diff checks and the seven real-module contract tests. The coordinator then built production candidate 5270 with full TypeScript, both production builds, repository formatting/lint and all 202 tooling tests passing.

The Job validation owner reported all three original targeted cases passing on 5270. The original Base UI risk interaction passed in 7.9s: Late Materials with zero remaining records stayed disabled, one Escape really closed the Select, its popup became hidden, focus returned to the original trigger, and Undo restored the result. The original actions, assertions and timing budgets were retained. This supplies rendered regression evidence for the observed defect; the native event recording from 5260 remains the root-cause evidence.

The shared-overlay validation owner then completed all seven regressions on 5270 with exit code zero in 52.3s: four menu cases, two actual Base Tempo cases and one Base Cohort original full interaction chain. Cohort's chain passed in 18.6s and asserted the actual Base primitive, including the consumer's explicit nested Escape-cancellation behavior. Its private test copy adapted only the route to reach the Base entry; the original interaction chain and assertions were retained. This route adaptation is not a new production route or a claim that the unadapted Radix entry exercised Base. Evidence is `/tmp/base-overlay-shared-regressions-2026-11-12/candidate-5270/run.log` and `results.json`. The owner closed all browsers after completion; screenshot review is separately reported by that owner.

The seven real-module contract checks, three original Job targets and seven shared-overlay regressions are complete for this shared fix. Atlas's 18 Job layout cases remain separately coordinated and are not included in these pass totals. No CI success, commit or push is claimed by this agent. This agent did not open another browser, recompile or modify the frozen runtime/test during the documentation updates; the coordinator owns integration and publication of this three-file milestone.

Owned files for this follow-up:

- `src/foundations/base/ui/overlay-compat.tsx`
- `tests/base-overlay-dismiss.test.mjs`
- `docs/qa/2026-11-12-base-overlay-escape-dismiss.md`
