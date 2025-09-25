import * as vscode from "vscode";

import { SyslogController } from "./business/syslogController.js";
import { registerUserCommands } from "./interactions/userInteractions.js";

/**
 * Entry point for the TC Syslog viewer extension. Wiring is intentionally light: we delegate to
 * specialised modules for UI, business logic, and user interactions.
 */
export function activate(context) {
  const controller = new SyslogController(context);
  controller.initialize();

  registerUserCommands(context, controller);
}

export function deactivate() {
  // Nothing to clean up explicitly; disposables are registered with the context.
}
