# Branching Thread correction pass — 2026-10-22

Reference: [public ai-chat-9 preview](https://reui.io/preview/base/ai-chat-9?embed=1). The earlier runnable version was insufficient evidence of reference fidelity; this pass replaces its implementation and report.

## Actual official component reuse

The composition follows the dependencies and behavior shown in ReUI's public free chat examples. ReUI explicitly directs stock chat parts to the plain shadcn registry, while its own extensions use `@reui/*`.

- Official ReUI **CodeBlock / Header / Title / CopyButton** replaces the hand-written Prism artifact. Shiki highlighting, overflow, copy state and clipboard writing come from the official implementation.
- Official **MessageScrollerProvider / Scroller / Viewport / Content / Item / Button** and its hook replace the custom ResizeObserver, scroll-intent state and manual scroll handlers.
- Official **Message / Content / Header / Footer**, **Bubble / BubbleContent**, **AttachmentGroup / Attachment / Media / Content / Title / Description / Trigger**, **Marker**, **Collapsible** and **InputGroup** provide the actual message, source, reasoning, progress and composer elements.
- These files were installed through the official shadcn CLI; the existing shared Button was preserved. The sole CodeBlock source adaptation removes an unused destructured binding for the repository's strict TypeScript settings.
- The parent/child branch tree, model/thread configuration, sample replies and pending/stop state remain application logic. The free primitives intentionally do not supply an application-specific conversation tree or AI backend.

## Reference correction

Inter reply text is 15px/24px, code is 13px with 18px rendered lines, the header is 48px, and the surface fills the viewport. The composer matches **720×88px** at 1440×1000 and **358×88px** at 390×844. Its four button coordinates and 177.34375px model trigger match the public DOM.

The initial tree has three user turns and six messages, retaining the original three fork rails. A version switch restores that branch's later messages. Editing and regeneration add sibling nodes instead of overwriting history. New fork timestamps use `Now`; narrow rails keep a single clipped row.

All source groups use the official horizontally scrolling AttachmentGroup, including the numbered three-source case. The three and two-card widths, 44.25px card height, 52.25px scrolling group height and 8px gap match the reference. Empty sources render no heading. Clicking a source/citation only changes its selected state; the invented document inspector is removed.

Reasoning uses the official Collapsible plus three bordered list rows, matching 72px desktop / 112px phone content height. Editing uses a 64px InputGroupTextarea with Cancel/Send. History measures 336px wide at (12,42), with All/Pinned/Today/Earlier heights 384/172/288/190, an active underline and selected-thread background; filtered views omit the group heading. The model menu contains the four actual provider groups and twelve options.

Skills fill their actual prepared draft; follow-up suggestions submit immediately. Regeneration preserves the previous reply during its activity phase, then creates a new version. Stop keeps partial text and a `Stopped by you` marker, without `0 Documents Read` or follow-up suggestions. Copy controls, attachments/removal, rating, pins, history and folding earlier turns remain operable.

## Evidence and limits

Final default screenshots exposed the site customizer's default blue accent overriding the reference's neutral primary. Shared correction `4e49daa` introduces a Default preset that preserves the block's own theme; the block continues consuming semantic tokens. The earlier comparison uses `?accent=neutral`; no primary color is hard-coded in the block to bypass customization. Same-viewport screenshots: `/tmp/reui-branch-{ref,local}-{1440,390}-final.png`. Detailed independent review: `/tmp/grid-agent-chat-official-audit.md`; freeze metrics/screenshots: `/tmp/grid-agent-chat-freeze-review.json` and `/tmp/grid-agent-chat-freeze-*`. Public action verification: `/tmp/reui-branch-reference-actions.json`; helper QA: `/tmp/reui-chat-helper-qa/results.json`.

Five meaningful Playwright cases in `tests/branching-chat.spec.ts` pass: branch continuation/recovery and regeneration; edited forks and source selection; all model/menu/history controls; measured primary frames; reasoning/activity/stop and actual clipboard copy. Scoped TypeScript and Oxlint pass. A clean `a3e8693` plus the 14 owned milestone files passes the production build and all five Playwright cases. The actual production UI download produces a 90-file source ZIP; extracting it and building independently exposed and then verified the fix for the generated TypeScript configuration: include `node` alongside `vite/client`, as the official CodeBlock uses `process`. Evidence: `/tmp/reui-chat-publish-{build,tests}.log`, `/tmp/reui-chat-publish-ai-chat-9.zip`, and `/tmp/reui-chat-publish-export.log`.

Reply prose, code and reasoning summaries are independently authored; provider glyphs have free replacements. Local state resets on reload and there is no AI/backend connection. These differences remain explicit; this report does not claim every word, glyph or intermediate viewport is pixel-identical.

## Published verification

Committed and pushed as `47d8765`. Successful Pages deployment `ce98e5f` (run `39884400691`) includes this commit. All five durable Chat cases also pass against the actual GitHub Pages site (`/tmp/reui-chat-pages-tests.log`), not only localhost. The downloaded standalone example additionally passes desktop and phone branch restoration, send/stop, bundled Inter font loading, no missing images, no page errors and no document overflow (`/tmp/reui-chat-publish-export-runtime.json`).
