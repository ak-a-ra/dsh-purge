# PR #58–#61：可靠性 repair 与保留范围

## 原 PR keep 开放

本版采用 standalonerepair 提交，不关闭原 PR，也不宣称四个提案已完整实现。

| PR | 本次处理 | 未采用的部分 |
| --- | --- | --- |
| #58 | keep 原实现 | prompt 排序调整未合入 |
| #59 | tighten 旧标记识别，保护普通 body、reference 和代码示例 | 大小 write 不敏感的扩大匹配未合入 |
| #60 | cancel 向上游传播；仅记录传输完成、failure 和 cancel | 扩大拒绝检测与修改 retry 文案未合入 |
| #61 | 统一设置审计；纠正 retry 生效说明 | 新 inject CLI write 入口未合入；rewind 仍需 UIreload |

审查发现：#58 的默认强化段也会受排序变化影响，不能仅靠复制 host 常量的 test 证明兼容；#59 的非锚定匹配会命中 body；#60 的新增词条会命中正常技术讨论；#61 对 rewind 即时生效的说明与前端 cache 不符。保留原 PR，方便针对这些未解决项继续讨论。

感谢 loLollipop 的提案和问题线索。本次不修改现有检测模式、retryprompt、默认开关或 host patch 表。

## 可复现的问题

在隔离的 1.6.41 源码副本中，普通句子中出现旧标记会截断后续文字；消费者 cancel 普通 output 时，上游生成器 finally 不执行；直接 write 设置不会生成审计 entry。相同输入在新 regression 中要求 body 完整、上游关闭、实际设置变化仅记一次。

旧分段行为仍以结构性标记为界；本次保护的是非结构性 body 和示例，并不声称可以自动理解任意用户文档。标记仍需是代码围栏外、无缩进且 exclusive 整行的旧版大 write 文本。

## state 和日志语义

- `tuning_setting` 仅记录 known 开关及枚举的有效变化；无效类型显示 `invalid`，不把任意字符串或对象复制到审计。未知字段原样保存在配置中。
- writefailure 不会生成 success 记录。审计自身 failure 沿用原有警告，不改变设置保存和 output 流的结果。
- `refusal_retry_outcome` 在源流结束后记录传输类型，不能当成回答正确、任务 success 或模型行为的判据。
- `text`、`tool_call`、`reasoning_only`、`empty` 区分 output 形态；`error`、`cancelled` 区分 anomaly 和消费者 cancel。晚到 error 不提前记录为 success。
- 新流诊断不记录 body、推理内容、工具参数、error 原文或 URL。
- retry 在下一请求 read 设置；rewind 前端可见性 cache 仍要求 reload。插件不会自动 restart。

## 验证方式

`test/review-integrity.test.mjs` 覆盖普通技术回答的逐块保留、不额外发起请求、普通 body/reference/代码围栏保护、消费者 cancel、晚到 error、同步创建 error、工具调用流、纯推理流、无 output、审计 failure、real CLI child process、重复保存、writefailure 以及未知配置保留。

其中 HTTP 用例实际启动仅监听 127.0.0.1 的 service 器，消费首块后 cancel，assertservice 端连接关闭。test 不请求外部模型、不触碰用户 profile。

全套 regression 与三平台安装/rollback 工作流继续运行。自动化流 test 不是实际模型质量评测；npm host 安装验收也不等同于三平台全部 UI 功能验收。
