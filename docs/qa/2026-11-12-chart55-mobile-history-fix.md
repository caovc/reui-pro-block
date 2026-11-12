# Chart 55 手机历史周修复 — 2026-11-12

状态：BLOCK-V05 窄范围修复已应用；候选 `http://127.0.0.1:5200/` 完整复跑 4/4 通过，浏览器窗口已释放。首轮 3/4 与后续复核记录保留如下。

## 已确认的问题与本轮证据

- BLOCK-V05 / P2，Working Agreements。原站 `https://reui.io/preview/base/chart-55?embed=1` 对应本地 `/base/#/preview/chart/status-tracker/chart-55`；手机 390×844。
- 本轮逐张查看 `/tmp/reui-visual-audit/blocks/11-agreements-reference-mobile.png`、`12-agreements-local-mobile.png`、`17-agreements-reference-history-start.png`、`18-agreements-local-history-start.png`，并与审计者核对为 accepted 证据；不引用旧 memory 作为结论依据。
- 两站默认看起来都是约五周。原站保留 26 周，内部 viewport/content 为 348/852px，scrollLeft 从 504 改为 0 后可查看 Apr/May。修复前本地内容仅 348px，Apr 6–Aug 24 被 `display:none` 移除，无法横滚到历史周。
- 同态 Sep 28 周详情关闭后 ArrowLeft 五次：原站到 Aug 24，本地止于 Aug 31。原站焦点未自动将 Aug 24 滚入视觉区属于原站边界，本修复使焦点目标进入可见区。
- 原站与本地根宽均为 390px；原站网络受阻的头像及独立 fixture 数值差异不列为本问题。

## 最小变更

- 仅修改 `working-agreements-matrix.tsx`：保留全部 26 周，沿用已有原生 Table/内部 `overflow-x-auto`；手机内容宽度至少 852px、Agreement 列固定为 212px 且 sticky，默认滚至最新五周。880px 以上容器恢复原有桌面列布局。
- 仅为 DOM 初始定位和容器尺寸变化使用 layout effect 与 ResizeObserver；方向键继续沿用现有 `focusNeighbor`，以原生 `scrollIntoView` 和 scroll margin 保证目标不被固定列遮挡。不新增键盘引擎。
- 继续实际复用已有免费 ReUI Frame、Badge、NumberField 与当前 Popover/Button/Table 组合。未发现需要新 ReUI 网格引擎的能力缺口，不改共享组件或 vendor；保留 MIT/OFL/第三方声明和 Bricklane 原创品牌。
- 不新增模块，现有 source-targets 已包含 matrix/model，无需修改共享 SourceTargets。

## 测试契约调整

原手机测试的 `toHaveCount(5)` 把“默认五周可见”误写为“只有五周可达”。依据本轮原站 DOM 和横滚证据，将其调整为每行 26 个可访问按钮、26 个周表头，并通过实际可视几何断言默认完整可见的仍为 Aug 31–Sep 28 五周。

保留既有桌面 940/1440、周详情、Pause/Undo、Edit Target、焦点回归、团队/过滤和 Revenue Map 断言；增加手机 Aug 24 键盘可见与详情、内部滚至起点后 Apr 6 点按详情、Escape 返回触发器和根宽不超过 390px 的断言。Base 与 Radix 两族执行。

## 环境与验收范围

- 本轮仅 **Nova、浅色、Base UI 与 Radix UI 两个 foundation**；未验收另外七套 style、暗色或所有 679 个 Block。用户新增的两 foundation × 八 style 覆盖由独立 style 审计继续执行，不能把本记录视为已完成全部组合。
- 候选根地址 `http://127.0.0.1:5200/`，Radix 路径 `/#/preview/chart/status-tracker/chart-55`、Base 路径 `/base/#/preview/chart/status-tracker/chart-55`。开始前 `curl -I --max-time 10` 返回 HTTP 200。
- Browser plugin not available：可用 skill 和工具搜索均无 Browser；使用已安装 Playwright 与 `/usr/bin/chromium`，最多一个 worker。没有安装依赖、启动 dev server 或打开 Source 用例。
- 原生测试视口为 1440×960、390×844；桌面测试另检查 940×960。修复图为本候选同轮采集并逐张 `view_image` 查看，共 10 张；同时复看本轮 accepted 原/本手机与桌面证据。

## 测试结果

