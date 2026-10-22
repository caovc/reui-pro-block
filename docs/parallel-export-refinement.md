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
