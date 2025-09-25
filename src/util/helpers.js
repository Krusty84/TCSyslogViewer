import path from "node:path";

/**
 * Generic helpers used by multiple layers of the TC Syslog viewer extension. Keeping them together
 * reduces duplication and makes future maintenance easier when log parsing evolves.
 */
export function winBasename(filePath) {
  if (!filePath) {
    return "";
  }
  const normalized = filePath.replace(/\\/g, "/");
  const base = path.posix.basename(normalized);
  return base || normalized;
}

export function levelRank(level, orderedLevels) {
  const idx = orderedLevels.indexOf(level);
  return idx === -1 ? orderedLevels.length : idx;
}

export function highlightMatchInLine(lineText, column, length) {
  if (typeof lineText !== "string" || !lineText.length) {
    return lineText ?? "";
  }
  if (typeof column !== "number" || column < 0 || typeof length !== "number") {
    return lineText;
  }
  const start = Math.min(Math.max(column, 0), lineText.length);
  const end = Math.min(start + Math.max(length, 0), lineText.length);
  if (end <= start) {
    return lineText;
  }
  return `${lineText.slice(0, start)}[${lineText.slice(start, end)}]${lineText.slice(end)}`;
}

export function sanitizeForUntitledLabel(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "query";
  }
  const normalized = text
    .replace(/[^a-zA-Z0-9\-_.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "query";
}

export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const limit = Math.max(0, maxLength - 3);
  return `${text.slice(0, limit)}...`;
}

export function isSyslogDocument(document) {
  if (!document) {
    return false;
  }
  const fileName =
    document.fileName?.toLowerCase?.() ?? document.uri.fsPath.toLowerCase();
  return fileName.endsWith(".syslog");
}

export function collectNodeClipboardTexts(node, parsed, options = {}) {
  if (!node || !parsed) {
    return [];
  }
  const includeChildren = options.includeChildren !== false;
  const returnObjects = options.returnObjects === true;
  const seenLines = new Set();
  const collected = [];
  let order = 0;

  const visit = (current, traverseChildren) => {
    if (!current) {
      return;
    }
    if (current.clipboardExclude) {
      if (traverseChildren && Array.isArray(current.children)) {
        for (const child of current.children) {
          visit(child, true);
        }
      }
      return;
    }
    const resolved = resolveNodeClipboardEntries(current, parsed, seenLines);
    for (const item of resolved) {
      if (typeof item.text === "string" && item.text.length) {
        collected.push({
          text: item.text,
          line:
            typeof item.line === "number" && Number.isFinite(item.line)
              ? item.line
              : undefined,
          order,
        });
        order += 1;
      }
    }
    if (traverseChildren && Array.isArray(current.children)) {
      for (const child of current.children) {
        visit(child, true);
      }
    }
  };

  visit(node, includeChildren);

  collected.sort((a, b) => {
    const aLine =
      typeof a.line === "number" ? a.line : Number.POSITIVE_INFINITY;
    const bLine =
      typeof b.line === "number" ? b.line : Number.POSITIVE_INFINITY;
    if (aLine !== bLine) {
      return aLine - bLine;
    }
    return a.order - b.order;
  });

  if (returnObjects) {
    return collected.map((entry) => ({
      text: entry.text,
      line:
        typeof entry.line === "number" && Number.isFinite(entry.line)
          ? entry.line
          : undefined,
    }));
  }

  return collected.map((entry) => entry.text);
}

function resolveNodeClipboardEntries(node, parsed, seenLines) {
  const results = [];

  const addLine = (line) => {
    if (typeof line !== "number" || !Number.isFinite(line) || line < 0) {
      return;
    }
    if (seenLines.has(line)) {
      return;
    }
    const text = getLineText(parsed, line);
    if (typeof text !== "string") {
      return;
    }
    seenLines.add(line);
    results.push({ text, line });
  };

  const addText = (text, lineHint) => {
    if (typeof text !== "string" || !text.length) {
      return;
    }
    if (typeof lineHint === "number") {
      const lineText = getLineText(parsed, lineHint);
      if (typeof lineText === "string" && lineText === text) {
        return;
      }
    }
    results.push({ text });
  };

  const processItem = (item, lineHint) => {
    if (item === null || item === undefined) {
      return;
    }
    if (typeof item === "number") {
      addLine(item);
      return;
    }
    if (typeof item === "string") {
      addText(item, lineHint);
      return;
    }
    if (typeof item === "object") {
      const effectiveLine =
        typeof item.line === "number" ? item.line : lineHint;
      if (typeof item.line === "number") {
        addLine(item.line);
      }
      if (typeof item.text === "string") {
        addText(item.text, effectiveLine);
      }
    }
  };

  if (Array.isArray(node.clipboardLines)) {
    for (const value of node.clipboardLines) {
      processItem(value, undefined);
    }
  }
  if (Array.isArray(node.clipboardItems)) {
    for (const value of node.clipboardItems) {
      processItem(value, node.line);
    }
  }
  if (typeof node.copyText === "string") {
    addText(node.copyText, node.line);
  }
  if (typeof node.line === "number") {
    processItem(node.line, node.line);
  }

  if (!results.length && (!node.children || !node.children.length)) {
    const fallback = buildNodeFallbackText(node);
    if (fallback) {
      addText(fallback, node.line);
    }
  }

  return results;
}

function getLineText(parsed, line) {
  if (!parsed || !Array.isArray(parsed.lines)) {
    return null;
  }
  if (line < 0 || line >= parsed.lines.length) {
    return null;
  }
  return parsed.lines[line];
}

function buildNodeFallbackText(node) {
  if (!node) {
    return null;
  }
  const parts = [];
  if (node.label) {
    parts.push(String(node.label));
  }
  if (node.description) {
    parts.push(String(node.description));
  }
  if (!parts.length) {
    return null;
  }
  return parts.join(parts.length > 1 ? " - " : "");
}
