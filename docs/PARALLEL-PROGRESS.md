# Parallel refinement coordination

Updated: 2026-10-22 (Asia/Shanghai).

This file records the additional parallel pass requested in the chat “并行复刻 reui pro block”. The existing chat “复刻 ReUI Pro Blocks” remains active in the same checkout. Read-only progress inspection found its work concentrated on application shells, whiteboards, product cards and charts. Existing changes must be preserved.

A third coordinator chat (`01a162a1-c1b4-7613-8929-d7764a3b086d`) records separate ownership in `docs/parallel-refinement-2026-10-22.md`: data grid, contact/FAQ marketing, and Flow/Gantt planning. Those files are also reserved. This pass does not publish or stage changes owned by the other chats.

## Assigned ownership for this pass

| Agent | Existing files it may change | New report | State |
| --- | --- | --- | --- |
| schedule_refinement | `src/blocks/application/schedule.tsx` | `docs/parallel-schedule-refinement.md` | Completed: five targeted tests passed, including desktop/mobile and invalid time ranges |
| pricing_refinement | `src/blocks/commerce/pricing.tsx`, new `pricing-refined.tsx` | `docs/parallel-pricing-refinement.md` | Completed: dedicated analytics/agency plans; two mobile interaction tests passed |
| source_export_qa | `src/lib/source.ts`, `src/lib/bundle.ts`, `src/lib/download.ts` | `docs/parallel-export-refinement.md` | Completed: only `source.ts` changed; three real ZIP downloads independently built and rendered at 14px |
| Coordinator | This coordination document | This file | Scoped production build, lint and 11 final browser tests passed; existing published site separately verified |

Agents may add narrowly scoped helper files and regression specs. They must not change package manifests, shared UI, existing tests, another owner's modules, or Git history. If a file changes externally during a pass, its owner must re-evaluate and avoid overwriting that change.

Playwright runs must use distinct `--output` directories per worker/chat, because the configured default directory is shared and cleaned at run start. This coordinator uses `/tmp/reui-parallel-*` output paths.

## Baseline evidence

