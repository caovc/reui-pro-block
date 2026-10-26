# Gantt CI: wait for modal exit before native dragging

This is a test-only synchronization correction. The Gantt consumer, official free ReUI engine, shared Dialog, source mappings and dependencies remain unchanged. The test retains its original task-date change and assignee assertions, and now additionally verifies that a real native drag has activated.

## Original failure retained

- [Actions run 40257256416](https://github.com/caovc/reui-pro-block/actions/runs/40257256416), source commit `bd94ff540740ab7335b528eca39aa0dede7280ef`: 1040 passed, one failed according to the preserved complete CI log.
- Artifact `playwright-diagnostics-40257256416`, ID `12623318508`, 13,066,191 bytes. GitHub connector transport failed, so the artifact was downloaded through authenticated read-only `gh api`.
- Original artifact ZIP: `/tmp/bricklane-gantt-ci-diagnostics.zip`; extracted failure trace: `/tmp/bricklane-gantt-ci-diagnostics/flow-gantt-refinement-canc-4772f-ignees-during-a-native-drag/trace.zip`.
- Original full failed log: `/tmp/bricklane-templates-r3m1-ci-failure.log`. These originals were not overwritten by the local verification run.
- Failing test: `tests/flow-gantt-refinement.spec.ts`, “cancelling another task's form cannot change assignees during a native drag”. Its existing date-label assertion at original line 224 did not observe a change.

## What the actual trace shows

The trace establishes an input-ordering problem, rather than an assignee or date calculation failure:

| Trace event                           |    Monotonic time, ms | Evidence                                                                                                                                                                                              |
| ------------------------------------- | --------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cancel click completes, `ctxd@23594`  |            358921.153 | The mouse click has returned; this does not mean the animated modal has unmounted.                                                                                                                    |
| Cancel after-snapshot                 |            358926.636 | Dialog content and overlay have `data-state="closed"`. The overlay still has `style="pointer-events: auto;"`.                                                                                         |
| Mouse move to background Access rules | 358979.038–359029.194 | Pointer targets `(793,230)` while the previous modal DOM is retained.                                                                                                                                 |
| Screencast frame nearest mouse down   |            359029.906 | `screencast/...1792980756302.jpeg` still visibly shows Edit Task and its backdrop.                                                                                                                    |
| Native mouse down, `ctxd@23604`       | 359043.637–359052.280 | The closing modal/overlay tree is still retained in the action snapshots.                                                                                                                             |
| Native drag movement, `ctxd@23606`    | 359057.621–359529.812 | Pointer moves to `(857,230)` in fifteen steps, but no `data-dragging` state appears in any snapshot. The modal tree disappears during this interval, after the original pointer down was intercepted. |
| Mouse up, `ctxd@23608`                | 359546.622–359552.342 | No native Gantt gesture had been started, so there is nothing to commit.                                                                                                                              |
| Unchanged-label assertion starts      |            359557.539 | It correctly fails: the bar still reports July 15–20.                                                                                                                                                 |

The exact closed-overlay fragment from the Cancel after-snapshot is:

```json
{
  "data-state": "closed",
  "data-slot": "dialog-overlay",
  "class": "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  "style": "pointer-events: auto;"
}
```

Playwright frame snapshots following that state reference the unchanged previous DOM until the movement's after-snapshot. The original trace ZIP, extracted action timeline, Cancel after-snapshot and nearest screencast frame are retained in the freeze's separate `evidence/` directory with SHA256 hashes. They are diagnostic attachments, not files to stage or distribute with component starters.

## Actual free implementation checked

The existing consumer imports and renders the actual official free ReUI `Gantt`, `GanttView`, navigation and event interactions from `src/components/reui/gantt/`. It does not use a hand-drawn replacement engine.

The current official free registry was read with `npx shadcn@latest view @reui/gantt`, saved to `/tmp/bricklane-gantt-ci-audit/official-free-gantt.json`. Relevant raw upstream files:

| Official free source | Raw SHA256                                                         | Relevant behavior                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-bar.tsx`      | `175b7a36be1c6fa3c6ecf4b0bac088bb1036e57e2fb558c42c0d8ad5bd27352e` | Native pointer-down delegates to `gestures.beginMove`; the bar exposes `data-dragging` from the engine's active occurrence.                                                                                   |
| `gantt-dnd.tsx`      | `18ade05ad62d19d1da089395286ed020443b5df803db1fac0208444d1e3e06f2` | `canDrag` checks enabled interactions, read-only state and `event.draggable`; `beginMove` starts the actual pointer gesture. It cannot start when a Dialog overlay receives the initial pointer down instead. |
| `gantt.tsx`          | `4b8c664302e2d56080b91fb67b7f4f2a223828b0040956b595fda1ddb61a9476` | The actual existing engine owns state, selection and update proposals. No engine update was installed for this correction.                                                                                    |

The installed free implementation exposes the same relevant interaction and drag-state contract. Past-date labeling is cosmetic and is not among `canDrag`'s disabling conditions. The consumer's existing `onEventUpdate → apply(fromProposal(...))` path preserves `r.assignees` when `fromForm` is false. The earlier assignee fix remains intact; canceled form state is still left available for this regression test to expose if that protection regresses.

## Narrow correction

The sole modified test now:

1. Scopes Cancel to the actual Edit Task dialog.
2. Waits until that Dialog is hidden and its actual overlay has unmounted.
3. Performs the same native mouse movement, without `force`, synthetic dispatch, alternate input mechanism or changed coordinates.
4. Asserts `data-dragging="true"` before releasing the pointer, and asserts the original `TL` assignment during the active drag.
5. Retains the original required date-label change and final assignee equality after pointer release.

There is no arbitrary sleep, timeout increase, retry, removed assertion or runtime workaround. Waiting for the native modal lifecycle makes the background target legitimately available before using raw mouse APIs, which do not perform locator actionability checks.

## Verification

- Clean isolated candidate archived from `cbd5c2e0192d7fb747fb5d6817b7c8d23a4866b9`, with only the corrected test overlaid: `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/bricklane-gantt-ci-production-i_5_qya5`.
- Strict production `npm run build` passed: `/tmp/bricklane-gantt-ci-build.log`.
- Full relevant suite passed: **19/19 in 42.9 seconds**, one worker, unchanged 30-second per-test limit. It tested the production preview successfully bound to port 55038: `/tmp/bricklane-gantt-ci-tests.log`.
- The corrected regression passed with the stronger in-flight drag/assignee assertions. The suite also covers project editing/scale/tree behavior, dispatch dates and technician assignment, rerun history, resource capacity validation, task links, phone read-only details/edit/cancel, booking duplication, unscheduling and cleared-stage reruns.
- The Gantt consumer and all nine installed Gantt engine source files were verified byte-identical to the clean integration base. No source/clipboard/download mapping or starter dependency changed; an additional starter rebuild was not necessary for this test-only correction.
- Scoped oxfmt and oxlint are run on the owned test and ledger before freezing. Root performs its clean latest-base integration, serial commit/push, and checks the new full CI/Pages result. A local pass is not a claim that CI or deployment has succeeded.

An accidentally started test command following an occupied-port failure was stopped immediately and is retained only as `/tmp/bricklane-gantt-ci-aborted-port-conflict.log`; it is excluded from all passing evidence. The final full suite above ran against the confirmed isolated candidate on 55038. No other server or foreground browser was changed.
