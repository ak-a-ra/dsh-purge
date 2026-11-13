# #188 验收记录与相关 repair

验收基于主分支提交 `bd4ee2f7`，与已发布的 1.6.88 对照。

- **#173 · Tauri 桌面 instance 识别**　诊断会核对当前 process 使用的托管 archive、archive 内的 DSH 包声明和 CLI 入口。read failed 会保留具体 error。在 Windows Tauri Desktop 0.31.2 上，用两个版本号相同的核心构建完成了切换和 rollback，三个阶段均核对了活动 archive 和 CLI，rollback 后的完整 SHA256 与起点一致。repack 由 Tauri 桌面执行。[实测记录](https://github.com/kingcharleslzy-ai/dsh-purge/issues/173#issuecomment-6773521953)
- **#174 · 新 sessionpreset 选择**　有可用的当前 sub-preset 时，菜单折叠对应的历史兼容项。旧 session 继续按已保存的 ID 查找 preset。已验证鼠标点击、键盘方向键和最终选中的 ID。[验收记录](https://github.com/kingcharleslzy-ai/dsh-purge/issues/174#issuecomment-6773128702)
- **#188 · 设置页重复卡片**　在官方 DSH 0.2.2-rc.1 的「设置 → Agent preset」组件中，用一条当前记录和两条历史兼容记录复现了重复显示。1.6.88 显示三张卡，合入 #186 的版本显示一张。默认项、loadanomaly 项和缺少对应当前项的记录仍然可见。主分支已包含这项 repair。报告者截图未展示完整 ID，本次结论对应已复现的历史别名场景。[问题报告](https://github.com/kingcharleslzy-ai/dsh-purge/issues/188)

## 官方桌面验收范围

Mac 与 Windows 4090 分别使用各自官方 0.2.2-rc.1 安装包中的设置组件，在 standalone 浏览器环境中验证了卡片行为。两个平台的桌面可执行 file 和 host 包均通过 #187 涉及的身份判定。此次 test 覆盖身份检查，未执行 hostwrite 或 repack。macOS 使用官方 headless CLI、standalone profile 和官方模型连接发送普通算术请求，返回 42。Windows 本次验证覆盖桌面包和 preset 组件。
