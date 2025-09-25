import antlr4 from "antlr4";
import TeamcenterLogLexer from "./antlr/generated/TeamcenterLogLexer.js";
import TeamcenterLogParser from "./antlr/generated/TeamcenterLogParser.js";
import TeamcenterLogVisitor from "./antlr/generated/TeamcenterLogVisitor.js";

const LOG_LINE_REGEX =
  /^(INFO|DEBUG|NOTE|WARN|ERROR|FATAL)\s*-\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2}-[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?)\s+UTC\s*-\s*(.+?)\s*-\s*(.*)$/;
const SYSTEM_INFO_PREFIXES = [
  "Node Name",
  "Machine type",
  "OS",
  "# Processors",
  "Memory",
  "Total Swap",
  "Free  Swap",
  "Machine supports",
  "Running",
];

const INLINE_SQL_KEYWORDS = new Set([
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "WITH",
  "TRUNCATE",
  "CREATE",
  "ALTER",
  "DROP",
  "CALL",
  "EXEC",
  "BEGIN",
  "COMMIT",
  "CONNECT",
  "ROLLBACK",
]);

function isInlineSqlText(text) {
  if (!text) {
    return false;
  }
  let working = text.trim();
  if (!working) {
    return false;
  }
  const prefixMatch = working.match(/^SQL\s*[:>\-=]?\s*/i);
  if (prefixMatch) {
    working = working.slice(prefixMatch[0].length);
  }
  const tokenMatch = /^[A-Za-z]+/.exec(working);
  if (!tokenMatch) {
    return false;
  }
  const token = tokenMatch[0];
  const upper = token.toUpperCase();
  if (!INLINE_SQL_KEYWORDS.has(upper)) {
    return false;
  }
  if (token !== upper) {
    return false;
  }
  return true;
}

class CollectingVisitor extends TeamcenterLogVisitor {
  constructor(lines) {
    super();
    this.lines = lines;
    this.result = {
      header: null,
      systemInfo: [],
      envSections: [],
      dllSections: [],
      sqlDumps: [],
      journalSections: [],
      journalHierarchyTraces: [],
      accessChecks: [],
      workflowHandlers: [],
      pomStats: [],
      endSessions: [],
      truncated: [],
      logLines: [],
      inlineSqlLines: [],
      parseErrors: [],
    };
    this._sqlStack = [];
  }

  visitLogFile(ctx) {
    super.visitLogFile(ctx);
    return this.result;
  }

  visitEnvSection(ctx) {
    const startLine = ctx.start.line - 1;
    const entries = [];
    let offset = 1; // skip section title line
    while (startLine + offset < this.lines.length) {
      const raw = this.lines[startLine + offset];
      if (!raw || !raw.trim()) {
        break;
      }
      const trimmed = raw.trim();
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (!match) {
        break;
      }
      entries.push({
        line: startLine + offset,
        key: match[1].trim(),
        value: match[2].trim(),
      });
      offset += 1;
    }
    this.result.envSections.push({ line: startLine, entries });
    return null;
  }

  visitDllSection(ctx) {
    const startLine = ctx.start.line - 1;
    const entries = [];
    let offset = 2; // skip section title and separator
    while (startLine + offset < this.lines.length) {
      const raw = this.lines[startLine + offset];
      if (!raw || !raw.trim()) {
        break;
      }
      const parts = raw.trim().split(/\s+/);
      if (parts.length < 6) {
        break;
      }
      entries.push({
        line: startLine + offset,
        path: parts[0],
        version: parts[1],
        address: parts[2],
        size: parts[3],
        hash: parts[4],
        date: parts.slice(5).join(" "),
      });
      offset += 1;
    }
    this.result.dllSections.push({ line: startLine, entries });
    return null;
  }

  visitSqlDump(ctx) {
    const startLine = (ctx.start?.line ?? 1) - 1;
    const endLine = (ctx.stop?.line ?? ctx.start?.line ?? 1) - 1;
    const section = {
      line: startLine,
      endLine,
      rows: [],
    };
    this.result.sqlDumps.push(section);
    this._sqlStack.push(section);
    super.visitSqlDump(ctx);
    this._sqlStack.pop();
    return null;
  }

  visitSqlRow(ctx) {
    const current = this._sqlStack[this._sqlStack.length - 1];
    if (!current) {
      return null;
    }
    const line = (ctx.start?.line ?? 1) - 1;
    const textLine = this.lines?.[line] ?? ctx.getText();
    current.rows.push({
      line,
      text: textLine,
    });
    return null;
  }

  visitJournalSection(ctx) {
    this.result.journalSections.push({ line: ctx.start.line - 1 });
    return null;
  }

