"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

if (process.platform !== "darwin") {
  console.error("[codex-wechat] autostart install currently supports macOS only.");
  process.exit(1);
}

const pluginRoot = path.resolve(__dirname, "..");
const nodeBin = process.execPath;
const userId = process.getuid();
const label = "com.skyhuangjing.codex-wechat.autostart";
const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
const plistPath = path.join(launchAgentsDir, `${label}.plist`);
const logDir = path.join(os.homedir(), ".codex-wechat", "logs");
const stdoutPath = path.join(logDir, "launchd-autostart.log");
const stderrPath = path.join(logDir, "launchd-autostart.err.log");
const monitorScript = path.join(pluginRoot, "scripts", "autostart-monitor.js");

fs.mkdirSync(launchAgentsDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const plist = buildPlist({
  label,
  nodeBin,
  monitorScript,
  pluginRoot,
  stdoutPath,
  stderrPath,
});

fs.writeFileSync(plistPath, plist, "utf8");

bootout(label, plistPath, userId);
runLaunchctl(["bootstrap", `gui/${userId}`, plistPath], true);
runLaunchctl(["kickstart", "-k", `gui/${userId}/${label}`], true);

console.log(`[codex-wechat] autostart installed: ${plistPath}`);
console.log("[codex-wechat] Codex.app running时，monitor 会自动拉起 bridge。");

function buildPlist({
  label: currentLabel,
  nodeBin: currentNodeBin,
  monitorScript: currentMonitorScript,
  pluginRoot: currentPluginRoot,
  stdoutPath: currentStdoutPath,
  stderrPath: currentStderrPath,
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${escapeXml(currentLabel)}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(currentNodeBin)}</string>
    <string>${escapeXml(currentMonitorScript)}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${escapeXml(currentPluginRoot)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${escapeXml(currentStdoutPath)}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(currentStderrPath)}</string>
</dict>
</plist>
`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function bootout(currentLabel, currentPlistPath, currentUserId) {
  runLaunchctl(["bootout", `gui/${currentUserId}`, currentPlistPath], false);
  runLaunchctl(["remove", currentLabel], false);
}

function runLaunchctl(args, required) {
  const result = spawnSync("launchctl", args, { encoding: "utf8" });
  if (result.status === 0) {
    return;
  }
  if (!required) {
    return;
  }

  const stderr = String(result.stderr || "").trim();
  const stdout = String(result.stdout || "").trim();
  const details = stderr || stdout || `exit=${result.status}`;
  console.error(`[codex-wechat] launchctl ${args.join(" ")} failed: ${details}`);
  process.exit(1);
}
