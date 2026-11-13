# 1.6.65 maintenance record：#18/#19 开关

## 为什么不默认开

两条补丁都 cancel 上下文保护而非门禁：

| 补丁 | 作用 | 收益 | 代价 |
|---|---|---|---|
| #18 REPEAT_TOOL_REMINDER_DISABLED | 关掉重复调用提醒 | 工具循环 prompt 更干净 | 模型可能在同处反复试错 |
| #19 TOOL_RESULT_PRUNER_DISABLED | 关掉 8192 字符工具结果修剪 | 模型能看到完整 output | 工具 output 长期占上下文，更快触顶/更贵 |

## state 语义

- `disabled`：未在 `tuning.extraPatches` 中列出；`patchStatusReady("disabled") === true`（这是选择，不是故障）。
- self-check `tallyPatchStatus.disabled` 计入 `not_applicable`，不进入必需分母。
- `patchDrift` skip disabled，不报漂移。
- apply 汇总：`disabled` 在 `ALWAYS_SOFT_STATUSES` 里算软通过，不进入 `failed`，panel 不再把「按选择关闭」渲染成红字；`write_failed`、锚点不中等真 failure 照旧计入。

## 验收

- `test/opt-in-patches.test.mjs`：默认拒绝 write、显式开启后 write 并翻转 state、tuning 去重过滤；并 assert apply 汇总里 disabled 是软通过、`write_failed` 等真 failure 仍进 `failed`。
- 真机流程：`patches enable 19` → 对隔离 rc.5 树 apply → state applied；`patches disable 19` → state disabled。
