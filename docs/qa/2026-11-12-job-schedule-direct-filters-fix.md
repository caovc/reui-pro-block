# BLOCK-V02 · Job Schedule 直接筛选

当前状态：本批消费者改动已完成分阶段验证。5260 完整55例为52通过、3失败；原22例全部通过。纠正modal属性定位并由共享层修复Base Escape后，5270原三例定点3/3通过，另共享Base回归7/7、真实源合同7/7通过。24张直接筛选截图已实际审阅，旧失败全部保留；不把这些结果写成5270单轮55/55，也不扩大为八style完整业务验收。提交、CI和部署由root分别跟踪。

## 本轮参考事实

参考入口为 `https://reui.io/preview/base/data-grid-advanced-22?embed=1`。两个只读窗口仅覆盖 Base/Nova、1440×1000；经已配置代理、TLS 验证开启，阻断所有非 GET。只操作公开 demo 的筛选与只读 Materials tab，没有新建、保存或更改收货状态。第二窗口结束已关闭 browser，进程 exit 0。

完整私有证据：`/tmp/job-v02-reference/findings.md`、`semantic-contract.md`、`semantic-summary.json` 及对应 fresh PNG/ARIA/JSON。关键菜单和选择/Materials 图已逐张实际查看，不使用 spinner、隐藏 SVG title 或初始化 locator 错误作为产品结论。

| 控件      | 已观察的原文、顺序与默认状态                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job type  | All Types；Job type 分组：Bathroom Remodel 6、Kitchen Remodel 4、Basement Finish 3、Tile Floor 3、Deck Build 3、Exterior Paint 3；类型有色点和计数。     |
| Show jobs | All Jobs；Status 分组：Not Started、On Track、Late、On Hold、Complete；Needs attention 分组：Lost Days 2、Late Materials 4、Booked Twice 0（disabled）。 |

实证交互：从第2页选 Kitchen 后，菜单立即关闭并返回触发器，列表回 1–4/4；Kitchen + Late Materials 是两个维度的交集，只剩2条，但风险菜单/触发器仍显示4。All Jobs 保留 Kitchen；All Types 保留 Lost Days。Kitchen + Lost Days 为空，原站显示 No Matching Jobs/Clear Filters 并隐藏 Crew footer。非空过滤下四张提醒、页头22 jobs/10 crew及全局 Crew footer 的20日工时保持不变。

Late Materials 命中的 Rahman 为 On Hold；Materials 写明 0 of 4 delivered，唯一异常 Quartz 为 Backordered、无 Arrives、Needed Nov11，其余3件 Arrives 都早于 Needed。demo Today 为 Oct27，所以该风险明确包括需要日期仍在未来的无到货日期材料。此证据没有证明原站全部内部计算分支。

## 实现与免费组件复用

- 新增 Job 专属 `grid-advanced-job-schedule-filters.tsx`，实际组合现有免费 Select、SelectGroup、SelectLabel、SelectSeparator、SelectItem、SelectTrigger/Value 与 ReUI Badge；复用已有 JobStatusBadge。没有手写菜单、portal 或键盘引擎，不改共享 foundation/style/vendor。
- toolbar 类型展示 Bathroom Remodel，但内部仍是 Bath Remodel；旧表单的四个选项值与文字保留，只增加 Tile Floor、Deck Build。新增两个类型有本地原创工序、工作日、命名和材料，能够实际创建计划；没有抽取付费源码或素材。
- 直接入口与 generic Filters 共用原 query。单选改写该维度的规则，另一维和搜索保留；Show jobs 的 status/attention 互斥替换。复杂、反向、多规则或未完成条件显示 Custom filters。All Types 只清 type；All Jobs 清 status/attention；generic Clear 清 query；新增 Job 沿用原 query/search 重置。
- 搜索、Filter、Settings、任务操作、日期导航、行选择与分页继续复用现有实现。手机直接入口与搜索/设置保留，generic Filters/chips 可以另行换行；不把 V03 密度或 V04 overlay 纳入本批。
- Job 专属 grid 使用已有 Empty/Button 组合显示 No Matching Jobs/Clear Filters；空态按钮清 query 与搜索并聚焦 Job type。Crew footer 仅在非空结果显示，内容仍来自全 jobs。没有修改共享 DataGrid 的分页或键盘代码。
- 新增源码叶已加入 `source-targets.ts` 的 Job Schedule 专属 hunk；既有 main/model/forms/grid/details 路径继续保留。没有修改其它来源映射。

