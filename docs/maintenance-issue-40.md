# #40：桌面 archive 入口与 disk 诊断目标不一致

## 已复现的根因

1.6.31 的 panelstate 经 `gatherState → findAiBase` 查找实际 directory，self-check 经
`currentHost → normalizeHostBase` 从当前启动脚本定位。Electron 从
`Resources/app.asar/dsh/.../dsh-desktop-host/lib/index.js` 启动时，后者得到 archive 内根。
补丁检查器的 `isFile` 明确 exclude `.asar/` 内 path，因而把其中的必需目标报告为
`missing_file`，即使同一安装的 `Resources/app/dsh/...` 已有对应 file。

real Electron 44.7.0 的临时 archive 已复现：同一 testfile，实际 directory 为 `applied`，
archivepath 为 `missing_file`。这证明代码缺陷存在，不代表仅凭报告者的截图已确认其
每一个红项的原因。#40 仍需补充 DSH 版本、启动方式、目标 path 及布局详情。

## 1.6.32 的处理

- 新增 read-only `diagnosticHost`，供 panel status、self-check、diagnose 和 CLI diagnose 共用。
- 只将已选定安装的 archive 入口解析为同一 Resources 下的实际 directory：prefer `app`，
 其次 `app.asar.unpacked`。已有但不完整/不可 read 的 preferdirectory 不切换到更健康的 directory。
- 显式实际 pathkeep 原目标；没有启动或显式 instanceevidence 时返回未知，不扫描其他安装。
- `currentHost`、安装、apply、补丁表、migration、prompt 与 permissions 逻辑 keep 不变。
- 原始补丁明细与分层 self-check 使用同一 disk 目标；panel 合并显示组与原始 entry 计数仍不同，
 #76 的 read-onlypreset 适用性判断也仍保留，不能强行让两个数字相等。
- `app.asar` 仍存在时继续报告布局问题；缺失 file、failure、未知以及 permissions 不匹配均不隐藏。
 disk 已 apply 不证明当前 processload 了修改。

## 验证

`npm run test:electron` 新增 real ASAR 场景，并通过 Cordis register 的实际
status/selfcheck/diagnose HTTP handler 验证目标一致。使用中性的诊断 fixture，does not call the model。
同时检查真正缺失项、sealedarchive 和主动配置的 permissions 差异仍 error，临时 prompt/profile 字节不变。
`test/instance.test.mjs` 覆盖两种物理 directory、部分 directory、未 unpack、permissions 拒绝、
显式目标和无 instanceevidence。原有默认 preset、未知/failureprefer 级和 npm 嵌套 directorytest 继续执行。

CI 在 macOS 与 Windows 运行 real Electron 诊断；三个平台继续执行安装器与打包 test。
real 桌面 UI、报告者的 macOS 15 安装和当前 processloadstate 不由这些 test 代替。

## 排查与 rollback 边界

先收集 DSH 精确版本、安装/启动方式以及是否刚更新过 DSH，核对 status.ai_base、
selfcheck.host、host-status 的 disk/process 字段和 errorentry。分享前脱敏用户名、
私人 directory 名；不要上传 prompt、凭证、全量配置或整个 backup。

不要仅为消红改 permissions、删除 archive 或重新 apply 全部补丁。需要用户 full quit 时先说明原因，
不能自动 restart。此 repair 不 migration 用户数据；rollback 插件包会恢复旧诊断行为，不应恢复旧用户设置。

Windows CI 的全套 Node testpinned `--test-concurrency=2`，避免多个 testfile 同时启动
PowerShell 时的冷启动争用。曾在 GitHub runner 复现 12 秒 statewaitingtimeout、另一
PowerShell 用例耗时约 26 秒；相同源码在 4090 全套通过。仅限制 test 并发，test 列表、
assert、生产助手 timeout 与 failure 检查 keep 不变。

## 1.6.35：报告者补充后的 standalone 根因与处理

报告者已补充 macOS 15.7.4、官方 Desktop 0.2.1-rc.2 nightly、standalone Homebrew CLI 及现场 diskevidence。1.6.32 的目标分裂已消失；剩余 archive 仍是官方原件不是假红。macOS 的 HTTP apply 当时没有像 Windows 一样安排 waitingquit 助手，所以“提示 restart”不能保证 repack 发生。

