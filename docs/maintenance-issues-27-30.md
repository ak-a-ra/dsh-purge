# 更新 integrity 与诊断审查（#27–#30）

本次改动只涉及更新、backuprollback、版本比较和诊断。没有修改 prompt 过滤策略、permissions 设置、工具表或用户配置，也不自动 applyhost patch、quit 或 restart DSH。

## #28：逐 profile 检查与 retry

旧逻辑把任意安装 success 视为已安装，并按当前插件副本的版本检查更新。两个 profile 部分 success 后，failure 的副本可能被遗漏。

新逻辑逐一 read 各 profile 的 `node_modules/dsh-purge-community/package.json`。共享同一个包 directory 的 profile 也分别处理，因为 manifest 与 link 各自 standalone。缺失或不可 read 的包显示为待 repair，不视为最新。

- `ok` 表示全部目标 success；`applied` 仅表示本次确实改动了至少一个目标。
- 部分 failure 保留 `hasUpdate` 和各目标 error，不提交全局版本 pin，不 write 自动更新完成保护标记。
- 下次自动检查仍遵守用户的检查、安装开关及版本 lock 定；仅在确认 disk 存在版本分裂时允许越过“waitingrestart”保护，补装 failure 目标。
- 已达到目标版本的 profile 不重复安装。自动更新不 degraded 较新的副本；用户显式选择历史版本仍可回退。
- 安装前 backup，failure 按目标 rollback，安装后核对实际包版本。不会把发行版本直接冒充为运行中版本。
- 手动切换到历史 lock 定版本部分 failure 时，继续显示 failure，需 retry 该明确版本；不擅自改变原 pin 或转为自动更新。

## #29：旧 ZIP 通道的校验

正式版 TGZ 通道原已有 SHA256SUMS 校验。本次补的是上游源码 ZIP path：

1. 通过 GitHub API 将用户选定的分支／标签解析成完整 commit SHA。
2. read 该 commit 的完整 Git tree；截断、未知 file 类型或非法 path 直接 failure。
3. 只下载 pinned SHA 的 codeload ZIP，不再在下载过程中追随移动分支。
4. 使用有大小限制的 Node unpack 器，只生成普通 file／directory，不创建 archive 内的 symlink。
5. 对全部 file 按 Git blob 格式计算对象摘要，与该提交的 tree 比对；多 file、少 file、改内容均 failure。全部通过后才 write 安装 directory。
6. 记录实际验证的提交，不在安装后另查一次可能已经移动的分支。

这证明“下载内容与 GitHub API 所指提交一致”，不是发行商签名或对上游代码安全性的 authentication。其信任来源仍是 GitHub HTTPS/API；API 不可用、限流或 manifest 不完整时 keepfailure，不 degraded 为不校验安装。用户设置、原安装和 backup 保留。

## PR #27 审查与补充

保留贡献者的诊断、版本比较、state stamp、短暂 in useretry 与 rollbackrepair，并补齐：

- statereadthrow 或返回不完整记录时为 unknown，不能显示全绿。显式 `missing_file`/`na` 仍与“没有返回 state”区分。
- SemVer 忽略 build metadata；pre-release 数字段按整数比较，支持超出 Number 精确范围的数字。
- rollback 时保留未纳入 backup 的 `node_modules` 与 `.git`；任一搬回 failure 则 revocation 这次 rollback 并 error，不能只留下 retired directory 却宣称 success。
- 普通 filesnapshot 复制保留 rwx permissions，防止 rollback 后丢失 CLI execute bit。
- 新安装 failure 产生的半安装 directory 移到隔离位置保留诊断 evidence；原先已存在的 directory 不擅自删除。安装器 error 依然保留 snapshot ID。

边界：包管理器 failure 后的整个 dependency graph／lockfile 自动恢复不是这次新增的 transaction 保证。现有 snapshotrollback 能力保留；不得把仅恢复 manifest 的 failurepath 称为完整 dependency graphrollback。

## #30：普通任务能力调查

目前不能确认“模型智力下降”，也没有 evidence 支持“必然打断思考”或“只能拆任务／stop 用插件”的结论。

隔离普通任务观察（does not call the model、不操作用户安装）：

| 项目 | 观察 |
| --- | --- |
| 项目 rule 与记忆以 system section 承载 | 启用对应过滤策略时会被移除；关闭对应过滤时保留 |
| 工具说明、skill catalog、普通用户任务 fixture | 两组均保留 |
| 提问默认 waiting、显式 60 秒 | 当前代码分别保留 120 秒、60 秒；已不再 pinned 1 秒 |
| 显式无限 waiting | 仍与原生不同：当前收为 300 秒 |
| interjection | 已有 real 方法体 regression test；不能据此证明报告者安装已经 apply 并 load 了新代码 |

**承载位置很重要**：上述 rule 丢失只证明特定 system section 的行为，不等于所有工作区 rule 都丢失。DSH rc.2 的 message 型 `agent-instructions` 与 system section 是不同通路。用户版本、策略、实际输入和 hostloadstate 需要分别核对。

后续模型级对照应 pinned DSH/模型版本、推理等级、工具和普通任务仓库；使用干净原生副本和插件副本，交错重复至少三次，记录完成率、约束 follow、重复工具调用、耗时及 token。只关闭插件不是干净基线，因为 hostdisk 修改仍可能存在。

the reporter needs to provide：DSH 和插件版本、一个可公开的普通任务、预期结果与实际 error、更新后是否手动 apply 并 reopen。不要索取私人 prompt、完整配置、token 或整份 chat 记录。获得可复现样本前 keep 调查 state，不承诺此次 maintenancerepair 会改善模型 output 质量。