## 明确的本地数据契约

`createScheduleSeed()` 固定沿用原四类循环。新增六类型选项不会把原循环从 `% 4` 改成 `% 6`，因此默认22条记录、稳定ID、日期、任务、材料、历史与 V01 工作量全部保留。

模型改动后已与修改前 `/tmp/job-v02-before-seed.json` 逐字段 deep-equal：全部22条完全相同，包括 Farrow 23h、Pike 31h 与 Dawson 未补雨天8h。类型计数来自真实本地 fixture：Kitchen8、Bath5、Exterior7、Basement2、Tile0、Deck0，不复制原站计数。

风险计数按全 jobs 中受影响任务数计算，与当前 type/query/search 结果独立；零风险项 disabled，类型零条仍可筛选到诚实空态。当前本地 Lost Days1、Late Materials1、Booked Twice21；21 来自原有 fixture 中真实的同日同 crew 冲突，不伪造原站0。

- Lost Days：至少一个 `state === "Lost" && !madeUp` 的 crew day。
- Late Materials：至少一个 `!received && (!arrives || arrives > needed)` 的 material。缺日期分支与已观察 Backordered 一致；日期比较与已收货边界是明确披露的本地 demo 规则，未声称穷尽复现原站后端。
- Booked Twice：复用 `crewConflicts(job.id, job.days, jobs)`；Lost day 不参与有效 crew 预订，同一 crew/date 在另一任务上已排程即构成冲突。
- attention 是风险集合；generic `empty` / `not_empty` 按整个集合是否为空判断，含 negated。类型/status 的现有非空字段语义保持不变。
- 全 jobs 的风险归类与计数仅在 jobs 改变时由 `useMemo` 重算；搜索和 query 改变复用 summary。

## 静态与模型验证

- scoped TypeScript、oxfmt、oxlint、diff 检查均 exit 0。TypeScript 使用 `/tmp/job-v02-typecheck.json`，入口限定 Job main/model/filters 并检查其依赖；lint/format 限定本批 Job 文件、新专项、专属记录，SourceTargets 仅检查不格式化其它 hunk。
- 旧 Job 原生22例与新专项17例枚举成功，共39例；没有删改旧断言。旧测试只有注意卡数量为4，并无需要放宽的“四种 type”断言；新类型测试明确检查原四项仍存在、总共六项。
- 无 browser 的专项模型3例已经通过，总2.4s：固定22条/ID与V01工作量、新类型真实工序/材料；未来 Needed 的缺日期风险与收货/日期边界；任务级计数、madeUp与真实 crew 冲突。
- 原预算保持 test timeout30s、action/expect5s、retries0、trace retain-on-failure；未开启自动重试或延长预算。

模型运行命令：`npx playwright test --config /tmp/job-v02-playwright.config.mjs --grep 'model:' --output /tmp/job-v02-model-results`。配置无 webServer；模型用例不请求 page/browser fixture，未启动任何浏览器。

## 5250 首轮正式结果及最小纠正

命令使用 `/tmp/job-v02-5250.playwright.config.mjs`，单 worker、30s test/5s action/5s expect、retries0、trace retain-on-failure；HTTP健康200。首轮完整39例正常退出，33通过、6失败，总8.2m。日志 `/tmp/job-v02-5250-first.log`、完整结果 `/tmp/job-v02-5250-results` 不覆盖。

| 失败                                 | 证据与处理                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 旧Base rain make-up/material receipt | 点击Dawson详情的Add Crew Day时，成功toast从root的Base inert子树拦截pointer，目标可见且enabled，5s动作超时。root授权在Job `openPanel` 的setPanel前仅dismiss同id `schedule-change`，正常非模态toast Undo、header Undo和undo栈保留。未改共享pointer-events或vendor。              |
| 新长链三例的摘要文本比较             | baseline用了innerText而toHaveText默认textContent，布局换行差异被误判，四卡实际文案相同。改为双方均innerText，仍逐字比较全部内容，不删摘要/工时断言。                                                                                                                           |
| 新Radix手机长链总时限                | 原30s在All Jobs选择阶段耗尽，该动作本身刚开始约0.2s；不提高预算，将菜单、组合分页、搜索All、generic Clear、空态Clear拆为五个独立用户行为，全部原状态及root clip断言保留。                                                                                                      |
| 新Base风险Undo前置关闭协议           | 收货、风险0和disabled均已正确；测试按Escape后未证明菜单已关闭便点背景Undo，终态Select菜单仍开，Base presentation层拦截背景。新增Sheet退出后的fallback AddJob焦点、菜单内焦点ready、Escape closed/hidden与返trigger证明，随后才Undo。尚未凭此断定共享Base缺陷，需5260实际复验。 |

