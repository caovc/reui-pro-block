# Data Grid initial-render CI investigation

2026-10-23. Investigated the two Grid failures in commit `4770ce7aef87fd70cffb79529b225fbeb1008970`, Actions run `39902618821`. Both failed at the first render assertion: Companies could not find `data-grid-table`, and Payments could not find `25 of 10,000 loaded`. Neither reached column changes, scrolling, selection, or refunds.

## Evidence and limits

The original run uploaded no failure artifacts. Its runner-local traces and error contexts cannot be recovered through the Actions artifacts API. Consequently, the historical failures' exact DOM, network state, and cause remain unconfirmed.

All local comparisons used an isolated `git archive` of the exact failing commit, the same installed dependencies, and separate Vite cache/output directories. The ordinary tests and diagnostic probes retained the original five-second visibility assertion. No retries or timeout increases were introduced into the repository.

| Environment                                                              | Cases                                                 | Result                                    | First table appearance                    |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Cold development server, ordinary tests                                  | Companies and complete Payments interaction           | 2/2 passed                                | Ordinary test durations: 2.6s and 3.1s    |
| Development server, 4× CPU throttling, three workers                     | Both initial render assertions, six executions each   | 12/12 passed                              | 2.93–3.85s after navigation started       |
| Development server, 8× CPU throttling, three workers                     | Both initial render assertions, three executions each | Companies 3/3 passed; Payments 3/3 failed | Companies 5.96–6.65s; Payments 6.34–7.16s |
| Development server, 10× CPU throttling, three workers                    | Companies, three executions                           | 3/3 failed                                | 12.12–12.29s                              |
| Production preview of the same commit, 10× CPU throttling, three workers | Both initial render assertions, three executions each | 6/6 passed                                | 1.88–2.05s                                |

Times above start before `page.goto`; the assertion starts after `page.goto` returns. They are different timing boundaries. The production pressure run overlapped an ordinary Grid regression run, so these measurements are diagnostic observations, not a controlled throughput benchmark.

## Predictions checked

1. **Loading the whole Data family delays the Grid.** If this contributes, a development navigation should wait for unrelated family modules; the production bundle should leave more time before the unchanged assertion expires. Each development page loaded 231 resources. The Companies failure trace contained 100 block-module responses, including chart, sparkline, and AI conversation modules. At failure it still had two Suspense skeletons. The last unrelated module completed around 11.14s; the table appeared around 12.12s. The corresponding production page loaded 60 resources and passed under the same CPU setting.
2. **The 10,000-payment initialization is solely responsible.** This predicts Payments should fail while the small Companies fixture remains unaffected by loading pressure. Companies also failed with its loading fallback still present, before its grid rendered. Payment model initialization may contribute to its later appearance, but it cannot alone explain both locally reproduced symptoms.
3. **An exception or permanently incorrect rendered state prevents discovery.** The probes captured page errors, console errors, failed requests, the first table/count mutation, and the eventual page body. No such error was captured. Both pages eventually rendered normally. Payments retained the exact initial loaded count; the failure was not caused by automatically advancing to another batch.

These observations reproduce the same initial assertion symptoms under local loading pressure. They do not prove that the historical CI failures had this cause.

## Verification and ownership

The exact commit's production build passed. Its four Grid test files passed all **84 cases**, covering base/columns, advanced/grouping, editing/structure, and filtering. This includes the complete Companies column cascader operation and Payments load/virtualization/refund flow, plus the deferred filter-focus regressions.

The Source/CI owner is handling a separate change to test the built production preview in CI and upload failure diagnostics. Grid business behavior, its real TanStack models, and the official free ReUI Data Grid/Filters composition require no change based on this evidence. A later failure must be evaluated from the new artifact rather than inferred from this local pressure experiment.

Diagnostic scripts, screenshots, traces, build logs, and render timelines are temporary files under `/tmp/reui-grid-filtering/ci-4770-*`. They are not shipped in the app or downloadable starters. No Grid or vendored component source was modified for this investigation.
