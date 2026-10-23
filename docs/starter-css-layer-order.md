# Exported starter CSS layer order

The downloaded block and template entry point now imports `theme.css` before React, UI providers, and the example module. This establishes Tailwind's theme/base/components/utilities layer order before component CSS is evaluated. Previously eager component imports could declare utilities before the theme, letting the later preflight reset override utility padding and borders.

The runtime fix is limited to import order in `src/lib/starter-files.ts`, shared by both download builders. No component styling, Tailwind settings, or primary application entry point changes are needed.

## Reproduction and verification

- Baseline: `4770ce7`. The Data regression uses the already published Sparkline / Cron Job Health entry (`chart-31`), which renders actual free ReUI Frame panels with `p-4`.
- Before the fix, the actual downloaded ZIP passed its TypeScript and Vite build but rendered panel padding as `0px` and its border width as `0px`; the full preview had `16px` padding and a `1px` solid border. The runtime regression failed on these exact differences.
- After the import-order fix, actual Data (`chart-31`) and Application (`auth-4`) ZIPs each passed their own `npm run build`. Their rendered top/right/bottom/left padding, border width/style, radius, and display matched the full preview at both 1440px and 390px. Both persistent tests passed in 25.6 seconds, without changing existing build or test timeouts.
- Existing ES2023 target/library checks remain in the downloaded-project regression. The Data bundle's transitive sources still exercise the modern language features used by other charts.
- The separate in-progress Status Tracker implementation is not included in this patch. Its agent independently reproduced the same reset issue in its actual ZIP and confirmed that moving the theme import first restores padding/borders. The persistent regression deliberately uses a committed entry, avoiding an unpublished component dependency.

Evidence is outside the repository: `/tmp/reui-starter-cascade-before-real` (failing baseline) and `/tmp/reui-starter-cascade-after` (four rendered starter screenshots). Run `PREVIEW_URL=<production-preview> npm test -- tests/starter-build.spec.ts --workers=1` to repeat the real download, build, and computed-style comparisons.
