# Advanced 13 · HR Scorecard

状态：独立 leaf 首轮实现与轻量验证。入口 default `HRScorecard`，尚未注册全局目录/路由。没有运行本批 TypeScript、Vite、正式浏览器、Source/ZIP 构建，不能宣称已经像素一致、可部署或线上完成。唯一发布会话安排正式窗口及 commit/push。

## 免费 ReUI 优先的具体落实

已先读 `/tmp/bricklane-grid-advanced-expansion-readonly/advanced12-13-plan.md`、五项计划、公开 1440/390 测量及免费例子 API 证据。CodeGraph 核对现存 DataGrid、features、CellSelection 内建 editor、FootRow、RowExpand、NumberField、Frame 和支持控件。相关官方免费例子是 c-data-grid-16 pinning、24 footer、30 tree、31 spreadsheet editing：

- <https://reui.io/components/data-grid>
- <https://reui.io/docs/components/base/data-grid>
- <https://reui.io/r/radix-nova/c-data-grid-16.json>
- <https://reui.io/r/radix-nova/c-data-grid-24.json>
- <https://reui.io/r/radix-nova/c-data-grid-30.json>
- <https://reui.io/r/radix-nova/c-data-grid-31.json>
- <https://reui.io/r/radix-nova/c-chart-1.json>

主 leaf 直接组合已安装的免费 `DataGrid`、`DataGridContainer`、`DataGridTable`、`DataGridScrollArea`、`DataGridTableRowExpand`、`DataGridTableFootRow/Cell`、`DataGridCellSelection`。`useTable({ features: dataGridFeatures })` 使用实际 TanStack v9 原生 grouped column definitions、`getSubRows`、expanded、filtered row model、start column pinning、visibility、column sizing 与 cell selection；不是手写表格控制器。为了单独控制原生 pinning，本页直接用这套官方 features，而不复制或改造共享 `useDomainGrid`。Sheet 的历史表继续复用该共享 hook 和免费 renderer。

表头用真实嵌套 columns：当前期间下面 6 列，Score 下面 vs PY / vs Target，其余 header 自然 rowSpan。没有手写第二套 header、虚构 colspan 或靠字符串拼第二行。组是 6 个原生父行、24 个原生子行，展开用官方 RowExpand。页脚严格遍历与 renderer 相同的 start/center/end **native visible leaf columns**，每列一个免费 FootRowCell；显隐不会留下旧 colspan。

Target/Actual 的 `meta.cellEdit` 实际配置 `control: "text"`、parse/format/clearValue 和按 row/mode 的 editable。免费 CellSelection 负责 double click、F2/Enter、range、paste/cut/clear、焦点和编辑 overlay，所有写入进入一个 `onCellsChange` batch。没有另外绑定 clipboard/arrow engine 或自制浮层输入框；Copy Values/CSV 按钮只序列化所选领域记录，原生单元格 Ctrl/Cmd C/V 仍完全属于免费组件。

免费 `Filters` 使用当前 `FilterQuery`、`query/onQueryChange`、advanced popover 和原生字段/组/运算符编辑。业务 predicate 保留 AND/OR/negated 递归，草稿 operator/value、空 OR 子组、空 many、无效 range 都跳过。谓词接入原生 `scope` column filter，`filterFromLeafRows` 自动保留匹配父路径，没有 flatten。

`Frame/Header/Panel/Title/Description`、`NumberField/Group/Input/Increment/Decrement`、`Badge` 都为真实免费实现。Sheet、Tabs、Select、ToggleGroup、DropdownMenu、Popover、AlertDialog、Input 等使用这套免费组件依赖的已安装支持 UI，保留其 portal、focus、radio/menu/tab 键盘状态机；没有另造缺少的 primitive。没有 vendor/shared adapter/global CSS 变更。

## 原创数据与明确的数学规则

24 个原创 KPI、6 组，分布 5/4/4/4/4/3，拥有稳定 ID 与 **2025-01 至 2026-09 共 21 个月**的独立原始 target/actual。月份序列只在 fixture 初始化时生成，不用 render row index、不随过滤/排序变化。没有复制公开 24 KPI 的完整名字/数据/月序列或付费 seeds。演示人员为原创名字，无原站头像、logo、SVG 或截图进入源码/下载包。

默认全书 index 为 95、10/24 On Track、9 Watch、5 Off Track；Headcount baseline1320、HRstaff16、约83/FTE，Voluntary Attrition1.6%/target1.3%。这些独立 demo 数字不同于公开 94、9/24、9/6、1248/15、1.5%/1.2%，不能把该差异说成公开样本已逐条复刻。

