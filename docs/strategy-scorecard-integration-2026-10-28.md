# Advanced14 Strategy Scorecard 交付审计草案 v2

2026-10-28。**私有草案，Root 发布前必须更新末尾验证栏。** 当前依据最终 clean-v4 固定源码、正常检查与 Source2 实际下载收据，并沿用 clean-v3 的必要行为检查和公开参考存档；本次只写文档，没有修改、重建或重跑任何源码、测试、配置。

## 实现与免费组件复用

入口为 `src/blocks/data/grid-advanced-strategy-scorecard.tsx`。页面实际组合既有 ReUI 免费实现，保留一个 DataGrid provider 和一个原生 `useTable`，没有另外复制一套表格引擎。

| 能力                   | 实际复用与消费者边界                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 树表、展开、选择和编辑 | `dataGridFeatures`、DataGrid/Table/ScrollArea/RowExpand、原生 `getSubRows`、expanded/filter/visibility 状态、DataGridCellSelection 与 cellEdit/onCellsChange。Value 的原始值编辑、Enter 提交、粘贴及范围拒绝由这些原生能力处理；消费者只做单位解析、领域写入和 Undo 历史。     |
| 条件筛选               | 完整免费 Filters/Advanced/FieldPicker/Operator/ValueEditor，内部使用实际 Cascader。领域 predicate 读取真实 FilterQuery 的 AND/OR、嵌套和否定；没有把 query 注入测试或另做菜单引擎。全局摘要独立于表格搜索、筛选和折叠。                                                        |
| View                   | 实际 DataGridColumnVisibility，使用最窄 children slot 追加 Objectives、Undo/Redo/Reset 操作。仍由原生列显隐和展开 API 执行。该 slot 属本地兼容扩展，不声称是上游原样 API；默认无 children 的既有 consumer 单独回归。                                                           |
| 壳与表单               | Frame/Header/Title/Description、Button、Field/Input/Textarea/Select、NumberField、Slider、Popover，以及原生 Sheet/Dialog/Tabs。NumberField 的可见输入实际是命名 textbox，隐藏 number input 是内部实现，不为测试改产品角色。                                                    |
| 图表                   | 真实 ChartContainer/ChartConfig/ChartTooltipContent 与 Recharts BarChart/Bar/Cell/ReferenceLine、LineChart/Line。Change 使用原始 signed 点变化决定零轴和颜色；34×16 小图及 14px 趋势 glyph 由消费者组合。没有手画 div/SVG 代替已有图表，没有关闭动画或字体补丁以制造稳定结果。 |
| 详情与状态             | Overview 三张实际 Card/CardContent；Owner 用实际 Avatar/AvatarFallback 显示原创 initials；rail 用实际 Progress/Badge/Button。Markets 按 score 升序、null 最后作派生展示，不修改原始数组。                                                                                      |

Perspective rail 是正常 28px 高的 sticky TD 内的消费者 overlay，宽 167px、高度为可见原生行数×28，内部内容 sticky top28。没有 HTML rowSpan，没有为 rail 改写 table row model。填充空白行通过最窄 appendRow slot 接入现有表体，不创建第二个 provider。

免费 Chart 组合参考包括已缓存的公开 c-chart-2 片段和项目中实际 Chart 实现。此前完整上游 HTTP 读取未完成，后续请求也失败；不能把这些失败记成完整免费示例已成功核验。实际组件复用可由当前 imports 和 render 调用核对。

## 原创数据与业务约定

Bricklane 使用原创 4 个 perspective、9 个 objective、30 个 KPI、10 个 market、2026 年 1–9 月共 9 期原始观察，以及原创人名、initials 和描述。公开参考只用于能力、布局和交互观察；未把官方 KPI 数值、姓名、描述或付费素材作为产品 fixture。因此本地摘要与官网示例的具体分数、计数不要求相同。

当前销售权重为 US30、GB14、DE12、CA9、FR8、NL7、JP6、AU5、SE5、NO4。只有 US30 来自公开观察，其余是明确标注的原创 demo 假设；perspective 权重也使用原创 32/26/24/18。原始观察不预存公司或摘要得分。

