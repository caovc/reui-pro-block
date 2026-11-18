# Working Agreements week controls across styles

At 390px, Sera rendered a 40px week button in a 24px column. With either
foundation, clicking the right edge of Apr 6, Jun 29 or Sep 21 opened the
following week. Center clicks and keyboard navigation still opened the intended
week. The fix constrains the existing ReUI button to its table cell. In the
Nova and Sera boundary checks, all 28 real pointer selections opened the
intended week.

Luma exposed a separate scrolling issue. Its 346px viewport had space for the
five latest week buttons beside the 212px sticky row label. Scrolling all the
way to the end also revealed decorative trailing padding, hiding 2px of the
first button under the sticky label. The table now measures the button span
at layout time and keeps all five complete when they fit. On narrower screens
it still scrolls to the current week.

The 5481 production build passed all 16 phone and 16 desktop cases across
both foundations and all eight styles. The phone suite checked actual style
identity, full five-button visibility, historical access, popups and keyboard
focus. Nova and Sera retained their original 504px default scroll position.

The public Base/Nova default capture also showed 26 weeks, a 348px viewport,
852px content and 504px initial scroll at 390px. That reference run reached
the rendered default after its first interaction assertion timed out. Its
screenshot and geometry support the default-state comparison.

## Summary spacing and exported starters

At 390px the public Base/Nova table started at y=421. The local table moved from
414 to 421 after matching the reference font, progress label, panel spacing and
one-pixel header gap. The bar uses the exact ratio and displays the rounded
percentage. The final build passed four Nova phone checks across Base and Radix
with default and serif settings, including portalled controls and Escape.

Header downloads produced a 365-member Base/Lyra archive and a 360-member
Radix/Vega archive. Both contained the reference CSS, Inter font and license.
Each extracted starter built with reused pinned dependencies and passed a
browser smoke check of its compiled output, served font, popup and focus.

Both original source-drawer tests timed out waiting for download before their
copy and individual-file checks. The header download results cover a separate
entry point. The drawer flow remains open for investigation.
