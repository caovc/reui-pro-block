# Advanced 12 — Freight & Cargo Services

状态：独立 leaf 已完成轻量实现，等待主会话的显式 ID 集成和统一浏览器 / TypeScript / 生产 / ZIP 验收。本文不把静态检查或纯领域测试记作像素、运行时或发布通过。

官方可见目标：[brief](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-12)、[Base preview](https://reui.io/preview/base/data-grid-advanced-12?embed=1)。仅查看公开 DOM、用户可达状态与私有截图；未读取 Pro seeds、付费 registry / JS / source，未提取或分发上游头像、logo、SVG、截图。

## 文件与集成边界

- 主实现 / default export：`src/blocks/data/grid-advanced-freight.tsx` → `FreightCargo`。
- 原创领域 fixtures：`grid-advanced-freight-data.ts`。
- 纯领域数学 / FilterQuery bridge / mutations：`grid-advanced-freight-math.ts`。
- 实际 sheets、dialogs、terminal 子表：`grid-advanced-freight-panels.tsx`。
- 仅 `.freight-*` 的矩阵几何与颜色：`grid-advanced-freight.css`。
- Node 测试：`tests/grid-advanced-freight.test.mjs`；浏览器待执行规格：`tests/grid-advanced-freight.spec.ts`。

本 owner 未修改 catalog、dispatcher、`source-targets`、shared adapter、primitive、vendor、依赖、global CSS 或 Git。集成 owner 需显式映射 **`data-grid-advanced-12` → `FreightCargo`**，不能把 ID22 当数组下标或让新条目落旧 default 分支。主 leaf 和同 prefix 的四个 imports 均是静态 import；源码收集器应展示真实 leaf，Copy / 单文件下载与之逐字节一致，ZIP 要包含递归依赖、theme providers、MIT / OFL、字体和配置。单文件保留真实 imports，并非零依赖 standalone。

## 实际免费复用与模型

先经 CodeGraph 读取当前代码，并参考官方免费 `c-data-grid-16` pinning、`24` totals footer、`30` native tree、`31` editing 的实际免费 registry。此条目实际组合已入库 **ReUI `DataGrid` / `dataGridFeatures` / `DataGridTable` / `DataGridColumnHeader` / `DataGridTableFootRow(Cell)` / `DataGridScrollArea`** 与 `@tanstack/react-table` `useTable`。复用当前 **Filters / Cascader / Frame / Badge / NumberField（含 +/-）/ Timeline**；Sheet / Dialog / AlertDialog / Select / Tabs / Field / ToggleGroup / Tooltip 是现有免费例子的支撑 primitives，没有重造其 portal、keyboard、query builder、选项树或 focus 状态机。

权威 store 只有 `FreightBook { lanes, history }`。原生 lane table 接收完整 raw lanes，`globalFilterFn` 调用纯领域 predicate，并保留当前 `FilterQuery` 的 AND / OR / rule.negated。未完成 operator / 空值 / 错误 arity / 空 OR 子组返回未完成、被跳过，不在 OR 内变成真。字段 / 操作符按 schema 验证，不使用旧 flat `Filter[]` 或 flatten query。

随后仅对 **native filtered row model** 做 lane → terminal 的业务 pivot，派生匹配的 Out / Inbound / Network。矩阵的第二个真实 TanStack table 接收全部 12 terminal 原记录，负责原生 origin selection、过滤后 origin membership、Out numeric sorting、column visibility、start pinning。terminal sheet 的 lane list 也是独立真实 DataGrid，按 margin 原生排序。没有手写 table renderer / filter UI / sorting / paging controller。

矩阵保持公开观测到的范围：搜索匹配 raw lane 的起终点 / shipper；Out、Inbound、底部 summary 反映匹配集合，heat cells 保留 active network 两方向的原值。destination Cascader 是 native column visibility 的单一真值，不把隐藏列误算作 lane filter；footer 从 `getVisibleLeafColumns` 构造，不写固定 colspan。origin 勾选用于该 origin 的 active outbound lanes，隐藏行的 selection ID 不因搜索而被清空。

矩阵使用官方 fixed-width / filler lane：`tableLayout.columnsResizable=true` 启用该 renderer 分支，而 native `enableColumnResizing=false` 禁用 resize handles；目的在于保留列显隐后的真实列宽与 pinned offsets，不另外手算表宽。手机横滚使用真实 `DataGridScrollArea`，select49 / origin116（desktop288）是 native start pinning。

## 必要自定义与原创数据

免费通用 DataGrid 没有有向货运矩阵的业务 pivot、双向三角 cell、距离 / 运价 / 利润计算、RateEvent 审计和 Undo。这些是 leaf 领域代码与原创 CSS，不声称属于免费现成业务组件。双向记录引用不同 lane ID；diagonal、missing outbound、reverse-only、null margin 与 0 分开处理。

使用原创 12 terminal：Porto / Valencia / Bristol / Ghent / Nantes、Basel / Turin / Leipzig、Brno / Graz / Krakow / Tallinn，分组 Atlantic5 / Central3 / East4。98 directed lanes、6 shippers、人员、经济数据与 opening history 均为本地独立 demo，未抄公开 98 lane fixtures。金额以整数 cents 计算；weekly revenue = loads × demoDistanceKm × rateCents，weekly profit 扣对应 cost，network margin 按 revenue 加权。

初始原创总计 **2,667 loads / €277,505.10 weekly profit / 约4.8522% margin / 33 losing / 98 lanes**，故不会与公开的 2,512 / 6.9% / 17 相同。distance 是经纬度大圆距离 ×1.22、取整到10km的独立估算，不是道路 routing 或服务报价；新增 pair 自动应用相同估算，UI 明示 demo estimate。margin band 临界值 `-8 / 0 / 6 / 12` 是独立 demo 选择，公开全部临界值尚未观测，不称精准原版规则。国家使用语义 MapPin，本地原创图形，无上游旗帜 / logo 媒体。

免费 **Autocomplete** 当前未入库，且本轮无安装授权。Origin / Destination / Shipper 使用已入库 Select，具有真实选择、键盘和焦点，但缺少 autocomplete 文本搜索 / 自由输入；没有手造 combobox 或声称实际复用了 Autocomplete。

## 已核实公开操作与本地实现

原公开审计：1440×1000、390×844、DPR1、默认 light、`document.fonts.ready`，并确认公开 Inter faces loaded。私有参考在 `/tmp/bricklane-grid-advanced-expansion-readonly/evidence/`，最新补核在 `/tmp/bricklane-grid-advanced-freight-implementation/public-{submit,input}-boundaries.json` 及对应私有 PNG。没有本地浏览器服务，因此下面是公开目标 + 已实现代码，**尚非 local 同态通过**。

| 操作                  | 公开实际观察                                                                                                                                   | 本地实现与边界                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lane detail           | 两方向 loads / rate-cost / margin / weekly profit / empty km；Edit Lane / Close Lane                                                           | 单份 directed raw record 派生；反向独立。empty km = max(0, outboundLoads−reverseLoads) × demo distance，是独立 demo 公式，完整公开边界尚未穷举                                                                                                                                                                                   |
| Close Lane            | 320px AlertDialog；标题含 pair；Keep Lane / Close Lane。确认后该方向30loads与profit退出 totals，提示可 Undo                                    | 同方向 inactive + Closed event；reverse 不改；完整 book snapshot 可 Undo。保留公开确认而非直接删除                                                                                                                                                                                                                               |
| Reprice               | **576×968 side Sheet**（非小 Dialog），默认5%；NumberField +/-、同步 input min−20/max30/step0.5；无 Slider。Losing / All、Reason、Before/After | 相同参数；实际 preview、cents rounding、Apply Rates，完整原记录/history 更新；无变化不提交；公开空 Reason 的 Apply 仍 enabled，本地允许空 reason，未增加 required 商业规则。防止不能精确表示的超大整数，不添加商业政策                                                                                                           |
| Reprice apply/history | Apply 后真实关闭 Sheet，Rate History 出现此次 reason 和 before/after rate                                                                      | 不使用成功 toast 替代 mutation；timeline 包括 from **或** to terminal，newest first，Undo 恢复 history                                                                                                                                                                                                                           |
| Add Route             | 原点/目的地/shipper、equipment、contract、loads、rate/cost；未选 pair 显示 economics placeholder。Loads1–200；rate/cost€0.30–€6.00/step0.05    | 控件范围据实校准，Select 边界如上；无自创 distance / customs 编辑字段。Edit 的 Origin / Destination 公开确实 disabled；Save Changes 与编辑内 Close Lane 均保留。拒绝 self pair / duplicate active direction / 非法数值；customs 按原创 country fixture 派生                                                                      |
| Terminal sheet        | Outbound / Inbound / Balance / History；Export / Reprice / Add Route                                                                           | 四个真实 Tabs，出入 lane lists 用免费 DataGrid；CSV 是实际本地下载，未连真实外部物流服务                                                                                                                                                                                                                                         |
| Loading / Error       | 当前公开默认正常，无完整网络错误态证据                                                                                                         | `loadNetwork?:(signal:AbortSignal)=>Promise<FreightBook>` 为明确本地可选 API；无 prop 直接原创 book。传入 prop 后真实 promise loading、reject alert + Retry network、schema validation、真实 AbortController / cleanup.abort + cancelled stale-result guard；abort 不写入 error 状态；无假定时器，实际异步 UI 回归待集成 harness |

本地 Undo 最多保留20个完整 book snapshot。无服务端持久化、第三方 routing、实际运单推送或虚构外部成功。CSV 记录数值列及明确 demo distance。可选 loader 是本地扩展，非原版 transport 契约。

## 视觉目标与待完成验收

公开桌面 Frame `(112,48,1216,700)`、table `(113,152,1214,550)`；mobile Frame `(16,32,358,738)`、table width1042。列 select49 + origin288/116 +12×64 +Out64 +Actions45。header32，compact rows41，Inbound26；mobile footer72，desktop44。参考 header / frame inset、split cells、null / reverse only、summary / legend、toolbar、destination Cascader、density / line settings、真实 sheets 均已写入 leaf，但缺少本地截图，不记“像素已齐”。

主会话需在统一资源窗口逐项验证：

- 显式 route 能运行、native v9 API / typed columns 正确；两 viewport 默认图、font loaded 与 fallback 分开、spacing / borders / colors / disabled / portal geometry。
- hover / focus column cue、tooltip、跨 overlay handoff、Escape 与原 trigger focus；手机轮滚与 document width，无额外滚动条。
- Filters 每个 operator、嵌套 OR / NOT / unfinished draft、Cascader 可见列与 footer 对齐、Loads / Profit、Out sorting、origin selection 的过滤持久性。
- Add / Edit / Close / Keep / Reprice Losing / All / Apply / History / Undo / Export 的真实行为和数值；输入边界据公开已知值，而非用限制策略掩盖缺实现。
- **真实 async loader pending / rejected / Retry / cancelled / malformed response 的组件测试尚缺**；Node 只覆盖其纯输入 validator，不冒充异步组件运行通过。现有五条 browser specs 也尚未执行，集成 owner 需先核 selector / route，再补 loader harness。
- Default / Copy / 单文件 / 实际ZIP SHA字节一致、source closure、ZIP 解压后的实际编译与运行。只有 Publisher 可按窗口执行 TS / strict / cold / ZIP / Git，未推送、未部署。

主会话另行授权的 loader 窄修已补齐真实 `AbortSignal` 参数与 cleanup abort；已有无参 adapter 仍可按 TypeScript 的函数兼容规则作为回调提供。五页临时 QA harness 将挂载真实组件并观察 signal，不在产品中模拟 abort 或添加假延迟。此修复的实际组件级异步验收仍 pending。

已执行的轻量验证见最终 manifest：scoped oxfmt / format:check、scoped oxlint、10 条 Node domain tests。临时只读 static-import walker 当前解析63本地依赖文件、missing=0（不是ZIP验证或编译）。未起 Vite / dev / build / TypeScript / strict / npm安装，未修改其他 owner 文件。

Parent free-component audit: the async failure surface now mounts the installed official free Alert, AlertDescription and AlertAction, replacing its initial handwritten error box. Retry retains the actual loader action and occupies the native responsive action slot. Inline field-validation messages remain field feedback. This does not change domain math or fixtures; browser loader geometry still awaits the isolated QA harness.

首次私有 candidate 的原始 `npm run build` 实际 exit2，定位本 leaf 的 `NumberField formatOptions` 编译错误，不能将先前静态 lint 当作编译通过。已直接核对当前安装的 `@base-ui/react/number-field/root/NumberFieldRoot.d.ts:101`，真实公开 prop 为 `format?: Intl.NumberFormatOptions`，Root runtime 亦读取 `format`。consumer 仅改为 `format`，保留 `style: currency`、EUR 与两位小数；不修改免费 NumberField primitive、依赖或任何全局规则。此次 scoped format/check/lint 可验证，后续完整编译仍待 Root 新窗口，未由本 owner 重跑。

第二次主会话授权的 candidate 原始 `npm run build` 已自然 exit0（22.3s），immutable dist 由 Python5710 提供；本 owner 没有启动或重跑编译 / 服务。首轮44条生产规格自然终态为29通过 /15失败，原始 dist、error-context 与 trace 保留。Freight 的原生 origin selection / draft filter、真实 repricing / history / Undo、真实 Close Lane / totals / Undo 三条已由该生产轮次通过；另外两条尚未通过。

Freight 两个失败经只读 trace 定位为测试定位问题：`originRow` 原正则 `^Porto, ` 不匹配实际 accessible name `Porto , Portugal`；此外免费 DataGrid 的 `data-col-id` 仅在 `th`，body `td` 没有该属性。过滤失败时 snapshot 已有11行、Porto Out22、Valencia Out274、Inbound / In view581；并非未等待过滤完成。手机规格在首个 `origin.boundingBox()` 就超时，尚未到达 `hover` 或 `mouse.wheel`，不能作为产品 pinning / scrolling 失败或通过的证据。

仅测试窄修：origin row 以真实 `Select ${city}` checkbox 精确定位；Out 与 footer Out 以真实 columnheader 的 `cellIndex` 读取同列 `td`；手机 origin 使用该行原生 `data-pinned=start / data-last-col=start` 的 `td`。所有原数值、viewport390×844、wheel600、scrollLeft>0、固定列x位移和document width390断言、timeout / retry 均保留，产品实现 / CSS / shared / candidate / dist 没有为测试改动。此两条修后只有 scoped format/check/lint，**未再执行浏览器**，等待主会话集中验证，不称产品已通过。

首次真实默认视觉图只读对照发现 compact 行实际45px，而公开两viewport均41px；desktop Frame749px vs700px，table597px vs550px。根因是本 leaf origin 的两行各16px，加免费 dense td 的上下6px和边线，形成45px intrinsic minimum；tr 的41px不能压住内容。此次最窄校准仅为 compact 次行添加 `.freight-origin-detail` 的12px行高，保留名称16px、字号、native padding、完整文字和 comfortable 原16px次行；28px内容+12px padding+1px边线应满足41px。没有为压行新增固定高度裁字、负margin、overflow隐藏或 primitive 修改。

同语义 band 的公开无文字像素采样为 Deep Loss `rgb(229,120,125)`、Loss `rgb(250,204,206)`、Thin `rgb(236,215,157)`、Healthy `rgb(204,242,229)`、Strong `rgb(127,221,189)`；原 leaf 的 Deep Loss / Strong 分别为 `rgb(255,100,103)` / `rgb(94,233,181)`，更饱和。此次仅校准五个本地语义色 token：统一80% oklab mix 与当前背景，通过由已观测 light 样本逆算的 source tone 得到上述 light 渲染目标。80%是本地配色组合参数，不声称已读取公开源码或证明原版使用同一透明度；现有 dark palette 保留，未改阈值、band分布、数据或经济计算。

原五条 browser specs 数量不变，仅在默认行与既有phone case增加41px实际行高断言；此前的selector修正、数值、横滚、位移、timeout / retry均保留。手机外gutter12px vs16px留给父会话协调新五ID的外层 wrapper，不在leaf补偿。此次仅 scoped format/check/lint；没有启动浏览器 / TS / Vite / build / install / Git，没有修改candidate / dist。以上行高与像素改善仍待主会话下一轮同态生产截图和规格实测，未记作视觉已通过。

最后一项静态 CSS 缺陷窄修：keyboard focus 的 origin 背景提示原本选择 body `[data-col-id=origin]`，但免费 DataGrid 仅在 header 提供此属性，规则不会命中。现仅将目标改为同一真实 row 内原生 `td[data-pinned=start][data-last-col=start]`，对应现有 start pinning 中排在 select49 之后的 origin 列；保留 `:has(.freight-heat:focus-visible)` 触发条件与原背景 token，不改变 pinning、selection、row 策略、DOM 或 primitive。没有新增测试或运行 browser / compiler / runner；仅 scoped CSS / ledger 格式检查，运行时 focus cue 仍待父会话验收。本批再次冻结。
