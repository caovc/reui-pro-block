# 持续复刻执行记录

最后更新：2026-11-12。用户要求持续协调开发，不能在一个里程碑或进度汇报后结束整体工作。本文是恢复点，不是“全部完成”声明。

## 最新接续点（约15:45 UTC，优先于下面历史检查点）

- Main已推送到c6363f0；run43235459944最终build和browser1/2/3成功、browser4 job131248280752失败、deploy skipped。API仅exit1，真实失败名仍缺；已异步请用户提供该新job片段，不能猜旧Roster/Lucent原因。最近成功Pages仍7579c5f / deployment7739954144。
- Root新增只读CI后台快照：`/tmp/reui-continuous-ci-watch/{watch.py,latest.json,changes.jsonl}`，当前两小时有界进程session6896（修正终态缓存后重启），每45s读取metadata，不cancel/write/publish；模型仍须读变更并协调。它不意味着聊天关闭后模型继续开发。
- 营销5300六文件完成Root审阅：全TS/双构建/202tooling；正式新增用例分批21/22通过，Sera原30s超时保留。随后直接import原case的单次instrumented诊断完整通过含Trial回焦，3新图实际view；不宣称同一轮全绿。旧Radix4与修正Base原生accordion状态后的Base1通过。候选/文档精确范围见营销QA报告。
- Strata原六个未访主页面已取得两宽12稳定默认图并逐张view，另一个Calendar过渡图排除。新窄schema含NewMonitor、Merges、CalendarNewEvent/Ownership、NewSource第一步和Settings五tab。私有目录分别为`/tmp/strata-six-main-defaults-20261112/`和`/tmp/strata-narrow-schemas-20261112/`。部分源旗帜图GET被代理拒绝，不声称零console错误。
- 初三页私有harness5320：全TS/双构建/41领域测试过；原native首批3 desktop通过、phoneOverview侧栏292.5px而非240px失败、10未跑。交叉视觉另证Logs三header堆叠令表下移约90px。新5321只改Root侧栏width优先级和Logs header CSS，双构建过，待重跑原14并actual view。它不是catalog注册或公开19th template。
- Source5350新document-ready候选只改私有SourceDialog，SHA3d69bb14…；全TS/双构建通过，原Filebox首5s click仍fail，原CodeBlock3/3过。前5310关闭syntax、5330只popper亦未过首gate，均不推广。Shared tracked SourceDialog仍已提交A ad72；P2开放。
- Strata默认叶静态已分派并交付：Overview8域测、Services11、Logs19（schema2+headerCSS）、Monitors9（已加真实NewMonitor）、Calendar15、Sources10、Releases/Board10。Root尚未公开注册，新增leaf大多未render验证，remaining动作/pinned详情/Settings与auth仍需接续。Owner哈希和限制在各`/tmp`handoff；不能暂存未验收WIP或称完整模板。

## 完成标准

1. 先核对官方目录和真实页面身份，再完成相应本地页面及可见交互。当前已确认官方20个模板、本地18个入口；Signal、Strata 缺项不能用空卡片、改计数或通用页面替代。
2. 实际优先复用 ReUI 官方免费实现，保留 Bricklane 原创品牌、许可和明确的本地模拟数据边界。不得把付费源码、原站 logo、头像、截图和提取的 SVG 分发到产品或 ZIP。
3. 逐项完成已确认的视觉和功能问题，对已宣称完成的 blocks/templates 继续有范围的审阅。目录入口存在或一张截图相似不等于所有页面完成。
4. Base UI / Radix UI 必须是真实组件实现；八种 style 在适用的桌面、手机、弹层和键盘行为中验证。代表性通过不得扩大为全部目录通过。
5. 源码预览、真实复制、单文件下载、完整原始 ZIP、依赖闭包、许可证及下载后构建须分别验证。当前 Source UI 性能门禁仍开放。
6. 每个可评审里程碑经必要检查立即提交推送；按精确 SHA 核对完整 Actions 和 Pages 部署。push、本地测试、CI 通过和部署成功是不同状态。

## 已有基线

- Job密度/工具栏里程碑已提交推送：`9ae5e9243aef3260be960220b6b69d7479053e95`，run43233734705待执行。此前 `7579c5f` 包括Job直接筛选、六种可创建类型和手机表单；`ba2958a` 修复Base禁用选项Escape被兼容层误取消；`d127fb1` 修复CI图表边界及Lucent菜单就绪检查。
- 5270 本地产物完成全量 TypeScript、两库生产构建、格式/lint、202项 tooling。Job 原55例首轮52通过、3失败，失败保留；共享修复后三个原定点通过、七项 Base 共享回归通过。最终表单18/18及22张新截图完成，另两库动态日期说明已观察。
- 这些是有范围的结果，不是新候选单轮55/55，也不表示所有679个 block 和18个模板都已全面复验。
- Actions 当前需重新读取 API：`d127fb1` run `43218584940`，`7579c5f` run `43224303995`。不能沿用旧状态；完整日志重定向域在当前运行策略中仍受限。

## 当前并行任务与所有权

