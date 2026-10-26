# Activity1 grouped run menu refinement — 2026-10-26

## Scope and three leading differences

This is a new runtime refinement of `src/blocks/data/agent-activity-approval.tsx`. Earlier Activity1 audit documents and the independent approval model are unchanged. The first three concrete differences were: (1) the leaf had one Run options heading instead of View / Density / Run groups; (2) Restart run used a neutral counterclockwise icon and sentence case instead of the observed destructive Restart Run with clockwise icon; (3) its width was 208px rather than 224px. Portal typography was investigated separately, before any local CSS decision. No global or primitive changes are bundled.

The current local production preview and the live Pages source-download UI both returned the same pre-refinement leaf SHA256, `98c06d073c9d6b018d3e7836ac0dceb4839ed1e1ed7b4efcc627fb55885287fa`. Both already contained the compact header and paths, notes, fold, density, summary and restart controls. The older Full activity / Discard screenshot does not describe those measured surfaces. At the initial check local HEAD was `10de2f1796738975f6dba5e21dc71975092ef9b9`; the separate candidate was later archived from its recorded clean HEAD. The successful deployment API record available at the check identified `303cc13c0a80a73a89327072f1e72a49b4a5cd61`, while remote main had subsequently advanced to `5c6df66d78f54bff481816f578b856bcb3b243ac`. Remote head is not treated as proof of deployed assets.

## Actual public evidence