现在 macOS apply 安排 standalone CJS 助手，在 apply 外临时 directory 运行，使用 realdisk fs，waiting 所选 `.app/Contents` 内所有 processquit（exclude 助手自身）。backup 采用同 file 系统 exclusive 硬 link 并核对 inode、设备和 SHA-256，再移除原入口；从不覆盖已有 backup。waiting 时校验 archive 身份，quit 后重新校验主入口和 known runtime link。没有 writepermissions、lock 冲突、archive 更新或 unpack 不完整均 stop 并保留原件，不自动提权。

- `handoff`：`not_scheduled`、`starting/ready/waiting_for_quit/moving`、`complete`、`failed/expired/helper_stopped/unreadable` 等。waiting 最长 30 分钟；未知旧 lock 不抢占。旧完成记录遇到新 archive 返回 `archive_reappeared`；backup 消失返回 `backup_missing`。
- `disk` 与 `process` 仍 standalone：repack 完成不证明下一次运行的代码 loaded；standalone CLI 的 process/permissions 未知仍保留。
- Desktop shell path 从显式目标的 Resources 解析，终端本身是 Web/Node 不再造成 #83 假缺失；目标 file 真缺失时不寻找另一份安装替代。
- #71 的家族检测限定当前 DSH_HOME：本地 preset、各 profile 实际包、fallback 包和 dependency 声明。没有家族才 na；安装残缺仍 missing，YAML corrupt 仍 unmatched，read 或解析 dependency 不足仍 unknown。不改补丁表或原有处理功能。

### 用户操作与脱敏诊断

先升级插件；在桌面 panel 点"Apply"，看到“waitingfull quit”再 **⌘Q**。助手不自动打开 DSH。可在终端使用已核对的同一安装 path 检查：

```sh
PURGE_DSH_CLI='/实际安装/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop
PURGE_DSH_CLI='/实际安装/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community selfcheck --json --profile desktop
```

不需要为 shell 诊断额外设置 DSH_SURFACE；不要把示例 path 当 realpath。没有明确目标的裸 CLI 继续报 unknown，是正确边界。`handoff.phase=complete` 后手动打开并在 panel 重测。反馈只需插件/DSH/macOS 版本、handoff.phase/detail、disk/process 和剩余红项，path 可脱敏，不发 prompt/密钥/完整配置。

### failure 与 rollback

1. 未完成时原 archive 通常仍在。先检查 phase/detail、是否仍有同安装 process、unpack 入口/runtime 和当前 directorywritepermissions；不要直接删 lock/archive 或全局改 permissions。助手 failed/expired 后，原问题解决再由用户重新 apply；未知旧 lock 需人工确认 ownership。
2. 完成后如下一次打开 anomaly，先由用户 full quit。核对 state 记录中的 **同一安装** backup path 和 archive_sha256；原 app.asar 必须不存在，backup 必须存在且 hash 吻合，再恢复 backup 至 app.asar。若已有新 archive，不覆盖它；先诊断版本冲突。after recovery 仍由用户手动打开。
3. 插件包 rollback 使用既有 snapshot 流程；不回 write 旧 prompt、profile、permissions 或图库数据。hostarchive 恢复与插件 rollback 分开执行。

### 新增实际验证

`test/macos-handoff.test.mjs` 运行 realstandaloneprocess，覆盖手动 quitwaiting、重复请求、backup、archive 更新、坏入口/runtime、timeout、坏记录、旧 lock、启动 failure 及旧完成记录失效。
`scripts/check-macos-handoff.mjs` 使用 standalone **Electron.app 44.7.0** 副本实际从 ASAR 启动，apply 后由 testapply 自行 quit，确认助手存活、backuphash 及未自动 reopen，再显式二次启动确认入口为 `Resources/app`；隔离设置 hash 不变。
这不等于验证了报告者那一份签名、permissions 与 nightly 构建，仍需他按上述步骤回报。Windows 原助手代码未改，继续运行 Windows Electron 和完整安装/rollbacktest。
