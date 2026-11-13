# 1.6.48：自定义 body 保护与安装别名

## #72：bodyownership 不能靠关键词猜测

旧版只要 body 同时含三个模板标记，就会认为它是插件默认值，甚至忽略 `customized: true`。保存可以 success，但后续启动同步或 apply 可能把自定义内容换成默认值。

本版统一启动同步、apply 及默认安装 path 的判断：

- 明确保存的自定义内容保留；保留模板标记不改变 ownership。
- 无 state 记录、statecorrupt 或手工编辑后无法确认来源的非空 body 保留。
- 当前默认值，以及 `customized: false` 且 body 指纹精确匹配记录的旧默认值，仍按原逻辑更新。
- readbody 出错时 stopwrite 并返回 error，不将 error 当作空 file。
- 「恢复默认」仍是显式操作，不更改 injection 位置、强化段、host patch 或现有开关。

旧版本已覆盖掉的 body 不能自动推导恢复。先查看用户自己保存的稿件或本机 backup，仅恢复确认过的 body，不恢复整份配置覆盖后续改动。不要要求用户在公开 issue 上传私人 prompt。无法确认来源的旧默认会保留；确实想使用新默认时由用户显式选择恢复默认。

## #74：dependency 名与包身份分开核对

支持 `node_modules/dsh-purge-community`，以及实际 `package.json.name` 为 `dsh-purge-community` 的 `node_modules/dsh-purge` 别名。仅检查当前明确选定的 profile，prefer 其启用 bundle；不拿运行 process 的旧版本代替 disk 版本，不扫描其他 apply 或全局安装。

包缺失、身份/版本不符、不可 read、多个不同的启用副本仍然 error。两个不同副本都未明确选中时也 keep 歧义。真正的上游 `dsh-purge` 不冒充社区版。自定义第三种 dependency 名不在本次自动 migration 支持范围内，不能通过删除 dependency 或伪造版本消除 error。

YAML 解析器从已验证包的 real 物理 path 解析，覆盖 pnpm 隔离 dependency 布局。backup 同时记录 dependency 名和实际包名；rollback 使用原 dependency 名安装并恢复对应 bundle 和 known 配置 reference，保留 prompt、其他设置及 backup 后用户新增内容。旧 backup 格式继续可 read。

旧版有 `reconciliationError` 时会 stop 自动安装，所以不能只 waiting 它自行升级。使用新版 standalone 安装器原地升级，无需 uninstall、删 lockfile 或清空 state file。安装后由用户安排手动 restart；当前 process 仍是旧代码。rollback 到 1.6.47 或更早版本也会带回旧版 body 判断缺陷，rollback 完成时保留 file 不等于旧版 reload 后仍有新保护。

## 验证方法与边界

- `test/prompt-preservation.test.mjs`：保存、启动同步、apply、旧默认 migration、state 缺失/corrupt、手工编辑、显式恢复默认、read failed。
- `test/installed-package.test.mjs`：标准名/别名、pnpm 物理 path 解析、多个副本、选中入口缺失、包身份 error 与别名 backup。
- `scripts/check-alias-install-runtime.mjs`：使用显式 Mac CLI 专用副本或未运行的 Windows test 副本与全新 home，real DSH CLI/pnpm 安装两种名称，执行自动升级、手动 snapshotrollback、重新升级、安装 failure 恢复、rollbackfailure 恢复并逐字节核对用户数据。Mac inherit 系统 writesandbox，禁止 write 正式 apply 和用户 DSH 数据。
- CI 的 `scripts/check-npm-alias-runtime.mjs` 在 standalone 官方 npm host 上复用同一场景，不使用生产 profile。

这些 test 不启动桌面 apply、不自动 applyhost patch、does not call the model，不把安装通过表述为所有模型行为已验证。

## 发布前实际记录

Mac 与 Windows 11 4090 的隔离副本均使用 Electron 44.7.0 / Node 24.21.0，以官方 DSH CLI/pnpm 完成 1.6.47 → 1.6.48，两种安装名均通过升级、rollback、再次升级、安装 failure 恢复、rollbackfailure 恢复和 body 逐字节保留。Windows 访问 npm 官方源遇到连接重置和 timeout，随后使用已有 dependencycache 完成 real 安装；这不代表该机器的在线下载链路已经恢复，未修改代理。

本地完整 regression 360 项：348 通过，12 项仅适用于其他平台而 skip，0 failure；UI、文档、客户端构建一致性与打包 smoke 均通过。云端另跑三平台安装器和官方 npm hosttest，最终 state 以 PR #75 检查记录为准。
