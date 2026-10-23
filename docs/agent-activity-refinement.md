# Agent Activity: independent implementation and evidence ledger

This batch reconstructs public Agent Activity behavior using official free REUI implementations and original local demo data. It does not contain Pro source, site avatars, extracted logos, or paid decorative assets. No backend calls, repository writes, permissions, or real deployments occur in these demos.

## Scope and evidence status

| Exact catalog ID   | Public title and reference                                                               | Public rendered desktop/mobile                                                                            | Implementation state                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `agent-activity-1` | [Approval Run Console](https://reui.io/blocks/ai-agents/agent-activity/agent-activity-1) | Pending: browser is user-active; no visual-match claim                                                    | Independent approval/gating UI and focus handoff tested; visual correction pending                          |
| `agent-activity-2` | [Live Run Feed](https://reui.io/blocks/ai-agents/agent-activity/agent-activity-2)        | Actual public desktop and 393×852 mobile default completed state observed through coordinator screenshots | Screenshot-guided compact default feed corrected; reference menu/lifecycle behavior pending                 |
| `agent-activity-3` | [Research Timeline](https://reui.io/blocks/ai-agents/agent-activity/agent-activity-3)    | Pending                                                                                                   | Actual installed REUI Timeline composed with original source/file evidence; clipboard/control tests passed  |
| `agent-activity-4` | [MCP Call Audit](https://reui.io/blocks/ai-agents/agent-activity/agent-activity-4)       | Pending                                                                                                   | Dedicated responsive audit table and local scope/requeue state tested; visual correction pending            |
| `agent-activity-5` | [Run Outcome Report](https://reui.io/blocks/ai-agents/agent-activity/agent-activity-5)   | Pending                                                                                                   | Dedicated result ledger, scoped retry, blockers, dependency and Keep/Undo tested; visual correction pending |

On 2026-10-23, the five official public descriptive `.md` pages were read individually. These establish semantics, component lists and author notes, **not** visual verification. Browsing must use an available owned tab without taking focus from the human. Public mobile observations for the preceding AI Usage 1/2/3 batch remain pending and are not resolved by this batch.

The older generic `ActivityBlock` in `src/blocks/data/ai.tsx` remains unchanged. No router/source-target changes have been made by this child; the coordinator will map each completed ID to its real leaf as each previewable milestone is integrated.

## Free-first audit and actual reuse

The configured official registry was searched with `npx shadcn@latest search @reui -q agent --limit 20` and `-q marker --limit 12`. Only exact free example names below were retrieved. No Pro registry payload was requested.

| Official free source                                                                                                   | Existing or introduced primitive                       | Actual reuse / planned extension                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [c-trace-2 Streaming Run](https://reui.io/r/radix-nova/c-trace-2.json)                                                 | Official upstream Trace, as the REUI Trace docs direct | Live Feed actually adapts its 3-character/24 ms streaming effect, per-step timeout and cleanup, live row controlled opening, no empty cancelled expander, and stable Stop/Run again control. Pause and transcript views extend it.                                |
| [c-marker-2 Tool Calls](https://reui.io/r/radix-nova/c-marker-2.json)                                                  | Existing upstream Marker                               | Live Feed actually composes Marker/MarkerIcon/MarkerContent for concise descriptive tool rows; hidden icons are accompanied by verbal status.                                                                                                                     |
| [c-marker-3 Agent Status](https://reui.io/r/radix-nova/c-marker-3.json)                                                | Existing Marker, Spinner, actual REUI Badge            | Live Feed uses the original Card + live Marker/Spinner status composition, not a replacement handmade status primitive.                                                                                                                                           |
| [c-marker-4 Phased Run](https://reui.io/r/radix-nova/c-marker-4.json)                                                  | Existing Marker separator variant                      | Detailed Feed actually uses flat phase separators and step groups; the phase label remains accessible content.                                                                                                                                                    |
| [c-marker-5 Changed Files](https://reui.io/r/radix-nova/c-marker-5.json)                                               | Existing Marker border variant + actual REUI Badge     | Outcome actually composes border-separated Marker/Icon/Content file/result rows with real Badge variants and metadata. Independent retry actions extend the example.                                                                                              |
| [c-trace-5 Change Approval](https://reui.io/r/radix-nova/c-trace-5.json)                                               | New upstream Trace, existing Item/Button               | Approval actually adapts the effect-driven phase progression, Item prompt outside the trace, and requestAnimationFrame focus handoff after the approval prompt unmounts. Independent gated steps and validated revision/question inputs extend it.                |
| [c-trace-13 Data Pipeline](https://reui.io/r/radix-nova/c-trace-13.json)                                               | Trace, Card, Table                                     | Audit actually reuses its borderless CardContent/Table composition, adding server attribution and stacked narrow rows. Outcome preserves its explicit failed/skipped downstream semantics; it does not pretend that the free sample includes a permission engine. |
| [c-trace-19 Access Decision](https://reui.io/r/radix-nova/c-trace-19.json)                                             | Trace                                                  | Audited sequential decisions and explicit “Not reached” statuses. No claim of implementing an actual authorization engine.                                                                                                                                        |
| [c-timeline-1](https://reui.io/r/radix-nova/c-timeline-1.json), [Timeline](https://reui.io/r/radix-nova/timeline.json) | Existing actual REUI Timeline                          | Research actually uses Timeline/Item/Header/Date/Indicator/Separator/Content with controlled progression. The library’s item completion state is retained; original evidence cards extend its item content.                                                       |
| Existing official free Frame/Badge/CodeBlock                                                                           | `src/components/reui/*`                                | Feed actually uses REUI Badge variants and REUI CodeBlock for raw transcript. Approval and Outcome actually use REUI Frame panels/chrome; all five use actual REUI Badge variants.                                                                                |

The [REUI Trace documentation](https://reui.io/components/trace.md) explicitly identifies Trace as a free **shadcn/ui** component and links to [upstream Radix Trace](https://ui.shadcn.com/docs/components/radix/trace.md). It is not falsely called a REUI-owned primitive. REUI's free compositions are nevertheless actually reused above.

## Authorized Trace addition

The official `npx shadcn@latest add trace --dry-run` reported new Trace, a Collapsible overwrite, and `cn`. `cn` already exists in the project. With coordinator authorization, the CLI installed Trace in an isolated scratch project. The existing workspace Collapsible and scratch CLI Collapsible are byte-identical after oxfmt normalization, including Root/Trigger/Content props forwarding. **Only the new `src/components/ui/trace.tsx` was copied.** No existing component, package, lockfile, or dependency changed.

Trace's installed original source SHA-256 is `cb56c628760299e3ca2fbfaf8487b11bc011ebd2167be9affe798837899ab9f3`. Its implementation is unchanged apart from formatting and a provenance/MIT header. The existing stylesheet already contains official `shimmer` and reduced-motion utilities. Existing REUI source MIT notices and `src/components/reui/REUI-LICENSE.txt` remain required.

Free example content SHA-256 values read during this audit:

- `c-trace-2`: `4bd3dec994e8c9b946582d70cc87d95a5b39360839cdcaed490fee65a1e2569d`
- `c-trace-5`: `d10102586a688f6bfa5d5bb352c4f8204b24d015fd697bf7869da1e5068169b0`
- `c-trace-13`: `975cd9e5371bee954a547eba35daeb669177b7952770bf83fab793c176bd785e`
- `c-trace-19`: `89faf83fde96bf66ad65f327c3d244f463ba9ea8271d294382a7ccdfe89c3f6a`
- `c-marker-2`: `43e70e8596b4e46ced2bc1e7b62d9109cc68af8d72b1103d04c66a3b4a012409`
- `c-marker-3`: `fd437fc4fc959ec5cf76afdbd8f0c164bb029f360e61cc84362cf255d229349f`
- `c-marker-4`: `1325632d0cfe295a89786af12edfd37aeab57e362abd71445ea3517a85f90095`
- `c-marker-5`: `4dd3e84b0644e8b38d74d78232df1cefdc01d16b885a2191b9d869735a04f995`

## Confirmed custom gaps and limits

Free patterns provide visual primitives, live progression, simple approval, grouped logs and decision rows. They do not supply the complete Pro console's per-step `gatedBy` workflow, nonempty Revise/question validation, all three transcript views, full local scope/requeue ledger, or dependency-aware item retries with keep/discard/undo. The independent `agent-activity-model.ts` adds these local transitions while keeping free UI compositions. Local Grant never pretends to change server permissions. Original fixtures replace the reference's files, task text and people.

No claim is made that these five entries are visually faithful yet, that all AI blocks are complete, or that all published chart/source gaps have been eliminated. Public observations and implementation corrections will be recorded per entry. All five local layouts are provisional until that comparison; functional independence is not a claim of pixel fidelity.

## Verification so far

- `tests/agent-activity-model.spec.ts`: **6/6 passed**, one worker, output `/tmp/reui-agent-activity-model-first`. Checks approval/Revise validation, skipped gated steps, preserved independent verification, pause, stop/transcript preservation, grant/requeue without completion, scoped retry and dependency order, keep/undo and discarded guards.
- Owned model, test, Trace and Feed files formatted with oxfmt and checked with oxlint.
- Feed visual/DOM interactions, full production candidate, source-leaf ZIP and narrow computed-style verification: **pending at that preliminary stage**. Passing model tests alone is not a previewable milestone or a visual verification. See the later native screenshot correction and final evidence below.

## Preliminary local implementation checks

The first independent candidate was built from committed HEAD plus only the owned Activity modules, the new authorized upstream Trace and scratch-only dispatcher/source-leaf cases. Working shared routers/source-targets remain untouched. Its strict TypeScript and Vite production build passed (`/tmp/reui-agent-activity-first-production-build.log`).

Local persistent interaction suites passed before the final production suite:

- Approval: 2/2, `/tmp/reui-agent-activity-approval-first`. Revision text required, focus moved to the live result, gated edit skipped, independent verification retained, question answer recorded, deployment denied/approved, copy summary verified, 390px no overflow.
- Feed: 2/2, `/tmp/reui-agent-activity-feed-radio`. Pause, keyboard expansion, stop cancellation, actual `run-log.txt` download, replay, timer completion and 390px controls. First test selectors were corrected to the actual upstream ToggleGroup **radio** semantics; this was a test expectation correction, not a production control change.
- Research/Audit/Outcome: 5/5, `/tmp/reui-agent-activity-evidence-first`. Real REUI Timeline completion, citation clipboard URL, local source/file actions, denied-only filtering, Grant only requeues, pending call preserved, scoped/dependent retries, unsupported distinction, Keep/Undo/Discard/Restore and 390px layouts.

These are **local functional checks**. At that preliminary stage public comparison had not completed. The later coordinator-supplied Activity 2 screenshots below supersede its default completed-state evidence only; other pages remain pending.

## Activity 2: coordinator public desktop observation and correction

The coordinator actually opened the public isolated `/preview/radix/agent-activity-2` with CUA at 1280×720. The observed completed state was “Fix Refund Webhook / Done”, around 576px wide at x351/y63, a compact ~72px header, eight activity steps followed by a separate Run complete row, and a ~54px footer showing 2 files, 4 tools and Rerun. The observation included read/search/query/edit/test/issue results and a sample 44.7s duration. This is actual **coordinator-rendered desktop evidence**, not a metadata inference. Its first inline screenshot was initially unavailable to this child. Later saved native screenshots were viewed directly; see the following correction. No automated pixel-diff match is claimed.

The provisional local Feed had been 672px wide, with a tall description/toolbar header and only six steps. It was corrected to max-w-xl (576px), a compact avatar/title/status header, eight original-data steps plus a distinct completion row, separate tool/file counting, and the Rerun footer action. Task text, files, people initials, result values and durations remain independent demo fixtures. The two modified files are settings and release notes; counted tool events are search, data query, checks and issue creation.

That first dimensional correction still had a visible toolbar and wrapped content. It was superseded by the actual desktop/mobile screenshot-guided correction below. Other four Activity desktop/mobile pages remain pending. No additional evidence is inferred from mere navigation.

## Activity 2: native desktop and mobile screenshot comparison

The coordinator subsequently captured actual public reference pixels with native Edge, including an iPhone 16 **393×852** emulated viewport. This child viewed both saved screenshots directly (`/tmp/bricklane-official-activity2-desktop-native.png` and `/tmp/bricklane-official-activity2-mobile-native.png`). These audit-only screenshots include browser UI and the reference avatar; they are **not** copied into this repository, freeze, preview site, or downloads. The public default completed state is now visually observed at desktop and 393px mobile. This does not assert that a distinct 390px public viewport was observed.

Concrete corrections after comparing those pixels:

- Removed the default visible Summary/Detailed/Raw toolbar. View selection is provided in the local ellipsis menu; the original menu has not been opened/verified.
- Centered the actual upstream Card at 576px maximum, with 24px side margins on mobile and 64px top spacing. At local 1280px the measured card is x352/y64, 576×454; at 393px it is x24/y64, 345×454. Header is 70px and footer 53px locally, close to the coordinator’s approximately 72/54px reference measurements.
- Preserved all eight tool rows on single lines, with real tool icons from the free Marker composition, original result labels, ellipsized monospace targets, and a fixed right-hand time column. Body rows measure 20px plus 14px gaps. Completion is a separate ninth row with step count and independent demo duration.
- Added real per-step clipboard copying and local Open file/query/tracker actions. They stay visible on mobile and reveal on hover/focus on desktop. The observed reference command/search/reason rows have copy without an open action, which is reflected locally.
- Moved the Done badge inline with the title, retained an original initials avatar, and restored a compact muted footer with “2 files touched · 4 tools called” and Rerun.

The local ordinary Rerun resumes from step index 2, matching the public descriptive notes. A clearly local “Replay all steps” extension exercises the free c-trace-2 streamed-reasoning behavior from the beginning. The **reference** ellipsis menu choices, all live/pause/stop/replay state visuals, hover transitions and keyboard interaction have not been inspected; only their independent local behavior is tested. Original fixtures, initials, durations, filenames and issue IDs deliberately differ. No pixel-identical claim is made.

After these corrections the affected Feed suite passed **3/3**, `/tmp/reui-agent-activity-feed-public-correction-fixed`, including actual menu-radio view changes, 576px card width, pause/keyboard collapse/stop/download, 8 result rows + completion, mobile copy/open actions and counts, full reasoning replay, and 393px margin/row-height checks. A first width assertion incorrectly measured the full wrapper rather than the Card; only that test selector was corrected. Local 390px functionality is tested separately from the observed public 393px device.

Local default-state screenshots were also directly viewed at 1280 and 393 (`/tmp/reui-agent-activity-2-public-correction-{1280,393}.png`), with measurements in `/tmp/reui-agent-activity-2-public-correction-smoke.json`. These are independently rendered Bricklane outputs, distinct from the audit-only public screenshots.

## Functional milestone: final production and real downloads

The immutable final candidate is based on committed `095e5128b53d064222c6b5ca37bb2d90075c74f6`, plus only these owned Activity files/new Trace and scratch-only narrow dispatch/source-leaf additions. It excludes working shared-theme and template changes. Strict TypeScript and production Vite build passed (`/tmp/reui-agent-activity-functional-final-build.log`).

- **18/18 production tests passed**, one worker, approximately 1.1 minutes, `/tmp/reui-agent-activity-production-native-final`. This is after the screenshot-guided Feed correction, not a reuse of the provisional pre-correction results.
- A final Feed test strengthening asserts the actual per-step clipboard bytes, with the same explicit test-browser clipboard permissions already used by the source-viewer suites. Its focused production rerun is recorded in `/tmp/reui-agent-activity-production-copy-final`. An initial standalone smoke script lacked those permissions; no runtime source change was required to correct that harness.
- Source drawer verification covers all five real leaf selections, exact clipboard source bytes, and exact downloaded single-file bytes. The actual starter download additionally contains every owned module, upstream Trace/Marker/Collapsible, real REUI Frame/Badge/Timeline/CodeBlock and the required REUI MIT notice. Theme CSS is imported first in the downloaded main entry.
- The actual **216-file Activity 5 ZIP** from the production source drawer was freshly extracted and independently passed `tsc --noEmit && vite build`. At 1440 and 390px, Frame border is 1px with 3px padding; FramePanel border is 1px with 16px padding. Grant and the two dependent scoped retries worked in that standalone build. There were no runtime errors, broken images or horizontal overflow. Evidence: `/tmp/reui-agent-activity-actual-final-build.log`, `/tmp/reui-agent-activity-actual-final-smoke.json` and `/tmp/reui-agent-activity-actual-final-{1440,390}.png`.
- A second actual **216-file Activity 2 ZIP**, downloaded from its own production drawer, was freshly extracted and independently passed the same strict build. At 1440/393px it preserves 576/345px card widths, y64, eight 20px rows and a 454px completed card. The 393px standalone copy/open, Rerun and Stop actions passed; no runtime errors, broken images or overflow occurred. Evidence: `/tmp/reui-agent-activity-feed-actual-final-build.log`, `/tmp/reui-agent-activity-feed-actual-final-smoke.json` and `/tmp/reui-agent-activity-feed-actual-final-{1440,393}.png`.

This freezes a **functional baseline for five independent entries**, with the default completed Feed additionally compared against actual public desktop/mobile screenshots. It does not close the outstanding public visual audits for Approval, Research, Audit or Outcome, or the reference Feed menu/lifecycle states. Those remain the next fidelity work, rather than being silently inferred from passing local tests. Source routing remains a coordinator-owned narrow integration step. This child has made no Git writes or deployment claims; the coordinator serializes commit/push and checks CI/Pages.
