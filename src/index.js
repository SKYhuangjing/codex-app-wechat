const path = require("path");
const os = require("os");
const fs = require("fs");
const dotenv = require("dotenv");

const { readConfig } = require("./infra/config/config");
const { WechatRuntime } = require("./app/wechat-runtime");
const { runLoginFlow } = require("./infra/weixin/login");
const { listWeixinAccounts } = require("./infra/weixin/account-store");
const { startLocalCodexEndpointProxy } = require("./infra/codex/endpoint-proxy");

function ensureDefaultConfigDirectory() {
  const defaultConfigDir = path.join(os.homedir(), ".codex-wechat");
  fs.mkdirSync(defaultConfigDir, { recursive: true });
}

function loadEnv() {
  ensureDefaultConfigDirectory();

  const envCandidates = [
    path.join(process.cwd(), ".env"),
    path.join(os.homedir(), ".codex-wechat", ".env"),
  ];

  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) {
      continue;
    }
    dotenv.config({ path: envPath });
    return;
  }

  dotenv.config();
}

function printHelp() {
  console.log(`
鐢ㄦ硶: codex-wechat <鍛戒护>

鍛戒护:
  login      鎵爜鐧诲綍寰俊骞朵繚瀛樿处鍙?token
  start      鍚姩寰俊 <-> 鏈湴 Codex 妗ユ帴
  accounts   鏌ョ湅鏈湴宸茬粡淇濆瓨鐨勫井淇¤处鍙?  help       鏄剧ず甯姪
`);
}

function printAccounts(config) {
  const accounts = listWeixinAccounts(config);
  if (!accounts.length) {
    console.log("No saved Weixin accounts. Run `codex-wechat login` first.");
    return;
  }

  console.log("宸蹭繚瀛樿处鍙凤細");
  for (const account of accounts) {
    console.log(`- ${account.accountId}`);
    console.log(`  userId: ${account.userId || "(unknown)"}`);
    console.log(`  baseUrl: ${account.baseUrl || config.baseUrl}`);
    console.log(`  savedAt: ${account.savedAt || "(unknown)"}`);
  }
}

async function main() {
  loadEnv();
  const config = readConfig();
  const command = config.mode || "";

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "login") {
    await runLoginFlow(config);
    return;
  }

  if (command === "accounts") {
    printAccounts(config);
    return;
  }

  if (command && command !== "start") {
    printHelp();
    process.exit(1);
  }

  let endpointProxy = null;
  if (!String(config.codexEndpoint || "").trim()) {
    endpointProxy = await startLocalCodexEndpointProxy({ env: process.env });
    config.codexEndpoint = endpointProxy.endpoint;
    console.log(`[codex-wechat] using local Codex endpoint proxy at ${endpointProxy.endpoint}`);
  }

  try {
    const runtime = new WechatRuntime(config);
    await runtime.start();
  } finally {
    if (endpointProxy) {
      await endpointProxy.close().catch(() => {});
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[codex-wechat] ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
