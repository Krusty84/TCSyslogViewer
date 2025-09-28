import { leftSidePanelCommands } from "../panels/leftSidePanel/interactions/leftSidePanelCommands.js";
import { tcSyslogViewerExtraViewCommands } from "../panels/leftSidePanel/interactions/tcSyslogViewerExtraViewCommands.js";
import { centerBottomPanelCommands } from "../panels/centerBottomPanel/interactions/centerBottomPanelCommands.js";

/**
 * Registers all user-facing commands. The goal is to keep the command surface separate from the
 * controller implementation so future UX changes remain isolated here.
 */
export function registerUserCommands(context, controller) {
  const disposables = [
    ...leftSidePanelCommands(controller),
    ...tcSyslogViewerExtraViewCommands(controller),
    ...centerBottomPanelCommands(controller),
  ];

  context.subscriptions.push(...disposables);
}
