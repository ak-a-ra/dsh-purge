# interjectiondelivery 与升级验收（1.6.27）

## 这次修了什么

DSH 的 `next-step` 表示当前轮下一步消费；`next-turn` 表示后续轮次。interjection 不会中断已经发出的模型请求，而是在下一步边界被消费。

上游 1.1.69 改了公共 `steer()`，1.1.71 只恢复底层而仍将 UI queueinterjection 改为 followup（上游 #121）。本 fork 1.6.26 恢复 UI 分支，但新增的 degraded 逻辑把两种 stateconflate 一谈：message 已经在 next-step，或者 agent 不再 running。两者都被删除并重新追加到 next-turn。

因此：首次 interjectionsuccess 后，重复请求会撤回该 delivery；空闲 queue [a,b] 对 a interjection 会变成 [b,a]。前端 dependency 过期请求无操作收敛，且可能使用尚未更新的 queue 投影，因此不能把这些情况统一 convert 成 followup。

1.6.27 只恢复原生守卫、prompt(mode) 分流、queue case 和公共 steer。重复/过期请求 native error codes are preserved 与前端处理，message 不被重建或重排。原生中止 turn 后的发送处理保留。waiting 回答、其他补丁及用户 prompt 不在本次改动范围。

## 精确 migration 与 state

#90 覆盖 controller 和 agent-loop：

- 原生 file：确认完整所需分支后视为已完成，不 write。
- 旧 #85、queue #86、1.1.69 公共 steer、1.1.71 恢复注释、1.6.26 #90：只逆向替换已识别片段。
- 旧版本混合残留：必须整份目标 file 可以确认恢复，才 write。
- 不认识的 rewrite：不部分 write，strictFiles 报 pattern_not_found；diagnose first; do not overwrite user content。

migration 后的 file 带无行为的 #90 注释，避免通用 host 升级检测把已恢复的 file 误当新原件、覆盖已有 backup。重复 apply 不追加内容。插件 rollback 与 host 还原是不同动作；使用现有 backup 流程，核对目标与 hash，保留 user's later modifications 设置。不要用整份旧 profile 覆盖当前配置。

## test

- `test/steer-migration.test.mjs`：原生、1.1.69、1.1.71、旧 fork、1.6.26、混合 state；LF/CRLF、重复 apply、未知 rewrite。
- `test/steering-runtime.test.mjs`：执行 DSH 0.2.1-rc.2 实际 controller、inbox、send 与 UI steerQueue 方法；in-memory service 和投影用于 simulate 重复 hotkey、延迟刷新、turn state transition、already claimed、FIFO、edit and delete。
- `test/steering-files.test.mjs`：在临时 hostdirectory 进行实际 backup、write、再次 apply 与还原；用户配置 sentinelkeep 不变。

旧实现作为负对照，必须能复现故障；新实现必须通过相同场景。fixtures contain only public host methods，no personal sessions, addresses, prompts, or tokens。source and file SHA256 are recorded in the fixture。

可用 `PURGE_TEST_HOST=/path/to/node_modules/@deepseek-ai node --test test/steering-runtime.test.mjs` read-only load of local methods，run after in-memory migration。does not launch or restart DSH，也 does not call the model。这是 function- and protocol-level runtime test，not passed off as full desktop/model acceptance。

## confirmation checklist for #25

the reporter needs to provide 系统、DSH 版本、插件版本，confirm whether it has been applied after install and manually reopened。distinguish input-box direct interjection, queue button, empty-input hotkey；state single or consecutive operations，whether the agent is still generating。若 single operation still fails，需要 shortest normal-task reproduction steps 或 sanitized error codes，the whole configuration/logs are not needed。

this version fixes the confirmed regression；before the reporter provides the above information，do not mark all possible causes of #25 as resolved。
