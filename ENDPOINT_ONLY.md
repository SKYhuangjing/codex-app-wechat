# Endpoint-Only Mode

This repository can run without the local `codex` binary.

## What it uses

- WeChat bridge for incoming/outgoing chat
- A saved WeChat account token
- A Codex WebSocket endpoint exposed by your VSCode/Codex environment

## What it does not use

- Local `codex` CLI
- Local `codex app-server` spawn

## Environment variables

```env
CODEX_WECHAT_CODEX_ENDPOINT=ws://127.0.0.1:PORT
CODEX_WECHAT_CODEX_COMMAND=

# Optional: if you want to route traffic through your VPN/proxy
CODEX_WECHAT_PROXY_URL=http://127.0.0.1:7890

# Optional: launch VSCode on start
CODEX_WECHAT_VSCODE_LAUNCH_ON_START=true
CODEX_WECHAT_VSCODE_COMMAND=C:\Path\To\Code.exe
CODEX_WECHAT_VSCODE_KILL_BEFORE_LAUNCH=false
```

## Start flow

1. Run `npm.cmd run login`
2. Set `CODEX_WECHAT_CODEX_ENDPOINT`
3. Run `npm.cmd start`

If the endpoint is correct, the app will connect over WebSocket and never try to spawn a local `codex` process.
