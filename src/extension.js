import * as vscode from 'vscode';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseTeamcenterLog } from './parse/teamcenterLogParser.js';

const MAX_LOG_ITEMS_PER_LEVEL = 200;
const LEVEL_ORDER = ['ERROR', 'WARN', 'NOTE', 'INFO', 'DEBUG'];
const LEVEL_ICONS = {
  ERROR: 'error',
  WARN: 'warning',
  NOTE: 'book',
  INFO: 'info',
  DEBUG: 'beaker'
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
      ? (node.expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed)
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
        command: 'tcSyslog.revealLine',
        title: 'Reveal in Editor',
        arguments: [this.model.resource, node.line]
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
    this.treeView = vscode.window.createTreeView('tcSyslog.explorer', {
      treeDataProvider: this.treeDataProvider
    });
    this.treeView.message = 'Open a .syslog file to see parsed categories.';
    this.currentUri = null;
    this.refreshTimer = undefined;
    this.pendingDocument = undefined;
    this.themePanel = null;
    this.context.subscriptions.push(this.treeView);
  }

  initialize() {
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => this.handleActiveEditorChange(editor)),
      vscode.workspace.onDidOpenTextDocument((document) => this.handleDocumentOpened(document)),
      vscode.workspace.onDidCloseTextDocument((document) => this.handleDocumentClosed(document)),
      vscode.workspace.onDidChangeTextDocument((event) => this.handleDocumentChanged(event))
    );
    this.refreshActive();
  }

  handleActiveEditorChange(editor) {
    if (editor && isSyslogDocument(editor.document)) {
      this.refresh(editor.document);
      return;
    }

    if (!editor && this.currentUri) {
      this.clearView('Open a .syslog file to see parsed categories.');
      return;
    }

    if (editor && !isSyslogDocument(editor.document) && this.currentUri) {
      this.clearView('Open a .syslog file to see parsed categories.');
    }
  }

  handleDocumentOpened(document) {
    if (isSyslogDocument(document)) {
      this.refresh(document);
    }
  }

  handleDocumentClosed(document) {
    if (this.currentUri && document.uri.toString() === this.currentUri.toString()) {
      this.clearView('Open a .syslog file to see parsed categories.');
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
    this.currentUri = null;
    this.treeDataProvider.clear();
    this.treeView.message = message;
  }

  refreshActive() {
    const active = vscode.window.activeTextEditor?.document;
    this.refresh(active);
  }

  refresh(document) {
    if (!document || !isSyslogDocument(document)) {
      this.clearView('Open a .syslog file to see parsed categories.');
      return;
    }

    const content = document.getText();
    let parsed;
    try {
      parsed = parseTeamcenterLog(content);
    } catch (error) {
      this.treeDataProvider.clear();
      const message = error instanceof Error ? error.message : String(error);
      this.treeView.message = `Failed to parse syslog: ${message}`;
      vscode.window.showErrorMessage(`TC Syslog: unable to parse file - ${message}`);
      return;
    }
    this.currentUri = document.uri;
    this.treeView.message = undefined;
    const model = buildTreeModel(parsed, document.uri);
    this.treeDataProvider.setModel(model);
  }

  async reveal(resource, line) {
    if (line === undefined || line === null) {
      return;
    }
    try {
      const document = await vscode.workspace.openTextDocument(resource);
      const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false
      });
      const position = new vscode.Position(line, 0);
      const range = new vscode.Range(position, position);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reveal log line: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async openThemePanel() {
    if (this.themePanel) {
      this.themePanel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'tcSyslogTheme',
      'TC Syslog Colors & Fonts',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    this.context.subscriptions.push(panel);

    const htmlUri = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'theme.html');
    try {
      const html = await readFile(htmlUri.fsPath, 'utf8');
      panel.webview.html = html;
    } catch (error) {
      panel.webview.html = `<html><body><h3>Unable to load theme UI</h3><pre>${error instanceof Error ? error.message : String(error)}</pre></body></html>`;
    }

    panel.webview.onDidReceiveMessage(async (message) => {
      if (!message || message.type !== 'save') {
        return;
      }
      await this.saveThemeSettings(message.values ?? {});
    });

    panel.onDidDispose(() => {
      this.themePanel = null;
    });

    this.themePanel = panel;
  }

  async saveThemeSettings(values) {
    const config = vscode.workspace.getConfiguration('tcSyslog');
    const operations = [];
    const mapping = [
      ['colors.level.INFO.fg', values?.INFO],
      ['colors.level.WARNING.fg', values?.WARNING],
      ['colors.level.ERROR.fg', values?.ERROR],
      ['colors.level.NOTE.fg', values?.NOTE],
      ['colors.level.DEBUG.fg', values?.DEBUG],
      ['colors.level.FATAL.fg', values?.FATAL]
    ];
    for (const [key, value] of mapping) {
      if (typeof value === 'string' && value) {
        operations.push(config.update(key, value, vscode.ConfigurationTarget.Workspace));
      }
    }
    if (typeof values?.fontFamily === 'string' && values.fontFamily) {
      operations.push(config.update('font.family', values.fontFamily, vscode.ConfigurationTarget.Workspace));
    }
    if (values?.fontSize) {
      const numericSize = Number(values.fontSize);
      if (!Number.isNaN(numericSize)) {
        operations.push(config.update('font.size', numericSize, vscode.ConfigurationTarget.Workspace));
      }
    }
    try {
      await Promise.all(operations);
      vscode.window.showInformationMessage('TC Syslog appearance settings updated.');
    } catch (error) {
      vscode.window.showErrorMessage(`Unable to update settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function isSyslogDocument(document) {
  if (!document) {
    return false;
  }
  const fileName = document.fileName?.toLowerCase?.() ?? document.uri.fsPath.toLowerCase();
  return fileName.endsWith('.syslog');
}

function buildTreeModel(parsed, resource) {
  if (!parsed) {
    return { resource, nodes: [] };
  }

  const nodes = [];
  const overviewChildren = [];

  if (parsed.header) {
    const headerPreview = parsed.header.lines?.map((entry) => entry.text).join(' - ') ?? '';
    const headerDescription = truncate(headerPreview, 120);
    overviewChildren.push({
      id: 'overview:header',
      label: 'Header',
      description: headerDescription,
      tooltip: headerPreview,
      line: parsed.header.line,
      icon: 'symbol-keyword'
    });
  }

  if (parsed.systemInfo?.length) {
    const systemChildren = parsed.systemInfo.map((entry) => ({
      id: `system:${entry.line}`,
      label: entry.key,
      description: entry.value,
      tooltip: entry.value,
      line: entry.line,
      icon: 'info'
    }));
    overviewChildren.push({
      id: 'overview:systemInfo',
      label: `System Info (${systemChildren.length})`,
      children: systemChildren,
      icon: 'info'
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
        icon: 'symbol-parameter'
      });
    }
  }
  if (envEntries.length) {
    overviewChildren.push({
      id: 'overview:env',
      label: `Environment (${envEntries.length})`,
      children: envEntries,
      icon: 'gear'
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
        icon: 'library'
      });
    }
  }
  if (dllEntries.length) {
    overviewChildren.push({
      id: 'overview:dll',
      label: `DLL Versions (${dllEntries.length})`,
      children: dllEntries,
      icon: 'extensions'
    });
  }

  if (parsed.pomStats?.length) {
    overviewChildren.push({
      id: 'overview:pom',
      label: `POM Statistics (${parsed.pomStats.length})`,
      children: parsed.pomStats.map((entry, index) => ({
        id: `pom:${index}:${entry.line}`,
        label: `Entry at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? '',
        line: entry.line,
        icon: 'graph'
      })),
      icon: 'graph'
    });
  }

  if (parsed.endSessions?.length) {
    overviewChildren.push({
      id: 'overview:endSession',
      label: `End of Session (${parsed.endSessions.length})`,
      children: parsed.endSessions.map((entry, index) => ({
        id: `end:${index}:${entry.line}`,
        label: `Marker at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? '',
        line: entry.line,
        icon: 'debug-stop'
      })),
      icon: 'debug-stop'
    });
  }

  if (parsed.truncated?.length) {
    overviewChildren.push({
      id: 'overview:truncated',
      label: `Truncated (${parsed.truncated.length})`,
      children: parsed.truncated.map((entry, index) => ({
        id: `truncated:${index}:${entry.line}`,
        label: `Truncated at line ${entry.line + 1}`,
        description: parsed.lines?.[entry.line]?.trim() ?? '',
        line: entry.line,
        icon: 'warning'
      })),
      icon: 'warning'
    });
  }

  if (overviewChildren.length) {
    nodes.push({
      id: 'root:overview',
      label: 'Overview',
      children: overviewChildren,
      icon: 'list-tree',
      expanded: true
    });
  }

  if (parsed.sqlDumps?.length) {
    nodes.push({
      id: 'root:sql',
      label: `SQL Profile Dumps (${parsed.sqlDumps.length})`,
      children: parsed.sqlDumps.map((entry, index) => ({
        id: `sql:${index}:${entry.line}`,
        label: `Dump #${index + 1}`,
        description: `Line ${entry.line + 1}`,
        line: entry.line,
        icon: 'database'
      })),
      icon: 'database'
    });
  }

  if (parsed.journalSections?.length) {
    nodes.push({
      id: 'root:journal',
      label: `Journal Sections (${parsed.journalSections.length})`,
      children: parsed.journalSections.map((entry, index) => ({
        id: `journal:${index}:${entry.line}`,
        label: `Journal #${index + 1}`,
        description: `Line ${entry.line + 1}`,
        line: entry.line,
        icon: 'notebook'
      })),
      icon: 'notebook'
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
        icon: 'symbol-event'
      }));
      if (entries.length > MAX_LOG_ITEMS_PER_LEVEL) {
        children.push({
          id: `log:${level}:overflow`,
          label: `... ${entries.length - MAX_LOG_ITEMS_PER_LEVEL} more`,
          description: 'Use search in the editor for additional entries',
          icon: 'ellipsis'
        });
      }
      return {
        id: `level:${level}`,
        label: `${level} (${entries.length})`,
        children,
        icon: LEVEL_ICONS[level] ?? 'circle-filled'
      };
    })
    .filter((node) => node.children.length);
  if (levelNodes.length) {
    nodes.push({
      id: 'root:levels',
      label: `Log Levels (${parsed.logLines.length})`,
      children: levelNodes,
      icon: 'symbol-class'
    });
  }

  return { resource, nodes };
}

function winBasename(filePath) {
  if (!filePath) {
    return '';
  }
  const normalized = filePath.replace(/\\/g, '/');
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
    vscode.commands.registerCommand('tcSyslog.refresh', () => controller.refreshActive()),
    vscode.commands.registerCommand('tcSyslog.revealLine', (resource, line) => controller.reveal(resource, line)),
    vscode.commands.registerCommand('tcSyslog.openThemePanel', () => controller.openThemePanel())
  );
}

export function deactivate() {
  // nothing to clean up explicitly
}

