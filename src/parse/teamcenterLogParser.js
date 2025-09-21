import antlr4 from 'antlr4';
import TeamcenterLogLexer from './antlr/generated/TeamcenterLogLexer.js';
import TeamcenterLogParser from './antlr/generated/TeamcenterLogParser.js';
import TeamcenterLogVisitor from './antlr/generated/TeamcenterLogVisitor.js';

const LOG_LINE_REGEX = /^(INFO|DEBUG|NOTE|WARN|ERROR)\s*-\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2}-[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?)\s+UTC\s*-\s*(.+?)\s*-\s*(.*)$/;
const SYSTEM_INFO_PREFIXES = [
  'Node Name',
  'Machine type',
  'OS',
  '# Processors',
  'Memory',
  'Total Swap',
  'Free  Swap',
  'Machine supports',
  'Running'
];

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
      pomStats: [],
      endSessions: [],
      truncated: [],
      logLines: [],
      parseErrors: []
    };
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
        value: match[2].trim()
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
        date: parts.slice(5).join(' ')
      });
      offset += 1;
    }
    this.result.dllSections.push({ line: startLine, entries });
    return null;
  }

  visitSqlDump(ctx) {
    this.result.sqlDumps.push({ line: ctx.start.line - 1 });
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
  if (lines[0]?.startsWith('***')) {
    headerLines.push({ line: 0, text: lines[0] });
  }
  if (lines[1]?.startsWith('*** system log created by')) {
    headerLines.push({ line: 1, text: lines[1] });
  }
  if (!headerLines.length) {
    return null;
  }
  return {
    line: headerLines[0].line,
    lines: headerLines
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
    const value = raw.slice(prefix.length).replace(/^[\s:-]+/, '');
    entries.push({ line: i, key: prefix, value: value.trim() });
  }
  return entries;
}

function collectLogLines(lines) {
  const entries = [];
  for (let i = 0; i < lines.length; i += 1) {
    const match = LOG_LINE_REGEX.exec(lines[i]);
    if (!match) {
      continue;
    }
    entries.push({
      line: i,
      level: match[1],
      timestamp: match[2],
      id: match[3].trim(),
      message: match[4].trim()
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

  result.header = collectHeader(lines);
  result.systemInfo = collectSystemInfo(lines);
  result.logLines = collectLogLines(lines);
  result.lines = lines;

  return result;
}

