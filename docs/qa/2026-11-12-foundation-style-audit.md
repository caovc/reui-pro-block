# Foundation × Style 审阅（2026-11-12）

**审阅结论：真实双 foundation / 八 style 已有代表行为证据，但尚不能宣称视觉和导出全面通过。**5210 core 32/32 通过；FSA-05 Sera Host 快捷键溢出已在 5240 完成两库八 style 的 16/16 专项回归；FSA-06 responsive 按钮已完成两库八 style、两宽的全部 32 个状态（首轮 30 个通过，另两例保持原配置定点通过，首次等待超时仍保留）。5220 两个完整导出 case 为 0/2，已完成的 ZIP / 默认文件子集保留为独立证据。

本报告关注真实的 Base UI / Radix UI 实现、八种 style 的实际表现，以及预览、持久化和导出的一致性。当前完成的是**源码审阅、真实 Vite resolver 验证、Filebox 的 16 组合 tooling，以及 5210 production 的 16 组合 × 2 个真实行为，共 32/32 browser cases**。官网取证目前只确认两个 library 选项，尚未取得官网完整八 style 菜单或同态视觉对照。这里的产品通过范围仅为下面明确列出的代表流程。没有修改 runtime、Vite 配置或其他会话的 WIP，没有执行 Git 写操作。

环境：`/workspace/reui-pro-block`，hostname `a7516a9949de`。静态快照 HEAD 为 `5fb63e5ff3c52a84a985ca28471e368cb0beec28`，工作区同时有其他会话的未提交修改。上述 HEAD 和 2026-11-12 09:54–10:03 UTC 仅标识静态阶段；后续浏览器与独立截图复核的候选、报告和证据分别列在各节。适用说明已读取：根 `AGENTS.md`、Frontend Testing Debugging、shadcn、React Best Practices 和 Cloud Environment Runtime。Browser plugin 未提供；后续使用 Playwright 时保留此原因、单 worker 和默认 failure trace，不放宽预算、不使用 force 或 TLS 绕过。

## 已查清的实现边界

| 范围            | 实际实现与证据                                                                                                                                                                       | 本轮结论                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Foundation 入口 | `src/lib/ui-foundation.ts` 从 build mode 识别 primitive；根入口 Radix，`base/` 入口 Base；切换使用同 hash 路由及 preset 的 `location.replace`                                        | 有独立真实构建路径，不只是 UI 标签                                                  |
| 真实 resolver   | `vite.config.ts` 的 `bricklane-base-ui` 优先解析共享 UI 到 `src/foundations/base/ui/`；实际创建 Base Vite server 的 plugin container 验证 alias、绝对路径、相对路径                  | Select / Dialog / Button 均解析至 Base 文件；Chart / Input 合理复用中立文件         |
| 真实 primitives | Base Select 导入 `@base-ui/react/select`，Dialog 导入 `@base-ui/react/dialog`，Button 导入 `@base-ui/react/button`；对应 Radix 文件直接使用 `radix-ui`                               | 不是改路径或 `data-ui-primitive` 后仍用同一交互实现                                 |
| 替换面          | `src/foundations/base/ui/` 共 41 个 TS/TSX 模块；共享 UI 中 35 个直接导入 Radix 的文件都有 Base 对应实现                                                                             | 本次静态扫描未发现缺失的直接 Radix 替换；没有穷尽依赖的全部运行路径                 |
| Styles          | `UI_STYLES` 实际为 Nova、Vega、Maia、Lyra、Mira、Luma、Sera、Rhea；`profiles.ts` 与各控件 CSS 模块产生尺寸、圆角、间距、字重/字号、菜单和 portaled overlay 差异；Nova 以原样式为基线 | 本地确实有八种 profile；同名及 CSS 存在不等于已与官网视觉等价                       |
| Theme 状态      | `global-theme-store.ts` 使用版本化 localStorage、URL preset、hashchange、storage 和父窗口 message；`global-theme-root.tsx` 应用 theme 并在 primitive 不一致时切换构建                | 能找到完整链路，仍需真实 reload / 跨 route / iframe / 分享接收者验证                |
| Theme 控件      | Base 6 项、accent 19 项（含 default）、chart 4 项、body/heading font 各 6 项、radius 5 项、mode 4 项、menu 和 menu accent 各 3 项；另有 custom HEX                                   | 没有独立字号设置，字号差异来自 style；不把不存在的字号开关算作通过或失败            |
| 导出选源        | `selectFoundationSources` 在走依赖闭包前，把 Base 的真实内容覆盖到消费者的逻辑 UI 路径；`components.json.style` 为 `${primitive}-${style}`                                           | 选源不依赖展示标签；需要 browser 证明 Copy / 单文件 / ZIP 使用当前快照              |
| ZIP 与声明      | `bundle.ts` / `templates/source.ts` 使用同一选源、themeCSS、starter HTML / main；Base 包脚本带 `--mode base-ui`；携带 ReUI MIT、字体 OFL、第三方声明及 style 的 MIT notice           | 两包都携带完整 dependency 集；含两个 primitive package 不构成选错 foundation 的证据 |

