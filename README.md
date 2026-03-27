# codex-wechat

[English README](./README_EN.md)

## 项目简介

`codex-wechat` 是一个面向微信的本地 Codex 桥接器，现在也已经整理成可被 Codex 发现和分发的本地插件。

架构：

`WeChat App -> codex-wechat -> Codex app-server / endpoint -> WeChat App`

当前仓库地址：

- GitHub: [SKYhuangjing/codex-app-wechat](https://github.com/SKYhuangjing/codex-app-wechat)

## 本次更新带来的变化

- 增加了标准 Codex plugin 结构：
  `.codex-plugin/plugin.json`、`.app.json`、`.mcp.json`、`hooks.json`、`skills/wechat-bridge-setup/SKILL.md`
- 增加了插件说明和插件图标资源，项目可以直接作为本地 Codex plugin 打包和分发
- 桥接默认推荐使用 `Codex.app` 内置的 `codex` 二进制，避免桌面 App 与桥接使用不同版本时产生线程可见性问题
- `/codex bind` 现在支持两种绑定方式：
  1. 绝对路径
  2. 白名单根目录下的相对项目路径，例如 `/codex bind agent`
- 当切换到一个“没有历史线程”的项目时，不再要求先手工执行 `/codex new`
  下一条普通消息会自动开始一个新线程
- 保留“已有项目恢复旧线程”的行为，避免切项目时意外丢失上下文

## 当前能力

- 微信扫码登录，并保存本地账号 token
- 在微信中向 Codex 发送文本消息
- 按项目维度维护 workspace 绑定和 thread 状态
- 支持微信内授权流：
  - `/codex approve`
  - `/codex approve workspace`
  - `/codex reject`
- 支持多项目切换
- 支持把微信消息落成真实 Codex thread

## Codex Plugin 形态

本仓库现在已经包含 Codex plugin 所需的核心文件：

- `.codex-plugin/plugin.json`
- `.app.json`
- `.mcp.json`
- `hooks.json`
- `skills/wechat-bridge-setup/SKILL.md`

如果你要作为本地插件分发，优先使用仓库里的打包产物，或从当前提交重新导出一个干净包，不要把 `.env`、`.codex-wechat/`、`node_modules/` 这些本地文件带出去。

## 如何从源码安装到 Codex

最方便的方式：

- 可以直接让 Codex 基于这个 Git 地址下载安装：
  `https://github.com/SKYhuangjing/codex-app-wechat.git`

如果你希望手工安装，再按下面官方本地 marketplace 方式进行。

1. 下载或克隆源码后，把插件目录复制到 `~/.codex/plugins/codex-wechat`

```bash
mkdir -p ~/.codex/plugins
cp -R /absolute/path/to/codex-wechat ~/.codex/plugins/codex-wechat
```

2. 新建或更新 `~/.agents/plugins/marketplace.json`，让插件条目的 `source.path` 指向该目录

```json
{
  "name": "local-marketplace",
  "interface": {
    "displayName": "Local Plugins"
  },
  "plugins": [
    {
      "name": "codex-wechat",
      "source": {
        "source": "local",
        "path": "./plugins/codex-wechat"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

3. 重启 Codex，确认插件已经出现在插件列表中

说明：

- `marketplace.json` 放在 `~/.agents/plugins/marketplace.json`
- 插件目录放在 `~/.codex/plugins/`
- 如果你是从自己的开发目录复制过去，建议复制前先清掉 `.env`、`.codex-wechat/`、`node_modules/` 这些本地运行态内容
- 安装到 Codex 后，再进入 `~/.codex/plugins/codex-wechat` 执行依赖安装和本地配置

## 快速开始

```bash
cd ~/.codex/plugins/codex-wechat
npm install
cp .env.example .env
```

最小启动步骤：

1. 配置 `.env`
2. 执行 `npm run login`
3. 执行 `npm start`
4. 在微信里发送命令或普通文本消息

## 随 Codex 自动连接

Codex 当前本地插件规范里没有明确的 `onStart` / `autoActivate` 启动钩子，所以这里实现的是一个更接近用户体验的 macOS 方案：

- 安装一个本地 `LaunchAgent`
- 常驻一个轻量 monitor
- 当它检测到 `Codex.app` 已启动但 bridge 还没启动时，自动拉起 `codex-wechat`

启用方式：

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:install
```

关闭方式：

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:uninstall
```

说明：

- 当前只支持 macOS
- 这是“Codex 启动后自动连接”，不是修改 Codex 官方插件生命周期
- monitor 日志在 `~/.codex-wechat/logs/autostart-monitor.log`
- 自动拉起的 bridge 日志在 `~/.codex-wechat/logs/autostart-bridge.log`

## 推荐配置

推荐优先使用 `Codex.app` 自带的 `codex` 可执行文件，让桥接和桌面 App 走同一版本：

```env
CODEX_WECHAT_PROXY_CODEX_EXECUTABLE=/Applications/Codex.app/Contents/Resources/codex
```

建议至少配置这些变量：

```env
CODEX_WECHAT_ACCOUNT_ID=
CODEX_WECHAT_ALLOWED_USER_IDS=
CODEX_WECHAT_DEFAULT_WORKSPACE=/path/to/your/workspace
CODEX_WECHAT_WORKSPACE_ALLOWLIST=/path/to/your/workspace

CODEX_WECHAT_CODEX_ENDPOINT=
CODEX_WECHAT_CODEX_COMMAND=
CODEX_WECHAT_PROXY_CODEX_EXECUTABLE=/Applications/Codex.app/Contents/Resources/codex

CODEX_WECHAT_STATE_DIR=/path/to/codex-wechat/.codex-wechat
```

说明：

- 如果 `CODEX_WECHAT_CODEX_ENDPOINT` 已设置，桥接会直连该 WebSocket endpoint
- 如果未设置，桥接会使用 `CODEX_WECHAT_PROXY_CODEX_EXECUTABLE` 启动本地 proxy
- `CODEX_WECHAT_ALLOWED_USER_IDS` 不建议留空，否则任何给 bot 发消息的微信号都可能控制本机 Codex

## 多项目切换

当前版本支持在白名单根目录下用“相对项目路径”切换项目。

例如白名单为：

```env
CODEX_WECHAT_WORKSPACE_ALLOWLIST=/path/to/workspaces
```

那么你可以在微信里直接发送：

```text
/codex bind agent
/codex bind control
/codex bind some/nested/project
```

也仍然支持绝对路径：

```text
/codex bind /path/to/workspaces/agent
```

行为说明：

- 如果目标项目已有历史线程，`bind` 会恢复旧线程
- 如果目标项目没有历史线程，`bind` 会进入“新线程草稿”状态
- 下一条普通消息会自动创建一个新的 thread

## 微信命令

- `/codex bind <绝对路径|项目相对路径>`
- `/codex where`
- `/codex workspace`
- `/codex new`
- `/codex switch <threadId>`
- `/codex message`
- `/codex stop`
- `/codex status`
- `/codex account`
- `/codex quota`
- `/codex model`
- `/codex model update`
- `/codex model <modelId>`
- `/codex effort`
- `/codex effort <low|medium|high|xhigh>`
- `/codex approve`
- `/codex approve workspace`
- `/codex reject`
- `/codex remove /absolute/path`
- `/codex send <absolute/path>`
- `/codex help`

普通文本消息会直接发送给当前项目对应的 Codex thread。

## 关于 Codex 桌面端可见性

微信消息会被写入真实的 Codex thread，但桌面 App 是否立即展示，仍然依赖桌面端对该项目的索引和展示规则。

实践建议：

- 在 Codex 桌面端先把对应目录加入 Project
- 让桥接与桌面 App 使用同一个 `codex` 版本
- 切换到新项目后，如果它没有历史线程，直接发送一条普通文本消息即可创建新会话

## 项目隔离

如果你希望不同仓库之间完全隔离，可以为不同项目使用不同的 `CODEX_WECHAT_STATE_DIR`。这样会隔离：

- 已保存的微信账号数据
- sync buffer
- Codex session / thread 映射

## 注意事项

- 当前主要面向微信文本命令，不是飞书卡片工作流
- 微信回复会把 Markdown 压平成普通文本
- 如果你使用代理或 VPN，请设置 `CODEX_WECHAT_PROXY_URL`
- 不要把 `.env`、`.codex-wechat/` 或本地登录态推送到远程仓库
