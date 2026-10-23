# Agent Activity1 native reference observation

Observed2026-10-23 through the unlocked Mac Edge native accessibility tree and screenshot. Reference: https://reui.io/preview/radix/agent-activity-1 . No reference image or extracted asset is distributed in this repository or starter downloads.

## Observed desktop state

The public preview was paused at its question gate. A compact title/status/menu header sits above one visible sequence: four completed rows, a highlighted question row with supporting text and a full-width inline answer field/Send action, then muted queued edit/approval/tool rows. A separate quiet footer shows current-step count and elapsed time. Row actions include clipboard and open-target controls; monospace paths/provider tags remain secondary to each label. The reference header does not show our extra agent/run description or full-width progress bar, and its completed rows remain individually visible rather than grouped behind a finished-step disclosure.

This is one observed desktop state only. The original question submission, run menu, approval, retry and completion transitions were not exercised. Original wording and fixtures are reference context; Bricklane retains independently authored labels/data and licensed or original media.

## Remaining implementation differences

The published `agent-activity-approval.tsx` is an independent functional composition from actual free ReUI Trace/Marker/Frame. It has a taller multi-row header, run metadata/progress, a finished-step Collapsible and a separate active-step surface. These are material differences from the observed desktop composition. A later narrow refinement should reuse those actual free primitives while aligning the compact header, persistent sequence, gated inline form and footer, preserving the tested approval/answer state machine.

## Mobile evidence limit

Opening DevTools confirmed an iPhone16 preset at393×852. Before the following screenshot, the foreground browser switched to a different Mesh tab. That screenshot does not establish Activity1 mobile rendering. No mobile comparison or successful reference lifecycle behavior is claimed. Background browser capture/DOM calls had timed out; native accessibility and desktop capture now work.
