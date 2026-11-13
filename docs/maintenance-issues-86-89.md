# #86 / #87 repair 与 #89 复现边界

## 1.6.60 的范围

- #86：1.6.58–1.6.59 在目标 file 缺失分支 reference 未声明的 `detail`，导致 apply 中断。只删除这条无效 write；原有 missing_file / na / partial 诊断及补丁内容不变，不把缺 file 算作 success。
- #87 / PR #88：repairprocessanomalyquit 留下的 maintenance lock，并保护并发 maintenance、旧版长任务及安装/rollbackfailure 恢复。
- #89：本次只提供隔离 Windows 实测和诊断记录，**没有修改 repack helper 的启动机制，不宣称 repair #89**。

## lock 与恢复

`maintenance.guard/` 是新版 write 者和 reclamation 者共用的 mutual-exclusion directory。先在唯一临时 directorywrite 完 owner file，再 atomic 发布非空 directory。reclamation 只删除已确认结束的 owner 的唯一 file，然后使用非 recursive rmdir；即使另一个 process 已经取得新 lock，也不会删除它的新 owner file 或把它的 directory 移走。

仍 maintenance `maintenance.lock` 以阻挡旧版本 maintenance 器，兼容裸 PID、pid:nonce、host:pid:nonce 旧记录。新记录包含 hostname、PID、创建时间及唯一 token。只在同机 PID 已消失，或系统 process 启动时间明确晚于 lock 创建时间时 reclamation。**不凭“超过 30 分钟”或“心跳没更新”删除 lock**；旧版长任务本来没有心跳。read failed、cross-machine 器记录、无效 PID/内容、无法取得 process 信息均 preserve the scene 并报告。PID 复用的判定需要 realprocess 启动时间，不能只看 process 名称。

CLI 和 panel 的手动 cleanup 入口也取得相同 maintenance lock，避免 cleanup 正在建立的 backup 对象。

安装/rollback 每个异步步骤结束后、writemanifest 与配置前、cleanup 与 failure 恢复前核对 ownership。losing the lock 或 readlockfailure 时 stop 后续提交，也不把旧 checkpoint auto-recovery 到新 write 者的 file 上；keep the recovery directory。已启动的外部安装器不能靠一次 JavaScript 检查撤回，因此不允许正常活 process 被自动抢 lock。

不建议用户手工删 lock。若 ownership 未知，先确认对应 process、lock 时间、操作记录及是否共享 profile；只收集脱敏 evidence，不索取 prompt、整个 profile 或凭证。

## Windows #89

在 4090 上使用临时 Electron 运行时、临时 holder process 及伪 archive，未启动、stop 或修改正式 DSH：

1. 普通 Electron 启动器 quit：现有助手继续运行，holder quit 后 success 移动 testarchive，backup 内容一致。
2. `scripts/check-windows-job-handoff.ps1`：将隔离 Electron 放进明确设置 `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` 的 Job Object，确认助手也属于该 Job；关闭 test Job 后助手被结束，state 仍为 waiting_for_quit，testarchivekeep as-is。已重建报告中的故障表现。

这证明一种具体的 process 生命周期机制可以造成该症状，**不能证明报告者的 DSH 一定由相同 Job 管理**。仍需确认启动方式（普通桌面/管理器/任务代理）、full quit 方式，以及 quit 前 helper 的父 process 与 Job ownership。不得只因父子关系就 assert Windows 会自动终止所有后代。

该脚本只接受 TEMP 下的隔离 Electron，终止的都是它自己建立的 testprocess。不能对正式 DSH 运行，也不用于自动 repairrepack。复现未满足时会 failure 并保留 evidence。

## 验收

locktest 包括 realchild process 崩溃、real 多 processmutual exclusion，以及受控交错、PID 复用、旧格式、cross-machine/未知 lock、diskwritefailure、readlockfailure。安装/rollbacklosing the locktest 使用隔离 profile 和构造的安装器 failure；完整 CLI/pnpm 安装、migration、rollback 另由 `scripts/check-install-lifecycle-runtime.mjs` 在隔离副本执行。二者不混称完整桌面 UI 验收，也不 test 模型回复效果。


### 后续的 Job Object 对照复测

报告者补充了 `0x2000`（最后一个 Job 句柄关闭后终止成员 process）的实测值。相同条件下，Windows 11 非管理员 PowerShell 5.1 和 real Electron 运行时可重现 1.6.59 助手被结束。修订的启动器先检查 Job 成员关系，在 Job 内由本机 WMI 提交一次性助手。若系统策略拒绝创建，保留 error 与 broker 日志。助手仍以原包 hash、操作 token 和同 pathhostquit 为 repack 条件。

在 TEMP 中用 Electron 自带的 default_app.asar 做 realarchive 对照。`-ExpectLegacyFailure` 验证旧版助手随 Job 消失且原 archive 完整；默认验证新版助手存活，waiting 单独的 testhostquit，完成 repack 并从 backup 还原相同 SHA256。这项 test 不启动正式桌面窗口。Windows release package 在完整插件上的升级和 rollback 须另外验收。
