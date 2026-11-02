# ReUI public catalog metadata audit — 2026-11-02

As of the recorded audit window, all 672 current official public block IDs are present in the local catalog. The local catalog also retains one legacy example, `solution-dev-ops-7` (Deploy Board), giving 673 local entries. All 672 common short display titles match; missing IDs 0, identity mismatches 0.

The complete 672-ID URL sets agree across the official sitemap, full catalog index and all 79 public category markdown documents. Every category document returned HTTP 200 and its declared count matches its parsed ID list. Homepage, sitemap and markdown category sets also agree. This is an ID-by-ID comparison, not a conclusion from matching totals.

Audit window (Asia/Shanghai): **2026-11-02T11:57:06.560000+08:00** to **2026-11-02T11:59:11.960000+08:00**.

| Official public source                         | Retrieved UTC            | Response SHA256                                                    |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| [llms.txt](https://reui.io/llms.txt)           | 2026-11-02T03:57:07.533Z | `1c00d4f5d24b88d5aff740b8b6827a61936222e258854902185e3dffa257f863` |
| [llms-full.txt](https://reui.io/llms-full.txt) | 2026-11-02T03:57:07.729Z | `cd0d5880d54a697b6b232c0015fc6db4b103e2d25740b82ccad1d1c33091f527` |
| [sitemap.xml](https://reui.io/sitemap.xml)     | 2026-11-02T03:57:07.247Z | `5b935d6dfb43b05b527ffc787e62ee9a32d64bcf89f2bcd075848e4e2e2d511a` |
| [blocks](https://reui.io/blocks)               | 2026-11-02T03:57:07.479Z | `d54eff214c6ef52f7967df83d31ef3ad151abb7a593ce408970e3c2232f60f36` |

The companion [response evidence](public-catalog-audit-2026-11-02.json) contains URL, retrieval time and original response SHA256 for all 83 public text responses, including the 79 category documents.

This audit verifies current public metadata coverage. It does not establish implementation completeness, pixel parity or interaction correctness. Raw responses and long original metadata remain outside the repository in the private audit directory.