核心相应原创回归使用 **Hiring cycle time，actual37.6、target32**：raw attainment117.5%（显示118%），lower-is-better index85/Off Track。改 target40 后 raw attainment94%、index106/On Track、全书11/24、index96；一次 Undo 恢复所有数据。它验证与公开 target32→40 相同的行为，而不复制公开 actual36.8、115%/87→92%/109 的 seed。

原始 attainment 始终是 actual/target；方向评分 higher=actual/reference，lower=reference/actual，独立于 raw ratio。零和 null 区分：0/0视为 level100；lower actual0/reference>0及higher reference0/actual>0评分上限200；无法计算的 raw denominator0 ratio 是 null。指数限制0–200是本演示明确领域策略，不能据此声称已经核准公开全部异常值规则。

Month 使用对应月；YTD 对 Jan→当前月按 definition 的 average/sum 聚合。null/未记录从聚合排除，0保留；prior-year 比较同一月份集合，Prior Month 仍是前一个月原始实际值。趋势始终为滚动12个月，独立于 Month/YTD 模式；灰条表示早于当前年份，当前年份以当前 KPI status 着色。原始 null 直接传入免费 Chart，保留对应月份空位，aria 文本说明 unreported；0 为真实零高，不人为画成最小正值。没有把当前值复制12次。

顶部 summary 取完整 book 当前 period 的结果；组和 ALL KPIS footer 用 **native filtered row model 的实际 subRows**递归叶行计算，忽略展开状态、保留过滤边界。只搜索一个 Off Track 指标时，页脚0/1，而顶部仍10/24/index95。各组/全表指数是有效叶分数的等权平均，异单位 actual/target 不相加伪造总值。Pending 包含于总定义数量，指数均值只取有有效评分者。

## 实际状态与交互

- 原生固定 expand28+KPI229（手机160）、原生 grouped headers/tree/visibility、受控展开，八项 View 显隐与 Expand/Collapse All。Month Jan→Sep 可选，YTD 测量列只读并说明 Month only editing。
- 目标/实际单格编辑与多格 paste 通过 `onCellsChange` 更新原始 month series，一次 batch 记一条 history。50 步 snapshot Undo/Redo；Ctrl/Cmd Z、Shift Z 仅在非输入框交给应用历史，输入框内保留原生文本撤销。没有干预免费 arrow/clipboard controller。
- Owner/Unit 真实免费 Select 选项写入同一 KPI；新增、编辑、复制、单项 Reset、删除确认、整页 Reset、notes 更新均为实际 store 操作，Undo 可恢复。Add/Edit Sheet 用 448px 浮动侧栏；Definition/History/Notes 三个 Tabs 是本地增强，History 用真正免费 DataGrid 显示原始月数据，不声称这三个增强 Tabs 是公开原页面的既有结构。
- Thresholds 的 OnTrack/Watch/Headcount/HRstaff 通过免费 NumberField 更新同一可撤销 store，校验上下界及 staff≥1，Reset 初始禁用。人数/FTE 为用户可配置的 workforce baseline，区别于某个 KPI 的实际值。
- 可选 `loadKpis(signal)` 支持真正异步来源。加载用免费 DataGrid skeleton；取消过期请求，定义/样本校验异常显示错误并可 Retry，保留最后有效数据，成功才替换并清掉旧 Undo。默认不制造假 loading/error 演出；本地 fixture 直接显示。
- 所有操作局限本地演示状态。没有假称后端保存、真实HR系统提交、发送或同步。

## 自定义能力缺口与三项视觉目标

1. **60px native 双层 header、28px body、native固定两列与sticky totals footer**是第一目标。叶级 CSS 仅设密度/背景/列宽、768px桌面及512px手机 scroll viewport、footer sticky，实际 header/tree/pinning/scrollbar/selection 均来自免费组件。当前还没有本地1440/390生产几何，不能声称这些目标已量到。
2. **四张 summary 的桌面横排与手机堆叠、12px文字和蓝色输入、方向指数整格色**是第二目标。Badge 自身参与 status summary，颜色与分数来自同一计算；数字是原创 fixtures，未做公开 seeds 逐字对齐。
3. **12月2px微条、512高级 Filters、320 Thresholds、208 View、448 Sheet及窄屏portal/回焦点**是第三目标。微条实际复用官方免费 `c-chart-1` 的 `ChartContainer` + Recharts `BarChart/Bar` 组合：显式48×18px、initialDimension、零margin、隐藏XAxis/YAxis、barSize2与关闭动画；原始12月数值/null直接传入，`Cell` 只按月份归属和领域方向评分设置颜色。首轮手写span微条已经移除，先前从本地 `ReuiTrend` top24px 推断免费库有高度下限不成立，不能据此声称组件缺口。CSS只设容器尺寸与状态色，没有自写柱形渲染。Month/YTD、lower-is-better、thresholds、YTD rollup与跨单位汇总才是免费库不提供的领域数学，放独立 data 文件。图形实际2px/18px、空月槽位与字体仍待正式浏览器窗口核验。

