import { SyslogController } from "./core/syslogController.js";
import { registerUserCommands } from "./ui/general/userInteractions.js";
import { leftSidePanel } from "./ui/panels/leftSidePanel/leftSidePanel.js";
import { centerBottomPanel } from "./ui/panels/centerBottomPanel/centerBottomPanel.js";
import { registerAiChatView } from "./ui/panels/centerBottomPanel/views/tcSyslogViewerAiView.js";

/**
 * Entry point for the TC Syslog viewer extension.
 */
export function activate(context) {
  const sidebar = leftSidePanel(context);
  const panel = centerBottomPanel(context);
  const controller = new SyslogController(context, sidebar, panel);
  controller.initialize();
  registerAiChatView(context, controller);

  registerUserCommands(context, controller);
}

export function deactivate() {}
