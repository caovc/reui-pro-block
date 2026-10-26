# Advanced 11 · Factory Scorecard

状态：独立 leaf 的首轮实现与轻量检查。尚未注册目录/路由，也未完成 TypeScript、Vite、生产浏览器、Source 或 ZIP 验收；不能据本文宣称页面已部署或像素一致。由 Grid 父会话与唯一发布会话统一集成、安排冷构建和提交推送。

## 官方免费组件的实际复用

实现入口是 `src/blocks/data/grid-advanced-factory-scorecard.tsx`，default `FactoryScorecard`。静态导入同 prefix 的 data、panels 和 CSS，便于现有源码收集器递归追踪。

- 复用已经入库的免费 `DataGrid`、`DataGridContainer`、`DataGridTable`、`DataGridScrollArea`、`DataGridColumnHeader`、`DataGridPagination`、`DataGridTableRowSelect/All`。`useDomainGrid` 实际创建 TanStack v9 `useTable`，原始派生记录全部进入同一 native 排序、筛选、分页、选择、列尺寸、列顺序与可见性模型；不在 render 前自行排序、切片或拼 HTML table。
- 直接使用免费 `Filters` 的 `variant="advanced"`、`advancedMode="popover"`、`FilterQuery` 和 `query/onQueryChange`，保留字段选择、条件编辑、嵌套组、键盘、portal 与焦点管理。没有使用旧 flat `FilterBar`/`matchesRules`，没有 flatten AND/OR。
- 直接使用免费 `Cascader`、Trigger/Content/Nav/Input/Breadcrumb/List/VirtualItems/Empty/Status 展示 Scorecard / Performance / Factory 列组。选中值从 native table visibility 读取，改选后更新同一受控 visibility；不存在另一份勾选状态。
- 免费 `Frame/Header/Panel/Title/Description` 承接容器，`NumberField` 五件套承接采购条款及指标的边界、输入、加减与键盘，`Badge`/`IconTile`/`Timeline` 承接详情内容。
- Tooltip、Sheet、Tabs、Select、DropdownMenu、AlertDialog、Button、Input、Textarea、Switch 等使用上述免费组件依赖的项目配套 UI。已核对没有另一个已安装 `reui/tabs` 可替换；没有手写 portal、focus trap、menu/radio、数字微调器或 tab 键盘状态机。
- 日期字段实际复用官方免费 `c-calendar-1` 使用的现存 `Calendar`，通过免费配套 `Popover/Trigger/Content` 与 Button 组合；`mode="single" required`、`captionLayout="dropdown"`、自动焦点、原生前后月、月/年下拉、日期禁用均由 Calendar 提供。已移除 Partner since / Last audit 的 native date Input，没有手写日历网格、月份状态机、日期键盘或 portal。

参考的免费示例能力为 selection 7、resize 15、column controls 18、visibility 20、CRUD 22/23、aggregates 26。免费 `c-data-grid-22` 与本次 Pro Advanced 22 不是同一条目。当前库和示例入口：

- <https://reui.io/components/data-grid>
- <https://reui.io/docs/components/base/data-grid>
- <https://reui.io/docs/components/base/filters>
- <https://reui.io/docs/components/base/cascader>
- <https://reui.io/docs/components/base/number-field>
- <https://reui.io/r/radix-nova/c-calendar-1.json>

没有修改免费 vendor、共享 adapter、源码收集策略、目录、dispatcher 或全局 CSS。原先此新 ID 尚未实现，不存在替换某个已发布 Factory 表的事实；本次直接使用免费基础，避免新增一个近似表格/筛选控制器。

## 原始数据与交互

26 家供应商及 8 个季度的原始指标为本仓库原创演示数据，包括 Cedar Loom Works、Alder Sole Studio 等；没有复制公开页面的工厂、名字、种子或付费源码。默认原始 counts 为 All 26 / Climbers 11 / Fallers 11 / New 3 / Below floor 9 / At goal 7，故与参考页 26/7/12/3/8/7 有意不同。金额、OTIF、缺陷率、orders、ISO 日期、null 历史均为稳定字段；不使用筛选后的 row index 生成值。旗帜是系统 emoji，无上游头像、公司标志、SVG、截图或远程媒体。

比较基准覆盖 Q2 2026 至 Q4 2024 的七个历史季度。切换仅改变 prior、变化与 prior rank，当前 Q3 2026 spend/rank 不漂移。Rank Within 支持全书和类别内排名，类别 peer band 以全类别当前季度分位数计算，不用当前 page 或搜索后的样本计算。

六种 lens 的 count 先应用文本及高级 query，再计算各 lens；表格进一步应用当前 lens。实际记录通过 native `scope` column predicate 进入 TanStack filtered row model，footer/page、sort/selection 与显示共享这一模型。空态提供 Clear Filters。

