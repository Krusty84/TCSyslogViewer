import * as vscode from "vscode";

import { SyslogTreeDataProvider } from "../../../general/treeProviders.js";

export function tcSyslogViewerBasicView(context) {
  const treeDataProvider = new SyslogTreeDataProvider();
  const treeView = vscode.window.createTreeView("tcSyslogViewerBasic", {
    treeDataProvider,
  });
  treeView.message = "Open a .syslog file to see parsed categories.";
  context.subscriptions.push(treeView);
  return { treeDataProvider, treeView };
}
