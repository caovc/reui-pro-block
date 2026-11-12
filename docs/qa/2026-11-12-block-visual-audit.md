# Block 视觉抽查任务清单 — 2026-11-12

本轮仅审计、列任务；未修改运行时代码、共享组件或测试。代表范围为当前目录已暴露的 Job Schedule 和 Working Agreements，不代表整个 Block 目录已完成视觉验收。

## 范围与方法

- Job Schedule 的交付依据：README 的 11 月 11 日目录更新、`docs/plans/2026-11-11-catalog-update.md`、提交 `884bf6e` / `e56a592` 及对应独立实现和原生测试。旧版 Advanced 22 的 Prospect Database 完成记录不用于证明 Job Schedule 完成。
- Working Agreements 的依据：当前目录、11 月 11 日计划、提交 `0c3e93b` / `70c1b11` 及 `tests/official-chart55-56-native.spec.ts`。
- 原站公开页面为 `https://reui.io/blocks/data-grid/advanced/data-grid-advanced-22` 和 `https://reui.io/blocks/chart/status-tracker/chart-55`。浏览器观察到的实际公开 iframe 分别是 `https://reui.io/preview/base/data-grid-advanced-22?embed=1`、`https://reui.io/preview/base/chart-55?embed=1`，故对应本地使用 Base UI 路径，避免混比 primitive。
- 本地为本轮 production server `http://127.0.0.1:5175`，视口 1440×1000 / 390×844，浅色、Nova、默认字体与圆角。Job 路径：默认首屏 → 手机表格横滚 → Add Job 键盘打开 → Escape 返回。Working Agreements 路径：默认 Payments 周矩阵 → Reviews within a day / Sep 28 周详情 → Escape → 手机向前移动五周 → 内部滚动至历史起点。
- Browser plugin not available。工具检索无 Browser/共享浏览器控制能力，使用已安装 Playwright 和 `/usr/bin/chromium`，外站继承 Cloud proxy、保留 TLS 验证。仅一个审计浏览器串行运行。
- 截图及 DOM 均为本轮重新获取；保存后逐张打开检查。`01-job-reference-discovery.png`、`08-agreements-reference-discovery.png` 为外壳 loading，`04-job-reference-mobile.png` 有尚未稳定的图标字体，均拒绝作为视觉结论依据。Job 手机默认界面使用后续图标已稳定且同为 Add Job 返回焦点状态的 `06/07-...-focus.png`。Chart 首次桌面临时探针曾等待到隐藏的手机分组标题行而超时，改成可见行后重新成功采集；该探针错误不列为产品问题。
- 原站 Unsplash 头像请求被网络策略阻止，仅保留原站自然回退状态；头像、原创品牌、素材及独立 fixture 姓名/数值差异不列为缺陷。

## 已观察步骤

| 步骤 | 状态                                                     | 结论                                                                                           |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | Job 默认桌面首屏，1440×1000                              | 主要区块和四周工作日网格存在；提醒卡、筛选入口、密度有差异，见 V01–V03。                       |
| 2    | Job 手机首屏，390×844                                    | 无根页面横溢出；内部宽表格可横滚，提醒卡信息和控件密度仍有差异。                               |
| 3    | Job 手机表格横滚 320px                                   | 两站 Job 列均固定；原站 viewport/content 为 356/1103px，本地 356/1189px；根宽均 390px。        |
| 4    | Job 手机 Add Job，Enter 打开、Escape 关闭                | 表单、关闭和底部操作可见，关闭后焦点环回到 Add Job；弹层几何/单列布局有差异，见 V04。          |
| 5    | Working Agreements 桌面默认首屏，1440×1000               | 两站均有三块摘要、14项协议、26周、Target列；表格宽926px且无根横溢出。                          |
| 6    | Working Agreements 手机默认首屏，390×844                 | 三块摘要纵向堆叠；首屏均看似最近五周，但本地把更早的21周隐藏，见 V05。                         |
| 7    | Working Agreements Sep28 当前周详情，两宽 Enter / Escape | 两站均显示7/9 PR、78%对90%目标、Pause Week / Edit Target；弹层在视口内，关闭后焦点返回原周格。 |
| 8    | Working Agreements 手机 Sep28 焦点向左移动五次           | 原站焦点可到 Aug24，本地停在 Aug31；原站该焦点未自动滚入视野，保留这一边界。                   |
| 9    | Working Agreements 手机内部容器滚至最早端                | 原站 scrollLeft504→0 后显示 Apr/May；本地没有对应内容，scrollLeft0→0，见 V05。                 |

