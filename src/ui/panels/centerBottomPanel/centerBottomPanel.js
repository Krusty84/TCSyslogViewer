/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 Alexey Sedoykin
 * SPDX-License-Identifier: MIT
 */

import { tcSyslogViewerOccurrencesView } from "./views/tcSyslogViewerOccurrencesView.js";

export function centerBottomPanel(context) {
  const occurrences = tcSyslogViewerOccurrencesView(context);
  return { occurrences };
}
