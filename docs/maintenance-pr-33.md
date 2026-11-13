# PR #33：嵌套 host 定位与 self-check 统计

支持两种布局：组件直接位于 `@deepseek-ai/`，或位于 `@deepseek-ai/dsh/node_modules/@deepseek-ai/`。用户可指定外层 scope、`dsh` 包 directory 或组件根。

## 入口与组件分开解析

- `currentHost()` 保留安装 instance 根的历史语义；不能为了 read 组件版本而改变安装器用来找 CLI 的根。
- `normalizeHostBase()` 只探测选定 directory 及两种 pinned 的子 path，不扫描 PATH、全局 npm、其他 Desktop 或用户 directory。
- self-check 对显式 path、`DSH_BASE`、`PURGE_DSH_CLI` 和运行 argv 使用同一组件解析。
- 安装 CLI 支持外层 scope、包 directory 和该包的嵌套组件根；检查包名和 bin path，不能任意向上搜索。
- 裸 CLI 未提供 instance 信息时保留未知。请指定 `DSH_BASE` 或 `PURGE_DSH_CLI`，不能将别的安装的结果算到当前 instance。

## 统计口径

self-check 按原始补丁 entry 计数；panel 有合并显示组，因此两者的数字不保证相同。不能为了让数字相同而隐藏故障。

- `applied` / `already`：已确认完成。
- `na`、`off`：明确不适用或已关闭；不进入适用 entry 分母。
- `skipped`：仅 `settleWhenAbsent` 明确表示不需要 migration 时 exclude；其余 skip 仍保留诊断。
- `missing_file`：只有元数据标记为可选时才 exclude；必需目标缺失仍占分母并告警，包括未归入已有命名层的 entry。
- 未知 state 和 read failed 不能折算成 success。

所有判 read 只影响诊断。host patch 表、prompt 策略、工具 register、用户 permissions 及更新偏好不改动。

## 验证

新增 regression 先在原 PR 上复现 CLI 定位 failure、必需 file 缺失却显示全部完成，再验证 repair。覆盖三种 path、argv/CLI 入口、多安装共存、errorpath、限定探测范围、realself-check 计数、未知和 skipstate。

Windows 实机使用新的隔离 directory 与 profile，通过 real DSH CLI 执行发行版安装、candidate 升级、backuprollback、重新升级，以及安装后验证 failure 的恢复。使用 real Electron/Cordis verify the plugin entry、命令、工具、prompt section 与路由 register 和 release。隔离 test 不启动或 restart 用户 DSH，不修改代理。

candidatetest 包使用 `1.6.30-pr33.1` 标识，仅用于隔离验收，不是正式发行。正式 repair 随 1.6.30 发布，PR #33 已合并。


实测结果：macOS 全量 test 205 项（200 通过、5 项平台 skip），Windows 11 / Node 22.23.2 全量 test 205 项（201 通过、4 项平台 skip）；Electron 44.7.0 通过。官方 npm `@deepseek-ai/dsh@0.2.1-rc.2` 的 real 嵌套安装完成三种根 directory 下的安装、rollback 及 failure 恢复。npm 版 DSH 需要可执行的 pnpm；test 仅向 testprocess PATH 添加隔离工具 directory，不修改系统 PATH。

可复现的 real CLI test 入口为 `scripts/verify-rollback-runtime.mjs <baseline.tgz> <candidate.tgz>`。先用目标 DSH CLI 初始化一个新的空 profile，然后提供 `PURGE_TEST_HOME` / `PURGE_TEST_PROFILE` 和 `PURGE_DSH_CLI`。验证嵌套布局时，以 `PURGE_TEST_HOST_BASE` 指向隔离 npm 安装的外层 `@deepseek-ai` directory，并 cancel `PURGE_DSH_CLI`，脚本会分别用外层、包根及组件根执行 maintenance。不要指定日常使用的 home/profile。
