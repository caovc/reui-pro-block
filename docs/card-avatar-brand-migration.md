# Card portrait migration for Bricklane branding

Date: 2026-10-23. This small source-only milestone is separate from the in-progress Empty6–10 batch.

The current AGENTS policy requires the original Bricklane brand and prohibits distributing original-site portrait/media assets. The four card source files below now consume the existing original `demoAvatar(seed)` implementation from `src/lib/demo-artwork.ts`. No shared artwork helper, component, package, lockfile or other coordinator source is changed.

| File                                        | People migrated                                               | Result                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card-variants/common.tsx`                  | Sarah Chen, James Park, Emma Wilson                           | Shared three-person card groups use original seeded data-URI images.                                                                                                            |
| `card-variants/extended/common.tsx`         | Sarah Chen, James Park, Emma Wilson                           | Extended card groups use the same per-person original images consistently.                                                                                                      |
| `card-variants/records.tsx`                 | Mara Alves                                                    | Investor profile keeps its actual AvatarImage and existing dimensions, with an original image source.                                                                           |
| `card-variants/final-profiles/profiles.tsx` | Jenny Klabber, Ralph Edwards, Ari Lane, Mila Stone, Theo Vale | Profile and team image slots keep their actual AvatarImage, fallbacks, online/verification badges and size rules. The deliberate K initial-only slot remains an AvatarFallback. |

## Intended visual difference

Photographic portraits are intentionally replaced with the project's original illustrated avatars. Each person supplies a distinct seed; repeated appearances of the same person remain consistent. This differs from the public reference photos by design under the latest branding/media requirement. Component structure, image semantics, accessible names, status badges, positioning and all interactions remain intact.

## Shared-source and asset coordination

- No old JPEG is deleted here. The Schedule owner coordinates deletion only after all repository consumers have migrated. This batch removes all `schedule-*.jpg` imports from these four files.
- The original `demoAvatar` helper is already included in `src/lib/source.ts`'s raw source collection, so source previews and standalone exports can resolve the new static import.
- Existing official free Frame/Badge/IconTile and upstream Avatar/Image consumption remains unchanged. The helper generates content art; it does not replace any UI component.
- Historical source ZIP assertions that explicitly require the old portrait JPEGs should migrate to asserting `src/lib/demo-artwork.ts` and real generated image sources when the shared-photo deletion is released. The old assets are not silently removed by this batch.

## Verification

Scoped oxfmt formatting/check and Oxlint pass for exactly the four changed implementation files. The diff only removes photo imports, adds the original helper import and changes image source expressions. Light source inspection confirms the actual AvatarImage elements, fallback slots, alt text and dimensions are preserved. A pure runtime check of the shared artwork function confirms every referenced person produces an SVG data URI. Broad browser/build checks are deferred to Root's coordinated release window while Product30's existing stress run finishes.

Root final coordinated validation: the frozen production candidate passed strict TypeScript/Vite and **31/31 browser regressions** (one worker,25.9seconds), covering base/extended/final-profile Cards and the actual Auth carousel. The actual Card43 UI-downloaded221-file starter built independently and rendered at1440/390 without errors, broken images or horizontal overflow. Its ZIP test now verifies byte-identical original artwork/source modules and the absence of all `schedule-*.jpg` assets. Following the Schedule and Flow migrations, Root also removed the eight now-unused shared JPEGs after checking all runtime sources.
