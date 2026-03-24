# codex-wechat

WeChat-first local bridge for Codex.

Architecture:

`WeChat App -> codex-wechat -> Codex endpoint -> WeChat App`

## What it does

- Logs in to WeChat with a QR code and saves a local account token.
- Routes WeChat text commands to Codex.
- Keeps per-project workspace binding and thread state.
- Supports approval flow in WeChat with:
  - `/codex approve`
  - `/codex approve workspace`
  - `/codex reject`

## Quick Start

```powershell
npm.cmd run login
npm.cmd start
```

After start, send commands in WeChat such as:

```text
/codex help
/codex status
/codex workspace
/codex new
```

## Endpoint-Only Mode

This project can run without a locally installed `codex` command.

- If `CODEX_WECHAT_CODEX_ENDPOINT` is set, the app connects to that WebSocket endpoint directly.
- If it is not set, the app can create a local endpoint proxy from the bundled VSCode Codex extension.
- The WeChat side always talks to an endpoint, not directly to a manual `codex` command.

Example `.env`:

```env
CODEX_WECHAT_STATE_DIR=.codex-wechat
CODEX_WECHAT_BASE_URL=https://ilinkai.weixin.qq.com
CODEX_WECHAT_CDN_BASE_URL=https://novac2c.cdn.weixin.qq.com/c2c
CODEX_WECHAT_QR_BOT_TYPE=3

CODEX_WECHAT_CODEX_ENDPOINT=ws://127.0.0.1:PORT
CODEX_WECHAT_CODEX_COMMAND=
CODEX_WECHAT_PROXY_URL=http://127.0.0.1:7890

CODEX_WECHAT_VSCODE_LAUNCH_ON_START=true
CODEX_WECHAT_VSCODE_COMMAND=C:\Path\To\Code.exe
CODEX_WECHAT_VSCODE_KILL_BEFORE_LAUNCH=false
```

## Project Isolation

Use one state directory per project with `CODEX_WECHAT_STATE_DIR`.

That keeps the following isolated per repo:

- saved WeChat account data
- sync buffer
- Codex session/thread state

Recommended pattern:

```env
CODEX_WECHAT_STATE_DIR=D:\PyCharmMiscProject\codex-wechat-main\codex-p1-main\.codex-wechat
```

## WeChat Commands

- `/codex bind /absolute/path`
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

## Login

```powershell
npm.cmd run login
```

This stores the WeChat account under the configured state directory.

## Start

```powershell
npm.cmd start
```

If `CODEX_WECHAT_CODEX_ENDPOINT` is not set, the app tries to create a local endpoint proxy using the bundled VSCode Codex extension.

## Notes

- The app expects WeChat text commands, not Feishu cards.
- Markdown replies are flattened to plain text for WeChat.
- If you use a proxy or VPN, set `CODEX_WECHAT_PROXY_URL`.
