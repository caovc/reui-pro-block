# Job Schedule V03：局部密度与工具栏尺寸

本批承接已提交的 V01/V02/V04 与共享 Escape 修复，只调整 Job main/grid 的消费者尺寸。浏览器结果基于root统一构建的5280，5270通过记录不作为本批样式的证明。

## 参考证据与撤销的外边距子项

已读取 `/tmp/job-v03-readonly-diagnosis-2026-11-12.md`，并逐张实际查看 `/tmp/reui-visual-audit/blocks/` 中的 `02-job-reference-desktop.png`、`03-job-local-desktop.png`、`06-job-reference-phone-focus.png`、`07-job-local-phone-focus.png`。两张1440×1000桌面图的Frame顶边均为y48；两张390×844手机图均为y32。旧审计关于本地y16/y0的描述不成立，本批不加leaf margin，不改route/Frame外间距。

该轮Base/Nova手机summary实测原站前两行约49.1875px、本地旧版45px；20个日期列原站37px、本地41px。原站Today/日期导航与手机Add Job/Search/Settings为32px；旧消费者采用28px的sm/icon-sm。原站类型、姓名、图形和业务fixture的差异不纳入本批密度修复，也不下载或分发原站付费截图/头像/素材。

## 最小实现

- Job专属DataGrid的compact行从h11改为h12，comfortable仍为57px，compact初始checked保持true。h12是接近参考行高的局部配置，尚不声称浏览器实际高度精确等于49.1875px。
- 20个日期列从41改为37，table最小宽从1189同步为1109。其余列仍为42/190/96/41，保留原有Job展开箭头、原创头像、状态、Finish与操作空间。没有为最后6px差值取消展开能力。
- main工具栏实际复用已有免费ReUI组合与Button：Previous/Next/Undo、手机Search采用icon，Today与generic Filters采用default；V02直接Select和既有InputGroup维持当前默认尺寸。
- Add Job与Settings仍各只有一个原生Button，保留原ref/handlers和可访问名称；采用icon及`sm:w-auto`、桌面padding，caption为`hidden sm:inline`。手机保留各style自己的正方形尺寸，桌面caption在同一命中框内。复用既有style的高度、圆角、字体和响应式caption规则，不把其余七style强压为Nova的32px/14px。
- 未改共享DataGrid/Button/Frame、model、forms、V02过滤器或query/分页语义；无新runtime叶，无需更改SourceTargets。MIT/OFL、Bricklane原创品牌及素材边界保持。

## 新增有意义的回归

`tests/job-schedule-density-native.spec.ts` 共18例，原30s test/5s action与expect、零retry、单worker配置、失败保留trace。

- Nova两foundation×两宽4例：Frame top与根无横溢出；前两行密度、20个日期列、保留列宽与手机1109px内部内容；工具栏32px/14px、手机唯一square按钮和桌面caption命中框；compact默认checked与comfortable切换/恢复；Settings和Add Job原生Enter/Escape返焦、真实Row展开/收起；手机内部横滚320px且选择/Job列固定，日期列实际移动。
- 其余七style×两foundation手机14例：按各自免费profile检查Add Job/Settings/Search实际平方尺寸与命中中心，不统一字号或高度；确认单一trigger、caption隐藏、根无横溢出，真实打开Settings/Create并单Escape返焦。

现有Job旧22例、新33例和Create18例的文件、预算、断言未修改。静态冻结时新增18例仅执行list；下面另行记录5280实际结果。所有正式输出独立保存，不覆盖5260/5270历史结果。

## 静态状态

仅本批main/grid/new spec/doc格式化与lint；scoped TypeScript采用noEmit，不构建产物。静态阶段没有启动browser、没有重编译生产候选，也没有Git写操作。

## 5280 首轮与两个确凿测试oracle纠正

候选为root隔离源码快照 `/tmp/reui-5280-source`，main基线72f69a3加本批main/grid与Source A，不含并行marketing WIP。运行前HTTP200，在该快照目录内执行 `/tmp/reui-5280-runtime.sha256` 全部匹配。首次从共享workspace目录校验只得到marketing.tsx/css两项差异，随后在正确快照目录校验exit0，两份日志均保留，不能把共享在制源码当作候选。

原配置 `/tmp/job-v03-5280.playwright.config.mjs` 首轮完整18例：2通过、16失败、2.9m，退出1。原日志 `/tmp/job-v03-5280-first.log`、结果 `/tmp/job-v03-5280-results` 保留。两库Nova手机全链分别10.3s/9.2s通过；失败均发生在新spec的两种预期错误：