2026-11-12 10:02:57 UTC 的 HTTP 预检：`http://127.0.0.1:5200/` 和 `/base/` 均 200，分别引用 `./assets/index-D_QcyF_z.js` 与 `./assets/index-BWM9FyCd.js`。这只能证明入口及不同脚本存在，不能替代 DOM、interaction 或截图。后续候选 5210 的结果须单独记录，不能继承 5200 的通过状态。

## 官方免费源码核对

通过正常 TLS、跟随官方 307 跳转读取以下免费 registry，原始 JSON 暂存在 `/tmp/foundation-style-audit-2026-11-12/`，未下载官方图片，也未将参考素材放入产品或 ZIP。

| 官方样本（Radix Nova 与 Base Nova 各一份） | 真实结果                                                                                                                                             | 对本地审阅的影响                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `c-dialog-1`                               | 均声明 button / dialog / field / input；Base trigger / close 使用 `render`，Radix 使用 `asChild`                                                     | 检查实际交互和兼容适配，不能只检查名称                                           |
| `c-field-1`                                | 均声明 field / input / input-group                                                                                                                   | Field 和 Input 可以是共享的无 primitive 组合；Label 等内部依赖仍由 resolver 选择 |
| `data-grid`                                | 两份都声明 `@base-ui/react`；scroll-area 和 direction-provider 在两份都直接导入 Base；交互组件依赖仍含 button / checkbox / dropdown-menu / select 等 | Radix DataGrid 中存在 Base scrollbar 是官方做法，不能据此报混用缺陷              |
| `number-field`                             | 两份都直接导入 `@base-ui/react/number-field`                                                                                                         | Radix 预览使用此免费 NumberField 也是合法复用                                    |
| `frame`                                    | 两份均不导入 primitive，只依赖 cva / cn                                                                                                              | Frame 的 style 应看真实 computed CSS，不要求人为复制 primitive 版本              |

以上 registry 结果仅为 Nova 来源核对。官网 browser 取证补充见下节；完整 style 选项、foundation 切换及其余七种 style 语义仍待验证。本地 `styles/README.md` 的 upstream revision 和 style profile 是线索，不是官网本轮对照证据。

## 官网浏览器取证（10:07–10:10 UTC，部分完成）

使用单一 Playwright Chromium、1440×1000、继承 HTTPS_PROXY、正常 TLS；Browser plugin 未提供。实际 URL 为 `https://reui.io/components/dialog`，标题 `Shadcn Dialog - UI Components - ReUI`。先正常关闭官网 GitHub star 提示，再点击 Customize preview。

- 实际 customizer 当前值为 Base UI / Nova / Light；Component Library 菜单真实可见 Base UI、Radix UI。稳定截图 `official-library-popover.png` 支持这两个选项，页面 DOM 另存 `official-library-popover.txt`。
- 页面说明明确提及兼容 Radix UI / Base UI，以及 Shadcn Create style options。实际可见 Field、Input、Dialog 的免费 registry 关系与前述源码取证一致。
- **未完成**：八 style 菜单展开、primitive 实际切换、免费 Dialog / Field 的同态截图。本轮 `getByText("Radix UI", exact)` 命中了隐藏 SVG title；5 秒等待失败，后续 visible text 点击也在 30 秒失败。这是审阅脚本定位未完成，不能视作官网或本地产品缺陷；没有放宽超时。
- `official-customizer-open.png` 捕获到了侧栏进入动画中的裁切状态，不用于几何或完整侧栏视觉结论。以稳定的 library-popover 截图为准。
- 页面没有记录到 pageerror / console error。保留的截图、DOM、脚本及 `official-customizer-trace.zip` 均位于私有 `/tmp/foundation-style-audit-2026-11-12/`，未放入产品或 ZIP。浏览器已关闭，进程检查无残留。

