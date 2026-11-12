# Pulse Dashboard 免费组件业务里程碑

状态：**5220 业务门禁 16/16 通过，交主会话协调独立提交。** 原包正常安装和原严格 build 通过；最小 smoke 的功能步骤走通，最终 console gate 因缺少 favicon 的 404 失败。共享 Source 性能任务保持 OPEN，其未完成的查看器实现单独跟踪。提交、推送和部署状态由主会话另行记录。

## 业务变化与实际复用

`pulse.tsx` 的 First Contact Resolution 使用既有免费 `ReuiTrend`，其基础实现来自 ReUI 免费 `c-chart-1/2/3/13/16/17` 的 ChartContainer、Recharts 图形、坐标轴和 Tooltip 组合。原手写图表 SVG 已移除，12 周本地数据、线性走势、绿色主题、350px 图表高度和百分比语义保留，补充了真实逐点 Tooltip 和键盘读数。

工单阶段使用既有 `template-progress.tsx`，依据 ReUI 免费 [radix-nova/c-progress-2](https://reui.io/r/radix-nova/c-progress-2.json) 与 [base-nova/c-progress-2](https://reui.io/r/base-nova/c-progress-2.json) 所声明的 Progress 实现。原手写 div/span 进度条已替换，继续表示 Escalated 50%、其它当前阶段 35%，并提供工单名称、阶段读数和 4px track。

Pulse 自定义部分为业务数据、百分比格式、工单阶段映射、绿色样式及键盘读数定位。免费组件的 MIT、字体 OFL 和既有素材归属继续保留；本次没有新增官方品牌、付费截图或外站素材。

## Nova 业务验证范围

已通过 Playwright `--list` 确认并在本轮完整执行以下 16 项，四个文件分别为 4/4、6/6、4/4、2/2 通过：

| 文件                                            | 例数 | Foundation   | 视口与行为                                                                                   |
| ----------------------------------------------- | ---- | ------------ | -------------------------------------------------------------------------------------------- |
| `tests/pulse-dashboard-free-primitives.spec.ts` | 4    | Radix / Base | 各 1440 / 390：12 点 Tooltip、键盘 Home/End/Arrow/Escape、阶段指示器、分页、筛选、无横向溢出 |
| `tests/pulse-ticket-consistency-native.spec.ts` | 6    | Radix        | 1440 / 390 各 2 项 Board/List、详情与新增工单；桌面另 2 项选择范围、唯一编号和原生校验       |
| `tests/pulse-ticket-detail-layout.spec.ts`      | 4    | Radix / Base | 各 1440 / 390：详情编号/标题结构、尺寸、关闭和返回焦点                                       |
| `tests/pulse-sheet-focus.spec.ts`               | 2    | Radix / Base | 各 1440：取消、编辑、删除后的 Dashboard 焦点                                                 |

合计 **Nova Radix 11 项、Nova Base 5 项**。原 6 项一致性用例只覆盖 Radix，不能描述为全部旧用例均已覆盖 Base；这批也不构成其它七种 style 的验收。

实际命令保留已有测试、预算、trace 和原生交互，使用一个 worker、零重试和首次失败即停止：

```sh
PREVIEW_URL=http://127.0.0.1:5220 \
PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/pulse-milestone-business-5220/v1.json \
npm exec playwright -- test \
  tests/pulse-dashboard-free-primitives.spec.ts \
  tests/pulse-ticket-consistency-native.spec.ts \
  tests/pulse-ticket-detail-layout.spec.ts \
  tests/pulse-sheet-focus.spec.ts \
  --config=.qa/onboarding.playwright.config.ts \
  --workers=1 --retries=0 --max-failures=1 --reporter=list,json \
  --output=/tmp/pulse-milestone-business-5220/v1
```

Browser 插件未提供，使用仓库已有 Playwright 与系统 Chromium 配置。业务入口为 `/#/template-preview/pulse` 与 `/base/#/template-preview/pulse`，新 context 默认 Nova；本轮按原用例核对了真实 foundation。

结果为 16 通过、0 失败、0 跳过、0 重试，约 148.8 秒。报告 `/tmp/pulse-milestone-business-5220/v1.json` 的 SHA-256 为 `2299a10ecc4ada59cf25d87ea94e0758b79f2a4a7553ceff6156215a4e4aa9f8`。业务测试前后 17 项 Pulse runtime/registry/test 哈希复核均无漂移。

已实际查看 Radix/Base 的 1440 和 390 图表截图，以及两种 foundation 的桌面筛选截图，共 6 张业务图：图表、坐标、阶段条未见本次明显错位，手机保留既有表格横向滚动，页面无横向溢出。Tooltip 的全部 12 点在四个场景中都有真实 DOM 断言。长截图中的固定导航记录的是滚动后的视口位置，不作为首屏固定栏定位回归证据。图片路径、尺寸、哈希及核对结果见 `/tmp/pulse-milestone-preflight/milestone-summary.json`。

## 先前真实原包的静态核对

原包由先前通过的“新增 3 份源码”用例通过真实 UI 独立下载，未复用缓存，也未替换或重打包：

`/tmp/reui-final-source/pulse-source-original-Puls-2c8b3-real-view-Copy-single-files/pulse-original-project.zip`

SHA-256：`105c50ba3f239734594b4d4b49bcaa8f94b2febfb40924327d2824bfa7a0a6e0`，258 个成员。归档 SHA、原 inventory 的每个成员哈希和原 proof 均一致。

- 12 份选定 Pulse/依赖源码的 ZIP、记录哈希与当前磁盘全部一致。
- 新增的 `pulse-secondary.css`、`trend-foundation.tsx`、`template-progress.tsx` 具有当次真实 DOM、clipboard、单文件下载和 ZIP 的一致记录，保存的单文件也匹配。
- 原闭包记录验证 229 份源码、827 条本地导入边，当次缺失和未声明依赖均为空。当前逐项核对包含 88 份 collaboration 和 17 份 Roster；Roster 全部一致。
- 当前源码仅 `src/templates/collaboration/filebox-auth.css` 与原包不同：原 SHA `74fe937cc7517b44594acb3c7b5c9c8bd191079e31200982a6aa173a3c433b4b`，当前 SHA `cd5afd2604bb331ee807b6688dcfc7189cc72eb05f60ad725b9b29f662aa8132`。
- `drive-settings-free/bricklane-logo.svg` 原始字节存在 Vite 序列化差异，规范化 XML 完全一致。其余非生成成员与当前磁盘一致。

因此，这份原包支持 Pulse 12 源保持一致及新增 3 源的历史四向证据，**不是当前完整 collaboration family 的 ZIP 快照**。原 9 源的查看/复制/单文件用例不因这次静态比较自动变为通过。详细比较保存在 `/tmp/pulse-milestone-preflight/original-zip-snapshot-comparison.json`。

## 原包正常安装、严格构建与 smoke

原包已逐字节解压到 `/tmp/pulse-original-105c50ba3f23-BHFWW4`；258 个原始文件与原 ZIP 哈希逐项一致。原 package、entry、配置及所有源码保留，外置清单为 `/tmp/pulse-milestone-preflight/original-extraction-inventory.json`。

原脚本为 `dev: vite`、`build: tsc --noEmit && vite build`、`preview: vite preview`，没有 postinstall；manifest 的 dependencies、devDependencies、overrides 与当前宿主相同。原包 foundation 为 `radix-nova`。

主会话在浏览器全部关闭的资源窗口授权使用 `nice -n 10` 正常运行 `npm install --cache /workspace/.npm-cache --no-audit --no-fund`，退出 0，新增 722 个依赖。npm 记录 peer dependency 与弃用警告；没有使用 legacy、ignore-scripts 等放宽参数。

随后使用原 `npm run build`（`tsc --noEmit && vite build`），退出 0，原 `tsconfig.strict=true`；Vite 构建约 3.69 秒，生成 34 个 dist 文件，记录 module directive 等构建警告。安装和构建后再核对，258 个原始成员哈希全部保持一致，仅产生允许的新 lock、node_modules 和构建输出。

结果及原输入/产物清单位于 `/tmp/pulse-milestone-preflight/normal-install-result.json`、`original-build-result.json`；完整日志为 `npm-install.log` 与 `original-build.log`。原包预览 `http://127.0.0.1:5297/` 返回 HTTP 200。

在 Nova Radix、1440×1000 执行了单个最小浏览器 smoke：真实 Pulse 初屏、12 个 chart 点及 Jun 9/70.7% Tooltip、TCK-4863 Progress50/Escalated、Enter 打开工单 Sheet、Escape 关闭及返回原 opener 焦点、无页面横向溢出。这些功能断言都执行通过，初屏与 Sheet 两张截图也已实际查看。

最终 console-health 断言失败：仅记录 `http://127.0.0.1:5297/favicon.ico` 的 404，无 pageerror。因此保留原始 smoke `passed:false`，没有补 favicon、修改原包、排除错误重跑或宣称全部 smoke 通过。报告位于 `/tmp/pulse-milestone-preflight/original-smoke/results.json`，trace SHA-256 为 `9b0df6f745d54c26f96a783c76199a7e10cb6b74797de9da8630ab8e5c1d9fc4`。

smoke 后再次核对，258 个原始文件仍全部匹配原 ZIP。所有浏览器已关闭。这些结果验证此历史原包自身；旧 Filebox CSS 限制和“非当前完整 family ZIP”结论保持不变。

## 交付边界

由主会话协调 Pulse 业务文件、相应 source-targets 范围和验证证据的独立提交。Source 专用 dialog/highlight/worker、Vite 及其它未证明修复的共享性能 WIP 不随本里程碑自动提交。Source containment CSS 单行已由主会话撤回且未提交；本轮不再修改 Source 查看器。

现有原 9 份源码回归的预算和全部断言保留；其 Pulse 实现的 frozen hash 同步为本次实际字节。共享 Source 查看、复制、单文件和当前完整 ZIP 的门禁继续独立跟踪，不由业务 16 项或历史原包构建替代。
