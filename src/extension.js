import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { parseTeamcenterLog } from "./parse/teamcenterLogParser.js";

const DEFAULT_LIMITS = {
  logLevelEntries: 200,
  sqlRowsPerDump: 200,
  journalRowsPerSection: 50,
  inlineSqlEntries: 200,
};
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
const NODE_CONTEXT = {
  CATEGORY: "syslogCategory",
  GROUP: "syslogGroup",
  ENTRY: "syslogEntry",
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

class FavoritesTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.model = { resource: null, entries: [] };
  }

  setModel(model) {
    this.model = model;
    this._onDidChangeTreeData.fire();
  }

  clear() {
    this.setModel({ resource: null, entries: [] });
  }

  getChildren(element) {
    if (!element) {
      return this.model.entries;
    }
    return element.children ?? [];
  }

  getTreeItem(node) {
    const collapsible = node.children?.length
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
    const item = new vscode.TreeItem(node.label, collapsible);
    item.id = node.id;
    if (node.description) {
      item.description = node.description;
    }
    if (node.tooltip) {
      item.tooltip = node.tooltip;
    }
    const iconId = node.icon ?? "star-full";
    item.iconPath = new vscode.ThemeIcon(iconId);
    if (node.contextValue) {
      item.contextValue = node.contextValue;
    }
    if (node.command) {
      item.command = node.command;
    } else if (
      node.line !== undefined &&
      node.line !== null &&
      this.model.resource
    ) {
      item.command = {
        command: "tcSyslog.revealLine",
        title: "Reveal in Editor",
        arguments: [this.model.resource, node.line],
      };
    }
    return item;
  }
}

class FavoritesManager {
  constructor(controller, context) {
    this.controller = controller;
    this.context = context;
    this.treeDataProvider = new FavoritesTreeDataProvider();
    this.treeView = vscode.window.createTreeView("tcSyslogFavorites", {
      treeDataProvider: this.treeDataProvider,
    });
    this.entries = [];
    this.entryMap = new Map();
    this.currentResource = null;
    this.currentDocument = null;
    this.latestParsed = null;
    this.favoritesUri = null;
    this.decoder = new TextDecoder("utf8");
    this.encoder = new TextEncoder();
    context.subscriptions.push(this.treeView);
    this.clear();
  }

  clear() {
    this.entries = [];
    this.entryMap.clear();
    this.currentResource = null;
    this.currentDocument = null;
    this.latestParsed = null;
    this.favoritesUri = null;
    this.treeView.message =
      "Add favorites from the Content view or directly from the editor.";
    this.treeDataProvider.clear();
  }

  async setActiveDocument(document, parsed) {
    if (!document) {
      this.clear();
      return;
    }
    this.currentResource = document.uri;
    this.currentDocument = document;
    this.latestParsed = parsed ?? null;
    this.favoritesUri = this.getFavoritesUri(document.uri);
    await this.loadFavorites();
  }

  getFavoritesUri(resource) {
    const parsedPath = path.parse(resource.fsPath);
    const fileName = `${parsedPath.name}.favorite`;
    return vscode.Uri.file(path.join(parsedPath.dir, fileName));
  }

