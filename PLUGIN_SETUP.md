# Codex WeChat Plugin Setup

This local plugin wraps the upstream `codex-wechat` bridge so CodexApp can discover it from your local marketplace.

## Files added for Codex plugin support

- `.codex-plugin/plugin.json`
- `.app.json`
- `.mcp.json`
- `hooks.json`
- `skills/wechat-bridge-setup/SKILL.md`

## Local install path

- Plugin root: `/Users/sky/plugins/codex-wechat`
- Marketplace: `/Users/sky/.agents/plugins/marketplace.json`

## First run

```bash
cd /Users/sky/plugins/codex-wechat
npm install
cp .env.example .env
```

Then edit `.env` and set at minimum:

- `CODEX_WECHAT_ALLOWED_USER_IDS`
- `CODEX_WECHAT_DEFAULT_WORKSPACE`
- `CODEX_WECHAT_WORKSPACE_ALLOWLIST`
- `CODEX_WECHAT_CODEX_ENDPOINT`

Login and start:

```bash
cd /Users/sky/plugins/codex-wechat
npm run login
npm start
```

## Notes

- This is a local bridge plugin, not a hosted WeChat connector.
- If `CODEX_WECHAT_CODEX_ENDPOINT` is empty, the bridge will try to create a local endpoint proxy from VSCode Codex.
- Keep the WeChat user allowlist tight before exposing any writable workspace.