评分方向、baseline/target 归一、0–100 截断、正权重归一、缺市场即未评分、null 与零分离、可调阈值、同原始单位写入、市场并列顺序及跨单位 footer 汇总，都以 data/model 的 `ORIGINAL_DOMAIN_CONTRACT` 为准。默认阈值 70/45 可调整；cells 使用领域模型传入的 status，不再重复硬编码阈值。百万美元存储 1.88 表示 $1.88M，百分比存储百分点，界面编辑和 CSV 保留这一区别。

详情趋势图只展示至选中月份，Months raw 表保留九期，这是原创展示规则；未核实的官网其它月份行为不声称一致。新 KPI 从十市场×九期 null 开始，表单只有通过真实 validateKpi 后才保存。

## 公开参考证据的边界

公开参考入口为 [Advanced14](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-14)，存档目录为 `/tmp/bricklane-advanced14-reference-20261028-h1Bog5`。其中 desktop/mobile 默认、rail、搜索、字段编辑入口、Markets/Months 等为各自独立保存状态，不能合并成整条官网流程全部通过。

`first-action-timeout.json` 明确记录：选择 Off Track 后的操作发生 30000ms 工具超时，结果未知，没有对应的过滤后状态文件。官网 Off Track apply/关闭成功**未验证**。后来本地免费 Filters 用例通过，不能倒推官网该动作已成功观察。`completion-report.json` 还记录了后续脚本等待错误 Change 列 SVG 的首次失败；独立 phone 核对纠正列映射并采集 Markets/Months，没有重写旧失败证据。

不加载或分发官网头像、旗帜图、付费截图或提取 SVG。产品使用 Bricklane 原创素材及 initials；官方免费组件 MIT、字体 OFL、LICENSE 和 THIRD_PARTY_NOTICES 必须随完整下载保留。参考截图仅作私有 QA 证据，不作为下载素材。Source2 已检查真实 ZIP 的六个 leaf、51 个 required files、依赖和许可字节；独立媒体白名单仅包含与本地字节相同的 Inter woff2，没有图片、头像、旗帜图或独立 SVG。这不把任意源码文件名当作法律来源证明。ZIP 独立构建和运行仍待 Root 验证。

## 验证账本

| 阶段                     | 已有结果与准确范围                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 既有 domain              | `semantic-precheck-20261028-v1-t0f5kffs/domain14-first-once/receipt.json`：14 PASS、exit0。纯领域检查，不是浏览器结果；本次没有重复执行。                                                                                                                |
| 原 active-route native11 | `active-route-20261028-v1-mmy0yo6p/native11-first-once/receipt.json`：首次 7 PASS / 4 FAIL，原 trace、报告和失败上下文完整保留，不冒称最初全绿。                                                                                                         |
| 三项 summary 失败诊断    | 当前原 trace 离线逐引用解码证明：搜索、筛选、折叠前后四个摘要块及完整文本内容相同；失败由 before innerText 与默认 textContent matcher 混用导致。它证明捕获的显示内容不变，不单独证明全部绝对评分公式正确。                                               |
| CRUD 首次失败诊断        | 同次 DOM/AX 证据显示 Weight/Baseline/Target 为命名 textbox；旧 spinbutton locator 等待到 30000ms。不是产品 NumberField 失效；当时有效保存、九期空值和删除尚未执行到。                                                                                    |
| 最窄 fixture 修正        | 仅七行：四个 summary matcher 改为 poll 同一完整 innerText，三个数字 locator 改 textbox。原 before 值、完整数值/文字 oracle、后续 Clear/Expand/Save/Remove 及 5000/30000 预算保留，没有减断言或重设产品角色。                                             |
| clean-v3 必要验证        | `necessary-five-first-once/receipt.json`：原四失败项，加受消费者布局影响的 390px 项，共 5 PASS、0 FAIL、0 skip、0 flaky，1 worker、0 retry。其它六个已绿项未重复跑；不能称 v3 重新跑了完整 native11。                                                    |
| 默认 ColumnVisibility    | `column-visibility-default-consumer-actual-once/receipt.json`：既有无 children 的真实 consumer 用例 1 PASS。此前带首尾 anchor 的 grep 实际发现 0 case、exit1，单列保留；去掉匹配全标题的错误 anchor 后才首次执行该用例，源码、断言和预算未改。           |
| clean-v3 正常检查        | `phase-receipt.json`：正常 postinstall、全 format:check、全 lint、原 strict build 均 exit0；strict 用时 23.94225154200103 秒。不是 ZIP 独立构建结果。                                                                                                    |
| clean-v4 正常检查        | `clean-v4-20261028-iw_e7_ef/phase-receipt.json`：正常 postinstall、全 format:check、全 lint、原 strict build 各 first-once exit0；strict 30.736703249975108 秒。仅消费者 CSS 五行裁边变化，其它1278个 source/test/script 精确相同。这不是 ZIP 独立构建。 |
| clean-v4 carry           | native5、domain14、默认 ColumnVisibility 均沿用既有证据，未重复运行；不能称 v4 新一轮行为测试。仅新增390×900只读视觉检查。                                                                                                                               |
| Source2 首次真实执行     | `clean-v4-20261028-iw_e7_ef/source2-first-once/receipt.json`：2 PASS、exit0，1 worker、0 retry、0 skip、0 flaky。runner 12.171929875039496秒，report 11.683964秒；实际默认main、六文件查看/Copy/单文件下载完整UTF8一致，真实starter下载内容检查通过。    |

