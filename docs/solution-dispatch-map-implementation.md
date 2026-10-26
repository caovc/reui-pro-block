# Dispatch Map M3/M4 implementation ledger

Status: implementation and pure-model milestone; production, strict build, public-to-local visual comparison and real starter build are **pending**. Root owns the SDK integration, shared routing/source selection, Git, CI and Pages. This ledger does not mark the new entry as released or visually complete.

## Handoff and public reference

- Entry: Dispatch Map, `solution-map-1`, Solutions / Map.
- Public reference: <https://reui.io/blocks/solutions/map/solution-map-1>.
- Public preview: <https://reui.io/preview/radix/solution-map-1>.
- Inherited plan and structured public audit: `/tmp/bricklane-solution-expansion-plan-path`, `development-plan.md`, `evidence.json`, `external-sources.json`.
- The prior owner inspected light/DPR1 at 1440×1000 and 390×844. Public images were inspected inline; no original vehicle, avatar, screenshot or extracted SVG is distributed.
- The received checkpoint had nine files. Five already had later edits and `fleet-panel.tsx` also existed. Root explicitly transferred all ten current files; their latest received bytes were saved under `/tmp/bricklane-dispatch-map-handoff-received` rather than overwritten from the older checkpoint.
- The checkpoint says additional write-action states were inspected, but the inherited structured `evidence.json` still marks several commits as pending. This batch does not upgrade those claims without additional evidence. The prior browser tab was reported closed; this agent did not take over another tab.

## Three largest gaps being addressed

1. A real geographical engine and 65px toolbar / 352px floating Fleet composition were missing. `fleet-map.tsx` now consumes actual MapLibre APIs for streets, GeoJSON, markers, camera, bounds and error recovery; the new shell composes the existing Fleet/DataGrid modules. No local renderer or street-map image is substituted.
2. Selection, clock, delivery eligibility and transaction Undo need one domain store. The actual reducer/store/context connect commands, route panels, map markers, DataGrid, vehicle details and actions. Reassign changes both route arrays and stop ownership; Undo restores the affected records without rewinding later simulation time.
3. Mobile Fleet and van-detail surfaces need distinct native Sheet lifetimes, real horizontal Tabs and keyboard behavior. The new composition uses installed native Sheet/Dialog/Tabs; the authored vehicle illustration is original and deliberately differs from the reference artwork.

These are implementation corrections, not measured after-results. The measured public contracts below still require a running candidate.

## Actual official free reuse

The twelve cached official free registry sources were read before new compositions. The cache is in the inherited plan's `official-free/`; its original retrieval failures remain preserved. No Pro registry implementation was requested.

| Official source | Actual consumer / retained behavior                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `c-frame-3`     | Installed `Frame` stacked anatomy in event detail cards. No replacement border/frame engine.                                                                       |
| `c-frame-10`    | `FleetCard`, Fleet list and vehicle sections use real Frame/Header/Panel/Footer and `spacing="sm"`.                                                                |
| `c-badge-1`     | Real REUI Badge variants for vehicle status, exceptions, eligibility and counts.                                                                                   |
| `c-data-grid-1` | `fleet-grid.tsx` retains real `useTable`, `dataGridFeatures`, DataGridContainer/ScrollArea/Table/Pagination, sorting, controlled pagination and column visibility. |
| `c-filters-1`   | Real Filters controlled query/schema UI. Only interpreting fleet-specific fields is custom domain logic.                                                           |
| `c-cascader-1`  | Real Cascader columns selection, search, native navigation/list/status/portal.                                                                                     |
| `c-timeline-2`  | Real Timeline item, header, date, content and separator anatomy for local activity.                                                                                |
| `c-timeline-6`  | Exceptions use actual Timeline + Frame + native Collapsible composition.                                                                                           |
| `c-timeline-10` | Actual Timeline status/date composition with real Badge variants; independent fleet records replace upstream demo fixtures.                                        |
| `c-slider-1`    | Installed native Slider handles pointer, keyboard, focus and disabled behavior.                                                                                    |
| `c-slider-5`    | Vehicle controls use the real controlled value/onValueChange pattern, without a custom drag mechanism.                                                             |
| `c-slider-10`   | Reviewed tick-generation example; this compact control has no ticks, so this source is not claimed as copied into a consumer.                                      |

Existing installed official REUI NumberField handles numeric form input, stepping, bounds and accessibility. Native Command/cmdk, Select, Field, RadioGroup, Checkbox, Sheet, Dialog and AlertDialog follow the same upstream primitives consumed by the free examples. The Command composition has its real Command root; it is not a hidden or cosmetic wrapper.

The received map fallback and Fleet warning surfaces were migrated from a duplicated raw warning surface/upstream-only Alert import to the actual installed REUI Alert. Ordinary attention actions use the installed Button. The SDK's own Marker API requires an HTMLElement: its original marker-button adapter is a documented missing-map-kit composition, not a replacement dropdown or button-state engine.

The official free index did not expose a full geographical renderer or vehicle twin. Therefore the MapLibre lifecycle adapter, original vehicle geometry and fleet business reducer are custom. Fuel uses the actual Progress primitive; a matched semicircular gauge is still a visual difference, not an invented free-component reuse claim.

## Domain implementation and meaningful checks

