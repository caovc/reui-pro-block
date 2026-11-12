# Strata Logs：已观察表单 schema 与真实导出

## 当前版本与被替代的旧冻结

当前为真实Add event schema v2加固定入口、网格与复核控件修正。此前本地草稿表单的UTC/Trace/Service输入及18字段导出已被本版取代，不再作为当前设计。旧6文件、原QA文档和freeze清单完整保存在 `/tmp/strata-logs-pre-observed-schema/`（STATUS明确superseded）；原native13/13仅是旧schema的历史领域验证，不能作为本版或浏览器通过记录。

## 实际查看的参考

已读取 `/tmp/strata-reference-scout-2026-11-12/review.md` 并逐张实际查看21 Logs desktop、22 Logs phone、23 Export menu及配对DOM。默认62events/9owners，Info54/Warn4/Error4；Event Volume与Warnings to review桌面约3:2、手机堆叠；6-hour UTC桶，4warnings/4owners/2afterv3.5.0/0reviewed。Events列为Time/Owner/Event/Level/Resource/Source/PodIP/Actions、10rows/page。页头桌面1h/24h/7d/30d、手机compact7d；Export菜单实际顺序为Scope（Filtered events62、Selected events0 disabled）与Format（CSV/JSON）。参考未点击下载，未证明其文件字节格式。

新补证已逐张实际查看并核对ARIA/DOM：

- `/tmp/strata-next-get-reference-20261112-settled/01-logs-category-options-desktop-stable.*`。
- 同目录`02-logs-cluster-options-desktop-stable.*`、`03-logs-resource-type-options-phone-stable.*`。
- `/tmp/strata-next-get-reference-20261112/03-logs-add-event-source-options-desktop.*`。

实际Add event为右侧16px-inset Sheet，桌面576px宽、390手机358px宽；手机仍保留两列字段组合，body内部滚动、Cancel/Add event固定页脚。真实字段与选项：

| 分组     | 已观察的字段/顺序/默认                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event    | Event text；Category：Deploy/Config/Secret/Access/Infra，默认Infra；Level：Info/Warn/Error分段，默认Info。                                                                                                                                                          |
| Origin   | Owner默认当前用户；Source：Console/Kubernetes/OTLP/Synthetics/GitHub Actions，默认OTLP；Environment：Production/Staging/Sandbox分段，默认Production；Cluster：None/prod-eu-central-1/prod-us-east-1/staging-us-east-1，默认prod-eu-central-1；Pod IP默认10.4.0.40。 |
| Resource | Type：Deployment/Service/Route/Database/Secret/Incident/API key/Alert/Job，默认Service；Name；ID，空时由name生成。                                                                                                                                                  |
| Message  | Summary textarea。                                                                                                                                                                                                                                                  |

源默认用户是Shadcn，本地映射为shell已实际使用的原创当前账号Maya Ellis。没有复制原站头像/品牌。新form删除旧UTC/Trace/Service输入；固定STRATA_NOW创建timestamp，新增event的trace为空，既有记录的trace仍保留可搜/可导出。Review已观察的是Review all与每条warning直接mark按钮；已移除猜测的menu/detail review入口。

## 共享合同与独立记录

`useStrataLogsModel()`供root在路由分派之上调用一次；`StrataLogs`接受共享page props、model和可选`preset`。`forPreset`纯选择普通或`errors-payments`的独立range/filter/sort/page/selection/display，events与review共享。固定入口的可见Error及Maya/Leila两owner规则真实匹配2条原event/1owner，不截取数组或隐藏筛选。`StrataHeaderActions`真实portal提供controlled Pin、range与Export，Pin与sidebar使用同一`pinnedRoutes/onTogglePin`。

共享时钟为2026-10-22 14:00UTC、共享9个原创owner和真实service IDs。独立62条event的BL-EVT ID、54/4/4级别、9owners、4warning不同owner及2after-release保持；10条checkout/payments部署→失败→告警→ack→状态更新共用`checkout-release-350`和v3.5.0关系。UTC桶包含时间边界、范围内事件总量守恒。

