import * as vscode from "vscode";

/**
 * Registers all user-facing commands. The goal is to keep the command surface separate from the
 * controller implementation so future UX changes remain isolated here.
 */
export function registerUserCommands(context, controller) {
  const disposables = [
    vscode.commands.registerCommand("tcSyslogViewer.refresh", () =>
      controller.refreshActive()
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.revealLine",
      (resource, line, range) => controller.reveal(resource, line, range)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.copyCategory", (node) =>
      controller.copyCategory(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.copyEntry", (node) =>
      controller.copyEntry(node)
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.closeOccurrencesResult",
      (node) => controller.closeOccurrencesResult(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.addFavorite", (node) =>
      controller.addFavorite(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.editFavorite", (node) =>
      controller.editFavorite(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.removeFavorite", (node) =>
      controller.removeFavorite(node)
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.openFavorite",
      (favoriteId) => controller.openFavorite(favoriteId)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.findAllOccurrences", () =>
      controller.findAllOccurrences()
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.findAllOccurrencesOpenInEditor",
      () => controller.findAllOccurrencesOpenInEditor()
    ),
  ];

  context.subscriptions.push(...disposables);
}
