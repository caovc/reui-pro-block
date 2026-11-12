# Tempo 导航改进 · 发布前安全检查点

本批保留 Bricklane 原创品牌和现有许可素材，仅修改 Tempo 专属实现和测试。本文保留环境发布前的检查点，并追加新实例上的本地 production preview 验收记录。Git 提交、推送与部署状态由主协调单独记录；本地通过不代表线上已更新。

## 本批变更

- `src/templates/workflow/tempo.tsx`：Tasks 子导航与 Saved Views 实际复用现有 ReUI 免费 `SidebarNavigation`，替换独立手写按钮组合；保留主导航、任务表、24 项看板和日历引擎。
- My tasks 与 Team tasks 使用独立范围和原生活动状态。个人范围沿用先前 Assigned to me 对应的演示成员 Alex Johnson，并改为精确 assignee 筛选。
- Saved View 显示活动项，切换时清除旧搜索与 Exceptions。直接选择任务子导航或主导航会清理 Saved View 的活动标记。
- 创建任务后回到 Team tasks、清除旧筛选并把新记录放在第一页首行。独立只读审查发现的“追加到第二页导致创建后不可见”已修复。
- `src/templates/workflow/tempo-chrome.css`：只补任务子组宽度、间距和 Saved Views 原有计数外观。
- 新实例生产验收发现任务卡头在窄屏固定为 58px，换行后的 Exceptions / New task 被后续表格遮挡；追加 Tempo 专属的 `max-width: 1200px` 自然高度规则，保留 58px 最小高度。
- `tests/tempo-navigation-native.spec.ts`：新增 Radix/Base × 1440/390 共 4 项，覆盖原生 Space、手机关闭及焦点返回、个人/团队范围、Saved View 状态、清除筛选、新任务首行可见，以及看板/日历目的地。

## 免费组件复用与证据边界

