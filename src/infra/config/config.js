const path = require("path");
const os = require("os");

const TRUE_ENV_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_ENV_VALUES = new Set(["0", "false", "no", "off"]);
const ALLOWED_ACCESS_MODES = new Set(["default", "full-access"]);

function readConfig() {
  const mode = process.argv[2] || "";
  const stateDir = readTextEnv("CODEX_WECHAT_STATE_DIR") || path.join(os.homedir(), ".codex-wechat");

  return {
    mode,
    baseUrl: readTextEnv("CODEX_WECHAT_BASE_URL") || "https://ilinkai.weixin.qq.com",
    cdnBaseUrl: readTextEnv("CODEX_WECHAT_CDN_BASE_URL") || "https://novac2c.cdn.weixin.qq.com/c2c",
    qrBotType: readTextEnv("CODEX_WECHAT_QR_BOT_TYPE") || "3",
    proxyUrl: readTextEnv("CODEX_WECHAT_PROXY_URL"),
    vscode: {
      launchOnStart: readBooleanEnv("CODEX_WECHAT_VSCODE_LAUNCH_ON_START", false),
      command: readTextEnv("CODEX_WECHAT_VSCODE_COMMAND"),
      killBeforeLaunch: readBooleanEnv("CODEX_WECHAT_VSCODE_KILL_BEFORE_LAUNCH", false),
    },
    accountId: readTextEnv("CODEX_WECHAT_ACCOUNT_ID"),
    allowedUserIds: readListEnv("CODEX_WECHAT_ALLOWED_USER_IDS"),
    workspaceAllowlist: readListEnv("CODEX_WECHAT_WORKSPACE_ALLOWLIST"),
    codexEndpoint: process.env.CODEX_WECHAT_CODEX_ENDPOINT || "",
    codexCommand: process.env.CODEX_WECHAT_CODEX_COMMAND || "",
    defaultCodexModel: readTextEnv("CODEX_WECHAT_DEFAULT_CODEX_MODEL"),
    defaultCodexEffort: readTextEnv("CODEX_WECHAT_DEFAULT_CODEX_EFFORT"),
    defaultCodexAccessMode: readAccessModeEnv("CODEX_WECHAT_DEFAULT_CODEX_ACCESS_MODE") || "default",
    enableTyping: readBooleanEnv("CODEX_WECHAT_ENABLE_TYPING", true),
    defaultWorkspaceRoot: readTextEnv("CODEX_WECHAT_DEFAULT_WORKSPACE"),
    defaultWorkspaceId: process.env.CODEX_WECHAT_DEFAULT_WORKSPACE_ID || "default",
    stateDir,
    accountsDir: path.join(stateDir, "accounts"),
    sessionsFile: process.env.CODEX_WECHAT_SESSIONS_FILE || path.join(stateDir, "sessions.json"),
    syncBufferDir: process.env.CODEX_WECHAT_SYNC_BUFFER_DIR || path.join(stateDir, "sync-buf"),
  };
}

function readListEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBooleanEnv(name, defaultValue) {
  const rawValue = process.env[name];
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (TRUE_ENV_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_ENV_VALUES.has(normalized)) {
    return false;
  }
  return defaultValue;
}

function readTextEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function readAccessModeEnv(name) {
  const value = readTextEnv(name).toLowerCase();
  return ALLOWED_ACCESS_MODES.has(value) ? value : "";
}

function readPositiveIntEnv(name, defaultValue) {
  const rawValue = process.env[name];
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return defaultValue;
  }
  const value = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isFinite(value) || value <= 0) {
    return defaultValue;
  }
  return value;
}

module.exports = { readConfig };
