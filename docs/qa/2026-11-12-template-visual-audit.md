# Manifest / Atlas 本轮视觉抽查（2026-11-12）

本轮发现 **2 项 P2**：Manifest 窄屏柱图轴标签碰撞、Atlas 首页窄屏顶栏裁切日期控件；另有 Atlas 轴标签微小交叠（P3），随共享轴能力处理。只读审计已结束；本文件记录修复前 production baseline，不代表后续修复已验收。由 root 协调任务、修复、验证和发布。

## 范围与方法

- 环境：`hostname=a7516a9949de`；本地 `http://127.0.0.1:5175`，root 指定的 production dist，baseline SHA `559bd19`。当时工作树有其他模板 WIP；本轮 Manifest/Atlas 的审计对象未变。
- 原站：`https://manifest-commerce.reui.io/login`、登录后的 `/`；`https://atlas-admin.reui.io/`、`/account/profile`。
- 本地：`/#/template-preview/manifest`（登录前后）、`/#/template-preview/atlas`、`/#/template-preview/atlas/account/profile`。
- 视口：1440×1000 与 390×844，DPR 1，浅色。使用 `product-design:audit` 和 `frontend-testing-debugging`；Browser 插件及共享 Cua 工具缺席，因此使用已安装的系统 Chromium + Playwright。
- 每项视觉判断均来自本轮保存后实际 `view_image` 查看过的原站/本地同状态截图。截图旁同名 JSON 包含路由、viewport、DOM 文本/节点、矩形、字体、焦点、console、网络失败和截图 SHA256。
- 截图前等待字体、有限动画完成及绘制帧；两项故障又以稳定后的重复截图或精确 DOM 测量确认。未修改或禁用页面样式/动画。
- 所有非 GET/HEAD/OPTIONS 请求拦截，仅按 root 明确授权放行原站精确 `/login` 的公开预填 demo 登录 POST，以建立读取 Dashboard 的 session。未导出 cookie/凭据，未保存表单、改账号、改订单或发信。

范围先核对 [Manifest 发布声明](../manifest-whole-layout-release-2026-11-06.json)、[Atlas 发布声明](../atlas-whole-layout-release-2026-11-04.json)、[Atlas Account 集成记录](../atlas-account-settings-integration-2026-10-28.md) 和 [早期模板修正声明](../templates-fidelity-review.md)。旧材料仅用于确认曾声明范围，不作为本轮视觉证据。最新 Atlas 发布主要认证 chrome/account；本轮没有把未认证深层业务或本地服务示例当成后端缺陷。

## 任务清单

### VT-MAN-001 · P2 · 390px 柱图轴标签互相覆盖