  visitPomStats(ctx) {
    this.result.pomStats.push({ line: ctx.start.line - 1 });
    return null;
  }

  visitEndSession(ctx) {
    this.result.endSessions.push({ line: ctx.start.line - 1 });
    return null;
  }

  visitTruncated(ctx) {
    this.result.truncated.push({ line: ctx.start.line - 1 });
    return null;
  }
}

function collectHeader(lines) {
  if (!lines.length) {
    return null;
  }
  const headerLines = [];
  if (lines[0]?.startsWith("***")) {
    headerLines.push({ line: 0, text: lines[0] });
  }
  if (lines[1]?.startsWith("*** system log created by")) {
    headerLines.push({ line: 1, text: lines[1] });
  }
  if (!headerLines.length) {
    return null;
  }
  return {
    line: headerLines[0].line,
    lines: headerLines,
  };
}

function collectSystemInfo(lines) {
  const entries = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw) {
      continue;
    }
    const prefix = SYSTEM_INFO_PREFIXES.find((label) => raw.startsWith(label));
    if (!prefix) {
      continue;
    }
    const value = raw.slice(prefix.length).replace(/^[\s:-]+/, "");
    entries.push({ line: i, key: prefix, value: value.trim() });
  }
  return entries;
}

function collectSqlSections(lines) {
  const sections = [];
  let index = 0;
  while (index < lines.length) {
    const originalLine = lines[index] ?? "";
    const trimmed = originalLine.trim();
    if (!trimmed.startsWith("START SQL_PROFILE_DUMP")) {
      index += 1;
      continue;
    }

    const section = {
      line: index,
      endLine: index,
      rows: [],
    };

    let cursor = index + 1;
    let closed = false;
    while (cursor < lines.length) {
      const current = lines[cursor] ?? "";
      const currentTrimmed = current.trim();
      if (currentTrimmed.startsWith("END SQL_PROFILE_DUMP")) {
        section.endLine = cursor;
        cursor += 1;
        closed = true;
        break;
      }
      if (
        currentTrimmed &&
        !currentTrimmed.startsWith("Nr Calls") &&
        !/^[_-]+$/.test(currentTrimmed)
      ) {
        section.rows.push({
          line: cursor,
          text: current,
        });
      }
      cursor += 1;
    }

    if (!closed) {
      section.endLine = Math.max(section.line, cursor - 1);
    }
    sections.push(section);
    index = cursor;
  }
  return sections;
}

function collectJournalSections(lines) {
  const sections = [];
  const patterns = [
    {
      type: "allFunctions",
      start: /^START JOURNALLED_TIMES_IN_ALL_FUNCTIONS/i,
      end: /^END JOURNALLED_TIMES_IN_ALL_FUNCTIONS/i,
    },
    {
      type: "topLevel",
      start: /^START JOURNALLED_TIMES_IN_TOP_LEVEL_FUNCTIONS/i,
      end: /^END JOURNALLED_TIMES_IN_TOP_LEVEL_FUNCTIONS/i,
    },
    {
      type: "summary",
      start: /^START JOURNALLED_TIMES(?:\s|$)/i,
      end: /^END JOURNALLED_TIMES(?:\s|$)/i,
    },
  ];

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("START JOURNALLED_TIMES")) {
      continue;
    }
    const pattern = patterns.find((item) => item.start.test(trimmed));
    if (!pattern) {
      continue;
    }
    let cursor = i + 1;
    let endLine = i;
    while (cursor < lines.length) {
      const candidate = (lines[cursor] ?? "").trim();
      if (pattern.end.test(candidate)) {
        endLine = cursor;
        break;
      }
      cursor += 1;
    }
    if (cursor === lines.length) {
      endLine = Math.max(i, lines.length - 1);
    }
    const rows =
      pattern.type === "summary"
        ? []
        : collectJournalRows(lines, i + 1, endLine - 1);
    const summaryLines = [];
    for (let j = i + 1; j <= Math.min(endLine, i + 8); j += 1) {
      const candidate = (lines[j] ?? "").trim();
      if (!candidate) {
        continue;
      }
      if (candidate.startsWith("@*") || candidate.startsWith("START ")) {
        continue;
      }
      summaryLines.push(candidate);
      if (summaryLines.length >= 3) {
        break;
      }
    }
    sections.push({
      type: pattern.type,
      line: i,
      endLine,
      rows,
      summary: summaryLines.join(" ").trim(),
    });
  }
  return sections;
}