## 修复任务

### BLOCK-V01 · P2 · 恢复排班提醒卡的风险标题与剩余工作量

- **路由**：原站 `https://reui.io/blocks/data-grid/advanced/data-grid-advanced-22`（实际 `/preview/base/data-grid-advanced-22?embed=1`）；本地 `http://127.0.0.1:5175/base/#/preview/data-grid/advanced/data-grid-advanced-22`。
- **视口/步骤**：1440×1000、390×844；新开默认日期范围 Oct 19–Nov 13、未筛选、第一页。手机可从 Add Job 关闭返回同一状态。
- **证据**：桌面 `02-job-reference-desktop.png` / `03-job-local-desktop.png`；手机 `06-job-reference-phone-focus.png` / `07-job-local-phone-focus.png`；对应 `.aria.txt` 中原站提醒标题是 “3 workdays past due / 2 workdays past due / Rain day to make up / No delivery date”，并有 “26h left / 20h left / 8h”。
- **具体差异**：本地以客户名作主标题，把风险类别降为小号副文案，逾期和雨天卡省略剩余工时；卡高约 66px，原站约 91px。原站页头同时显示 “10 crew members”，本地未显示。排班负责人无法在卡片上同样快速扫到风险种类和待补工量。
- **建议 owner**：Job Schedule leaf（`grid-advanced-job-schedule.tsx` / 本地 model）。优先用现有免费 ReUI Card/Badge/Frame 组合恢复信息层次，保留原创 fixture/头像。
- **验收条件**：两宽均以风险类别作为首层文字，客户作为第二层；逾期、雨天卡显示由本地记录计算的剩余/待补工时；页头显示真实 crew 数；卡片操作继续打开对应任务/补工界面，手机内部滚动且根宽不超过 390px。

### BLOCK-V02 · P2 · 恢复类型和任务状态的直接筛选入口

- **路由/视口**：同 V01；1440×1000、390×844 默认状态。
- **步骤**：打开首屏，查看提醒卡下方工具栏。
- **证据**：`02/03` 桌面和 `06/07-...-focus.png` 手机配对；原站 DOM 有 `Job type`、`Show jobs` 两个控件，默认文字 “All Types / All Jobs”；本地同位置只有通用 “Filter”。
- **具体差异**：两个常用筛选值不在本地工具栏直接可见；用户需要进入通用筛选器才能构造类型/状态规则。原站的直接筛选结构和当前范围提示未得到复现。
- **建议 owner**：Job Schedule toolbar，使用免费 ReUI Select/现有 Filters 的实际实现；不需要全局替换 Filters。
- **验收条件**：桌面及手机均有直接的类型与任务状态入口，默认和选择后值可见；筛选真实作用于网格、计数和分页；保留本地搜索与设置，不发生控件重叠或根溢出。

### BLOCK-V03 · P3 · 对齐 Job 首屏外边距、行密度和按钮尺寸

- **路由/视口**：同 V01；1440×1000、390×844 默认状态。
- **步骤/证据**：`02/03` 桌面和 `06/07-...-focus.png` 手机；`06/07-...-summary.json` 的网格行与控件 DOM 测量。
- **具体差异**：桌面 Frame 顶部为原站 y48、本地 y16；手机原站 y32、本地 y0。原站数据行约 49.2px，本地 45px；原站手机日期/筛选按钮高 32px，本地主要为 28px；本地工具栏文字约 12.8px，原站 14px。桌面本地表格底部约 y829，原站约 y879，整体明显更紧。手机日期列宽原站 37px、本地 41px，20 工作日的内容宽度从 1103px 增到 1189px。
- **建议 owner**：Job leaf 的 Frame/按钮/DataGrid 参数。修改应限定在这个 Block，避免改变所有免费组件与其它 Block。
- **验收条件**：两宽 Frame 顶部外边距、默认数据行高度、主工具栏字号/高度与原站相近；手机保留足够日期可视范围及原有固定 Job 列，横滚仍在内部容器；不把头像/姓名差异纳入验收。

### BLOCK-V04 · P3 · 对齐手机 Add Job 的弹层边界与表单排列

