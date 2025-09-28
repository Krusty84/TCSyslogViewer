import * as vscode from "vscode";

import { FavoritesTreeDataProvider } from "../../../general/treeProviders.js";

export function tcSyslogViewerFavoritesView(context) {
  const treeDataProvider = new FavoritesTreeDataProvider();
  const treeView = vscode.window.createTreeView("tcSyslogViewerFavorites", {
    treeDataProvider,
  });
  treeView.message =
    "Add favorites from the Content view or directly from the editor.";
  context.subscriptions.push(treeView);
  return { treeDataProvider, treeView };
}
