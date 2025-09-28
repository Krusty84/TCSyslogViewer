import { tcSyslogViewerOccurrencesView } from "./views/tcSyslogViewerOccurrencesView.js";

export function centerBottomPanel(context) {
  const occurrences = tcSyslogViewerOccurrencesView(context);
  return { occurrences };
}
