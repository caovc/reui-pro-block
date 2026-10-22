# Centered authentication audit

Inspected on 2026-10-22. Public rendered previews and their visible controls were inspected in the browser; no premium source was retrieved. Five distinct compositions now live in `auth-centered.tsx`; `auth-shared.tsx` supplies the independently retained provider icons. The other 15 auth entries remain in the earlier generic family and still need their individual visual pass.

| Entry | Public reference and observed composition | Implemented correction / checked behavior | Remaining differences |
| --- | --- | --- | --- |
| auth-15 | [Centered Magic Link](https://reui.io/preview/base/auth-15): top wordmark; centered 32px title; email-first form; three provider rows below divider; legal/help footer | Replaced provider-first generic form with email-first composition, icon input/helper, separate footer and local confirmation/resend/back state. Existing magic-link regression passes. | Project font/monogram are independent approximations; footer links open local information. No identity provider or email service is called. |
| auth-16 | [Work Email Continue](https://reui.io/preview/base/auth-16): app header with workspace CTA; 28px title; Google/GitHub/SSO rows; email continuation; five-customer trust strip | Distinct header/footer layout and typography, three provider methods, email confirmation, functional local workspace and SSO dialogs. Workspace creation and email continuation tested. | Trust marks are text rather than exact brand graphics; policy/help content and post-submit states are independent demo content. |
| auth-17 | [Centered Method Picker](https://reui.io/preview/base/auth-17): 40px mark, 20px title, five equal-height method rows, signup/learn-more footer. Email switches to a separate screen. | Restored compact method stack, primary Google action, exact email-screen title/back navigation and no initial email fields. SAML and backup-code dialogs complete local flows; keyboard/form validation works. | Public SAML and backup clicks did not visibly transition in the inspected demo; local dialogs extend those controls. Passkey and OAuth actions show demo feedback. |
| auth-19 | [Invite-Only Sign-In](https://reui.io/preview/base/auth-19): app header with Request invite; bordered left-aligned title/provider/email card; terms outside | Restored distinct invitation header/card geometry and email-only continuation. Request-invite dialog records a local request and confirms; email flow is checked. | Brand details and spacing are approximate. Invite and email confirmation do not send network requests. |
| auth-20 | [Centered Password Login](https://reui.io/preview/base/auth-20): compact 420px card, 20px title, two providers on one row, password/forgot controls; signup outside | Removed generic stacked providers, extra remember checkbox and in-card policy footer. Password visibility, local login result and reset/creation paths work. Provider alignment and computed 20px title tested. | Logo geometry, shadows and subtle spacing differ. Account creation/reset are local previews. |

A site-style leak was found during visual comparison: unscoped `h1` rules overrode block typography. They now target `.page-heading` and `.block-heading`, leaving each preview's Tailwind heading sizes intact. This also keeps exported component typography independent of the website chrome.

All five entries were captured at 1280×720 and 390×720, with no page errors or document overflow. Five persistent auth tests and the existing magic-link test pass; the isolated combined release batch passed 118 tests. This is a partial auth audit, not a claim that all 20 entries match their references.

## Saved production screenshots

| Entry | Desktop | Phone |
| --- | --- | --- |
| auth-15 | [1280px](screenshots/auth-15-1280.png) | [390px](screenshots/auth-15-390.png) |
| auth-16 | [1280px](screenshots/auth-16-1280.png) | [390px](screenshots/auth-16-390.png) |
| auth-17 | [1280px](screenshots/auth-17-1280.png) | [390px](screenshots/auth-17-390.png) |
| auth-19 | [1280px](screenshots/auth-19-1280.png) | [390px](screenshots/auth-19-390.png) |
| auth-20 | [1280px](screenshots/auth-20-1280.png) | [390px](screenshots/auth-20-390.png) |