公开参考入口：<https://reui.io/preview/base/data-grid-advanced-13?embed=1>。公开基线与详尽未核事项继续保留在私有 readonly 审计目录；不把私有参考截图放产品。

## 门禁与待验

`node --test tests/grid-advanced-hr.test.mjs` 已16/16：原始21月、32→40→Undo、batch/redo、average/sum/null/0、滚动趋势、summary范围、CRUD/owner/unit/notes、阈值边界、嵌套query/draft、parse、Pending/load、数据校验和UTC月份边界；另覆盖原先缺失月份的首次写入、零值、未报告兄弟字段及Undo。

owned files 使用 scoped oxfmt、format:check 和 oxlint。`tests/grid-advanced-hr.spec.ts` 编写9项真实集成回归：双层header/tree/footer、built-in目标编辑、原生paste、YTD只读、searchsummary范围、collapse/visibilityfooter、ownerUndo、CRUDPending、390pinning。**这些浏览器测试尚未运行**，不设置 skip 伪装通过。

待正式窗口验证：TypeScript/Vite；1440/390同entry/style/theme/fonts-ready几何、实际字体成功响应、native grouped rowSpan、input focus与controller paste/Undo、tooltip/menuportal/Escape、所有Filters运算符、粘贴部分拒绝、column显隐/尺寸/footer、异步取消/失败/Retry、CSV字节、Sheet全部字段及keyboard。默认源码、Copy、单文件、真正UI ZIP闭包、MIT/OFL随包与standalone strict也待父会话验证。

本轮没有创建 Vite/dev/preview、没有cold/strict/tsc/npm安装，没有 Git写入、目录/router/source-targets/shared变化。Advanced11冻结7文件未改。重要里程碑交父会话按唯一发布流程 commit/push 后再区分 CI/Pages 真值。

## 集成边界

完整 ID `data-grid-advanced-13` 显式映射 default `HRScorecard`，source default指向 `grid-advanced-hr-scorecard.tsx`，经 static imports 收齐同 prefix data/panels/CSS、免费 DataGrid/Filters/NumberField/ChartContainer、Recharts、supporting UI、`useDomainGrid`/`useIsMobile`和既有许可证。只有父/Root协调人可写全局 catalog/router/source-targets。不得扩造14–21或利用默认ServiceVisits兜底上线未实现条目。

Parent free-component audit: the async failure surface now mounts the installed official free Alert, AlertDescription and AlertAction, replacing its initial handwritten error box. Retry retains the actual loader action and occupies the native responsive action slot. Inline field-validation messages remain field feedback. This does not change domain math or fixtures; browser loader geometry still awaits the isolated QA harness.

## 首次候选编译错误的窄修

首次私有候选原始 `npm run build` 自然退出2，尚未进入Vite；不能把先前轻量格式/lint门禁当作编译通过。针对已报告的TS2783，reducer和Sheet measurement统一只在整个月份样本缺失时使用 `{ target: null, actual: null }`，再写目标字段；已有0/null和另一字段保持，不再先定义必然被spread覆盖的重复属性。View按真实native column查找结果渲染，没有对应列时不提供无效checkbox；捕获已校验的column供checked/callback共享，没有新增非空断言。原创fixtures、业务评分、free renderer及父会话Alert迁移保持不变。

本次仅scoped oxfmt/check、oxlint及16项纯domain测试；没有重跑TypeScript/Vite/build或任何服务/安装/Git。须由Root另授窗口后复验，不能声称编译错误已经在编译器中复验通过。

## 首次生产回归：只读失败诊断与测试测量修正

首次candidate original44规格已自然退出1，29通过/15失败；HR前4原生grouped/footer、内建32→40编辑Undo、原生paste批Undo、Month/YTD通过。HR搜索case78的group/leaf各1与filtered footer0/1断言均已通过；最后全书summary比较失败来自测试把innerText快照与默认textContent断言混用，trace `bzjp@487` 的全部指标/数字相同，仅block换行/节点间拼接不同。本次只加useInnerText:true，使两侧使用同一读取语义，保留严格全书内容不变断言及原timeout/retry。修正未复跑。

collapse/owner/new Pending后删除这3项首个单元格按钮点击的trace显示对应gridcell被选中、grid持焦，控件未激活。现存免费DataGridCellSelection1779–1825明确提供默认two-step control交互（未聚焦cell第一次只选中、第二次激活），并有data-cell-interactive/enableCellSelection实际opt-out。首轮不能据此宣称collapse/Owner/remove实现已跑通，也不能仅延长等待或移除原行为断言。已向父会话报告该交互契约差异；此轮未改实现或这3项测试，等待父会话窄授权。原trace保留。

