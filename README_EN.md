# codex-wechat

[中文 README](./README.md)

## Overview

`codex-wechat` is a WeChat-first local bridge for Codex, now packaged as a local Codex plugin that can be discovered and distributed in a Codex environment.

Architecture:

`WeChat App -> codex-wechat -> Codex app-server / endpoint -> WeChat App`

Current repository:

- GitHub: [SKYhuangjing/codex-app-wechat](https://github.com/SKYhuangjing/codex-app-wechat)

## What Changed In This Version

- Added standard Codex plugin files:
  `.codex-plugin/plugin.json`, `.app.json`, `.mcp.json`, `hooks.json`, and `skills/wechat-bridge-setup/SKILL.md`
- Added plugin docs and icon assets so the project can be packaged and distributed as a local Codex plugin
- The bridge now recommends using the bundled `codex` binary from `Codex.app` to avoid thread visibility issues caused by app/server version mismatch
- `/codex bind` now supports:
  1. absolute paths
  2. relative project paths under the allowlist root, for example `/codex bind agent`
- Switching to a project with no existing thread no longer requires a manual `/codex new`
  The next plain text message will automatically start a new thread
- Existing projects still resume their previous threads when available

## Current Capabilities

- QR-code login for WeChat with local account token storage
- Route WeChat text messages to Codex
- Keep workspace bindings and thread state per project
- Support approval flow inside WeChat:
  - `/codex approve`
  - `/codex approve workspace`
  - `/codex reject`
- Support switching between multiple projects
- Persist WeChat messages as real Codex threads

## Codex Plugin Layout

The repository now includes the core files required for a local Codex plugin:

- `.codex-plugin/plugin.json`
- `.app.json`
- `.mcp.json`
- `hooks.json`
- `skills/wechat-bridge-setup/SKILL.md`

When distributing the plugin, use a clean package and do not include local runtime data such as `.env`, `.codex-wechat/`, or `node_modules/`.

## Install From Source Into Codex

The easiest option:

- Ask Codex to install it directly from this Git URL:
  `https://github.com/SKYhuangjing/codex-app-wechat.git`

If you prefer a manual setup, follow the official local marketplace workflow below.

1. After downloading or cloning the source, copy the plugin directory into `~/.codex/plugins/codex-wechat`

```bash
mkdir -p ~/.codex/plugins
cp -R /absolute/path/to/codex-wechat ~/.codex/plugins/codex-wechat
```

2. Create or update `~/.agents/plugins/marketplace.json` so the plugin entry points to that directory through `source.path`

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

3. Restart Codex and verify that the plugin appears in the plugin list

Notes:

- `marketplace.json` lives at `~/.agents/plugins/marketplace.json`
- plugin directories live under `~/.codex/plugins/`
- If you are copying from a development checkout, remove `.env`, `.codex-wechat/`, and `node_modules/` before copying
- After installation, finish dependency install and local configuration inside `~/.codex/plugins/codex-wechat`

## Quick Start

```bash
cd ~/.codex/plugins/codex-wechat
npm install
cp .env.example .env
```

Minimum startup flow:

1. Configure `.env`
2. Run `npm run login`
3. Run `npm start`
4. Send commands or plain text messages in WeChat

## Auto-Connect With Codex

The current local Codex plugin format does not expose a clear `onStart` or `autoActivate` lifecycle hook, so this repository implements the closest macOS-native alternative:

- install a local `LaunchAgent`
- keep a lightweight monitor running
- automatically start `codex-wechat` when `Codex.app` is detected and the bridge is not running yet

Enable it with:

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:install
```

Disable it with:

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:uninstall
```

Notes:

- macOS only for now
- this auto-connect flow does not modify the official Codex plugin lifecycle
- monitor logs are written to `~/.codex-wechat/logs/autostart-monitor.log`
- bridge startup logs are written to `~/.codex-wechat/logs/autostart-bridge.log`

## Recommended Configuration

Prefer using the `codex` executable bundled inside `Codex.app` so the bridge and the desktop app stay on the same version:

```env
CODEX_WECHAT_PROXY_CODEX_EXECUTABLE=/Applications/Codex.app/Contents/Resources/codex
```

Recommended minimum config:

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

Notes:

- If `CODEX_WECHAT_CODEX_ENDPOINT` is set, the bridge connects directly to that WebSocket endpoint
- If it is not set, the bridge starts a local proxy via `CODEX_WECHAT_PROXY_CODEX_EXECUTABLE`
- `CODEX_WECHAT_ALLOWED_USER_IDS` should not be left empty in production use

## Multi-Project Switching

The current version supports switching projects by relative path under the allowlist root.

For example, if the allowlist is:

```env
CODEX_WECHAT_WORKSPACE_ALLOWLIST=/path/to/workspaces
```

You can switch projects in WeChat with:

```text
/codex bind agent
/codex bind control
/codex bind some/nested/project
```

Absolute paths are still supported:

```text
/codex bind /path/to/workspaces/agent
```

Behavior:

- If the target project already has a historical thread, `bind` resumes that thread
- If the target project has no historical thread, `bind` enters a new-thread draft state
- The next plain text message automatically creates a new thread

## WeChat Commands

- `/codex bind <absolute-path|relative-project-path>`
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

Plain text messages are forwarded to the active Codex thread for the current workspace.

## Codex Desktop Visibility

WeChat messages are written into real Codex threads, but whether they appear immediately in the desktop UI still depends on project indexing and app-side visibility rules.

Recommended practice:

- Add the workspace to Codex Desktop as a Project first
- Keep the bridge and desktop app on the same `codex` version
- After switching to a project with no thread history, send one plain text message to create the new session

## Project Isolation

If you want full separation between repositories, use a different `CODEX_WECHAT_STATE_DIR` for each project. This isolates:

- saved WeChat account data
- sync buffer state
- Codex session / thread mappings

## Notes

- The main target is WeChat text-command workflow, not Feishu card workflow
- Markdown is flattened into plain text for WeChat delivery
- Set `CODEX_WECHAT_PROXY_URL` if you need a proxy or VPN
- Never commit `.env`, `.codex-wechat/`, or other local login/runtime state
