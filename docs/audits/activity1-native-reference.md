# Agent Activity1 native reference observation

Observed2026-10-23 through the unlocked Mac Edge native accessibility tree and screenshot. Reference: https://reui.io/preview/radix/agent-activity-1 . No reference image or extracted asset is distributed in this repository or starter downloads.

## Observed desktop state

The public preview was paused at its question gate. A compact title/status/menu header sits above one visible sequence: four completed rows, a highlighted question row with supporting text and a full-width inline answer field/Send action, then muted queued edit/approval/tool rows. A separate quiet footer shows current-step count and elapsed time. Row actions include clipboard and open-target controls; monospace paths/provider tags remain secondary to each label. The reference header does not show our extra agent/run description or full-width progress bar, and its completed rows remain individually visible rather than grouped behind a finished-step disclosure.

This desktop observation was followed by the mobile observation below. The original question submission, run menu, approval, retry and completion transitions were not exercised. Original wording and fixtures are reference context; Bricklane retains independently authored labels/data and licensed or original media.

## Remaining implementation differences

The published `agent-activity-approval.tsx` is an independent functional composition from actual free ReUI Trace/Marker/Frame. It has a taller multi-row header, run metadata/progress, a finished-step Collapsible and a separate active-step surface. These are material differences from the observed desktop composition. A later narrow refinement should reuse those actual free primitives while aligning the compact header, persistent sequence, gated inline form and footer, preserving the tested approval/answer state machine.

## Mobile observation and evidence limits

The first attempted mobile screenshot showed a different Mesh tab and is not evidence of Activity1. A later fresh, owned Edge tab successfully captured the Activity1 preview at the DevTools iPhone16 preset393×852. The card has an approximately24px horizontal inset and345px width. Its compact title/status/menu remain inline. Completed-row durations stay at the right; secondary paths/provider labels wrap below the title with copy/open actions. The shaded question panel keeps its supporting copy, single-line answer field and Send action together. Queued edit, high-impact approval and tool rows remain visible, followed by the quiet step/elapsed footer.

The native accessibility tree also observed the automatically running fourth step at0:17, including42% progress and Pause, followed by the fifth-step question gate at0:29 with disabled empty Send. This establishes that specific test→question transition only. Submitting an answer, the run menu, pause behavior, approval/retry and completion remain unverified. Before submitting the planned non-sensitive demo answer, the Mac locked again; no submission is claimed. Background browser capture had timed out earlier; native AX and screenshots worked during the unlocked observation. No reference screenshots/assets are saved into distributions.
