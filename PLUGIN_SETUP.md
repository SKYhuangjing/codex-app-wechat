# Codex WeChat Plugin Setup

This local plugin packages `codex-wechat` for local Codex discovery and distribution.

Repository:

- [SKYhuangjing/codex-app-wechat](https://github.com/SKYhuangjing/codex-app-wechat)

## Files added for Codex plugin support

- `.codex-plugin/plugin.json`
- `.app.json`
- `.mcp.json`
- `hooks.json`
- `skills/wechat-bridge-setup/SKILL.md`

## Local install path

- Plugin root: your local `codex-wechat` clone directory
- Marketplace: your local Codex marketplace config

## Install from source into Codex

The easiest option:

- Ask Codex to install it directly from:
  `https://github.com/SKYhuangjing/codex-app-wechat.git`

If you prefer the official manual local marketplace flow:

1. Copy the plugin folder into `~/.codex/plugins/codex-wechat`

```bash
mkdir -p ~/.codex/plugins
cp -R /absolute/path/to/codex-wechat ~/.codex/plugins/codex-wechat
```

2. Create or update `~/.agents/plugins/marketplace.json` so `source.path` points to `./plugins/codex-wechat`

3. Restart Codex and verify that the plugin appears

## First run

```bash
cd ~/.codex/plugins/codex-wechat
npm install
cp .env.example .env
```

Then edit `.env` and set at minimum:

- `CODEX_WECHAT_ALLOWED_USER_IDS`
- `CODEX_WECHAT_DEFAULT_WORKSPACE`
- `CODEX_WECHAT_WORKSPACE_ALLOWLIST`
- `CODEX_WECHAT_CODEX_ENDPOINT`
  or `CODEX_WECHAT_PROXY_CODEX_EXECUTABLE`

Login and start:

```bash
cd ~/.codex/plugins/codex-wechat
npm run login
npm start
```

## Auto-connect on Codex startup

There is no official plugin startup hook exposed here, so the plugin provides a macOS `LaunchAgent` based auto-connect mode instead.

Enable:

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:install
```

Disable:

```bash
cd ~/.codex/plugins/codex-wechat
npm run autostart:uninstall
```

## Notes

- This is a local bridge plugin, not a hosted WeChat connector.
- If `CODEX_WECHAT_CODEX_ENDPOINT` is empty, the bridge can create a local endpoint proxy from the `codex` binary bundled with `Codex.app`.
- Keep the WeChat user allowlist tight before exposing any writable workspace.