## 公开单击证据与消费者opt-out修正

已实际短探公开13，同一browser中每项fresh导航、每个控件严格只执行一次click。折叠前tbody31行、首KPI Owner存在，单击Hiring的Collapse后26行、出现Expand且该Owner消失；Owner从expanded=false/listbox0，经一次点击变为expanded=true并出现Reassign To选项；Actions从menu0，经一次点击出现含Edit/Duplicate/Copy/Reset/Remove的真实菜单。原始before/after与clicks=1保存在 `/tmp/bricklane-grid-advanced13-owner/public-single-click-controls.json`。公开browser已关闭；没有把公开records或素材加入产品。

因此原先3条单击测试并非应当改成双击的测试错误，而是本页结构控件错误继承了spreadsheet测量单元格的默认激活拦截。修正只使用现有免费CellSelection明确提供的 `data-cell-interactive`：标记RowExpand外壳、Owner/Unit触发器、group Add、KPI详情按钮和Actions触发器。没有重写点击控制器，没有禁用全表cell selection，没有改shared；Target/Actual及其他测量cells仍是原有原生两步编辑、range、paste与onCellsChange批写入。

原collapse/visibility、ownerUndo、newPending删除restore三项行为断言和单击步骤均原封保留；它们与已经通过的编辑/paste回归共同覆盖结构操作与测量编辑的分界。本轮只做scopedformat/check、oxlint和16项纯domain测试；本地生产3项复验、微几何与keyboard仍待父会话窗口，未改candidate/dist或运行本地browser/TS/Vite。公开Owner实测为Select/listbox，而当前Owner/Unit沿用首轮free DropdownMenu选择组合；本次授权仅纠正激活行为，不宣称这两类控件的公开角色/外观已经逐项还原。

## Owner / Unit 真实免费Select迁移

公开Owner短探已明确为select-trigger/combobox与真实listbox；进一步只读既有 `evidence/advanced-13-1440-baseline.json`，24个Unit也全部明确为BUTTON、role=combobox、slot=select-trigger（包括首行Days）。没有新扩审计或启动browser。两类均可直接使用已有免费Select能力，先前DropdownMenu组合属于应纠正的实现差异，不能称作免费库缺口。

`HrInlineChoice` 现实际组合现存Select/SelectTrigger/SelectValue/SelectContent/SelectItem，value/onValueChange继续进入原本同一raw KPI put/Undo，没有改options、fixtures或measurement。保留触发器data-cell-interactive，单击直接打开listbox；选择/键盘/portal/focus交由真实免费Select。Owner回归仅把触发器角色改为combobox、选项改为option，并增加select-trigger断言；一次click、Iris Reed值和Undo恢复Ari Bennett断言不变。collapse及删除回归保持单击。

本次scopedformat/check、oxlint与16项纯domain检查；未跑TS/Vite/build或本地browser，也未修改candidate/dist/shared/Git。候选生产重建及这些交互复验仍由父会话请求明确窗口，不能声称本轮迁移已通过浏览器。历史段落提到的Owner/Unit dropdown残余差异在本次已消除。

## Measured visual correction, static candidate pending

The first production screenshots reveal the sticky totals label beneath native pinned body cells: the previous footer level4 was lower than the free DataGrid pinned-cell level30. The leaf footer now uses level35 and its pinned label cells level36, below the existing free sticky header level40. The original native footer/visible-column composition is retained. An existing footer test now checks the actual topmost painted element rather than visibility alone.

The phone header was 88px versus the public120px because search collapsed to an icon and period controls shared the tools line. One existing Input now remains visible at both widths, with Filter/Threshold/View/Export on its line and Month/YTD/Add on a second32px phone line. The slash shortcut focuses that same Input. Phone vertical header padding is8px; the mobile case now asserts120px header and tools-before-period geometry. There remain9 cases with unchanged timeout/retry. Shared phone gutter remains with the parent wrapper owner.

Free Select and data-cell-interactive controls, native measurement editing, range selection/paste, raw-store Undo, fixtures and rollups are unchanged. There are no domain changes; prior16/16 pure-domain results are retained without a rerun. Scoped format/check and oxlint are recorded in the handoff manifest. Updated browser, build and visual verification remain pending the parent's explicit window. Evidence: `/tmp/bricklane-grid-advanced-five-round1/initial-visual/advanced-13-{1440,390}.png`, saved public baseline and native DataGrid layer source.

The existing first footer case explicitly uses a 1440×1000 viewport. It keeps `scrollIntoViewIfNeeded`, checks that the footer label's horizontal/vertical center lies within that viewport, and requires `elementFromPoint` at that center to belong to the footer label itself. This replaces the previous left-inset sample without adding cases or changing timeout/retry. Static-only follow-up; production rerun remains pending.
