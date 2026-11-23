# Flux failure triage

The Failures destination uses an original layout within Flux's established shell: a compact metrics strip, a failure ledger with search and filters, and a full-height run review sheet. The layout, fixture tasks, owners, IDs and payloads were authored locally. Previously recorded route and interaction contracts informed the available workflows; screenshots and proprietary source/assets were not used as a visual specification.

## Scope and assumptions

- `#/template-preview/flux/runs/failures` and `#/templates/flux/runs/failures` open the failure ledger. All runs has its own `/runs/all-runs` destination and retains the existing RunTree. Run Queue remains a separate follow-up.
- Hash routing preserves opaque query bytes and supports browser Back/Forward. Other Flux views retain session-local navigation.
- The ledger begins with eight independent demonstration records. The metrics cover all records, while the record count, table and CSV export reflect the intersecting status, error, agent and text filters. Exposure is the sum of refund amounts on active records; backoff and payload counts exclude dismissed records; owners counts distinct owners on active records.
- Records, filters and table state survive navigation within this mounted Flux session. Reloading resets them. Opening another browser tab creates an independent local workspace.
- Log failure validates required details and positive whole step counts, then reveals the newly created record by clearing filters, sorting and page offset. New IDs are generated monotonically within the session.
- Details and payload edits require explicit save. Invalid JSON and nonobject JSON cannot replace a payload; an empty value removes it. Unsaved edits disable retry/dismiss until saved or discarded. Closing the sheet discards unsaved edits.
- Retry appends a queued manual attempt, then records the current fixture error after a short local simulation. No remote run, tool, provider, payment or refund is executed. A seeded or manually imported Retrying record can be processed with Run queued retry. Dismiss or saving a status other than Retrying cancels any pending simulation and retains the ledger record.
- Dismiss and save offer Undo within the run review using the free ReUI AlertAction, keeping the action inside the native modal boundary. Deletion offers Undo after the sheet closes. Replacement Undo only applies while its exact previous revision remains current, preserving newer edits or retry completion. Deletion Undo is idempotent and preserves the user's current filters.
- Dates are explicitly rendered in UTC. Export is a CSV of the filtered records. Clipboard copy reports platform failure when clipboard permission is unavailable.

## Free component reuse

The implementation uses the existing official free ReUI DataGrid and its column headers, visibility, scroll area and pagination. Free ReUI Frame, Badge, Alert and Timeline provide the actual metric, status, error and history components. The existing free `c-sheet-1` SettingsDrawer and `c-select-27` DescribedChoice compositions provide native overlay and selection semantics. Field, FieldGroup, Input, Textarea, InputGroup, Tabs, Button and Empty use the installed Radix/Base primitive adapters. The logging form uses the existing free ReUI NumberField.

SettingsDrawer receives one optional `className` extension so the Flux consumer can own its layout without changing other callers. Custom code is limited to the domain model, route ownership, fixture simulation, CSV serialization and responsive arrangement; the free library does not supply these Flux domain rules. The earlier hand-styled status tags and the draft's four-card arrangement were replaced by actual ReUI Badge components and an original summary strip.

## Validation

`tests/flux-runs-model.test.mjs` exercises the meaningful state and route boundaries. `tests/flux-failures-native.spec.ts` exercises desktop/mobile filtering and empty states, CSV export, editing, payload validation and copy, retry attempt history, dismiss/delete Undo, logging validation, browser history and both mount kinds. `tests/flux-failures-source.spec.ts` checks exact rendered, clipboard and single-download bytes for all ten new implementation files, plus the complete licensed project archive. The quick-link native test keeps its original disclosure and nonfailure shortcut checks while replacing its obsolete Failures-to-RunTree alias assertions with the dedicated ledger route.

TypeScript, both production bundles, eleven model/route tests, desktop/mobile interactions, and exact source-byte/ZIP checks completed locally for Radix and Base. Both actual downloaded archives also passed their normal strict production build and standalone create/navigation/history checks with all original archive members unchanged. Those consumer builds reused installed dependencies; they do not represent a fresh install. The coordinating root retains the detailed receipts and original failure evidence. This private candidate has not been published to a cloud environment.