主要收据路径前缀均为 `/tmp/bricklane-advanced14-`。summary/CRUD 的完整离线证据在 `/tmp/bricklane-advanced14-native-first-failure-audit-20261028-v1/current-trace-proof.json`，七行 fixture 证明在 `/tmp/bricklane-advanced14-native-testfixture-proposal-20261028-v2/manifest.json`。这份文档没有启动任何新测试。v4 phase 收据生成时 Source2 尚待 clipboard lease，随后同 root 的 source2-first-once 成功收据覆盖该待办；不能把较早 pending 字段当作最新结果。Clipboard 已正式归还 Root。

## 已量化布局与仍待验项

clean-v3 的 `initial-visual-health-v3/report.json` 记录同 viewport 1440×900 和 390×900。390px 表头顶边 y277.46875 与公开存档实测相同；scroll area 高512，footer y742.46875/h47，help y789.46875/h87.734375，均在 900px 高度内。desktop 首行高28、rail overlay 167×336，主要 rail 遮挡已修复。完整截图和 geometry 是局部对照证据，**不是逐像素一致的声明**。

最终 v4 已应用唯一五行 CSS 修正：在既有手机 media 条件内，为 `.ss14-summary p > small` 设置 `overflow-x: clip`、`overflow-y: visible`。它修复 caption 裁边，不改字体、行高或断言。独立390×900只读检查中，root、toolbar、summary、scrollArea、footer、help 的全部 x/y/width/height 与 v3 精确相同；glyph range 虽超出 trimmed caption box，纵向绘制仍可见。console/page/request 错误均0，浏览器已关闭。

“caption v4 未应用”仅保留在原历史草案，本 v2 不再沿用。desktop 图沿用 v3，没有为五行裁边变化重抓 desktop 或重复 native5。Root 最终综合目视、其它 viewport、主题、字体平台和未覆盖状态仍不能由这些局部证据一并认证。

## Source2 与真实 ZIP

实际下载文件：

`/tmp/bricklane-advanced14-clean-v4-20261028-iw_e7_ef/source2-first-once/artifacts/grid-advanced-strategy-sco-e263b-ee-dependencies-and-notices/advanced14-starter.zip`

ZIP 为 **1,725,298 bytes、317 members**，SHA256 `9d04304b0520fb1a708bc2b4644018bbe5c4ac311f9f8d0a5e8345d157da0863`。本次文档只读文件大小、完整字节 SHA 与 actual source proof 核对；没有提取、安装、ZIP build 或 runtime。