- Public checklist: 662 entries, 78 categories, seven groups.
- Existing checks reported 98 passing tests, including route smoke and category-first mobile checks. These are baseline results, not validation of this pass or proof of individual visual fidelity.
- GitHub Actions run [39743994973](https://github.com/caovc/reui-pro-block/actions/runs/39743994973) succeeded for the FAQ narrow-viewport correction (`e500724`).
- Existing published preview: <https://caovc.github.io/reui-pro-block/>.
- Coordinator verified the published homepage in IAB and reran all four existing `tests/site.spec.ts` cases against Pages: **4 passed (7.4s)**. This covers search/deep links, favorites, source viewing/download, viewport/theme/customizer, and mobile navigation.

## Findings in this pass

- Schedule: duration changes did not recompute slots; some filter options produced identical results; meeting creation omitted several brief-specific fields. The schedule agent is correcting these behaviors.
- Pricing: analytics plans reused generic plan information and help actions, instead of the entry-specific comparison/FAQ structure. The pricing agent is refining those surfaces.
- Export: downloaded starters for application (`auth-20`), commerce (`product-card-8`) and data (`chart-16`) independently built. The export agent found a separate visual mismatch: exported theme extraction omitted shared body styles, changing the default font size from 14px to 16px.

## Integration validation

The shared checkout still contains in-progress work from other chats. A full TypeScript attempt found unrelated diagnostics in shell, planning and data-grid/chart files. This pass preserves their ownership rather than editing unfinished modules.

To verify this pass independently, the coordinator archived baseline commit `e500724` into a temporary directory, overlaid only schedule/pricing/source changes and their helper/tests, and linked the already installed dependencies. TypeScript and the production Vite build passed. Build-info paths were relocated inside the temporary snapshot to avoid touching the shared checkout's cache. Browser checks target that snapshot's production preview on port 5187, using an independent test output directory. These results apply to the scoped snapshot, not the other chats' unfinished changes.

The coordinator's snapshot production checks passed **9 tests (6.0s)**: the existing four site workflows and five new schedule regressions. The schedule reference/render screenshots were also inspected together at desktop and phone widths; its audit report records intentional month, icon and calendar-spacing differences.

After the final pricing changes, the scoped snapshot was refreshed and the production build passed again. All **11 final browser tests passed (11.7s)**: four site, five schedule and two pricing tests. Scoped oxlint and whitespace checks passed. The pricing reference and implementation screenshots were inspected together; detailed visual differences and artwork substitutions remain in the pricing report.

This pass leaves four implementation files changed (`schedule.tsx`, `pricing.tsx`, `source.ts`, and the new `pricing-refined.tsx`), two focused regression specs and its audit records in the shared working tree. It does not stage, commit or deploy another chat's work. The final build and 11-test result refer specifically to this pass over baseline `e500724`, not the entire in-progress shared checkout.

## Second pass after user fidelity feedback

The initial pass above was insufficient. Detailed public-preview interaction checks found invented confirmation cards and pricing dialogs, unrelated schedule-family layouts, incorrect fonts and responsive thresholds, and missed portraits. Its coverage/test counts must not be presented as fidelity proof.

The second pass rebuilds the seven entries actually changed here: Schedule 1/2/3/8/9 and Pricing 5/6. Dedicated schedule booking/agenda modules and scoped pricing CSS now replace those generic compositions. Reference geometry, copy, fonts, palette, assets, menus and changed states were inspected separately. The same free Inter subset and thirteen exact free Unsplash portraits are bundled locally; standalone exports include their binaries and notices. A final independent screenshot comparison corrected a mistaken AJ-only loading-state conclusion for the range picker.

Reference, before, after, computed-style and interaction evidence is under `/tmp/reui-fidelity-review/`; corrected existing records are `parallel-schedule-refinement.md` and `parallel-pricing-refinement.md`. This pass does not certify other schedule/pricing entries or the complete catalog.

The second-pass frozen production snapshot uses committed baseline `b756955` plus the explicitly owned source files. Its final build and all 13 combined browser tests passed (40.9s), including the final range portrait assertion. All seven pages were also captured at 1280×900 and 390×844 with no page errors, overflow, broken images or missing Inter font. A final empty-state correction passed a focused two-test rerun as well. The snapshot is served at `http://127.0.0.1:5188/` for review. Temporary source/file hashes are retained in its `validation-files.json`; the shared workspace's other active edits are excluded. No release or deployment is implied.

Remaining differences are explicit in the corrected records: mobile calendar/header adaptations, independent Lucide geometry, uncertified full menu animation/viewport parity, extra same-day range validation, some secondary agenda participant details, and untested dark/exhaustive date/year states. Catalog coverage is still separate from verified fidelity.

## Completion rules

Each report must list inspected references, concrete changes, verification evidence and remaining differences. New local changes are not considered published until their exact revision is deployed. The full 662-entry fidelity audit in `docs/FIDELITY.md` remains outstanding; working routes alone do not satisfy it.


Another coordinator expanded the shared bundle asset and notice glob from flat paths to recursive paths. That compatible change was retained and included in the final refreshed snapshot; the exact bundle used for this pass is recorded in the validation manifest. All assets added by this pass are flat and included under either pattern. The final meeting-calendar scrollbar was shifted outside its time choices without changing their widths; all five scoped booking tests passed again (42.2s) after this CSS adjustment. The refreshed fourteen desktop/mobile captures remain free of page errors, overflow and broken images. Both sampled source ZIPs passed independent builds; four standalone desktop/mobile renders and key flows passed with external HTTPS blocked.

## Official free-component migration (user follow-up)

The user explicitly requires actual ReUI free-component reuse and timely verified milestone commits/pushes. All three agents have received both requirements; they report completed scopes to this coordinator and do not perform Git mutations. The primary release chat has been notified to coordinate Git ownership.

Schedule booking owns new official Frame/TimePicker and the reusable free c-calendar-8 composition, Schedule agenda consumes that calendar instead of its handwritten date/keyboard implementation, and Pricing owns official Badge/IconTile plus the free c-item composition. Stock shadcn dependencies are identified honestly; changing a path alone is not reuse. `source.ts` now traverses recursively vendored ReUI source and local hooks so standalone ZIPs can contain the real implementations. Migration validation is in progress; the previous 5188 snapshot does not yet imply that this follow-up is deployed.

The completed official-reuse candidate over committed `af2956f` passed TypeScript/Vite build and **14/14 combined browser tests (37.3s)**. All seven pages were recaptured at 1280×900 and 390×844: no page errors, document overflow or broken images. Real standalone downloads now contain Schedule 8: 86 files; Pricing 5: 70 files, including actual official free source and ReUI MIT notices. Both independently built successfully. Scope lint has no errors; the unmodified upstream TimePicker API exports produce six Fast Refresh warnings. The candidate/file hashes are retained in `/tmp/reui-fidelity-review/official-release-af2956f/validation-files.json`; official registry sources, changes and limits are in the per-family reuse reports.

Shared source-export support was committed and pushed separately as `af2956f`. The actual page milestone is being coordinated with other ready chats, using explicit file lists and avoiding concurrent Git index writes. Full catalog fidelity remains outside this scope.

The final official-reuse standalone starters also passed all four desktop/mobile renders and key interactions with external HTTPS requests blocked (`final/official-standalone-checks.json`). Both official-source ZIP builds passed after the final calendar navigation fix. Runtime sources have been frozen; only deployment coordination and release-status documentation remain. The release coordinator assigned this scope fourth in the Git queue, after site controls, marketing and shells, to avoid concurrent index writes.

Intervening committed root/site changes through `ce11008` were integrated into the isolated candidate: production build and the four affected site workflows passed again (6.5s). Shared Inter assets and reference CSS were separately published with the marketing milestone `7474b96`; they remain byte-identical to the tested versions. The remaining page/runtime changes are frozen and ready for the assigned Git window.

## Published verification (2026-10-23)

Commit `9d37136e87516b0f1f9b2db77a6d0d1f1250f099` was pushed and its [GitHub Actions run](https://github.com/caovc/reui-pro-block/actions/runs/39765273947) completed successfully, including full repository tests and Pages deployment. Actual published-page verification passed all ten targeted schedule/pricing interactions and fourteen desktop/mobile renders with no page errors, overflow or broken images. The booking test route helper was corrected from an origin-absolute hash route to a relative one so it preserves the GitHub Pages project prefix; the five booking tests then passed against Pages (11.4s).

Real online source downloads contained Schedule 8: 148 files; Pricing 5: 75 files. Both included the actual official ReUI dependencies/MIT notice and Inter/OFL, and both independently passed production builds using the installed dependencies. Larger file counts reflect intervening committed family dependencies. Evidence is retained under `/tmp/reui-fidelity-review/online/`, `online-interaction-tests`, `online-booking-tests`, and `export-online-{schedule-8,pricing-5}`. Existing documented icon, responsive adaptation and secondary-data limits still apply; this is verification of seven entries rather than full-catalog fidelity.
