# #53：按 preset 隔离 promptinjection

1.6.40 添加 `excludePresets`。默认 `[]`，不改变旧配置行为。

## 配置

backup 当前 profile 的 `cordis.patch.yml`，在已有 `id: dsh-purge`（`name: dsh-purge-community`）entry 的 `config` 中合并：

```yaml
excludePresets: [roleplay, minimal]
```

不要新增重复插件 entry，不要覆盖其他字段。使用 preset ID，忽略大小 write 与首尾空格，精确匹配（`roleplay-extra` 不匹配 `roleplay`）。设回 `[]` 即恢复旧 injection 行为。

运行时 preferread 当前挂载的 preset，其次最新选择事件、投影和 session 头。子 Agent 使用自己的有效 preset；不会通过共享“最近 preset”变量 inherit 其他 session 的 state。已配置 exclude 列表、但 host 没有提供可解析 preset 时，暂 stopinjection 并记录 `assemble.excluded unknown=true`；应检查 host 上下文/reload，而不是无条件 injection。

## 覆盖范围

- 主提示、head/tail/both、能力 protocol、boost、probe、postPrompt；
- assembly 重 write 和 host 兜底；可选 refusalRetry 按请求 sessionId 查询实际 Agent；无法识别 session 时不追加提示；
- cleanup 带 Purge 命名空间的段落；本版本产生的 rewrite 附带内存来源记录，用于恢复自身 rewrite/删除/添加的原生段落；
- 不改用户文本，不猜测删除历史纯文本中的内容。来源记录不持久化、不发送给模型；从旧版遗留的、已失去来源信息的纯文本应重新 assembly，不能承诺从历史 chat 中抹掉。

被 exclude 的 session 保留 assemblyservice 提供的 persona、工作区 rule、工具和变量，不再由 Purge 执行 prompt 身份 rewrite。已安装的全局 host patch、部署配置（例如 `includeHarnessIdentity`）、网络/permissions 设置和历史 chat 仍 keep as-is。此选项不是逐 sessionrevocationpermissions 补丁，也不关闭插件命令、panel 或工具。

## 升级与 rollback

安装包只更新插件。旧 host #87 无参兜底调用需在用户选择的时间 apply 新版补丁，再手动 full quit 并 reopen；本 repair 会把现有调用 migration 为传入当前 Agent，重复 apply 不重复插入。未 migration 时，非空 exclude 列表下的无参兜底返回空，正常具备上下文的 section/assembly 仍按 preset 处理。

修改前 backup profile；revocation 配置可恢复 `excludePresets: []`。如需回退代码，使用现有 backup/rollback 命令，再安排手动 reload。新 host 传入的额外参数会被旧 JS 函数忽略，rollback 不会改 prompt 原文、图库或代理。不要自动 restart 用户正在使用的 DSH。

## test

`test/preset-injection.test.mjs` 覆盖默认兼容、当前 preset 解析、所有 injection 段、残留 cleanup、下游内容保留、100 路交错 session、子 Agent，以及旧无参调用的 LF/CRLF migration 与幂等运行。

`scripts/check-preset-runtime.mjs` 对明确指定的 realhost 进行 read-only 验收，在临时 profile 中调用其 Cordis、SystemPrompt 和 migration 后的 step 请求构建代码：standard/minimal/roleplay 切换、60 路并行与子 Agent、complete preset。请求构建止于模型调用前，不涉及实际付费模型、账号或用户 chat。该脚本也加入三平台官方 npm host 安装/rollback CI。

```sh
PURGE_TEST_HOST=/path/to/isolated/node_modules/@deepseek-ai node scripts/check-preset-runtime.mjs
```

被 exclude 的 session 不会返回 Purge probe，不能据此认定插件故障；检查全局 injection 链路时使用未 exclude 的 preset。

这验证的是确定性的 injection 边界和实际 hostservice，不将它 description 为 real 模型回答质量 test。
