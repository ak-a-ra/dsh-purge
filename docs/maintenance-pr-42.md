# PR #42：Linux 安装与 uninstall 边界

此变更增加 Linux CLI/Web 安装入口，未更改补丁表、prompt、permissions 选择或用户设置，也不会自动 apply patches 或 restarthost。

## 审查发现与 repair

- **uninstallfollowsymlink**：cleanup 列表曾对 link 再次执行 realpath，绕过外部 directory 保护。现在按 link 原 path 删除 link（含失效 link 和 Windows junction），不删除外部源码、共享 dependency 或外部 profile。普通插件 directory 仅在当前 DSH home 内 cleanup。还原或注销 failure 时不执行 cleanup。
- **安装 failure 提前切换入口**：创建用户 host 副本与 activate 入口分离。先校验包、准备副本并运行 migration；只有 migrationsuccess 才 atomic 切换 `~/.local/bin/dsh`。failure 时原入口 keep as-is；首次安装 failure 不会留下新入口。未 activate 的完整副本保留，供 retry 复用，不自动删除可能被其他 process 使用的副本。
- **并发修改**：migration 期间若入口被用户替换，stopactivate 并明确 error，不覆盖用户命令。此时插件 migration 可能已 success，但 startup entry 没有切换，应检查当前入口后 retry，不应把 error 当作全部 rollbacksuccess。
- **path 别名**：test 和用户副本定位都按 realpath 处理，兼容 macOS 的 `/var` 别名及 Linux 的 symlink home。

## 验证范围

`npm test` 包含实际 file 系统 link/uninstalltest 与 unpack 后 migrationchild process 的 success、failuretest，覆盖原有入口不变、首次安装不 activate、设置字节不变、并发入口冲突、复制 failurecleanup、无关 file 保留，以及原有诊断和功能 regression。Linux read-onlydirectorytest 必须在非 root Linux 用户下执行；Windows 用 junction 验证 uninstall 边界，不能把平台 skip 算作通过。

GitHub 三平台 installer 矩阵执行完整 test 和打包 smoke；Windows 另有两种 PowerShell 与 real Electron 交接 test，macOS 有 real Electron 诊断 test。Linux shell 入口和下载包装 test 包含隔离替身，并不等价于 loginreal 模型完成任务；`linux-runtime` 作业另外安装官方 `@deepseek-ai/dsh@0.2.1-rc.2`，将隔离副本设为 read-only，实际运行 bootstrap、用户副本 CLI、插件 import、backup/rollback 和 failure 恢复。它不启动模型 service，也不等价于完整图形 UI 或模型能力验收。

maintenance 时不要改用户全局 npm 源、代理、permissions、prompt 或启动中的 service。准备副本不需要 sudo；系统 directory 始终 keep 原状。
