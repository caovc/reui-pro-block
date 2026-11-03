# 模板整体布局开发计划 · 2026-11-04

预览站使用 Bricklane 原创品牌。本项目是 ReUI Pro Blocks 和 Templates 的独立复刻，官方参考见 [ReUI Templates](https://reui.io/templates)。所有组件优先实际复用 ReUI 免费实现；未提供的业务状态与页面布局在使用这些组件的页面中补充。

本地已有18个模板入口：16个应用、2个 landing。先前核对的官方清单有19个，Strata 仍按单独计划暂停。入口覆盖、交互通过和整页视觉还原是不同结果；本轮稳定的原站与本地整页比较覆盖 Flowly、Filespace、Verve；Filebox 新增了公开演示中的侧栏导航对比，尚不等于整页通过。

## 当前顺序

1. Verve Workspace：已提交并推送 `7729059`，恢复单一标题与真实 Frame 的4px内嵌、3px面板间距、20px卡片间距。侧栏和现有设置行继续复用；完整2211项云端检查及对应 Pages 部署已成功，见[该版本 CI/Pages](https://github.com/caovc/reui-pro-block/actions/runs/41676366113)。后续每批仍独立核验。
2. Filespace / Filebox：完成本批底部导航、存储进度与分隔线。保留已匹配的主侧栏、DriveFolderTree 和 Workspace 卡片。导航需保持真实 href、aria-current、Space/Enter 与手机关闭后回到导航按钮的原生行为；不自行补写键盘引擎。
3. Flowly：已按实测修正二级菜单密度、桌面 footer 与 Members summary 的 Progress，并验证两种宽度的原生导航、独立收起与席位变化。原站 General 组标题和描述本来就视觉隐藏，不能改成可见标题。
4. 下一批先比较 Tempo、Mesh 的整体布局和现有 SettingsPanel，随后 Flux、Lucent；其余模板分批核对 header、侧栏、footer、主滚动区和手机导航，再深入设置内容。先记录可重现的布局差异，避免仅凭导入了 Sidebar 就宣称整页还原。

## 本轮已浏览范围

| 模板                | 实际复用                                                                                                         | 本批结果与后续                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verve               | ReUI Sidebar/SidebarNavigation；DriveSettingsCard 中的真实 Frame、Header、Panel、Footer；现有 SettingsRow/Fields | Workspace 布局已通过桌面、手机、源码与实际下载项目检查。header/search/menu、按钮密度、颜色选择和字段行高仍需逐项核对。                                                                                              |
| Filespace / Filebox | 真实 Sidebar/主 rail、DriveFolderTree、DriveSettingsCard/Frame、设置行与字段                                     | 本批采用官方免费 c-progress-2 组合及真实 Progress，取代缺少进度语义的手写条；导航采用官方 Base c-button-27 及其 Button 依赖，以原生 API 保持链接的键盘行为。保留已匹配的63px rail、256px二级栏与卡片框架。          |
| Flowly              | 真实 ReUI Sidebar、原生手机 Sheet、Content/Group/Menu，以及现有设置行与字段                                      | 十个菜单行已匹配28px/12.8px字体及各组位置，手机原位置保留；主 footer 两宽均80px。Members 实际复用免费 Base c-progress-2，原生 Root8px/Track4px，模型进度60%→邀请70%→撤销60%已验证。header、主题和账户菜单仍待后续。 |

Flux、Lucent、Tempo、Mesh、Echo、Atlas、Cohort、Surge、Manifest、Miro、Pulse、Roster、Filebox 的历史局部验收保留，本轮尚未完成其当前整页稳定对比；Filebox 本批侧栏范围除外。Limelight、Overture 按 landing 自身的导航、章节和 footer 核对，不套用应用侧栏结构。Strata 不计入已实现入口。

## 每批交付

- 原站与本地对齐1440×1000和390×844、主题及交互状态，等待真实动画结束后记录；无完整证据的颜色或状态不宣称一致。
- 实际复用官方免费组件与既有页面组合，保留 MIT、字体 OFL 和第三方归属；使用原创或许可明确的素材，不分发原站付费截图、头像、装饰图或提取 SVG。
- 检查预览、源码查看、复制、单文件下载与实际项目 ZIP 的一致性。新增文件同步维护 SourceTargets；下载项目使用原始脚本独立构建并验证必要交互。
- 按改动范围完成必要检查，由主会话协调正常 Git hooks、提交和推送；保护其他会话的在制文件。区分“已提交”“已推送”“云端检查通过”“Pages 部署成功”。
