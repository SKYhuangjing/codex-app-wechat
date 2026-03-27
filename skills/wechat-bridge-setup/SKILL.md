---
name: wechat-bridge-setup
description: Configure, validate, and troubleshoot the local Codex-WeChat bridge plugin. Use when the user wants to connect CodexApp with WeChat, set environment variables, log in, start the bridge, bind a workspace, or debug bridge startup.
---

# WeChat Bridge Setup

## What this plugin wraps

This plugin packages the local `codex-wechat` Node.js bridge as a Codex plugin entry.

Repository:

- `https://github.com/SKYhuangjing/codex-app-wechat`

The bridge path is:

- your local `codex-wechat` plugin directory

It does not create a remote WeChat connector inside Codex. Instead, it installs a local plugin entry plus setup guidance for the existing Node bridge.

## Setup flow

1. Install dependencies in the plugin directory:

```bash
cd /path/to/codex-wechat
npm install
```

2. Create a local `.env` from `.env.example` and fill the required fields:

- `CODEX_WECHAT_ALLOWED_USER_IDS`
- `CODEX_WECHAT_DEFAULT_WORKSPACE`
- `CODEX_WECHAT_WORKSPACE_ALLOWLIST`
- `CODEX_WECHAT_CODEX_ENDPOINT`
  or `CODEX_WECHAT_PROXY_CODEX_EXECUTABLE`

3. Log in to WeChat:

```bash
cd /path/to/codex-wechat
npm run login
```

4. Start the bridge:

```bash
cd /path/to/codex-wechat
npm start
```

## Endpoint notes

- Preferred mode: set `CODEX_WECHAT_CODEX_ENDPOINT` to an existing Codex WebSocket endpoint.
- Fallback mode: leave `CODEX_WECHAT_CODEX_ENDPOINT` empty and let the bridge create a local endpoint proxy from the `codex` binary bundled with `Codex.app`.

## Workspace and safety guidance

- Keep one `CODEX_WECHAT_STATE_DIR` per project if you want thread and account isolation.
- Restrict `CODEX_WECHAT_ALLOWED_USER_IDS` so only your own WeChat account can control Codex.
- Use `CODEX_WECHAT_WORKSPACE_ALLOWLIST` if you do not want arbitrary paths bound from WeChat.

## Common commands

- `/codex bind /absolute/path`
- `/codex where`
- `/codex workspace`
- `/codex new`
- `/codex status`
- `/codex approve`
- `/codex reject`

## Troubleshooting

- If login succeeds but replies do not arrive, check `CODEX_WECHAT_CODEX_ENDPOINT` first.
- If media or QR login fails, check proxy settings in `CODEX_WECHAT_PROXY_URL`.
- If the bridge starts but cannot access a workspace, compare the requested path with `CODEX_WECHAT_WORKSPACE_ALLOWLIST`.
