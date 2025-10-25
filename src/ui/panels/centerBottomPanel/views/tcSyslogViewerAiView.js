import * as vscode from "vscode";

class AiChatWebviewProvider {
  constructor(controller) {
    this.controller = controller;
    this.disposable = undefined;
    this.webviewView = undefined;
  }

  resolveWebviewView(webviewView) {
    this.webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.buildHtml();
    this.postHistory();
    this.registerListeners(webviewView);
  }

  dispose() {
    this.disposable?.dispose();
    this.disposable = undefined;
  }

  registerListeners(webviewView) {
    const disposables = [];
    disposables.push(
      webviewView.webview.onDidReceiveMessage(async (message) => {
        if (message?.type === "ask") {
          await this.handleAsk(message.text ?? "");
        }
      })
    );

    const subscription = this.controller.onAiChatChanged?.(() => {
      this.postHistory();
    });
    if (subscription) {
      disposables.push(subscription);
    }

    disposables.push(
      webviewView.onDidDispose(() => {
        this.disposable?.dispose();
        this.disposable = undefined;
      })
    );

    this.disposable = vscode.Disposable.from(...disposables);
  }

  async handleAsk(text) {
    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      this.postNotification("Please enter a question.");
      return;
    }
    this.postStatus("Sending...");
    let result = null;
    try {
      result = await this.controller.sendAiChatMessage(trimmed);
    } finally {
      this.postHistory();
      this.postStatus(result ? "Done" : "Unable to complete request.");
    }
  }

  postHistory() {
    if (!this.webviewView) {
      return;
    }
    this.webviewView.webview.postMessage({
      type: "history",
      messages: this.controller.getAiChatMessages?.() ?? [],
      displayName: this.controller.getAiChatDisplayName?.() ?? "AI",
      llmInfo: this.controller.getAiChatAgentInfo?.() ?? null,
    });
  }

  postNotification(message) {
    if (!this.webviewView) {
      return;
    }
    this.webviewView.webview.postMessage({ type: "notification", message });
  }

  postStatus(message) {
    if (!this.webviewView) {
      return;
    }
    this.webviewView.webview.postMessage({ type: "status", message });
  }

  buildHtml() {
    const nonce = Date.now().toString(36);
    const template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body {
        height: 100%;
      }
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        margin: 0;
        padding: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        background: var(--vscode-sideBar-background);
        box-sizing: border-box;
      }
      textarea {
        width: 100%;
        min-height: 90px;
        resize: vertical;
        font-family: var(--vscode-editor-font-family);
        border: 1px solid var(--vscode-editorWidget-border);
        background: var(--vscode-editorWidget-background);
        color: var(--vscode-editor-foreground);
        padding: 0.4rem;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .ask-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      button {
        padding: 0.4rem 1rem;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .llm-info {
        font-size: 0.85rem;
        opacity: 0.8;
      }
      .responses {
        border: 1px solid var(--vscode-editorWidget-border);
        background: var(--vscode-editorWidget-background);
        padding: 0.6rem;
        border-radius: 4px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .entry-header {
        font-weight: bold;
        margin-bottom: 0.2rem;
      }
      .entry-body {
        margin: 0;
        white-space: pre-wrap;
        font-family: var(--vscode-editor-font-family);
      }
      .status {
        font-size: 0.85rem;
        opacity: 0.8;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .spinner, .button-spinner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--vscode-editorWidget-border);
        border-top-color: var(--vscode-button-background);
        animation: spin 0.8s linear infinite;
      }
      .button-spinner {
        width: 12px;
        height: 12px;
      }
      .hidden {
        display: none;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <h2>Ask LLM anything</h2>
    <form id="ask-form">
      <textarea id="question" placeholder="Type your question about the open syslog..."></textarea>
      <div class="ask-row">
        <button type="submit" id="ask-button">Ask</button>
        <span id="button-spinner" class="button-spinner hidden"></span>
        <span id="llm-info" class="llm-info">LLM: ?, Model: ?</span>
      </div>
    </form>
    <div class="responses" id="responses">No messages yet. Ask something to begin.</div>
    <div class="status">
      <span id="status-spinner" class="spinner hidden"></span>
      <span id="status-text"></span>
    </div>
    <script nonce="{{nonce}}">
      (function() {
        const vscode = acquireVsCodeApi();
        const form = document.getElementById('ask-form');
        const questionInput = document.getElementById('question');
        const responsesEl = document.getElementById('responses');
        const statusTextEl = document.getElementById('status-text');
        const statusSpinner = document.getElementById('status-spinner');
        const button = document.getElementById('ask-button');
        const buttonSpinner = document.getElementById('button-spinner');
        const llmInfoEl = document.getElementById('llm-info');

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const value = questionInput.value.trim();
          if (!value) {
            setStatus('Please enter a question.', false);
            return;
          }
          setWorking(true);
          setStatus('Sending...', true);
          vscode.postMessage({ type: 'ask', text: value });
        });

        window.addEventListener('message', (event) => {
          const payload = event.data || {};
          if (payload.type === 'history') {
            updateResponses(payload.messages || [], payload.displayName || 'AI');
            if (payload.llmInfo) {
              llmInfoEl.textContent = formatLlmInfo(payload.llmInfo);
            }
            questionInput.value = '';
            setWorking(false);
            setStatus('', false);
          } else if (payload.type === 'notification') {
            setStatus(payload.message || '', false);
            setWorking(false);
          } else if (payload.type === 'status') {
            const working = payload.message === 'Working...' || payload.message === 'Sending...';
            setStatus(payload.message || '', working);
            setWorking(working);
          }
        });

        function setWorking(value) {
          button.disabled = value;
          if (value) {
            buttonSpinner.classList.remove('hidden');
          } else {
            buttonSpinner.classList.add('hidden');
          }
        }

        function setStatus(text, working) {
          statusTextEl.textContent = text || '';
          if (working) {
            statusSpinner.classList.remove('hidden');
          } else {
            statusSpinner.classList.add('hidden');
          }
        }

        function updateResponses(messages, displayName) {
          if (!messages.length) {
            responsesEl.textContent = 'No messages yet. Ask something to begin.';
            return;
          }
          responsesEl.textContent = '';
          const ordered = messages.slice().reverse();
          for (const message of ordered) {
            const wrapper = document.createElement('div');
            const header = document.createElement('div');
            header.className = 'entry-header';
            const timestamp = formatTimestamp(message.timestamp);
            if (message.role === 'user') {
              header.textContent = 'You [' + timestamp + ']';
            } else {
              header.textContent = 'LLM [' + timestamp + ']';
            }
            const body = document.createElement('pre');
            body.className = 'entry-body';
            body.textContent = message.content || '';
            wrapper.appendChild(header);
            wrapper.appendChild(body);
            responsesEl.appendChild(wrapper);
          }
        }

        function formatTimestamp(raw) {
          const date = raw ? new Date(raw) : new Date();
          if (Number.isNaN(date.getTime())) {
            return '??:??:??';
          }
          return date.toLocaleTimeString();
        }

        function formatLlmInfo(info) {
          const provider = info.provider || 'LLM';
          const model = info.model || 'model';
          return 'LLM: ' + provider + ', Model: ' + model;
        }
      })();
    </script>
  </body>
</html>`;
    return template.replace(/\{\{nonce\}\}/g, nonce);
  }
}

export function registerAiChatView(context, controller) {
  const provider = new AiChatWebviewProvider(controller);
  const registration = vscode.window.registerWebviewViewProvider(
    "tcSyslogViewerAiInsights",
    provider
  );
  context.subscriptions.push(registration);
}
