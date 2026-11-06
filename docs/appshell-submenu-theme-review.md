# AppShell selected submenu theme boundary

AppShell 2 retained a gray selected submenu after Customize → Accent color Emerald → Menu Solid. The actual ReUI `SidebarNavigation` renders `SidebarMenuSubButton`, while the customizer's explicit menu rules previously matched only its parent `SidebarMenuButton`.

The added selector now uses the positive `app-shell-navigation` marker. The existing `shellThemeClasses` helper adds that styleless class only inside a positive AppShell variant context. Its zero default and all existing variant metadata remain intact. The existing desktop and native mobile class propagation carry the same marker; it does not depend on the preview site's outer wrapper. Pre-existing global selectors and their specificity are unchanged.

The actual ReUI free SidebarNavigation/SubButton, Sidebar/Sheet/Provider and layout remain in use. This fixes consumer customization styling without replacing those components or changing their state, focus handling, routes or status palettes. A dedicated marker is necessary because templates also use `shell-reference`. The previous broader selector was held before publication, and its evidence remains historical. No template implementation or shared primitive changes are included.

## Verification

- Independent scope review resolved the three helper calls and nine primitive consumers to AppShell implementations, including native mobile propagation and the actual exported entry. No namespace, re-export, dynamic-import or template escape was found. The zero context remains byte-identical; the old 36 variant class sets are retained. The new class has no existing selector collision.
- Default generator output for 36 accent/mode configurations is byte-identical. Four explicit menu overrides append only the scoped submenu selector.
- Normal postinstall, scoped oxfmt/oxlint and the new TypeScript/Vite production build passed in 27.919 seconds. The build binds 1,217 source files and 657 distribution files; the served index and all 18 referenced JavaScript/CSS assets match those files.
- Six distinct repository cases passed once without retries: native Solid/Bold/Outline submenu customization, retained selection, dark desktop collapse → 390×844 native navigation with the positive marker, an actual Theme CSS download matching generator bytes, and a real Flux Connections exclusion on desktop and phone. The negative case retains the template's colors and has no AppShell marker. All five saved screenshots were inspected; the phone screenshot waits for native animation completion.
- A fresh AppShell 1 starter ZIP contains 418 members. Both modified implementation modules match the frozen source. Independent review verified the package dependency closure, actual `main → Example → Application → audited AppShell provider` path, and MIT/OFL/font/media notices. The capture's earlier health check uses AppShell 2; the actual native Code → Download starter action and original Example belong to AppShell 1.
- The original ZIP installed normally in 52.419 seconds and built with its unchanged strict `tsc --noEmit && vite build` command in 8.842 seconds. All 418 original members, including source, entry and configuration, remain unchanged. The served original-project index and its three JavaScript/CSS references match the actual 428-file distribution.
- The original project's real default entry passed desktop and native phone marker, selected Deployments, animation visibility, Escape/focus return, overlay and console checks. Both viewports use the natural AppShell 1 provider. No site wrapper, entry repair, added stylesheet, preset or state injection was used. Console errors and warnings were empty.

The starter retains its existing default-theme contract. A generator module in the archive is not evidence that a live website preset is automatically applied. The separate Theme CSS download was checked byte-for-byte on the website; consumption of that file by the independent project is not claimed in this batch.

## Scope and baseline

Official [Shell 1](https://reui.io/blocks/application/app-shell/app-shell-1) and [Shell 2](https://reui.io/blocks/application/app-shell/app-shell-2) remain comparison references. This change preserves the repository's existing default variant metadata and does not certify original-site color parity or every state in all 36 official shells.

The executed candidate and actual ZIP are based on `a939a2e`. Fresh-main checks against `3745de08` and `4e19d9f` confirm that both owned source preimages are unchanged. The two intervening Grid source files and the Pricing CSS file have no intersection with the actual 418-member ZIP. This is a specific dependency boundary, not a claim that the full candidate source equals the newer main branch.

Routes and source leaves are unchanged, so `source-targets.ts` requires no adjustment. Bricklane branding and existing attribution remain intact. The independent Shell 2 footer workspace-switcher changes and the collapsed-layout CI readiness correction are separate batches.