  async loadFavorites() {
    this.entries = [];
    this.entryMap.clear();
    if (!this.favoritesUri) {
      this.refreshTree();
      return;
    }
    try {
      const buffer = await vscode.workspace.fs.readFile(this.favoritesUri);
      const text = this.decoder.decode(buffer);
      if (text.trim()) {
        const data = JSON.parse(text);
        const entries = Array.isArray(data?.entries) ? data.entries : [];
        this.entries = entries
          .map((entry) => this.normalizeEntry(entry))
          .filter((entry) => entry !== null);
      }
    } catch (error) {
      // ignore missing files or parse errors, start fresh
      this.entries = [];
      this.entryMap.clear();
      const isMissing =
        error && typeof error === "object" && error.code === "ENOENT";
      if (!isMissing) {
        vscode.window.showWarningMessage(
          `TC Syslog: unable to read favorites - ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    this.sortEntries();
    this.refreshTree();
  }

  normalizeEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const id =
      typeof entry.id === "string" && entry.id.trim()
        ? entry.id.trim()
        : this.generateId();
    const line = this.normalizeNumber(entry.line, null);
    const textSnippet =
      typeof entry.textSnippet === "string" ? entry.textSnippet : "";
    const label = typeof entry.label === "string" ? entry.label : "";
    const comment = typeof entry.comment === "string" ? entry.comment : "";
    const range = this.normalizeRange(entry.range);
    const createdAt = this.normalizeDate(entry.createdAt);
    const updatedAt = this.normalizeDate(entry.updatedAt);
    const favorite = {
      id,
      line,
      range,
      textSnippet,
      label,
      comment,
      createdAt,
      updatedAt,
    };
    this.entryMap.set(id, favorite);
    return favorite;
  }

  normalizeNumber(value, fallback) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }
    return value;
  }

  normalizeDate(value) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    return new Date().toISOString();
  }

  normalizeRange(range) {
    if (!range || typeof range !== "object") {
      return null;
    }
    const start = this.normalizePosition(range.start);
    const end = this.normalizePosition(range.end);
    if (!start && !end) {
      return null;
    }
    return { start, end };
  }

  normalizePosition(position) {
    if (!position || typeof position !== "object") {
      return null;
    }
    const line = this.normalizeNumber(position.line, null);
    const character = this.normalizeNumber(position.character, null);
    if (line === null && character === null) {
      return null;
    }
    return { line, character };
  }

  sortEntries() {
    this.entries.sort((a, b) => {
      const lineA =
        typeof a.line === "number" ? a.line : Number.POSITIVE_INFINITY;
      const lineB =
        typeof b.line === "number" ? b.line : Number.POSITIVE_INFINITY;
      if (lineA !== lineB) {
        return lineA - lineB;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  refreshTree() {
    if (!this.currentResource) {
      this.treeDataProvider.clear();
      this.treeView.message = "Open a .syslog file to manage favorites.";
      return;
    }
    if (!this.entries.length) {
      this.treeDataProvider.setModel({
        resource: this.currentResource,
        entries: [],
      });
      this.treeView.message = "No favorites saved for this syslog.";
      return;
    }
    this.treeView.message = undefined;
    const nodes = this.entries.map((favorite) => this.buildTreeNode(favorite));
    this.treeDataProvider.setModel({
      resource: this.currentResource,
      entries: nodes,
    });
  }

  buildTreeNode(favorite) {
    const lineLabel =
      typeof favorite.line === "number"
        ? `Line ${favorite.line + 1}`
        : favorite.range?.start?.line !== undefined
        ? `Line ${(favorite.range.start.line ?? 0) + 1}`
        : "";
    const baseLabel = favorite.label?.trim()
      ? favorite.label.trim()
      : favorite.textSnippet?.trim()
      ? favorite.textSnippet.trim()
      : lineLabel || favorite.id;
    const label = truncate(baseLabel, 80) || favorite.id;
    const description = favorite.comment?.trim()
      ? truncate(favorite.comment.trim(), 60)
      : lineLabel;
    const tooltipParts = [];
    if (favorite.textSnippet?.trim()) {
      tooltipParts.push(favorite.textSnippet.trim());
    }
    if (favorite.comment?.trim()) {
      tooltipParts.push(`Comment: ${favorite.comment.trim()}`);
    }
    const tooltip = tooltipParts.join("\n\n") || undefined;
    return {
      id: `favorite:${favorite.id}`,
      label,
      description,
      tooltip,
      line: favorite.line,
      icon: "star-full",
      contextValue: "syslogFavorite",
      favoriteId: favorite.id,
      command: {
        command: "tcSyslog.openFavorite",
        title: "Open Favorite",
        arguments: [favorite.id],
      },
    };
  }

  async addFavorite(payload) {
    if (!this.currentResource) {
      vscode.window.showWarningMessage(
        "TC Syslog: open a syslog file before adding favorites."
      );
      return;
    }
    const now = new Date().toISOString();
    const entry = {
      id: this.generateId(),
      line: this.normalizeNumber(payload.line, null),
      range: this.normalizeRange(payload.range),
      textSnippet: this.normalizeSnippet(payload.textSnippet),
      label:
        typeof payload.label === "string" ? payload.label.slice(0, 200) : "",
      comment:
        typeof payload.comment === "string" ? payload.comment.trim() : "",
      createdAt: now,
      updatedAt: now,
    };
    this.entries.push(entry);
    this.entryMap.set(entry.id, entry);
    this.sortEntries();
    await this.saveFavorites();
    this.refreshTree();
    vscode.window.setStatusBarMessage(
      "TC Syslog: added entry to favorites",
      2500
    );
  }

  normalizeSnippet(text) {
    if (typeof text !== "string") {
      return "";
    }
    const trimmed = text.trim();
    if (trimmed.length <= 500) {
      return trimmed;
    }
    return `${trimmed.slice(0, 497)}...`;
  }

  async editFavorite(node) {
    if (!node) {
      return;
    }
    const favorite = this.entryMap.get(node.favoriteId);
    if (!favorite) {
      vscode.window.showWarningMessage(
        "TC Syslog: unable to locate favorite entry."
      );
      return;
    }
    const value = await vscode.window.showInputBox({
      prompt: "Update favorite comment (leave blank to clear)",
      value: favorite.comment ?? "",
      placeHolder: "Optional comment",
      ignoreFocusOut: true,
    });
    if (value === undefined) {
      return;
    }
    favorite.comment = value.trim();
    favorite.updatedAt = new Date().toISOString();
    await this.saveFavorites();
    this.refreshTree();
    vscode.window.setStatusBarMessage("TC Syslog: favorite updated", 2000);
  }

  async removeFavorite(node) {
    if (!node) {
      return;
    }
    const favorite = this.entryMap.get(node.favoriteId);
    if (!favorite) {
      return;
    }
    const index = this.entries.findIndex((item) => item.id === favorite.id);
    if (index === -1) {
      return;
    }
    this.entries.splice(index, 1);
    this.entryMap.delete(favorite.id);
    await this.saveFavorites();
    this.refreshTree();
    vscode.window.setStatusBarMessage("TC Syslog: favorite removed", 2000);
  }

  async openFavoriteById(favoriteId) {
    const favorite = this.entryMap.get(favoriteId);
    if (!favorite) {
      vscode.window.showWarningMessage(
        "TC Syslog: favorite entry no longer exists."
      );
      return;
    }
    if (!this.currentResource) {
      return;
    }
    const targetLine =
      typeof favorite.line === "number"
        ? favorite.line
        : favorite.range?.start?.line ?? 0;
    const range = favorite.range
      ? {
          startLine: favorite.range.start?.line ?? targetLine,
          startCharacter: favorite.range.start?.character ?? 0,
          endLine:
            favorite.range.end?.line ??
            favorite.range.start?.line ??
            targetLine,
          endCharacter: favorite.range.end?.character ?? 0,
        }
      : undefined;
    await this.controller.reveal(this.currentResource, targetLine, range);
  }

  async saveFavorites() {
    if (!this.favoritesUri) {
      return;
    }
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      entries: this.entries,
    };
    const text = JSON.stringify(payload, null, 2);
    const buffer = this.encoder.encode(text);
    await vscode.workspace.fs.writeFile(this.favoritesUri, buffer);
  }

  generateId() {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

class SyslogController {
  constructor(context) {
    this.context = context;
    this.treeDataProvider = new SyslogTreeDataProvider();
    this.treeView = vscode.window.createTreeView("tcSyslogContent", {
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
    this.favoritesManager = new FavoritesManager(this, context);
    this.context.subscriptions.push(this.treeView);
    this.context.subscriptions.push({
      dispose: () => this.disposeDecorationTypes(),
    });

    this.reloadDecorationTypes();

    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        let refreshTree = false;
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
        if (event?.affectsConfiguration("tcSyslog.limits")) {
          refreshTree = true;
        }
        if (refreshTree && this.currentUri && this.latestParsed) {
          const model = buildTreeModel(this.latestParsed, this.currentUri);
          this.treeDataProvider.setModel(model);
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
    this.favoritesManager.clear();
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
    void this.favoritesManager.setActiveDocument(document, null);
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
    void this.favoritesManager.setActiveDocument(document, parsed);
  }

  async reveal(resource, line, selectionRange) {
    const hasLine = typeof line === "number" && Number.isFinite(line);
    const startLine = hasLine
      ? line
      : typeof selectionRange?.startLine === "number"
      ? selectionRange.startLine
      : selectionRange?.endLine ?? 0;
    if (!Number.isFinite(startLine)) {
      return;
    }
    try {
      const document = await vscode.workspace.openTextDocument(resource);
      const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false,
      });
      const clampLine = (value) => {
        const candidate = Number.isFinite(value) ? value : startLine;
        const maxLine = Math.max(0, document.lineCount - 1);
        return Math.max(0, Math.min(candidate, maxLine));
      };
      const makePosition = (lineValue, characterValue) => {
        const normalizedLine = clampLine(lineValue);
        const lineLength = document.lineAt(normalizedLine).text.length;
        const normalizedChar = Math.max(
          0,
          Math.min(
            Number.isFinite(characterValue) ? characterValue : 0,
            lineLength
          )
        );
        return new vscode.Position(normalizedLine, normalizedChar);
      };
      const selection = selectionRange
        ? new vscode.Selection(
            makePosition(
              selectionRange.startLine,
              selectionRange.startCharacter
            ),
            makePosition(selectionRange.endLine, selectionRange.endCharacter)
          )
        : (() => {
            const position = makePosition(startLine, 0);
            return new vscode.Selection(position, position);
          })();
      editor.selection = selection;
      const revealRange = new vscode.Range(selection.start, selection.end);
      editor.revealRange(
        revealRange,
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

  resolveNodeForCommand(node) {
    if (node) {
      return node;
    }
    const selection = this.treeView?.selection;
    if (selection && selection.length) {
      return selection[0];
    }
    return null;
  }

  ensureParsedModel() {
    if (!this.latestParsed || !this.currentUri) {
      vscode.window.showWarningMessage(
        "TC Syslog: no parsed data is available to copy"
      );
      return null;
    }
    return this.latestParsed;
  }

  async copyCategory(node) {
    const target = this.resolveNodeForCommand(node);
    if (!target) {
      vscode.window.showInformationMessage(
        "TC Syslog: select a category in the explorer to copy"
      );
      return;
    }
    if (!target.children || !target.children.length) {
      await this.copyEntry(target);
      return;
    }
    const parsed = this.ensureParsedModel();
    if (!parsed) {
      return;
    }
    const lines = collectNodeClipboardTexts(target, parsed, {
      includeChildren: true,
    });
    if (!lines.length) {
      vscode.window.showInformationMessage(
        "TC Syslog: nothing to copy for this category"
      );
      return;
    }
    await vscode.env.clipboard.writeText(lines.join("\n"));
    vscode.window.setStatusBarMessage(
      "TC Syslog: category copied to clipboard",
      2500
    );
  }

  async copyEntry(node) {
    const target = this.resolveNodeForCommand(node);
    if (!target) {
      vscode.window.showInformationMessage(
        "TC Syslog: select an entry to copy"
      );
      return;
    }
    if (target.children && target.children.length) {
      await this.copyCategory(target);
      return;
    }
    const parsed = this.ensureParsedModel();
    if (!parsed) {
      return;
    }
    const lines = collectNodeClipboardTexts(target, parsed, {
      includeChildren: false,
    });
    if (!lines.length) {
      vscode.window.showInformationMessage(
        "TC Syslog: nothing to copy for this entry"
      );
      return;
    }
    await vscode.env.clipboard.writeText(lines.join("\n"));
    vscode.window.setStatusBarMessage(
      "TC Syslog: entry copied to clipboard",
      2500
    );
  }

  async addFavorite(node) {
    if (!this.currentUri) {
      vscode.window.showInformationMessage(
        "TC Syslog: open a syslog file before adding favorites."
      );
      return;
    }
    const document = await this.getCurrentDocument();
    if (!document) {
      vscode.window.showWarningMessage(
        "TC Syslog: unable to load the active syslog document."
      );
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const usingTreeNode = Boolean(node);
    let line = null;
    let range = null;
    let textSnippet = "";
    let label = "";

    if (usingTreeNode && typeof node.line === "number") {
      line = node.line;
      const parsedLine =
        this.latestParsed?.lines?.[line] ?? document.lineAt(line).text ?? "";
      textSnippet = parsedLine;
      const normalized = textSnippet.trim();
      label =
        node.label?.trim() || truncate(normalized, 80) || `Line ${line + 1}`;
      range = {
        start: { line, character: 0 },
        end: { line, character: parsedLine.length },
      };
    } else if (
      editor &&
      editor.document.uri.toString() === this.currentUri.toString()
    ) {
      const selection = editor.selection;
      if (selection && !selection.isEmpty) {
        textSnippet = editor.document.getText(selection);
        line = selection.start.line;
        label = truncate(textSnippet.split(/\r?\n/)[0]?.trim() ?? "", 80);
        if (!label) {
          label = `Selection starting at line ${line + 1}`;
        }
        range = {
          start: {
            line: selection.start.line,
            character: selection.start.character,
          },
          end: {
            line: selection.end.line,
            character: selection.end.character,
          },
        };
      } else {
        line = selection?.active?.line ?? 0;
        textSnippet = editor.document.lineAt(line).text;
        label = truncate(textSnippet.trim(), 80) || `Line ${line + 1}`;
        range = {
          start: { line, character: 0 },
          end: { line, character: textSnippet.length },
        };
      }
    } else {
      line = 0;
      textSnippet = document.lineAt(line).text;
      label = truncate(textSnippet.trim(), 80) || `Line ${line + 1}`;
      range = {
        start: { line, character: 0 },
        end: { line, character: textSnippet.length },
      };
    }

    if (textSnippet === undefined || textSnippet === null) {
      textSnippet = "";
    }

    const comment = await vscode.window.showInputBox({
      prompt: "Add a comment for this favorite (optional)",
      placeHolder: "Comment",
      ignoreFocusOut: true,
    });
    if (comment === undefined) {
      return;
    }

    await this.favoritesManager.addFavorite({
      line,
      range,
      textSnippet,
      label,
      comment,
    });
  }

  async editFavorite(node) {
    await this.favoritesManager.editFavorite(node);
  }

  async removeFavorite(node) {
    await this.favoritesManager.removeFavorite(node);
  }

  async openFavorite(favoriteId) {
    await this.favoritesManager.openFavoriteById(favoriteId);
  }

  async getCurrentDocument() {
    if (!this.currentUri) {
      return null;
    }
    const existing = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === this.currentUri.toString()
    );
    if (existing) {
      return existing;
    }
    try {
      return await vscode.workspace.openTextDocument(this.currentUri);
    } catch (error) {
      vscode.window.showWarningMessage(
        `TC Syslog: unable to open document - ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    return null;
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

function getExplorerLimits() {
  const config = vscode.workspace.getConfiguration("tcSyslog");
  const readLimit = (key, fallback) => {
    const value = config.get(key);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }
    const normalized = Math.max(0, Math.floor(value));
    return normalized || fallback;
  };
  return {
    logLevelEntries: readLimit(
      "limits.logLevelEntries",
      DEFAULT_LIMITS.logLevelEntries
    ),
    sqlRowsPerDump: readLimit(
      "limits.sqlRowsPerDump",
      DEFAULT_LIMITS.sqlRowsPerDump
    ),
    journalRowsPerSection: readLimit(
      "limits.journalRowsPerSection",
      DEFAULT_LIMITS.journalRowsPerSection
    ),
    inlineSqlEntries: readLimit(
      "limits.inlineSqlEntries",
      DEFAULT_LIMITS.inlineSqlEntries
    ),
  };
}

function collectNodeClipboardTexts(node, parsed, options = {}) {
  if (!node || !parsed) {
    return [];
  }
  const includeChildren = options.includeChildren !== false;
  const seenLines = new Set();
  const collected = [];
  let order = 0;

  const visit = (current, traverseChildren) => {
    if (!current) {
      return;
    }
    if (current.clipboardExclude) {
      if (traverseChildren && Array.isArray(current.children)) {
        for (const child of current.children) {
          visit(child, true);
        }
      }
      return;
    }
    const resolved = resolveNodeClipboardEntries(current, parsed, seenLines);
    for (const item of resolved) {
      if (typeof item.text === "string" && item.text.length) {
        collected.push({
          text: item.text,
          line:
            typeof item.line === "number" && Number.isFinite(item.line)
              ? item.line
              : undefined,
          order,
        });
        order += 1;
      }
    }
    if (traverseChildren && Array.isArray(current.children)) {
      for (const child of current.children) {
        visit(child, true);
      }
    }
  };

  visit(node, includeChildren);

  collected.sort((a, b) => {
    const aLine =
      typeof a.line === "number" ? a.line : Number.POSITIVE_INFINITY;
    const bLine =
      typeof b.line === "number" ? b.line : Number.POSITIVE_INFINITY;
    if (aLine !== bLine) {
      return aLine - bLine;
    }
    return a.order - b.order;
  });

  return collected.map((entry) => entry.text);
}

function resolveNodeClipboardEntries(node, parsed, seenLines) {
  const results = [];

  const addLine = (line) => {
    if (typeof line !== "number" || !Number.isFinite(line) || line < 0) {
      return;
    }
    if (seenLines.has(line)) {
      return;
    }
    const text = getLineText(parsed, line);
    if (typeof text !== "string") {
      return;
    }
    seenLines.add(line);
    results.push({ text, line });
  };

  const addText = (text) => {
    if (typeof text !== "string" || !text.length) {
      return;
    }
    results.push({ text });
  };

  const processItem = (item) => {
    if (item === null || item === undefined) {
      return;
    }
    if (typeof item === "number") {
      addLine(item);
      return;
    }
    if (typeof item === "string") {
      addText(item);
      return;
    }
    if (typeof item === "object") {
      if (typeof item.line === "number") {
        addLine(item.line);
      }
      if (typeof item.text === "string") {
        addText(item.text);
      }
    }
  };

  if (Array.isArray(node.clipboardLines)) {
    for (const value of node.clipboardLines) {
      processItem(value);
    }
  }
  if (Array.isArray(node.clipboardItems)) {
    for (const value of node.clipboardItems) {
      processItem(value);
    }
  }
  if (typeof node.copyText === "string") {
    addText(node.copyText);
  }
  if (typeof node.line === "number") {
    processItem(node.line);
  }

  if (!results.length && (!node.children || !node.children.length)) {
    const fallback = buildNodeFallbackText(node);
    if (fallback) {
      addText(fallback);
    }
  }

  return results;
}

function getLineText(parsed, line) {
  if (!parsed || !Array.isArray(parsed.lines)) {
    return null;
  }
  if (line < 0 || line >= parsed.lines.length) {
    return null;
  }
  return parsed.lines[line];
}

function buildNodeFallbackText(node) {
  if (!node) {
    return null;
  }
  const parts = [];
  if (node.label) {
    parts.push(String(node.label));
  }
  if (node.description) {
    parts.push(String(node.description));
  }
  if (!parts.length) {
    return null;
  }
  return parts.join(parts.length > 1 ? " - " : "");
}

function buildTreeModel(parsed, resource) {
  if (!parsed) {
    return { resource, nodes: [] };
  }

  const limits = getExplorerLimits();
  const nodes = [];
  const overviewChildren = [];
  const isValidLine = (line) =>
    typeof line === "number" && Number.isFinite(line) && line >= 0;
  const collectLinesFromObjects = (items) =>
    items.map((item) => item?.line).filter((line) => isValidLine(line));

  if (parsed.header) {
    const headerPreview =
      parsed.header.lines?.map((entry) => entry.text).join(" - ") ?? "";
    const headerDescription = truncate(headerPreview, 120);
    const headerLines = collectLinesFromObjects(parsed.header.lines ?? []);
    overviewChildren.push({
      id: "overview:header",
      label: "Header",
      description: headerDescription,
      tooltip: headerPreview,
      line: parsed.header.line,
      icon: "symbol-keyword",
      clipboardLines: headerLines,
      contextValue: NODE_CONTEXT.ENTRY,
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
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const systemLines = collectLinesFromObjects(systemChildren);
    overviewChildren.push({
      id: "overview:systemInfo",
      label: `System Info (${systemChildren.length})`,
      children: systemChildren,
      icon: "info",
      clipboardLines: systemLines,
      contextValue: NODE_CONTEXT.GROUP,
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
        contextValue: NODE_CONTEXT.ENTRY,
      });
    }
  }
  if (envEntries.length) {
    const envLines = collectLinesFromObjects(envEntries);
    overviewChildren.push({
      id: "overview:env",
      label: `Environment (${envEntries.length})`,
      children: envEntries,
      icon: "gear",
      clipboardLines: envLines,
      contextValue: NODE_CONTEXT.GROUP,
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
        contextValue: NODE_CONTEXT.ENTRY,
      });
    }
  }
  if (dllEntries.length) {
    const dllLines = collectLinesFromObjects(dllEntries);
    overviewChildren.push({
      id: "overview:dll",
      label: `DLL Versions (${dllEntries.length})`,
      children: dllEntries,
      icon: "extensions",
      clipboardLines: dllLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.pomStats?.length) {
    const children = parsed.pomStats.map((entry, index) => ({
      id: `pom:${index}:${entry.line}`,
      label: `Entry at line ${entry.line + 1}`,
      description: parsed.lines?.[entry.line]?.trim() ?? "",
      line: entry.line,
      icon: "graph",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const pomLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:pom",
      label: `POM Statistics (${children.length})`,
      children,
      icon: "graph",
      clipboardLines: pomLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.endSessions?.length) {
    const children = parsed.endSessions.map((entry, index) => ({
      id: `end:${index}:${entry.line}`,
      label: `Marker at line ${entry.line + 1}`,
      description: parsed.lines?.[entry.line]?.trim() ?? "",
      line: entry.line,
      icon: "debug-stop",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const endLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:endSession",
      label: `End of Session (${children.length})`,
      children,
      icon: "debug-stop",
      clipboardLines: endLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.truncated?.length) {
    const children = parsed.truncated.map((entry, index) => ({
      id: `truncated:${index}:${entry.line}`,
      label: `Truncated at line ${entry.line + 1}`,
      description: parsed.lines?.[entry.line]?.trim() ?? "",
      line: entry.line,
      icon: "warning",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const truncatedLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:truncated",
      label: `Truncated (${children.length})`,
      children,
      icon: "warning",
      clipboardLines: truncatedLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (overviewChildren.length) {
    nodes.push({
      id: "root:overview",
      label: "Overview",
      children: overviewChildren,
      icon: "list-tree",
      expanded: true,
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.sqlDumps?.length) {
    const sqlNodes = parsed.sqlDumps.map((entry, index) => {
      const startLine = entry.line ?? 0;
      const endLine = entry.endLine ?? entry.line ?? startLine;
      const description =
        endLine > startLine
          ? `Lines ${startLine + 1}-${endLine + 1}`
          : `Line ${startLine + 1}`;
      const allRows = entry.rows ?? [];
      const displayRows = allRows.slice(0, limits.sqlRowsPerDump);
      const rowChildren = displayRows.map((row, rowIndex) => ({
        id: `sql:${index}:row:${rowIndex}:${row.line}`,
        label: truncate((row.text ?? "").trim() || `Row ${rowIndex + 1}`, 80),
        description: `Line ${row.line + 1}`,
        line: row.line,
        icon: "symbol-string",
        contextValue: NODE_CONTEXT.ENTRY,
        clipboardItems:
          typeof row.text === "string" && row.text.length
            ? [{ text: row.text }]
            : undefined,
      }));
      if (allRows.length > limits.sqlRowsPerDump) {
        rowChildren.push({
          id: `sql:${index}:overflow`,
          label: `... ${allRows.length - limits.sqlRowsPerDump} more rows`,
          description: "Use search in the editor for additional entries",
          icon: "ellipsis",
          clipboardExclude: true,
        });
      }
      const dumpLines = [];
      for (let lineIndex = startLine; lineIndex <= endLine; lineIndex += 1) {
        if (isValidLine(lineIndex)) {
          dumpLines.push(lineIndex);
        }
      }
      return {
        id: `sql:${index}:${startLine}`,
        label: `Dump #${index + 1}`,
        description,
        line: startLine,
        children: rowChildren,
        icon: "database",
        clipboardLines: dumpLines,
        contextValue: NODE_CONTEXT.GROUP,
      };
    });
    nodes.push({
      id: "root:sql",
      label: `SQL Profile Dumps (${parsed.sqlDumps.length})`,
      children: sqlNodes,
      icon: "database",
      contextValue: NODE_CONTEXT.CATEGORY,
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
          .slice(0, limits.journalRowsPerSection)
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
              contextValue: NODE_CONTEXT.ENTRY,
              clipboardItems:
                typeof row.text === "string" && row.text.length
                  ? [{ text: row.text }]
                  : undefined,
            };
          });
        if ((section.rows?.length ?? 0) > limits.journalRowsPerSection) {
          rowChildren.push({
            id: `journal:${index}:overflow`,
            label: `... ${
              section.rows.length - limits.journalRowsPerSection
            } more entries`,
            description: "Use search in the editor for additional entries",
            icon: "ellipsis",
            clipboardExclude: true,
          });
        }
        const sectionLines = [];
        const startLine = section.line ?? 0;
        const endLine = section.endLine ?? section.line ?? startLine;
        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex += 1) {
          if (isValidLine(lineIndex)) {
            sectionLines.push(lineIndex);
          }
        }
        return {
          id: `journal:${index}:${section.line}`,
          label,
          description,
          line: section.line,
          children: rowChildren,
          icon: "graph",
          clipboardLines: sectionLines,
          contextValue: NODE_CONTEXT.GROUP,
        };
      }
    );
    nodes.push({
      id: "root:journal",
      label: `Journalled Times (${journalNodes.length})`,
      children: journalNodes,
      icon: "graph",
      contextValue: NODE_CONTEXT.CATEGORY,
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
      const display = orderedEntries.slice(0, limits.logLevelEntries);
      const children = display.map((entry) => ({
        id: `log:${level}:${entry.line}`,
        label: `${entry.timestamp} - ${truncate(entry.message, 80)}`,
        description: entry.id,
        tooltip: entry.message,
        line: entry.line,
        icon: "symbol-event",
        contextValue: NODE_CONTEXT.ENTRY,
        clipboardItems:
          typeof entry.message === "string" && entry.message.length
            ? [{ text: entry.message }]
            : undefined,
      }));
      if (entries.length > limits.logLevelEntries) {
        children.push({
          id: `log:${level}:overflow`,
          label: `... ${entries.length - limits.logLevelEntries} more`,
          description: "Use search in the editor for additional entries",
          icon: "ellipsis",
          clipboardExclude: true,
        });
      }
      const levelLines = collectLinesFromObjects(entries);
      return {
        id: `level:${level}`,
        label: `${level} (${entries.length})`,
        children,
        icon: LEVEL_ICONS[level] ?? "circle-filled",
        clipboardLines: levelLines,
        contextValue: NODE_CONTEXT.GROUP,
      };
    })
    .filter((node) => node.children.length);
  if (levelNodes.length) {
    const allLogLines = collectLinesFromObjects(parsed.logLines ?? []);
    nodes.push({
      id: "root:levels",
      label: `Log Levels (${parsed.logLines.length})`,
      children: levelNodes,
      icon: "symbol-class",
      clipboardLines: allLogLines,
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.inlineSqlLines?.length) {
    const inlineEntries = parsed.inlineSqlLines.slice(
      0,
      limits.inlineSqlEntries
    );
    const inlineSqlNodes = inlineEntries.map((entry, index) => ({
      id: `inlineSql:${index}:${entry.line}`,
      label: truncate(
        (entry.text ?? "").trim() || `SQL Statement ${index + 1}`,
        80
      ),
      description:
        isValidLine(entry.line) && entry.line !== undefined
          ? `Line ${entry.line + 1}`
          : "",
      line: entry.line,
      icon: entry.fromLog ? "symbol-operator" : "symbol-string",
      contextValue: NODE_CONTEXT.ENTRY,
      clipboardItems:
        typeof entry.text === "string" && entry.text.length
          ? [{ text: entry.text }]
          : undefined,
    }));
    if ((parsed.inlineSqlLines.length ?? 0) > limits.inlineSqlEntries) {
      inlineSqlNodes.push({
        id: "inlineSql:overflow",
        label: `... ${
          parsed.inlineSqlLines.length - limits.inlineSqlEntries
        } more entries`,
        description: "Use search in the editor for additional entries",
        icon: "ellipsis",
        clipboardExclude: true,
      });
    }
    const inlineLines = collectLinesFromObjects(parsed.inlineSqlLines ?? []);
    nodes.push({
      id: "root:inlineSql",
      label: `Inline SQL (${parsed.inlineSqlLines.length})`,
      children: inlineSqlNodes,
      icon: "symbol-operator",
      clipboardLines: inlineLines,
      contextValue: NODE_CONTEXT.CATEGORY,
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
    vscode.commands.registerCommand("tcSyslog.copyCategory", (node) =>
      controller.copyCategory(node)
    ),
    vscode.commands.registerCommand("tcSyslog.copyEntry", (node) =>
      controller.copyEntry(node)
    ),
    vscode.commands.registerCommand("tcSyslog.addFavorite", (node) =>
      controller.addFavorite(node)
    ),
    vscode.commands.registerCommand("tcSyslog.editFavorite", (node) =>
      controller.editFavorite(node)
    ),
    vscode.commands.registerCommand("tcSyslog.removeFavorite", (node) =>
      controller.removeFavorite(node)
    ),
    vscode.commands.registerCommand("tcSyslog.openFavorite", (favoriteId) =>
      controller.openFavorite(favoriteId)
    ),
    vscode.commands.registerCommand("tcSyslog.openThemePanel", () =>
      controller.openThemePanel()
    )
  );
}

export function deactivate() {
  // nothing to clean up explicitly
}
