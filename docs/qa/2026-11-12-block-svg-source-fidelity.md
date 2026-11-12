# Original SVG bytes in block starters

The block collector now encodes SVG assets from their actual raw modules.
Previously, a small SVG could be serialized through Vite's inline URL and lose
its original source bytes. Asset discovery stays unchanged; other binary
assets retain their existing fetch path. Missing raw SVG modules fail explicitly.

The isolated5430 candidate starts from448fcef with only this11-line runtime
change in `src/lib/bundle.ts`. Scoped semantic TypeScript and both production
foundation builds passed. The actual Fleet Center/AppShell33 UI downloaded a
new original starter in one native test, retaining30s/5s budgets, one worker,
zero retries and tracing.

## Download and integrity

The archive has442 members and SHA256
`68800f7b8fdb6bc53ec0d22287802f8e3a2862e16d89a1d5445875712500cbc1`.
All CRC/SHA checks passed. All433 repository-derived members exactly match the
frozen source; nine files are generated. All21 SVGs, all31 selected assets and
all24 notice/license records match their original bytes. The selected binary
fallback includes eight JPGs, one PNG and one WOFF2. Literal-import and real CSS
parsing cover382 source files,1720 local edges and620 external edges, with no
missing local or undeclared package dependency. The inline favicon strictly
matches its333-byte original, including its final LF.

Those21 SVGs are the current block collector's entire SVG corpus. This does not
establish that every other block family or binary asset has been natively
exported. The host source-panel screenshot still showed Loading source code;
it is not evidence that the completed code viewer was visually inspected.

## Unmodified original project

Normal installation passed in127.716s with712 packages and the original
postinstall. The original `tsc --noEmit && vite build` passed in50.528s.
No original source, manifest, configuration or member was repaired. The246
generated public font/notice copies were each compared to their actual normal
installation package or original notice source; no blanket public exception
was used.

The actual428-file build was served independently on5441. Its original-budget
smoke passed first time in5.538s: search/reset, native tree keyboard handling,
Pin Charging, Quick Add, Escape and original trigger focus. Swagger, Reddit and
Strapi images loaded successfully. Browser fault records were empty and both
new screenshots were inspected. The shell's content placeholder is intentional;
this result does not claim a completed business dashboard.

All442 original members, the original archive, installed lock/public output,
428 build members and host candidate source/artifact stayed unchanged through
the phases. Evidence:
`/tmp/export02b-fresh-5430-20261112-je6v_eu0/final-original-project-handoff.md`.
Browser plugin not available; Playwright used system Chromium.

This covers one Radix/Nova starter. Base, other styles, whole Source UI,
Clipboard and single-file flows remain separate gates. The generic template
SVG byte assertion is being strengthened separately; its old private results
and historical SVG exception remain preserved.