- **路由/视口**：同 V01；390×844。
- **步骤**：默认首屏聚焦 Add Job → Enter → 检查空白新建表单 → Escape。
- **证据**：`06-job-reference-phone-add.png` / `07-job-local-phone-add.png`，对应 `-add.aria.txt`。原站弹层为四周约 16px 留白、358px 宽、有圆角；本地为 390px 全宽、顶到底的 Sheet。
- **具体差异**：原站手机 Client / Phone、Job Type / Lead 各占一整行，本地两组都并排，改变了参考的手机表单节奏与输入宽度。两站关闭后截图都显示焦点返回 Add Job，本任务不宣称焦点缺陷。
- **建议 owner**：Job Schedule 表单和 overlay composition（`grid-advanced-job-schedule-forms.tsx` / leaf），优先复用已有免费 ReUI Dialog/Sheet/Field。
- **验收条件**：390px 新建弹层有参考相近的边距/圆角与单列表单；所有字段、Cancel/Add Job 可通过内部滚动和键盘到达；Escape 后焦点回到原触发器；桌面现有新建流程保持可用。

### BLOCK-V05 · P2 · 恢复 Working Agreements 手机历史周的可达性

- **路由**：原站 `https://reui.io/blocks/chart/status-tracker/chart-55`（实际 `https://reui.io/preview/base/chart-55?embed=1`）；本地 `http://127.0.0.1:5175/base/#/preview/chart/status-tracker/chart-55`。
- **视口/初始状态**：390×844、浅色 Nova/Base UI、默认 Payments、未筛选；默认首屏显示最近的 Aug31–Sep28 五周。
- **复现步骤**：打开 Reviews within a day 的 Sep28 周格，Enter 打开详情、Escape 关闭并返回焦点；连续 ArrowLeft 五次。另新开同一默认状态，将真实 `[data-slot="table-container"]` 的 `scrollLeft` 设为0，核对历史起点。本轮用 DOM 设定原生滚动位置，未声称执行了实体触摸手势。
- **截图/DOM证据**：`11-agreements-reference-mobile.png` / `12-agreements-local-mobile.png` 为默认对照；`15/16-agreements-...-mobile-summary.json` 保存焦点序列；`17-agreements-reference-history-start.png` / `18-agreements-local-history-start.png` 为历史起点截图，配对 `.json` 保存真实滚动容器尺寸。
- **具体差异**：原站手机保留26个周按钮，表格容器 clientWidth348、scrollWidth852，默认 scrollLeft504；设为0后截图清楚显示 Apr/May，并保持左侧协议名称。当前本地仅5个周按钮可见，容器 clientWidth/scrollWidth均348、scrollLeft0→0；较早21周被响应式 `display:none` 隐藏。相同五次 ArrowLeft，原站焦点依次到 Sep21、Sep14、Sep7、Aug31、Aug24；本地最后两次都在 Aug31。手机用户无法查看 Aug24 及以前的周详情，虽然标题仍声明 Apr6–Sep28。
- **建议 owner**：Working Agreements matrix（`working-agreements-matrix.tsx` 的 `weekVisibility` 与免费 ReUI Table 的容器组合）。使用现有免费 Table/原生滚动能力，保留最近周的默认落点和固定协议说明；不通过重写共享 Table 修复单个 Block。
- **验收条件**：390px 可通过明确的内部历史滚动或等价导航访问完整26周，并打开较早周的详情；默认仍聚焦最新周，根页面宽不超过390px；协议名称保留可读，键盘移动时焦点周能进入可见区域；当前周弹层、Escape返回和桌面26周结构继续正常。
- **证据边界**：原站 ArrowLeft 能移动到 Aug24，但未自动将该格滚入视野；本任务不要求复制该行为，也不将它误写成本地独有缺陷。原站历史内容可见性由 `17` 的真实容器滚动截图独立证明。

## 健康检查

| 检查               | Job Schedule                          | Working Agreements                                    |
| ------------------ | ------------------------------------- | ----------------------------------------------------- |
| 页面身份与非空内容 | 两宽标题、任务表、22 jobs正确         | 两宽标题、Payments、14项协议正确                      |
| 框架错误覆盖层     | 未见                                  | 未见                                                  |
| 脚本/控制台        | 本地无相关异常；原站仅头像请求受阻    | 本地无相关异常；原站仅头像请求受阻                    |
| 本轮截图           | 两宽首屏、手机横滚/新建均已保存并查看 | 两宽首屏/周详情、手机历史均已保存并查看               |
| 交互证明           | 手机Enter新建/Escape与焦点环正常      | 两宽Enter周详情/Escape焦点返回均true；历史周差异见V05 |
| 根横溢出           | 两站1440/390px未超出各自视口          | 两站1440/390px未超出各自视口                          |

