# Auth5 and Auth7 independent compositions

Reference pages: [Free Trial Signup](https://reui.io/blocks/application/auth/auth-5) and [Magic Link Card](https://reui.io/blocks/application/auth/auth-7). Public rendered previews were inspected on October 22–23, 2026; no licensed Pro source was downloaded. The earlier geometry and state notes remain in `auth-growth-notes.md`.

## Actual free reuse, checked before implementation

Both compositions use the installed official REUI `Frame` and direct `FramePanel` children. The trial card retains the upstream concentric panel radius, frame inset, border variables and panel surface. The blueprint form uses the upstream stacked/dense panels for its form/trust sections; the dashed outer construction lines and corner marks are decorative composition around that implementation. These replace the generic approximation, not simply its import names.

The marketing badge is the actual free REUI `Badge`. Confirmation states use the actual semantic REUI `Alert`, `AlertTitle` and `AlertDescription`. Forms use the stock shadcn `Field` and `InputGroup` implementations which REUI's public Auth5 brief itself lists, including its input addon button for password visibility. The free catalog has no authentication backend or complete trial/magic-link service; validation and local transitions are application behavior. Existing `PasswordAuthForm` is reused for the account dialog rather than reimplementing its reset/account states.

Official free sources: [Frame](https://reui.io/docs/components/radix/frame), [Alert](https://reui.io/docs/components/radix/alert), [Badge](https://reui.io/docs/components/radix/badge). Source provenance and upstream MIT license are included by the existing source/ZIP dependency traversal. Shared upstream components were not changed in this batch.

## Corrected structure and behavior

| Entry | Correction | Available local behavior |
| --- | --- | --- |
| Auth5 | Separate header, marketing badge and 56px two-line headline; orange/pink/lilac moving light field; 416px actual Frame; Google/GitHub before the form; email/password without an invented name field; six-brand footer | Native email/password validation, show/hide password, local trial confirmation, sign-in dialog, provider feedback and policy dialogs |
| Auth7 | Black blueprint canvas, 446px dashed construction frame/corner marks; outlined logo and 24px heading; email input with mail addon; no password or name field; three providers on a row; eight-brand second panel; external legal line | Local magic-link confirmation, resend feedback, return with email preserved, trial dialog and policy dialogs |

Original public form submissions/providers and policy links are placeholders according to the public briefs. Local demo confirmation and dialogs are independent functional additions; they do not represent email delivery, OAuth redirects, account creation or accepted legal agreements.

## Remaining visual differences

- The gradient field is independently implemented with CSS blurred color layers. Its drift trajectory and noise differ from the original artwork.
- Marketing/supporting text is independently written. The structural headline and trial labels have been compared to the visible reference.
- Customer brands reuse the existing attributed free icon assets with text. Slack/Mintlify/Linear symbols and wordmark typography are approximations; exact brand artwork is still pending. `AuthMark` is an independently drawn mark.
- The blueprint grid and crosses follow the visible hierarchy but are not yet certified as a pixel-identical match at every width. Mobile behavior is implemented and tested locally; current reference mobile/state comparison remains a separate gate.
- Additional Auth6, Auth8–14 and Auth18 still need their individual composition/reuse passes. Auth2's review carousel must migrate to the available free Carousel pattern; its existence is not treated as a missing capability.

## Verification

The first isolated production candidate passed 62 browser tests across the new forms, existing auth regressions, Card16–29, charts and website controls. Five dedicated Auth5/7 tests cover invalid/valid submission, password visibility, provider and policy/account dialogs, resend/back state, actual Frame panels, brand counts and desktop/mobile overflow. The final headline/spacing update is checked again before publication. Runnable ZIP builds are an additional gate, recorded by the release coordinator.

Final combined production build passed with **98/98 browser tests** (1.8 minutes). Three actual UI-downloaded starters—Auth7 (175 files), Card24 (175 files), Checkout5 (104 files)—built independently and rendered at 1440px/390px with 14px body styling, no page errors, broken images or document overflow. Auth5 final headline/spacing was included in this run.
