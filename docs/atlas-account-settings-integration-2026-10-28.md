# Atlas account settings integration

The reachable generic workspace form is replaced by distinct Profile, Security
and Preferences pages. Their schema and original demo identity are specific to
Atlas. Real hash links preserve the full preview mount, standalone mount, theme
query and native Back/Forward. Modified link clicks retain normal browser behavior.
Saved identity survives in-session navigation and updates the existing account menu.

## Actual component reuse

Profile and preferences compose the existing Pro SettingsRow, SettingsFields and
SettingsChoice, which render the actual free Field primitives. LocalAvatarUpload
uses the existing free file-upload hook; Frame, Select, Switch, Collapsible and
Badge retain their native behavior. The desktop navigation reuses the exact
Breadcrumb implementation used by official free ReUI c-breadcrumb-1.

The existing SidebarProvider/ReuiSidebar receive additive optional side and
reduced-motion props. Default consumers keep their old state and layout. Atlas
consumer CSS reorders the layout for Right and mirrors the existing SidebarRail
handle and caption toward the page; it does not hide overflow or replace the
provider. The original native mobile Sheet follows the actual side prop.

Custom code supplies the local profile/preference schema, validation, upload
lifetime and route adapter because the free library does not supply this app model.
The profile uses original Bricklane demo art and `.test` data. MIT, OFL and existing
third-party attribution remain in source and the actual download.

## Implemented interactions

Profile supports dirty state, save/cancel, email validation, verified-badge state,
avatar remove/cancel and asynchronous upload handling. Security has native groups
and local preferences; Change password uses the observed provider information toast.
No real credentials are modified. Color preference uses the existing shared theme
store. Right/Left and reduced motion affect the real Atlas interface.

Date format, default view, week start, draft/editor and tooltip preferences are local
preview state; they are not claimed to alter every calendar, chart or editor.
The official profile resets on route return; this implementation deliberately keeps
saved profile state for the active session. Reload/backend persistence is not implied.

## Evidence and retained failures

The first active strict compile caught a narrowed parent state setter. The parent
now uses the existing onSectionChange callback separately from the original dispatch.
A later Root Breadcrumb change exposed a missing Dashboard target in the route
adapter signature; it now accepts the same null target as its existing pure model.
Both original failures are retained; compiler options were not relaxed.

The first native6 run passed5 and caught a real desktop Right-side overflow. The
original left-only rail positioning placed the handle/caption83px beyond the viewport.
The consumer mirror fixes the cause. The necessary desktop case, two new color cases,
and two original permission/access regressions passed separately. The final actual
received project passed all8 native cases without changing its fixed entry or metadata.

The measured desktop card is exactly1136×911.5 atx280/y194, with navigation aty136.
Phone x24/y214/width342, navigationy156 and Accounty64 match the public reference.
A private0.5px geometry threshold caught a0.75px phone card-height difference
(1316.75 versus1316). That result is retained as a documented residual; no geometry
threshold was widened or relabelled as green. The full phone screenshot was reviewed.

Nine runtime files pass actual highlighted viewing, real clipboard, single downloads
and original ZIP membership checks. Initial supplementary test requirements incorrectly
included unused ReuiLayout and site-only shared.css; the actual dependency graph
requires UI Sonner and template reference.css. Those first failures are retained;
the exporter was not changed to add fake dependencies. The final merged candidate
passes the complete source case with22 real dependencies, notices and local Inter.

The joint release receipt records the exact archive, strict/native results and
independent audit. Normal-hook commit, push, full CI and Pages remain distinct gates.

## 最终共享 core 变更后的真实下载项目

Strategy 联合发布同时修正实际免费 DataGrid 的编辑锚点失效判断，因此重新从网站下载 Atlas 原项目并核验闭包。新包 **792,348 bytes / 192 members**，SHA256 `565a8ce1ba9a4a5e4c976a274f15c9864767e5c481741e7dfa142fee887386c9`。网站实际 Source/Copy/单文件与ZIP联合两项门槛首次2PASS / 10.017486s。

收到的原入口、package、strict配置与192成员均未修改；依赖是匹配正常安装目录的物理克隆，不称为 fresh install。原始构建 exit0 / 7.017825s，实际原入口 native8 首次全部PASS / 9.697164s；build及run后全部原成员字节保持精确。使用完的原生预览进程已正常停止。

这不改变已记录的手机几何0.75px高度残差，也不把局部交互通过扩大为逐像素一致、后端持久化或全部全局偏好消费者的声明。正常提交、push、全CI和Pages部署另外确认。
