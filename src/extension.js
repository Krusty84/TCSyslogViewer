import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseTeamcenterLog } from "./parse/teamcenterLogParser.js";

const MAX_LOG_ITEMS_PER_LEVEL = 200;
const MAX_SQL_ROWS_PER_DUMP = 200;
const MAX_JOURNAL_FUNCTION_ROWS = 50;
const MAX_INLINE_SQL_NODES = 200;
const LEVEL_ORDER = ["FATAL", "ERROR", "WARN", "NOTE", "INFO", "DEBUG"];
const LEVEL_CONFIG_OVERRIDES = { WARN: "WARNING" };
const LEVEL_ICONS = {
  FATAL: "flame",
  ERROR: "error",
  WARN: "warning",
  NOTE: "book",
  INFO: "info",
  DEBUG: "beaker",
};

class SyslogTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.model = { resource: null, nodes: [] };
  }

  setModel(model) {
    this.model = model;
    this._onDidChangeTreeData.fire();
  }

  clear() {
    this.setModel({ resource: null, nodes: [] });
  }

  getChildren(element) {
    if (!element) {
      return this.model.nodes;
    }
    return element.children ?? [];
  }

  getTreeItem(node) {
    const collapsible = node.children?.length
      ? node.expanded
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(node.label, collapsible);
    item.id = node.id;
    if (node.description) {
      item.description = node.description;
    }
    if (node.tooltip) {
      item.tooltip = node.tooltip;
    } else if (node.description) {
      item.tooltip = node.description;
    }
    if (node.icon) {
      item.iconPath = new vscode.ThemeIcon(node.icon);
    }
    if (node.line !== undefined && node.line !== null && this.model.resource) {
      item.command = {
        command: "tcSyslog.revealLine",
        title: "Reveal in Editor",
        arguments: [this.model.resource, node.line],
      };
    }
    if (node.contextValue) {
      item.contextValue = node.contextValue;
    }
    return item;
  }
}

