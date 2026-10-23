# Schedule demo artwork

Schedule 1/2/3/8/9 now use the locally authored `demoAvatar(name)` helper in `src/lib/demo-artwork.ts`. It generates deterministic SVG illustrations from basic geometry as embedded data URLs; the Schedule components themselves no longer import or load the original preview photographs. Application-family source assembly and archives can still include legacy resources used by other scopes until coordinated cleanup finishes. Avatar/AvatarGroup behavior and initials fallbacks remain intact.

The official [Schedule reference pages](https://reui.io/blocks/application/schedule) and [free MIT Avatar Group With Count example](https://reui.io/components/avatar/c-avatar-11) remain references for component structure and behavior. Original photographs are intentionally not reproduced. ReUI free component MIT notices and font OFL files remain applicable and unchanged.

The former Schedule-only files `range-alex-johnson.jpg`, `schedule-alex-chen.jpg`, `schedule-zoe-martinez.jpg`, `schedule-tom-anderson.jpg`, and `schedule-lucas-ferreira.jpg` have been removed after a repository reference check.

At this migration boundary, eight legacy files still had consumers outside Schedule and were left for their owners to migrate before deletion: `schedule-priya-singh.jpg`, `schedule-marcus-webb.jpg`, `schedule-sofia-reyes.jpg`, `schedule-liam-torres.jpg`, `schedule-emma-wilson.jpg`, `schedule-alex-johnson.jpg`, `schedule-sarah-chen.jpg`, and `schedule-james-park.jpg`. Their remaining consumers were Auth Split, Card variants, and Flow/Gantt avatars. This note does not certify the full repository or archive as cleared until those independent scopes finish. Schedule itself does not reference any of these files.

The coordinated Auth/Card/Flow follow-up subsequently migrated all remaining consumers of those eight shared JPEGs to the original `demoAvatar` helper. A repository-wide runtime reference check found no remaining consumers, so the eight files are removed in that follow-up. This statement concerns the named Schedule/shared portrait set; separately attributed editorial substitute photographs remain.