Working Agreements 的主要 Frame、摘要层次、分组与列结构、手机目标值说明和周详情均接近参考。周色分布、百分比、趋势与协议顺序受独立 fixture 影响，不据此列视觉缺陷。当前报告保存修复前 baseline；后续任务是否解决以主会话对候选构建的独立验证为准。

## 检查边界

本轮未发现两个 Block 的根横溢出、空白屏、框架错误覆盖层或脚本异常。手机 Add Job 的焦点返回已通过实际截图确认；最初在关闭动画结束前读取焦点的瞬时 `false` 不作为缺陷。Working Agreements 四个原/本与桌面/手机组合的周详情 Escape 返回焦点均为true，截图与DOM一致。未声明完整 WCAG 合规，未覆盖屏幕阅读器、色彩对比计算、所有弹层、暗色、八套 style、Radix、全部26周内容或完整业务增删改。

## 截图

桌面默认首屏：

![Job 原站桌面](/tmp/reui-visual-audit/blocks/02-job-reference-desktop.png)
![Job 本地桌面](/tmp/reui-visual-audit/blocks/03-job-local-desktop.png)

手机默认首屏（同为 Add Job 返回后的焦点状态）：

![Job 原站手机](/tmp/reui-visual-audit/blocks/06-job-reference-phone-focus.png)
![Job 本地手机](/tmp/reui-visual-audit/blocks/07-job-local-phone-focus.png)

手机横滚：

![Job 原站手机横滚](/tmp/reui-visual-audit/blocks/06-job-reference-phone-scroll.png)
![Job 本地手机横滚](/tmp/reui-visual-audit/blocks/07-job-local-phone-scroll.png)

手机 Add Job：

![Job 原站手机新建](/tmp/reui-visual-audit/blocks/06-job-reference-phone-add.png)
![Job 本地手机新建](/tmp/reui-visual-audit/blocks/07-job-local-phone-add.png)

Working Agreements 桌面默认：

![Agreements 原站桌面](/tmp/reui-visual-audit/blocks/09-agreements-reference-desktop.png)
![Agreements 本地桌面](/tmp/reui-visual-audit/blocks/10-agreements-local-desktop.png)

Working Agreements 手机默认：

![Agreements 原站手机](/tmp/reui-visual-audit/blocks/11-agreements-reference-mobile.png)
![Agreements 本地手机](/tmp/reui-visual-audit/blocks/12-agreements-local-mobile.png)

Working Agreements 桌面周详情与返回焦点：

![Agreements 原站桌面周详情](/tmp/reui-visual-audit/blocks/13-agreements-reference-desktop-week.png)
![Agreements 本地桌面周详情](/tmp/reui-visual-audit/blocks/14-agreements-local-desktop-week.png)
![Agreements 原站桌面返回焦点](/tmp/reui-visual-audit/blocks/13-agreements-reference-desktop-focus.png)
![Agreements 本地桌面返回焦点](/tmp/reui-visual-audit/blocks/14-agreements-local-desktop-focus.png)

Working Agreements 手机周详情与返回焦点：

![Agreements 原站手机周详情](/tmp/reui-visual-audit/blocks/15-agreements-reference-mobile-week.png)
![Agreements 本地手机周详情](/tmp/reui-visual-audit/blocks/16-agreements-local-mobile-week.png)
![Agreements 原站手机返回焦点](/tmp/reui-visual-audit/blocks/15-agreements-reference-mobile-focus.png)
![Agreements 本地手机返回焦点](/tmp/reui-visual-audit/blocks/16-agreements-local-mobile-focus.png)

Working Agreements 手机向左移动五次（具体焦点周见对应 summary.json）：

![Agreements 原站手机向左五次](/tmp/reui-visual-audit/blocks/15-agreements-reference-mobile-history.png)
![Agreements 本地手机向左五次](/tmp/reui-visual-audit/blocks/16-agreements-local-mobile-history.png)

Working Agreements 手机内部历史滚至起点：

![Agreements 原站历史起点AprMay](/tmp/reui-visual-audit/blocks/17-agreements-reference-history-start.png)
![Agreements 本地历史起点仍为Sep](/tmp/reui-visual-audit/blocks/18-agreements-local-history-start.png)