- **Owner**：Manifest/Atlas 图表修复负责人，root 协调；同一可选响应式轴能力的两个显式 consumer。
- **路由/视口**：本地 `http://127.0.0.1:5175/#/template-preview/manifest` 登录后的 Dashboard、`http://127.0.0.1:5175/#/template-preview/atlas`；390×844。原站对应 `https://manifest-commerce.reui.io/` 和 `https://atlas-admin.reui.io/`。
- **复现**：Manifest 使用实际预填 demo → Log in → 向下滚到 Inventory velocity；Atlas 首页向下滚到 Threat Vectors。
- **差异/影响**：Manifest 强制显示全部 7 个 tick，Accessories/Activewear/Apparel 和 Footwear/Outerwear 连成难读文字；原站同宽会省略部分 tick。Atlas 同根问题较轻，Beacon/Day0 仍有实际交叠。此项针对可读性，超出旧声明中仅披露的 tick 外观细节差异。
- **截图**：Manifest [原站全页 13](/tmp/reui-visual-audit/templates/13-manifest-source-dashboard-full-390.png)、[本地全页 14](/tmp/reui-visual-audit/templates/14-manifest-local-dashboard-full-390.png)、[本地稳定测量 45](/tmp/reui-visual-audit/templates/45-manifest-local-tick-measurement-390.png)；Atlas [原站稳定 37](/tmp/reui-visual-audit/templates/37-atlas-source-home-charts-settled-390.png)、[本地稳定 38](/tmp/reui-visual-audit/templates/38-atlas-local-home-charts-settled-390.png)。对应同名 JSON 为 DOM 证据。
- **精确 DOM**：[tick-rect-measurements.json](/tmp/reui-visual-audit/templates/tick-rect-measurements.json)。Manifest 图宽 324px，轴文字均 12px，重叠宽分别为 Accessories/Activewear **20.1987px**、Activewear/Apparel **7.8393px**、Footwear/Outerwear **10.5678px**，重叠高均 15px；仍有 7 个 bar。Atlas Beacon/Day0 重叠 **0.1953px**，仍有 18 个 bar。Atlas DDoS/Inject 较密但测量未交叠，不夸大为碰撞。
- **实现定位**：审计 baseline 的 `src/templates/business/charts.tsx` / `BusinessBars` 强制 `XAxis interval={0}`；Manifest 在 `manifest-dashboard.tsx` 使用，Atlas 在 `atlas.tsx` 的 Threat Vectors 使用。复用现有 Recharts/Chart 能力，给这两个 consumer 明确启用避让；其他未审 consumer 默认行为由修复方保护。
- **验收**：390px 两个图表实际可见 tick 的相邻矩形不交叠；1440px 不出现新布局回归；保留全部本地数据及 7/18 个 bar，每个 bar 的类目和数据仍能通过已有可访问图表/tooltip 获取。不能以删除数据/bar 或复制原站付费数据解决。
- **状态**：已交 root 建任务并分配修复；本轮审计不将进行中的代码修改记为修复通过。

### VT-ATL-001 · P2 · 390px 首页日期控件顶部裁切，Export 超出顶栏

- **Owner**：Atlas chrome 消费样式负责人，root 协调。
- **路由/视口**：`http://127.0.0.1:5175/#/template-preview/atlas`；390×844；原站 `https://atlas-admin.reui.io/`。
- **复现**：以 390×844 打开首页，保持页面顶部；或从 Account 返回 Dashboard 后回到顶部。
- **差异/影响**：本地日期与 Export 形成两行，放在固定 64px 顶栏内；日期顶部在屏幕外，Export 伸出顶栏。原站日期位于 y16，但原站自身有 Export 向右越界问题，不能照搬其缺陷。
- **截图/DOM**：[原站稳定 41](/tmp/reui-visual-audit/templates/41-atlas-source-home-header-settled-390.png)、[本地稳定 42](/tmp/reui-visual-audit/templates/42-atlas-local-home-header-settled-390.png) 与同名 JSON。首次 17/18 亦复现。本地 header `y=0,h=64`，日期 `x=117.2344,y=-4,w=237.6719,h=32`，Export `x=117.2344,y=36,w=91.7813,h=32`。原站日期 `y=16,h=32`；原站 Export 右边界为 412px，单列为原站限制，不要求本地复刻。
- **实现定位**：`atlas.tsx` 的 headerActions/现有 Heading 消费，与 `atlas-shell-chrome.css` 的固定高度/窄屏排列组合。只调整 Atlas 的自然排布，不增加日期业务实现。
- **验收**：390px 的日期与 Export 完整位于视口和自身 header 内，与 breadcrumb/正文无交叠；1440px 顶栏仍保留既有布局，Account 手机页不引入多余动作或空间。原控件可达性与点击行为保留。
- **状态**：已交 root 建任务并分配修复；后续截图验收另记。

## 已完成流程及正面观察

