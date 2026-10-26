# Activity 1 public interaction follow-up — 2026-10-26

## Scope and evidence method

This is a new, read-only follow-up to [the original native reference observation](activity1-native-reference.md). It records newly exercised behavior; it does not retroactively claim that the earlier observation or the compact implementation batch covered these branches. The existing runtime, independent workflow model, tests and earlier ledger were not changed for this audit.

Reference: [official Activity 1 public preview](https://reui.io/preview/radix/agent-activity-1). The browser extension had recovered on 2026-10-26. A fresh inventory identified Edge browser `1`, then an agent-owned tab `986146404` was created in a separate `🔎 Activity1 follow-up` session. Actions stayed on that exact public preview. No human tab, authentication, purchase, account connection, paid source, reference asset extraction or real production service was involved. Answers were original, non-sensitive demo text. Observations came from fresh rendered DOM snapshots, semantic UI actions, inline screenshots and read-only DOM bounds. Screenshots were inspected inline only: no original screenshot, SVG or media was saved into the repository, frozen evidence or downloadable projects. Unrelated browser-injected assistant decoration was excluded from the component observations.

The ordinary desktop viewport was initially used, followed by explicit **1440×950** and **393×852** overrides for density and narrow layout. The temporary override was **reset** after the final operation. Independent local 390px tests from the compact batch remain separate evidence. The extra evidence file is a structured transcription of visible states and measured bounds, not application source or hidden state.

## A. Answer → Approve → retry → completion

The initial fresh tab advanced to the fifth-step question gate. Empty Send was disabled. An original answer requesting a refunds-only demo change was entered and sent; its exact text remained beneath the Answered row. The edit became active, then the seventh-step approval appeared with its high-impact warning. This reconfirmed answer → edit → approval without inferring unseen early decisions.

Approve was actually clicked. Its row became **Approved by you**, and the dependent `scale_app` tool became the active eighth step with visible progress. Subsequent DOM and screenshot evidence showed an expanded retry sequence:

| Visible state               | Result                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| First tool attempt          | Timed out; Retried badge, no API acknowledgement explanation, displayed duration **0:30** |
| Added second attempt        | Recovered on attempt 2, displayed duration **0:06**                                       |
| Independent last issue step | Opened HAL-482, displayed duration **0:02**                                               |
| Completion                  | Header Complete; Run complete summary **1 to check, 1 retried, 1 changed**                |
| Footer                      | **10 steps · 1:16**                                                                       |

The retry creates an extra visible execution row. The original is therefore **not a fixed nine-row lifecycle** on this branch. These are public demo labels and displayed fixture durations; no claim about a real tool invocation or real API timeout is made.

An initial attempt to click Pause during this tool phase found that the control had already expired as the run completed. That failed target is **not** counted as a successful pause. The separate successful pause experiment is recorded below.

## B. Restart → answer → Deny → completion

A new run was started through Restart Run. After the successful pause/resume experiment below, that same restarted run reached question five. The default view settings were restored and verified. A separate non-sensitive answer requesting unchanged demo capacity was submitted, followed by an actual click on Deny at approval seven.

Observed results:

- The approval row became **Declined by you**, with a distinct Declined badge. Its supporting impact explanation remained visible even with Step Notes off.
- The dependent execution row became **Skipped, you declined it**, with a Skipped badge and struck-through title. It did not run or produce the retry sequence.
- The independent issue step still ran and completed; denying the execution did not skip the entire remaining workflow.
- Completion summary was **1 declined, 1 skipped, 1 to check, 1 changed**. Footer was **9 steps · 0:40**, header Complete.

The distinction between approval declined and execution skipped is visible in separate rows and badges. This is newly observed reference behavior, not evidence that the existing independent billing fixture already matches these words or counts.

## C. Actual Pause / Resume

Restart Run was followed immediately by a click on the actual Pause control while the first Thinking step was running. The header changed to Paused; the control became Resume. The active progressbar read **13**, the row showed **13%**, and the footer remained **Step 1 of 9 · 0:00**.

A fresh baseline snapshot was recorded. Menu inspection and screenshot review took place while paused. **33.624 seconds** later, a second rendered DOM snapshot still showed that same step, progress13 and displayed elapsed0:00. No fixed sleep or assumed timer duration was used as a substitute for inspecting the state.

Resume was actually clicked. The header returned to Working and the control became Pause. A later fresh snapshot showed the fifth question gate at **0:29**, establishing that the run really resumed and progressed. This establishes freezing and continuation of the **visible demo step, percentage and elapsed display** in this experiment. It does not establish internal timer implementation, elapsed-time accounting under every branch, browser background behavior or network cancellation.

## D. Run options: checked state, real view results and restoration

The actual menu has three groups: View, Density and Run. Initial defaults were **File Paths on; Step Notes off; Fold Finished Steps off; Comfortable selected**. Each relevant control was then exercised, not merely found in metadata.

| Control                | Actually observed result                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| File Paths off         | Secondary target/path/provider values disappeared, including the related Copy/Open controls. Core titles, provider badges, state badges, durations and essential notes remained. Turning it back on restored references and their actions.                                                                                                       |
| Step Notes on          | Added supplemental explanations for documentation, reproduced test, approved action, recovered execution and created issue. Turning it off removed these optional details. Essential check warning, typed answer, retry error explanation and declined impact detail remained visible when off.                                                  |
| Fold Finished Steps on | Completed sequence collapsed into a **Finished 10 steps 1 to check** disclosure in the approved-completion state; Run complete and footer stayed visible. Clicking that disclosure restored the completed rows. At the later question gate, with folding selected, a Finished4steps disclosure preceded the active question and its queued rows. |
| Fold availability      | At the newly restarted paused first step, Fold Finished Steps was checked but disabled because no finished rows existed. Preferences were retained across restart. No general claim about every enable/disable threshold is made.                                                                                                                |
| Compact                | Reduced row spacing while preserving the header height and content. Actual bounds below. Selecting Comfortable restored the original spacing.                                                                                                                                                                                                    |
| Copy Summary           | Remained in the menu after activation, temporarily relabelled Copied. Actual safe clipboard read is recorded below.                                                                                                                                                                                                                              |
| Restart Run            | Actually reset the demo to its working first step in this experiment; retained the selected view preferences.                                                                                                                                                                                                                                    |

View, density, Copy Summary and Restart selections left the menu open in the observed interactions; Escape closed it. The observed default final settings were restored to File Paths on, Step Notes off, Fold Finished Steps off and Comfortable. The application fixture was left complete; browser viewport was reset.

Density bounds were read from the rendered card and header only. Different completion branches have different numbers of rows and notes; cross-branch heights should not be compared as an isolated density effect.

| Branch / viewport                  | Card width | Comfortable height | Compact height | Header height | Card x / y |
| ---------------------------------- | ---------: | -----------------: | -------------: | ------------: | ---------- |
| Approved retry completion,1440×950 |      576px |              566px |          486px |     44px both | 432 / 64px |
| Denied completion,393×852          |      345px |              806px |          734px |     44px both | 24 / 64px  |

At393px, the default denied-completion card extends to y870; its lower footer needs normal vertical scrolling. The narrow card has the observed24px side inset, secondary references below titles and durations to the right. `document.documentElement.scrollWidth` was393, matching the393px viewport, so this state had no horizontal overflow. This does **not** claim every completion fits into a single852px-high viewport.

## E. Copy Summary: safe read of the page's own new copy

Copy Summary was clicked in the owned tab after the approved retry completion. The menu visibly changed that specific item to Copied. A later read attempt was deliberately withheld once the indicator had expired; no clipboard residue was inspected. Copy Summary was then invoked again, and **only after immediately confirming the Copied item** was the browser clipboard API used to read the just-written public demo summary. No human clipboard contents were consulted.

The returned plain text was the current run title, step/time heading and one bracketed state/title/target line per execution row. It included the retried first attempt and recovered second attempt, so the copy action succeeded. Two reference limitations were directly observed:

- The visual completion footer said **10 steps ·1:16**, while the copied heading still said **Step9of9,1:16**. This is an observed reference inconsistency; this audit does not silently normalize it.
- The summary contained the Answered row title and target but **not the independently entered answer's supporting text**. It is not a complete verbatim transcript of every visible note.

Only the controlled page's own public fixture data was read. The full copied payload and original screenshots are not included in this document or distributed as implementation assets.

## Consequences for later implementation work

These new observations reduce the reference-evidence gaps for Approve, Deny, Pause/Resume, menu effects and copy success. They do **not** turn the preceding compact batch into a full lifecycle match. Its explicitly preserved independent model still starts at approval three, uses eight workflow steps plus completion, has no inserted retry execution, reports recorded-work duration rather than this displayed reference timeline, and uses original billing fixture wording/counts. Its local File Paths setting currently leaves standalone row actions available, its optional fold uses its footer history action rather than this reference disclosure, and its local menu selections close. Those are concrete remaining differences supported by the follow-up.

Any later model or menu-fidelity batch must be separately scoped and coordinated, build on the actual free ReUI Trace/Marker/Frame/InputGroup implementations already audited, preserve original Bricklane assets and MIT/OFL attribution, update the true source leaf as necessary and run its own lifecycle/source/real-ZIP tests. No runtime correction is bundled with this document. Public UI observations do not grant access to paid implementation or assets.
