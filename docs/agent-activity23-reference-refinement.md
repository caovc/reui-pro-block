# Agent Activity 2/3 reference correction

Observed the official live previews at 1440 × 1000 and 390 × 844 on 2026-11-06, alongside the public Bricklane baseline. Official screenshots remain private QA evidence and are not distributed in the repository or download bundles.

## Changes based on actual reference behavior

- Activity 2 starts in Detailed: compact Marker rows with durations. Summary keeps the same rows and hides the duration column. The previous collapsible Trace interpretation and extra Replay menu entry did not match the reference and were removed from this consumer.
- Its Run options menu uses the observed 208px width and 8px trigger gap, Detail and Export groups, and three radio choices. Selecting a radio keeps the menu open; native Escape closes it and restores the trigger. Rerun remains in the footer. Raw uses the actual free CodeBlock ghost surface, and live exports contain observed steps; stopped runs retain cancellation records.
- Activity 3 uses a 576px maximum width and 64px top inset, instead of the previous large outer card. Sources and checked files each occupy a compact grouped Card with 34px Item rows. The query is a 38px Item. The Timeline keeps 32px content indentation, neutral hollow 12px indicators and 1px separators. The answer is a paragraph under its heading and confidence badge.
- Status and evidence badges use the actual free Badge default (20px high, 12px text), correcting the smaller `sm` choice. Both consumers use the existing licensed local Inter font. Row actions use real 24px buttons and the existing Tooltip primitive, with hover and native focus visibility. Research file rows now provide Copy path as observed in the reference.

## Actual free component reuse

| Official free capability                                                                                             | Reused implementation and correction                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Marker examples](https://reui.io/r/radix-nova/c-marker-2.json)                                                      | Actual Marker / MarkerIcon / MarkerContent compose feed rows, completion and research file evidence. The feed no longer substitutes Trace for the reference's Detailed mode. |
| [Timeline](https://reui.io/r/radix-nova/timeline.json) and [example](https://reui.io/r/radix-nova/c-timeline-1.json) | Existing MIT ReUI Timeline, Item, Header, Content, Indicator, Separator and Title APIs remain in use; only consumer classes change dimensions.                               |
| [Item example](https://reui.io/r/radix-nova/c-item-5.json)                                                           | Existing Item / ItemContent / ItemActions replace the research query/source/file wrappers, rather than reimplementing their behavior.                                        |
| [Avatar example](https://reui.io/r/radix-nova/c-avatar-1.json)                                                       | Actual Avatar / AvatarFallback replace the handmade feed avatar wrapper. Original initials replace the official example's photograph.                                        |
| CodeBlock, Tooltip, DropdownMenu, Card, Button, Badge                                                                | Existing free dependency implementations provide rendering, portals, native radio selection, focus management and controls. No shared free primitive is rewritten.           |

## Independent content and remaining boundaries

Bricklane's names, source citations, query, repository paths and local run timings remain original fixtures. Publisher initials replace vendor logos and the feed avatar uses original initials. Row Copy now writes the visible tool target (path, topic, command, query or name), correcting the misleading combination of a “Copy path” label and a complete raw log record. Every local step has a nonempty target. Copy Transcript and Download Log retain the raw transcript. The reference's clipboard was not read or written; the row target contract follows the visible action label and was explicitly reviewed. Open actions retain the local toast behavior described by the public reference brief, without navigating to external services. Local timers and copy/download callbacks extend the free compositions because the component library does not supply a research or execution backend.

The shared activity model, Activity 1/4/5, free primitives and SourceTargets are unchanged. Existing SourceTargets already select the actual 2/3 leaf implementations and their router. The dedicated Source checks verify view, Copy, single-file bytes and actual project ZIP closure, including the Inter OFL and MIT notices.

## Verification

- Scoped oxfmt format/check and oxlint passed for the two consumers and four affected/new QA files.
- The original production command `npm run build` passed with TypeScript and Vite unchanged.
- Eight reference interaction cases passed at 1440px and 390px. The necessary existing phone Copy case also passed against the final target-copy behavior, for nine distinct site cases. Menu selection, native focus/Escape, exact 208 × 205px menu and 8px gap, Tooltip visibility, Inter, badge sizes, Timeline geometry and actual clipboard/download values were checked.
- Four dedicated Source cases passed. Both default leaves, complete viewed text, clipboard bytes, single-file bytes and fresh actual project ZIPs matched the implementations. Both ZIPs contain 330 members, preserve MIT/OFL notices and contain no vendor preview media. Original wrapper metadata selects Activity 2 and 3 respectively.
- Both real downloaded projects completed normal `npm install` and their unchanged `npm run build` (`tsc --noEmit && vite build`, strict enabled). Each original entry and all 330 received files remained byte exact after installation, compilation and runtime checks. The received packages define no root postinstall script; none was invented.
- Eight more cases passed against the actual standalone entries, four per project across desktop and phone. The only test fixture change was direct navigation to `./`; every interaction assertion and budget was preserved. No entry, configuration or source file in either received ZIP was edited.
- Actual desktop/phone screenshots were read after the run. Brand initials, three independent citations instead of the reference's four, repository paths and local timings are intentional fixture differences.

Three initial failed observations remain in the private evidence: reading a native zoom animation before it settled, sending Enter before deferred native ArrowDown focus, and measuring a background role locator after modal `hideOthers`. Corrections preserve the original 30s case, 5s assertion and 15s feed-completion budgets, animations, dimensions and business assertions. No passing case is presented as evidence for a different product payload.

The private integration base is committed `4e19d9f`; its upstream Grid changes were refreshed from Git objects, while the seven owned files were kept separate. Subsequent AppShell/CI changes through `3d59223` have no member intersection with the actual Data ZIPs, and the default preview-theme CSS is byte identical. This is a scoped static boundary, not a claim that the entire private source tree equals that later commit. No Main working-tree changes were included.

Publisher integration on `2bb06dc` additionally contains the Product KPI column migration. Both actual Activity ZIPs include `grid-advanced-sheets.tsx`; that intervening change is confined to ProductKpis and its default-source mapping, outside the Activity render paths. Activity-owned preimages and shared model remain unchanged. The standalone results above belong to the frozen candidate; they are not presented as a fresh execution or whole-package byte equality on `2bb06dc`. The normal push CI checks the integrated branch.
