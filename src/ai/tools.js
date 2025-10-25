import { truncate } from "../util/helpers.js";

function sanitizeContext(context) {
  if (!context || typeof context.text !== "string") {
    throw new Error("No syslog context is loaded for the AI tools");
  }
  return context;
}

function computeLevelStats(text) {
  const stats = new Map();
  const levelRegex = /\b(FATAL|ERROR|WARN|WARNING|NOTE|INFO|DEBUG|TRACE)\b/gi;
  let match;
  while ((match = levelRegex.exec(text)) !== null) {
    const level = match[1].toUpperCase();
    stats.set(level, (stats.get(level) ?? 0) + 1);
  }
  return Array.from(stats.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => ({ level, count }));
}

function getLines(text) {
  return text.split(/\r?\n/);
}

function sliceWindow(lines, start = 0, end = lines.length) {
  const normalizedStart = Math.max(0, Math.min(lines.length, start));
  const normalizedEnd = Math.max(normalizedStart, Math.min(lines.length, end));
  return lines.slice(normalizedStart, normalizedEnd).join("\n");
}

function findRecentErrors(lines, limit = 5) {
  const errors = [];
  for (let i = lines.length - 1; i >= 0 && errors.length < limit; i -= 1) {
    if (/\b(FATAL|ERROR|EXCEPTION)\b/i.test(lines[i])) {
      errors.push({
        line: i + 1,
        text: lines[i],
      });
    }
  }
  return errors.reverse();
}

function extractContextByToken(lines, token, maxMatches = 20) {
  if (!token || !token.trim()) {
    return [];
  }
  const needle = token.trim();
  const results = [];
  for (let index = 0; index < lines.length && results.length < maxMatches; index += 1) {
    if (lines[index].includes(needle)) {
      results.push({ line: index + 1, text: lines[index] });
    }
  }
  return results;
}

export function createSyslogToolbox(getContext) {
  const definitions = [
    {
      name: "get_log_level_stats",
      description:
        "Return counts of log levels (FATAL/ERROR/WARN/INFO/DEBUG) for the currently loaded syslog text.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "summarize_window",
      description:
        "Return the raw log text between the provided line numbers so the LLM can summarise it contextually.",
      parameters: {
        type: "object",
        properties: {
          startLine: { type: "number", description: "1-based inclusive start line" },
          endLine: { type: "number", description: "1-based exclusive end line" },
        },
        required: [],
      },
    },
    {
      name: "list_recent_errors",
      description: "Return up to N most recent error/fatal lines in the log.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum number of entries", default: 5 },
        },
        required: [],
      },
    },
    {
      name: "find_token_occurrences",
      description:
        "Search the current syslog for lines containing the provided token (useful for workflow/task IDs)",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Text to search for" },
          limit: {
            type: "number",
            description: "Maximum rows to return",
            default: 20,
          },
        },
        required: ["token"],
      },
    },
  ];

  const handlers = {
    get_log_level_stats: async () => {
      const context = sanitizeContext(getContext());
      return {
        type: "levelStats",
        levels: computeLevelStats(context.text),
      };
    },
    summarize_window: async ({ startLine = 1, endLine }) => {
      const context = sanitizeContext(getContext());
      const lines = getLines(context.text);
      const zeroBasedStart = Math.max(0, Math.round(startLine) - 1);
      const zeroBasedEnd =
        endLine === undefined ? lines.length : Math.max(zeroBasedStart, Math.round(endLine) - 1);
      const window = sliceWindow(lines, zeroBasedStart, zeroBasedEnd);
      return {
        type: "window",
        startLine: zeroBasedStart + 1,
        endLine: zeroBasedEnd + 1,
        preview: truncate(window, 2000),
      };
    },
    list_recent_errors: async ({ limit = 5 }) => {
      const context = sanitizeContext(getContext());
      const lines = getLines(context.text);
      return {
        type: "recentErrors",
        entries: findRecentErrors(lines, Math.max(1, Math.min(50, Math.round(limit)))),
      };
    },
    find_token_occurrences: async ({ token, limit = 20 }) => {
      const context = sanitizeContext(getContext());
      const lines = getLines(context.text);
      return {
        type: "tokenOccurrences",
        token,
        entries: extractContextByToken(lines, token, Math.max(1, Math.min(100, Math.round(limit)))),
      };
    },
  };

  return {
    definitions,
    handlers,
  };
}
