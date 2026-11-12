# Theme coverage for lazy template thumbnails

Exact commit8e05661's Actions run43297522859 failed only the thumbnail theme
case in `tests/templates.spec.ts`: the Mesh iframe was not found within the
original5s assertion. Build and browser shards1/2/3 passed; deployment skipped.
The official GitHub reporter exposed the actual test title, location and stack.

The unchanged case reproduced locally on immutable5460, whose31 relevant
gallery/catalog/theme/Mesh modules exactly match8e. At the original1280×720
viewport, parent HTML was correctly dark after toggling, reloading and returning
to Templates. Mesh's thumbnail started at878.234375px, outside720px viewport plus
the existing150px observer margin. Its skeleton existed; its iframe did not.
Only the first Strata thumbnail was mounted. The failure did not reach a child
document whose theme could be assessed.

The test now natively scrolls the existing Mesh parent card into view before
reading its frame. Product code, observer margin, all original theme assertions,
5s assertion timeout,30s case budget and zero retries remain unchanged.

The corrected complete case passed its first run in9.979s. Actual scrollY moved
from0 to689, thumbnail top moved to189.234375px, skeleton disappeared and the
iframe loaded. Its dark assertion took638ms and its later light assertion589ms.
Trace snapshots confirm real child HTML with dark/color-scheme:dark followed by
the remounted light child. Parent storage/reload and dark-to-light checks all
passed. Both screenshots were inspected; runtime/network fault records are
empty. Complete source2443/artifact1391 and21 HTTP resources remained exact.

Original CI failure and local red10.351s are retained separately. The new exact
commit's Actions result and deployment still require verification.

Evidence:

- `/tmp/ci-template-thumbnail-theme-original-5460-native-20261112-e8EZC2`
- `/tmp/ci-template-thumbnail-theme-fixed-5460-native-20261112-WbUAyi/red-green-evidence.json`