高级 query 的领域 evaluator 三态递归处理 AND/OR。空组、operator 未定、value 空白、many 空数组、range 不完整/反向/非数值均跳过，不让 OR 中的草稿变成永真；支持 rule negated、null empty/not_empty、数值 zero 与多选正反运算符。不是把 field-search helper 当记录 evaluator。

Next Buy 的五个人工 call 与九条领域建议规则分开储存。更改 call、编辑/新增工厂、备注增改删、删除工厂都更新同一原始 store；30 步 immutable reducer history 提供 Undo。Toast 使用一个固定 id，只保留最近修改的 Undo 按钮，另有可见的 Undo last change。删除先经 AlertDialog，CSV 导出 native filtered/sorted records 或已选择记录的交集，输出正确转义的本地 CSV。

详情 Sheet 五个真实标签：Overview 显示当前指标/peer lane/建议/条款；Quarters 和 Rank Path 各通过实际免费 DataGrid 展示八期记录；Quality 展示真实八期缺陷率/orders；Notes 通过 Timeline 展示并支持增改删。Editor 使用免费 NumberField、Select、Calendar/Popover 及标准文本输入更新字段和当前测量，保留前期历史。两个日期字段共享同一轻量组合；所选本地年/月/日序列化为 ISO day，不通过 UTC 转换偏移日期，保存仍进入原有可撤销 raw store。原始 since/audit fixtures 没有改变，新增默认继续为原创的2026-10-01；范围复现已观察的2000-01至演示review day 2026-10-15，演示基准后的日期禁用。

### 日期弹层的公开实测

先实际打开公开 Add Factory → Partner Since，再实现替换。公开 DOM 的 `data-slot="calendar"` 为单日、required；月份/年份是真实原生select（Choose the Month/Year），年份2000–2026、当年Nov/Dec禁用、Next Month禁用，Oct16起禁用。前月能到Sep，选回Oct14后按钮变成Oct14并关闭弹层、回焦点。Escape在动画关闭完成后回焦点、保留New Factory Sheet。稳定弹层212×258.28125px、Popover padding0、Calendar padding8、28px cell；不是初次打开动画中的201px读数。直接读取官方免费c-calendar-1 registry及本地Calendar API，确认可复用，无组件能力缺口。

私有审计收据为 `/tmp/bricklane-grid-advanced11-owner/public-date-open.json` 和 `public-date-interactions.json`，未将公开截图/HTML/素材加入产品或下载包。以上为**公开参考**实测；本地生产日期弹层几何、选择、Escape及回焦点仍待正式窗口，不能混称已验收。Last audit 的可编辑 Calendar 是本地已有编辑字段的统一增强，不声称公开Add Sheet中存在此字段。

可选 `loadFactories(signal)` 是真正异步 adapter 注入点，默认直接使用本地原始数据。注入时使用 DataGrid loading 状态，取消过期请求；错误保留最后有效数据并提供 Retry，成功才替换原始 records。没有凭空模拟后端成功或在 UI 提供假的报错开关。

## 领域自定义的实际缺口

免费 DataGrid 提供 cell/render/Tooltip 容器，没有供应商采购的 OTIF peer quartiles、合同 floor、季度排名、采购建议等数学。本次仅在 data 文件扩展这些纯计算，在 CSS 原创几何层绘制统一 80–100 横轴、灰 peer band、floor 虚线、95 goal、prior 空心点/current 实点与连线。没有引入第二套图表交互框架或复制 SVG。

叶级 CSS 控制参考的 41px 默认行、49px comfortable 行、32px header、桌面 493px/手机 320px OTIF 列及 576px 浮动 Sheet。11 在公开页面没有固定 Rank/Factory，因此本实现亦让它们随原生横滚移动；不照搬 10 的 pinning。手机 lens 是普通下拉，而不是把六个 lens 声称为 Tabs。所有交互层的键盘、Escape、焦点回归由实际免费/配套组件承担。

## 三个首要视觉目标与未验边界

1. OTIF 的共用坐标、每行纵向网格、peer/floor/prior/current 层次，以及 spend bar、rank movement 的密度是首要目标。目前只有 CSS 与结构实现，未对本地 1440/390 测量，不能声称横轴/数值对齐已经像素验收。
2. 512px 高级 Filters、256px Cascader、288px Settings、采购 radio 与多标签 576px Sheet 复用真实组件。Portal 宽度、字体实际下载、碰撞位置、动画后几何及手机焦点需正式生产浏览器核验；没有为共享字体问题添加私有 workaround。
3. 手机参考 Frame x16/y32/w358、1041px native table、无 pinning、header 图标化和 footer 页码→结果→page size 顺序是目标。外部 preview inset 由集成上下文决定，当前 leaf 未注册，不能把 CSS 的目标数值当作实际截图结论。