10:34–10:35 UTC 的追加官网短采保留两次独立结果与 trace：第一次已用 menuitemradio 正确点击，但错误地假设 radio 选择后会自动关闭，原 5 秒断言失败；实际保持菜单打开是官网设计。第二次改为正常 Escape 关闭，但新页面在原 5 秒内未形成 hydrated 的 Customize preview 控件，failure 截图为 SSR 内容及组件 spinner。两次均正常关闭浏览器，没有 TLS / 网络拦截或页面错误证据；未取得完整 style 菜单或双基础预览 URL，不据此新增产品 finding，也不放宽等待或继续重试。

## 本轮已运行的非浏览器验证

`node --test tests/block-foundation-source.test.mjs tests/template-foundation-source.test.mjs`：3/3 通过，约 27.6 秒。

- Block 单测验证 Base provider / helper 的闭包替换及 registry 16 组合，但输入是小型 mock，不能算真实产品 16 组合导出通过。
- Template 单测实际载入 `templates/source.ts`，对真实 Filebox 的 16 组合逐一验证选中的 Button 原文件、逻辑路径、theme CSS、HTML primitive/style、MIT/OFL、registry、manifest 和 Base build mode。没有运行提取后 starter，也没有点 Copy 或下载。
- 真实 Vite resolver 另行验证 `@/components/ui/{select,dialog,button,chart,input}`、Select 绝对路径和 DataGrid 目录中的 `../../ui/select`。没有启动浏览器，也没有重建 production。

## 5210 production 实测（32/32，通过）

正式测试已新增到 `tests/foundation-style-product-native.spec.ts`，由仓库的 `*.spec.ts` 测试匹配，使用配置的 baseURL 推导两个入口，没有硬编码 5210 或私有路径。定向 format、format:check、oxlint 和 --list 通过后执行，32/32 通过，约 10 分钟。单 worker / 单 browser，case timeout 30 秒、action timeout 5 秒、默认 failure trace；本轮使用已安装的 `/usr/bin/chromium`，没有安装依赖或改动 runtime。

命令通过 `PREVIEW_URL=http://127.0.0.1:5210` 选择真实 production，由私有 config 仅指定本机 Chromium 和 `/tmp` 输出目录。5210 两入口复核时间 10:32:30 UTC，均为 200：根脚本 `index-CA13K4tJ.js`，Base 脚本 `index-CNB1BY31.js`；详情见私有 `production-entry-footprints.json`。结果不能自动继承到下一候选 5220。

| 行为边界        | 真实动作与证据                                                                                                                                                                                                                                                                              | 结果                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 控件 / overlays | 从正常 Customize 选择各 style；Prospect Database 实际显示 10 行；Add Company 打开原生 Sheet；Company Name 输入 Foundation audit；Input 实际高度匹配对应 style；Industry 展开 7 个 option 并选择 Healthcare；Escape 关闭 Sheet 且回焦 Add Company；Hand Over 打开真实 Dialog，再 Escape 关闭 | 两 foundation × 八 style，16/16                                                                                                      |
| 原生实现        | 对 Sheet / Dialog 与 Select 的真正 Popup，Base 验证 `data-open=""`，Radix 验证 `data-state=open`；保留 listbox 可见及真实 option 选择断言                                                                                                                                                   | 不是只检查根 HTML 标签                                                                                                               |
| 持久化 / 跨模板 | Customize 选择 style → reload 后控件高度及 style 保持 → 到 Manifest → 点击预填的本地 demo Log in → 真实 Store dashboard / sidebar-wrapper 可见 → 返回真实 Block 并确认 iframe style 和内容                                                                                                  | 两 foundation × 八 style，16/16                                                                                                      |
| 健康            | 每 case 检查正确页面标题、真实有内容、无 Vite overlay；收集并断言 console error / warning / pageerror 为空                                                                                                                                                                                  | 32/32                                                                                                                                |
| 截图            | 每组合生成 Field/Sheet、Dialog、已登录 Manifest workspace、返回 Block 四个 fresh 状态，共 64 张                                                                                                                                                                                             | 全部生成；作者亲看 35/64（全部 32 导航图及 3 控件图）；独立组另实际复核全部 32 控件图，与作者重叠 3 张，团队联合复核这 64 张指定视口 |

