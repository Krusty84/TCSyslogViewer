import { getAiConfiguration } from "./agentConfig.js";
import { createSyslogToolbox } from "./tools.js";

const PROVIDERS = new Map([
  [
    "deepseek",
    {
      url: "https://api.deepseek.com/v1/chat/completions",
      defaultModel: "deepseek-chat",
      requiresKey: true,
    },
  ],
  [
    "openai",
    {
      url: "https://api.openai.com/v1/chat/completions",
      defaultModel: "gpt-4o-mini",
      requiresKey: true,
    },
  ],
  [
    "ollama",
    {
      url: "http://localhost:11434/v1/chat/completions",
      defaultModel: "llama3",
      requiresKey: false,
    },
  ],
]);

function normalizeContent(content) {
  if (!content) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((entry) => (typeof entry === "string" ? entry : entry?.text ?? ""))
      .join("\n");
  }
  if (typeof content === "object") {
    return content.text ?? JSON.stringify(content);
  }
  return String(content);
}

function conciseSample(text, maxLength = 6000) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const head = text.slice(0, Math.round(maxLength * 0.7));
  const tail = text.slice(-Math.round(maxLength * 0.3));
  return `${head}\n...snip...\n${tail}`;
}

export class SyslogAiAgent {
  constructor() {
    this.toolbox = createSyslogToolbox(() => this.activeContext);
    this.refreshConfiguration();
  }

  refreshConfiguration() {
    this.config = getAiConfiguration();
    const provider = PROVIDERS.get(this.config.provider) ?? PROVIDERS.get("deepseek");
    this.provider = provider;
    this.model = this.config.model || provider.defaultModel;
    this.requiresKey = provider.requiresKey !== false;
  }

  getDisplayName() {
    const providerLabel = (this.config.provider ?? "LLM").replace(
      /^\w/,
      (ch) => ch.toUpperCase()
    );
    return `${providerLabel}: ${this.model}`;
  }

  async sendMessage({ document, selectionText, userMessage, history = [] }) {
    if (!document) {
      throw new Error("No active syslog document to analyze.");
    }
    if (!userMessage || !userMessage.trim()) {
      throw new Error("Message is empty.");
    }
    const text = document.getText();
    const sample = conciseSample(text);
    this.activeContext = {
      text,
      uri: document.uri,
      document,
    };

    const selectionContext = selectionText?.trim();

    const messages = [
      {
        role: "system",
        content:
          "You are an MCP-compliant diagnostics assistant for Siemens Teamcenter syslogs. Use available tools for evidence before responding.",
      },
      ...history,
      {
        role: "user",
        content: [
          userMessage.trim(),
          selectionContext ? `Relevant selection:\n${selectionContext}` : undefined,
          `Document excerpt:\n${sample}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];

    const toolPayload = this.toolbox.definitions.map((def) => ({
      type: "function",
      function: def,
    }));

    try {
      let response = await this.callModel(messages, toolPayload);
      while (response?.tool_calls?.length) {
        messages.push(response);
        for (const toolCall of response.tool_calls) {
          const handler = this.toolbox.handlers[toolCall.function?.name];
          if (!handler) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Tool ${toolCall.function?.name} is not implemented.`,
            });
            continue;
          }
          try {
            const args = toolCall.function?.arguments
              ? JSON.parse(toolCall.function.arguments)
              : {};
            const result = await handler(args);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (error) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error: ${error.message}`,
            });
          }
        }
        response = await this.callModel(messages, toolPayload);
      }

      const summary = normalizeContent(response?.content);
      if (!summary) {
        throw new Error("AI response was empty.");
      }
      return {
        summary,
        provider: this.getDisplayName(),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Syslog AI agent error", error);
      throw error;
    }
  }

  async callModel(messages, tools) {
    if (this.requiresKey && !this.config.apiKey) {
      throw new Error("AI API key is not configured. Update tcSyslogViewer.ai.apiKey in settings.");
    }
    const body = {
      model: this.model,
      messages,
      tools,
      tool_choice: "auto",
    };
    const response = await fetch(this.provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI request failed (${response.status}): ${text}`);
    }
    const payload = await response.json();
    const message = payload?.choices?.[0]?.message;
    if (!message) {
      throw new Error("AI provider returned no choices");
    }
    return message;
  }

}
