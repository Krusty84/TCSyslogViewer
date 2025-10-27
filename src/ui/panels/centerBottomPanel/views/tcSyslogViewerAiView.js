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
    const config = this.controller?.getAiChatAgentInfo?.() ?? {};
    const providerValue =
      typeof config?.provider === "string" && config.provider.trim()
        ? config.provider.trim()
        : "LLM";
    const modelValue =
      typeof config?.model === "string" && config.model.trim()
        ? config.model.trim()
        : "model";
    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const headerLabel = `LLM: ${escapeHtml(providerValue)}, Model: ${escapeHtml(
      modelValue
    )}`;
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
      .input-container {
        position: relative;
        width: 100%;
      }
      textarea {
        width: 100%;
        min-height: 60px;
        max-height: 120px;
        resize: none;
        font-family: var(--vscode-editor-font-family);
        border: 1px solid var(--vscode-editorWidget-border);
        background: var(--vscode-editorWidget-background);
        color: var(--vscode-editor-foreground);
        padding: 0.4rem 0.4rem 2.5rem 0.4rem;
        border-radius: 4px;
        box-sizing: border-box;
      }
      textarea:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      textarea.sending::placeholder {
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        font-style: italic;
      }
      .ask-button {
        position: absolute;
        bottom: 0.4rem;
        right: 0.4rem;
        padding: 0.4rem 1rem;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: normal;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .ask-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .ask-button.working {
        background: var(--vscode-button-secondaryBackground);
      }
      .llm-info {
        font-size: 0.85rem;
        opacity: 0.8;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
      }
      .header h2 {
        margin: 0;
        font-size: 1rem;
      }
      .responses {
        border: 1px solid var(--vscode-editorWidget-border);
        background: var(--vscode-editorWidget-background);
        padding: 0.6rem;
        border-radius: 4px;
        flex: 2;
        overflow-y: auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .message-pair {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .message-pair:last-child {
        border-bottom: none;
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
      .spinner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid var(--vscode-editorWidget-border);
        border-top-color: var(--vscode-button-background);
        animation: spin 0.8s linear infinite;
      }
      .button-spinner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 3px solid var(--vscode-button-foreground);
        border-top-color: var(--vscode-button-background);
        animation: spin 0.8s linear infinite;
      }
      .hidden {
        display: none !important;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Ask LLM anything</h2>
      <span id="llm-info" class="llm-info">${headerLabel}</span>
    </div>
    <div class="responses" id="responses">No messages yet. Ask something to begin.</div>
    <form id="ask-form">
      <div class="input-container">
        <textarea id="question" placeholder="Type your question about the open syslog..."></textarea>
        <button type="submit" id="ask-button" class="ask-button">
          <span id="button-text">Ask</span>
          <span id="button-spinner" class="button-spinner hidden"></span>
        </button>
      </div>
    </form>
    <div class="status">
      <span id="status-spinner" class="spinner hidden"></span>
      <span id="status-text"></span>
    </div>
    <script nonce="${nonce}">
      (function() {
        const vscode = acquireVsCodeApi();
        const form = document.getElementById('ask-form');
        const questionInput = document.getElementById('question');
        const responsesEl = document.getElementById('responses');
        const statusTextEl = document.getElementById('status-text');
        const statusSpinner = document.getElementById('status-spinner');
        const button = document.getElementById('ask-button');
        const buttonText = document.getElementById('button-text');
        const buttonSpinner = document.getElementById('button-spinner');
        const llmInfoEl = document.getElementById('llm-info');
        let isProcessing = false;

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const value = questionInput.value.trim();
          if (!value) {
            setStatus('Please enter a question.', false);
            return;
          }
          if (isProcessing) {
            setStatus('Please wait, processing...', false);
            return;
          }
          isProcessing = true;
          setWorking(true);
          setStatus('Sending...', true);
          vscode.postMessage({ type: 'ask', text: value });
        });

        window.addEventListener('message', (event) => {
          const payload = event.data || {};
          if (payload.type === 'history') {
            if (payload.messages && payload.messages.length > 0) {
              updateResponses(payload.messages);
              if (payload.llmInfo) {
                llmInfoEl.textContent = formatLlmInfo(payload.llmInfo);
                if (typeof vscode.setState === 'function') {
                  vscode.setState(payload.llmInfo);
                }
              }
              questionInput.value = '';
            }
            // Проверка на ошибку в history
            const hasError = payload.messages?.some(msg => msg.role === 'assistant' && msg.content?.includes('failed'));
            if (hasError) {
              setStatus(payload.messages.find(msg => msg.role === 'assistant')?.content || 'Error occurred', false);
              isProcessing = false;
              setWorking(false);
            }
          } else if (payload.type === 'notification') {
            const errorMessage = payload.message || 'Error occurred';
            setStatus(errorMessage, false);
            isProcessing = false;
            setWorking(false); // Restore UI state
          } else if (payload.type === 'status') {
            const working = payload.message === 'Working...' || payload.message === 'Sending...';
            setStatus(payload.message || '', working);
            if (payload.message === 'Done' || !working) {
              isProcessing = false;
              setWorking(false);
              setStatus('', false);
            }
          } else {
          }
        });

        function setWorking(value) {
          button.disabled = value;
          questionInput.disabled = value;
          button.classList.toggle('working', value);
          buttonText.textContent = 'Ask';
          if (value) {
            questionInput.value = '';
            questionInput.placeholder = 'Sending...';
            questionInput.classList.add('sending');
            buttonSpinner.classList.remove('hidden');
          } else {
            questionInput.placeholder = 'Type your question about the open syslog...';
            questionInput.classList.remove('sending');
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

        function updateResponses(messages) {
          if (!messages.length) {
            responsesEl.innerHTML = '';
            const placeholder = document.createElement('div');
            placeholder.textContent = 'No messages yet. Ask something to begin.';
            responsesEl.appendChild(placeholder);
            return;
          }
          responsesEl.innerHTML = '';
          // Group messages into question-answer pairs
          const pairs = [];
          let currentPair = null;
          for (const message of messages) {
            if (message.role === 'user') {
              if (currentPair) {
                pairs.push(currentPair);
              }
              currentPair = { question: message, answer: null };
            } else if (message.role !== 'user' && currentPair) {
              currentPair.answer = message;
            }
          }
          if (currentPair) {
            pairs.push(currentPair);
          }
          // Inverse dialog order (last on the top)
          const orderedPairs = pairs.reverse();
          for (const pair of orderedPairs) {
            const pairWrapper = document.createElement('div');
            pairWrapper.className = 'message-pair';
            // Question
            if (pair.question) {
              const questionWrapper = document.createElement('div');
              const questionHeader = document.createElement('div');
              questionHeader.className = 'entry-header';
              questionHeader.textContent = 'You [' + formatTimestamp(pair.question.timestamp) + ']';
              const questionBody = document.createElement('pre');
              questionBody.className = 'entry-body';
              questionBody.textContent = pair.question.content || '';
              questionWrapper.appendChild(questionHeader);
              questionWrapper.appendChild(questionBody);
              pairWrapper.appendChild(questionWrapper);
            }
            // Response
            if (pair.answer) {
              const answerWrapper = document.createElement('div');
              const answerHeader = document.createElement('div');
              answerHeader.className = 'entry-header';
              answerHeader.textContent = 'LLM [' + formatTimestamp(pair.answer.timestamp) + ']';
              const answerBody = document.createElement('pre');
              answerBody.className = 'entry-body';
              answerBody.textContent = pair.answer.content || '';
              answerWrapper.appendChild(answerHeader);
              answerWrapper.appendChild(answerBody);
              pairWrapper.appendChild(answerWrapper);
            }
            responsesEl.appendChild(pairWrapper);
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
          const provider = info && info.provider && String(info.provider).trim() ? String(info.provider).trim() : 'LLM';
          const model = info && info.model && String(info.model).trim() ? String(info.model).trim() : 'model';
          return 'LLM: ' + provider + ', Model: ' + model;
        }
      })();
    </script>
  </body>
</html>`;
    return template.replace("LLM: ?, Model: ?", headerLabel);
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
