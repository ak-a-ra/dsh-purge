# 更新 state 残留与待 restart 判断（1.6.41）

## 根因

旧调度器只在 `pendingVersion === runningVersion` 时 cleanup 待 restart 记录。自动安装 1.6.33 后直接升级到 1.6.40，会永久留下 1.6.33；同一条旧记录还会阻止后续自动安装。一次元数据检查 success 也曾在 `hasUpdate=false` 时隐藏安装 failure 提示。

## 现在的 evidence

- 运行版本：module 首次 load 时 pinned，process 运行期间不随 diskrepack 而变化。
- disk 版本：从当前 profile 的逻辑 `node_modules/dsh-purge-community/package.json` read；不把 pnpm 旧 store 中的包当成当前安装，不借用其他 profile。
- 两者相同：清除旧 `pendingVersion/restartRequired`；保留 `lastPendingVersion`、`pendingResolution`、安装时间及 failure 目标记录。即使 load 的是 rollback 后的低版本，也能解除已过时的 waitingstate。
- 两者不同：显示实际 disk 版本和运行版本，继续 waiting 手动 restart。升级和 rollback 均适用。仅同一待 load 版本的多 profile 部分 failure 可走既有 repairretrypath；不会因此覆盖另一次手动 rollback。
- 版本未知、包身份 error、file 缺失或不可 read：明确显示 state 核对 error，暂 stop 自动安装。不得当作“已恢复”或隐藏旧记录。
- 安装 failure 与检查 failure 分开保留；网络检查 success、没有新版或 restart 本身，都不能证明 failure 目标已 repair。success 的安装 retry 才清除安装 error。

启动和自动检查 migrationstate；maintenance 页 GET 只返回相同 rule 算出的视图，不 write 设置或安装。自动检查/安装开关、检查间隔、prompt、rule、permissions 和其他插件不变。不自动 apply patches 或 restart。

## 已被旧版卡住的用户

旧 process 无法自行获得新调度器。先使用 maintenance 页手动安装正式版 1.6.41（或 standalone 安装器）；不要反复切换更新开关，不要删除整个 statedirectory。安装后仍需用户自行 quit 并重新打开 DSH 一次。旧记录在新版本 load 后自动核对处理。rollback 时原有自动更新开关不变；如需长期 stop 留旧版，使用已有的版本 lock 定选项。

## regression 入口

- `test/update-status.test.mjs`：跨版本、待 restart、rollback、read failed、安装 failure 和并发手动 repack。
- `test/update-policy.test.mjs` / `test/update-recovery.test.mjs`：standalone 开关、retry、多 profile 部分 failure 与 failure 恢复。
- panel maintenance test：运行/disk 版本提示、未知 state、网络与安装 error 同时显示；不 trigger 安装或 restart。
- `scripts/verify-rollback-runtime.mjs`：通过 real DSH CLI 安装包、rollback、重新升级和 injectionfailure 恢复；保留 loadedmodule，同时核对 pnpm 逻辑安装 path 及运行版本。

验收仅使用临时 profile。不要为了验证修改用户的 update-preferences.json、prompt、代理或启动/quit 用户的 DSH。
