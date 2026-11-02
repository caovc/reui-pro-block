# AppShell search and focus progress correction

Reference audit: 2026-11-02. Scope: AppShell 2's search dialog and AppShell 18's
focus progress. The existing theme, responsive Sidebar and account-menu work
remain separate completed milestones.

## Actual reference and correction

The public [Floating Sidebar Admin preview](https://reui.io/preview/base/app-shell-2?embed=1)
opens a compact Search dialog containing one Input. Its desktop panel is 448px
wide and 56px high, with 8px/16px padding and a 40px input using Inter 14/20.
Entering text and pressing Enter keeps the dialog open without changing the
current page. Escape dismisses it, and Cmd+K reopens an empty input. Its public
[block brief](https://reui.io/blocks/application/app-shell/app-shell-2.md) also
explicitly describes the input-only behavior.

Shell 2 previously used the general route Command palette, adding results and
navigation that changed the reference's layout and interaction. It now composes
the installed native Dialog, DialogTrigger, DialogContent, Input and Kbd. The
existing floating trigger geometry, Ctrl/Cmd+K, close control, nested mobile
Sheet and focus return remain usable. Other shells retain their Command search.

The public [To-Do AI Assistant preview](https://reui.io/preview/base/app-shell-18?embed=1)
exposes Focus progress as a real progressbar with value 56, min 0 and max 100,
beside the visible 18 / 32 text. Shell 18's manually drawn nested div bar now uses
the installed Progress Root/Indicator with the same value, 4px track and primary
fill. Its accessible name is Focus progress. The existing account menu is not
rewritten by this correction.

## Reused free capabilities and custom scope

ReUI identifies [Dialog](https://reui.io/components/dialog.md) and
[Progress](https://reui.io/components/progress.md) as free shadcn/ui components.
These changes actually consume the existing installed implementations; they do
not claim separate ReUI-authored registry primitives. Native overlay, focus,
close and progress semantics replace local approximations. The shortcut and
block-specific placement remain small consumer compositions. No shared primitive,
Sidebar, theme store, font or dependency is changed.

Both runtime edits remain in the existing `standard.tsx` and `productivity.tsx`
implementation leaves. Source targets need no new route or split-file mapping;
the export collector already follows the static Dialog/Input/Kbd/Progress
imports. Bricklane's original artwork, existing local portraits and required
third-party notices are retained.

## Validation and limits

The independent candidate uses committed baseline `4db11e6`, excluding unrelated
workspace changes. New native checks cover 1440px and 390px search geometry,
text/Enter behavior, empty reopen, close/Escape/shortcut focus, and actual themed
Progress values through light/dark, collapse and phone navigation.

The first three-case run retained one pass and two failures: native modal hiding
made the underlying breadcrumb unavailable to the test's default role lookup.
Only that locator was changed to include the hidden underlying element. The two
failed cases then passed; the already-green Progress case was not repeated.
Six affected existing geometry, portal-font, mobile-focus and Command cases
also passed, retaining their original budgets and assertions.

Separate rendered checks confirmed page titles/URLs, meaningful content, absence
of Vite overlays, empty browser warning/error logs and no horizontal page overflow.
Desktop search and light/dark phone progress screenshots were inspected. The
official reference's actual viewport was 1192×1312 at DPR 2; it is not labelled
as a 1440px comparison. Animation-opening samples were retained separately, and
settled measurements wait for native finite animations to finish.

Scoped oxfmt/oxlint checks pass. The later combined release passed its original strict build and actual exported
project acceptance; see [the release record](fidelity-navigation-tabs-release-2026-11-02.json).
Commit/push and full CI/Pages verification remain separate release gates.
These checks do not certify all 36 shells' pixel equality.
