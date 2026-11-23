# Flux Run Queue

All runs opens the Run Queue at `/runs/all-runs`. It combines grouped run records, search, status and attention filters, native row actions and a run inspector. The workspace uses an original layout and twelve locally authored records. It follows the existing Flux routes.

## Route and state contracts

- Both `#/template-preview/flux/runs/all-runs` and `#/templates/flux/runs/all-runs` open the queue. Standalone downloads use `#/runs/all-runs`.
- The existing RunTree remains available through Run tree at `/runs`, including both public mount kinds and standalone downloads. Overview retains its existing embedded tree. Failures stays at `/runs/failures`.
- Switching between these destinations preserves opaque query bytes and browser Back/Forward behavior. Other Flux views keep their session-local navigation.
- Queue and Failures use independent local demonstration records. Each workspace retains its records, filters and view state while Flux remains mounted. Reloading resets them; another tab gets a separate workspace.

## Queue behavior

- Agent and Status grouping build parent and child rows from matching records. The ReUI expansion controls collapse individual groups or all groups. None shows a flat list. Each matching record appears once in every grouping.
- Search, status and Needs attention filters intersect. Acknowledging a failed run clears its attention flag and keeps its Failed status. The summary covers all records. The table count and CSV cover matching records, including those in collapsed groups.
- Start next chooses an eligible queued run within the current filters, in High/Normal/Low priority and then enqueue-time order. Flagged runs require review before starting. Row actions can start, hold, cancel, return a held run to the queue, queue a terminal run again, or flag/acknowledge attention.
- Starting a run schedules a short local simulation. It records the authored outcome of Succeeded or Failed, step progress and a history event. Failed simulations raise an attention flag. Seeded Running records represent snapshots of earlier runs.
- Cancel stops a pending simulation and retains the record and history. Queuing a record again preserves attention flags and its earlier history, resets progress, and records a new queue timestamp.
- Creation validates task and step count, plus a review reason when flagged. It assigns a monotonic ID, clears stale filters and expands groups so the new run is visible.
- Details require explicit save. Step totals are editable while Queued or Held. Started or terminal records retain their historical totals. A pending simulation temporarily disables detail editing. Closing discards unsaved edits.
- Save and inspector actions provide Undo inside a free ReUI AlertAction within the native modal boundary. Row-menu mutations offer a toast Undo after their menu closes. Undo applies only while its exact resulting revision is current, preserving a later edit or completion.
- Run IDs can be copied from the inspector, with local success/failure feedback inside the sheet. Dates use UTC. CSV quotes fields and retains authored text and newlines.

## Actual component reuse

The actual official free ReUI DataGrid supplies rendering, column headers, visibility, scrolling and tree expansion. Free Frame, Badge, Timeline, Alert/AlertAction and NumberField supply the remaining major surfaces. The existing official `c-sheet-1`, `c-select-27` and `c-checkbox-5` adaptations supply native sheet, described-choice and checkbox compositions. Field/FieldGroup/FieldSet, Tabs, InputGroup, ToggleGroup, Empty and buttons use the installed Radix/Base adapters.

Custom code supplies queue records, grouping, filter intersection, state transitions, simulation, revision-safe Undo, CSV and responsive arrangement. Source targets promote all nine new implementation files while retaining Flux/evaluations/memory as the established first source choices. Full downloads retain the free components and their notices.

## Validation

Twelve queue model tests and eleven existing Failures and route tests passed. The candidate built for both foundations and passed desktop and mobile queue interactions, navigation through Run tree and Failures, browser history, and source checks. Both downloaded projects passed fresh dependency installs, strict production builds and standalone navigation checks. The native tests confirmed that queue edits preserve group expansion and return focus to the opener.
