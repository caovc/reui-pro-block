# Catalog and agent manuals

Catalog data is maintained in the application source. Use it to find a candidate, then read its implementation before adapting a pattern.

## Find an entry

- **Blocks:** [`src/data/catalog.json`](../src/data/catalog.json) lists block IDs, categories, descriptions, and public references.
- **Full templates:** [`src/templates/catalog.ts`](../src/templates/catalog.ts) lists template IDs, families, features, and preview references. Templates are separate from the block catalog.

## Read a manual when one exists

- **Block manual:** `docs/agent-guides/blocks/<block-id>.md`
- **Template manual:** `docs/agent-guides/templates/<template-id>.md`

Manuals explain how the current local implementation is composed and which patterns are safe to adapt. They do not replace the source code, create product requirements, or establish business rules for a consuming app. If a manual is missing or conflicts with code, inspect the current source and follow the project's ReUI skill.

## Adaptation boundary

The template project uses Base UI with the `base-nova` style. The Start Next app uses Base UI with `base-vega`. Reuse suitable composition and interaction patterns, then verify component APIs and restyle through the host app's installed components and tokens. Treat demo data, mock permissions, and local-only actions as examples, not real contracts.

The old generated catalog checklist duplicated entries already held in `src/data/catalog.json`; the source catalogs above are authoritative and should be searched directly.
