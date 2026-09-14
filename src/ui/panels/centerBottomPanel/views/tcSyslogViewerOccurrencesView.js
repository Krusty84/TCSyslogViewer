/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 Alexey Sedoykin
 * SPDX-License-Identifier: MIT
 */

import * as vscode from "vscode";

import { OccurrencesTreeDataProvider } from "../../../general/treeProviders.js";

export function tcSyslogViewerOccurrencesView(context) {
  const treeDataProvider = new OccurrencesTreeDataProvider();
  const treeView = vscode.window.createTreeView("tcSyslogViewerOccurrences", {
    treeDataProvider,
  });
  treeView.message = "Run Find All Occurrences to populate results.";
  context.subscriptions.push(treeView);
  return { treeDataProvider, treeView };
}