| 任务                 | 所有者                   | 当前事实                                                                                                  | 下一步                                                                                                  |
| -------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| CI 与部署            | `ci_review`              | 逐精确 SHA 读取状态，健康运行保留                                                                         | 检查上述两run；真实失败先提取证据再分派修复                                                             |
| Job V03 密度         | `chart55_mobile_fix`     | 5280修正oracle版18/18、原22/22、风险3/3通过；28新图实看，首失败保留                                       | Root提交推送四文件，继续exact-SHA CI；该owner接续Strata Logs                                            |
| Source 性能          | `lucent_current`         | 5280原Filebox首5秒动作仍失败；原CodeBlock3/3通过真实高亮/全文/Wrap/PageDown/焦点/复制与selected ZIP bytes | A仅稳定CodeBlock身份、Copy按文件重置，可独立提交；P2首挂载与完整Filebox闭包继续开放，准备独立非发布探针 |
| Strata               | Root / 三个独立叶owner   | 13个href、三个实际页面两宽/24图；Root共享clock/身份/路由类型与header portal合同已落盘                     | Atlas做Jobs；Manifest做Services/SLO；Chart做Logs；Root做shell并排队其余真实参考，不注册空模板           |
| Signal               | `manifest_axis_qa`       | detail200；预览Vercel域和公开图Supabase域均CONNECT403                                                     | 先完成公开功能说明/免费组件映射；网络真正生效后再取UI与路由，不把营销说明当实测                         |
| Limelight / Overture | `foundation_style_audit` | 两ID真实独立；期间/计费组和四段tour存在已证实免费组件复用缺口                                             | 迁移真实ToggleGroup/Tabs，补导航状态语义，保留原视觉/业务/原创素材，冻结后双库浏览器验收                |

## 恢复与整合规则

- 读 AGENTS、本文、视觉待办、实际 `git status` / HEAD，先确认每个 WIP 的 owner。不能 `git add .` 或覆盖他人快照。
- Root 独占 Git 写操作及生产候选构建；agent 不擅自重编译或启动第二个正在计时的浏览器。独立静态工作持续并行。
- 不把当前工作树冒称与旧产物一致；候选要记录源码/配置 hash。必要时以非 Git 临时源码快照隔离已冻结变更和其他 WIP，保留真实源及所有资产。
- 原失败结果、trace、实际查看的图片和未完成范围保留。一次定点通过不抹去首轮失败，不宣称未实际执行的完整矩阵。
- 每完成一项立即更新本记录和视觉待办，分派下一项；只有完成标准达成、用户叫停或所有可做路径均被外部阻塞时，才结束整轮。

## 网络与私有证据

最近恢复点（约14:50 UTC）：

- 已推送HEAD `c6363f0ba91669d63382af86d1b951b2b3da9d2c`，包含V03、Source身份与首版favicon生成修复。Root尚未提交的图标末LF修正用完整字符串检查通过333bytes；5300旧332bytes保持原样。
- `7579c5f` 的run43224303995全部成功，Pages deployment7739954144成功；c636 run43235459944 build成功、四browser执行中。旧pending9ae/ed自动被新push替换，未手动取消健康run。
- 营销5300基于c636加六项冻结覆盖，排除全部StrataWIP；全TS/双构建/格式/lint/202tooling通过。Nova8/8、非Nova首12pass/1Sera整case超时/1未跑，正在原Radix4+Base1及未跑Rhea，勿把后续分段证据冒称首轮全绿。FSA-08真实Trial回焦修复已在该候选，待Root最终整合提交。
- Source私有CSS-only原例失败且实际丢行号，无CSS几何control通过；CSS几何例未到宽度/Wrap验证就超时。不应用该CSS。5310只关闭整个syntaxpipeline做诊断，原Filebox首click5s仍失败，不能发布或关闭P2；正式代码保留真实高亮。
- Strata三叶静态交付，Root私有三页集成harness仅有语法检查，未build/browser/目录注册。Logs按真实新建表单Schema继续调整；Overview枚举已按真HeaderEnv改Sandbox；Services空history保留null和真实TabsContent。其余六主页面仍未访，CI owner已备仅GET六页优先runner。
- Foundation目前独占本地原生browser，其他仅静态；Source5310浏览器已退出。Root独占Git writer，勿暂存Strata未验收文件。

14:00 UTC新核对：D `d127fb1` 的run43218584940全绿，Pages deployment7738573232成功；
7579 run43224303995的build/browser1成功，余三分片仍运行；72f69a3 run43229592153待执行。
后续milestone必须重查实际状态，不能从该记录推断新commit已部署。

当前运行环境仍为 network revision1；新草稿已保存精确 Signal 预览域和公共图域，并保留原规则与既有日志域。工具返回 `requires_publish: true`，保存草稿不等于应用。用户禁止 agent 发布环境，因此不自动发布，也不绕过代理/TLS；独立开发继续。

关键证据位置：

- `/tmp/strata-reference-scout-2026-11-12/`：Strata实际路由、24图清单及免费组件映射。
- `/tmp/signal-template-reference-2026-11-12/`：公开说明、403证据与实现映射，尚无真实preview截图。
- `/tmp/reui-source-performance-p2-20261112/`：当前Source基线与CPU/native事件；旧worker实验留在独立归档，不恢复为正式代码。
- `/tmp/marketing-template-static-audit-2026-11-12/`：真实ID分支、复用缺口和测试路由边界。
- `docs/plans/2026-11-12-visual-replication-backlog.md`：已确认问题、验收与后续清单。
