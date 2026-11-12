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
and `source-closure-proof.json`. Six production Radix screenshots were actually
viewed: initial auth, focused reset input, and confirmation at both widths;
unaltered copies are in `/tmp/filebox-qa-evidence/production-*.png`. A separate
GPT-6.1 sol xhigh agent performed a read-only review of the five owned files and
found no actionable defects; it ran no browser, tests, or build. This owner did
not run a whole-repository build.

Dark theme, other browser engines, real authentication/reset email delivery,
complete original-site parity, and full-template QA are outside this batch.
Drive's shared routing/model/components/styles, SourceTargets, dependencies, and
lockfile were not changed by this owner. Commit, push, CI, and Pages status belong
to the coordinating release session.

## Public reference follow-up

Later on 2026-11-12, the configured network policy allowed the public preview.
Read-only Chromium checks reached the real, visible auth fields at
`https://filebox-drive.reui.io/login`, with HTTP 200 and the title
`Sign In - ReUI Drive`. Browser plugin not available; the existing system
Chromium and Playwright ran outside the filesystem sandbox to use the existing
trusted root CA, inherited `HTTPS_PROXY`, and retained TLS verification. No CA
was imported and certificate errors were not ignored. Every non-GET/HEAD/OPTIONS
request was blocked by the probe; none was attempted. No OAuth or reset submit
was activated.

The reference was sampled at 1440×1000 and 390×844, DPR1 and light theme, after
the password input was visible and fonts were ready. The actual screenshots
and measured DOM records are outside the repository at
`/tmp/filebox-reference-2026-11-12/{auth,forgot,back}-{1440,390}.{png,json}`.
All six auth/Forgot/Back images were actually viewed.

| Surface          | Reference at 1440px                         | Reference at 390px                    | Local discrepancy addressed                                                           |
| ---------------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| Sign-in card     | 416×480.5, header padding 36px 32px 0       | 358×508.5, header padding 32px 24px 0 | Shared Drive padding and additional heading spacing made desktop controls lower.      |
| Sign-in content  | padding 28px 32px 32px                      | padding 24px                          | Scoped slot padding replaces inherited shared geometry.                               |
| OAuth            | 170px buttons, 12px gap                     | Stacked 310px buttons, 12px gap       | Desktop previously used 166px buttons and a 20px gap.                                 |
| Identifier       | `type=text`, autocomplete username          | Same                                  | Local `type=email` rejected plain usernames.                                          |
| Reset card       | 384×320.25                                  | 358×340.25                            | Local reset reused the larger sign-in card and centered its mark.                     |
| Reset card slots | Card padding 16px 0, gap 16px; slots 0 16px | Same                                  | Scoped reset slots and an 8px button-group gap replace the inherited sign-in spacing. |

Native Enter on Forgot navigated to `/forgot-password`, focused the empty
`type=email` field, and changed the title to `Reset Password - ReUI Drive`.
The reference Back control is an anchor with `role=button` and `href=/login`.
Native Enter returned to `/login` with a masked password and the default demo
value; focus fell to BODY at both widths. The reference also normalized the
login query, collapsed duplicate keys, and discarded it on Forgot/Back.

Filebox now accepts a plain username and uses its existing free `Button` for
Forgot, replacing the raw button. Existing Card slots, Field/InputGroup,
OAuthIcon/FormDivider, and the actual official free ReUI Alert remain in use.
Only Filebox-scoped CSS adjusts natural card/header/content dimensions, heading
typography, the original Bricklane mark's container size, and form spacing.
The local reset's Back arrow was removed to match the observed text control.
No transform, new dependency, shared Drive change, or paid reference asset was
introduced.

Local demo behavior remains intentional: the required sign-in fields and reset
email validation remain; OAuth still explains the demo; reset submission only
shows the existing local confirmation. Returning restores focus to Forgot and
masks the password. The reference's BODY focus loss is not reproduced. The
original local hash and raw query survive these state changes. Bricklane's
original brand mark, `bricklane.example` demo address, example.com placeholder,
and existing license notices remain.

The native regression now checks the measured card dimensions and desktop
OAuth gap, verifies that reset remains an email field, and submits an actual
plain username into the local workspace at both widths. Source hashes were
updated for the two owned implementation files. Scoped oxfmt, oxlint, and
`git diff --check` passed. Playwright loaded the nine selected native and
existing reset cases with `--list`; this did not start a browser. New production
validation and export evidence will be recorded after the coordinating rebuild; the earlier
19-case production artifacts above are preserved and do not validate these
follow-up changes.

### First follow-up production run and grid correction

