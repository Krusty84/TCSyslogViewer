import * as vscode from "vscode";
import path from "node:path";
import { TextDecoder, TextEncoder } from "node:util";

import { FavoritesTreeDataProvider } from "../ui/treeProviders.js";
import { NODE_CONTEXT } from "../constants.js";
import { truncate } from "../util/helpers.js";

/**
 * Handles persistence and presentation of user-defined favorites. The manager owns the tree data
 * provider instance and exposes CRUD helpers consumed by the controller and command layer.
 */
export class FavoritesManager {
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
    const displayLabel =
      favorite.label?.trim() ||
      truncate(favorite.textSnippet?.split(/\r?\n/)[0] ?? "", 80) ||
      "Favorite entry";
    const description =
      typeof favorite.line === "number"
        ? `Line ${favorite.line + 1}`
        : favorite.range?.start?.line !== undefined
        ? `Line ${(favorite.range.start.line ?? 0) + 1}`
        : favorite.range?.start?.line ?? 0;
    return {
      id: favorite.id,
      label: displayLabel,
      description,
      tooltip: favorite.comment || favorite.textSnippet?.slice(0, 200),
      icon: "star-full",
      favoriteId: favorite.id,
      contextValue: NODE_CONTEXT.ENTRY,
      line:
        typeof favorite.line === "number"
          ? favorite.line
          : favorite.range?.start?.line ?? null,
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
