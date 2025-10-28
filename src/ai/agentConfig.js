import * as vscode from "vscode";

const CONFIG_SECTION = "tcSyslogViewer.ai";

function read(section, key, fallback) {
  const value = section.get(key);
  return value === undefined ? fallback : value;
}

export function getAiConfiguration() {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const provider = read(config, "provider", "deepseek");
  const model = read(config, "model", "deepseek-chat");
  const apiKey = read(config, "apiKey", "");
  const workspaceRoot = read(config, "workspace", "${workspaceFolder}");
  return {
    provider,
    model,
    apiKey,
    workspaceRoot,
  };
}

export function getAiDisplayName() {
  const { provider, model } = getAiConfiguration();
  const providerLabel = provider?.trim()
    ? provider.trim().replace(/^[a-z]/, (ch) => ch.toUpperCase())
    : "LLM";
  return `${providerLabel}: ${model || "model"}`;
}
