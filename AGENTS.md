# Project instructions

## ReUI 免费组件优先（适用于所有会话和 subagent）

实现、修正 ReUI Pro Blocks 和 Pro Templates 时，必须首先基于 ReUI 官方免费组件库已有组件进行组合与扩展。这是用户明确提出的项目要求。

- 开始实现前，先查找对应的 ReUI 免费组件、官方示例以及项目中已经引入的实现，确认可以复用的组件、样式和交互。
- 不要绕过 ReUI 免费组件，直接使用原始 shadcn/ui 组件或手写近似组件重新搭建已有能力。ReUI 自身依赖 shadcn/ui 不影响这条要求；关键是实际复用 ReUI 提供的实现。
- 检查负责范围内已完成和进行中的代码。存在对应免费组件却自行重写的部分，应优先迁移到 ReUI 实现，并核对原版样式、状态和交互行为。
- 仅在确认 ReUI 免费库缺少对应能力时补充自定义实现，说明具体缺口和理由。不能仅修改名称、外观或导入路径来声称复用。
- 交付时说明实际复用的 ReUI 免费组件、纠正的重复实现，以及仍需自定义的部分与原因。
- 将以上要求转达给当前已有的所有 subagent，并在后续 subagent 的任务说明中明确包含。修改共享组件时协调其他会话，避免覆盖并发工作。

## 重要进度及时提交并推送 Git

- 用户明确要求：重要进度完成后及时提交并推送 Git，方便 GitHub 预览网站及时更新，不要积压到整个任务全部完成才推送。
- 每完成一个可预览的重要里程碑（例如组件迁移、页面完成、关键交互或样式修复），完成必要验证后，及时 commit 并 push 到项目约定的预览部署分支。
- 多会话和 subagent 共用工作区时，由负责该批变更的主会话协调提交和推送，避免并发 Git 写操作。仅提交确认完成且属于该里程碑的文件，不要把其他会话未完成的修改一并提交。
- 推送后检查对应部署或 CI 状态；出现失败及时修复或报告。汇报时区分“已提交”“已推送”和“预览部署已成功”，不要把 push 成功当作网站已经更新。
- 将此要求转达给已有 subagent，并加入后续 subagent 的任务说明；subagent 完成重要进度后及时告知主会话，由主会话协调发布。

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
