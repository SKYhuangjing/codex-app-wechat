"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

if (process.platform !== "darwin") {
  console.error("[codex-wechat] autostart uninstall currently supports macOS only.");
  process.exit(1);
}

const label = "com.skyhuangjing.codex-wechat.autostart";
const userId = process.getuid();
const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${label}.plist`);

runLaunchctl(["bootout", `gui/${userId}`, plistPath], false);
runLaunchctl(["remove", label], false);

if (fs.existsSync(plistPath)) {
  fs.unlinkSync(plistPath);
}

console.log(`[codex-wechat] autostart removed: ${plistPath}`);

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
