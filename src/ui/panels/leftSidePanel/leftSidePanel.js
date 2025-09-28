import { tcSyslogViewerBasicView } from "./views/tcSyslogViewerBasicView.js";
import { tcSyslogViewerExtraView } from "./views/tcSyslogViewerExtraView.js";
import { tcSyslogViewerFavoritesView } from "./views/tcSyslogViewerFavoritesView.js";

export function leftSidePanel(context) {
  const basic = tcSyslogViewerBasicView(context);
  const extra = tcSyslogViewerExtraView(context);
  const favorites = tcSyslogViewerFavoritesView(context);
  return { basic, extra, favorites };
}
