/**
 * Core constants shared across the TC Syslog viewer extension.
 * - Level configuration controls how log levels are rendered and labeled.
 * - Node context values are used for tree view item classification.
 */
export const LEVEL_ORDER = ["FATAL", "ERROR", "WARN", "NOTE", "INFO", "DEBUG"];

export const LEVEL_CONFIG_OVERRIDES = { WARN: "WARNING" };

export const LEVEL_ICONS = {
  FATAL: "flame",
  ERROR: "error",
  WARN: "warning",
  NOTE: "book",
  INFO: "info",
  DEBUG: "beaker",
};

export const NODE_CONTEXT = {
  CATEGORY: "syslogCategory",
  GROUP: "syslogGroup",
  ENTRY: "syslogEntry",
};

export const FIND_MENTIONS_LIMIT = 500;
