# Immediate scroll reset on route changes

## Behavior and fix

Navigating from a block's bottom pagination to another block called `window.scrollTo(0, 0)`. Because the page has `html { scroll-behavior: smooth }`, this started an animation instead of landing at the new page's top. An immediate source-button interaction could occur while the page was still moving.

`useHash` now resets both axes with `behavior: "instant"` when the hash changes. The global smooth-scrolling style remains intact for in-page scrolling. Source rendering, free ReUI components, assertions, timeouts, retry settings, and existing multi-page tests are unchanged.

## CI evidence

Production run `39909617625` at `2a2b5ff` passed 673/674 tests. Its final Empty source click occurred while scroll position changed from 364 to 322; the source Sheet did not open. That trace alone could not uniquely attribute the movement to closing-Sheet focus restoration or route scrolling.

Production run `39911450874` at `77d7f42` passed 705/706 tests. All isolated Empty source cases passed; the remaining failure was the existing five-page Dialog source flow, on Dialog 2. Its trace removes the unmounted-Sheet ambiguity:

| Browser trace call and phase |  Timestamp | Observed state                                       |
| ---------------------------- | ---------: | ---------------------------------------------------- |
| `aaoz@15073`, after          | 266670.885 | Old source Sheet fully removed; scroll 615           |
| `aaoz@15075`, after          | 266787.209 | Correct Bulk Email Invite page; scroll 636; no Sheet |
| `aaoz@15077`, action         | 267070.842 | Source click; scroll 615; iframe bottom 429          |
| `aaoz@15077`, after          | 267141.187 | Scroll 510; iframe bottom 534; no source Sheet       |
| `aaoz@15079`, after          | 272167.300 | Scroll reached zero; source Sheet still absent       |

Artifact `12483835950` contains `dialog-first-run-five-sour-e4fdd-sition-and-original-artwork/trace.zip`; its browser stream is `1-trace.trace`. Snapshots are identified by call ID and phase, not a `snapshotName` field. The extracted DOM timeline is available locally at `/tmp/bricklane-77-trace-timeline.json`, and the artifact was extracted to `/tmp/bricklane-77-connector-trace`.

These observations establish scrolling during the unsuccessful interaction. The trace does not record the pointer event's composed path or a complete focus-event timeline, so it does not identify the exact final click recipient.

## Regression evidence

The new regression uses the actual UI: open Dialog 1 source, close it, wait for removal, scroll to bottom pagination, click Bulk Email Invite, record the new route's first animation frame, then open and verify its actual `invites.tsx` source. It also checks that global scroll behavior remains `smooth`.

On the unchanged `77d7f42` production build, the first-frame assertion failed in 2.0 seconds: expected `{ x: 0, y: 0 }`, received `{ x: 0, y: 636 }`. With only the route reset changed to `instant`, the same test passed in 2.0 seconds and opened the correct source. This reproduces the route-landing defect; it does not claim a deterministic local reproduction of the original CI click failure.

The expanded desktop/mobile regression, four unchanged site tests, and unchanged five-page Dialog source/ZIP test passed together: 7/7, three workers, 17.0 seconds. Only that temporary snapshot's Dialog diagnostic fixture applied 4× CPU throttling; it did not change assertions or deadlines. The unchanged Dialog flow also passed three parallel repetitions before the fix, so local pressure alone was not sufficient to reproduce every CI failure.

The final clean candidate based on `78f4d9e` also passed strict TypeScript/Vite build, full formatting across 724 files, all three tooling tests, scoped oxlint, and the same seven browser tests with three workers in 16.6 seconds. No temporary instrumentation was included in this final candidate.

The next complete production CI run remains the check that the observed intermittent failure is resolved across the full workload.
