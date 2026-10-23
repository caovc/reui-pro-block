# Free ReUI Data Grid foundation

Retrieved from the public ReUI `radix-nova` registry on 2026-10-22. These are free library components; no Pro source was requested. License: `src/components/reui/REUI-LICENSE.txt`.

The official Data Grid uses TanStack Table v9 (`useTable`, `dataGridFeatures`) and React Virtual. Blocks must pass their original data into its filtering, sorting, pagination, selection, pinning and expansion models, and render through the corresponding ReUI table components.

Sources: https://reui.io/r/radix-nova/data-grid.json, plus the public `badge`, `frame`, `filters`, `cascader`, `rating`, `number-field`, and `color-picker` registry items. The registry bundles include their free subcomponents. ButtonGroup and Spinner are supporting shadcn registry components.

Installation adapters (no changes to component behavior):

- The registry CLI was previewed in a scratch project; two attempted installations failed on TLS socket disconnects. The public registry JSON was then materialized directly.
- Internal registry `IconPlaceholder` entries were converted to their declared Lucide icon, matching the CLI output, and shadcn aliases were resolved to local UI components.
- A few unused upstream generic/parameter names were prefixed with `_`, one unused destructured binding omitted, and unused diagnostic values retained with `void` to satisfy the project’s `noUnused*` checks.
- The app enables existing Node typings for upstream `process.env.NODE_ENV` guards. Vite supplies the build-time value.
- Official Badge semantic CSS variables are included in the shared theme and standalone downloads.

Validation: an isolated checkout of the last published commit with only this foundation builds successfully with `npm run build`. Page migration is tracked separately; the presence of a dependency alone does not establish that a block has migrated.

Local behavior correction on 2026-10-23: the vendored free `filters-chip.tsx` preserves focus when another open popover has already claimed it before an exiting editor's deferred Radix focus restoration runs. Both the value and operator editor use the guard; the existing creation handoff and normal Escape return-to-trigger behavior remain. The installation hashes in the provenance file describe the original import before later formatting and this documented correction. No filter renderer or state machine was replaced.
