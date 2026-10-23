# CI production preview and failure diagnostics

## Problem and change

Pages run `39902618821` at `4770ce7` passed 608 of 613 browser tests. The source/site failures exhausted the existing 30-second test budget. The run had no uploaded artifacts, so its retained local Playwright traces could not be inspected after the runner exited. The available log alone does not establish the exact cause of every failure.

The workflow already built `dist`, but Playwright then launched the Vite development server. In CI, Playwright now starts a strict production preview of that existing build, with server reuse disabled. The Pages upload remains gated on the full test suite succeeding. Local tests keep the development server, and `PREVIEW_URL` still selects an explicitly supplied server. Assertions, test timeout, three workers, and retry behavior are unchanged.

A failure-only artifact step uploads `/tmp/reui-pro-block-playwright/`, including retained traces and error context. Missing files are ignored when an earlier non-browser step fails. Artifacts expire after seven days.

## Controlled verification

Tests used a clean `b5d8d880134e90b87c1288f474302e8db564ff4c` snapshot, separate development and production ports, and the same browser assertions. The CI configuration was exercised with `CI=1`, launching and stopping its own production preview. Only the temporary snapshot's port was changed to avoid shared workspace servers.

Opening Auth 20's Code tab and source-file selector in a fresh browser context made 566 requests in development versus 108 in production. Opening the source panel added 503 versus 79 requests; 432 development requests were raw source modules, compared with zero in production. Initial page readiness took 652 versus 118 ms; the source interaction took 1,558 versus 880 ms. These measurements are local observations, not a reproduction of the original runner.

The unmodified four site tests passed in both modes with three workers: 6.9 seconds total in development, 4.4 seconds with the new CI production server.

For a controlled slower-client comparison, a temporary snapshot-only `beforeEach` applied CDP CPU throttling at rate 4. It did not change repository tests or their assertions, deadlines, or retries. The same four source-related tests passed with three workers in both modes:

| Existing test                                | Development | Production |
| -------------------------------------------- | ----------: | ---------: |
| Catalog, code viewer, favorites              |      24.6 s |      9.3 s |
| Empty team source and ZIP                    |      28.8 s |     11.9 s |
| Empty 1–5 source and ZIP                     |      29.1 s |     12.2 s |
| Viewport, theme, customizer, source download |       6.2 s |      3.2 s |
| Whole selected run                           |      31.3 s |     14.2 s |

The development results approach the unchanged per-test 30-second limit, while production leaves substantial headroom. This supports removing development module transforms from the deployment gate; it does not prove that all five historical failures share that cause. The next full CI run and any newly uploaded failure traces remain authoritative.

Scoped oxfmt and oxlint checks passed. All three tooling tests passed. No product source, free ReUI implementation, or browser-test assertions were changed in this batch.