| 批次                    | 结果          | 说明                                                                                                                                               |
| ----------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 首轮四例                | 3/4，52.3s    | Radix 桌面 15.7s、手机 7.6s、Base 桌面 16.9s 通过。Base 手机首个 26 周表头断言在 5s 内持续得到 0；失败终态 ARIA 已含全部 26 周。不能写成首次全绿。 |
| Base 手机原条件定点复核 | 1/1，总 13.1s | 该用例 10.5s 通过；保留原断言与预算，没有开启自动 retry。                                                                                          |
| 完整四例复跑            | 4/4，1.1m     | Radix 桌面 19.0s、手机 8.3s，Base 桌面 28.3s、手机 8.0s；全部原生及新增历史访问断言通过。                                                          |

三批均保持单 worker、test timeout 30s、action timeout 5s、expect timeout 5s、retries 0。首轮未挂载矩阵的时序原因尚未独立隔离，不能仅凭后续通过宣称所有首屏加载场景稳定。失败 trace 保存在 `/tmp/chart55-mobile-fix/test-results/official-chart55-56-native-ef665-keeps-all-history-reachable/trace.zip`；后续定点与完整复跑分别使用 `recheck-results`、`final-results` 目录，不覆盖首轮证据。

| UI 检查             | 结果与证据                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面身份、有效内容  | 两 foundation URL 与 `Working Agreements — Preview` 标题正确；ARIA 有页头、摘要和真实矩阵。                                                  |
| 框架覆盖层、console | 本轮四个截图 context 无 Vite 错误覆盖层；console warning/error 与 pageerror 数组均为空。                                                     |
| 手机默认            | 每行 26 周；root 390px、内部 viewport/content 348/852px、scrollLeft 504；完整可见周为 Aug 31–Sep 28 五周。                                   |
| 手机键盘            | Sep 28 详情关闭后焦点返回，ArrowLeft × 5 到 Aug 24；内部 scrollLeft 480，目标完整显示在固定 Agreement 列右侧，Enter 可打开 Aug 24 真实详情。 |
| 手机历史与详情      | 原生内部滚至 scrollLeft 0 后 Apr/May 可见，Apr 6 可点按打开 `Week of Apr 6 to Apr 12`、`3 of 5 PRs` 详情；Escape 回到该周触发器。            |
| 桌面                | 1440 / 940 下全部 26 周保留，viewport/content 分别 926/926px、882/882px，无内部横溢出；现有暂停、Undo、目标编辑、过滤/团队与焦点流通过。     |
| 视觉证据            | 两 foundation 的默认、Aug 24 焦点、Apr 历史、Apr 6 详情及桌面图共 10 张均已实际查看；桌面与修复前本地同态无布局回退。                        |

数值与 DOM 证据保存在 `/tmp/chart55-mobile-fix/evidence/summary.json` 及同目录各 `*-summary.json`、`*-default.aria.txt`。

## 命令与交付边界

- 定点格式和 lint：通过。`npm run format:check -- src/blocks/data/working-agreements-matrix.tsx tests/official-chart55-56-native.spec.ts docs/qa/2026-11-12-chart55-mobile-history-fix.md`、`npm run lint -- src/blocks/data/working-agreements-matrix.tsx tests/official-chart55-56-native.spec.ts` 及叶文件 `git diff --check` 均 exit 0。
- 原生运行：`PREVIEW_URL=http://127.0.0.1:5200/ npx playwright test --config /tmp/chart55-mobile-fix/playwright.config.mjs`；定点复核另加 `--grep 'base.*Working Agreements shows five recent weeks'`，完整复跑另加 `--output /tmp/chart55-mobile-fix/final-results`。
- 串行截图：`node /tmp/chart55-mobile-fix/capture.mjs http://127.0.0.1:5200/`。截图浏览器在脚本 finally 中关闭；原生测试进程已结束，本轮窗口已释放。
- 业务源码自首次定点静态检查后保持冻结；浏览器期间仅新增 `/tmp` 证据及更新本记录。未执行 Git 写入。新候选源代码查看、复制、单文件与完整 ZIP 的独立门禁由主会话协调，本记录不宣称其已通过。

## 截图

![Base 手机默认五周](/tmp/chart55-mobile-fix/evidence/base-390-default.png)
![Base 手机 Aug 24 焦点进入可视区](/tmp/chart55-mobile-fix/evidence/base-390-aug24-focus.png)
![Base 手机横滚至 Apr 历史](/tmp/chart55-mobile-fix/evidence/base-390-history-start.png)
![Base 手机 Apr 6 真实详情](/tmp/chart55-mobile-fix/evidence/base-390-apr6-detail.png)
![Base 桌面 26 周](/tmp/chart55-mobile-fix/evidence/base-1440-default.png)
![Radix 桌面 26 周](/tmp/chart55-mobile-fix/evidence/radix-1440-default.png)