同目录 `advanced14-source-proof.json` 记录：51个 required files 与最终当前字节一致，含六 leaf、实际免费组件和 MIT/OFL/LICENSE/THIRD_PARTY notices；package dependencies/overrides 一致。所有317成员有字节数与SHA清单。独立媒体只有 `src/blocks/assets/inter-latin-variable.woff2`，白名单和本地字节均通过。`runtimeOrStarterBuildVerified` 明确为 false。

Source2 spec SHA256 为 `ea30281e807c79013b39dc6bffbbafab6c3579e71babc4de4cac7a31b071ccb6`；成功 receipt SHA256 为 `9289e964755bd092bfb090188dfb4cf57538d3c2742dc625a1c33566bec2b9c6`。四路源码和实际ZIP内容门槛已通过，ZIP独立构建/运行门槛仍待 Root 串行执行。

## v4 历史冻结时源码与待办栏

最终 candidate：`/tmp/bricklane-advanced14-clean-v4-20261028-iw_e7_ef/candidate`。六个SHA已逐项与phase-receipt及当前字节核对；phase收据SHA256为 `c5d8f0d310af5bb7d9a4de9e126f887bae4e29450a5f4203a9a48ec960672874`。

| src/blocks/data/ 文件                       | SHA256                                                           |
| ------------------------------------------- | ---------------------------------------------------------------- |
| grid-advanced-strategy-scorecard.tsx        | dfd2eb198b8d7c65835a8e65ddf20bbc02a1ef6822fe91325272a722b0a70e2b |
| grid-advanced-strategy-scorecard.css        | 4d1c531950e660aa33e747f19597f7a6484ed4567b1bc80b9b65db712ee86e10 |
| grid-advanced-strategy-scorecard-data.ts    | 763136c3c18190ab5ba996e5fefc7c6027fc17abff6ae71990f31edcc658c913 |
| grid-advanced-strategy-scorecard-model.ts   | f71f92c8ab21f77c80ee542bd1e942fc6c9576a3887d1272d6cbd35d954997bf |
| grid-advanced-strategy-scorecard-cells.tsx  | e62f38bdd58e661f7a3505b91137b94e8890c9699f399140fc4f6df358497531 |
| grid-advanced-strategy-scorecard-panels.tsx | b2e4cc238d4f212e8455d5c56455a64d2bf8e7b025c148fbce171eb5918e1336 |

**下表保留 v4 冻结时历史状态；后续 Root 联合验证见末节，历史 Pending 不代表最新结果。**

| 门槛                                          | 当前状态 | 最终证据待填                           |
| --------------------------------------------- | -------- | -------------------------------------- |
| Root 最终综合目视与残差确认                   | Pending  | v4手机检查已完成；最终审阅待填         |
| Source2默认main、六文件查看/Copy/单文件全字节 | PASS     | 本文首次2PASS收据                      |
| 实际ZIP下载、字节、依赖/许可/独立媒体闭包     | PASS     | 本文ZIP SHA、317成员、51required proof |
| 实际ZIP提取/安装/独立strict与运行             | Pending  | Root串行执行；当前未执行               |
| Root最新基线整合                              | Pending  | 最终candidate/scope manifest           |
| 正常hooks commit                              | Pending  | Commit SHA                             |
| Push                                          | Pending  | 远端ref/SHA                            |
| CI / Pages                                    | Pending  | 本批run、部署SHA、成功时间、URL        |

Advanced14 与 Atlas 仍是 private。Root 确认的已上线472基线（670条目录、CI1741 PASS）不包含本批，不能当作 Advanced14 已发布或本批CI结果；本次文档未发起部署网络查询。

由 Root 唯一串行协调最新整合、正常hooks commit、push、CI/Pages和ZIP独立验证。提交、推送、CI成功、部署成功分别记录；私有预览不等于公开站已更新。原版历史草案保持原SHA不变。

## Root 联合候选实际下载项目的首次发现

