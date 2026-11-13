# #79 / #77：运行时 linkmigration 与 error 详情

## 已复现的故障

当旧版在平铺 directory 创建 `app/runtime → ../runtime`，host 布局后来变成 `runtime/<process.arch>/primary-runtime/...`，旧 link 仍然存活，却不能满足 CLI 的平铺 loadpath。1.6.51 对此返回 `runtime_conflict`；更早的平铺检测返回 `missing_runtime`。这是一条已重建并验证的故障 path，不代表已确认报告者的系统及 directory 布局。

后端的 applyfailure 响应带 `cli_repair`，旧前端只留下总 error 字符串；具体 reason、启动器 readwriteerror 和恢复 state 被丢弃。1.6.54 展示这些白名单字段，仍保留 HTTP error 与原始 failurestate，不展开完整配置/prompt。HTTP 200 但 apply 未完整 success 的响应也使用同一详细 error 格式。

## migration 和恢复边界

- 只 migration 同一安装外层 runtime 的旧 link；当前 process 架构 directory 与 pnpm load 器必须 real 存在且解析在该 runtime 内。
- 先 rename 旧 link 为唯一 `.dshpurge-link-*.bak`，再建立新 link。Windows 使用绝对 Junction，macOS 使用相对 symlink。
- 创建/验证 failure 时，将可能存在的新 link 单独留存，恢复旧 link；恢复 failure 显式返回 `rollback_failed` 和 backup 位置。不 recursive deletelink 或任何目标 file。
- realdirectory、其他目标活 link、外部架构/load 器、未知架构、permissions 及 read failed 不靠覆盖或 skip 解决。目标在检查期间消失也不能误判为旧 linkcorrupt。
- backupsuccess 不等于 migrationsuccess；migrationsuccess 不等于 host 已 reload。插件不会自动 quit 或重新打开 DSH。

## 复现与验收

maintenance 脚本 `scripts/check-runtime-migration.mjs` 只能使用带 `.purge-install-test-fixture` 标记的新临时 CLI 副本；Mac 副本不得含 `.app` 或 Info.plist 身份。参数为 test 副本 path 及已校验发布包的 unpackdirectory。必须用副本自己的 Electron 在 `ELECTRON_RUN_AS_NODE=1` 下执行。

脚本先使用旧发布包的 reallink 函数建立平铺 link、执行 pnpm，再重建架构布局。验证旧版 failure 后，injectionlink 创建及恢复 failure，检查原 link/backup/目标内容，再执行新 migration 与 real pnpm。errorinjection 仅用于 failure 分支；file 系统和 Electron/pnpm 为实际执行。

然后运行 `scripts/check-install-lifecycle-runtime.mjs`：实际 official CLI/pnpm 的全新安装、旧包 migration、社区包及别名升级、rollback、再次升级；在实际包管理器 transaction 后 injection 校验 failure，确认 dependencymanifest、lockfile、设置和用户后续编辑恢复/保留。安装不启动 hostservice，不 applyhost patch，不 test 模型或 preset 下拉。

这与完整桌面 UI 验收不同：directory 变化为人工重建，未运行 host 自动升级器；未验证报告者的具体客户端、市场点击、presetrestart 消失。HTTP errorregression 使用 real 本机 HTTP service 和 real 前端解析器，响应为构造诊断数据，不对正式 DSH 调用 applyinterface。

## 向报告者收集

无需 uninstallreinstall。先核对运行中的插件版本及 DSH 发行名称/版本、操作系统和架构；若升级后仍 failure，提供本次详细 error 中的 reason/code/恢复结果，path 可脱敏。不要索取 prompt、完整配置、密钥或 environment variable。presetrestart 消失 keepstandalone 待确认，不仅凭总 error 归因为用户没点“apply”。
