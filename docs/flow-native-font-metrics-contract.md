# Flow native font metrics contract

The Flow badge test compares its intrinsic text width with an independent native text fixture on the same browser platform. Product CSS and the official free ReUI Badge implementation are unchanged.

The previous macOS golden value was `76.796875px`. Native Linux Chromium rendered the same custom Inter font, with the same font bytes and CSS, at `79px`. The SVG remained `12px`; padding, border and gap remained correct. In manual run `40288750249`, the diagnostic-only `--font-render-hinting=none` flag restored the original Flow width and text advance. The flag is not applied to the normal product or test configuration.

The historical native run `40286825531` remains recorded as 28 passed / 5 failed, and the none run as 31 passed / 2 failed. Pricing still failed in the none run: its DOM width was `119.09375px`, compared with the original macOS `119.078125px`. These records are retained; this contract correction is not a claim that product typography was repaired by changing CSS.

## Independent reference

`measureReferenceText` uses fixed official text and typography constants. It creates a temporary offscreen, transparent native span with `all: initial` and explicit inline properties, then removes it in `finally`. It never reads the target's text or styles, imports product components, or loads fonts to repair the target state.

- Flow: `Success`, Inter 500, 12px / 16px, normal tracking.
- Pricing: `Upgrade Your Plan`, Inter 500, 14px / 20px, -0.35px tracking.

The Flow badge must equal the independent text width plus 28px: 10px horizontal padding, 2px border, 4px gap and a 12px icon. Precision remains 2. Separate assertions enforce the actual text, font family, weight, size, line height, tracking, padding, border, gap, badge height and original SVG width. All original menu, layout, selected-paint, keyboard and canvas assertions remain.

Both the actual target and the independent fixture must report custom Inter glyphs through CDP. Both must retain the existing resource evidence for the 48,432-byte font with SHA256 `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`. This prevents a shared fallback font from satisfying the width comparison accidentally. The PostScript name's platform-dependent suffix is not used to infer font weight.

## Validation and limits

Against the existing immutable macOS production preview, the original 24 Flow cases passed. Four controlled counterexamples changed only a temporary target's weight to 400 or gap to 8px at 1440px and 390px. The independent fixture stayed at `48.796875px`; the unchanged precision-2 width matcher rejected each regression. A separate blocked-font counterexample showed that a width-only comparison can pass when target and reference both fall back, while the actual-font guards reject both.

After adding the target's explicit actual-font guard, the two affected geometry cases passed again. The other 94 original matcher calls are unchanged; only the fixed-platform width operand was replaced. No timeout or retry setting changed. The counterexample harness stays private and is excluded from the release payload.

The revised independent fixture still requires a native Linux run. Neither the prior none experiment nor these macOS results constitute that final gate. No new build, dependency install, product mutation or Git operation was performed for this private test change.