前述 v4 archive 是历史来源检查。随后联合472基线与 Atlas 的实际下载包为317成员，SHA256 `e9f3c2e1a2bdd20d7c8754d1f6c543b805acac49a46af506972e564bb5c8298a`；独立审查确认两包全部317成员内容相同，差异只在原 ZIP 时间字段，未规范化或重建下载文件。实际项目保持收到的入口、package、strict 配置与源码原字节；物理克隆正常安装依赖，不称为全新安装。原始 `npm run build` 首次 exit0 / 10.960195s。

该收到项目的原 native11 首次执行 **10PASS / 1FAIL / 51.37943075s**。失败是 `native scaled Value editor Enter commits raw millions and CtrlZ restores`：编辑器原始 `1.885828` 值断言通过，随后 `fill("2.25")` 期间元素已脱离，Enter/CtrlZ 尚未执行。原30秒预算、零重试及失败 trace 均保留，未放宽断言。

成功与失败 trace 对照中，原生 TR 身份、直接子结构及文本保持稳定；记录的239次属性变化全部来自 Recharts rectangle 的 y/height/d。安装的 Recharts Bar key 包含动画中的 y，能导致 SVG 后代替换；当前共享 ReUI DataGrid 编辑器观察 tbody 全部 childList 变化并立即取消。源码与 trace 支持“图表更新误触编辑取消”的原因推断，但 trace 没有直接记录 observer 回调调用栈，因此不声称已动态捕获该回调。字体请求与滚动变化没有证据支持为该次失败原因。

修复继续使用实际免费 ReUI 原控制器、原生表格、portal/input、parse、clipboard 和 Undo。私有补丁正在复审固定原 TR/TD 身份与顺序、相对 viewport 锚点几何；SVG 子树更新本身不取消，实际结构或锚点变化仍取消。图表动画保持开启，不以等待动画、程序聚焦、重试或延长预算掩盖问题。新补丁、真实下载包与最终构建/运行/发布结果将在下方另行记录；上述首次结果不得覆盖或合并成全绿。

## Root 最终 core 修正与收到项目验证

实际免费组件 `data-grid-cell-selection.tsx` 的修正保持原生 editor/portal/finish/clipboard/Undo API，增加固定 TR/TD 身份、直接行列顺序与相对内容坐标核验；同一个 viewport MutationObserver 仅监听 childList 和 row/column 身份属性，配合原生 ResizeObserver 检查实际行高、宽度和锚点。取消时先标记 finished，避免卸载 blur 意外写入。图表 SVG 后代更新本身不会关闭编辑器。没有第二套表格、替代 editor、动画关闭、等待动画或更宽预算。

最终 core SHA256 为 `6fe6842fd5f0f419f0a8cdb6c4c2b15872a2d3b51bbc069343b1d353ff729ad5`。全站原 strict 首次 exit0 / 22.415025s，full format/lint/postinstall 均0；654个构建产物固定。原早期 Value、新切月编辑、新响应式取消及原任务表格编辑合计4项必要 native 首次全部通过 / 10.478995s。原11测试业务断言和预算保留，新增两个真实场景形成13项永久回归。

新实际 Strategy ZIP 为 **1,726,365 bytes / 317 members**，SHA256 `2920d2e386cd58ca5168cd9adad0ca13004bd29a392a4b659d27d85843003f3e`；网站实际 Source/下载两项联合门槛首次2PASS / 10.017486s。收到项目的入口、package、strict配置和全部317成员均未修改，物理克隆匹配的正常安装依赖，不称为 fresh install。其原始构建 exit0 / 11.129401s，实际固定入口 **native13 全部PASS / 29.542543s**，无跳过、flaky或重试。构建及运行后原成员字节仍全部精确，原生预览进程已正常停止。

这些结果确认本次修复和导出项目的已测路径，未声称每次成功运行均动态证明图表动画与输入重叠，也未把点击排序/筛选时原有 blur提交行为冒充取消覆盖。原失败10P/1F及其trace继续保留。独立静态复审未发现阻塞；后续正常 hooks 提交、push、全量 CI、Pages须分别确认，不能把本地全绿当作已经上线。
