# Primary release coordination

Updated2026-10-23, Asia/Shanghai. The original implementation chat coordinates releases in the shared checkout. Only verified payloads and narrow integration hunks are committed. Other sessions' WIP remains intact.

Repository: https://github.com/caovc/reui-pro-block
Preview: https://caovc.github.io/reui-pro-block/

## Published milestones

- The gallery exposes662 routes across78 categories, plus18 templates. This is catalog coverage, not complete visual fidelity. The per-entry queue and remaining differences are in [FIDELITY.md](FIDELITY.md).
- All20 authentication entries have explicit compositions. The final four were checked against public desktop/mobile layouts; actual free Rating, IconTile, Frame and Carousel examples replace matching custom mechanisms. Auth9/12 retain mobile reviews, Auth13 retains a leading image, Auth14 hides its artwork. The final milestone1d701a2 passed33 production regressions and two real257-file starter builds with computed desktop/mobile CSS parity.
- All43 Cards,14 Empty States,6 Reviews and6 Wishlists have recorded per-entry refinements and actual free reuse. Chart-family and Commerce ledgers retain exact coverage and differences.
- Dialog1–5 and all three Status Trackers use actual free compositions; b5d8d88 passed21 production checks and independent Dialog/Status starter builds with desktop/mobile style parity. Native ReUI chart geometry and Badge corrections followed in d01e5f2 with8 production checks and an independent Burn starter build.
- All6 Coupons now have separate actual free Frame, ToggleGroup, Item and clipboard compositions. Coupon integration passed59 production checks including both Empty source suites and site navigation; its actual151-file starter independently built with computed Frame style parity at1440/390. Original campaign artwork and local shop calculations remain documented differences.
- Empty1–10 source checks now use ten independent page cases and two independent ZIP cases, retaining every prior assertion and the standard30s per-case timeout. Both complete suites passed33/33 before integration.
- Dialog6–10 add actual free Combobox status/priority/member/label pickers and file/avatar upload adapters, alongside existing Dialog/Frame/IconTile compositions. Integrated production checks passed32/32. Their actual285-file starter independently built and matched desktop/mobile dialog geometry/styles; non-modal portal behavior remains a recorded difference.
- Original Bricklane branding/artwork replaced reference identity and unverified portrait dependencies. Independently licensed free sources retain attribution.
- Starter fix cada0d8 imports theme CSS first, preventing preflight from overriding Tailwind utilities in downloaded projects. Actual Data/Application archives prove padding16px and Frameborder1px remain equal to the site at1440/390. Earlier build-only archive checks did not establish this style parity.

## Current ownership

| Owner                     | Scope                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Primary                   | Release integration, real starter verification, CI/Pages; Dialog6–10 and shared Sidebar fix      |
| Application agent         | Final five Dialogs11/12/13/14/16 in independent modules; earlier ten integrated                  |
| Data agent                | Native Burn-chart/Badge corrections published; next four AI Usage entries in independent modules |
| Commerce agent            | All6 Coupons published; next8 Shop Heroes in independent modules                                 |
| Source/export coordinator | Diagnose source/ZIP/site CI failures within original source scope                                |
| Grid coordinator          | Diagnose two Grid CI failures; preserve previous filter-focus correction                         |

## Release and validation rules

Each milestone is built from latest committed HEAD plus its exact frozen payload. Source defaults must point to the actual rendered leaf. Playwright uses production previews, one worker and unique output directories. Actual UI-downloaded ZIPs are independently built and rendered; representative computed padding/borders are compared with the full preview.

A commit or successful push does not establish deployment. Last verified successful Pages build/deploy is3e57ab7. Commit2a2b5ff tests the actual production assets and retains failure diagnostics. Run39909617625 passed673/674; its real trace shows the final multi-page source click occurred while the page moved, without opening a Sheet. See [trace findings](source-navigation-ci-trace.md) for evidence and attribution limits. Commit77d7f42 includes independent source contexts and complete Sheet-close waits; its run39911450874 is in progress. The Grid investigation distinguishes reproduced loading-pressure symptoms from the unproven historical cause. The new build and deploy must succeed before claiming an updated public preview. No blind retries or timeout inflation replace evidence-based fixes.

All demo authentication, invitations, payments, releases and AI actions are local. Missing service integration and deliberate visual differences stay documented. The full goal remains active while significant per-entry fidelity gaps remain.
