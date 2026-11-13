# panelrollback 与更新网络 maintenance（1.6.29）

## #34：panelrollback 缺 dependency

`Maintenance.rollback()` 过去把 snapshot 展开后直接交给 DSH 安装 directory，包管理器 write `link:`，但 snapshot 不含 `node_modules`。因此安装命令 success 不代表插件可 load。1.6.28 修的是另一条旧更新器 directory 恢复 path，未覆盖 panelrollback；其发布说明不能视为此入口已通过验证。

现在把经过 snapshot 校验的完整 file 树打成 `.tgz`，通过当前 instance 的 DSH CLI 安装。安装后在新 process 验证包名、版本、声明 dependency 解析和入口 import，避免 hostmodulecachemask 缺 dependency。只 importmodule，不调用插件 apply、不修改 host、不启动或 restart DSH。

安装前保留本轮 profile 的 dependency graph、package.json 和 lockfile；failure 时恢复本轮开始前的安装，并保留故障 directory 与 backup。若检测到其他 dependency 或 profile 元数据并发变更，stop 自动覆盖并明确报告恢复未完成。success 后 cleanup 临时 dependency 副本；rollback 期间需要容纳一份当前 dependency graph 的额外空间。不会用 old snapshot 覆盖当前 prompt、rule 或其他插件设置。

支持旧 schema 1/2 snapshot。不能用“把 yaml 从别处 link 过来”替代 dependency 解析，否则不同旧版本的 dependency 仍可能不匹配。Windows Node 22 的 recursive `fs.cpSync` 在实机 link 树上发生原生 quit，临时图复制改为显式遍历、non-recursivefollowlink。

## #35：两套更新请求统一

社区 release package 和旧更新通道共用 `lib/update-http.js`。统一 TLS、重定向白名单、体积限制、整体 timeout、authentication 及代理选择。正式包 SHA256 和旧 ZIP Git tree 校验仍必需。

- Token：read**hostprocess 已有环境** `GITHUB_TOKEN`，其次 `GH_TOKEN`。只发给 HTTPS `api.github.com`，每次跳转重新计算；不发给下载 CDN、Atom 页面或代理 CONNECT。没有 token 仍支持 anonymous 请求。
- 代理：`PURGE_HTTPS_PROXY` → `https_proxy` / `HTTPS_PROXY` → `http_proxy` / `HTTP_PROXY` → Windows 当前用户 static system proxy。尊重 `no_proxy` / `NO_PROXY`。显式空 `PURGE_HTTPS_PROXY` 表示此更新请求直连。支持 HTTP/HTTPS CONNECT（含代理 authentication），keep 证书校验。
- 仅**read** Windows `Internet Settings`；不修改 registry、Clash、系统代理、全局 Node Agent、SSH、用户 prompt 或 permissions。macOS/Linux 使用显式环境代理；本版未新增 Linux 安装入口。
- PAC/WPAD 不执行；只设置 PAC 且没有静态代理时明确提示使用环境代理。SOCKS 尚未支持，配置时明确 error，不悄悄直连。
- environment variable 必须存在于 the process that launches DSH 环境；在另一个终端设置不会改变已运行的桌面 process。由用户决定何时手动 reopen，不自动 restart。不要把 token write issue、截图、日志或公开配置。
- 403 不一律等于限流：结合 rate-limit 响应头区分 quota exhausted、authentication/permissions、404、连接 error、timeout。quota exhausted 时显示重置时间。Atom degradedfailure 及使用旧列表都有可见说明，不把旧列表称为“已确认最新”。
- standalone bootstrap 安装脚本在插件 load 前运行，仍是 self-contained 下载器；本节的环境代理兼容层适用于插件内更新请求，不能把旧 host 或所有下载工具都声称已改造。

## 验收要求

1. 在临时 DSH_HOME/profile，使用 real DSH CLI 安装公开 1.6.28；旧 panelrollback 生成 link 并复现缺 dependency。
2. 新版安装器恢复 corruptlink；新版 panelrollbackold snapshot、重新升级；每步在新 processimport 入口。
3. 在 real 安装完成后 injection 一次验证 failure，确认 package.json、lockfile、原版本 dependency 及入口恢复。
4. Windows 4090 实机运行以上流程和自动 test；比较原有设置 file 及代理 registry 摘要，不操作正在运行的 DSH。
5. 本地临时 HTTPS service 和 CONNECT 代理验证 real TLS、代理 authentication、跨域 token 隔离、响应限额和整体 timeout。test CA 仅通过 testchild process 环境 load，不进入系统证书库。
6. 发布前保存 real 产物、test 结果和校验记录。Node/Electron import 与 serviceregister 验证不等于用户桌面 GUI 全量验收。

可复用实测入口：`scripts/verify-rollback-runtime.mjs`。仅使用新建隔离 profile，显式设置 `PURGE_TEST_HOME`、`PURGE_TEST_PROFILE`、`PURGE_DSH_CLI`，传入旧版和 candidate 版 tgz；禁止把日常用户 profile 当 test fixture。
