# Strata Overview success-rate chart

The public reference places an SLO label beside its dashed target line and
marks samples below the target in yellow. The Overview already displayed its
hourly series and totals. This change adds the visible 99.5% label and markers
using Recharts ReferenceLine and ReferenceDot in the existing free ReUI
chart composition. The local series has 23 measured hours and six samples
below target. Overview opts in to the new label and marker color.

The production build passed TypeScript and both Vite builds. Browser checks
covered Radix and Base, all eight styles, and widths of 390 and 1440 pixels.
All 32 combinations passed. Each checked the label, all six marker tooltips,
Escape from New Job, focus return, and native Tab navigation through the Active
Jobs chart to the success-rate chart. The existing Cron and connections
keyboard and tooltip regression also passed.

The first candidate run found that Recharts rendered the visible label in a
sibling SVG layer. The corrected test locates the exact label text within the
chart and keeps the geometry and marker assertions. The product code and
timeouts were identical across the two runs. The earlier missing-label failure
on the old build and the candidate's initial selector failure are retained in
the test evidence.
