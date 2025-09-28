import * as vscode from "vscode";
import { NODE_CONTEXT } from "../../util/constants.js";
import { truncate } from "../../util/helpers.js";

/**
 * Tree data providers power the primary explorer views.
 */
export class SyslogTreeDataProvider {
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
        command: "tcSyslogViewer.revealLine",
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

export class FavoritesTreeDataProvider {
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
        command: "tcSyslogViewer.revealLine",
        title: "Reveal in Editor",
        arguments: [this.model.resource, node.line],
      };
    }
    return item;
  }
}

export class OccurrencesTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.sessions = [];
  }

  addSession({ resource, query, matches, truncated }) {
    const sessionId = this.generateId();
    const normalizedMatches = (matches ?? []).map((match, index) => ({
      ...match,
      type: "match",
      id: `occurrences:match:${sessionId}:${index}`,
      sessionId,
      resource,
      query,
    }));
    const session = {
      id: sessionId,
      resource,
      query,
      truncated: Boolean(truncated),
      createdAt: new Date(),
      matches: normalizedMatches,
      treeNode: {
        type: "session",
        id: `occurrences:session:${sessionId}`,
        sessionId,
      },
      summaryNode: {
        type: "summary",
        id: `occurrences:summary:${sessionId}`,
        sessionId,
      },
    };
    this.sessions = [session, ...this.sessions];
    this._onDidChangeTreeData.fire();
    return session;
  }

  removeSession(sessionId) {
    const index = this.sessions.findIndex(
      (session) => session.id === sessionId
    );
    if (index === -1) {
      return null;
    }
    const [removed] = this.sessions.splice(index, 1);
    this._onDidChangeTreeData.fire();
    return removed;
  }

  clear() {
    if (!this.sessions.length) {
      return;
    }
    this.sessions = [];
    this._onDidChangeTreeData.fire();
  }

  hasSessions() {
    return this.sessions.length > 0;
  }

  getChildren(element) {
    if (!element) {
      return this.sessions.map((session) => session.treeNode);
    }
    if (element.type === "session") {
      const session = this.findSession(element.sessionId);
      if (!session) {
        return [];
      }
      return [session.summaryNode, ...session.matches];
    }
    return [];
  }

  getTreeItem(node) {
    if (node.type === "session") {
      const session = this.findSession(node.sessionId);
      const rawQuery = session?.query ?? "";
      const label = truncate(rawQuery, 60) || "(whitespace)";
      const matchCount = session?.matches.length ?? 0;
      const truncated = Boolean(session?.truncated);
      const countLabel = truncated ? `${matchCount}+` : `${matchCount}`;
      const plural = matchCount === 1 && !truncated ? "" : "es";
      const treeItem = new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      treeItem.description = `${countLabel} match${plural}`;
      const locationLabel = session?.resource
        ? vscode.workspace.asRelativePath(session.resource, false)
        : undefined;
      const tooltipLines = [
        `Search term: "${rawQuery}"`,
        `${countLabel} match${plural}`,
      ];
      if (locationLabel) {
        tooltipLines.push(`File: ${locationLabel}`);
      }
      treeItem.tooltip = tooltipLines.join("\n");
      treeItem.iconPath = new vscode.ThemeIcon("search");
      treeItem.contextValue = "syslogOccurrencesResult";
      return treeItem;
    }

    if (node.type === "summary") {
      const session = this.findSession(node.sessionId);
      if (!session) {
        return new vscode.TreeItem("Summary");
      }
      const countLabel = session.truncated
        ? `${session.matches.length}+`
        : `${session.matches.length}`;
      const summaryLabel = `${countLabel} matches for "${truncate(
        session.query ?? "",
        40
      )}"`;
      const summaryItem = new vscode.TreeItem(summaryLabel);
      const timestamp = session.createdAt.toLocaleString();
      summaryItem.tooltip = `${summaryLabel}\n${timestamp}`;
      summaryItem.iconPath = new vscode.ThemeIcon("list-selection");
      summaryItem.contextValue = "syslogOccurrencesSummary";
      summaryItem.description = session.truncated
        ? "Results truncated"
        : undefined;
      return summaryItem;
    }

    if (node.type === "match") {
      const label = truncate(node.text ?? "", 140) || "(empty line)";
      const item = new vscode.TreeItem(
        label,
        vscode.TreeItemCollapsibleState.None
      );
      const lineNumber = (node.line ?? 0) + 1;
      item.description = `Line ${lineNumber}`;
      item.tooltip = `Line ${lineNumber}, Column ${(node.column ?? 0) + 1}`;
      item.command = {
        command: "tcSyslogViewer.revealLine",
        title: "Reveal Mention",
        arguments: [
          node.resource,
          node.line,
          {
            startLine: node.line,
            startCharacter: node.column,
            endLine: node.line,
            endCharacter: node.column + (node.length ?? 0),
          },
        ],
      };
      item.iconPath = new vscode.ThemeIcon("search");
      item.contextValue = "syslogOccurrencesMatch";
      return item;
    }

    return new vscode.TreeItem("Unknown node");
  }

  findSession(sessionId) {
    return this.sessions.find((session) => session.id === sessionId) ?? null;
  }

  generateId() {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}