After the coordinator completed the new dual production build, the nine-case
selection ran on `http://127.0.0.1:5175` with the system Chromium, the existing
`.qa/onboarding.playwright.config.ts`, one worker, zero retries, and
`--max-failures=1`. The result was **one passed, one failed, seven not run**.
Base desktop reset/focus passed; Radix desktop stopped at the new sign-in card
height assertion. The card was 484.5px high versus the measured reference's
480.5px, and its form content was 2px lower. The assertion and its 0.75px
tolerance were not weakened. The failure screenshot was actually viewed, and
its recorded application faults were empty. Evidence remains in
`/tmp/filebox-qa/reference-followup-production-native`; the complete command
output remains `/tmp/filebox-reference-followup-production-native.log`.

A separate short read-only DOM probe confirmed the cause at both widths and
both sign-in/reset states. The actual free CardHeader's conditional two-row
grid matched the descendant description inside Filebox's single heading
wrapper. Its computed rows were `102px 0px` for sign-in, `92px 0px` for desktop
reset, and `112px 0px` for mobile reset, with an additional `row-gap: 4px` in
every case. Content heights already matched the reference. These pre-fix DOM
measurements and screenshots remain under
`/tmp/filebox-qa/reference-followup-diagnosis`.

The smallest correction sets `display: block` only on Filebox's existing
CardHeader slot. The actual free CardHeader component remains unchanged and in
use; shared Drive styles and other templates are unaffected. The CSS frozen
source hash was updated again. The correction's candidate verification is
recorded below. No new source export result is claimed here, and the earlier
export evidence does not validate the current source.

### Candidate 5180 acceptance

After the coordinator completed the candidate TypeScript/Radix/Base builds,
the unchanged nine-case selection passed on `http://127.0.0.1:5180` in
**54.2 seconds: nine passed, zero failed**, with one worker, zero retries, the
original action/test budgets, and `--max-failures=1`. The command was:

```sh
PREVIEW_URL=http://127.0.0.1:5180 npx playwright test \
  -c .qa/onboarding.playwright.config.ts \
  tests/filebox-auth-free-fields-native.spec.ts \
  tests/template-interactions.spec.ts \
  --grep 'Filebox|Filespace retains' \
  --workers=1 --retries=0 --max-failures=1 \
  --output=/tmp/filebox-qa/reference-followup-candidate-5180-native
```

The full output is
`/tmp/filebox-reference-followup-candidate-5180-native.log`. This run covers
Base keyboard reset/focus at both widths; Radix sign-in/reset geometry, native
validation, confirmation focus, Tab/Enter return, masking, and actual plain
username submission at both widths; direct-settings lifecycle at both widths;
the unchanged Filespace login/reset at both widths; and the existing Filebox
reset-to-workspace case. The geometry assertions retained their 0.75px limit.
The measured control positions now match the reference: desktop OAuth y465.75,
identifier y589, sign-in y716.25; mobile OAuth y365.75/409.75, identifier y533,
sign-in y660.25; reset inputs y491.125/423.125 for desktop/mobile. Sign-in card
sizes 416×480.5/358×508.5 and reset sizes 384×320.25/358×340.25 pass unchanged.

All six same-run Radix images were actually viewed: initial auth, focused reset
input, and local confirmation at both widths. The cards and controls fit,
descriptions wrap cleanly, and no horizontal document overflow or framework
overlay appears. The native suite records no application page errors, console
warnings/errors, or HTTP writes. Required reset email validation, confirmation
focus, native return focus, masking, and untouched raw hash/query all passed.

A short separate screenshot-only evidence script then entered `alex.rivera`
and used the actual Sign in control at both widths. Its four images—typed
username and resulting workspace at each width—were also actually viewed.
The JSON records show `type=text`, a valid plain username, auth removed, Drive
visible, unchanged raw hash/query, no horizontal overflow, and empty page/
console/write fault lists. These artifacts are outside the repository under
`/tmp/filebox-qa/reference-followup-candidate-5180-username`.

No runtime or test source changed during this acceptance run. The failed first
follow-up run and its trace remain preserved. Current Source performance/timing
failures are a separate open gate owned by the coordinator: this owner did not
rerun Source, relax its budget, or claim updated Copy/single-file/original-ZIP
success. The earlier 19-case/source-closure results remain historical evidence
for the previous implementation. Dark theme, other browser engines, real email
delivery/authentication, and complete template parity remain outside this
follow-up. Commit, push, CI, and deployment status remain the coordinator's
responsibility; this owner performed no Git writes or whole-repository build.