截图及日志保存在私有 `/tmp/foundation-style-audit-2026-11-12/native-results/` 和 `native-run.log`。作者已实际 view 全部 32 张 Manifest workspace / returned-block，并另看 Base Maia Field/Sheet、Base Lyra Dialog、Base Sera Field/Sheet 三张控件图，共亲看正式图片 35/64；精确路径、SHA 前缀和逐图观察在私有 `navigation-visual-review.md`。独立组实际 view 全部 16 Field/Sheet 与 16 Dialog，报告在 `/tmp/foundation-style-independent-visual-review.md`，与作者重叠三张。团队联合覆盖的是这 64 张 **1440×1000 可见视口**，不是全页面、Sheet 底部、保存行为或完整可访问性认证。Radix Industry focus ring 与 Base 的截图差异按焦点状态解释，没有据此报交互失败。

导航图中，Manifest 的圆角、方角、间距和 Sera 大写字距真实变化可见。返回 Prospect 的 Nova 两组 CTA 标签正常；全部七个非 Nova 的两 foundation 都出现图标尺寸按钮挤出桌面文字的 FSA-06。Sera Host 的 FSA-05 则由 5220 独立 bbox / hit-test 确认。截图生成与人工审阅、core 行为通过与新增视觉 finding，均分开计数。

在这些本地 fresh 状态中，style 变化确实影响了可见控件、overlay 和模板，而不是只改变主题标签。早期私有批次的实际 CSS 采样（Radix，仍为同一 5210）还显示以下差异；Lyra 那个早期整 case 总时长失败，不改变这些已经完成的控件子步骤证据，正式拆分后的 Lyra 两 case 已独立通过。

| Style | Input 高度 / 圆角 / 字号 | Select trigger 圆角 | Dialog 圆角 / padding |
| ----- | ------------------------ | ------------------- | --------------------- |
| Nova  | 32 / 10 / 14 px          | 10 px               | 14 / 16 px            |
| Vega  | 36 / 8 / 14 px           | 8 px                | 14 / 24 px            |
| Maia  | 36 / 26 / 14 px          | 26 px               | 26 / 24 px            |
| Lyra  | 32 / 0 / 12 px           | 0 px                | 0 / 16 px             |
| Mira  | 28 / 8 / 12 px           | 8 px                | 14 / 16 px            |
| Luma  | 36 / 22 / 14 px          | 22 px               | 26 / 24 px            |
| Sera  | 40 / 0 / 14 px           | 0 px                | 0 / 24 px             |
| Rhea  | 32 / 18 / 14 px          | 18 px               | 24 / 24 px            |

### 保留的早期失败与修正

最初默认 Chromium 缓存不存在，启动失败 trace 已独立保存在 `product-launch-failure/`；之后使用现有系统 Chromium。早期私有大 case 把控件、reload 和多次导航合在一起，单独 Nova pilot 1 通过，其余 15 case 批次为 6 通过、5 失败、1 中断、3 未运行，即原 16 组合合计 7 通过 / 5 测试失败 / 1 中断 / 3 未运行：

- Radix Lyra 在原 30 秒总预算耗尽；控件、reload 和 Manifest 已完成，最后返回 Block 的断言未在剩余预算内结束。没有把部分完成当整 case 通过。
- Base Nova / Vega / Maia / Lyra 失败是测试 oracle 错误：Base 的 role=listbox 是内部 List，原生 open 状态在真正 Popup 祖先。原截图、error-context 和 trace 保留。Base Mira 在相同断言处按主会话要求中断，不能列为产品功能失败。
- 正式 spec 按真实行为拆为两个独立 case，全部原断言保留；将 native-open 精确定位到 `[data-slot=select-content]`，保留 listbox 可见、七 option 和真实选择，并实际登录 Manifest workspace。没有放宽 30 秒 / 5 秒预算，也没有修改产品来迎合测试。

