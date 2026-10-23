# Standalone source export refinement

Date: 2026-10-22. Standalone source export audit.

## Defect and change

`src/lib/source.ts` cut the exported theme before the shared `html` rule. This omitted the body baseline and interaction/focus styles. A downloaded starter built successfully but rendered its body at 16px, while the isolated website preview used 14px.

The extraction boundary now starts at `.brand`, after the shared element rules and before the site chrome. This retains the 14px body baseline, font smoothing, touch behavior and focus styles. `bundle.ts` and `download.ts` did not need changes.

## Evidence

The agent used the real Download source action for application `auth-20`, commerce `product-card-8` and data `chart-16`, before and after the correction. All three extracted starters passed `npm run build`; after the fix, all three reported a computed body font size of 14px. Their extracted `theme.css` excludes `.brand` and `.site-shell`.

Standalone browser checks at 1440×900 and 390×844 found no document overflow, page errors or failed images. Auth password visibility changed the input to `type=text`; the chart's 2D control reached its selected state. The commerce starter also included the new pricing refinement helper and built successfully.

Temporary reproducibility scripts: `/tmp/reui-parallel-check-export.mjs` and `/tmp/reui-parallel-render-export.mjs`. Build validation reused installed dependency versions rather than making a fresh network installation. Temporary artifacts are evidence from this session, not committed fixtures.

This verifies the sampled exports and shared style defect. It does not establish per-entry visual fidelity across the entire catalog, and is limited to the shared style correction and these sampled starters.

The release coordinator independently repeated all three actual ZIP downloads against the isolated production build: 56/58/58 source files, successful builds, 14px body text, no runtime errors, no failed images, and no document overflow at 1440px or 390px. Dependencies were reused from the installed lockfile environment.

## Second-pass export verification

After the user's fidelity feedback, the seven scoped schedule/pricing entries use a locally bundled Inter variable font. The application family includes thirteen reference portraits. `bundle.ts` now includes font/image binaries and their asset/license notices; a compatible recursive asset glob from another coordinator is retained in the final validation snapshot.

Real Download source actions against the scoped production preview on port 5188 produced Schedule 8 (79 files) and Pricing 5 (66 files) starters. Both include the 48,432-byte Inter font, its 4,380-byte OFL license, and scoped reference CSS. Both independently passed production builds using the installed dependencies. Schedule 8 also includes all thirteen application portrait files.

Both standalone starters were exercised at 1280×900 and 390×844 with external HTTPS requests blocked. All four renders loaded Inter and images locally without page errors or horizontal overflow. Schedule category filtering and pricing billing/plan actions passed. Evidence: `/tmp/reui-fidelity-review/final/standalone-checks.json`; scripts and extracted starters remain in the same temporary audit directory. This verifies these sampled exports, not every catalog entry. The final source ZIPs were refreshed after the last meeting-scrollbar CSS alignment correction.

## Official ReUI source closure

The official free-component migration adds recursive `src/components/reui` and local hook source discovery to `source.ts`. The download payload includes the actual ReUI MIT license and component provenance notices, in addition to the earlier local fonts/images. Stock shadcn dependencies remain identified separately.

A real Pricing 5 download after migration contained 70 files, including official Badge/IconTile source, the official example's stock Item dependency, Inter font/OFL and the ReUI MIT notice. This starter built independently and passed desktop/390px renders and billing/placeholder-link interactions with external HTTPS blocked. The release candidate over committed `8555ae0` passed production build and six site/pricing tests. This shared export milestone does not itself publish the pending schedule/pricing page changes.

## Bricklane original-artwork migration (2026-10-23)

The earlier thirteen-portrait checks describe the historical export before the project's original-artwork requirement. Schedule 1/2/3/8/9 now use the locally authored `demoAvatar` helper; Pricing 6 uses independently drawn illustrative team marks rather than extracted vendor artwork. Five Schedule-only photograph files were deleted after checking repository consumers. Official ReUI component source/MIT and local Inter/OFL remain in place.

A fresh source-assembly audit confirmed that Schedule 8 and Pricing 5/6 include the exact local `src/lib/demo-artwork.ts` helper, and both Pricing starters include the updated `pricing-brandmarks.tsx`. No shared export changes were needed for this dependency closure.

The binary asset export remains family-wide. At this audit boundary, eight legacy Schedule photographs still had Auth/Card consumers, and Commerce exports included separate Reviews assets owned by another ongoing scope. Those migrations were reported to their owners and the release coordinator. Removing only the binary export entries would leave the family source imports unresolved. This scope therefore verifies the seven pages' original artwork and helper inclusion; it does not certify that every family-wide ZIP has been cleared of all upstream preview media. Do not reuse the obsolete thirteen-JPEG count as an acceptance check.

The isolated release candidate used committed `f3f28e5` plus only this scope's fourteen text changes and five asset deletions. Production build and all ten existing Schedule/Pricing browser tests passed with one worker. Fourteen renders (1280px and 390px for seven pages), with external HTTPS blocked, reported no page errors, document overflow, broken images, or external requests; every displayed image was an original SVG data URL. Fresh browser Download source actions yielded Schedule 8 (237 files) and Pricing 6 (117 files). Both independently passed production builds using the installed dependencies. Both contained byte-identical artwork helpers, Inter/OFL and the ReUI MIT notice, and omitted the five removed portraits. Schedule 8's family archive still contained the eight known cross-scope photographs, explicitly outside this batch's removal boundary. Temporary evidence is under `/tmp/reui-fidelity-review/bricklane-artwork`, `bricklane-export-checks.json` and `brand-candidate.json`.