- 两桌面把手机37px实际列宽直接用于宽容器。实际table/viewport均1214px，免费固定表格按可用余量分配后date为40.5px；名义列宽仍37。正确检查colgroup名义值、桌面table至少1109并填满容器、20日期等宽和按table/1109比例分配；手机实际37px和table/content1109保持精确断言。其余42/190/96/41名义列宽保留，桌面同样按比例检查实际值。
- 其余七style两库共14例对style标签使用toContainText，Playwright可见文字处理返回空串，trace却显示CSS已存在且style属性正确。沿既有style测试改为 `expect.poll(() => style.textContent())`，验证原相同CSS marker。原style属性、尺寸、键盘与返焦断言均保留。

root授权仅纠正以上oracle；没有修改运行源码、预算、重试或点击/关闭操作。修正后新增断言前的grid几何JSON，方便保留未通过时的真实测量。

## 5280 修正版本的18例结果与视觉核对

修正spec为 `f5f456e2215a40f0db61efc7265668b187722edd6ee9c46f677e5a6bb4a52eeb`。为验证新增colgroup读数，使用同一5280完整运行新版本18例一次：18/18通过、2.3m、退出0。配置 `/tmp/job-v03-5280-corrected.playwright.config.mjs`、日志 `/tmp/job-v03-5280-corrected.log`、结果 `/tmp/job-v03-5280-corrected-results`，均独立保存。不得称原首轮全绿。

Nova两库/两宽实测默认前两行各48px；这是标准h12接近原站49.1875px的局部结果，不声称精确49.2。桌面Frame顶边y48，table/viewport宽1214，date名义37、实际40.5；手机Frame顶边y32、内部table/content1109、date实际37、根宽390。Nova导航/Filter为32px高与14px字号，Add Job/Settings手机32px平方、桌面caption与命中框完整；comfortable保留57px级别、默认compact checked与切换/恢复都过。手机横滚320px后选择/Job固定、日期实际移动、根无横溢出。

两foundation的七种其它style共14例均通过：vega/maia/luma36、lyra/rhea32、mira28、sera40px平方按钮；真实Settings/Create的Enter打开、单Escape关闭与返焦均通过。各style原有圆角、大小写、字距等差异保留。

本轮修正版20张新PNG已逐张实际查看，包括Nova默认/手机横滚和14张非Nova手机控制。清单 `/tmp/job-v03-5280-viewed-screenshots.txt`。同时重新实际查看原站02 desktop与06 phone对照；原02/03与06/07四张在实现前也逐张查看。当前验证范围为默认密度、日期列和工具栏目标尺寸，保留现有generic Filters与本地原创业务内容，不把这些证据扩称整页像素完全等同。

## 5280 受影响既有流程回归与交窗

新版18例结束后，按root授权串行运行原Job22例，文件及断言完全不改：22/22通过、3.3m、退出0。配置 `/tmp/job-v03-5280-regression.playwright.config.mjs`、日志 `/tmp/job-v03-5280-regression.log`、结果 `/tmp/job-v03-5280-regression-results`。覆盖两库注意卡/工作量Undo、日期导航、分页、选择、搜索、展开、设置、详情编辑与历史、雨天补排/收货、手机滚动固定列及真实Job创建；此前Base toast相关雨天/收货例10.8s、手机固定列/创建7.6s通过。原22附带的8张新PNG也逐张实际查看，清单 `/tmp/job-v03-5280-regression-viewed-screenshots.txt`。

随后串行执行未改的Radix complex query与两库完整风险/单Escape/Undo三例：3/3通过、26.4s、退出0，分别7.8s/8.5s/7.9s。配置 `/tmp/job-v03-5280-risk.playwright.config.mjs`、日志 `/tmp/job-v03-5280-risk.log`、结果 `/tmp/job-v03-5280-risk-results`；零风险项disabled、菜单native焦点ready、单Escape隐藏/返焦、Undo恢复风险/任务等原断言均通过。

所有阶段保持30s test、5s action/expect、零retry、单worker、失败保留trace。没有对运行源码再作修改；main/grid仍分别为 `573a05c7ad39bbca4736031d8114b770728eb76ac2a549a39566f545d6a910d7` / `899db0e37ec155f543f07087e4c6ba05538a90f95273558acdead09ab1600035`。

本批合计实际查看5280正式修正版及回归28张截图；首轮两种oracle错误的16份trace和2个手机场景通过证据另行保留。全部runner/browser结束后已明确交还独占窗口给root，供Source负责人继续。没有生产重编译或Git写操作。两foundation×八style的完整站点审计、Source与ZIP功能仍按各自门禁记录，不能从本批局部43个通过场景推断全部开发完成。
