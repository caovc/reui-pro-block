# Contract native revision review

Baseline: `2729cba47f480984acb8ec0e5336269575033d42`. This milestone covers Contract 3; collaboration, assistant workflows, mode projections and navigation remain separate work.

## Behavior

- Review cards aggregate all native text revision fragments, including text split by formatting. Single review and Accept all / Reject all share one resolver using fresh native document positions.
- A whole review uses one document-changing transaction with native history boundaries before and after it. One Undo/Redo restores the full review; immediate subsequent typing remains a separate event. Unrelated marks and untouched block attributes survive.
- Locked/readOnly review controls and zero-change bulk actions are disabled. Menus use the actual installed free ReUI DropdownMenu/Button/Badge and the free `c-dropdown-menu-12` `w-48` composition. No custom menu primitive or history stack was introduced.
- Attribute-specific revision parsing has rule priority 60, above StarterKit’s generic `del` rule at default 50. Mark names, attributes, serialization, schema rank, ordinary strike rules and the 300ms history delay are unchanged.
- Source preview keeps editor.tsx as default and explicitly includes the real `rich-text-revisions.ts` helper. View/copy/file/project downloads must carry the same implementation.

## Actual reuse and custom scope

The actual free components are `src/components/ui/dropdown-menu.tsx`, `button.tsx` and `badge.tsx`. The pinned public free menu example is [c-dropdown-menu-12](https://github.com/keenthemes/reui/blob/067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a/registry-reui/bases/radix/components/dropdown-menu/c-dropdown-menu-12.tsx). No existing free primitive was reimplemented; the previous DOM first-fragment reader was replaced with native document aggregation. Revision resolution is custom Tiptap glue because the free library does not supply this full tracked-review engine. Frame was audited but no new Contract Frame reuse is claimed in this batch.

Bricklane branding and local assets remain unchanged. The existing ReUI MIT notices, third-party notices and font OFL files are retained; no Pro source, paid media, original-site avatars or extracted brand assets are introduced.

## Evidence and bounded verification

The private evidence directory is `editor-fidelity-audit/contract-review-2729-v5` under `bricklane-recovery-20261102`. Product/source/original-project gates are recorded with exact reports, raw ZIP, member manifest and cleanup receipt. These private traces, installations and downloaded projects are not part of the source payload.

The four new real-UI cases cover Accept/Reject at 1440 and 390px: native/DOM-synchronized selection, bold-split insertion/deletion, complete summary, native JSON, kept formatting, unchanged other blocks/attributes, lock controls, menu Escape/focus, one-event bulk Undo/Redo and a keystroke inside 300ms independently undone. The final menu screenshot additionally waits for actual computed opacity 1; no sleep, force, state injection, retries or larger budgets are used.

The original term/fee and suggesting/editing business cases remain unchanged. They passed in v4; v5 changes only menu width and screenshot readiness. The final original downloaded project repeats those two plus the four new cases. Its external QA adapts only the runner import and the generated standalone title; received entry/package/config/source files are untouched.

Baseline evidence is preserved: v1 intentionally reproduces summary `45 days` becoming `4` after real Bold; v2 stops at an incorrect QA title expectation; v3 exposes original deletion markup parsed as ordinary strike with lost revision ID. v4 passes functional and original-package gates but its narrow menu and mid-animation screenshot are superseded by v5. Separate private AST script preparation mistakes were corrected without changing product or native assertions.

## Limits

- This is a Contract review milestone, not full fidelity for editors 3/4/5. Final/Original views, richer author/time metadata, multi-fragment navigation, responsive review dialogs, Yjs collaboration and tracked assistant planning remain separate.
- Ambiguous overlapping revision marks are declined without mutation or a success toast; conflict UX is not implemented. The first slice does not certify arbitrary cross-block revisions, IME or all external Link entry paths.
- Existing persisted HTML that still contains explicit revision markup is parsed correctly. Content already saved as ordinary strike with its revision ID lost cannot be inferred or reconstructed automatically.
- All editors share the parser. Explicit revision HTML now receives the existing revision marks; this is not a blanket zero-effect claim for external or stored documents. Ordinary strike parse rules/rank are preserved; arbitrary HTML imports and inline atom label summaries are not certified by these text-based scenarios.
- Root owns final main integration, normal hooks, push and CI/Pages verification. Passing private gates is not a deployment claim.

## Final v5 gates

| Gate                                                                           | Result                                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Private normal npm ci/postinstall, original build, scoped oxlint/oxfmt         | Exit 0                                                                |
| Source-files catalog tooling                                                   | 2 passed                                                              |
| New desktop/mobile native review cases                                         | 4 passed, 16.244s, W1/R0                                              |
| Actual default/helper source, clipboard, single file and full ZIP UI           | 1 passed, 4.686s; source console warnings/errors `[]`                 |
| Received ZIP normal npm install / original postinstall / original strict build | Exit 0, without repairs                                               |
| Received ZIP new four + unchanged two business cases                           | 6 passed, 18.078s, W1/R0                                              |
| All received inputs after install/build/native                                 | 416/416 byte-exact                                                    |
| Final 1440/390px menu screenshots                                              | Reviewed after computed opacity 1; w-48 keeps action text on one line |

Raw final UI ZIP SHA256: `e15a5f2c398f24cb0298e2babe4e993315c141fe91bd7a8265b836e6c80d48e7`. Final cleanup/entry/package/config/generated lock/public/dist and reports are bound in private `delivery-evidence/finally.json`, SHA256 `d476239ecb5246a96391cac2160df2a854928b08a9124309e1d94b98cad0cad1`. Both private preview processes were stopped. These gates do not claim CI or Pages deployment.