两个真实失败trace的末帧已提取并实际查看；文本误判和总预算失败也分别读取了trace/ARIA。旧22保留21通过/1失败，新17保留12通过/5失败，不能写成首轮全绿。两库新增Tile/Deck真实创建、Custom和attention empty/not_empty均通过；Radix真实风险变化/Undo通过。

## 5260 首轮正式结果与待复验项

修订后的新专项为33例：模型3例；两 foundation × 两宽 × 五个独立筛选行为共20例；两库Custom、attention empty/not_empty、新类型各2项创建、风险变化/Undo共10例。加旧22共55例。原长链的全部断言均映射到对应行为，追加菜单分组/完整选项和关闭焦点证明；没有提高预算或删掉clip/状态检查。

root 统一构建的5260已HTTP200；运行前本批5个runtime/mapping文件和专项测试均通过冻结sha256校验。使用 `/tmp/job-v02-5260.playwright.config.mjs`、原30s/5s、单worker、零retry、失败保留trace，首轮完整55例退出1：52通过、3失败，总8.6m。旧22例全部通过，包含5250中Base toast拦截的原例（14.7s）；新33例中30通过。原日志 `/tmp/job-v02-5260-first.log` 与结果 `/tmp/job-v02-5260-results` 保留，不覆盖。

| 失败                               | 本轮精确证据与处理范围                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Radix complex query（第36，23.3s） | 原5s `Kitchen Remodel` option click在performing click阶段超时；trace没有click action done，也没有scheduled-navigation日志。稍后error-context已显示Kitchen、generic Job Type is Kitchen与8条结果，原因未证实，不能声称是query覆盖或导航barrier。保持原动作和预算等待定点复验。trace目录 `job-schedule-direct-filter-56a5a-ges-replace-only-that-field`。                                    |
| Radix risk/Undo（第40，13.0s）     | 收货、Sheet Escape/返AddJob、0行/风险0与disabled均过；Select modal打开时app被正常aria-hidden，原getByRole找不到背景Show jobs触发器，5s expanded=true期望失败。仅将这一个菜单打开期间的属性断言改为精确DOM role+aria-label定位；实际点击、可见、焦点、单Escape、关闭、Undo和恢复状态断言不变。trace目录 `job-schedule-direct-filter-57fcb-result-and-Undo-restores-it`。                    |
| Base risk/Undo（第55，11.7s）      | 同前收货与恢复焦点均过；document.activeElement在listbox内的ready断言也过，第二个单Escape后expanded仍true，原5s关闭期望失败。完整解引用trace快照已排除旧Sheet层：514771ms时sheet-content/overlay均已卸载；Show click为514918ms，第二Escape为515142ms，前后均无Sheet。具体关闭原因未证实，保持原流程等待定点复验。trace目录 `job-schedule-direct-filter-77272-result-and-Undo-restores-it`。 |

24张新PNG已逐张实际查看：两foundation × 两宽，每组default、type-menu、show-menu、generic-reset、empty、reset各6张。全部菜单项在手机视口内可见，分组/顺序/色点/Badge与本轮已观察参考一致；本地真实计数与原站不同，按前述数据契约保留。空结果与Clear后的全量恢复布局正常，未据此发现额外视觉缺陷。私有逐张清单 `/tmp/job-v02-5260-viewed-screenshots.txt`。两处风险和复杂query的失败trace末帧也已实际查看。

本轮浏览器与runner已关闭并归还协调窗口。此次范围为Nova/light、两foundation、1440×1000与390×844；两foundation × 八style尚须独立验证，也没有声称本批源码查看、复制、单文件或ZIP门禁已通过。不得将首轮52/55写成55/55；后续定点结果另行追加。

## 5260 三例定点与Base Escape诊断

