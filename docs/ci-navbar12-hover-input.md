# Navbar12 CI input-state diagnosis

## Original failure retained

GitHub Actions run40257879025 at `cbd5c2e0192d7fb747fb5d6817b7c8d23a4866b9` completed1080 tests and failed one: `tests/navbar-final-bars.spec.ts` — “all fourteen mega-menu anchors select local content without breaking the preview route.” The failing action waited for the Insights link under Product pages until the standard30-second test deadline. No retry or timeout increase was applied.

The real diagnostics artifact12623504597 was downloaded using the GitHub API. Its SHA256 is `b8cd3376fdbfcce6207522efa350579ddd6d408f614f3112ac2af4c41b151022`, exactly matching the API digest. The original ZIP and extracted trace are retained:

- `/tmp/bricklane-navbar12-ci-artifact.zip`
- `/tmp/bricklane-navbar12-ci-artifact/navbar-final-bars-all-four-d67ee--breaking-the-preview-route/trace.zip`
- `/tmp/bricklane-navbar12-ci-trace-evidence.json`
- Original complete log: `/tmp/bricklane-templates-r3m2-ci-failure.log`

## Direct trace observations

Treasury was clicked successfully (`arrw@28065`, ending670381.446ms) and its selected-content assertion passed. The next unconditional Product click (`arrw@28070`) started670398.759ms. Its locator resolved a closed trigger at670407.335ms; the input action point was `(556.5,131)`. The click completed670508.005ms. The following Insights action (`arrw@28072`, starting670513.976ms) logged only that it was waiting; it never resolved or clicked a link. Its DOM snapshot has Product `aria-expanded=false`. Final failure context retains Treasury as the selected content and the original preview URL.

The actual screencast frames around670458/670477/670526ms were viewed. A visible panel in these frames is not, by itself, proof that the trigger's expanded state was open: exit animation retains content temporarily. In particular, the action-phase DOM snapshot670464.892ms still shows a closed trigger. The trace directly establishes that the open-intent click ended with a closed menu; it does not record every native pointer event or intermediate React state transition.

## Native implementation and controlled reproduction

The existing consumer actually reuses official free ReUI `c-navigation-menu-4`: `src/blocks/application/navbar-variants/final-bars/free/mega-menu.tsx`. It uses the installed official NavigationMenu/List/Item/Trigger/Content/Link and a controlled `value`. These sources are unchanged.

The installed native implementation opens from mouse pointer movement through `onTriggerEnter`, with a200ms initial hover delay and300ms skip-delay window after an open menu. Trigger `onClick` toggles the current item: an already open item closes. Both are intentional upstream behaviors. A click action includes moving the pointer to its target, so treating every click as “ensure open” is not valid input-state synchronization.

A separate read-only local production diagnostic records actual pointer events and a MutationObserver on `aria-expanded`. It first performs a normal fast click after selecting Treasury, which can correctly open the menu. It then reproduces the slower native interleaving with actual hover, waits for expanded state, and performs an ordinary click. The recording observes false → pointer movement → true → pointerdown/click while true → false. After native exit animation the panel is hidden and Insights is absent. This is a controlled reproduction of the problematic interleaving, not a claim that the original CI trace contains those unrecorded events. No synthetic event dispatch, force click, vendor change or fixed sleep is used. Evidence: `/tmp/bricklane-navbar12-native-events.json` and the companion diagnostic script/log.

## Narrow test correction

Only `tests/navbar-final-bars.spec.ts` changes executable behavior:

- Each of the same fourteen anchor selections uses actual native hover to open its Product/Company panel, then explicitly verifies trigger `aria-expanded=true` and panel visibility before clicking the original link.
- Every original selected-content and route assertion remains. Each iteration additionally verifies the trigger closes and its panel becomes hidden.
- The existing native hover/keyboard/Escape test additionally clicks the hover-open Product trigger and verifies its intentional close behavior. It still verifies Company hover, moving outside to dismiss, Enter/ArrowDown focus, Escape and focus return.
- Existing desktop/phone click-opening coverage, link counts, icon size, geometry, pricing/start destinations, editor interactions and source/export checks remain unchanged.

There are no runtime, CSS, vendor, source-target, UI, dependency or branding changes, and no timeout/retry/force/skip changes. Comparison frozen files are untouched.

## Verification

The isolated candidate is based on clean `3f7d0246c3d7bea010b6b0994db7565f5b763ec0`, with only the corrected test payload. Candidate TypeScript caches resolve inside its own `.tmp` rather than the shared `node_modules/.tmp`. Strict TypeScript/Vite, scoped oxfmt format:check and oxlint pass. All six Navbar production test files pass **77/77 in1.6m**, including both viewport sizes, actual free interactions and source/clipboard/download/starter checks. Log: `/tmp/bricklane-navbar12-ci-fix-all.log`.

The two affected native-interaction tests additionally passed **20/20 in57.8s** (ten repetitions, three workers) against the same production build, using independent output and the unchanged standard timeouts. Log: `/tmp/bricklane-navbar12-ci-fix-repeat.log`. Exact frozen hashes are supplied in `/tmp/bricklane-navbar12-ci-fix-ready-manifest.json`. The original failed artifact remains unchanged. Root alone coordinates the commit, push and separate CI/Pages confirmation; local passing tests are not a deployment claim.