早期证据保存在 `product-results/` 和 `product-matrix-results/`。正式 32/32 不抹掉这些失败记录；这些失败也不能误报成 Base 或 Lyra 的产品缺陷。

## 16 组合状态矩阵

产品列只指本轮 5210 正式 spec 的代表行为及 Input 高度断言，不表示工具栏宽度或全局视觉无缺陷；Filebox 列仍为独立非浏览器 tooling。Copy / 单文件 / ZIP 尚未由这 32 例覆盖。

| Primitive | Style | Filebox 选源 / theme / registry / notice / manifest | 代表行为 / Input 高度 | reload / 跨 route          | Copy / 单文件 / ZIP                 | 官网同态       |
| --------- | ----- | --------------------------------------------------- | --------------------- | -------------------------- | ----------------------------------- | -------------- |
| Radix     | Nova  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Vega  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Maia  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Lyra  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Mira  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 5220 整例失败；ZIP/默认文件子集通过 | 未完成官网对照 |
| Radix     | Luma  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Sera  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Radix     | Rhea  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Nova  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Vega  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Maia  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 5220 整例失败；ZIP/默认文件子集通过 | 未完成官网对照 |
| Base      | Lyra  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Mira  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Luma  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Sera  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |
| Base      | Rhea  | 通过                                                | 通过（Prospect）      | 通过（Manifest workspace） | 仅 tooling，未点 UI                 | 未完成官网对照 |

## 5220 导出：整例 0/2，ZIP / 默认文件为部分通过

在独立窗口串行执行原 `tests/grid-advanced-prospect-foundations.spec.ts` 的两个导出 case，Radix Mira 与 Base Maia；没有改断言、helper、30 秒总预算或 5 秒 expect，也没有修改源文件。两完整 case 均失败：

| 组合       | 实际完成                                                                                                                                                                     | 未完成 / 失败位置                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Radix Mira | 原 ZIP 下载及 inventory 保存；required files、registry style、style CSS 检查；默认实现文件的源码 / Copy / 单文件下载链完成，下载 bytes 与原 ZIP 一致                         | 第二个 dropdown-menu source 文件选择后，helper 第 92 行 `aria-expanded=false` 检查时原 30 秒总预算耗尽 |
| Base Maia  | 原 ZIP 下载及 inventory 保存；required files、registry style、style CSS 检查；默认实现文件的源码 / Copy / 单文件下载链完成，下载 bytes 与原 ZIP 一致；第二文件内容匹配已通过 | 第二个 dropdown-menu 的 Copy 点击在原 30 秒预算耗尽；locator 已可见、enabled、stable，但整例没有完成   |

离线再核对保留的原 ZIP：Radix Mira 为 359 成员，Base Maia 为 364 成员；`components.json` 为正确 style，`dropdown-menu.tsx` 逐字匹配对应真实 Radix / Base 实现，ReUI MIT 和 Inter OFL 存在；Base build 脚本带 `--mode base-ui`。两份默认实现单文件与 ZIP 中内容逐字一致。完整记录在私有 `export-5220-static-archive-checks.json`，原 ZIP、失败 PNG / error-context / trace 和日志在 `export-5220-results/`、`export-5220-run.log`。

这些证据支持“选源与已完成的下载子集正确”，**不能支持“两个出口整例通过”或“所有 foundation/style 出口通过”**。没有运行提取后的 starter build。Source UI 的性能 / 整链完成状态继续开放，不用这部分 ZIP 证据结案。

## 已确认视觉 finding

### FSA-05 — P2：Sera Host 搜索 kbd 越出按钮并被 Customize 遮挡

5220，1440×1000，light，Radix 和 Base 结果一致，fonts loaded。只读测量：Search 按钮右界 990.921875，Customize 左界 997.921875，按钮盒仍相隔 7px；kbd 右界 1003.734375，越出 Search 12.8125px，并与 Customize 相交 5.8125px。kbd 中心命中 Search，最右侧及交叠区的 `elementFromPoint` 命中 Customize。因此这是内部内容溢出及相邻遮挡，不是两个按钮盒互相重叠。

