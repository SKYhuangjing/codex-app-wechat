function handleQuotaCommand(runtime, normalized) {
  const text = buildQuotaInfoText(runtime.latestRateLimits);
  return runtime.sendInfoCardMessage({
    chatId: normalized.chatId,
    replyToMessageId: normalized.messageId,
    text,
    kind: runtime.latestRateLimits ? "info" : "error",
  });
}

function updateLatestRateLimits(runtime, params) {
  const normalized = normalizeRateLimitsPayload(params?.rateLimits);
  if (!normalized) {
    return;
  }
  runtime.latestRateLimits = normalized;
}

function buildQuotaInfoText(rateLimits) {
  if (!rateLimits) {
    return [
      "**当前 Codex 额度**",
      "",
      "暂时还没有收到额度数据。",
      "通常在一次 Codex turn 开始后，app-server 才会推送最新额度状态。",
      "你可以先发一条普通消息，再执行 `/codex quota` 查看。",
    ].join("\n");
  }

  const lines = [
    "**当前 Codex 额度**",
    "",
    `套餐：${rateLimits.planType || "unknown"}`,
    ...buildQuotaStatusLines(rateLimits),
  ].filter(Boolean);

  if (rateLimits.credits) {
    lines.push(`Credits：${rateLimits.credits}`);
  }

  return lines.join("\n");
}

function buildQuotaStatusLines(rateLimits) {
  if (!rateLimits) {
    return ["额度：暂时还没有收到最新数据"];
  }

  return [
    buildWindowLine(resolveWindowLabel(rateLimits.primary, "主额度窗口"), rateLimits.primary),
    buildWindowLine(resolveWindowLabel(rateLimits.secondary, "次额度窗口"), rateLimits.secondary),
  ].filter(Boolean);
}

function buildWindowLine(label, windowInfo) {
  if (!windowInfo) {
    return `${label}：unknown`;
  }
  const usedPercent = Number.isFinite(windowInfo.usedPercent) ? `${windowInfo.usedPercent}%` : "unknown";
  const remainingPercent = Number.isFinite(windowInfo.usedPercent)
    ? `${Math.max(0, 100 - windowInfo.usedPercent)}%`
    : "unknown";
  const resetAtText = windowInfo.resetsAt ? formatUnixTimestamp(windowInfo.resetsAt) : "unknown";
  const durationText = Number.isFinite(windowInfo.windowDurationMins)
    ? `${windowInfo.windowDurationMins} 分钟`
    : "unknown";
  return `${label}：已用 ${usedPercent}，剩余 ${remainingPercent}，窗口 ${durationText}，重置时间 ${resetAtText}`;
}

function resolveWindowLabel(windowInfo, fallbackLabel) {
  const durationMins = Number(windowInfo?.windowDurationMins);
  if (!Number.isFinite(durationMins) || durationMins <= 0) {
    return fallbackLabel;
  }
  if (durationMins === 300) {
    return "五小时窗口";
  }
  if (durationMins === 10080) {
    return "周窗口";
  }
  return fallbackLabel;
}

function normalizeRateLimitsPayload(rateLimits) {
  if (!rateLimits || typeof rateLimits !== "object") {
    return null;
  }

  return {
    limitId: normalizeText(rateLimits.limitId),
    limitName: normalizeText(rateLimits.limitName),
    planType: normalizeText(rateLimits.planType),
    credits: normalizeCredits(rateLimits.credits),
    primary: normalizeWindow(rateLimits.primary),
    secondary: normalizeWindow(rateLimits.secondary),
  };
}

function normalizeWindow(windowInfo) {
  if (!windowInfo || typeof windowInfo !== "object") {
    return null;
  }

  return {
    usedPercent: normalizeNumber(windowInfo.usedPercent),
    windowDurationMins: normalizeNumber(windowInfo.windowDurationMins),
    resetsAt: normalizeNumber(windowInfo.resetsAt),
  };
}

function normalizeCredits(value) {
  if (value == null) {
    return "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return normalizeText(String(value));
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function formatUnixTimestamp(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "unknown";
  }
  return new Date(seconds * 1000).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  buildQuotaStatusLines,
  buildQuotaInfoText,
  handleQuotaCommand,
  updateLatestRateLimits,
};
