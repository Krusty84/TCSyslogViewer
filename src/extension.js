import * as vscode from "vscode";

import { SyslogController } from "./core/syslogController.js";
import { registerUserCommands } from "./ui/interactions/userInteractions.js";

/**
 * Entry point for the TC Syslog viewer extension.
 */
export function activate(context) {
  const controller = new SyslogController(context);
  controller.initialize();

  registerUserCommands(context, controller);
}

export function deactivate() {}
