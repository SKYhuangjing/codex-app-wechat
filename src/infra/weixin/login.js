const qrcodeTerminal = require("qrcode-terminal");

const { saveWeixinAccount } = require("./account-store");

const ACTIVE_LOGIN_TTL_MS = 5 * 60_000;
const QR_LONG_POLL_TIMEOUT_MS = 35_000;
const MAX_QR_REFRESH_COUNT = 3;

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

async function fetchQrCode(apiBaseUrl, botType) {
  const base = ensureTrailingSlash(apiBaseUrl);
  const url = new URL(`ilink/bot/get_bot_qrcode?bot_type=${encodeURIComponent(botType)}`, base);
  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(`获取二维码失败：${response.status} ${response.statusText} ${body}`);
  }
  return normalizeQrCodeResponse(await response.json());
}

async function pollQrStatus(apiBaseUrl, qrcode) {
  const base = ensureTrailingSlash(apiBaseUrl);
  const url = new URL(`ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`, base);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QR_LONG_POLL_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "iLink-App-ClientVersion": "1",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`获取二维码状态失败：${response.status} ${response.statusText} ${rawText}`);
    }
    return JSON.parse(rawText);
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "wait" };
    }
    throw error;
  }
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeQrCodeResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return { raw: payload, qrcode_img_content: "", qrcode: "" };
  }

  const qrcode_img_content = pickFirstString([
    payload.qrcode_img_content,
    payload.qrcode_content,
    payload.qrcode_url,
    payload.qrcode,
    payload.data?.qrcode_img_content,
    payload.data?.qrcode_content,
    payload.data?.qrcode_url,
    payload.data?.qrcode,
    payload.result?.qrcode_img_content,
    payload.result?.qrcode_content,
    payload.result?.qrcode_url,
    payload.result?.qrcode,
  ]);

  const qrcode = pickFirstString([
    payload.qrcode,
    payload.data?.qrcode,
    payload.result?.qrcode,
    qrcode_img_content,
  ]);

  return {
    ...payload,
    qrcode_img_content,
    qrcode,
    raw: payload,
  };
}

function printQrCode(content) {
  if (!content) {
    console.log("[codex-wechat] 未能从接口响应中解析二维码内容。");
    return false;
  }
  try {
    qrcodeTerminal.generate(content, { small: true });
  } catch {
    console.log(content);
  }
  return true;
}

function dumpRawQrResponse(qrResponse) {
  const raw = qrResponse?.raw || qrResponse;
  console.log("[codex-wechat] 原始二维码响应：");
  try {
    console.log(JSON.stringify(raw, null, 2));
  } catch {
    console.log(String(raw));
  }
}

async function waitForWeixinLogin({ apiBaseUrl, botType, timeoutMs }) {
  let qrResponse = await fetchQrCode(apiBaseUrl, botType);
  let startedAt = Date.now();
  let scannedPrinted = false;
  let refreshCount = 1;

  console.log("[codex-wechat] 正在启动微信扫码登录...");
  console.log("请使用微信扫描以下二维码完成连接：");
  if (!printQrCode(qrResponse.qrcode_img_content)) {
    dumpRawQrResponse(qrResponse);
  }
  console.log("\n等待连接结果...\n");

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (Date.now() - startedAt > ACTIVE_LOGIN_TTL_MS) {
      qrResponse = await fetchQrCode(apiBaseUrl, botType);
      startedAt = Date.now();
      scannedPrinted = false;
      refreshCount += 1;
      if (refreshCount > MAX_QR_REFRESH_COUNT) {
        throw new Error("二维码多次过期，请重新执行 login");
      }
      console.log(`二维码已过期，正在刷新...(${refreshCount}/${MAX_QR_REFRESH_COUNT})\n`);
      if (!printQrCode(qrResponse.qrcode_img_content)) {
        dumpRawQrResponse(qrResponse);
      }
    }

    const statusResponse = await pollQrStatus(apiBaseUrl, qrResponse.qrcode);
    switch (statusResponse.status) {
      case "wait":
        process.stdout.write(".");
        break;
      case "scaned":
      case "scanned":
        if (!scannedPrinted) {
          process.stdout.write("\n已扫描，等待手机端确认...\n");
          scannedPrinted = true;
        }
        break;
      case "expired":
        qrResponse = await fetchQrCode(apiBaseUrl, botType);
        startedAt = Date.now();
        scannedPrinted = false;
        refreshCount += 1;
        if (refreshCount > MAX_QR_REFRESH_COUNT) {
          throw new Error("二维码多次过期，请重新执行 login");
        }
        console.log(`二维码已过期，正在刷新...(${refreshCount}/${MAX_QR_REFRESH_COUNT})\n`);
        if (!printQrCode(qrResponse.qrcode_img_content)) {
          dumpRawQrResponse(qrResponse);
        }
        break;
      case "confirmed":
        if (!statusResponse.bot_token || !statusResponse.ilink_bot_id) {
          throw new Error("登录成功后缺少 bot token 或 bot ID");
        }
        return {
          accountId: statusResponse.ilink_bot_id,
          token: statusResponse.bot_token,
          baseUrl: statusResponse.baseurl || apiBaseUrl,
          userId: statusResponse.ilink_user_id || "",
        };
      default:
        break;
    }
  }

  throw new Error("二维码登录超时，请重新执行 login");
}

async function runLoginFlow(config) {
  const result = await waitForWeixinLogin({
    apiBaseUrl: config.baseUrl,
    botType: config.qrBotType,
    timeoutMs: 480_000,
  });
  const account = saveWeixinAccount(config, result.accountId, result);
  console.log("\n登录成功，账号信息已保存。");
  console.log(`accountId: ${account.accountId}`);
  console.log(`userId: ${account.userId || "(unknown)"}`);
  console.log(`baseUrl: ${account.baseUrl}`);
}

module.exports = {
  runLoginFlow,
};
