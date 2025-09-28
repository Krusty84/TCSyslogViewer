import * as vscode from "vscode";

import { SyslogTreeDataProvider } from "../../../general/treeProviders.js";

export function tcSyslogViewerExtraView(context) {
  const treeDataProvider = new SyslogTreeDataProvider();
  const treeView = vscode.window.createTreeView("tcSyslogViewerExtra", {
    treeDataProvider,
  });
  treeView.message = "Open a .syslog file to see extra categories.";
  context.subscriptions.push(treeView);
  return { treeDataProvider, treeView };
}
