# Pricing 8 — Usage Limit Upgrade

## Scope and observed reference

`UsageLimitPricing()` is the independent implementation for Marketing Pricing 8 (future pricing index 7). Its entry is `.pu8-entry`; its portalled dialog is `.pu8-dialog.reui-reference`. This batch changes only the five `pricing-usage-limit` source, style, data, test and documentation files. Integration, source-target dispatch and publication belong to the parent session.

The public [block](https://reui.io/blocks/marketing/pricing/pricing-8) and [live preview](https://reui.io/preview/base/pricing-8) were inspected with headless Chromium at 1440×1100 and 390×844 on 2026-10-26. We measured rendered DOM, computed fonts, geometry and actual clicks before implementation. No premium source code, extracted SVG, screenshots or remote media is shipped in this component.

The actual initial dialog says “Pick Your Plan” / “Switch or cancel whenever you need.” It initially selects Yearly and Team. Closing it reveals the free Empty composition, “Bookings Running Low” / “A paid plan lifts the monthly limit.” / “View Plans”. Close and Escape dismiss the dialog; reopening preserves plan and period. On desktop all three cards are visible. Mobile shows a native radio rail, one selected card and feature column, and a fixed footer with that plan's invoice and action.

**Brief discrepancy:** collapsible feature groups and a numerical usage/current-plan strip were mentioned in the assignment but are absent from the current public preview. We clicked Limits, Scheduling, and Security and Support on both viewports: the table remains 16 rows, with zero Collapsible slots and no expanded controls. No such behavior or usage figures were invented. The three groups are static banded table bodies.

## Actual free ReUI reuse

Complete free registry examples were fetched and read before implementation, including their imported dependencies. Existing installed implementations were then read and composed; shared files were not modified. Registry example hashes below are SHA-256 of each example source file, not of the registry JSON envelope.

| Official free source                                        | Local implementation actually called             | Call site / mechanism retained                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c-frame-1` and `frame`                                     | `src/components/reui/frame.tsx`                  | `PlanCard` uses Frame → FrameHeader / FrameDescription / FramePanel; `UsageFeatures` uses Frame → FrameHeader / FrameTitle / FramePanel. Native Frame variables, padding, borders and radii retained. |
| `badge`                                                     | `src/components/reui/badge.tsx`                  | Free success-light billing badge and success Most Popular badge.                                                                                                                                      |
| `icon-tile`                                                 | `src/components/reui/icon-tile.tsx`              | Elevated calendar and rail icons, rather than a hand-written imitation tile.                                                                                                                          |
| `c-dialog-1`                                                | `src/components/ui/dialog.tsx`                   | Dialog, Trigger, Content, Header, Title, Description, Footer; native modal focus trap, dismiss button, Escape and controlled open state.                                                              |
| `c-empty-1`                                                 | `src/components/ui/empty.tsx`                    | Empty / Header / Media / Title / Description / Content behind the dialog.                                                                                                                             |
| `c-scroll-area-1`                                           | `src/components/ui/scroll-area.tsx`              | Actual ScrollArea viewport and scrollbar own scrolling; no custom scroll implementation.                                                                                                              |
| `c-radio-group-1` + `c-item-4`                              | `src/components/ui/radio-group.tsx` + `item.tsx` | Mobile PlanRail uses RadioGroup / RadioGroupItem inside Item label / Media / Content / Title / Description / Actions; native arrow-key focus and Space activation.                                    |
| `c-tabs-1`                                                  | `src/components/ui/tabs.tsx`                     | Actual Tabs / TabsList / TabsTrigger implement billing period and keyboard navigation.                                                                                                                |
| `c-table-1`                                                 | `src/components/ui/table.tsx`                    | Table / Header / Body / Row / Head / Cell render the 16-row comparison.                                                                                                                               |
| Button and Separator dependencies used by official examples | Existing `ui/button.tsx`, `ui/separator.tsx`     | Actual Button asChild anchors, Empty trigger and card dividers.                                                                                                                                       |

The `ui/*` dependencies in this table are the stock primitives imported by those official free examples; they are not claimed as unique ReUI enhancements. The distinct ReUI Frame, Badge and IconTile implementations are actually used. No duplicate Dialog, scrolling, radio, Tabs or table mechanism was introduced. The considered `c-collapsible-1` source was inspected but intentionally not used because the reference has no collapsible groups. An early standalone FrameFooter was removed because the mobile invoice belongs to DialogFooter and has no Frame ancestor.

| Source            | SHA-256                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `c-dialog-1`      | `fbc82b087216ec310dd003fa83f5407085643debbe7d5cb6ad53a0635c783a78` |
| `c-empty-1`       | `b8ed7036aa1499dc7ae48721102e882826e4d44e85d9ffd9a9b24967de92fe59` |
| `c-scroll-area-1` | `0921355232aab04ee7d20b79364f12048b79b66076c5529d8793bf41c0f2e6ce` |
| `c-radio-group-1` | `3f061f117058be58dec0f2ad45fd5e97e291940315a9a62b32befb5e1aa09aa4` |
| `c-item-4`        | `2df03bc3860b8bb7d71384067670035787594c59b38434abb682c641576352b0` |
| `c-table-1`       | `5117b83fa8d0ea79d653c0ae5759adc04b5642caebccff7aec2469aa2a72dc35` |
| `c-tabs-1`        | `cbfe3e727aeae0df0cbf65a7358070b64457d6cb6850e65a3b128ad5fc07044e` |
| `c-frame-1`       | `47f4b4edde5aab92742ee71c86c31910039fc581a722d0fc842afe7b6b6fc1fe` |
| `frame`           | `bec56175281721e00b4d872c13ba7828ae1b849d470fa818835fba24f27a5697` |
| `badge`           | `c534319459b74f4f11bbf8ddcd7aedba98631789aa6d7ffa8a7978ba91760b93` |
| `icon-tile`       | `83f4253dfef982d5a372c63c3cc744e06fc45c75f48c7aaa72b2a3e3b009e3ac` |

Official example endpoint format is `https://reui.io/r/{name}.json`. Downloaded public free registry sources and rendered-reference evidence are in `/tmp/reui-pricing8-refinement/` for review; they are not added as premium payload to the repository.

Custom code is limited to the business model, responsive composition, plan-specific visible copy, scoped visual styles and 24px scroll-boundary fades. `usagePlans` and `usageFeatureGroups` are the single canonical model: rail/card rates, yearly invoice totals, card allowance highlights, full feature table and selected footer derive from it. There is no checkout backend. Public `href="#"` actions stay open and perform no upgrade; local anchors prevent default to preserve the gallery hash. All illustrations are absent; icons are existing Lucide dependency components. Existing MIT and Inter OFL notices remain unchanged, and no media or font payload was added.

## Geometry and interaction evidence

Measured reference and candidate values after native animation completion:

| Element                        | Desktop reference = candidate | Mobile reference = candidate  |
| ------------------------------ | ----------------------------- | ----------------------------- |
| Dialog `(x,y,w,h)`             | `(240,118,960,864)`           | `(16,70,358,704)`             |
| Header height                  | `79`                          | `79`                          |
| Native scroll viewport `(y,h)` | `(197,785)`                   | `(149,528)`                   |
| Billing list `(w,h)`           | `(226.9375,32)`               | `(226.9375,32)`               |
| Plan Frame height              | `458` (all three)             | `343` (selected Team)         |
| Feature Frame / Table height   | `700.5 / 651.5`               | `700.5 / 651.5` (Team)        |
| Mobile radio Item height       | hidden                        | `62` each; native group `194` |
| Mobile fixed footer `(y,h)`    | hidden                        | `(677,97)`                    |
| Closed Empty `(y,h)`           | `(448.625,202.75)`            | `(320.625,202.75)`            |

All 16 initial table row positions/heights and all visible cell widths match at both viewports. The portalled dialog and its children compute Inter rather than the site's default heading font. Initial focus matches the reference dialog container, using the native Dialog autofocus callback; keyboard navigation, native focus rings and focus return to View Plans remain available.

Actual public yearly and monthly combinations were clicked for all three plans. Yearly displayed rates are $10/$30/$80 per month with invoices $120/$360/$960; monthly rates and invoices are $12/$36/$96. Desktop monthly card copy is “Billed monthly”; mobile footer includes the selected amount. Basic/Team use Start Trial and Enterprise uses Contact Sales. Canonical allowance checks include bookings 500/2,500/Unlimited and seats 1/10/50; booleans and Support values match the public table.

Evidence includes `reference.json`, `states.json`, `final-review.json`, the capture scripts and paired `reference-{desktop,mobile}-{final,table-final,closed-final}.png` / `local-{desktop,mobile}-{final,table-final,closed-final}.png`. The initial reference occasionally rendered Lucide placeholders until hydration; stable screenshots were used instead of copying that transient artifact.

## Billing Tabs overflow finding

Both live reference and initial candidate showed default pill TabsList `clientHeight=32`, `scrollHeight=33`, overflow X/Y visible. The trigger retained the line variant's invisible `::after` (height 2px, bottom -5px, opacity 0), creating a 1px phantom vertical overflow even without a visible tab scrollbar. At both widths the list width is 226.9375 and has no horizontal overflow. The enclosing padded billing strip is 48px high with equal scroll/client height.

The owned instance removes only the default pill trigger's inert underline pseudo-element (`content: none`). It does not hide scrollbars globally, constrain the real ScrollArea, or suppress focus rings. Default list and Tabs root now have equal scroll/client dimensions; arrow keys still focus and select Yearly, with the active trigger visible. The underline rule remains available for unrelated line Tabs.

The initial review of `tabs.tsx` alone suggested a `data-active` / Radix `data-state` mismatch. Reading the full styling chain corrected that conclusion: `src/styles/shadcn.css:64–83` already maps `data-active` to `data-state="active"` and bridges orientation. The redundant instance `data-active` attributes were removed. Native selected styling, keyboard focus and active visibility are verified through the existing bridge; no shared change is needed. Public preview uses Base UI, while this project's official free example dependencies use Radix. Native interactions remain in the installed primitives.

## Validation and publication boundary

Candidate: `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-pricing8-candidate-lto7h3_n`, created using read-only `git archive HEAD` at `0fc5cb2849012ce9062e98023fc3fb0d0a20004a`, then only owned files and temporary index-7 dispatch. Vite cache and TypeScript build-info paths point into candidate-local `.cache`; no shared build cache was written. Candidate preview is `http://127.0.0.1:5528/#/preview/marketing/pricing/pricing-8`.

Scoped `npm exec tsc -- --project tsconfig.usage.json --noEmit` passed. The config includes only this component/data and their actual imported dependencies. The four persistent Playwright scenarios cover both billing periods, static group clicks, all six mobile states, native radio/Tab keyboard behavior, close/Escape/reopen, placeholder actions, Inter, lack of horizontal/phantom tab overflow, and fixed header/footer during actual native viewport scroll. Formatting/lint results and final test run are recorded in the ready manifest.

No whole-workspace typecheck/build, Git writes, shared primitive edits, integration changes or source-target edits were performed. Per coordination, parent owns final unified production build, source/ZIP gates, commit/push and deployment verification. Remaining intentional differences are the native Radix/Base UI implementation details, a local gallery-preserving placeholder link, and dependency/browser-specific focus/scrollbar rendering. No claim of a new production deployment is made here.
