import * as vscode from "vscode";
import { SyslogAiAgent } from "../ai/syslogAiAgent.js";
import { getAiDisplayName } from "../ai/agentConfig.js";

function cloneMessages(messages) {
  return messages.map((message) => ({ ...message }));
}

export class AiChatManager {
  constructor(context) {
    this.context = context;
    this.agent = new SyslogAiAgent();
    this.messages = [];
    this._onDidChange = new vscode.EventEmitter();
    this.onDidChange = this._onDidChange.event;

    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("tcSyslogViewer.ai")) {
          this.agent.refreshConfiguration();
          this._onDidChange.fire(this.getMessages());
        }
      })
    );
  }

  getDisplayName() {
    return getAiDisplayName();
  }
  getAgentInfo() {
    return {
      provider: this.agent?.config?.provider ?? "LLM",
      model: this.agent?.model ?? this.agent?.config?.model ?? "model",
    };
  }

  getMessages() {
    return cloneMessages(this.messages);
  }

  resetConversation() {
    if (!this.messages.length) {
      return;
    }
    this.messages = [];
    this._onDidChange.fire(this.getMessages());
  }

  async sendMessage(document, { selectionText, userMessage }) {
    const trimmed = userMessage?.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty.");
    }

    const selection = selectionText?.trim();
    const userEntry = {
      id: `${Date.now().toString(36)}-user`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    this.messages.push(userEntry);
    this._onDidChange.fire(this.getMessages());

    const history = this.messages
      .slice(0, -1)
      .map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: message.content,
      }));

    try {
      const response = await this.agent.sendMessage({
        document,
        selectionText: selection,
        userMessage: trimmed,
        history,
      });
      const assistantEntry = {
        id: `${Date.now().toString(36)}-assistant`,
        role: "assistant",
        content: response.summary,
        provider: response.provider,
        timestamp: new Date(),
      };
      this.messages.push(assistantEntry);
      this._onDidChange.fire(this.getMessages());
      return assistantEntry;
    } catch (error) {
      const assistantEntry = {
        id: `${Date.now().toString(36)}-assistant-error`,
        role: "assistant",
        content: error instanceof Error ? error.message : String(error),
        provider: `${this.getDisplayName()} (error)` ,
        timestamp: new Date(),
      };
      this.messages.push(assistantEntry);
      this._onDidChange.fire(this.getMessages());
      throw error;
    }
  }
}
