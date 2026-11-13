# #52：standalone 安装器下载 failure

## evidence 与根因边界

报告者能用 curl 下载 raw 安装脚本，但在 `Downloading Purge Community 1.6.38...` 后仅看到 `fetch failed`。1.6.38 Release、archive 和 SHA256 manifest 均存在；maintenance 端实际下载、核对 SHA256、Electron dry-run success。因此没有 evidence 认定发行附件丢失，也不能仅凭这行 error 断定报告者是代理、证书或 timeout。

已确认的代码缺陷是：standalone bootstrap 使用一次性 Node fetch，未提供备用传输；顶层仅显示 error.message，丢弃 cause/聚合连接 error。curl 与 Node/Electron fetch 的代理和证书处理可以不同。插件内 update-http 的 repair 没有覆盖 standalone 入口。

## 1.6.39 的 repair

- keep bootstrap self-contained，仅使用 Node built-insmodule，不 dependency 尚未安装的包。
- 每个下载最多两次 fetch，然后一次系统 curl；只对已识别的瞬时网络 error 或 HTTP 408/429/500/502/503/504 retry。每次从原始官方地址重新开始，不重用过期的签名重定向。
- metadata/checksum 总预算各 60 秒；archive 默认 180 秒，沿用 `PURGE_DOWNLOAD_TIMEOUT_MS` 的 30000–900000 范围。fetch 每一跳最多 20 秒，所有 retry 共享总预算。
- 系统 curl 使用 pinnedpath、不经 shell、不 read curlrc、不自动跳转。每一跳检查 HTTPS、443、无 URL 凭证及官方域名白名单；响应头和 body 均有大小上限。curl stdout 按 HTTP 头和二进制 body 分离，支持 interim 响应；部分 failure 内容不复用。
- 所有通道 keep TLS 校验。显式 `CURL_CA_BUNDLE` 作为 `--cacert` 传给 curl，兼容 Windows Schannel；不会安装证书或更改系统信任库。fetch 明确报告证书 error 时直接 stop，不以备用通道绕过该 error。
- 来源、证书、大小、永久 HTTP error 及 SHA256 不符都 keepfailure。下载完成仍需检查 SHA256、archivepath、包名/版本/仓库身份，才进入原 migration 器。
- 日志 output stage/host/transport/attempt/code，recursive 展开 cause 和 AggregateError 的 error 码。原始 error/stderr、代理 URL、签名 URL、token 不 output。

## 网络与设置边界

本 repair 不修改系统代理、Clash、DSH 设置、profile、用户 prompt、preset 或原有功能；不自动 apply/restart。curl 只 inheritprocess 环境和系统默认信任库，不保证 read Windows/macOS GUI 代理、PAC 或插件专用 `PURGE_HTTPS_PROXY`，也不添加镜像。若当前环境两条通道都不可达，明确 error，不自动改网络。

系统 curl 缺失会报告 CURL_UNAVAILABLE。下载或校验 failure 尚未进入 migration，无须安装 rollback、清 lockfile 或 delete configuration。`--dry-run`/`-DryRun` 仍只校验下载，不安装。

## 复测与需要报告者补充的内容

1. 重新下载 master 的 install.sh/install.ps1，避免沿用旧入口；运行 dry-run。
2. 若 success，去掉 dry-run 再按自己的意愿安装；需要 load 新版时手动 reopen DSH。
3. 若 failure，提供 OS/DSH 版本、failure 的 `[download]` / `Release download failed` 行，说明是否能在浏览器下载同一发行附件，以及终端是否 inherit 代理（只回答是/否，不贴地址或凭证）。
4. 关注 `stage=metadata`（API）、`archive`（GitHub/CDN）、`checksum`（校验 manifest）；403/404 不应泛化成 timeout。新版日志用于确认报告者具体网络根因，不声称已经在他的机器复现。

## test

- `test/bootstrap-download.test.mjs`：retry 次数、备用通道、来源/端口/凭证拒绝、error 分层和脱敏、截断与限额、预算、SHA256 failure 不安装和设置不变。
- `test/bootstrap-curl.test.mjs`：本地 real TLS + CONNECT 代理，real 系统 curl 的二进制下载、interim 响应、逐跳来源拦截、curlrc 不 load、超大响应、timeout、无效证书拒绝。test 代理仅 injectiontestchild process，不 write 系统代理或证书库。
- `scripts/check-bootstrap-download-runtime.mjs [版本]`：在选定 Node/Electron 中下载 real 官方 Release 并核对摘要；分别跑默认 path 和只对 fetch injection 网络 error、由 real curl 完成 archive 与 manifest 下载。使用一次性 profile，禁止进入安装。
- 其余安装、permissions、backup、rollback 与 host 功能 regression 保留。下载实测不能替代完整 DSH 图形 UI 或模型能力 test。

本地验收（2026-10-21）：macOS 全量 269 项，257 通过、12 项环境/平台 skip；Windows 11 实机全量 269 项，246 通过、23 项环境/平台 skip。新增 real curl/TLS 用例在两端均执行通过，没有 skip。两端使用 Electron 44.7.0 实际下载 1.6.38 官方 archive 与 manifest，默认 path 和 injection fetch failure 后的 curl path 均通过 SHA256；隔离 profile 设置 keep 原字节。既有 Electron 诊断通过，macOS 在一次性 Electron 副本完成手动 quitrepack/rollbackregression，未 restart 用户 DSH。完整三平台官方 npm host 安装/rollback 由 PR CI 另行执行，不与以上下载验收 conflate 一项。
