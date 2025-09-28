import { SyslogController } from "./core/syslogController.js";
import { registerUserCommands } from "./ui/interactions/userInteractions.js";
import { leftSidePanel } from "./ui/panels/leftSidePanel/leftSidePanel.js";
import { centerBottomPanel } from "./ui/panels/centerBottomPanel/centerBottomPanel.js";

/**
 * Entry point for the TC Syslog viewer extension.
 */
export function activate(context) {
  const sidebar = leftSidePanel(context);
  const panel = centerBottomPanel(context);
  const controller = new SyslogController(context, sidebar, panel);
  controller.initialize();

  registerUserCommands(context, controller);
}

export function deactivate() {}
