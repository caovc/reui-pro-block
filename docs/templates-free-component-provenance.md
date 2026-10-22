# Template component provenance

Official free ReUI Radix Nova registry implementations, retrieved 2026-10-22. These components are actually used by templates. Source license is included at src/components/reui/REUI-LICENSE.txt.

| Component | Official registry | Local source SHA-256 |
| --- | --- | --- |
| kanban | https://reui.io/r/radix-nova/kanban.json | `88d4e8e5992d46c60a60381248e4bd6435c7b267acea8ba76d2bf676c369adc0` |
| icon-tile | https://reui.io/r/radix-nova/icon-tile.json | `33e26f0d4c1a76cf490c2fe486d571a3a520d80df0f22e2e5090948d678ce61c` |
| scrollspy | https://reui.io/r/radix-nova/scrollspy.json | `4bdbbfa134f4504c7c0b3ca5260ba5fb07ea1e03eb9f4859cda6b94037d00df3` |

IconTile has an added source-URL comment from the shared component installation. Runtime implementations are otherwise unchanged.

- src/components/reui/event-calendar/event-calendar-agenda-view.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `06ee58177d48cf524031da90595e48f3fb0f10eff505e5c22e75b3be234a5605`. Icon placeholders resolved to the registry-specified Lucide icons, matching CLI installation.

- src/components/reui/event-calendar/event-calendar-content.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `6775b7d2bd9fe559bef64e3a578fe9c331c1f3d4de8237a6ed09898a558b5a34`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-dnd.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `4595a3738854ce51c1c0cdfb0fc8de4ed2990fba6744b0eb36c3884adf7b72ec`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-event.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `85010be07197febb20ec0ed234cffa75ea58ffb9d2f03420e952c031a8a7cb5d`. Icon placeholders resolved to the registry-specified Lucide icons, matching CLI installation.

- src/components/reui/event-calendar/event-calendar-i18n.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `845b702a8d5d336f1dc9da1f792e8a2b383ee8d1c3f8f636f229033a4cddad81`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-lib.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `e871a08cd79b7d58be98cc48989635bbd8657d9a630a69458cb22819bd5932d0`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-month-view.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `0fbbe289bab3741d23780bb8fde223ca6d5ba453a41dca8161b051743d73149c`. Icon placeholders resolved to the registry-specified Lucide icons, matching CLI installation.

- src/components/reui/event-calendar/event-calendar-nav.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `52d356fb033bdbfda3152126cd42ff97b9f223c9f5de1f311677bc36532ebf62`. Icon placeholders resolved to the registry-specified Lucide icons, matching CLI installation.

- src/components/reui/event-calendar/event-calendar-recurrence.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `b5e91f059fc68af6a8d9428c2f1ef407ba36ad1b7c134746c5f53309ae237f9b`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-resource-view.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `496674b4efbe515c5fc21d690487cbbf5354c4a2f01afa37aceaf49c5dee19dd`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-time-grid.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `d68e97ea395e944daadc80a015cacba8afa6d98fa9038c9042229f253b6da90d`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar-types.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `ba492f0f72394a554e4e785fe0715bead36446d91f0ac474384f9ad66bf3dff9`. Unmodified registry source.

- src/components/reui/event-calendar/event-calendar.tsx: https://reui.io/r/radix-nova/event-calendar.json; SHA-256 `7b3522af6b40f9e133865d5b98c555b50a89a718f616a897f52dfef885d0073d`. Unmodified registry source.

- src/hooks/use-file-upload.ts: https://reui.io/r/radix-nova/use-file-upload.json; SHA-256 `0ea2e6969077bffde3adeddbf5e73dc13b27406574cf271c1f082d76bea4deb3`. Unmodified registry source.

- src/components/reui/icon-stack.tsx: https://reui.io/r/radix-nova/icon-stack.json; SHA-256 `074ffb5a4c2410e9d0083b37f5291a9e5e868d351d65e7716567b2ae0e5e1678`. Unmodified registry source.

Strict TypeScript compatibility: removed unused PackedPosition type and two unused imports; changed an unused month-cell hook binding into the same hook call. No runtime algorithm or hook order changed. Registry hashes above document the initially installed sources before these four noUnused adaptations.
