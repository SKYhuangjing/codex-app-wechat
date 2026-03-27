"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
const START_SCRIPT = path.join(PLUGIN_ROOT, "bin", "codex-wechat.js");
const STATE_DIR = path.join(os.homedir(), ".codex-wechat");
const LOG_DIR = path.join(STATE_DIR, "logs");
const MONITOR_LOG = path.join(LOG_DIR, "autostart-monitor.log");
const BRIDGE_LOG = path.join(LOG_DIR, "autostart-bridge.log");
const POLL_MS = normalizePollMs(process.env.CODEX_WECHAT_AUTOSTART_POLL_MS);

fs.mkdirSync(LOG_DIR, { recursive: true });

let launching = false;

log(`monitor started, poll=${POLL_MS}ms`);
runCheck();
setInterval(runCheck, POLL_MS);

function runCheck() {
  if (launching) {
    return;
  }
  if (!isCodexRunning()) {
    return;
  }
  if (isBridgeRunning()) {
    return;
  }

  launchBridge();
}

function isCodexRunning() {
  const result = spawnSync("pgrep", ["-x", "Codex"], { encoding: "utf8" });
  return result.status === 0;
}

function isBridgeRunning() {
  const result = spawnSync("ps", ["-ax", "-o", "pid=,command="], { encoding: "utf8" });
  if (result.status !== 0 || typeof result.stdout !== "string") {
    return false;
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .some((line) => isBridgeProcessLine(line));
}

function isBridgeProcessLine(line) {
  if (line.includes("autostart-monitor.js")) {
    return false;
  }

  const normalized = line.replace(/\s+/g, " ");
  return (
    normalized.includes(`${START_SCRIPT} start`) ||
    normalized.includes("./bin/codex-wechat.js start") ||
    normalized.includes("bin/codex-wechat.js start")
  );
}

function launchBridge() {
  launching = true;
  log("Codex detected without bridge, launching codex-wechat");

  const logFd = fs.openSync(BRIDGE_LOG, "a");
  const child = spawn(process.execPath, [START_SCRIPT, "start"], {
    cwd: PLUGIN_ROOT,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      CODEX_WECHAT_AUTOSTART: "1",
    },
  });

  child.unref();
  fs.closeSync(logFd);

  setTimeout(() => {
    launching = false;
  }, 3000);
}

function normalizePollMs(rawValue) {
  const value = Number.parseInt(String(rawValue || "10000").trim(), 10);
  if (!Number.isFinite(value) || value < 3000) {
    return 10000;
  }
  return value;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(MONITOR_LOG, line);
}
