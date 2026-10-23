# Source navigation CI trace

Run [39909617625](https://github.com/caovc/reui-pro-block/actions/runs/39909617625), commit `2a2b5ff`, tested the built production site: **673/674 passed**. Its sole failure was the old multi-page Empty source test. On the final Brief page, the Source file combobox did not appear within the unchanged five-second assertion. It was not a wrong-file assertion or a total test timeout.

The new failure-artifact step worked. Artifact `12482951843`, `playwright-diagnostics-39909617625`, contains the real failure trace and error context. The source coordinator downloaded it through the GitHub connector and reconstructed its incremental DOM snapshots; local evidence is `/tmp/bricklane-2a-connector-trace` and `/tmp/bricklane-2a-trace-timeline.json`.

## Observed sequence

- At trace time285870, the Reports Sheet had `data-state="closed"` but remained mounted. Navigation to Brief started at285876. By the navigation's after snapshot at285990, that old Sheet was absent and the Brief heading was correct.
- At the View code action around286508, the page scroll position was364. The button occupied y692.06–720, with input at1173.5,706.03; the preview iframe ended at680.
- At the action's after snapshot around286535, the page had scrolled to322 and the iframe ended at722. No new source Sheet had opened. The failed assertion's final snapshot still showed the Brief preview without a Sheet.

This establishes movement during the click and failure to open the source viewer. It does not establish a slow source fetch or an incorrect source leaf. The trace does not record the origin of that42px scroll. The old Sheet's close/focus lifecycle and the site's smooth hash-navigation scroll are both relevant candidates: `src/index.css` enables smooth scrolling, and the hash-navigation hook requests scroll-to-top. Neither can be claimed as the unique cause from these snapshots.

The original trace ZIP SHA256 is `cd226bef520c98d6b92ffa8211cc8f14133fc262df3d83a6605d93fa72490565`. In `1-trace.trace`, the relevant call/phase pairs are `sbjw@14216/after` (closed Reports Sheet), `sbjw@14218/before+after` (navigation), `sbjw@14220/action+after` (click and movement), and `sbjw@14222/after` (failed assertion). A normalized evidence summary is `/tmp/bricklane-2a-connector-trace/source-navigation-evidence.json`.

## Narrow correction and limits

Commit `77d7f42` gives each of the ten Empty source pages its own browser test context, asserts complete Sheet removal after closing, and tests each archive independently. Every former source/ZIP assertion is retained. Global timeouts, assertion timeouts and retries are unchanged. The complete two Empty suites passed33/33 on production; the integrated Coupon/Empty/site batch passed59/59.

These checks avoid inheriting another page's scroll/portal state and make future failures specific to one page or archive. They do not by themselves prove that every real-user navigation sequence is free of movement. If the new independent cases or manual navigation reveal another failure, investigate its own retained trace before changing application behavior or test timing.
