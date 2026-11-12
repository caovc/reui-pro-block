# Filebox auth: free alerts and keyboard recovery

Filebox's local reset flow previously left focus on `BODY` after opening the reset
form, submitting it, and returning to sign-in. This was reproduced at 1440×1000
and 390×844 using native Enter activation before changing the implementation.
The before-state record is `/tmp/filebox-qa-evidence/before.json`.

The flow under test is: Filebox sign-in → Forgot password → native email
validation → local reset confirmation → Tab to Back → Enter → the original
Forgot password control receives focus. Cancelling an unsubmitted reset follows
the same return path. Returning also restores the masked password state, including
when the password was visible before opening reset.

## Actual free component reuse

- The existing official free ReUI `Alert` and `AlertDescription` now render the
  demo sign-in callout and reset confirmation. Their installed implementation
  records `https://reui.io/r/radix-nova/alert.json` as its source and retains its
  MIT attribution. The static callout uses `role="note"`; the local confirmation
  uses `role="status"`. No alert implementation was copied or reconstructed.
- Existing `Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`,
  `InputGroup`/Input/Addon/Button, Card slots, `OAuthIcon`, and `FormDivider`
  continue to supply the forms. Native `required`, email validation, and submit
  behavior remain. Inputs now declare username, current-password, and email
  autocomplete purposes.
- Product-specific focus recovery and the existing local demo reset state live
  only in `filebox-auth.tsx`. The free library does not provide Filebox's
  conditional view transitions. There is no custom keyboard navigation engine.
- The demo callout keeps its existing local spacing and centered copy through
  Filebox-scoped CSS. Original Bricklane branding and existing licensed assets
  remain. No original-site logo, avatar, paid media, or extracted decoration was
  added.

The official Filebox preview and ReUI registry were requested on 2026-11-12;
both returned proxy `403 Forbidden` / CONNECT rejection. The shadcn documentation
command was also attempted; its registry request was cancelled, and the direct
documentation request returned the same proxy rejection. Installed official
source, existing provenance, and local rendered behavior supply this batch's
evidence. No new original-site visual or interaction comparison is claimed.

## Local verification

Browser plugin not available. Playwright used `/usr/bin/chromium`, one worker,
zero retries, the existing `.qa/onboarding.playwright.config.ts`, and the shared
`http://127.0.0.1:5173` server. Viewports were 1440×1000 and 390×844, DPR1, light
theme. Artifacts are outside the repository under `/tmp/filebox-qa`.

- The first native/regression run passed seven cases: Filebox auth/reset and
  direct-settings lifecycle at both widths, Filespace's unchanged original
  login at both widths, and the previous Filebox reset/sign-in regression.
- The next existing desktop Header case reached its final notification-close
  focus assertion when the 30-second total test budget expired. The trace
  records slow navigation and individual clicks across the run; the final
  assertion had only 58ms before cancellation. Eight later cases did not run.
  The failure and trace remain at
  `/tmp/filebox-qa/native/templates-drive-header-fil-812e9-me-preserve-the-local-route/`.
  No assertion or timeout was weakened.
- A separate Base-native run passed both widths, including required validation,
  focused reset input and confirmation, native Tab/Enter return, masked password,
  and unchanged hash query. Artifacts are in `/tmp/filebox-qa/base`.
- Six final Radix screenshots were actually viewed: initial auth, focused reset
  input, and reset confirmation at both widths. Controls fit the viewport, no
  horizontal document overflow or framework overlay appeared, and the native
  auth suites recorded no page errors, console warnings/errors, or HTTP writes.
- Scoped oxfmt, oxlint, and `git diff --check` passed for the four owned source
  and test files.

## Final production preview

After the coordinator completed the production build and froze runtime source,
the same 19 selected cases passed on `http://127.0.0.1:5175` in 1.7 minutes with
one worker and zero retries. The command was:

```sh
PREVIEW_URL=http://127.0.0.1:5175 npx playwright test \
  -c .qa/onboarding.playwright.config.ts \
  tests/filebox-auth-free-fields-native.spec.ts \
  tests/filebox-source-original.spec.ts \
  tests/template-interactions.spec.ts \
  tests/templates-drive-layout.spec.ts \
  tests/templates-drive-secondary-layout-native.spec.ts \
  tests/templates-drive-header.spec.ts \
  --grep 'Filebox|filebox|Filespace host' \
  --workers=1 --retries=0 --max-failures=1 \
  --output=/tmp/filebox-qa/production
```

The final run covers eight auth/settings cases including Base and the unchanged
Filespace login, ten existing Filebox reset/Header/list/grid/sidebar/layout
cases, and the actual Source/Copy/single-file/project ZIP case. The previously
timed-out Header desktop case passed unchanged in 10.6 seconds. Its earlier
failure is retained separately; neither the test budget nor its assertions were
changed.

The real Download project action produced a 258-member original archive with
SHA256 `99fffad3de5facddde5f4636c1c377b73b6a5b710b4dd294ea9c02e8094639fa`.
The three selected complete sources matched the filesystem, rendered code,
clipboard, individual downloads, and original ZIP members. The archive closure
verified 229 source files byte-for-byte, resolved 827 local import edges, and
reported no missing or undeclared imports. It includes the actual unchanged
ReUI Alert implementation and required MIT/OFL/third-party notices. SourceTargets
needed no change. The original entry, scripts, and strict configuration remain
unaltered. These results do not claim a separate installation, standalone build,
or runtime execution of that downloaded project; none was performed this round.

Production evidence is in `/tmp/filebox-qa/production`, including
`filebox-source-original-Fi-e40f1-ngle-files-and-original-ZIP/filebox-source-four-way-proof.json`
and `source-closure-proof.json`. This owner did not run a whole-repository build.

Dark theme, other browser engines, real authentication/reset email delivery,
complete original-site parity, and full-template QA are outside this batch.
Drive's shared routing/model/components/styles, SourceTargets, dependencies, and
lockfile were not changed by this owner. Commit, push, CI, and Pages status belong
to the coordinating release session.
