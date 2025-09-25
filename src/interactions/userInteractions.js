import * as vscode from "vscode";

/**
 * Registers all user-facing commands. The goal is to keep the command surface separate from the
 * controller implementation so future UX changes remain isolated here.
 */
export function registerUserCommands(context, controller) {
  const disposables = [
    vscode.commands.registerCommand("tcSyslog.refresh", () =>
      controller.refreshActive()
    ),
    vscode.commands.registerCommand("tcSyslog.revealLine", (resource, line, range) =>
      controller.reveal(resource, line, range)
    ),
    vscode.commands.registerCommand("tcSyslog.copyCategory", (node) =>
      controller.copyCategory(node)
    ),
    vscode.commands.registerCommand("tcSyslog.copyEntry", (node) =>
      controller.copyEntry(node)
    ),
    vscode.commands.registerCommand("tcSyslog.closeMentionsSession", (node) =>
      controller.closeMentionsSession(node)
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
    vscode.commands.registerCommand("tcSyslog.findAllMentions", () =>
      controller.findAllMentions()
    ),
    vscode.commands.registerCommand("tcSyslog.findAllMentionsInEditor", () =>
      controller.findAllMentionsInEditor()
    ),
  ];

  context.subscriptions.push(...disposables);
}