function collectJournalRows(lines, start, end) {
  const rows = [];
  for (let i = start; i <= end; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed.startsWith("@*")) {
      continue;
    }
    const body = trimmed.replace(/^@\*\s*/, "");
    const segments = body
      .split(/\s{2,}/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (!segments.length) {
      continue;
    }
    const percent = segments[0] ?? null;
    const totalElapsed = segments[1] ?? null;
    const totalCpu = segments[2] ?? null;
    const dbTrips = segments[3] ?? null;
    const callCount = segments[4] ?? null;
    const average = segments[5] ?? null;
    const numericPercent = Number(percent);
    if (Number.isNaN(numericPercent)) {
      continue;
    }
    const functionName = (
      segments.length > 6
        ? segments.slice(6).join(" ")
        : segments[segments.length - 1]
    )?.trim();
    if (!functionName) {
      continue;
    }
    rows.push({
      line: i,
      text: raw,
      percent,
      totalElapsed,
      totalCpu,
      dbTrips,
      callCount,
      average,
      functionName,
    });
  }
  return rows;
}

function collectJournalHierarchyTraces(lines) {
  const sections = [];
  const startPattern = /^START JOURNAL_HIERARCHY_TRACE\b/i;
  const endPattern = /^END JOURNAL_HIERARCHY_TRACE\b/i;
  const rowRegex =
    /^\s*(\d+)\s+(\d+)\s+([0-9]+(?:\.[0-9]+)?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const trimmed = raw.trim();
    if (!startPattern.test(trimmed)) {
      continue;
    }

    const version =
      trimmed.replace(/^START JOURNAL_HIERARCHY_TRACE\s*/i, "").trim() || null;
    let cursor = index + 1;
    let endLine = index;
    let header = null;
    const rows = [];

    while (cursor < lines.length) {
      const current = lines[cursor] ?? "";
      const currentTrimmed = current.trim();
      if (endPattern.test(currentTrimmed)) {
        endLine = cursor;
        break;
      }
      if (!header && currentTrimmed.startsWith("%Total")) {
        header = currentTrimmed;
      } else {
        const match = rowRegex.exec(current);
        if (match) {
          rows.push({
            line: cursor,
            totalPercent: Number(match[1]),
            parentPercent: Number(match[2]),
            time: Number(match[3]),
            dbTrips: Number(match[4]),
            callCount: Number(match[5]),
            calls: Number(match[5]),
            depth: Number(match[6]),
            routine: match[7].trim(),
            raw: current,
            text: currentTrimmed,
          });
        }
      }
      cursor += 1;
    }

    if (cursor >= lines.length) {
      endLine = lines.length - 1;
    }

    sections.push({
      line: index,
      endLine,
      version,
      header,
      rows,
    });
    index = Math.max(index, endLine);
  }

  return sections;
}

function collectAccessChecks(lines) {
  const entries = [];
  const regex = /^AM_check_priv\s*\(([^)]+)\)\s*on\s*(\S+)/i;
  for (let line = 0; line < lines.length; line += 1) {
    const raw = lines[line] ?? "";
    const match = regex.exec(raw);
    if (!match) {
      continue;
    }
    const mode = match[1]?.trim() ?? "";
    const target = match[2]?.trim() ?? "";
    entries.push({
      line,
      raw,
      mode,
      target,
    });
  }
  return entries;
}

function collectWorkflowHandlers(lines) {
  const entries = [];
  const enterPattern =
    /^-->\s+ENTER\s+Function\s+"([^"]+)"\s+\{\s*\(File\s+\[(.*?)\]\)/i;
  const leavePattern = /^<--\s+LEAVE\s+Function\s+"([^"]+)"/i;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const enterMatch = enterPattern.exec(raw);
    if (!enterMatch) {
      continue;
    }

    const functionName = enterMatch[1]?.trim() ?? "";
    const filePath = enterMatch[2]?.trim() ?? "";

    let leaveLine = index;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const leaveRaw = lines[cursor] ?? "";
      if (leavePattern.test(leaveRaw)) {
        leaveLine = cursor;
        break;
      }
    }

    entries.push({
      line: index,
      endLine: leaveLine,
      functionName,
      filePath,
      raw,
    });
  }

  return entries;
}

function collectInlineSqlLines(lines) {
  const matches = [];
  for (let i = 0; i < lines.length; i += 1) {
    const original = lines[i] ?? "";
    const trimmed = original.trim();
    if (!trimmed) {
      continue;
    }
    if (
      trimmed.startsWith("START SQL_PROFILE_DUMP") ||
      trimmed.startsWith("END SQL_PROFILE_DUMP")
    ) {
      continue;
    }
    if (isInlineSqlText(trimmed)) {
      matches.push({ line: i, text: original });
    }
  }
  return matches;
}

