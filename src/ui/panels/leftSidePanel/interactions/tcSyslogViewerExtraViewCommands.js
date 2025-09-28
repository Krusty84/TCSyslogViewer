import * as vscode from "vscode";

export function tcSyslogViewerExtraViewCommands(controller) {
  return [
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
  ];
}
