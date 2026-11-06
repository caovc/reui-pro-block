# 模板整体布局开发计划 · 更新于2026-11-06

预览站使用 Bricklane 原创品牌。本项目是 ReUI Pro Blocks 和 Templates 的独立复刻，官方参考见 [ReUI Templates](https://reui.io/templates)。所有组件优先实际复用 ReUI 免费实现；未提供的业务状态与页面布局在使用这些组件的页面中补充。

本地已有18个模板入口：16个应用、2个 landing。先前核对的官方清单有19个，Strata 仍按单独计划暂停。入口覆盖、交互通过和整页视觉还原是不同结果；本轮稳定的原站与本地页面比较覆盖 Flowly、Filespace、Verve、Tempo、Mesh、Flux、Lucent、Echo、Atlas、Cohort、Surge、Manifest；Filebox 新增了公开演示中的侧栏导航对比，尚不等于整页通过。

## 当前顺序

1. Verve Workspace：已提交并推送 `7729059`，恢复单一标题与真实 Frame 的4px内嵌、3px面板间距、20px卡片间距。侧栏和现有设置行继续复用；完整2211项云端检查及对应 Pages 部署已成功，见[该版本 CI/Pages](https://github.com/caovc/reui-pro-block/actions/runs/41676366113)。后续每批仍独立核验。
2. Filespace / Filebox：完成本批底部导航、存储进度与分隔线。保留已匹配的主侧栏、DriveFolderTree 和 Workspace 卡片。导航需保持真实 href、aria-current、Space/Enter 与手机关闭后回到导航按钮的原生行为；不自行补写键盘引擎。
3. Flowly：已按实测修正二级菜单密度、桌面 footer 与 Members summary 的 Progress，并验证两种宽度的原生导航、独立收起与席位变化。原站 General 组标题和描述本来就视觉隐藏，不能改成可见标题。
4. Mesh、Flux 已完成本轮列明的本地布局和账户范围。Lucent 三页账户已通过本地验收；工作区切换与 Services 导航另列下一范围。各版本的完整 CI 和 Pages 以独立记录为准。
5. Tempo 本批完成50px header、侧栏顶部通知、折叠92px/手机56px顶部、真实 Usage Frame/Progress、通知 Popover 与桌面 Context。桌面和手机布局、原生交互、源码与实际下载项目已验证；主导航/Saved Views 的进一步密度、链接细节及完整业务页面仍待后续。
6. Echo 本批完成真实 Resizable 侧栏、Card/FieldSet 设置、Frame composer、MessageScroller 和账户 inline Theme。修正断点切换的组织状态重置，保留原聊天与设置业务；源码及341文件原始下载项目已验。Atlas 本批也完成已观察的 header、侧栏与三页账户范围；Cohort 本批完成主区滚动、侧栏内容与设置结构范围；Surge 本批也完成侧栏、Dashboard、日期筛选及已观察的 Reorder/Groups 范围；Manifest 本批完成 Auth、整体 chrome、Dashboard 和已观察 General 范围；下一批 Miro clinic，先实测 Chair board 和设置结构再决定免费 resource 视图迁移。

## 本轮已浏览范围

| 模板                | 实际复用                                                                                                                                                               | 本批结果与后续                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verve               | ReUI Sidebar/SidebarNavigation；DriveSettingsCard 中的真实 Frame、Header、Panel、Footer；现有 SettingsRow/Fields                                                       | Workspace 布局已通过桌面、手机、源码与实际下载项目检查。header/search/menu、按钮密度、颜色选择和字段行高仍需逐项核对。                                                                                                                                                                                                               |
| Filespace / Filebox | 真实 Sidebar/主 rail、DriveFolderTree、DriveSettingsCard/Frame、设置行与字段                                                                                           | 本批采用官方免费 c-progress-2 组合及真实 Progress，取代缺少进度语义的手写条；导航采用官方 Base c-button-27 及其 Button 依赖，以原生 API 保持链接的键盘行为。保留已匹配的63px rail、256px二级栏与卡片框架。                                                                                                                           |
| Flowly              | 真实 ReUI Sidebar、原生手机 Sheet、Content/Group/Menu，以及现有设置行与字段                                                                                            | 十个菜单行已匹配28px/12.8px字体及各组位置，手机原位置保留；主 footer 两宽均80px。Members 实际复用免费 Base c-progress-2，原生 Root8px/Track4px，模型进度60%→邀请70%→撤销60%已验证。header、主题和账户菜单仍待后续。                                                                                                                  |
| Mesh                | 现有真实 ReUI Sidebar、ScrollArea、DataGrid/ColumnHeader/Table，以及实际 SettingsPanel                                                                                 | 本批固定视口高度和真实 ScrollArea 滚动，header48px、footer84px；Profile 打开/关闭不再滚动整页，深色表头恢复可读。Canvas/Documents 保留原引擎正文。原站无滚动条布局与本地 Radix hover overlay 的细节仍列边界。                                                                                                                        |
| Tempo               | 真实 Sidebar/原五节 SettingsPanel；免费 Frame/Base Progress；c-dropdown-menu-11 通知组合；既有 CalendarContext 与真实 Calendar/Checkbox                                | header50px，展开/折叠/手机顶部56/92/56px、footer48px；通知320×401，手机x5/y50，19项/5未读可本地筛选和逐项操作。Context桌面280px挤压主区，Escape保持、按钮关闭；手机遵循原站无持续面板。真实 Usage82%和深色卡片/表头可读性已验；原Share/Export反馈、本地CSV及源码/下载项目通过。                                                      |
| Flux                | 既有实际 SettingsPanel/SettingsFields/SettingsRow/头像上传、原生账户菜单与五节独立数据；实际 Frame、既有通用 Base Progress                                             | Profile/Workspace/Team/Billing/Preferences 的31字段、13组选项及媒体保存已核；Theme 变更保存实际应用，取消不改主题。手机 header56/footer52、Overview与既有Settings子页保留侧栏、Portal三种主题可读性已验证。Runs子菜单和登录/组织后台仍有边界。                                                                                       |
| Lucent              | 既有实际 Sidebar、General设置 Frame；账户页复用免费 Card/FieldSet/Fields/Rows/Separator、原生 Tabs 和头像上传                                                          | 保留256px侧栏和现有 General 设置；Profile/Billing/Preferences 为独立整页 Card，20字段、28选项与5开关初态已核。菜单 Preferences→/settings 与账户标签→/account/preferences 分开；Update 聚焦 Role，Cancel 留页。原生导航、头像、主题、源码和实际下载项目已验；工作区切换、Services及完整toolbar仍待下一批。                            |
| Echo                | 实际 Sidebar/Sheet/AppShell、Resizable Group/Panel/Handle；Card/FieldSet/既有设置行与头像上传；Frame/InputGroup/Attachment；MessageScroller/Message/Bubble、RadioGroup | 原生拖拽、键盘、收起恢复及桌面/手机切换状态已验；General/MyProfile 真实 Card、命名面板和分组，composer149px及原生消息滚动已验。7项新增、18项旧回归、14项源码与341文件独立项目通过；quota详情、model popup、语音及服务行为仍列边界。                                                                                                  |
| Atlas               | 真实 Sidebar/Provider/Inset/WorkspaceSwitcher/Collection；Card/Fields/Rows/头像上传；DropdownMenu/RadioGroup/Collapsible                                               | Header64px、侧栏256/48与document滚动；手机外置收起控制、无Close，已观察设置入口保Sheet。三页改用真实Card，不补原站没有的FieldSet；Commerce保留Frame。外框与紧凑控件自然宽已实际修正，7项新原生、17项旧合同、8项源码和287文件独立项目已验；深业务及未执行菜单服务仍列边界。                                                           |
| Cohort              | 实际 Sidebar/Inset/Collection/Search；Frame/Header/Panel/Footer/FieldSet；native Tabs/anchors、DropdownMenu；已有免费Base Progress                                     | 主区原生双向滚动、Header56随主区滚动；折叠占位64/container66分开核对。Search/Headcount移Content、accountFooter48、submenu28/font14已验。Profile672左对齐max864，真实手动激活Tabs与FieldSet/Footer48，手机原生焦点回原opener。新增7/源码9、20唯一旧回归及293文件真实生产预览通过；部门bodyfilter、JobTitle帮助/0.75px及深页仍列边界。 |
| Surge               | 真实 Sidebar/Collapsible/RadioGroup/Tooltip；Frame；完整官方免费 DateSelector/Calendar/Tabs；DataGrid/Filters                                                          | Header51、侧栏260/62、手机原生Sheet及真实子路由；Dashboard Frame和日期选择、Reorder/Groups已观察页面已验。修复account Tooltip描述与父菜单选中；原业务/Manifest保持。最终20原生批次、26唯一旧回归及额外12旧合同、源码15、305文件原项目install/strict/真实preview11通过；PO/GroupDetail和远程服务仍列边界。                            |
| Manifest            | 真实 Card/Header/Content、FieldGroup/Field/InputGroup、Alert；Sidebar/Sheet/RadioGroup；Frame/DataGrid 与已有项目消费者                                                | Auth desktop416×660居中、phone358×688及纵向OAuth；Header51/expanded260、phoneGeneral保Sheet与Sidebar无障碍名称已验。核心身份/上传/defaultView模型保持，error清理和Back为明确本地扩展。79唯一检查、314文件原项目install/strict/真实preview13通过；Date/子页/DarkAuth/图表细节仍列边界。                                               |

Miro、Pulse、Roster、Filebox 的历史局部验收保留，本轮尚未完成其当前整页稳定对比；Filebox 本批侧栏范围除外。Limelight、Overture 按 landing 自身的导航、章节和 footer 核对，不套用应用侧栏结构。Strata 不计入已实现入口。

## 每批交付

- 原站与本地对齐1440×1000和390×844、主题及交互状态，等待真实动画结束后记录；无完整证据的颜色或状态不宣称一致。
- 实际复用官方免费组件与既有页面组合，保留 MIT、字体 OFL 和第三方归属；使用原创或许可明确的素材，不分发原站付费截图、头像、装饰图或提取 SVG。
- 检查预览、源码查看、复制、单文件下载与实际项目 ZIP 的一致性。新增文件同步维护 SourceTargets；下载项目使用原始脚本独立构建并验证必要交互。
- 按改动范围完成必要检查，由主会话协调正常 Git hooks、提交和推送；保护其他会话的在制文件。区分“已提交”“已推送”“云端检查通过”“Pages 部署成功”。

截至2026年11月6日本批整合，已验证线上版本为 `f96cedc`：完整2370项浏览器检查、167项工具检查及 Pages 部署成功，今日重新获取的公开 index/首CSS/首JS 与同一产物逐字节一致，见[该版本 CI](https://github.com/caovc/reui-pro-block/actions/runs/41759297403)。这不是新 Manifest 提交的 CI 结果。

Flux `0f9fd79` 原始 CI 为2241通过、3失败，部署跳过；三份 trace 确认 Overview 页面已切换、手机 Sheet 按官网保持打开，旧测试仍假定关闭。其三处旧预期已适配，并保留真实 Escape、关闭和焦点返回检查。

Lucent `3b9afd3` 原始 CI 为2265通过、2失败，见[原运行](https://github.com/caovc/reui-pro-block/actions/runs/41712092880)。两处旧预期分别是账户菜单旧名称和源码列表固定首四项；已在 `2ab2ad7`、`e274e74` 中修正，并完成相应原生与原源码流程。原失败记录保留，不能把局部通过当作完整部署成功。

Tempo 本批使用最终v7：实际截图发现v6深色表头仍白底浅字后暂停交付，改用 Tempo 范围内的主题颜色，并在同一用例补验真实表头颜色。v7 的11项原生、14项源码及新335文件原始下载项目的独立安装、严格构建和11项原生检查通过。与此颜色差异无关的19项旧回归保留已通过的增量证据。

Tempo `bb186d7` 的原始云端检查为2291通过、1失败，部署跳过：手机 Usage 的固定宽度采样263.9375与实测273不同；其余10项新增原生及14项源码通过。卡片本来是内容自然宽度，已把该检查改为独立文字 Range 加实际组件边距推导，保留原0.75容差和完整关闭/焦点尾流程；原单案已在最终 Echo 产物上通过，未声称确认字体根因或新的 Linux CI 通过。

Echo 本批新增7项原生、18项既有回归、14项源码通过。341文件真实下载包已独立安装、保持原严格配置构建并通过7项原生检查；白帧与过渡颜色证据保留，最终稳定截图已实际核对。具体复用、自定义缺口与未覆盖状态见 [Echo 本批记录](../echo-whole-layout-release-2026-11-04.json)。

Atlas 本批沿用真实 ReUI 组件并保留原账户模型。v1边距、v2外框、v3路由后菜单、v4紧凑控件的真实首败与画面均保留；最终v5通过。旧17项的11个先前通过与必要补6共同覆盖原合同，外置控件与实际导航内容区的宽度检查明确区分，原容差及真实Escape/focus尾流程保留。源码、287文件原始下载项目、独立安装/严格构建/首次7项检查均通过，见 [Atlas 本批记录](../atlas-whole-layout-release-2026-11-04.json)。

Echo `702de67` 后续完整2313项 CI、Pages 与公开 index 字节核对通过，Tempo 修正后的原手机完整用例也在 Linux 通过。Atlas `4a86d6a` 后续完整2328项 CI、Pages 和公开首页及主要资源字节核对通过；各自原失败与阶段记录继续保留。

Cohort 本批由真实 ReUI 组件组合修复主区不可正常滚动、侧栏内容位置、真实手动 Tabs/链接、Profile/Fiscal FieldSet 与 FrameFooter。33个设置业务回调及共享默认分支保持。原64占位与66容器、新原生焦点归属、未入组Tabs入口及Legacy CSS覆盖差异分别保留原证和首败。最终v10的7项原生、9项源码、20个唯一旧/受影响回归通过；293文件原始包独立安装和严格构建后，实际built-dist preview首次7项通过，开发服务器的先前7项不混为生产证据。详见 [Cohort 本批记录](../cohort-whole-layout-release-2026-11-04.json)。

Surge 本批完成真实 Sidebar 子导航、手机层级、原生 Radio/Tooltip、Frame Dashboard、完整官方免费 DateSelector 和已观察的 Reorder/Groups 页面。原 settings/account/products 模型保留；模板路由与本地领域状态作为项目组合。首次手机月历预期、Tooltip描述缺失、独立新产品页面的历史路径及旧主题/默认页预期均保留原证，按实际原生控件和路由修复或补强，没有减少旧业务断言与预算。最终v5绑定1198源码/657产物；新增及受影响页面、15项源码/下载流程和305文件原项目的独立安装、严格构建、实际预览11项通过。Root实际核四图，并区分1425/375视口校准与原生1440/390；完整页面高度、未访问叶页面及后端服务不宣称完全相同，见 [Surge 本批记录](../surge-whole-layout-release-2026-11-04.json)。

Manifest 本批采用实际免费 Card/Field/Alert 结构重建登录页，并复用原生 Sidebar/Sheet/RadioGroup、Frame/DataGrid 和已有项目消费者。已检查 Auth/Card 自然尺寸、手机 General 层级和焦点、Manifest-specific Dashboard、真实产品路由和源码四路。新手机抽屉名称差异在v2消费层修正；79个唯一检查、314文件原始项目的正常安装、严格构建和真实产物预览13项通过。独立模型审明确允许 error反馈清理、BacktoLogin和Remember name本地扩展，未将它们称作旧Auth全部执行相同。新记录见 [Manifest 本批说明](../manifest-whole-layout-release-2026-11-06.json)。

本次新提交仍需自己的完整 CI 与对应 Pages 部署。推送成功不代表网站已更新。Strata 继续按既定计划暂停。