其他未验项：全部 builder 运算符与拖动 UI、native resize/move/reset、Sheet 备注编辑/删除键盘、CSV下载实际内容、异步 loader 的挂载/卸载竞态、生产 row/portal 细节、8-quarter detail 表的窄屏滚动、默认源码/copy/单文件/ZIP 字节闭包与 MIT/OFL 随包保留。它们需要在主会话正式窗口逐项验证。

## 本轮验证

- `node --test tests/grid-advanced-factory-scorecard.test.mjs`：13/13，通过领域数据、比较稳定性、numeric/category rank、peer 全集、坐标边界、call/suggestion/Undo、CRUD/notes/reload、双日期ISO字段/闰日持久化/Undo且季度历史不变、混合树/negation/草稿 OR、null/zero/range/multi-select 回归。纯测试仅覆盖raw store，不代替本地Calendar UI验收。
- owned paths 的 oxfmt、format:check、oxlint：由最终轻量收据记录；没有运行全仓格式化。
- `tests/grid-advanced-factory-scorecard.spec.ts` 编写了 10 个正式集成测试（分页排序、季度、lens、call Undo、免费 Filters/Cascader、五 tab/notes、创建、Calendar导航/日期持久化/Escape/回焦点、空态/selection、390px scrolling）。**尚未运行**；目录未注册时运行它们没有验收意义，不设置 skip 来伪装通过。
- 未运行 tsc、Vite/dev/preview/build、npm install 或任何 strict/ZIP 构建；没有 stage/commit/push。正式门禁及发布由父会话协调。

## 集成接口

仅需父会话在私有 candidate 把完整 ID `data-grid-advanced-11` 显式映射到 default `FactoryScorecard`，源码默认 target 指向真实 leaf，递归包含同 prefix data/panels/CSS 与已有免费组件/Calendar/Popover/`useDomainGrid`/`useIsMobile` supporting imports。不得创建 14–21 或用稀疏 `variant - 1` fallback。最终 default/copy/单文件与实际 ZIP 成员必须逐字节对齐；共享 source-targets/router/catalog 由唯一 owner 修改，本 leaf owner 不写这些文件。

Parent free-component audit: the async failure surface now mounts the installed official free Alert, AlertDescription and AlertAction, replacing its initial handwritten error box. Retry retains the actual loader action and occupies the native responsive action slot. Inline field-validation messages remain field feedback. This does not change domain math or fixtures; browser loader geometry still awaits the isolated QA harness.

## 首次候选生产回归的测试定位修正

第二次original main build exit0后首次44规格在同一immutable dist运行，11的8项通过（原生排序分页、季度、lens、人工call Undo、五tab/notes、Calendar、空态/selection及手机滚动），2项停在错误的测试定位阶段。原trace完整保留于production-results，不将此轮称为全通过。

Cascader案例spec55的trace `whbs@467` 表明Enter已打开Factory columns；失败snapshot已有Scorecard breadcrumb/listbox、level2、FOB Spend/OTIF。免费Cascader默认revealSelected=true，handleOpenChange按首个可见selected列spend显示其父层，所以spec66寻找根Scorecard option会超时。测试现在先点实际Back回根，再按原路径选Scorecard与FOB Spend；键盘打开、分支选择、隐藏列断言完整保留，不改产品默认行为。

创建案例spec100在trace `wrqw@178` 等待不存在的可见spinbutton；snapshot明确可见`textbox FOB Spend ($)=0`，另有aria-hidden spinbutton。免费NumberFieldInput实际提供textbox；测试改选可见textbox，保留输入5500000、新记录首行$5.5M、Undo完整断言。首次此case没有到submit/排名断言，不能将其称为已验证创建。

本次只改root spec与此记录，未改实现、candidate、dist或原trace，未启动浏览器/测试/编译。保持原timeout/retry和业务断言；修正后的2项等待父会话授权复验。

## Measured visual correction, static candidate pending

The first production screenshots and saved public baselines show desktop pagination at 30px versus the public 46px, and the phone header at 88px versus 80px. The leaf now gives the existing free DataGridPagination a 46px minimum and restores its native phone page buttons → results → page-size order. Phone header vertical padding is 8px. No pagination behavior or data was reimplemented.

The existing desktop/mobile tests now assert the measured footer/header geometry and phone order; the suite remains 10 cases with unchanged timeout/retry and original behavioral assertions. Shared phone gutter remains with the parent wrapper owner. This patch has no domain changes; the existing 13/13 pure-domain result is retained without a rerun. Scoped format/check and oxlint are recorded in the handoff manifest. Updated browser, build and visual verification remain pending a parent-authorized window. Evidence: `/tmp/bricklane-grid-advanced-five-round1/initial-visual/advanced-11-{1440,390}.png` and saved public `advanced-11-{1440,390}-baseline` evidence.
