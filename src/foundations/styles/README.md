# Component styles

`getUiStyleCss(style)` returns plain CSS for Nova, Vega, Maia, Lyra, Mira, Luma, Sera, and Rhea. It accepts the style name or a registry name such as `base-vega` or `radix-vega`. Nova and unknown names return an empty string.

Append the returned CSS after the existing theme CSS in the preview, the copyable theme CSS, and the starter project stylesheet. Replace the previous style CSS when the selection changes. The rules use component `data-slot` attributes and existing default utilities, including on menus and dialogs rendered in portals. Both registry aliases use the same style profiles. Select the actual Base UI or Radix UI implementation separately.

The profiles adapt Button, Input, Textarea, InputGroup, Field, Select, Checkbox, Switch, Radio Group, Slider, Toggle, ToggleGroup, Avatar, Badge, Card, Item, Dropdown Menu, Dialog, AlertDialog, Sheet, Popover, Hover Card, Tooltip, Tabs, Progress, and ReUI's free Frame and Alert. They reference existing semantic colors and radius tokens. The upstream MIT notices accompany the generated CSS.

Sources include the [ReUI free registry](https://reui.io/docs/registry) and the [official shadcn style definitions](https://github.com/shadcn-ui/ui/tree/8ab27715521cbd4f87ae6886cd989cbb678f6de7/apps/v4/registry/styles).

With Playwright Chromium installed, run `node tests/ui-style-foundations/verify.mjs`, `node tests/ui-style-foundations/verify-sheet-popover.mjs`, and `node tests/ui-style-foundations/verify-tooltip.mjs` to verify computed styles for all sixteen library and style combinations.
