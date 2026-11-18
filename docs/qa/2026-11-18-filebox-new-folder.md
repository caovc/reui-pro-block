# Filebox keyboard focus after closing New Folder

The Base UI project downloaded from Filebox previously lost keyboard focus after
Escape closed New Folder. A separate focus trace captured the document body as
the final active element. Removing autofocus from the name input also failed the
Radix return-focus assertion.

Drive now captures the actual button that opened New Folder. On dialog closure
it returns focus to that connected button, then cancels the default restoration
if the button received focus. The name field retains autofocus. This change uses
the existing dialog and button components.

On build 5469, both Nova desktop cases passed at 1440×1000. Each case signed in,
opened New Folder, verified the name field had focus, pressed Escape, checked
focus on the same opener, reopened the dialog and created a folder. The new row
appeared in search and offered Rename in its actions menu. Opening Rename
focused the populated name field. The return-focus assertion applies to Escape.

The Base project download contained 263 ZIP entries. The source viewer and ZIP
agreed on the updated Drive source. Verification checked 254 raw files, nine
generated files and the import closure. A fresh installation succeeded with all
263 original files intact.

The extracted starter passed its own TypeScript check and Base UI production
build in 28.6 seconds using the dependencies installed in that directory.

The browser smoke test against the starter's own production output passed. It
signed in, closed New Folder with Escape, verified opener focus, reopened the
dialog and created a folder. The ZIP files, generated lockfile and built files
matched their pre-test checksums afterwards. The permanent keyboard regressions
also passed on both foundations, including reopening with Enter after Escape.
