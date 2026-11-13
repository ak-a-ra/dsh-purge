# NEXT host 家族（`dsh-desktop-next`）

本文说明第三方桌面壳 **DSH NEXT** 为什么需要 standalonehost 家族、身份如何判定、repack 与恢复走哪条 path，
以及它与官方 `@deepseek-ai/dsh-desktop-host` 家族的边界。

## 1. 为什么单独成族

DSH NEXT 的 release package 是 `dsh-desktop-next`（当前观测版本 `2.0.19-next`），它：

- 没有 `@deepseek-ai/dsh-desktop-host` 包；
- 把 DSH 组件放在 apply 根 `node_modules/@deepseek-ai`，没有官方那种 `dsh/node_modules/` 前缀；
- 没有官方 `resources/runtime/cli/bin/dsh` 这套 CLI shim；
- 入口是 apply 根的 `lib/host.js` / `lib/main.js`，`process.argv[1]` 在打包环境下也不指向脚本。

因此它不能被“官方补丁表 + 官方身份判定”直接覆盖：官方的 `QUALIFIED_HOST_VERSIONS`
逐条锚点 regression、`repairOfficialCliAfterUnpack` 的 failure 语义，都不适用于这个壳。

## 2. 身份判定（只看包 evidence）

`lib/next-host.js`：

| 输入 | 结论 |
|---|---|
| `resources/app/package.json` 的 `name === "dsh-desktop-next"` 且 `main` 存在 | 认作 `kind: "next"` |
| `resources/app.asar/package.json` 同上（Electron 下 asar-aware fs 可 read） | 同上 |
| 只有同名 exe、`resources` 为空 | 拒绝 |
| `resources/app` 属于别的 Electron apply | 拒绝 |
| 有 archive 但 `package.json` 不是 NEXT | 拒绝 |

**不看 exe file 名。** 名字表（`dsh next`、`deepseek harness` 等）只用于提示与排序，
不参与合法性判定——否则任意一个同名 exe 都会被当成“要洗的 host”。

## 3. instance 解析（不再用全局 `findAiBase` 回退）

`lib/instance.js#resolveInstance()` 是唯一入口，解析顺序：

1. `DSH_BASE`（显式）
2. `PURGE_DSH_CLI`（显式；file 不存在或不在 `@deepseek-ai/dsh` 包内直接 throw）
3. 当前 process 自身的入口（`argv[1]` / `process.resourcesPath` / Electron `app.getAppPath()`）

**不会**扫描 `DSH_HOME`、npm prefix、shim directory 或其它安装。指错 instance 时返回
`{ resolved: false, host: "", reason: ... }`，panel 如实显示“未定位”，而不是拿另一份安装的 state 顶上。

`/dsh-purge/status` 与 `/dsh-purge/selfcheck` 都改用这个入口；`gatherState({ aiBase: "" })`
在 core 层就是“显式空目标”，不会 trigger 发现逻辑。

### 部分 unpack

`diagnosticHost()` 只在 candidatedirectory**真的可用**（含 `dsh-agent-instructions/lib`）时上报。
`app.asar.unpacked` 里那几包不完整的副本不会被当成 host，而是返回本安装的“预期 path”
`resources/app/node_modules/@deepseek-ai`，由 `compatibility()` 报 `no-host`。

## 4. repack 与恢复

NEXT 与官方共用 unpack/提交原语，但恢复语义在族内单独验证：

```
extractAsarToSide(asar, resources/app) → resources/app.dshpurge-next
overlayAsarUnpacked(asar, next) → 原生 .node 覆盖进旁路 directory
commitExtractedDir(app, next) → app → app.dshpurge-prev；next → app
```

- 上次中断留下的 `.dshpurge-next` 在下次 unpack 前被丢弃，不会污染新 directory；
- 提交 failure（跨卷 `EXDEV`、in use 等）会：保留旧 `app`、保留新 directory、write
 `app.dshpurge-recover.json`（含 `error` / `prev` / `prevRestored`），可以 retry；
- 只剩 `.dshpurge-prev` 时，`newestPreservedDir()` + `restoreSealedExtract()` 能放回旧 directory；
- repack 最后一步 `renameAsarAside()` 把 archive 保全为 `app.asar.bak`；Windows repack 由 handoff
 助手改名为 `app.asar.purge-<uuid>.bak` 并记录 `archive_sha256`（与 backup 实际 hash 一致）。

## 5. CLI repair：`notApplicable` 而不是 `ok: true`

`repairOfficialCliAfterUnpack()` 对 NEXT 返回：

```js
{ ok: false, notApplicable: true, status: "not_applicable", reason: "next_family_has_no_runtime_cli" }
```

`ok` keep `false`：我们确实没有修、也没有验证。若意外发现 `runtime/cli/bin/dsh` 存在，
返回 `status: "unsupported_family"` 并按 failure 处理。

放行判定收敛到 `lib/apply-gate.js#cliRepairBlocksApply()`：

| `cliRepair` | 行为 |
|---|---|
| `ok: true` | 放行 |
| `notApplicable: true` | 放行（明确不适用） |
| `ok: false` 其它 | 拦截，保留 archive |
| 没有结论 | 拦截 |

这样官方构建的 `not_official` 拒绝 pathkeep as-is，NEXT 也不会靠伪造 success 来换取放行。

## 6. 与官方补丁表的关系

- NEXT **不进入** `QUALIFIED_HOST_VERSIONS`；`NEXT_FAMILY.qualified === false`。
- 补丁仍来自同一份 `ALL_PATCHES`，但每条的锚点命中/漂移逐条上报，不做“整族已 regression”的结论。
- 实机（0.2.1-rc.2 内层）结果：61/69 writesuccess；`#82/#83/#84` 因 NEXT 的 `lib/main.js`
 与官方不同而 `drifted`，属预期。

## 7. test

`test/desktop-next-host.test.mjs`（`node --test test/desktop-next-host.test.mjs`，12 例）覆盖：

- 身份：NEXT 包 evidence 接受；错名 / 缺 `main` / 裸 exe / 别的 Electron apply 拒绝
- 官方 bundled-host 身份 regression（不受本族影响）
- `resolveInstance`：显式选择器 prefer、指错不回落、`PURGE_DSH_CLI` 不存在 throw
- `diagnosticHost`：部分 unpack 时返回预期 path
- CLI repair 结论与 repack 闸门矩阵
- repack：unpack/overlay/残留 cleanup/提交保留旧 directory
- 提交 failure：`recover.json`、旧 directory 不动、新 directory 保留
- 中断恢复：从 `.dshpurge-prev` 还原
- archive 改名保留 backup
- 补丁 writefailure：state 显式 failure、原文与 backup 可 rollback、after recovery 可 retry

## 8. 未覆盖

- NEXT 自更新后重新生成 `app.asar`：需要 rerun 一次 repack（未做自动化 regression）
- real OS 级 in use（杀软/索引器）造成的 sharing violation：用跨卷 `EXDEV` 代替 injection
- macOS handoff

## 9. compatibility 承诺

1. 官方构建的身份判定、`not_official` 拒绝 path、`app.asar` 保留语义不变；
2. 不新增“仅凭 file 名认定 host”的通道；
3. panelstate 只反映**本 processinstance**，未定位就显示未定位。