每条event持有真实Origin environment/cluster、category、resourceType/resourceId和Summary。environment使用共享已更正的Production/Staging/Sandbox强类型，没有Development alias。筛选和导出读取该Origin值；已知Production服务的资源可以明确拥有Staging Origin，不能由service覆盖。seed构建一次性为独立fixture提供Origin；导出阶段不重新推断环境。

资源Name不必命中共享service。只有Service类型的真实ID/name能关联已有service，否则serviceId为null；未知resource/服务不会伪造成checkout或Production。Name-derived ID采用公开说明范围内的确定性本地slug（Unicode名称可保留，非文字名称有稳定fallback），显式ID不改，同一资源可以被多条event引用；未声称该算法等于未测试的原站实现。

range/env/search/query/view/level/sort变更重置真实页码。selection以稳定eventID跨页保留；selected导出取当前过滤结果中的交集。图表与表格使用实际过滤集合；warning队列独立按range/environment而非search，固定入口图表为0/0/2而warning仍为4。源+15%prior7d缺少本地历史记录支持，当前展示真实警告占比/范围，不伪造趋势。

## 免费组件实际复用

实际组合免费ReUI Frame、Badge、DataGrid/useDomainGrid/DomainGridSurface、column visibility、pagination与Filters；ChartContainer/Tooltip及Recharts生成真实桶；Button/ToggleGroup/Select/DropdownMenu/Sheet/Tabs/FieldSet/FieldLegend/Input/Textarea/Avatar及免费c-progress-2的template Progress负责原生UI/语义。没有手写menu、portal、排序/分页或键盘引擎，不改共享组件。

自定义部分仅独立fixture、条件/时间桶、typed表单验证、ID生成和serialization等领域逻辑。新增CSS只作用于Logs自身类；按新图保留手机两列和16px-inset form frame。头像来自本地原创demoAvatar，品牌Bricklane；参考PNG/DOM及原站素材留在私有/tmp，不进产品/ZIP。MIT/OFL声明不变。

## 导出schema v2与领域验证

真实export获取table排序后的全量matching rows，filtered不只导当前10行，selected导出当前过滤交集。CSV/JSON同为22个稳定字段，新增Category/Cluster/Resource type/Resource ID；environment来自Origin。service/serviceID只表示真实关联，resource独立；缺失Origin不从服务臆造Production，未知service ID也不冒充已知服务。

CSV采用完整RFC4180双引号转义和CRLF，支持逗号、引号、Unicode、多行cell；新旧可编辑字符串的formula前缀添加apostrophe，作为可导入安全字符串。JSON保留存储原值、null与boolean，不套CSV保护。空filtered结果是header-only CSV或[] JSON。实际文件生成使用Blob/objectURL/download anchor并释放URL，文件名标注scope与固定日期。

`node --test tests/strata-log-export.test.mjs`在Node24原生加载真实.ts模块，当前25/25通过，其中原19条数据、导出与schema断言保留；新增固定入口、普通/固定状态隔离、真实规则清除、增加匹配记录后派生counts等验证。覆盖62/54+4+4/9owners与incident、range/env/桶边界、全量filtered/selected、CSV独立parser、formula保护与JSON原值分离、自由resource/ID和Origin environment。

私有5382通过限定语义Types、两库构建及127项Strata领域检查。默认Logs的桌面/手机身份与几何已在两库矩阵执行。新的直接复核专项4/4首轮通过：真实Tab/Enter完成4→3和可见撤回3→4，按钮24px完整留在FramePanel内容及每层clip祖先内；手机controlRight/contentRight均361px，桌面均1406.984375px。8张专项新图已逐张查看，0pageerror，原30/5秒和零retry保留。此前根网格撑宽及按钮被裁11px的真实失败/图片仍保留。

## 仍开放的正式验收

源Add event未提交，远端review状态未改变；所以新增记录、验证文案/ID算法和review完成状态是明确本地合同，不能声称已经复现远端提交。上述本地复核专项已通过；Add event完整原生表单、实际CSV/JSON下载、行详情和所有style仍需各自验证。

下一统一候选仍须验证真实Sheet/选项/分段、手机滚动/固定footer、键盘返焦、实际新event及counts、真实download和固定入口Back/Forward。SourceTargets、公开路由/catalog、Source与ZIP由root整合；默认与复核专项通过不能扩称模板全页、全部workflow或八style通过。
