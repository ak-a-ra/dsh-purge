# #38：默认 preset 的诊断 state

## 根因

1.6.30 的统计 tighten 是为了避免必需 file 缺失却显示 success，但漏测了自带默认 preset 的实际 state。#76 没有匹配目标时，核心 state 仍是 skipped；旧统计忽略可选项，新统计将其判为 broken。

## repair 边界

不向 #76 添加宽泛的 settleWhenAbsent，不改变 core 的检查或 write 逻辑。只在 selfCheck 内细化 #76 的 skipped：read 明确 DSH_HOME 下的 .agent-presets/unrestricted/agent.cordis.yml，通过 YAML AST 检查单一 persona 的字面 prefix。不执行 !!js，不解析别名或从其他 home 补 read。

- body 不含该项目标句：not_needed，仅从 self-check 必需分母 exclude，保留说明。
- body 仍有目标句但当前锚点不匹配：keep skipped/broken。
- 无法 read、结构 anomaly、动态或 inherit 配置：unknown，不声称已完成，不建议通过反复 apply 或修改 permissions 来消除。
- pending/applied/na 与其他补丁 state 不变。不要推广为所有 optional/skipped 都算 success。

因此核心 status/diagnose 与 selfcheck 的原始 state 可能不同；selfcheck 多了 read-only 静态 evidence，not_needed 不是一次 successapply。

## test 与 maintenance

node --test test/selfcheck.test.mjs 覆盖 real 默认 preset、实际 patchStatus、selfCheck 汇总及 anomaly 边界。源码与 release package 均 test。安装 path 和 backup/rollback 实现未变，本版无用户配置 migration；rollback 旧版本会恢复旧误报，但不需要恢复或覆盖用户 presetfile。

实机验证：macOS 207/212 通过、5 项平台 skip；Windows 209/212 通过、3 项平台 skip（实际 TLS 与 Electron 交接均运行）。两端 Electron 44.7.0 与 release package smoke 通过。test 脚本的 ASAR file 需在 Electron testchild processquit 后删除，Windows 的 npm.cmd 通过 pinned 命令启动；这些均不修改实际安装器或 host。三平台 CI 新增打包检查作为后续发布门禁。
