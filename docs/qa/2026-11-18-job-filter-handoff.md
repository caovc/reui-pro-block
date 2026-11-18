# Job Schedule filter focus handoff

Two CI runs timed out while clicking Lost Days in the Base UI desktop filter.
The first local run of the unchanged test passed. A separate rapid native
pointer sequence reproduced the failure by choosing Late and immediately
opening Show jobs. The closing editor restored focus to its Late chip after
the new Select had opened. The Select closed before Lost Days received the click.

The free ReUI filter chip now preserves focus on the newly expanded Select
trigger or in the next open Select or Popover. It also checks the active
document when the Base UI close callback has no event target. Closing a filter
normally still restores focus to its original opener.

The production build for both foundations passed. Browser verification covered
the rapid handoff, the unchanged CI case, six related filter and normal-close
regressions, an isolated DOM check of six focus conditions, and a permanent
native pointer regression. All ten passed. In the candidate's rapid run, the
old restoration callback happened before the Select finished opening. The
separate DOM check exercised the expanded-trigger branch directly.