- Authored fixed epoch: 26 October 2026, 09:30 Seattle. Twenty-four original vehicles, eighty-two original stops, no real GPS, routing optimization, geocoding or driver-message backend.
- One simulation clock owns speed, pause, vehicle positions, fuel, stop status and delayed-delivery exceptions. React cleanup stops its timer on unmount.
- Search selects the same vehicle/stop used by marker, Fleet and details; invalid cross-vehicle stop selection is rejected.
- Reassignment ranks eligible vans and explains cold-chain, load, reserve, window and vehicle-state failures. Both route arrays, stop ownership and GeoJSON derive from the resulting state.
- Create, reschedule, complete, fail, edit, retire, acknowledge, controls and message use the same reducer. Retire is blocked while open stops remain. Messages are explicitly local activity notes.
- Undo restores changed entity fields and removes new records, while preserving later simulation movement/time. Old toast Undo IDs cannot roll back a newer transaction.
- Vehicle controls retain a dirty draft with Save/Reset, native controlled Slider, NumberField, mode Select, EV charge and cold-box temperature settings. Native nested dialogs keep their own focus/overlay behavior.
- Map placement temporarily closes the create portal while retaining the outer form component and its draft; selected coordinates feed the same form. Manual coordinate editing is tied to the latest picked location without an effect-driven state reset.
- The Seattle input parser rejects empty values, invalid calendar days and nonexistent DST wall-clock times; parsing is independent of the host timezone.

First pure-model run: **11/14**, with failures preserved at `/tmp/bricklane-dispatch-map-model-first.log`. A capacity test had accidentally requested exactly the available capacity; it now creates a genuine overload. Two real fixes reject permissively parsed empty dates and restore absent optional fields during Undo rather than adding explicit undefined keys. Final pure-model run: **14/14**, `/tmp/bricklane-dispatch-map-model-final.log`, 255ms. This transpiles only the actual domain files into a temporary directory; it is not a cold application typecheck or Vite build.

## Geometry and interaction acceptance still pending

| Public observation                                             | Candidate contract / current evidence                                                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolbar 65px; desktop Fleet x16/y81/width352                   | CSS and production assertions authored; not rendered yet.                                                                                                  |
| Phone Fleet left Sheet 358×844 at x0/y0                        | Native Sheet with a separate responsive open gate; measurement, Escape and focus-return tests pending.                                                     |
| Van detail desktop576×968 at x848/y16, phone358×812 at x16/y16 | Native Sheet sizing authored; actual geometry pending.                                                                                                     |
| Phone detail Tabs client317/scroll330 with real x scrolling    | Consumer overflow-x:auto / overflow-y:hidden with real Tabs and focus gutters; keyboard/ring/vertical-overflow checks pending. No global scrollbar hiding. |
| Phone List width358, search full row and wrapping controls     | Actual Frame/DataGrid/Filters/Cascader composition; native scrolling and no document overflow tests pending.                                               |
| Native selection, portal grouping, disabled/destructive states | Actual components retained; explicit selectors/actions in the new UI suite, not yet executed.                                                              |

Ten UI/SDK cases and four source cases are authored. They are not listed as PASS. The deterministic engine tests use a documented local style fixture with actual MapLibre/WebGL/GeoJSON; this is not evidence that remote Seattle streets rendered. Separate actual remote-street, WebGL failure, tile/style failure, Retry, camera/fit and visible attribution observations are still required. The authored WebGL failure test throws only at real WebGL context creation and verifies that List remains usable.

## SDK, export and licensing proposal

Root-only integration is described under `/tmp/bricklane-dispatch-map-integration-proposal`:

- Pin `maplibre-gl` exactly 6.16.0 in the current root manifest; Root performs the normal install/lock update. This agent did not install or modify root dependencies.
- `src/lib/maplibre-runtime.ts` imports the actual package CSS and `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url`, then calls the public `setWorkerUrl(workerUrl)` before constructing a map. Vite, not a hard-coded public URL, must emit the Pages-safe worker.
- Installed 6.16.0 types were inspected read-only. The received `ErrorEvent` named type is not publicly exported; the adapter now uses the real map error callback's inferred type.
- Register exact `solution-map-1` in the data router and make `solution-map-variants/dispatch-map.tsx` the default source leaf. Do not replace other solution routes or source targets.
- The real UI ZIP must include the actual leaf and its model/context/map/CSS/twin/free-component closure, the runtime worker/CSS imports, exact SDK dependency, REUI MIT, Inter OFL and the full MapLibre package notice. No test harness, node_modules, remote tiles or original-site media is exported.
- Preserve the complete pinned MapLibre license, including its Mapbox, glfx and d3-color notices. It is BSD-3-Clause with retained third-party notices, not all MIT.
- Keep visible OpenFreeMap, OpenMapTiles and OpenStreetMap attribution. Remote street data is not redistributed in the starter, and OpenStreetMap data is not declared MIT.

Strict build, source default/view/copy/file bytes, actual UI starter download, worker emission, Pages base path and standalone 1440/390 behavior await Root's single SDK candidate window. No new strict/Vite/server/CI/Pages result is claimed here.

## Remaining visual and functional differences

1. Authored Seattle drivers, routes, coordinates, original van geometry and cargo display deliberately replace original media/fixtures. The straight segments are schematic demo routes on a real map, not turn-by-turn street routing.
2. Fuel uses a Progress display rather than the observed semicircular gauge. Exact card spacing, portal font/token inheritance, icons, shadows, selection/hover states and mobile controls await rendered comparison.
3. All local actions are simulation-only. Reference dark/reduced-motion states, every write-action success and failure state, twin variants and all portal focus transitions have not been independently re-audited. Smoke or model passes must not be reported as complete visual reproduction.