class SyslogController {
  constructor(context) {
    this.context = context;
    this.treeDataProvider = new SyslogTreeDataProvider();
    this.treeView = vscode.window.createTreeView("tcSyslog.explorer", {
      treeDataProvider: this.treeDataProvider,
    });
    this.treeView.message = "Open a .syslog file to see parsed categories.";
    this.currentUri = null;
    this.refreshTimer = undefined;
    this.pendingDocument = undefined;
    this.themePanel = null;
    this.levelDecorationTypes = new Map();
    this.headerDecorationType = undefined;
    this.envKeyDecorationType = undefined;
    this.envValueDecorationType = undefined;
    this.timestampDecorationType = undefined;
    this.idDecorationType = undefined;
    this.messageDecorationType = undefined;
    this.sqlDecorationType = undefined;
    this.inlineSqlDecorationType = undefined;
    this.journalDecorationType = undefined;
    this.baseFontDecorationType = undefined;
    this.latestParsed = null;
    this.context.subscriptions.push(this.treeView);
    this.context.subscriptions.push({
      dispose: () => this.disposeDecorationTypes(),
    });

    this.reloadDecorationTypes();

    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (this.shouldReloadDecorations(event)) {
          this.reloadDecorationTypes();
          if (this.currentUri && this.latestParsed) {
            const document = vscode.workspace.textDocuments.find(
              (doc) => doc.uri.toString() === this.currentUri.toString()
            );
            if (document) {
              this.applyDecorations(document, this.latestParsed);
            }
          }
        }
      })
    );
  }

  initialize() {
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) =>
        this.handleActiveEditorChange(editor)
      ),
      vscode.workspace.onDidOpenTextDocument((document) =>
        this.handleDocumentOpened(document)
      ),
      vscode.workspace.onDidCloseTextDocument((document) =>
        this.handleDocumentClosed(document)
      ),
      vscode.workspace.onDidChangeTextDocument((event) =>
        this.handleDocumentChanged(event)
      )
    );
    this.refreshActive();
  }

  shouldReloadDecorations(event) {
    if (!event) {
      return true;
    }
    return (
      event.affectsConfiguration("tcSyslog.colors") ||
      event.affectsConfiguration("tcSyslog.font")
    );
  }

  reloadDecorationTypes() {
    this.disposeDecorationTypes();
    const config = vscode.workspace.getConfiguration("tcSyslog");
    const levelDefaults = {
      FATAL: "#ff00aa",
      ERROR: "#ff4242",
      WARN: "#b8860b",
      NOTE: "#3aa669",
      INFO: "#1479ff",
      DEBUG: "#888888",
    };
    const tokenDefaults = {
      timestamp: "#262627ff",
      id: "#c586c0",
      message: "#262627ff",
      sqlBackground: "#f8f53b7f",
      sqlInlineBackground: "#f8f53b7f",
      journalBackground: "#f8f53b7f",
    };
    const fontFamilySetting = config.get("font.family");
    const fontFamily =
      typeof fontFamilySetting === "string" && fontFamilySetting.trim()
        ? fontFamilySetting.trim()
        : undefined;
    const fontSizeSetting = config.get("font.size");
    const fontSize =
      typeof fontSizeSetting === "number" &&
      Number.isFinite(fontSizeSetting) &&
      fontSizeSetting > 0
        ? `${fontSizeSetting}px`
        : undefined;

    const applyFontOptions = (options) => {
      if (fontFamily) {
        options.fontFamily = fontFamily;
      }
      if (fontSize) {
        options.fontSize = fontSize;
      }
    };

    this.levelDecorationTypes = new Map();
    for (const level of LEVEL_ORDER) {
      const configKey = LEVEL_CONFIG_OVERRIDES[level] ?? level;
      const value = config.get(`colors.level.${configKey}.fg`);
      const color =
        typeof value === "string" && value ? value : levelDefaults[level];
      const options = {
        color,
        fontWeight: "bold",
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      };
      applyFontOptions(options);
      const decoration = vscode.window.createTextEditorDecorationType(options);
      this.levelDecorationTypes.set(level, decoration);
    }

    const headerOptions = {
      fontStyle: "italic",
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(headerOptions);
    this.headerDecorationType =
      vscode.window.createTextEditorDecorationType(headerOptions);

    const envKeyOptions = {
      color: new vscode.ThemeColor("symbolIcon.variableForeground"),
      fontWeight: "bold",
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(envKeyOptions);
    this.envKeyDecorationType =
      vscode.window.createTextEditorDecorationType(envKeyOptions);

    const envValueOptions = {
      color: new vscode.ThemeColor("symbolIcon.stringForeground"),
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(envValueOptions);
    this.envValueDecorationType =
      vscode.window.createTextEditorDecorationType(envValueOptions);

    const timestampColorSetting = config.get("colors.timestamp.fg");
    const timestampColor =
      typeof timestampColorSetting === "string" && timestampColorSetting
        ? timestampColorSetting
        : tokenDefaults.timestamp;
    const timestampOptions = {
      color: timestampColor,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(timestampOptions);
    this.timestampDecorationType =
      vscode.window.createTextEditorDecorationType(timestampOptions);

    const idColorSetting = config.get("colors.id.fg");
    const idColor =
      typeof idColorSetting === "string" && idColorSetting
        ? idColorSetting
        : tokenDefaults.id;
    const idOptions = {
      color: idColor,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(idOptions);
    this.idDecorationType =
      vscode.window.createTextEditorDecorationType(idOptions);

    const messageColorSetting = config.get("colors.message.fg");
    const messageColor =
      typeof messageColorSetting === "string" && messageColorSetting
        ? messageColorSetting
        : tokenDefaults.message;
    const messageOptions = {
      color: messageColor,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    };
    applyFontOptions(messageOptions);
    this.messageDecorationType =
      vscode.window.createTextEditorDecorationType(messageOptions);

    const sqlInlineSetting = config.get("colors.sql.inline.background");
    const sqlInlineBackground =
      typeof sqlInlineSetting === "string" && sqlInlineSetting
        ? sqlInlineSetting
        : tokenDefaults.sqlInlineBackground;
    this.inlineSqlDecorationType = vscode.window.createTextEditorDecorationType(
      {
        backgroundColor: sqlInlineBackground,
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      }
    );

    const sqlBackgroundSetting = config.get("colors.sql.background");
    const sqlBackground =
      typeof sqlBackgroundSetting === "string" && sqlBackgroundSetting
        ? sqlBackgroundSetting
        : tokenDefaults.sqlBackground;
    this.sqlDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: sqlBackground,
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });

    const journalBackgroundSetting = config.get("colors.journal.background");
    const journalBackground =
      typeof journalBackgroundSetting === "string" && journalBackgroundSetting
        ? journalBackgroundSetting
        : tokenDefaults.journalBackground;
    this.journalDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: journalBackground,
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });

    if (this.baseFontDecorationType) {
      this.baseFontDecorationType.dispose();
      this.baseFontDecorationType = undefined;
    }
    if (fontFamily || fontSize) {
      const baseOptions = {
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      };
      applyFontOptions(baseOptions);
      this.baseFontDecorationType =
        vscode.window.createTextEditorDecorationType(baseOptions);
    }
  }

  disposeDecorationTypes() {
    if (this.levelDecorationTypes) {
      for (const decoration of this.levelDecorationTypes.values()) {
        decoration.dispose();
      }
    }
    this.levelDecorationTypes = new Map();
    if (this.headerDecorationType) {
      this.headerDecorationType.dispose();
      this.headerDecorationType = undefined;
    }
    if (this.envKeyDecorationType) {
      this.envKeyDecorationType.dispose();
      this.envKeyDecorationType = undefined;
    }
    if (this.envValueDecorationType) {
      this.envValueDecorationType.dispose();
      this.envValueDecorationType = undefined;
    }
    if (this.timestampDecorationType) {
      this.timestampDecorationType.dispose();
      this.timestampDecorationType = undefined;
    }
    if (this.idDecorationType) {
      this.idDecorationType.dispose();
      this.idDecorationType = undefined;
    }
    if (this.messageDecorationType) {
      this.messageDecorationType.dispose();
      this.messageDecorationType = undefined;
    }
    if (this.inlineSqlDecorationType) {
      this.inlineSqlDecorationType.dispose();
      this.inlineSqlDecorationType = undefined;
    }
    if (this.sqlDecorationType) {
      this.sqlDecorationType.dispose();
      this.sqlDecorationType = undefined;
    }
    if (this.journalDecorationType) {
      this.journalDecorationType.dispose();
      this.journalDecorationType = undefined;
    }
    if (this.baseFontDecorationType) {
      this.baseFontDecorationType.dispose();
      this.baseFontDecorationType = undefined;
    }
  }

  applyDecorations(document, parsed) {
    const target = document.uri.toString();
    const editors = vscode.window.visibleTextEditors.filter(
      (editor) => editor.document.uri.toString() === target
    );
    if (!editors.length) {
      return;
    }

    const levelRanges = new Map();
    for (const level of this.levelDecorationTypes.keys()) {
      levelRanges.set(level, []);
    }
    const timestampRanges = [];
    const idRanges = [];
    const messageRanges = [];
    const inlineSqlRanges = [];
    const inlineSqlLinesSeen = new Set();
    const journalRanges = [];
    const sqlRanges = [];

    for (const entry of parsed.logLines ?? []) {
      if (!entry.level) {
        continue;
      }
      const lineNumber = entry.line ?? 0;
      const levelStart = entry.levelStart ?? 0;
      const levelEnd = entry.levelEnd ?? levelStart + entry.level.length;
      const ranges = levelRanges.get(entry.level);
      if (ranges) {
        ranges.push(
          new vscode.Range(
            lineNumber,
            Math.max(0, levelStart),
            lineNumber,
            Math.max(0, levelEnd)
          )
        );
      }

      if (entry.timestampStart != null && entry.timestampEnd != null) {
        timestampRanges.push(
          new vscode.Range(
            lineNumber,
            Math.max(0, entry.timestampStart),
            lineNumber,
            Math.max(0, entry.timestampEnd)
          )
        );
      }
      if (entry.idStart != null && entry.idEnd != null) {
        idRanges.push(
          new vscode.Range(
            lineNumber,
            Math.max(0, entry.idStart),
            lineNumber,
            Math.max(0, entry.idEnd)
          )
        );
      }
      if (entry.messageStart != null && entry.messageEnd != null) {
        const range = new vscode.Range(
          lineNumber,
          Math.max(0, entry.messageStart),
          lineNumber,
          Math.max(0, entry.messageEnd)
        );
        messageRanges.push(range);
        if (entry.isInlineSql) {
          const lineLength =
            parsed.lines?.[lineNumber]?.length ??
            Math.max(0, entry.messageEnd ?? entry.messageStart ?? 0);
          inlineSqlRanges.push(
            new vscode.Range(lineNumber, 0, lineNumber, Math.max(0, lineLength))
          );
          inlineSqlLinesSeen.add(lineNumber);
        }
      }
    }

    for (const inlineEntry of parsed.inlineSqlLines ?? []) {
      const lineIndex = inlineEntry.line ?? 0;
      if (inlineSqlLinesSeen.has(lineIndex)) {
        continue;
      }
      const lineLength =
        parsed.lines?.[lineIndex]?.length ?? inlineEntry.text?.length ?? 0;
      inlineSqlRanges.push(
        new vscode.Range(lineIndex, 0, lineIndex, Math.max(0, lineLength))
      );
      inlineSqlLinesSeen.add(lineIndex);
    }

    for (const section of parsed.journalSections ?? []) {
      const startLine = section.line ?? 0;
      const endLine = section.endLine ?? section.line ?? 0;
      const normalizedStart = Math.max(0, startLine);
      const normalizedEnd = Math.max(normalizedStart, endLine);
      const endLineLength = parsed.lines?.[normalizedEnd]?.length ?? 0;
      journalRanges.push(
        new vscode.Range(
          normalizedStart,
          0,
          normalizedEnd,
          Math.max(0, endLineLength)
        )
      );
    }

    for (const dump of parsed.sqlDumps ?? []) {
      const startLine = dump.line ?? 0;
      const endLine = dump.endLine ?? dump.line ?? 0;
      const normalizedStart = Math.max(0, startLine);
      const normalizedEnd = Math.max(normalizedStart, endLine);
      const endLineLength = parsed.lines?.[normalizedEnd]?.length ?? 0;
      sqlRanges.push(
        new vscode.Range(
          normalizedStart,
          0,
          normalizedEnd,
          Math.max(0, endLineLength)
        )
      );
    }

    const headerRanges = (parsed.header?.lines ?? []).map((lineInfo) => {
      const lineIndex = lineInfo.line ?? 0;
      const textLength = parsed.lines?.[lineIndex]?.length ?? 0;
      return new vscode.Range(lineIndex, 0, lineIndex, Math.max(0, textLength));
    });

    const envKeyRanges = [];
    const envValueRanges = [];
    for (const section of parsed.envSections ?? []) {
      for (const entry of section.entries ?? []) {
        const lineIndex = entry.line ?? 0;
        const lineText = parsed.lines?.[lineIndex] ?? "";
        const leadingSpaces = lineText.match(/^[ 	]*/)?.[0]?.length ?? 0;
        const keyStart = leadingSpaces;
        const keyEnd = keyStart + entry.key.length;
        envKeyRanges.push(
          new vscode.Range(
            lineIndex,
            keyStart,
            lineIndex,
            Math.max(keyStart, keyEnd)
          )
        );
        const equalsIndex = lineText.indexOf("=");
        if (equalsIndex !== -1) {
          let valueStart = equalsIndex + 1;
          while (valueStart < lineText.length && lineText[valueStart] === " ") {
            valueStart += 1;
          }
          envValueRanges.push(
            new vscode.Range(
              lineIndex,
              valueStart,
              lineIndex,
              Math.max(valueStart, lineText.length)
            )
          );
        }
      }
    }

    for (const editor of editors) {
      for (const [level, decoration] of this.levelDecorationTypes) {
        editor.setDecorations(decoration, levelRanges.get(level) ?? []);
      }
      if (this.timestampDecorationType) {
        editor.setDecorations(this.timestampDecorationType, timestampRanges);
      }
      if (this.idDecorationType) {
        editor.setDecorations(this.idDecorationType, idRanges);
      }
      if (this.messageDecorationType) {
        editor.setDecorations(this.messageDecorationType, messageRanges);
      }
      if (this.journalDecorationType) {
        editor.setDecorations(this.journalDecorationType, journalRanges);
      }
      if (this.sqlDecorationType) {
        editor.setDecorations(this.sqlDecorationType, sqlRanges);
      }
      if (this.inlineSqlDecorationType) {
        editor.setDecorations(this.inlineSqlDecorationType, inlineSqlRanges);
      }
      if (this.headerDecorationType) {
        editor.setDecorations(this.headerDecorationType, headerRanges);
      }
      if (this.envKeyDecorationType) {
        editor.setDecorations(this.envKeyDecorationType, envKeyRanges);
      }
      if (this.envValueDecorationType) {
        editor.setDecorations(this.envValueDecorationType, envValueRanges);
      }
      if (this.baseFontDecorationType) {
        const doc = editor.document;
        if (doc.lineCount > 0) {
          const lastLineIndex = doc.lineCount - 1;
          const lastLineLength = doc.lineAt(lastLineIndex).text.length;
          editor.setDecorations(this.baseFontDecorationType, [
            new vscode.Range(0, 0, lastLineIndex, lastLineLength),
          ]);
        } else {
          editor.setDecorations(this.baseFontDecorationType, []);
        }
      }
    }
  }

  clearDecorations(uriString) {
    if (!uriString) {
      return;
    }
    const editors = vscode.window.visibleTextEditors.filter(
      (editor) => editor.document.uri.toString() === uriString
    );
    if (!editors.length) {
      return;
    }

    for (const editor of editors) {
      for (const decoration of this.levelDecorationTypes.values()) {
        editor.setDecorations(decoration, []);
      }
      if (this.timestampDecorationType) {
        editor.setDecorations(this.timestampDecorationType, []);
      }
      if (this.idDecorationType) {
        editor.setDecorations(this.idDecorationType, []);
      }
      if (this.messageDecorationType) {
        editor.setDecorations(this.messageDecorationType, []);
      }
      if (this.inlineSqlDecorationType) {
        editor.setDecorations(this.inlineSqlDecorationType, []);
      }
      if (this.sqlDecorationType) {
        editor.setDecorations(this.sqlDecorationType, []);
      }
      if (this.journalDecorationType) {
        editor.setDecorations(this.journalDecorationType, []);
      }
      if (this.headerDecorationType) {
        editor.setDecorations(this.headerDecorationType, []);
      }
      if (this.envKeyDecorationType) {
        editor.setDecorations(this.envKeyDecorationType, []);
      }
      if (this.envValueDecorationType) {
        editor.setDecorations(this.envValueDecorationType, []);
      }
      if (this.baseFontDecorationType) {
        editor.setDecorations(this.baseFontDecorationType, []);
      }
    }
  }

  handleActiveEditorChange(editor) {
    if (editor && isSyslogDocument(editor.document)) {
      this.refresh(editor.document);
      return;
    }

    if (!editor && this.currentUri) {
      this.clearView("Open a .syslog file to see parsed categories.");
      return;
    }

    if (editor && !isSyslogDocument(editor.document) && this.currentUri) {
      this.clearView("Open a .syslog file to see parsed categories.");
    }
  }

  handleDocumentOpened(document) {
    if (isSyslogDocument(document)) {
      this.refresh(document);
    }
  }

  handleDocumentClosed(document) {
    if (
      this.currentUri &&
      document.uri.toString() === this.currentUri.toString()
    ) {
      this.clearView("Open a .syslog file to see parsed categories.");
    }
  }

  handleDocumentChanged(event) {
    if (!this.currentUri) {
      return;
    }
    if (event.document.uri.toString() !== this.currentUri.toString()) {
      return;
    }
    this.pendingDocument = event.document;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refresh(this.pendingDocument);
      this.refreshTimer = undefined;
      this.pendingDocument = undefined;
    }, 300);
  }

  clearView(message) {
    if (this.currentUri) {
      this.clearDecorations(this.currentUri.toString());
    }
    this.currentUri = null;
    this.latestParsed = null;
    this.treeDataProvider.clear();
    this.treeView.message = message;
  }

  refreshActive() {
    const active = vscode.window.activeTextEditor?.document;
    this.refresh(active);
  }

  refresh(document) {
    if (!document || !isSyslogDocument(document)) {
      this.clearView("Open a .syslog file to see parsed categories.");
      return;
    }

    if (
      this.currentUri &&
      this.currentUri.toString() !== document.uri.toString()
    ) {
      this.clearDecorations(this.currentUri.toString());
    }

    const content = document.getText();
    let parsed;
    try {
      parsed = parseTeamcenterLog(content);
    } catch (error) {
      this.treeDataProvider.clear();
      const message = error instanceof Error ? error.message : String(error);
      this.treeView.message = `Failed to parse syslog: ${message}`;
      this.clearDecorations(document.uri.toString());
      this.latestParsed = null;
      vscode.window.showErrorMessage(
        `TC Syslog: unable to parse file - ${message}`
      );
      return;
    }
    this.currentUri = document.uri;
    this.latestParsed = parsed;
    this.treeView.message = undefined;
    const model = buildTreeModel(parsed, document.uri);
    this.treeDataProvider.setModel(model);
    this.applyDecorations(document, parsed);
  }

  async reveal(resource, line) {
    if (line === undefined || line === null) {
      return;
    }
    try {
      const document = await vscode.workspace.openTextDocument(resource);
      const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false,
      });
      const position = new vscode.Position(line, 0);
      const range = new vscode.Range(position, position);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        range,
        vscode.TextEditorRevealType.InCenterIfOutsideViewport
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to reveal log line: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async openThemePanel() {
    if (this.themePanel) {
      this.themePanel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "tcSyslogTheme",
      "TC Syslog Colors & Fonts",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    this.context.subscriptions.push(panel);

    const htmlUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "theme.html"
    );
    try {
      const html = await readFile(htmlUri.fsPath, "utf8");
      panel.webview.html = html;
    } catch (error) {
      panel.webview.html = `<html><body><h3>Unable to load theme UI</h3><pre>${
        error instanceof Error ? error.message : String(error)
      }</pre></body></html>`;
    }

    panel.webview.onDidReceiveMessage(async (message) => {
      if (!message) {
        return;
      }
      if (message.type === "save") {
        await this.saveThemeSettings(message.values ?? {});
        return;
      }
      if (message.type === "ready") {
        panel.webview.postMessage({
          type: "init",
          payload: this.getCurrentAppearanceSettings(),
        });
      }
    });

    panel.onDidDispose(() => {
      this.themePanel = null;
    });

    this.themePanel = panel;
  }

  getCurrentAppearanceSettings() {
    const config = vscode.workspace.getConfiguration("tcSyslog");
    const levels = {};
    for (const level of LEVEL_ORDER) {
      const configKey = LEVEL_CONFIG_OVERRIDES[level] ?? level;
      const value = config.get(`colors.level.${configKey}.fg`);
      if (typeof value === "string" && value) {
        levels[level] = value;
      }
    }

    const tokens = {};
    const tokenConfigMap = {
      timestamp: "colors.timestamp.fg",
      id: "colors.id.fg",
      message: "colors.message.fg",
      sqlBackground: "colors.sql.background",
      sqlInlineBackground: "colors.sql.inline.background",
      journalBackground: "colors.journal.background",
    };
    for (const [tokenKey, configKey] of Object.entries(tokenConfigMap)) {
      const value = config.get(configKey);
      if (typeof value === "string" && value) {
        tokens[tokenKey] = value;
      }
    }

    const fontFamily = config.get("font.family");
    const fontSize = config.get("font.size");

    return {
      levels,
      tokens,
      fontFamily: typeof fontFamily === "string" ? fontFamily : "",
      fontSize:
        typeof fontSize === "number" && Number.isFinite(fontSize)
          ? fontSize
          : "",
    };
  }

  async saveThemeSettings(values) {
    const config = vscode.workspace.getConfiguration("tcSyslog");
    const operations = [];
    const mapping = [
      ["colors.level.INFO.fg", values?.INFO],
      ["colors.level.WARNING.fg", values?.WARNING],
      ["colors.level.ERROR.fg", values?.ERROR],
      ["colors.level.NOTE.fg", values?.NOTE],
      ["colors.level.DEBUG.fg", values?.DEBUG],
      ["colors.level.FATAL.fg", values?.FATAL],
      ["colors.timestamp.fg", values?.timestamp],
      ["colors.id.fg", values?.id],
      ["colors.message.fg", values?.message],
      ["colors.sql.background", values?.sqlBackground],
      ["colors.sql.inline.background", values?.sqlInlineBackground],
      ["colors.journal.background", values?.journalBackground],
    ];
    for (const [key, value] of mapping) {
      if (typeof value === "string" && value) {
        operations.push(
          config.update(key, value, vscode.ConfigurationTarget.Workspace)
        );
      }
    }
    if (typeof values?.fontFamily === "string" && values.fontFamily) {
      operations.push(
        config.update(
          "font.family",
          values.fontFamily,
          vscode.ConfigurationTarget.Workspace
        )
      );
    }
    if (values?.fontSize) {
      const numericSize = Number(values.fontSize);
      if (!Number.isNaN(numericSize)) {
        operations.push(
          config.update(
            "font.size",
            numericSize,
            vscode.ConfigurationTarget.Workspace
          )
        );
      }
    }
    try {
      await Promise.all(operations);
      this.reloadDecorationTypes();
      if (this.currentUri && this.latestParsed) {
        const document = vscode.workspace.textDocuments.find(
          (doc) => doc.uri.toString() === this.currentUri.toString()
        );
        if (document) {
          this.applyDecorations(document, this.latestParsed);
        }
      }
      vscode.window.showInformationMessage(
        "TC Syslog appearance settings updated."
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Unable to update settings: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function isSyslogDocument(document) {
  if (!document) {
    return false;
  }
  const fileName =
    document.fileName?.toLowerCase?.() ?? document.uri.fsPath.toLowerCase();
  return fileName.endsWith(".syslog");
}

function buildTreeModel(parsed, resource) {
  if (!parsed) {
    return { resource, nodes: [] };
  }

  const nodes = [];
  const overviewChildren = [];

  if (parsed.header) {
    const headerPreview =
      parsed.header.lines?.map((entry) => entry.text).join(" - ") ?? "";
    const headerDescription = truncate(headerPreview, 120);
    overviewChildren.push({
      id: "overview:header",
      label: "Header",
      description: headerDescription,
      tooltip: headerPreview,
      line: parsed.header.line,
      icon: "symbol-keyword",
    });
  }

  if (parsed.systemInfo?.length) {
    const systemChildren = parsed.systemInfo.map((entry) => ({
      id: `system:${entry.line}`,
      label: entry.key,
      description: entry.value,
      tooltip: entry.value,
      line: entry.line,
      icon: "info",
    }));
    overviewChildren.push({
      id: "overview:systemInfo",
      label: `System Info (${systemChildren.length})`,
      children: systemChildren,
      icon: "info",
    });
  }

  const envEntries = [];
  for (let index = 0; index < (parsed.envSections?.length ?? 0); index += 1) {
    const section = parsed.envSections[index];
    for (const entry of section.entries ?? []) {
      envEntries.push({
        id: `env:${index}:${entry.line}`,
        label: entry.key,
        description: entry.value,
        tooltip: entry.value,
        line: entry.line,
        icon: "symbol-parameter",
      });
    }
  }
  if (envEntries.length) {
    overviewChildren.push({
      id: "overview:env",
      label: `Environment (${envEntries.length})`,
      children: envEntries,
      icon: "gear",
    });
  }

  const dllEntries = [];
  for (let index = 0; index < (parsed.dllSections?.length ?? 0); index += 1) {
    const section = parsed.dllSections[index];
    for (const entry of section.entries ?? []) {
      dllEntries.push({
        id: `dll:${index}:${entry.line}`,
        label: winBasename(entry.path),
        description: entry.version,
        tooltip: `${entry.path} (${entry.version})`,
        line: entry.line,
        icon: "library",
      });
    }
  }
  if (dllEntries.length) {
    overviewChildren.push({
      id: "overview:dll",
      label: `DLL Versions (${dllEntries.length})`,
      children: dllEntries,
      icon: "extensions",
    });
  }

  if (parsed.pomStats?.length) {
    overviewChildren.push({
      id: "overview:pom",
      label: `POM Statistics (${parsed.pomStats.length})`,
      children: parsed.pomStats.map((entry, index) => ({
        id: `pom:${index}:${entry.line}`,
        label: `Entry at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? "",
        line: entry.line,
        icon: "graph",
      })),
      icon: "graph",
    });
  }

  if (parsed.endSessions?.length) {
    overviewChildren.push({
      id: "overview:endSession",
      label: `End of Session (${parsed.endSessions.length})`,
      children: parsed.endSessions.map((entry, index) => ({
        id: `end:${index}:${entry.line}`,
        label: `Marker at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? "",
        line: entry.line,
        icon: "debug-stop",
      })),
      icon: "debug-stop",
    });
  }

  if (parsed.truncated?.length) {
    overviewChildren.push({
      id: "overview:truncated",
      label: `Truncated (${parsed.truncated.length})`,
      children: parsed.truncated.map((entry, index) => ({
        id: `truncated:${index}:${entry.line}`,
        label: `Truncated at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? "",
        line: entry.line,
        icon: "warning",
      })),
      icon: "warning",
    });
  }

  if (overviewChildren.length) {
    nodes.push({
      id: "root:overview",
      label: "Overview",
      children: overviewChildren,
      icon: "list-tree",
      expanded: true,
    });
  }

  if (parsed.sqlDumps?.length) {
    nodes.push({
      id: "root:sql",
      label: `SQL Profile Dumps (${parsed.sqlDumps.length})`,
      children: parsed.sqlDumps.map((entry, index) => {
        const startLine = entry.line ?? 0;
        const endLine = entry.endLine ?? entry.line ?? 0;
        const description =
          endLine > startLine
            ? `Lines ${startLine + 1}-${endLine + 1}`
            : `Line ${startLine + 1}`;
        const allRows = entry.rows ?? [];
        const displayRows = allRows.slice(0, MAX_SQL_ROWS_PER_DUMP);
        const rowChildren = displayRows.map((row, rowIndex) => ({
          id: `sql:${index}:row:${rowIndex}:${row.line}`,
          label: truncate((row.text ?? "").trim() || `Row ${rowIndex + 1}`, 80),
          description: `Line ${row.line + 1}`,
          line: row.line,
          icon: "symbol-string",
        }));
        if (allRows.length > MAX_SQL_ROWS_PER_DUMP) {
          rowChildren.push({
            id: `sql:${index}:overflow`,
            label: `... ${allRows.length - MAX_SQL_ROWS_PER_DUMP} more rows`,
            description: "Use search in the editor for additional entries",
            icon: "ellipsis",
          });
        }
        return {
          id: `sql:${index}:${startLine}`,
          label: `Dump #${index + 1}`,
          description,
          line: startLine,
          children: rowChildren,
          icon: "database",
        };
      }),
      icon: "database",
    });
  }

  if (parsed.journalSections?.length) {
    const journalTypeLabels = {
      summary: "Summary",
      topLevel: "Top-Level Functions",
      allFunctions: "All Functions",
    };
    const journalNodes = (parsed.journalSections ?? []).map(
      (section, index) => {
        const typeLabel = journalTypeLabels[section.type] ?? "Section";
        const label = `${typeLabel} #${index + 1}`;
        const description =
          section.summary && section.summary.length
            ? truncate(section.summary, 80)
            : `Lines ${section.line + 1}-${
                (section.endLine ?? section.line) + 1
              }`;
        const rowChildren = (section.rows ?? [])
          .slice(0, MAX_JOURNAL_FUNCTION_ROWS)
          .map((row, rowIndex) => {
            const percentLabel = row.percent ? `${row.percent}%` : "";
            const functionLabel = truncate(
              row.functionName ?? `Entry ${rowIndex + 1}`,
              80
            );
            const details = [];
            if (row.totalElapsed) {
              details.push(`${row.totalElapsed}s`);
            }
            if (row.callCount) {
              details.push(`${row.callCount} calls`);
            }
            const suffix = details.length ? ` (${details.join(", ")})` : "";
            const labelText = percentLabel
              ? `${percentLabel} • ${functionLabel}${suffix}`
              : `${functionLabel}${suffix}`;
            return {
              id: `journal:${index}:row:${rowIndex}:${row.line}`,
              label: labelText,
              description: `Line ${row.line + 1}`,
              line: row.line,
              tooltip: row.text ?? "",
              icon: "graph",
            };
          });
        if ((section.rows?.length ?? 0) > MAX_JOURNAL_FUNCTION_ROWS) {
          rowChildren.push({
            id: `journal:${index}:overflow`,
            label: `... ${
              section.rows.length - MAX_JOURNAL_FUNCTION_ROWS
            } more entries`,
            description: "Use search in the editor for additional entries",
            icon: "ellipsis",
          });
        }
        return {
          id: `journal:${index}:${section.line}`,
          label,
          description,
          line: section.line,
          children: rowChildren,
          icon: "graph",
        };
      }
    );
    nodes.push({
      id: "root:journal",
      label: `Journalled Times (${journalNodes.length})`,
      children: journalNodes,
      icon: "graph",
    });
  }

  const levelMap = new Map();
  for (const entry of parsed.logLines ?? []) {
    if (!levelMap.has(entry.level)) {
      levelMap.set(entry.level, []);
    }
    levelMap.get(entry.level).push(entry);
  }
  const levelNodes = Array.from(levelMap.entries())
    .sort((a, b) => levelRank(a[0]) - levelRank(b[0]))
    .map(([level, entries]) => {
      const orderedEntries = [...entries].sort((a, b) => a.line - b.line);
      const display = orderedEntries.slice(0, MAX_LOG_ITEMS_PER_LEVEL);
      const children = display.map((entry) => ({
        id: `log:${level}:${entry.line}`,
        label: `${entry.timestamp} - ${truncate(entry.message, 80)}`,
        description: entry.id,
        tooltip: entry.message,
        line: entry.line,
        icon: "symbol-event",
      }));
      if (entries.length > MAX_LOG_ITEMS_PER_LEVEL) {
        children.push({
          id: `log:${level}:overflow`,
          label: `... ${entries.length - MAX_LOG_ITEMS_PER_LEVEL} more`,
          description: "Use search in the editor for additional entries",
          icon: "ellipsis",
        });
      }
      return {
        id: `level:${level}`,
        label: `${level} (${entries.length})`,
        children,
        icon: LEVEL_ICONS[level] ?? "circle-filled",
      };
    })
    .filter((node) => node.children.length);
  if (levelNodes.length) {
    nodes.push({
      id: "root:levels",
      label: `Log Levels (${parsed.logLines.length})`,
      children: levelNodes,
      icon: "symbol-class",
    });
  }

  if (parsed.inlineSqlLines?.length) {
    const inlineEntries = parsed.inlineSqlLines.slice(0, MAX_INLINE_SQL_NODES);
    const inlineSqlNodes = inlineEntries.map((entry, index) => ({
      id: `inlineSql:${index}:${entry.line}`,
      label: truncate(
        (entry.text ?? "").trim() || `SQL Statement ${index + 1}`,
        80
      ),
      description: `Line ${entry.line + 1}`,
      line: entry.line,
      icon: entry.fromLog ? "symbol-operator" : "symbol-string",
    }));
    if ((parsed.inlineSqlLines.length ?? 0) > MAX_INLINE_SQL_NODES) {
      inlineSqlNodes.push({
        id: "inlineSql:overflow",
        label: `... ${
          parsed.inlineSqlLines.length - MAX_INLINE_SQL_NODES
        } more entries`,
        description: "Use search in the editor for additional entries",
        icon: "ellipsis",
      });
    }
    nodes.push({
      id: "root:inlineSql",
      label: `Inline SQL (${parsed.inlineSqlLines.length})`,
      children: inlineSqlNodes,
      icon: "symbol-operator",
    });
  }

  return { resource, nodes };
}

function winBasename(filePath) {
  if (!filePath) {
    return "";
  }
  const normalized = filePath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized);
  return base || normalized;
}

function levelRank(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx === -1 ? LEVEL_ORDER.length : idx;
}

function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const limit = Math.max(0, maxLength - 3);
  return `${text.slice(0, limit)}...`;
}

export function activate(context) {
  const controller = new SyslogController(context);
  controller.initialize();

  context.subscriptions.push(
    vscode.commands.registerCommand("tcSyslog.refresh", () =>
      controller.refreshActive()
    ),
    vscode.commands.registerCommand("tcSyslog.revealLine", (resource, line) =>
      controller.reveal(resource, line)
    ),
    vscode.commands.registerCommand("tcSyslog.openThemePanel", () =>
      controller.openThemePanel()
    )
  );
}

export function deactivate() {
  // nothing to clean up explicitly
}