原 JSON / PNG 在私有 `host-bbox-5220-results/`。旧源码为固定 198px 的 `.search-trigger`、无 shrink/truncate 的文字 span 和 `margin-left:auto` 的 kbd，Sera 大写字距和 padding 增大后不足。Lucent 的消费者 CSS 修复保留免费 ReUI Button 和 style 实现，5240 两库八 style 的 16/16 专项已通过，并补齐鼠标及 Ctrl+K 原入口返焦。修复后截图与数据见 `docs/host-search-style-fit-2026-11-12.md`；本报告作者没有改 runtime。

### FSA-06 — P2：非 Nova style 把 responsive 桌面文字按钮锁为 icon 宽度

5210 fresh returned-block 截图中，两 foundation 的七个非 Nova 均出现 Hand Over / Add Company / My Accounts / Columns 这四个 icon 动作的标签挤出狭窄按钮，并影响相邻 Filter 可读性；Filter 自身为 default size，不把它归为第五个 icon-width 实例；Nova 正常。保留的实际 Radix Add Company 宽度为 Nova 139.03125px，Vega / Maia / Luma 36px，Lyra / Rhea 32px，Mira 28px，Sera 40px。消费者源码明确使用 `size=icon` 加 `sm:w-auto` 和桌面可见 span；当前 style 层把宽度重新固定，覆盖了消费者 responsive auto-width。5220 的相关 style 实现 SHA 与取证时一致。

已由主会话确认为共享 style 层 P2，并交 Atlas 准备修法。随后在 5220 保持源未修，完成 Nova / Vega × 两 foundation 的四个只读 context（1440×1000、fonts loaded、原 30 秒 / 5 秒、failure trace），测量完成 4/4，0 console error / warning / pageerror。这里的 4/4 表示取证成功，不表示有缺陷的 Vega 视觉通过。

后续 5240 修复在保留 icon 尺寸的同时，为显式 auto-width 按钮恢复内在文字宽度；手机隐藏 caption 时仍保持方形。专项覆盖两库 × 八 style × 桌面/手机及四个真实动作、Escape 与入口返焦：首轮 30 通过、Base/Rhea 桌面点击已送达但 navigation wait 超时、最后手机未跑；保持同源码、同测试、30秒/5秒和零重试，定点两例随后 2/2 通过。首次 trace 仍保留，未加 noWaitAfter、force 或提高预算。全部 32 个有效状态截图已由专项 owner 实际查看；主会话另查看 Sera 桌面、Vega 桌面和 Mira 手机。详见 `docs/responsive-toolbar-style-fix-2026-11-12.md`。这不等于全站或单轮 32/32 验收。

| 动作        | Nova 按钮宽 / caption 宽  | Vega 按钮宽 / caption 宽 | Vega caption 的实际 hit-test                     |
| ----------- | ------------------------- | ------------------------ | ------------------------------------------------ |
| Hand Over   | 115.34375 / 71.34375 px   | 36 / 71.34375 px         | 中心及末端命中 Add Company                       |
| Add Company | 139.03125 / 95.03125 px   | 36 / 95.03125 px         | 中心仍命中自身，最右端命中 SECTION               |
| My Accounts | 136.125 / 88.125 px       | 36 / 88.125 px           | 测到的中心及末端仍命中自身，但文字实际越出按钮盒 |
| Columns     | 121.078125 / 59.078125 px | 36 / 59.078125 px        | 文字末端命中 Settings                            |

两 foundation 的数值一致；Nova 的四个 caption 均不越界，测到的点全部命中各自按钮。原 JSON / PNG 和日志保存在私有 `auto-width-5220-results/`、`auto-width-5220-run.log`。**没有实际点击这些文字点，不声称已触发具体错误动作**，也不扩大到尚未检查的消费者或手机。core 32/32 并未断言这些 caption 宽度，因此与该 finding 可以同时成立。

## 后续限定范围和未覆盖项

5210 的代表产品 32 例已完成；后续只在主会话确认的新候选和窗口中处理剩余项。不能将这两个产品面的通过扩展为全库通过，也不能把 5210 证据替代 5220。