A new owned Edge tab opened [the official public preview](https://reui.io/preview/radix/agent-activity-1). Its rendered heading was Reproduce webhook failure. The run reached its fifth-step question gate before the menu was measured. CUA DOM snapshots, read-only computed styles and inline screenshots confirmed the following at explicit **1440×1000** and **390×844**, **light**, **DPR1**. Original screenshots, SVG and assets were not downloaded or redistributed. Browser viewport was reset and the owned tab closed afterward.

| Public menu property     | Actual measurement                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Outer menu               | 224×294px; padding4px; radius10px; ring plus normal medium shadow                                                   |
| Desktop menu position    | x767, y109                                                                                                          |
| Narrow menu position     | x125, y109; document scroll width390                                                                                |
| Structure                | View / three checkboxes; separator; Density / two radios; separator; Run / two actions                              |
| Group labels             | 24px tall; 12px font /16px line-height; weight500; padding4px6px                                                    |
| Seven interactive rows   | 28px tall; 14px font /20px line-height; weight400; gap6px; radius8px                                                |
| Check/radio row padding  | 4px32px4px6px; checked indicator on right                                                                           |
| Action padding and icons | 4px6px; 16×16px icons; Copy Summary stays on one line                                                               |
| Font                     | Inter with Inter Fallback                                                                                           |
| Restart Run              | Destructive red `oklch(0.577 0.245 27.325)`; clockwise RotateCw; keyboard focus produces matching red10% background |

File Paths was toggled off and restored. Targets and their associated actions disappeared in the public preview. Selecting Compact and then Comfortable retained the open menu and updated its checked radio. End focused Restart Run; Escape closed the menu. The earlier independent follow-up audit records broader lifecycle/menu behavior separately; this measurement does not imply that every state was re-exercised.

## Actual free implementation reuse and correction

The official configured registry was searched through `npx shadcn@latest search @reui -q dropdown-menu`. Actual free source was obtained with `view @reui/c-dropdown-menu-6 @reui/c-dropdown-menu-7 @reui/c-dropdown-menu-8`. These public free examples explicitly delegate their primitives to `@/components/ui/dropdown-menu`, not to a separate paid implementation.

The leaf now composes the actual **c-dropdown-menu-8** full menu structure: `DropdownMenuGroup`, label, interactive children, separators, another controlled group, and a destructive action in `w-56` content. Controlled checked/radio state follows the actual **c-dropdown-menu-6/7** examples. Existing official radix-nova primitives supply Portal, check indicators, radio semantics, roving keyboard focus, Escape, outside dismissal, disabled styling, ring, shadow, radii, icon sizing and destructive focus colors. No hand-built menu engine or replacement primitive was introduced. Actual free Trace/Marker/Frame/Badge/InputGroup integrations remain intact, with their original provenance and REUI MIT notice.

The actual public view/density retention is implemented with the primitives' `onSelect(event.preventDefault())`; native checked/radio changes still execute. This is an explicitly tested extension to the free examples. Copy and Restart remain normal actions and close. Existing layout-test menu helper now opens only when needed, and explicitly escapes after the final fold selection; its previous effect and history/focus assertions remain intact. This synchronizes the changed behavior rather than weakening the assertions.

The independent state machine, default third-step approval gate, eight fixture steps plus completion, decision outcomes and original Bricklane summary remain unchanged. No extracted reference media or branding is used.

## Typography and shared causes

Measured pre-refinement local and live default menus were **208×246px**, with a 28px single-line Copy Summary in both widths. No current Copy Summary wrapping bug was reproduced. One live desktop sample was captured during its scale-in animation and measured207.219×245.076px; this transient result is retained in raw evidence rather than presented as a second designed size.

Both default portals inherit **Geist Variable** from the document body, while the public reference uses Inter. This is a shared default/body-versus-reference choice, not a reason to hard-code a leaf font. The supported global Inter preset is used for a like-font menu comparison and checks that the portal and body computed font match. Default typography remains honest in the ledger. Menu y106 versus public y109 comes from the header/trigger geometry, outside this narrow menu geometry correction; no added offset masks that difference. The leaf does not change global typography, shared CSS, primitive radius or theme tokens.

## Verification and remaining differences

The independent clean production candidate passed **32/32 cases across the existing Activity suites and the new eight-case menu suite**, using one worker and the normal30s timeout. After strengthening native keyboard coverage with two Space checkbox selections, the final eight menu cases were rerun independently. No workflow/state assertions were removed. Strict whole-candidate build, full1101-file format check, scoped oxlint and three tooling tests passed. The final handoff receipt distinguishes those passes from the standalone-starter strict gate and viewport checks.

A supplemental before/after comparison advanced both old and refined production code to the same **fifth question gate**, at **1440×1000 /390×844, light, DPR1**, using fresh contexts. Default typography and the supported Inter preset were each measured. In all four comparisons,208×246px became224×294px; every page/console error list was empty. Before desktop/narrow x780/138 became x764/122, while y106 remained unchanged. The official positions x767/125,y109 therefore retain a3px header/trigger alignment difference. Both default and Inter cases are retained; font changes are not silently mixed into an apparent geometry improvement.

The actual UI-downloaded starter contains **245 files**. Its leaf, unchanged approval model, existing Dropdown/Trace/Marker/InputGroup/Frame/Badge implementations, REUI MIT/Inter OFL and third-party notices are verified byte for byte;237 bundled files match their clean candidate counterparts. Generated standalone scaffolding is checked separately rather than falsely compared with gallery scaffolding. See the handoff receipt for the exact archive hash and strict-build/render results.

The handoff manifest and independent receipt contain the exact clean candidate SHA, before/after measurements, source hashes, strict production results, source/copy/file/ZIP comparisons, extracted-starter build and representative1440/390 menu checks. Runtime source, the narrowly synchronized prior test, new menu test and this new ledger are the only publication files. Candidate cache-isolation tsconfigs and `/tmp` evidence are not publication files.

Public measurements establish the light menu at its question gate. Local default and Inter-preset comparisons distinguish the preserved independent approval seed from that gate; the new menu geometry itself does not depend on the active fixture step. Local dark testing is a regression check, not a newly observed official dark comparison. Test success does not establish full pixel parity.

Remaining concrete differences include: the independent first approval gate and billing fixture; reference restart starts its first working step whereas this model resets to its first approval; optional finished rows use the existing history restoration rather than the reference's finished disclosure; the reference's paths setting also removes related row actions whereas the independent existing setting retains its accessible standalone actions; the earlier reference audit observed Copy temporarily relabelling Copied and retaining the menu, while this narrow menu batch preserves its existing normal-action close and toast behavior. Retry insertion, public completion counts, exact row icon/spacing/header geometry and every original lifecycle remain separate follow-up work. Those limitations are not hidden by menu styling or generalized to a full Activity1 match.