本批已阅读仓库 `src/components/reui/sidebar.tsx` 的实际 c-sidebar-1/2/3 适配器，并成功读取固定提交 `067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a` 的官方免费 [c-sidebar-3 源码](https://github.com/keenthemes/reui/blob/067aa0dc7f8bbfec1cd76fc5ad31f842be5f569a/registry-reui/bases/radix/components/sidebar/c-sidebar-3.tsx)。原始文件 SHA256 为 `0f3b74e0aed2ed5568253bca2573ea6455f3456713c4321f5208f61f7b916fdf`。页面直接调用现有免费组合，没有重写 Sidebar、Sheet 或键盘引擎。

个人任务筛选、Saved View 状态和创建后定位是本地业务接线；免费导航组件不提供完整 Tempo 数据服务。暂停前旧环境的官方站访问被网络代理拒绝，不能据此声称原站视觉或交互实测。新实例已由主协调确认官网 HTTP 200；本记录尚未包含新实例官网浏览器对比结果。没有分发官方品牌 SVG、付费截图或原站头像。

## 暂停时验证状态（旧环境历史证据）

- 自有三份源码/测试的定向 oxfmt、格式检查、oxlint 与 `git diff --check` 已通过。
- 主协调确认集成 Radix 与 Base 两套构建均通过；这不等于浏览器交互或部署验收通过。
- 新增测试的首轮开发服务运行有 2 项在入口停留于 `Loading template`，尚未进入导航交互；失败证据保留于 `/tmp/tempo-qa-loading-first`。后续诊断页面自然加载成功，未放宽测试预算。
- 独立只读审查没有剩余阻断问题；其开发服务浏览器尝试同样停在入口，不能作为交互通过证据。
- **生产新增 4 项、Tempo 旧回归、源码查看/复制/单文件下载与项目 ZIP 验证尚未运行。桌面和手机最终截图也待生产验收。**

## 新实例生产预览首轮（2026-11-12）

- 执行前确认 hostname 为 `a7516a9949de`。使用已由主协调构建的 `http://127.0.0.1:5175`，系统 `/usr/bin/chromium`、`.qa/onboarding.playwright.config.ts`、`workers=1`，产物独立保存到 `/tmp/tempo-current/navigation`。Browser 插件未提供，按 frontend-testing-debugging 工作流使用仓库 Playwright。
- 新增导航 4 项实际结果为 **2 通过、2 失败**：Radix / Base 的 1440px 均通过，390px 均在原生点击 Exceptions 时被表格单元格拦截。失败不是入口 Loading，也未使用 force click、放宽断言或增加超时。
- 根因是共享 `workflow.css` 中 Tempo 既有卡头固定 `height: 58px`，但同文件 `max-width: 1200px` 已把 CardAction 移至下一行，手机搜索框又占整行，导致动作区溢出卡头并与表格重叠。
- 已查看桌面 Assigned to me 成功截图与手机遮挡截图。桌面活动项、任务范围与布局正常；失败手机截图保存于 `/tmp/tempo-current/phone-exceptions-intercept.jpeg`，最终手机成功截图仍待修复后验收。
- 最小修复仅落在 `tempo-chrome.css`：窄屏卡头 `height: auto; min-height: 58px`，沿用现有免费 Card / DataGrid 组合与原生点击。首轮结束时该修复仍待统一重构建；复验结果见下节。
- 首轮结束时，原有 Tempo Chrome / notifications 11 项、源码 14 项（查看、复制、单文件下载与完整许可闭包 ZIP）及相关旧回归均尚未在新实例完成，因此没有在旧 dist 上继续运行。

## 统一双构建后冻结验收（2026-11-12）

主协调确认包含窄屏修复的 Radix / Base 统一构建均以 exit 0 完成。再次确认 hostname 为 `a7516a9949de`，沿用 `http://127.0.0.1:5175`、系统 Chromium、`.qa/onboarding.playwright.config.ts` 与 `workers=1`，未调整原测试预算、断言或点击方式。

| 本地 production preview 检查                  | 结果                                                                                                           | 证据目录                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 新导航 Radix / Base × 1440 / 390              | **4/4 通过**；两套手机的 Exceptions 真实点击、范围切换、Saved View 清理、创建首行、Space、关闭和焦点返回均完成 | `/tmp/tempo-current/navigation-fixed`  |
| Chrome 原生布局及 notifications               | **11/11 通过**；Usage、折叠、More、Context、通知状态/断点/分层 Escape、Dark、Copy/Share/Export                 | `/tmp/tempo-current/native-fixed`      |
| 相关 Tempo 旧回归                             | **14/14 通过**；看板/日历、Reports cohort/segment、AI Ops、Sidebar 尺寸/手机/字体、账户保存/主题键盘/Escape    | `/tmp/tempo-current/regressions-fixed` |
| 源码查看、Copy、单文件下载与原始 ZIP 许可闭包 | **本轮未运行，14 项仍待验**；遵循主协调安排，等待共享源码界面的性能修复，不把这 29 项功能通过当作源码门禁通过  | 无本轮通过证据                         |

- 已实际查看同轮桌面 Assigned to me、Home、Dark 以及手机 Sidebar、calendar、notifications 截图。没有框架错误覆盖层或全局水平溢出；新增导航用例与补图脚本捕获的应用 console / pageerror 均为空。宽表保留内部水平滚动。
- 另以原生点击补采手机任务截图：搜索 Fix → Exceptions → Sana 单行；再 New task → 填写 Sana 的 Visible team handoff → Create task → TASK-2054 第一行、7 of 7 tasks。截图在 `/tmp/tempo-current/screens/tempo-phone-exceptions-fixed.png` 与 `/tmp/tempo-current/screens/tempo-phone-created-first-row.png`。
- 同次几何证据 `/tmp/tempo-current/screens/tempo-phone-header-geometry.json`：卡头高 **135.25px**，底部 **283.25px** 与后续 content 顶部一致；Exceptions / New task 两按钮底部 **273.25px**，中心命中均为 true；页面 `scrollWidth = viewport = 390px`。补图脚本退出码 0，浏览器已关闭。
- 三批命令均为 `PREVIEW_URL=http://127.0.0.1:5175 npx playwright test --config=.qa/onboarding.playwright.config.ts --workers=1 --output=<独立目录>`；分别选择 `tempo-navigation-native.spec.ts`、`tempo-chrome-layout-native.spec.ts` + `tempo-notifications-native.spec.ts`，以及 7 份既有 specs 中 `--grep='[Tt]empo'` 的 14 项。三批 `.last-run.json` 均为 passed，无跳过。

冻结自有文件仅四份，由主协调协调 Git 写入；没有修改共享组件或 `source-targets`，没有运行全仓 build/install，也没有自行提交、推送或部署：

- `src/templates/workflow/tempo.tsx`，SHA256 `c2f43c007312830c4d90b59f96bdd08c569d6bb51fd0465fb80816d2dc140dad`
- `src/templates/workflow/tempo-chrome.css`，SHA256 `73c6dc2e055e65db54473a42288d9cabe75907e359052313e7a934c87be82020`
- `tests/tempo-navigation-native.spec.ts`，SHA256 `b70caf05575ad8b9b8ba7300334afb72a71b1bf26cf6195de02baa2183c54678`
- `docs/tempo-navigation-release-2026-11-12.md`，记录本轮历史失败、修复及当前证据边界。

## 接续验收

共享源码性能修复并统一重构建后，再在主协调安排的生产预览上完成源码 14 项，保持原预算并保留真实失败证据。当前运行源码继续冻结；若发现新问题先交主协调协调，随后重做受影响验证。Firefox、Safari、其他未列视口及远程业务持久化未在本批验证。

主导航仍保持共享 Shell 的按钮导航，真实 URL 链接需后续共享 API 范围处理。Saved Views 的 `12/24/8/4` 保留现有演示徽标；Recent activity 保留原本的本地 List 目的地，不宣称远程历史功能。未修改共享组件或 source-targets；现有 Tempo 源码闭包已经包含实际复用的 SidebarNavigation。
