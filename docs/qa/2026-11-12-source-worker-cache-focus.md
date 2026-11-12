# Source viewer worker, cache and picker focus · 2026-11-12

The bounded Source viewer milestone is locally verified on candidate 5458. It
actually reuses ReUI free CodeBlock and its highlighter, with highlighting in a
module worker, and the official free `c-combobox-21` picker. Both official picker
registries use genuine Base UI Combo; the outer Dialog/Button use the selected
foundation. Bricklane branding, MIT/OFL notices and attribution remain intact.

Complete colored models are validated against current source before display or
cache. Copy/download preserve complete raw bytes during loading. Generation and
identity checks reject stale results; cleanup removes listeners and terminates
the worker on unmount. The Base nested-modal focus repair is confined to the
consumer's genuine Escape/item-selection close callback, preserving primitive
finalFocus and native outside handling.

The LRU retains at most 9 verified models, 262,144 raw UTF-16 units and 8 MiB of
serialized UTF-8 JSON payload, not heap usage. Natural-LRU evidence measured 62,533
units / 620,100 bytes and isolated the count cap. Oversized raw/payload admission
has not been observed at runtime.

| Accepted gate                  | Result and boundary                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original build                 | Candidate 5458's original npm build passed full TypeScript and both Vite builds in 101.988 s.                                                                             |
| Original product flows         | Radix Filebox 18,535 ms / Pulse 26,761 ms and genuine Base Filebox 18,687 ms passed once, including complete DOM/real Clipboard/single files/original ZIP.                |
| Phone product picker           | Nova/Sera at 390 px under both real foundations passed 4/4: complete selected CSS bytes/colors/actions, full 249/254 option order, query reset and native focus.          |
| Private worker/cache contracts | Original 26, natural cache 4 and corrected genuine transport fault 2 passed. Its nativeSelect toolbar isolates worker contracts and supplies no product Combo acceptance. |
| Permanent focus regression     | Four normal CI cases are registered. Direct execution of the unchanged shared file passed the Radix/Nova and Base/Sera extraction 2; these overlap phone coverage.        |

Accepted checks retained 30 s / 5 s / retries 0, native actions and complete traces.
Source/artifact/current-runtime/HTTP guards passed. Historical timing and Base
focus failures remain preserved, as do the unsupported-aria-modal phone oracle
and async-null fault-injector failures. No stable full matrix or all-style claim
is made. Exact-SHA CI and deployment remain separate release gates.

The original Base export's normal fresh install (80.464 s) and original strict
build (20.778 s) passed with its own dependencies and 34-file dist; all 263 package
members remain unchanged and equal the candidate 5458 Base ZIP. Host picker/worker
files are outside that template closure. Its own-dist app smoke failed the
NewFolder opener-focus assertion after Escape at the original 5 s limit (line 39).
The actual focus target is unknown and Create was not reached. That separate
app-consumer investigation and exported-app runtime gate remain open; the
bounded Source milestone is complete within the gates above.

The additional Round3 readiness gate passed on the same candidate 5466. The
4d CI Cohort failure compared immediately after selection and showed previous
main source; its truncated annotation is preserved. The unchanged case on 5466
failed at the same assertion in 3.275 s while People honestly showed “Loading
source…”, before Copy or ZIP. Only the two immediate DOM assertions now poll
complete, unnormalized `textContent` against the same entire expected strings
within 5 s; native actions, Clipboard/ZIP checks and the 30 s case budget remain.
The actual shared test passed its first corrected Cohort case and the remaining
four variants once, with retries 0. Offline evidence verifies eight complete DOM
values before native Copy, eight real Clipboard values and eight selected members
in five original ZIPs; all 1,735 ZIP members passed CRC. This adds Radix/Nova
1280×720 selected-source coverage. Auth-source, Base, all-style and standalone
exported-app runtime acceptance are outside this gate. See the
[Round3 handoff](/tmp/source-round3-5466-offline-audit-20261112/handoff.md).

Evidence: [original flows](/tmp/source-5458-critical3-offline-audit-20261112/handoff.md),
[phone 4](/tmp/source-5458-phone-v2-offline-audit-20261112/handoff.md),
[core/cache 32 and retained failure](/tmp/source-core-cache-5464-native-20261112-3bggtpja/accepted-core-cache-summary.json),
[permanent extraction 2](/tmp/source-picker-permanent-adapter2-5458-first-native-20261112-9b758324/final-handoff.md),
[fresh package and open smoke](/tmp/filebox-base-original-5452-runnable-20261112-qH8RUT/fresh-install-build-smoke-handoff.md).
