import * as vscode from "vscode";
import { parseTeamcenterLog } from "../parse/tcServerSyslogParser.js";

import {
  LEVEL_ORDER,
  LEVEL_CONFIG_OVERRIDES,
  FIND_OCCURRENCES_LIMIT,
} from "../util/constants.js";
import {
  collectNodeClipboardTexts,
  highlightMatchInLine,
  isSyslogDocument,
  sanitizeForUntitledLabel,
  truncate,
} from "../util/helpers.js";
import {
  OccurrencesTreeDataProvider,
  SyslogTreeDataProvider,
} from "../ui/general/treeProviders.js";
import { FavoritesManager } from "./favoritesManager.js";
import { buildTreeModel } from "./treeModel.js";

/**
 * Central controller responsible for parsing logs, wiring tree views, and coordinating decorations.
 * User-facing commands compose on top of this class so business logic remains isolated.
 */
export class SyslogController {
  constructor(context, sidebar, panel) {
    this.context = context;
    const basicView = sidebar?.basic;
    if (basicView) {
      this.treeDataProvider = basicView.treeDataProvider;
      this.treeView = basicView.treeView;
    } else {
      this.treeDataProvider = new SyslogTreeDataProvider();
      this.treeView = vscode.window.createTreeView("tcSyslogViewerBasic", {
        treeDataProvider: this.treeDataProvider,
      });
      this.context.subscriptions.push(this.treeView);
    }
    if (!this.treeView.message) {
      this.treeView.message = "Open a .syslog file to see parsed categories.";
    }

    const extraView = sidebar?.extra;
    if (extraView) {
      this.extraTreeDataProvider = extraView.treeDataProvider;
      this.extraTreeView = extraView.treeView;
    } else {
      this.extraTreeDataProvider = new SyslogTreeDataProvider();
      this.extraTreeView = vscode.window.createTreeView("tcSyslogViewerExtra", {
        treeDataProvider: this.extraTreeDataProvider,
      });
      this.context.subscriptions.push(this.extraTreeView);
    }
    if (!this.extraTreeView.message) {
      this.extraTreeView.message =
        "Open a .syslog file to see extra categories.";
    }
    this.currentUri = null;
    this.refreshTimer = undefined;
    this.pendingDocument = undefined;
    this.levelDecorationTypes = new Map();
    this.levelBackgroundDecorationTypes = new Map();
    this.headerDecorationType = undefined;
    this.envKeyDecorationType = undefined;
    this.envValueDecorationType = undefined;
    this.timestampDecorationType = undefined;
    this.idDecorationType = undefined;
    this.messageDecorationType = undefined;
    this.sqlDecorationType = undefined;
    this.inlineSqlDecorationType = undefined;
    this.journalDecorationType = undefined;
    this.hierarchyTraceDecorationType = undefined;
    this.accessCheckDecorationType = undefined;
    this.workflowHandlerDecorationType = undefined;
    this.baseFontDecorationType = undefined;
    this.latestParsed = null;
    this.favoritesManager = new FavoritesManager(
      this,
      context,
      sidebar?.favorites
    );

    const occurrencesView = panel?.occurrences;
    if (occurrencesView) {
      this.occurrencesDataProvider = occurrencesView.treeDataProvider;
      this.occurrencesView = occurrencesView.treeView;
    } else {
      this.occurrencesDataProvider = new OccurrencesTreeDataProvider();
      this.occurrencesView = vscode.window.createTreeView(
        "tcSyslogViewerOccurrences",
        {
          treeDataProvider: this.occurrencesDataProvider,
        }
      );
      this.context.subscriptions.push(this.occurrencesView);
    }
    if (this.occurrencesView && !this.occurrencesView.message) {
      this.occurrencesView.message =
        "Run Find All Occurrences to populate results.";
    }
    this.previewDocuments = new Set();
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
    // Subscribe to VS Code workspace/editor events so the controller stays in sync with the UI.
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
      event.affectsConfiguration("tcSyslogViewer.colors") ||
      event.affectsConfiguration("tcSyslogViewer.font")
    );
  }

  reloadDecorationTypes() {
    // Decorations are recreated so configuration changes (colors, fonts) take effect immediately.
    this.disposeDecorationTypes();
    const config = vscode.workspace.getConfiguration("tcSyslogViewer");
    const levelDefaults = {
      FATAL: { fg: "#ff00aa", bg: "#ff00aa22" },
      ERROR: { fg: "#ff4242", bg: "#ff424222" },
      WARN: { fg: "#b8860b", bg: "#b8860b22" },
      NOTE: { fg: "#3aa669", bg: "#3aa66922" },
      INFO: { fg: "#1479ff", bg: "#1479ff22" },
      DEBUG: { fg: "#888888", bg: "#88888822" },
    };
    const tokenDefaults = {
      timestamp: "#262627ff",
      id: "#c586c0",
      message: "#262627ff",
      sqlBackground: "#f8f53b7f",
      sqlInlineBackground: "#f8f53b7f",
      journalBackground: "#f8f53b7f",
      hierarchyBackground: "#f8f53b40",
      accessBackground: "#4b9eff33",
      workflowBackground: "#5c98ff55",
      accessBackground: "#4b9eff33",
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
    this.levelBackgroundDecorationTypes = new Map();
    for (const level of LEVEL_ORDER) {
      const configKey = LEVEL_CONFIG_OVERRIDES[level] ?? level;
      const fgValue = config.get(`colors.level.${configKey}.fg`);
      const bgValue = config.get(`colors.level.${configKey}.bg`);
      const defaults = levelDefaults[level] ?? {};
      const color =
        typeof fgValue === "string" && fgValue
          ? fgValue
          : defaults.fg ?? "#ffffff";
      const backgroundColor =
        typeof bgValue === "string" && bgValue
          ? bgValue
          : defaults.bg ?? undefined;

      const tokenOptions = {
        color,
        fontWeight: "bold",
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      };
      applyFontOptions(tokenOptions);
      this.levelDecorationTypes.set(
        level,
        vscode.window.createTextEditorDecorationType(tokenOptions)
      );

      if (backgroundColor) {
        this.levelBackgroundDecorationTypes.set(
          level,
          vscode.window.createTextEditorDecorationType({
            backgroundColor,
            isWholeLine: true,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
          })
        );
      }
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

    const hierarchyBackgroundSetting = config.get(
      "colors.journal.hierarchy.background"
    );
    const hierarchyBackground =
      typeof hierarchyBackgroundSetting === "string" &&
      hierarchyBackgroundSetting
        ? hierarchyBackgroundSetting
        : tokenDefaults.hierarchyBackground ?? journalBackground;
    this.hierarchyTraceDecorationType =
      vscode.window.createTextEditorDecorationType({
        backgroundColor: hierarchyBackground,
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      });

    const accessBackgroundSetting = config.get("colors.access.background");
    const accessBackground =
      typeof accessBackgroundSetting === "string" && accessBackgroundSetting
        ? accessBackgroundSetting
        : tokenDefaults.accessBackground;
    this.accessCheckDecorationType =
      vscode.window.createTextEditorDecorationType({
        backgroundColor: accessBackground,
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      });

    const workflowBackgroundSetting = config.get("colors.workflow.background");
    const workflowBackground =
      typeof workflowBackgroundSetting === "string" && workflowBackgroundSetting
        ? workflowBackgroundSetting
        : tokenDefaults.workflowBackground;
    this.workflowHandlerDecorationType =
      vscode.window.createTextEditorDecorationType({
        backgroundColor: workflowBackground,
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
    if (this.levelBackgroundDecorationTypes) {
      for (const decoration of this.levelBackgroundDecorationTypes.values()) {
        decoration.dispose();
      }
    }
    this.levelDecorationTypes = new Map();
    this.levelBackgroundDecorationTypes = new Map();
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
    if (this.hierarchyTraceDecorationType) {
      this.hierarchyTraceDecorationType.dispose();
      this.hierarchyTraceDecorationType = undefined;
    }
    if (this.accessCheckDecorationType) {
      this.accessCheckDecorationType.dispose();
      this.accessCheckDecorationType = undefined;
    }
    if (this.workflowHandlerDecorationType) {
      this.workflowHandlerDecorationType.dispose();
      this.workflowHandlerDecorationType = undefined;
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
    const levelBackgroundRanges = new Map();
    for (const level of this.levelBackgroundDecorationTypes.keys()) {
      levelBackgroundRanges.set(level, []);
    }
    const timestampRanges = [];
    const idRanges = [];
    const messageRanges = [];
    const inlineSqlRanges = [];
    const inlineSqlLinesSeen = new Set();
    const journalRanges = [];
    const sqlRanges = [];
    const hierarchyRanges = [];
    const accessRanges = [];
    const workflowRanges = [];

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
      const backgroundRanges = levelBackgroundRanges.get(entry.level);
      if (backgroundRanges) {
        backgroundRanges.push(new vscode.Range(lineNumber, 0, lineNumber, 0));
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

    for (const trace of parsed.journalHierarchyTraces ?? []) {
      const startLine = trace.line ?? 0;
      const endLine = trace.endLine ?? trace.line ?? startLine;
      const normalizedStart = Math.max(0, startLine);
      const normalizedEnd = Math.max(normalizedStart, endLine);
      const endLineLength = parsed.lines?.[normalizedEnd]?.length ?? 0;
      hierarchyRanges.push(
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

    for (const access of parsed.accessChecks ?? []) {
      const lineIndex = access.line ?? 0;
      const normalizedLine = Math.max(0, lineIndex);
      const length = parsed.lines?.[normalizedLine]?.length ?? 0;
      accessRanges.push(
        new vscode.Range(normalizedLine, 0, normalizedLine, Math.max(0, length))
      );
    }

    for (const handler of parsed.workflowHandlers ?? []) {
      const startLine = Math.max(0, handler.line ?? 0);
      const endLine = Math.max(
        startLine,
        handler.endLine ?? handler.line ?? startLine
      );
      const startLength = parsed.lines?.[startLine]?.length ?? 0;
      workflowRanges.push(
        new vscode.Range(startLine, 0, startLine, Math.max(0, startLength))
      );
      if (endLine !== startLine) {
        const endLength = parsed.lines?.[endLine]?.length ?? 0;
        workflowRanges.push(
          new vscode.Range(endLine, 0, endLine, Math.max(0, endLength))
        );
      }
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
      for (const [level, decoration] of this.levelBackgroundDecorationTypes) {
        editor.setDecorations(
          decoration,
          levelBackgroundRanges.get(level) ?? []
        );
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
      if (this.hierarchyTraceDecorationType) {
        editor.setDecorations(
          this.hierarchyTraceDecorationType,
          hierarchyRanges
        );
      }
      if (this.accessCheckDecorationType) {
        editor.setDecorations(this.accessCheckDecorationType, accessRanges);
      }
      if (this.workflowHandlerDecorationType) {
        editor.setDecorations(
          this.workflowHandlerDecorationType,
          workflowRanges
        );
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
      for (const decoration of this.levelBackgroundDecorationTypes.values()) {
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
      if (this.hierarchyTraceDecorationType) {
        editor.setDecorations(this.hierarchyTraceDecorationType, []);
      }
      if (this.accessCheckDecorationType) {
        editor.setDecorations(this.accessCheckDecorationType, []);
      }
      if (this.workflowHandlerDecorationType) {
        editor.setDecorations(this.workflowHandlerDecorationType, []);
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
      const uriKey = editor.document.uri.toString();
      if (this.previewDocuments.has(uriKey)) {
        return;
      }
      this.clearView("Open a .syslog file to see parsed categories.");
    }
  }

  handleDocumentOpened(document) {
    if (isSyslogDocument(document)) {
      this.refresh(document);
    }
  }

  handleDocumentClosed(document) {
    const uriKey = document.uri.toString();
    if (this.previewDocuments.has(uriKey)) {
      this.previewDocuments.delete(uriKey);
      return;
    }
    if (this.currentUri && uriKey === this.currentUri.toString()) {
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
    this.extraTreeDataProvider.clear();
    this.treeView.message = message;
    this.extraTreeView.message = "Open a .syslog file to see extra categories.";
    this.favoritesManager.clear();
    this.occurrencesDataProvider.clear();
    if (this.occurrencesView) {
      this.occurrencesView.message =
        "Run Find All Occurrences to populate results.";
    }
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
      this.extraTreeDataProvider.clear();
      const message = error instanceof Error ? error.message : String(error);
      this.treeView.message = `Failed to parse syslog: ${message}`;
      this.extraTreeView.message =
        "Open a .syslog file to see extra categories.";
      this.clearDecorations(document.uri.toString());
      this.latestParsed = null;
      vscode.window.showErrorMessage(
        `TC Syslog: unable to parse file - ${message}`
      );
      return;
    }
    this.currentUri = document.uri;
    this.latestParsed = parsed;
    const model = buildTreeModel(parsed, document.uri);
    const basicIds = new Set(["root:overview", "root:levels"]);
    const basicNodes = (model.nodes ?? []).filter((node) =>
      basicIds.has(node.id)
    );
    const extraNodes = (model.nodes ?? []).filter(
      (node) => !basicIds.has(node.id)
    );
    this.treeDataProvider.setModel({
      resource: model.resource,
      nodes: basicNodes,
    });
    this.extraTreeDataProvider.setModel({
      resource: model.resource,
      nodes: extraNodes,
    });
    this.treeView.message = basicNodes.length
      ? undefined
      : "No basic content available.";
    this.extraTreeView.message = extraNodes.length
      ? undefined
      : "No extra content available.";
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
    const extraSelection = this.extraTreeView?.selection;
    if (extraSelection && extraSelection.length) {
      return extraSelection[0];
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
    const entries = collectNodeClipboardTexts(target, parsed, {
      includeChildren: true,
      returnObjects: true,
    });
    if (!entries.length) {
      vscode.window.showInformationMessage(
        "TC Syslog: nothing to copy for this category"
      );
      return;
    }
    await this.openTextPreviewDocument(entries, {
      nodeLabel: target.label,
      prefix: "category",
      title: "TC Syslog Category Preview",
      statusMessage: "TC Syslog: category opened in editor",
      resource: this.currentUri,
    });
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
    const entries = collectNodeClipboardTexts(target, parsed, {
      includeChildren: false,
      returnObjects: true,
    });
    if (!entries.length) {
      vscode.window.showInformationMessage(
        "TC Syslog: nothing to copy for this entry"
      );
      return;
    }
    await this.openTextPreviewDocument(entries, {
      nodeLabel: target.label,
      prefix: "entry",
      title: "TC Syslog Entry Preview",
      statusMessage: "TC Syslog: entry opened in editor",
      resource: this.currentUri,
    });
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

  async findAllOccurrences() {
    const context = this.prepareOccurrencesSearchContext();
    if (!context) {
      return;
    }

    const { document, needle, haystack } = context;
    const { matches, truncated } = this.collectOccurrencesMatches(
      document,
      haystack,
      needle
    );

    if (!matches.length) {
      this.handleNoOccurrencesFound(needle);
      return;
    }

    const session = this.occurrencesDataProvider.addSession({
      resource: document.uri,
      query: needle,
      matches,
      truncated,
    });

    if (this.occurrencesView) {
      this.occurrencesView.message = truncated
        ? `Showing first ${matches.length} occurrences for "${truncate(
            needle,
            60
          )}".`
        : undefined;
    }

    await vscode.commands.executeCommand(
      "workbench.view.extension.tcSyslogViewerCenterBottomPanel"
    );
    if (this.occurrencesView) {
      try {
        await this.occurrencesView.reveal(session.treeNode, {
          expand: true,
          focus: false,
          select: false,
        });
      } catch (error) {
        // ignore reveal issues
      }
      const firstMatch = session.matches[0];
      if (firstMatch) {
        try {
          await this.occurrencesView.reveal(firstMatch, {
            focus: false,
            select: false,
          });
        } catch (error) {
          // ignore reveal issues
        }
      }
    }
  }

  async findAllOccurrencesOpenInEditor() {
    const context = this.prepareOccurrencesSearchContext();
    if (!context) {
      return;
    }

    const { document, needle, haystack } = context;
    const { matches, truncated } = this.collectOccurrencesMatches(
      document,
      haystack,
      needle
    );

    if (!matches.length) {
      this.handleNoOccurrencesFound(needle);
      return;
    }

    this.occurrencesDataProvider.addSession({
      resource: document.uri,
      query: needle,
      matches,
      truncated,
    });
    if (this.occurrencesView) {
      this.occurrencesView.message = truncated
        ? `Showing first ${matches.length} occurrences for "${truncate(
            needle,
            60
          )}".`
        : undefined;
    }

    await this.openOccurrencesDocument(document, needle, matches, truncated);
  }

  prepareOccurrencesSearchContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isSyslogDocument(editor.document)) {
      vscode.window.showInformationMessage(
        "TC Syslog: open a Teamcenter syslog file and select text to search."
      );
      return null;
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);
    const needle = selectedText.trim();
    if (!needle) {
      vscode.window.showInformationMessage(
        "TC Syslog: select some text before running Find All Occurrences."
      );
      return null;
    }

    const haystack = document.getText();
    if (!haystack.length) {
      vscode.window.showWarningMessage("TC Syslog: current document is empty.");
      return null;
    }

    return { document, needle, haystack };
  }

  collectOccurrencesMatches(document, haystack, needle) {
    const matches = [];
    const searchStep = Math.max(needle.length, 1);
    let searchIndex = 0;
    let truncated = false;

    while (true) {
      const foundIndex = haystack.indexOf(needle, searchIndex);
      if (foundIndex === -1) {
        break;
      }
      const startPosition = document.positionAt(foundIndex);
      const endPosition = document.positionAt(foundIndex + needle.length);
      const lineText = document.lineAt(startPosition.line).text;
      matches.push({
        line: startPosition.line,
        column: startPosition.character,
        length: needle.length,
        text: lineText,
        start: startPosition,
        end: endPosition,
      });

      const nextSearchStart = foundIndex + searchStep;
      if (matches.length >= FIND_OCCURRENCES_LIMIT) {
        truncated = haystack.indexOf(needle, nextSearchStart) !== -1;
        break;
      }
      searchIndex = nextSearchStart;
    }

    return { matches, truncated };
  }

  handleNoOccurrencesFound(needle) {
    vscode.window.showInformationMessage(
      `TC Syslog: no occurrences of "${truncate(needle, 80)}" found.`
    );
    if (this.occurrencesView && !this.occurrencesDataProvider.hasSessions()) {
      this.occurrencesView.message = `No occurrences found for "${truncate(
        needle,
        60
      )}".`;
    }
  }

  buildOccurrencesDocumentContent(document, needle, matches, truncated) {
    const relativePath = vscode.workspace.asRelativePath(document.uri, false);
    const absolutePath = document.uri.fsPath;
    const matchCountLabel = truncated
      ? `${matches.length}+ (limit ${FIND_OCCURRENCES_LIMIT})`
      : `${matches.length}`;
    const headerLines = [
      "Find Occurrences Report",
      `Query: "${needle}"`,
      `File: ${relativePath}`,
      `Matches: ${matchCountLabel}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];

    const body = matches
      .map((match, index) => {
        const lineNumber = (match.line ?? 0) + 1;
        const columnNumber = (match.column ?? 0) + 1;
        const highlighted = highlightMatchInLine(
          match.text ?? "",
          match.column,
          match.length
        );
        const location = `${absolutePath}:${lineNumber}:${columnNumber}`;
        return `${
          index + 1
        }. Line ${lineNumber}, Column ${columnNumber}\n   Location: ${location}\n   ${highlighted}`;
      })
      .join("\n\n");

    const truncatedNote = truncated
      ? `\n\nNote: only the first ${matches.length} matches are listed (limit ${FIND_OCCURRENCES_LIMIT}).`
      : "";

    return `${headerLines.join("\n")}\n\n${body}${truncatedNote}`;
  }

  async openOccurrencesDocument(document, needle, matches, truncated) {
    const content = this.buildOccurrencesDocumentContent(
      document,
      needle,
      matches,
      truncated
    );
    const sanitizedQuery = sanitizeForUntitledLabel(needle);
    const label = truncate(sanitizedQuery, 32) || "query";
    const untitledUri = vscode.Uri.parse(
      `untitled:Occurrences-${label}-${Date.now()}.txt`
    );
    let uriKey;

    try {
      const targetDocument = await vscode.workspace.openTextDocument(
        untitledUri
      );
      uriKey = targetDocument.uri.toString();
      this.previewDocuments.add(uriKey);
      const editor = await vscode.window.showTextDocument(targetDocument, {
        preview: false,
        viewColumn: vscode.ViewColumn.Beside,
      });
      const output = content.endsWith("\n") ? content : `${content}\n`;
      const success = await editor.edit((builder) => {
        builder.insert(new vscode.Position(0, 0), output);
      });
      if (success) {
        const start = new vscode.Position(0, 0);
        editor.selection = new vscode.Selection(start, start);
        editor.revealRange(new vscode.Range(start, start));
      } else {
        vscode.window.showWarningMessage(
          "TC Syslog: unable to populate occurrences document."
        );
        this.previewDocuments.delete(uriKey);
      }
    } catch (error) {
      if (uriKey) {
        this.previewDocuments.delete(uriKey);
      }
      vscode.window.showErrorMessage(
        `TC Syslog: unable to open occurrences document - ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  closeOccurrencesResult(node) {
    const sessionId =
      typeof node === "string"
        ? node
        : node?.sessionId ?? node?.id?.replace(/^occurrences:session:/, "");
    if (!sessionId) {
      return;
    }
    this.occurrencesDataProvider.removeSession(sessionId);
    if (!this.occurrencesDataProvider.hasSessions() && this.occurrencesView) {
      this.occurrencesView.message =
        "Run Find All Occurrences to populate results.";
    }
  }

  async openTextPreviewDocument(entries, options = {}) {
    const normalizedEntries = Array.isArray(entries)
      ? entries
          .map((entry) => {
            if (typeof entry === "string") {
              return { text: entry, line: undefined };
            }
            if (!entry || typeof entry !== "object") {
              return null;
            }
            const text =
              typeof entry.text === "string"
                ? entry.text
                : String(entry.text ?? "");
            const line =
              typeof entry.line === "number" && Number.isFinite(entry.line)
                ? entry.line
                : undefined;
            return { text, line };
          })
          .filter((entry) => entry !== null)
      : [];
    if (!normalizedEntries.length) {
      vscode.window.showInformationMessage(
        "TC Syslog: nothing to display in preview."
      );
      return;
    }
    const hasContent = normalizedEntries.some((entry) => entry.text.length);

    const resource =
      options.resource instanceof vscode.Uri
        ? options.resource
        : this.currentUri;
    const relativePath = resource
      ? vscode.workspace.asRelativePath(resource, false)
      : undefined;
    const absolutePath = resource?.fsPath;

    const title =
      typeof options.title === "string" && options.title.trim().length
        ? options.title.trim()
        : "TC Syslog Data Preview";
    const contextLabel =
      typeof options.nodeLabel === "string" && options.nodeLabel.trim().length
        ? options.nodeLabel.trim()
        : undefined;

    const headerLines = [
      title,
      contextLabel ? `Context: ${contextLabel}` : undefined,
      relativePath ? `File: ${relativePath}` : undefined,
      `Entries: ${normalizedEntries.length}`,
      `Generated: ${new Date().toLocaleString()}`,
    ].filter(Boolean);

    const body = normalizedEntries
      .map((entry, index) => {
        const lineNumber =
          typeof entry.line === "number" ? entry.line + 1 : undefined;
        const segments = [];
        const heading = lineNumber
          ? `Line ${lineNumber}`
          : `Entry ${index + 1}`;
        segments.push(`${index + 1}. ${heading}`);
        if (lineNumber && absolutePath) {
          segments.push(`   Location: ${absolutePath}:${lineNumber}`);
        } else if (lineNumber) {
          segments.push(`   Line: ${lineNumber}`);
        }
        const textContent = entry.text.length ? entry.text : "(empty)";
        segments.push(`   ${textContent}`);
        return segments.join("\n");
      })
      .join("\n\n");

    const content = `${headerLines.join("\n")}\n\n${body}`;
    const finalContent = content.endsWith("\n") ? content : `${content}\n`;

    const prefix =
      typeof options.prefix === "string" && options.prefix.trim()
        ? options.prefix.trim()
        : "tc-syslog";
    const baseLabel =
      typeof options.nodeLabel === "string" && options.nodeLabel.trim()
        ? options.nodeLabel.trim()
        : prefix;

    const sanitizedPrefix = sanitizeForUntitledLabel(prefix);
    const sanitizedLabel = truncate(sanitizeForUntitledLabel(baseLabel), 32);
    const fileLabel = `${sanitizedPrefix}-${
      sanitizedLabel || "data"
    }-${Date.now()}`;
    const untitledUri = vscode.Uri.parse(`untitled:${fileLabel}.txt`);
    let uriKey;

    try {
      const document = await vscode.workspace.openTextDocument(untitledUri);
      uriKey = document.uri.toString();
      this.previewDocuments.add(uriKey);
      const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        viewColumn: vscode.ViewColumn.Beside,
      });
      const success = await editor.edit((builder) => {
        builder.insert(new vscode.Position(0, 0), finalContent);
      });
      if (!success) {
        vscode.window.showWarningMessage(
          "TC Syslog: unable to open preview editor."
        );
        this.previewDocuments.delete(uriKey);
        return;
      }
      const start = new vscode.Position(0, 0);
      editor.selection = new vscode.Selection(start, start);
      editor.revealRange(new vscode.Range(start, start));
      if (
        typeof options.statusMessage === "string" &&
        options.statusMessage &&
        hasContent
      ) {
        vscode.window.setStatusBarMessage(options.statusMessage, 2500);
      }
    } catch (error) {
      if (uriKey) {
        this.previewDocuments.delete(uriKey);
      }
      vscode.window.showErrorMessage(
        `TC Syslog: unable to open preview editor - ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
