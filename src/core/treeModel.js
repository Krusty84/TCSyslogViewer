import { NODE_CONTEXT, LEVEL_ICONS, LEVEL_ORDER } from "../util/constants.js";
import { truncate, winBasename, levelRank } from "../util/helpers.js";

/**
 * Builds the hierarchical tree model consumed by the explorer views. Keeping this logic here lets
 * us reuse it in tests or other controllers without pulling in VS Code specifics.
 */
export function buildTreeModel(parsed, resource) {
  if (!parsed) {
    return { resource, nodes: [] };
  }

  const nodes = [];
  const overviewChildren = [];
  const isValidLine = (line) =>
    typeof line === "number" && Number.isFinite(line) && line >= 0;
  const collectLinesFromObjects = (items) =>
    items.map((item) => item?.line).filter((line) => isValidLine(line));

  if (parsed.header) {
    const headerPreview =
      parsed.header.lines?.map((entry) => entry.text).join(" - ") ?? "";
    const headerDescription = truncate(headerPreview, 120);
    const headerLines = collectLinesFromObjects(parsed.header.lines ?? []);
    overviewChildren.push({
      id: "overview:header",
      label: "Header",
      description: headerDescription,
      tooltip: headerPreview,
      line: parsed.header.line,
      icon: "symbol-keyword",
      clipboardLines: headerLines,
      contextValue: NODE_CONTEXT.ENTRY,
    });
  }

  if (parsed.systemInfo?.length) {
    const systemChildren = parsed.systemInfo.map((entry) => ({
      id: `system:${entry.line}`,
      label: entry.key,
      description: entry.value,
      tooltip: entry.value,
      line: entry.line,
      icon: "info",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const systemLines = collectLinesFromObjects(systemChildren);
    overviewChildren.push({
      id: "overview:systemInfo",
      label: `System Info (${systemChildren.length})`,
      children: systemChildren,
      icon: "info",
      clipboardLines: systemLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  const envEntries = [];
  for (let index = 0; index < (parsed.envSections?.length ?? 0); index += 1) {
    const section = parsed.envSections[index];
    for (const entry of section.entries ?? []) {
      envEntries.push({
        id: `env:${index}:${entry.line}`,
        label: entry.key,
        description: entry.value,
        tooltip: entry.value,
        line: entry.line,
        icon: "symbol-parameter",
        contextValue: NODE_CONTEXT.ENTRY,
      });
    }
  }
  if (envEntries.length) {
    const envLines = collectLinesFromObjects(envEntries);
    overviewChildren.push({
      id: "overview:env",
      label: `Environment (${envEntries.length})`,
      children: envEntries,
      icon: "gear",
      clipboardLines: envLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  const dllEntries = [];
  for (let index = 0; index < (parsed.dllSections?.length ?? 0); index += 1) {
    const section = parsed.dllSections[index];
    for (const entry of section.entries ?? []) {
      dllEntries.push({
        id: `dll:${index}:${entry.line}`,
        label: winBasename(entry.path),
        description: entry.version,
        tooltip: `${entry.path} (${entry.version})`,
        line: entry.line,
        icon: "extensions",
        contextValue: NODE_CONTEXT.ENTRY,
      });
    }
  }
  if (dllEntries.length) {
    const dllLines = collectLinesFromObjects(dllEntries);
    overviewChildren.push({
      id: "overview:dll",
      label: `DLL Versions (${dllEntries.length})`,
      children: dllEntries,
      icon: "extensions",
      clipboardLines: dllLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.pomStats?.length) {
    const children = parsed.pomStats.map((entry, index) => ({
      id: `pom:${index}:${entry.line}`,
      label: `Entry at line ${entry.line + 1}`,
      description: parsed.lines?.[entry.line]?.trim() ?? "",
      line: entry.line,
      icon: "graph",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const pomLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:pom",
      label: `POM Statistics (${children.length})`,
      children,
      icon: "graph",
      clipboardLines: pomLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.endSessions?.length) {
    const children = parsed.endSessions.map((entry, index) => ({
      id: `end:${index}:${entry.line}`,
      label: `Marker at line ${entry.line + 1}`,
      description: parsed.lines?.[entry.line]?.trim() ?? "",
      line: entry.line,
      icon: "debug-stop",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const endLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:endSessions",
      label: `End Sessions (${children.length})`,
      children,
      icon: "debug-stop",
      clipboardLines: endLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (parsed.truncatedNotifications?.length) {
    const children = parsed.truncatedNotifications.map((entry, index) => ({
      id: `truncate:${index}:${entry.line}`,
      label: entry.message,
      description: `Line ${entry.line + 1}`,
      line: entry.line,
      icon: "warning",
      contextValue: NODE_CONTEXT.ENTRY,
    }));
    const truncatedLines = collectLinesFromObjects(children);
    overviewChildren.push({
      id: "overview:truncated",
      label: `Truncated (${children.length})`,
      children,
      icon: "warning",
      clipboardLines: truncatedLines,
      contextValue: NODE_CONTEXT.GROUP,
    });
  }

  if (overviewChildren.length) {
    nodes.push({
      id: "root:overview",
      label: "Overview",
      children: overviewChildren,
      icon: "list-tree",
      expanded: true,
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.sqlDumps?.length) {
    const sqlNodes = parsed.sqlDumps.map((entry, index) => {
      const startLine = entry.line ?? 0;
      const endLine = entry.endLine ?? entry.line ?? startLine;
      const description =
        endLine > startLine
          ? `Lines ${startLine + 1}-${endLine + 1}`
          : `Line ${startLine + 1}`;
      const allRows = entry.rows ?? [];
      const rowChildren = allRows.map((row, rowIndex) => ({
        id: `sql:${index}:row:${rowIndex}:${row.line}`,
        label: truncate((row.text ?? "").trim() || `Row ${rowIndex + 1}`, 80),
        description: `Line ${row.line + 1}`,
        line: row.line,
        icon: "symbol-string",
        contextValue: NODE_CONTEXT.ENTRY,
        clipboardItems:
          typeof row.text === "string" && row.text.length
            ? [{ text: row.text }]
            : undefined,
      }));
      const dumpLines = [];
      for (let lineIndex = startLine; lineIndex <= endLine; lineIndex += 1) {
        if (isValidLine(lineIndex)) {
          dumpLines.push(lineIndex);
        }
      }
      return {
        id: `sql:${index}:${startLine}`,
        //label: `Dump #${index + 1}`,
        label: `SQL_PROFILE_DUMP`,
        description,
        line: startLine,
        children: rowChildren,
        icon: "database",
        clipboardLines: dumpLines,
        contextValue: NODE_CONTEXT.GROUP,
      };
    });
    nodes.push({
      id: "root:sql",
      //label: `SQL Profile Dumps (${parsed.sqlDumps.length})`,
      label: `SQL Profile Dumps`,
      children: sqlNodes,
      icon: "database",
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  const journalNodes = [];
  if (parsed.journalSections?.length) {
    const journalTypeLabels = {
      //summary: "Summary",
      //topLevel: "Top-Level Functions",
      topLevel: "JOURNALLED_TIMES_IN_TOP_LEVEL_FUNCTIONS",
      //allFunctions: "All Functions",
      allFunctions: "JOURNALLED_TIMES_IN_ALL_FUNCTIONS",
    };
    const sectionNodes = (parsed.journalSections ?? []).map(
      (section, index) => {
        const typeLabel = journalTypeLabels[section.type] ?? "Section";
        const label = `${typeLabel} #${index + 1}`;
        const description =
          section.summary && section.summary.length
            ? truncate(section.summary, 80)
            : `Lines ${section.line + 1}-${
                (section.endLine ?? section.line) + 1
              }`;
        const rowChildren = (section.rows ?? []).map((row, rowIndex) => {
          const percentLabel = row.percent ? `${row.percent}%` : "";
          const functionLabel = truncate(
            row.functionName ?? `Entry ${rowIndex + 1}`,
            80
          );
          const details = [];
          if (row.totalElapsed) {
            details.push(`${row.totalElapsed}s`);
          }
          if (row.callCount) {
            details.push(`${row.callCount} calls`);
          }
          const suffix = details.length ? ` (${details.join(", ")})` : "";
          const labelText = percentLabel
            ? `${percentLabel} • ${functionLabel}${suffix}`
            : `${functionLabel}${suffix}`;
          return {
            id: `journal:${index}:row:${rowIndex}:${row.line}`,
            label: labelText,
            description: `Line ${row.line + 1}`,
            line: row.line,
            tooltip: row.text ?? "",
            icon: "graph",
            contextValue: NODE_CONTEXT.ENTRY,
            clipboardItems:
              typeof row.text === "string" && row.text.length
                ? [{ text: row.text }]
                : undefined,
          };
        });
        const sectionLines = [];
        const startLine = section.line ?? 0;
        const endLine = section.endLine ?? section.line ?? startLine;
        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex += 1) {
          if (isValidLine(lineIndex)) {
            sectionLines.push(lineIndex);
          }
        }
        return {
          id: `journal:${index}:${section.line}`,
          label,
          description,
          line: section.line,
          children: rowChildren,
          icon: "graph",
          clipboardLines: sectionLines,
          contextValue: NODE_CONTEXT.GROUP,
        };
      }
    );
    journalNodes.push(...sectionNodes);
  }

  if (parsed.journalHierarchyTraces?.length) {
    const hierarchyNodes = parsed.journalHierarchyTraces.map((trace, index) => {
      const startLine = trace.line ?? 0;
      const endLine = trace.endLine ?? trace.line ?? startLine;
      const description =
        endLine > startLine
          ? `Lines ${startLine + 1}-${endLine + 1}`
          : `Line ${startLine + 1}`;
      const summaryDescription = description;
      const displayRows = trace.rows ?? [];
      const rowChildren = displayRows.map((row, rowIndex) => {
        const labelText = truncate(row.routine ?? `Entry ${rowIndex + 1}`, 100);
        return {
          id: `hierarchy:${index}:row:${rowIndex}:${row.line}`,
          label: labelText,
          description: `Line ${row.line + 1}`,
          tooltip: row.raw?.trim() ?? row.text ?? "",
          line: row.line,
          contextValue: NODE_CONTEXT.ENTRY,
          icon: "triangle-right",
          clipboardItems: row.raw ? [{ text: row.raw }] : undefined,
        };
      });
      const clipboardLines = [];
      for (
        let lineIndex = Math.max(0, startLine);
        lineIndex <= endLine;
        lineIndex += 1
      ) {
        clipboardLines.push(lineIndex);
      }
      return {
        id: `hierarchy:${index}:${startLine}`,
        //label: `Hierarchy Trace #${index + 1}`,
        label: `JOURNAL_HIERARCHY_TRACE`,
        description: summaryDescription,
        line: startLine,
        children: rowChildren,
        icon: "graph",
        contextValue: NODE_CONTEXT.GROUP,
        clipboardLines: clipboardLines.length ? clipboardLines : undefined,
        tooltip: `Lines ${startLine + 1}-${endLine + 1}`,
      };
    });
    journalNodes.push(...hierarchyNodes);
  }

  if (journalNodes.length) {
    nodes.push({
      id: "root:journal",
      //label: `Journaled Times (${journalNodes.length})`,
      label: `Journals (${journalNodes.length})`,
      children: journalNodes,
      icon: "graph",
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.accessChecks?.length) {
    const accessNodes = parsed.accessChecks
      .map((entry, index) => {
        const mode = entry.mode ? entry.mode.toUpperCase() : "(unknown)";
        const label = `${mode} on ${entry.target ?? "(unknown)"}`;
        return {
          id: `access:${index}:${entry.line}`,
          label,
          description: `Line ${entry.line + 1}`,
          tooltip: entry.raw ?? label,
          line: entry.line,
          icon: "shield",
          contextValue: NODE_CONTEXT.ENTRY,
          clipboardItems: entry.raw ? [{ text: entry.raw }] : undefined,
        };
      })
      .sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
    nodes.push({
      id: "root:access",
      label: `Check Access Privilege (${accessNodes.length})`,
      children: accessNodes,
      icon: "shield",
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.workflowHandlers?.length) {
    const handlerNodes = parsed.workflowHandlers.map((entry, index) => {
      const label = truncate(entry.functionName || `Handler #${index + 1}`, 80);
      const startLine = Math.max(0, entry.line ?? 0);
      const endLine = Math.max(
        startLine,
        entry.endLine ?? entry.line ?? startLine
      );
      const description =
        endLine === startLine
          ? `Line ${startLine + 1}`
          : `Lines ${startLine + 1}-${endLine + 1}`;
      const tooltipParts = [
        `Function: ${entry.functionName ?? "(unknown)"}`,
        description,
      ];
      if (entry.filePath) {
        tooltipParts.push(`File: ${entry.filePath}`);
      }
      const tooltip = tooltipParts.join("\n");
      const clipboardLines = [];
      for (let lineIndex = startLine; lineIndex <= endLine; lineIndex += 1) {
        clipboardLines.push(lineIndex);
      }
      return {
        id: `handler:${index}:${entry.line}`,
        label,
        description,
        tooltip,
        line: entry.line,
        icon: "beaker",
        contextValue: NODE_CONTEXT.ENTRY,
        clipboardLines,
      };
    });
    nodes.push({
      id: "root:workflowHandlers",
      label: `WF Handler Flow (${handlerNodes.length})`,
      children: handlerNodes,
      icon: "beaker",
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  const levelMap = new Map();
  for (const entry of parsed.logLines ?? []) {
    if (!levelMap.has(entry.level)) {
      levelMap.set(entry.level, []);
    }
    levelMap.get(entry.level).push(entry);
  }
  const levelNodes = Array.from(levelMap.entries())
    .sort((a, b) => levelRank(a[0], LEVEL_ORDER) - levelRank(b[0], LEVEL_ORDER))
    .map(([level, entries]) => {
      const orderedEntries = [...entries].sort((a, b) => a.line - b.line);
      const children = orderedEntries.map((entry) => ({
        id: `log:${level}:${entry.line}`,
        label: `${entry.timestamp} - ${truncate(entry.message, 80)}`,
        description: entry.id,
        tooltip: entry.message,
        line: entry.line,
        icon: "symbol-event",
        contextValue: NODE_CONTEXT.ENTRY,
        clipboardItems:
          typeof entry.message === "string" && entry.message.length
            ? [{ text: entry.message }]
            : undefined,
      }));
      const levelLines = collectLinesFromObjects(entries);
      return {
        id: `level:${level}`,
        label: `${level} (${entries.length})`,
        children,
        icon: LEVEL_ICONS[level] ?? "circle-filled",
        clipboardLines: levelLines,
        contextValue: NODE_CONTEXT.GROUP,
      };
    })
    .filter((node) => node.children.length);
  if (levelNodes.length) {
    const allLogLines = collectLinesFromObjects(parsed.logLines ?? []);
    nodes.push({
      id: "root:levels",
      label: `Log Levels (${parsed.logLines.length})`,
      children: levelNodes,
      icon: "symbol-class",
      clipboardLines: allLogLines,
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  if (parsed.inlineSqlLines?.length) {
    const inlineSqlNodes = parsed.inlineSqlLines.map((entry, index) => ({
      id: `inlineSql:${index}:${entry.line}`,
      label: truncate(
        (entry.text ?? "").trim() || `SQL Statement ${index + 1}`,
        80
      ),
      description:
        isValidLine(entry.line) && entry.line !== undefined
          ? `Line ${entry.line + 1}`
          : "",
      line: entry.line,
      icon: entry.fromLog ? "symbol-operator" : "symbol-string",
      contextValue: NODE_CONTEXT.ENTRY,
      clipboardItems:
        typeof entry.text === "string" && entry.text.length
          ? [{ text: entry.text }]
          : undefined,
    }));
    const inlineLines = collectLinesFromObjects(parsed.inlineSqlLines ?? []);
    nodes.push({
      id: "root:inlineSql",
      label: `Inline SQL (${parsed.inlineSqlLines.length})`,
      children: inlineSqlNodes,
      icon: "symbol-operator",
      clipboardLines: inlineLines,
      contextValue: NODE_CONTEXT.CATEGORY,
    });
  }

  return { resource, nodes };
}
