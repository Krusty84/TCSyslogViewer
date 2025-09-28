import * as vscode from "vscode";

export function leftSidePanelCommands(controller) {
  return [
    vscode.commands.registerCommand("tcSyslogViewer.refresh", () =>
      controller.refreshActive()
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.revealLine",
      (resource, line, range) => controller.reveal(resource, line, range)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.openCategory", (node) =>
      controller.copyCategory(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.openEntry", (node) =>
      controller.copyEntry(node)
    ),
  ];
}
