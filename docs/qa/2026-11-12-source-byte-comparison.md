# Original archive byte comparison

The shared original-source test helper now compares complete buffers with
Node's native `Buffer.equals` and records a boolean matcher result. Failed
comparisons retain the filename, lengths and both complete SHA256 digests.
Every source, required implementation, license, font, attribution and media
comparison remains in place, alongside the existing dependency and AST closure
checks.

Playwright's old deep-buffer matcher recursively compared numeric properties.
Its reporter also serialized expected buffers into byte arrays. A single,
fixed-order pure Node benchmark on the actual Filebox archive compared 229
pairs containing 2,737,529 bytes: the old matcher took 2,151.4ms and the new
comparison took 17.8ms. This benchmark excludes browser and reporter IPC work;
it does not establish an equivalent end-to-end time reduction.

The old and new comparisons both rejected final-byte corruption, length changes
and unequal views at different offsets. Equal views at different offsets passed.
The committed regression cases additionally cover empty files, binary data,
Unicode, CRLF and complete failure digests.

The unchanged Filebox spec passed once with the private 5360 viewer candidate
and this helper: 29,984ms under its original 30s case and 5s action limits,
with zero retries. The real DOM, clipboard, single-file downloads and original
ZIP members matched; the archive retained 258 members, 229 verified sources,
827 resolved dependency edges, licenses and original strict build settings.
Both dialog closures restored the opener, and no page error was recorded.

That result has very little timing margin. The earlier 5360 run with the old
helper timed out and remains recorded; its final focus assertion ran after
the deadline, so it does not establish a focus defect. The private viewer's
three CodeBlock cases and real MapLibre smoke passed separately. Base coverage,
line-ending and worker failure contracts remain separate Source performance
gates. This helper milestone does not close that work or identify the cause of
the older unrelated CI failure.

Private evidence is under
`/tmp/reui-source-performance-p2-20261112/off-main-ready/helper-byte-equality/`.
The normal preview currently uses the viewer from the deployed commit
`d2d1e97`; the private worker viewer is not included in this test-only milestone.
