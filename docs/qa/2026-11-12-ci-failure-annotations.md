# Browser failure annotations

The browser workflow now adds Playwright's official `github` reporter alongside
the existing `list,blob` reporters. Future ordinary test failures can expose the
original test title, source location and formatted error stack through GitHub
check-run annotations when detailed log downloads are unavailable.

Only the reporter list changes. The four shards, selected tests, single worker,
budgets, retries, tracing, artifact uploads, exit status and deployment gates
remain unchanged. There are no new permissions, credentials or network routes.

## Validation

An isolated, deliberately failing observability fixture ran with the installed
Playwright 1.64.1 and the exact `list,blob,github` reporter combination. It used
neither browser/page fixtures nor a web server and exited with the expected
status 1. All eleven checks passed: native annotation title, source file,
line/column, original assertion error and real stack, multiline encoding, list
output, summary notice, and the real blob report with valid CRC and original
failure details. This probe is not a product test or a remote CI result.

Evidence:
`/tmp/reui-github-reporter-probe-20261112-r2cl7mox/probe-verification.json`.
Its 2471-byte blob has SHA256
`b63602817205e9ddeeaec1fa9ff203f17496f5053d2e66628700db5a810ac68f`.
The applied one-line patch has SHA256
`ba579a6689425fc2d77c3384222888116685910432cedae151979cc422d3976a`.

GitHub ingestion is verified for exact SHA
`8e05661e73e56590d224c958b732f1eab4bfe170`, run `43297522859`,
[browser shard 4](https://github.com/caovc/reui-pro-block/actions/runs/43297522859/job/131474508627).
The retained paginated annotations contain the original failing test title at
`tests/templates.spec.ts:117:1`, assertion location `125:85`, the Mesh iframe
locator, the original 5000ms timeout and full formatted error stack. The official
summary records one failed test and 724 passed; the separate process-exit
annotation is not another failed test. Original evidence:
`/tmp/ci-template-thumbnail-theme-8e-5460-prep-20261112/original-annotations.stdout.json`.
Annotation limits or termination before reporter callbacks can still omit details,
so the existing blob and diagnostic artifacts remain necessary.

## Earlier failures

Run `43276208221` failed browser shards 1 and 4. Their check-run metadata reports
exit code 1 without test names or stacks; the canonical public job pages require
sign-in, and a normal detailed-log download was blocked at the blob host.
Run `43287988328` also failed browser shards 2 and 4; its actual test names and
stacks remain unknown. The verified later annotation does not identify either
run's failures. This change cannot recover their old logs and does not identify
them with independently observed local Source timeouts.
