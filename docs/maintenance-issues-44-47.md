# 慢网更新、配置合成与审计 permissions（#44 / PR #45–47）

## 更新 Agent 的操作顺序

先确认 failure 发生在查版本、下载、校验还是安装阶段。官方 API 能访问不代表 release-assets 域名也能访问。正式 TGZ 原来使用 30 秒下载预算，不能把所有 failure 都归因于另一路默认 12 秒。

1. 默认无需配置：正式 archive 下载总预算 180 秒，包含重定向与响应体；元数据仍沿用原请求预算。
2. 慢网可设置 `PURGE_DOWNLOAD_TIMEOUT_MS=300000`（毫秒，范围 30000–900000），只影响正式发行 archive。
3. 没有 CONNECT 代理而有可信的 URL 前缀 service 时，可以由用户明确设置 `PURGE_GH_MIRROR=https://mirror.example/`。此处是示例地址，项目不内置或自动选择公共镜像。仅允许 HTTPS 默认端口、无账号密码、查询串或片段的前缀；也支持带 path 的前缀。
4. 该镜像仅承载社区正式 TGZ。API、校验 manifest、README、分支与源码 ZIP 不经此入口 rewrite；源码通道沿用 1.6.37 指向本仓库的 repair。镜像模式从官方 GitHub API 重新获取该 release asset 的 SHA256；老发行没有 digest 时从官方原地址获取 SHA256SUMS。官方摘要无法获取、版本/资产不匹配或字节校验 failure 时 stop，不能让镜像同时提供包和信任依据。
5. 变量应由 the process that launches DSHinherit，容器在自己的 service 配置中设置。不要把 URL 前缀镜像填入 `HTTPS_PROXY`：后者需要 HTTP CONNECT。不要自动改用户代理、disable TLS 校验或 restart DSH。现有 process 未 inherit 新环境时，等用户方便时自行重新启动。
6. 下载、摘要及 archive 身份检查完成后，才进入 backup 与安装；网络 failure 不会执行安装 rollback。安装阶段 failure 仍使用原有 backup/恢复流程，不能因此关闭 rollback 功能。cachefile 不等于已安装。

暂不支持断点续传。无进展的连接仍受总时限约束。镜像失效要明确 error，不自动试一串第三方站点。GitHub Token 仅发往 api.github.com，不发给镜像。

## 配置合成

删除 insert 前的同名 `dsh-purge` inject 修改，保留 insert 内完整定义。新安装不再产生该条找不到目标的告警；已有自定义项不被此冗余段覆盖。用户后置 override 仍 prefer；不删除 red team 旧包 migration 段或屏蔽其他告警。test 使用 realhost `composeEntries`，不只对 YAML 做字符串 assert。

## 审计 directory 与运行用户

不 migration 日志 path，non-recursive chown，不把私密 directory 放宽成 755。新 directorykeep 700，新日志 keep 600，已有 permissionskeep。仅在 root 调用时处理 known 审计 directory 和 `audit.jsonl`、`.1`、`.2` 的 root 所有权；file 必须是无硬 link 的普通 file，symlink 拒绝处理。Linux 使用打开的 directory 和 filedescriptor 约束修改目标，轮转后创建的日志也交还给目标用户。

- DSH_HOME 属于普通用户：以该 UID/GID 作为审计运行用户。
- 容器的 DSH_HOME 本身属于 root：无法自动知道 `gosu` 后的用户。先用 read-only 方式确认 service 的数字 UID/GID，再由用户明确提供 `PURGE_AUDIT_UID` 与 `PURGE_AUDIT_GID`。必须成对提供；非 root home 与指定 UID 冲突时 stoprepair。不要猜用户名或 recursive 修改整个数据 directory。
- 普通用户没有 chown permissions：插件不会尝试提权；旧 root file 需要管理员按上述明确用户上下文执行操作。Windows 无 POSIX 所有权 repair；macOS 跨用户 directoryrepair 不会自动执行。
- 审计 writefailure 仍返回 false 并告警，不阻断主任务；read 遇到 permissionserrorexplicit failure，不再伪装成空记录。

上述 repair 不承诺 repair 其他 root 所有的 backup 或配置 file。那些 path 需单独诊断，不能混入这次审计 repair。

## 验证与 rollback

regression 覆盖慢速持续传输、stop 滞 timeout、镜像跳转、官方摘要不可用、篡改包、下载 failure 不安装/rollback，以及安装后 failure 保留原恢复语义。Linux CI 以 real root 和非特权 child process 覆盖新 directory、旧 root 日志、历史轮转、显式容器 UID/GID 与 link 逃逸负例。

三平台官方 npm host 验收使用 standalonedirectory：安装 1.6.36 → 安装 candidate 包 → rollback → 再升级 → injectionrollback 验证 failure 并恢复；核对配置和 prompt 原字节。既有 macOS/Windows Electron 手动 quitrepacktest 继续运行。不会启动或 restart 用户的 DSH，does not call the model。

Windows 官方 npm host 验收复现了 8.3 临时 directory 别名与长 path 混用导致 pnpm store 索引 file 名过长的 ENOENT。安装入口仅将实际存在的 archive 解析为 native realpath；不修改全局 pnpm 配置、不清 cache，也不改变 backup 身份。

rollback 安装包使用已有 Maintenance snapshot。repair 后的审计所有权不自动改回 root，否则会再次导致普通用户无法 write；原日志内容与 permissions 没有被删除或放宽。

本版保留 1.6.37 的来源 repair：beta / 源码 ZIP 通道与正式发行通道均指向本仓库，旧常量名称作为兼容别名保留。源码 ZIP 不走上述 TGZ 镜像入口。历史上游不可访问不阻断社区正式版本更新。
