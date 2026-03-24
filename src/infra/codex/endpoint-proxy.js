const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBundledCodexExecutablePath() {
  const extensionRoot = findLatestOpenAICodexExtensionRoot();
  if (!extensionRoot) {
    return "";
  }

  if (os.platform() === "win32") {
    const winPath = path.join(extensionRoot, "bin", "windows-x86_64", "codex.exe");
    if (fs.existsSync(winPath)) {
      return winPath;
    }
    const runnerPath = path.join(extensionRoot, "bin", "windows-x86_64", "codex-command-runner.exe");
    if (fs.existsSync(runnerPath)) {
      return runnerPath;
    }
  }

  if (os.platform() === "darwin") {
    const armPath = path.join(extensionRoot, "bin", "darwin-arm64", "codex");
    if (fs.existsSync(armPath)) {
      return armPath;
    }
    const x64Path = path.join(extensionRoot, "bin", "darwin-x86_64", "codex");
    if (fs.existsSync(x64Path)) {
      return x64Path;
    }
  }

  if (os.platform() === "linux") {
    const linuxPath = path.join(extensionRoot, "bin", "linux-x86_64", "codex");
    if (fs.existsSync(linuxPath)) {
      return linuxPath;
    }
  }

  return "";
}

function findLatestOpenAICodexExtensionRoot() {
  const extensionsDir = path.join(os.homedir(), ".vscode", "extensions");
  if (!fs.existsSync(extensionsDir)) {
    return "";
  }

  const entries = fs.readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("openai.chatgpt-"))
    .map((entry) => {
      const fullPath = path.join(extensionsDir, entry.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(fullPath).mtimeMs;
      } catch {
        mtimeMs = 0;
      }
      return { fullPath, name: entry.name, mtimeMs };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs || right.name.localeCompare(left.name));

  return entries[0]?.fullPath || "";
}

function createLocalCodexEndpointUrl(port) {
  return `ws://127.0.0.1:${port}`;
}

async function startLocalCodexEndpointProxy({ env = process.env } = {}) {
  const codexExecutable = normalizeText(process.env.CODEX_WECHAT_PROXY_CODEX_EXECUTABLE) || getBundledCodexExecutablePath();
  if (!codexExecutable) {
    throw new Error(
      "Unable to locate the bundled Codex executable from the OpenAI VSCode extension. "
        + "Set CODEX_WECHAT_CODEX_ENDPOINT manually or install the extension."
    );
  }

  const wss = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await new Promise((resolve, reject) => {
    wss.once("listening", resolve);
    wss.once("error", reject);
  });

  const address = wss.address();
  const port = typeof address === "object" && address ? address.port : null;
  if (!port) {
    wss.close();
    throw new Error("Failed to allocate a local Codex endpoint proxy port");
  }

  wss.on("connection", (socket) => {
    const child = spawn(codexExecutable, ["app-server"], {
      env: { ...env },
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });

    let stdoutBuffer = "";

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString("utf8");
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && socket.readyState === 1) {
          socket.send(trimmed);
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString("utf8").trim();
      if (text) {
        console.error(`[codex-proxy] codex stderr: ${text}`);
      }
    });

    child.on("error", (error) => {
      console.error(`[codex-proxy] failed to spawn bundled Codex: ${error.message}`);
      try {
        socket.close();
      } catch {
        // ignore
      }
    });

    child.on("close", (code) => {
      console.error(`[codex-proxy] bundled Codex exited with code ${code}`);
      try {
        socket.close();
      } catch {
        // ignore
      }
    });

    socket.on("message", (chunk) => {
      const message = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      if (!child.stdin.writable) {
        return;
      }
      child.stdin.write(`${message}\n`);
    });

    socket.on("close", () => {
      if (child.exitCode == null) {
        child.kill();
      }
    });
  });

  return {
    endpoint: createLocalCodexEndpointUrl(port),
    close: () => new Promise((resolve) => wss.close(() => resolve())),
    executable: codexExecutable,
  };
}

module.exports = {
  findLatestOpenAICodexExtensionRoot,
  getBundledCodexExecutablePath,
  startLocalCodexEndpointProxy,
};