仅修菜单打开期间的属性定位后，`/tmp/job-v02-5260-targeted.playwright.config.mjs` 已先list精确3例。原30s/5s、零retry、单worker、trace不变；独立日志 `/tmp/job-v02-5260-targeted.log`、结果 `/tmp/job-v02-5260-targeted-results`。定点2通过、1失败，32.2s：Radix复杂query在未改动作与预算下10.2s通过；Radix收货、风险0、disabled、单Escape关闭、返触发器、Undo与风险/任务恢复全链8.5s通过。Base仍在单Escape后的expanded=false原5s断言失败，没有补按Escape。此结果不能覆盖首轮失败记录。

随后获独占只读诊断窗口，私有spec `/tmp/job-v02-5260-private-probe/escape-diagnostic.spec.ts` 完整复制同一Base行为，只加入native事件/DOM/console记录，未改repo运行代码。初始化testDir过宽扫描`/tmp`曾遇EACCES、没有启动browser；收窄本任务私有目录后诊断1例正常运行，重现同一5s关闭失败。结果 `/tmp/job-v02-5260-escape-diagnostic-results` 保留，浏览器/runner已关闭。

诊断确认：第二Escape时document.hasFocus()为true，activeElement为已选择且disabled的Late Materials0；无Sheet层、无starting/ending样式。Escape进入window/document capture时defaultPrevented=false；之后Base官方`useFocusableWhenDisabled`的disabled可聚焦选项处理为非Tab键调用preventDefault（stack指向5260 `button-NX9g-BNz.js:1:8124`）；随后`useDismiss`执行关闭流程并stopPropagation。当前`overlay-compat.tsx`的`shouldCancelOverlayDismiss`在handlers存在时，即使未提供`onEscapeKeyDown`也直接返回event.defaultPrevented，因而Select root取消关闭。DOM从未出现closed变更，console为空。故不是旧Sheet、失焦、Escape未送达或搜索/query模型错误。

已将精确native-events.json、composedPath/activeElement/层状态、方法栈与实际查看的final.png交由root及共享compat负责人；没有在Job添加替代关闭、修改disabled语义或手写键盘处理。Base该行为仍未解决，待共享层修复并构建新候选后正式复验。

## 5270 修复后的三例正式回归

共享兼容层负责人已修正空Escape callback对象的取消判断，保留显式consumer.preventDefault取消合同；该共享改动与Create-only文案一起由root构建进5270。本批没有为Job添加键盘逻辑或变更风险禁用规则。

root确认5270全量types、双生产build和静态/tooling门禁后授予独占窗口。运行前实际HTTP200，`/tmp/reui-5270-runtime.sha256`校验全部匹配；专项spec仍为`51014c49e55654854cf884ea36df1b9b2fd2f2fa23da43370b4fb104ce8e8ec1`，与5260仅修modal-open定位后的版本一致。

`/tmp/job-v02-5270-targeted.playwright.config.mjs` 已list精确3例，继承30s test、5s action/expect、零retry、单worker、失败保留trace。正式3/3通过，退出0，总30.6s：Radix原复杂query9.5s、Radix完整风险链9.8s、Base同一完整风险链7.9s。独立日志`/tmp/job-v02-5270-targeted.log`、结果`/tmp/job-v02-5270-targeted-results`，不覆盖5260首轮或定点证据。

Base原真实失败从相同interaction变绿：收货后0行/风险0、零风险项disabled仍为true、菜单内native焦点ready、单次Escape关闭、listbox隐藏、触发器返焦、header Undo与风险1/任务行恢复全部保留并通过；没有重复Escape、force、手动focus、noWaitAfter、预算变更或弱化断言。复杂query原动作与预算保持。

运行结束browser与runner正常退出，窗口已明确交还root。此结果为5270的上述3例回归；旧22与其它新增30例的首轮通过仍准确归属5260。共享层其它默认/显式取消Escape、Create-only文案和两foundation×八style等门禁由root协调，不能据这3例冒称全部矩阵或Source/ZIP已通过。

V02 未修改 forms.tsx；它仅从扩展后的 jobTypes 自动取得新增类型，旧 Bath 文本仍在。V04 的 forms 与 SheetContent 布局另由其 owner 协调，不能混用 5240 旧 artifact 的验收作为新布局的证明。

原站尚未穷尽的边界：搜索与日期变化对菜单计数的作用、已收货异常日期、Lost 的全部 hold/历史日期边界，以及 Booked Twice 的原站计数单位。当前本地计算均明确披露，不冒称原站内部实现。
