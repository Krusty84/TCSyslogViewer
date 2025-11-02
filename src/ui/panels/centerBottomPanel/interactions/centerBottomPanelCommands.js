import * as vscode from "vscode";

export function centerBottomPanelCommands(controller) {
  return [
    vscode.commands.registerCommand(
      "tcSyslogViewer.closeOccurrencesResult",
      (node) => controller.closeOccurrencesResult(node)
    ),
    vscode.commands.registerCommand("tcSyslogViewer.findAllOccurrences", () =>
      controller.findAllOccurrences()
    ),
    vscode.commands.registerCommand(
      "tcSyslogViewer.findAllOccurrencesOpenInEditor",
      () => controller.findAllOccurrencesOpenInEditor()
    ),
  ];
}