| 待补范围             | 明确边界                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 官网 style / library | 当前只有两个 library 实际选项和 Nova 来源；完整八 style 菜单、切换后的 URL / iframe 是否存在、官方同态几何均未完成，不把本地同名 CSS 当等价证据。                         |
| 完整导出 / starter   | 5220 两完整 case 0/2，部分 ZIP / 默认文件已核对；第二源码文件的 Copy / 单文件完整 UI 链及提取 starter build 尚未通过或未运行。                                            |
| 新候选 core          | 32/32 来自 5210；5220 只有本报告明确列出的 Host 取证与两个导出 case，不继承整套 core 通过。                                                                               |
| 视口与 theme 因子    | 本报告主矩阵只有 1440×1000 light、默认 font/radius；没有扩大 phone、dark、font/radius 极端组合。其它 owner 的手机 header 专项须按其独立报告限定引用。                     |
| 全库组件及真实库切换 | 只覆盖真实 Prospect / Manifest 代表面与已列 native primitives；没有将全部 block/template、所有 shared controls、图库、库切换按钮的 URL 保持及分享接收者行为一并宣称通过。 |

私有免费组件 fixture 的通过，只能说明底层几何和来源校准，**不计入 production 产品 16 组合通过**。官网截图只作为审阅证据，不能进入产品或导出包。

## 推荐任务与覆盖缺口

以下是给主会话的建议 ID，不直接改动共享 backlog。

| 建议 ID | 性质 / 状态                     | 证据与下一步                                                                                                                                                                                                                                                            |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FSA-01  | 自动化改进任务（非产品缺陷）    | `tests/ui-style-foundations/verify*.mjs` 真实覆盖 16 组合的控件 computed styles，但不匹配 `npm test` 的 `*.spec.ts`，也不匹配 `test:tooling` 的 `*.test.mjs`，deploy workflow 没有单独调用；且无截图和 tracing。先在窗口中验证其价值，再建议接入受控 CI，保留失败诊断。 |
| FSA-02  | 代表产品验收已完成（非全库）    | 已新增正式 `tests/foundation-style-product-native.spec.ts`，本轮 5210 代表产品 32/32 通过，补入 CI 的 *.spec.ts 匹配；控件与持久化子矩阵完成。两非 Nova 导出、官网同态及全库其它组件不在此完成结论内。                                                                  |
| FSA-03  | 已披露的设计意图 / 非缺陷       | `docs/global-theme-customizer.md` 原有明确契约：Decorative artwork and chart series with fixed, nonsemantic colors retain those colors。`BusinessBars` / `BusinessArea` 固定 series 色按此已披露设计意图保留观察，不列为产品缺陷；本轮不扩大图表配色场景。              |
| FSA-04  | 文档修正 / 已完成               | 已小范围修正 `docs/global-theme-customizer.md` 的固定 Radix/Nova 旧说明，说明真实双入口、八 style、合法共享 primitive 及本轮未验证边界；旧浏览器结果标明为 2026-10-23 快照。                                                                                            |
| FSA-05  | P2 / 已修复，Lucent owned       | Sera Host 已在 5240 两库八 style 专项 16/16 通过；保持样式并修复内容收缩、鼠标/Escape/Ctrl+K 原入口返焦。详见 `docs/host-search-style-fit-2026-11-12.md`。                                                                                                              |
| FSA-06  | P2 / 已修复，Atlas owned 共享层 | 5240 两库八 style 两宽的 32 个状态已验证：首轮 30 加原配置定点 2；首次 navigation-wait 失败保留。真实按钮命中、四项动作、方形手机图标与消费者 Handover 返焦均已检查。详见 `docs/responsive-toolbar-style-fix-2026-11-12.md`。                                           |

目前正式 16 组合 × 2 代表行为全部通过；团队已实际审阅64张指定视口图，但不代表全站所有 style 的视觉都无问题。FSA-05 / FSA-06 的确认与修复状态如上单列；不能因 core 32/32 通过宣称视觉没有问题。尚未覆盖官网完整八 style 列表及同态对照、5220 完整 core 32 矩阵、移动端完整矩阵、dark / 字体 / radius 等极端组合、所有模板/blocks、全部 native primitive、提取后 starter 构建和完整第二源码文件的 Copy / 单文件 UI 链。Source 文件选择性能由独立任务继续跟踪，未被这 32 例覆盖或结案。
