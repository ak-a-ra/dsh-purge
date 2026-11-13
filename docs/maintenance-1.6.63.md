# 1.6.63 maintenance record：上游 1.1.78–1.1.83 比对

逐条 read commit 与 release notes 后的取舍：

| 上游项 | 结论 |
|---|---|
| #188 drifted 判定（通用部分） | **采纳**：`filePatchOutcome` 增加 `drifted`；`ensureHostClean` 不再过滤 `pattern_not_found`；panel/self-check 同步 |
| #188 的 expect 命中数契约 | 暂不采纳：改动面覆盖全部 82 条 pattern，需要单独一轮验证 |
| #174 DSH NEXT 识别 | 不采纳：第三方壳需要 standalonehost 家族（本仓库 #98 / PR #102） |
| #180 / #185 allowBuilds、pnpm 11/12 | 不采纳：本 fork 不 write `pnpm-workspace.yaml`，走 `dsh plugin add` |
| #191 空 `[]` cordis.patch.yml | 不采纳：本 fork 不自动追加 insert 行 |
| #108 selectedDefault cleanup | 不采纳：无 redteam preset，不改用户默认选择 |
| #170 zip directoryentry | 已具备（`endsWith("/")` 建 directory） |
| subagent 沿 parent sessionreadpreset | 不采纳：#53 契约是「子 Agent 按自己的实际 preset 判断」，已有 testlock 定 |
| 公网门禁 / 靶场限制 | 一律不取 |

## 判定细节

- self-marked patches：`replacements[].pattern` 含 `[dsh-purge]`，说明 pattern 是插件自己 write 的痕迹，找不到＝没加过，keep `skipped`。
- `silentWhenMissing`：显式声明「缺失即正确」patches（当前仅 #76 用户 preset 身份行），避免把干净 preset 报成漂移。
- 真机 0.2.1-rc.5 结果：74 applied / 6 na（第三方未装）/ 2 skipped，`diagnose` 零漂移。