function collectLogLines(lines) {
  const entries = [];
  for (let i = 0; i < lines.length; i += 1) {
    const lineText = lines[i] ?? "";
    const match = LOG_LINE_REGEX.exec(lineText);
    if (!match) {
      continue;
    }

    const levelText = match[1] ?? "";
    const timestampText = match[2] ?? "";
    const idRaw = match[3] ?? "";
    const messageRaw = match[4] ?? "";

    const levelStart = lineText.indexOf(levelText);
    const levelEnd =
      levelStart >= 0 ? levelStart + levelText.length : levelText.length;

    const timestampStart = timestampText
      ? lineText.indexOf(timestampText, levelEnd ?? 0)
      : -1;
    const timestampEnd =
      timestampStart >= 0 ? timestampStart + timestampText.length : null;

    const idValue = idRaw.trim();
    const idRawIndex = idValue
      ? lineText.indexOf(idRaw, timestampEnd ?? 0)
      : -1;
    const idLeadingSpaces = idRaw.length - idRaw.trimStart().length;
    const idStart = idRawIndex >= 0 ? idRawIndex + idLeadingSpaces : -1;
    const idEnd = idStart >= 0 ? idStart + idValue.length : null;

    const messageValue = messageRaw.trim();
    const messageRawIndex = messageValue
      ? lineText.indexOf(
          messageRaw,
          idRawIndex >= 0 ? idRawIndex + idRaw.length : timestampEnd ?? 0
        )
      : -1;
    const messageLeadingSpaces =
      messageRaw.length - messageRaw.trimStart().length;
    const messageStart =
      messageRawIndex >= 0 ? messageRawIndex + messageLeadingSpaces : -1;
    const messageEnd =
      messageStart >= 0 ? messageStart + messageValue.length : null;
    const isInlineSql = isInlineSqlText(messageValue);

    entries.push({
      line: i,
      level: levelText,
      timestamp: timestampText,
      id: idValue,
      message: messageValue,
      levelStart: levelStart >= 0 ? levelStart : 0,
      levelEnd: levelEnd,
      timestampStart: timestampStart >= 0 ? timestampStart : null,
      timestampEnd,
      idStart: idStart >= 0 ? idStart : null,
      idEnd,
      messageStart: messageStart >= 0 ? messageStart : null,
      messageEnd,
      isInlineSql,
    });
  }
  return entries;
}

export function parseTeamcenterLog(content) {
  const lines = content.split(/\r?\n/);
  const input = new antlr4.InputStream(content);
  const lexer = new TeamcenterLogLexer(input);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new TeamcenterLogParser(tokens);
  parser.removeErrorListeners();
  lexer.removeErrorListeners();

  parser.buildParseTrees = true;
  const tree = parser.logFile();
  const visitor = new CollectingVisitor(lines);
  const result = tree.accept(visitor);

  const heuristicSql = collectSqlSections(lines);
  if (Array.isArray(result.sqlDumps) && result.sqlDumps.length) {
    const heuristicsByLine = new Map(
      heuristicSql.map((section) => [section.line, section])
    );
    const merged = result.sqlDumps.map((section) => {
      const fallback = heuristicsByLine.get(section.line);
      if (fallback) {
        heuristicsByLine.delete(section.line);
        return {
          line: section.line ?? fallback.line,
          endLine: section.endLine ?? fallback.endLine,
          rows: section.rows?.length ? section.rows : fallback.rows,
        };
      }
      return {
        line: section.line ?? 0,
        endLine: section.endLine ?? section.line ?? 0,
        rows: section.rows ?? [],
      };
    });
    for (const leftover of heuristicsByLine.values()) {
      merged.push(leftover);
    }
    result.sqlDumps = merged;
  } else {
    result.sqlDumps = heuristicSql;
  }

  result.header = collectHeader(lines);
  result.systemInfo = collectSystemInfo(lines);
  result.logLines = collectLogLines(lines);

  const inlineLogSet = new Map();
  for (const entry of result.logLines ?? []) {
    if (entry?.isInlineSql) {
      inlineLogSet.set(entry.line, entry);
    }
  }
  const heuristicInline = collectInlineSqlLines(lines).filter(
    (item) => !inlineLogSet.has(item.line)
  );
  result.inlineSqlLines = [
    ...(inlineLogSet.size
      ? Array.from(inlineLogSet.values()).map((entry) => ({
          line: entry.line,
          text: entry.message ?? lines[entry.line] ?? "",
          fromLog: true,
        }))
      : []),
    ...heuristicInline.map((item) => ({
      line: item.line,
      text: item.text,
      fromLog: false,
    })),
  ].sort((a, b) => (a.line ?? 0) - (b.line ?? 0));

  result.journalSections = collectJournalSections(lines);
  result.journalHierarchyTraces = collectJournalHierarchyTraces(lines);
  result.accessChecks = collectAccessChecks(lines);
  result.workflowHandlers = collectWorkflowHandlers(lines);
  result.lines = lines;

  return result;
}