| 步骤 | 页面/状态                                       | 本轮健康判断                                                               | 原站 / 本地证据编号               |
| ---- | ----------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| 1    | Manifest 登录，1440 / 390                       | Card、表单密度、字段、OAuth 排列与焦点外观一致；品牌/fixture 是刻意差异    | 01/02、03/04                      |
| 2    | Manifest 公开 demo 登录后 Dashboard，1440 / 390 | 主 header/sidebar、四 KPI、手机纵排和库存表结构正常；轴可读性见 VT-MAN-001 | 05/06、07/08、13/14               |
| 3    | Manifest 手机 Sidebar → Escape                  | Sheet 布局正常；退出后实际焦点均回到 sidebar-trigger                       | 09/10、11/12                      |
| 4    | Atlas 首页，1440 / 390；滚入 charts/lower       | desktop 主结构正常；手机 header 与轴见两项任务；未用懒挂载空白图判断差异   | 15/16、17/18、37/38、39/40、41/42 |
| 5    | Atlas Profile，1440 / 390 与手机整页            | Card、页签、字段与分隔结构正常，无手机表单溢出                             | 23/24、19/20、21/22               |
| 6    | Atlas desktop Account menu → Escape             | 菜单分组/Theme 行可见；退出后焦点均回账号 opener                           | 25/26、27/28                      |
| 7    | Atlas 手机 Sidebar → Escape                     | native Sheet 结构正常，外置 collapse 可见；退出后焦点回 sidebar-trigger    | 29/30、31/32                      |

DOM 实测：Manifest 登录 Card 原/本 desktop 均 `416×660 @ (512,170)`，phone 均 `358×688 @ (16,78)`。Atlas Profile Card 原/本 desktop 均 `1136×911.5 @ (280,194)`，phone 均 `342×1316 @ (24,214)`；手机 Profile 文档高度均为 1554px。实际测试的本地页面无相关 console warning/error、pageerror 或框架错误浮层；document width 均没有超过对应 viewport。焦点恢复由 `active` DOM 字段确认，未据此宣称完整 WCAG 合规。

## 证据限制与拒收

原站 Unsplash 媒体被当前网络策略阻断，已从比较中排除图片内容与加载失败本身；未据此报告产品缺陷。原站仍可见的主结构、字段和图表用于对应范围判断。本地原创 logo、头像、产品/宣传素材和 fixture 数据是明确边界；Manifest 已披露的图形纹理及库存表 11px 高度差异未另立任务。

`33-atlas-source-home-full-390.png` 中离屏图表尚未挂载，拒绝作为图表差异证据，随后滚入目标区域并以 37/39 等稳定截图替代。第一次补测 43/44 的 selector 分别未取得实际 tick/误选 Spark，且 43 有有限动画，故拒绝作为矩形测量证据；修正选择器后以 45/46 及 `tick-rect-measurements.json` 为准。最初为保护写入而拦截 demo 登录 POST 造成的登录停留属于审计工具行为，不是页面缺陷；放行精确 session 登录后重新进入成功。

没有执行日期筛选、保存、上传、登出、导出或真实业务写入；没有验证深层路由、暗色、其他浏览器、后端持久化或全部键盘/读屏行为。日期按钮的业务等价性未作为已确认功能缺陷。所有捕获/补测浏览器和自有 runner 均已关闭。

## 关键截图

![Manifest 原站 390 柱图](/tmp/reui-visual-audit/templates/13-manifest-source-dashboard-full-390.png)
![Manifest 本地 390 柱图](/tmp/reui-visual-audit/templates/14-manifest-local-dashboard-full-390.png)
![Atlas 原站 390 稳定顶栏](/tmp/reui-visual-audit/templates/41-atlas-source-home-header-settled-390.png)
![Atlas 本地 390 稳定顶栏](/tmp/reui-visual-audit/templates/42-atlas-local-home-header-settled-390.png)
![Atlas 原站 390 Profile](/tmp/reui-visual-audit/templates/19-atlas-source-profile-390.png)
![Atlas 本地 390 Profile](/tmp/reui-visual-audit/templates/20-atlas-local-profile-390.png)
