import * as vscode from "vscode";

import { SyslogController } from "./logic/syslogController.js";
import { registerUserCommands } from "./interactions/userInteractions.js";

/**
 * Entry point for the TC Syslog viewer extension.
 */
export function activate(context) {
  const controller = new SyslogController(context);
  controller.initialize();

  registerUserCommands(context, controller);
}

export function deactivate() {}
