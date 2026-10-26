# Pricing7 cross-platform title width contract

The closed Pricing7 title uses the actual ReUI free `EmptyTitle`. The original visual fix removed a consumer override that changed its tracking from the official `-0.35px` to `normal`. That product correction remains unchanged. This follow-up changes the width test's reference measurement because the previous absolute width came from one platform.

## Independent official reference

The public [Pricing7 catalog](https://reui.io/blocks/marketing/pricing/pricing-7) exposes the preview at `https://reui.io/preview/base/pricing-7?embed=1`. A fresh read of that preview confirmed the exact literal `Upgrade Your Plan`, weight `500`, size `14px`, line height `20px`, tracking `-0.35px`, and a `20px` line box. The observed Mac width was `119.078125px`. The existing historical visual evidence and original test remain preserved; they are not rewritten as Linux passes.

The independent test fixture uses those fixed text and typography constants. It does not read the target's text or computed CSS, import a product component, or derive an expected width from the target. It resets inherited styles and sets zero padding and border, a single non-wrapping line, no transforms, and the project’s verified Inter face. Its width is measured by the same browser and platform as the target, then the fixture is removed in `finally`.

Both target and reference must report the actual custom Inter font through CDP, with all 17 glyphs supplied by that font. Both must also retain the served 48,432-byte WOFF2 with SHA256 `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`. Matching fallback text is therefore insufficient to pass.

## Preserved failures and platform measurements

| Environment                                                    | DOM and text Range width |       Canvas width |
| -------------------------------------------------------------- | -----------------------: | -----------------: |
| Mac native                                                     |               119.078125 | 119.07546997070312 |
| Linux native, diagnostic run 40286825531                       |                 125.0625 | 125.05015563964844 |
| Linux `--font-render-hinting=none`, diagnostic run 40288750249 |                119.09375 | 119.08041381835938 |

Both tested viewports, 1440×1100 and 390×844, produced these values. Font bytes, Chrome version, computed weight, size and tracking matched; the reported computed width differed. Values were stable before and after diagnostic capture. Disabling hinting substantially changed Linux native measurements but left a `1/64px` DOM width difference from Mac. The original two-decimal assertion still failed. The manual none run finished with 31 passing and 2 failing cases, including Pricing7; it was not a complete fix.

The independent FreeType Badge experiment supports a hinting explanation for Flow’s Badge metrics. Its earlier claimed exact Pricing title match was withdrawn: the recorded hinted advance was 132, which gives 126.05 with tracking and does not match the original Linux Canvas value. The exact mechanism behind every Pricing glyph difference is not claimed here. Inter’s `fvar` has a weight axis, including a legal Medium instance at 500; its `STAT` 14pt metadata does not establish a variable optical-size axis. A PostScript name containing Regular does not prove that the selected weight is 400.

## Changed test oracle and retained checks

The width oracle changes explicitly from the single Mac constant `119.078125` to the independently measured reference span on the current platform. Precision remains `2`. This is a correction to the cross-platform test contract, not a product CSS repair or a claim that the old expected value is unchanged.

The test retains the original title literal, Inter family, tracking, three plan cards, ItemMedia centering, native selected Tabs focus ring and elevation, and screenshots. It additionally checks the target’s weight, size, line height, height and horizontal centering. Actual font and font-file evidence is asserted for both target and reference.

A private controlled regression applies the old `letter-spacing: normal` only to the target before the original typography snapshot. The independent reference remains fixed. The test must still fail on tracking and width. This mutation is not included in the normal test or product source. The fixed reference must also reproduce the historical Mac width on the existing immutable production preview. Linux native reference equality requires its own CI evidence; a Mac pass does not establish it.

## Validation status

On the existing immutable Mac production preview at port 5488, the updated spec passed once (one test covering both viewports, 3.5 seconds). The independent span measured exactly 119.078125px at both widths and retained custom Inter, 17 glyphs and the verified WOFF2 bytes. A separate private spec copy restored the old normal tracking; that control failed once as expected, with both tracking and width assertions red at each viewport (four soft failures). The actual title became 125.03125px while the independent reference remained 119.078125px. Both original control logs and its failure trace are preserved. Neither run changed product source or the default spec. No new compiler, install, Git write, product CSS edit, shared primitive edit, or deployment is included in this batch. The shared diagnostic/reference helper is owned by the Flow session; Pricing owns only its spec and this record. Original CI artifacts, the failed Mac-constant assertion, and the Linux none residual remain preserved. Safari, dark-theme fidelity, and unmeasured widths are not certified.
