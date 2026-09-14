# Architecture

## Overview

TC Syslog Viewer is a Visual Studio Code extension for inspecting Siemens Teamcenter `.syslog` files. It runs inside the VS Code extension host and uses JavaScript ES modules. There is no standalone application server or database.

The extension reads an open text document, extracts structured information, and presents it through tree views and editor decorations. Parsing combines a generated ANTLR parser with handwritten line scanners and regular expressions. An optional AI Chat webview sends log excerpts and tool results to a configured model provider.

This document describes the current implementation. See [README.md](README.md) for user-facing features and commands.

## Repository structure

| Location | Responsibility |
| --- | --- |
| [package.json](package.json) | Extension entry point, activation events, commands, views, language registration, settings, and npm scripts |
| [src/extension.js](src/extension.js) | Runtime composition and activation |
| [src/core/](src/core/) | Controller, tree model construction, favorites persistence, and AI conversation state |
| [src/parse/tcServerSyslogParser.js](src/parse/tcServerSyslogParser.js) | Public parsing function, ANTLR visitor, and handwritten collectors |
| [src/parse/antlr/](src/parse/antlr/) | Source grammar and checked-in generated lexer, parser, visitor, and listener |
| [src/ui/](src/ui/) | Tree data providers, view factories, command adapters, and AI webview |
| [src/ai/](src/ai/) | Provider configuration, HTTP model client, and local analysis tools |
| [src/util/](src/util/) | Shared constants and text, path, and tree-content helpers |
| [syntaxes/](syntaxes/) | TextMate grammar for editor syntax highlighting |
| [media/](media/) | Icons and HTML assets |

## Main runtime components

### Activation and controller

`activate(context)` creates the sidebar and bottom-panel views, constructs `SyslogController`, initializes document subscriptions, and registers the AI webview and commands. The manifest includes `onStartupFinished`, so activation is not limited to opening a syslog file.

[SyslogController](src/core/syslogController.js) owns the currently selected log URI and latest parsed result. It also coordinates favorites, occurrence searches, previews, AI requests, and editor decorations. Although commands and view creation have separate modules, substantial UI behavior and application logic remain together in this controller.

The controller listens for document open, close, change, and active-editor events. Changes to the current document schedule a complete refresh after a 300 ms debounce. Color-setting and theme changes recreate decorations and reapply them to the current parsed document.

### Parsing boundary

`parseTeamcenterLog(content)` accepts the complete document string and returns a plain JavaScript object. Its fields include:

- `lines`, `header`, `systemInfo`, `envSections`, and `dllSections`;
- `logLines`, `sqlDumps`, `inlineSqlLines`, `journalSections`, and `journalHierarchyTraces`;
- `accessChecks`, `workflowHandlers`, `pomStats`, `endSessions`, `truncated`, and `parseErrors`.

Source line indices are zero-based. Log entries also contain character offsets for the level, timestamp, identifier, and message so the controller can decorate individual fields. Section records carry start/end lines where supported.

The function first constructs an ANTLR input stream, token stream, and parse tree. `CollectingVisitor` extracts selected sections; some visitor methods scan the original source lines rather than individual grammar tokens. Subsequent collectors replace header, system-information, log-line, and journal results, add access checks and workflow handlers, and merge SQL dump results with a handwritten fallback.

Consequently, the grammar is only one part of the parsing contract. Changes to a supported log format may require changes to both the grammar and the collectors.

### Tree views and highlighting

[buildTreeModel()](src/core/treeModel.js) converts parsed records into plain nodes with identifiers, labels, descriptions, source locations, children, icons, and content for preview commands. It does not import the VS Code API. [Tree data providers](src/ui/general/treeProviders.js) adapt these nodes into `TreeItem` objects and notify VS Code when models change.

The controller sends Overview and Log Levels to **Basic Content**. Other categories, including SQL, Journals, Check Access Privilege, and WF Handler Flow, go to **Extra Content**. Favorites and Occurrences use their own providers.

Highlighting has two independent sources: the [TextMate grammar](syntaxes/teamcenter.tmLanguage.json) registered in the manifest and programmatic decorations derived from the parsed model. Updating ANTLR does not automatically update TextMate highlighting.

### Favorites and occurrence searches

[FavoritesManager](src/core/favoritesManager.js) reads and writes a JSON sidecar next to the source log: `example.syslog` maps to `example.favorite`. Entries include an identifier, source line/range, text snippet, label, comment, and timestamps. File operations use `vscode.workspace.fs`, while sidecar URI construction uses the source filesystem path and `vscode.Uri.file`.

Occurrence searches use the trimmed editor selection as a case-sensitive literal substring. Matches do not overlap and each search is capped at 500 results. Results can be retained in the Occurrences tree or opened in an untitled editor. They are held in memory, not persisted as files by the search itself.

### AI Chat

The [AI webview](src/ui/panels/centerBottomPanel/views/tcSyslogViewerAiView.js) exchanges questions, history, and status messages with the extension through webview messaging. It contains its HTML, CSS, and browser-side JavaScript in one module. Model HTTP requests run in the extension host.

[AiChatManager](src/core/aiChatManager.js) maintains in-memory conversation history and emits updates. [SyslogAiAgent](src/ai/syslogAiAgent.js) combines that history with the question, optional editor selection, and a document excerpt. For long documents, the excerpt contains approximately 4,200 leading and 1,800 trailing characters.

The agent sends OpenAI-compatible chat-completion requests using `fetch`. It executes requested local tools and repeats model requests until a response has no tool calls. [The toolbox](src/ai/tools.js) exposes `get_log_level_stats`, `summarize_window`, `list_recent_errors`, and `find_token_occurrences`. These tools inspect raw document text independently of the parsed tree; they do not modify the log. Despite MCP wording in the system prompt, this implementation uses function calling and does not run an MCP server.

## Data flow

### Document refresh

1. A document/editor event or refresh command selects a syslog document.
2. The controller reads the full document with `getText()` and starts loading its favorites.
3. `parseTeamcenterLog()` performs ANTLR parsing and handwritten collection synchronously.
4. `buildTreeModel()` constructs all category nodes; the controller splits them between Basic Content and Extra Content.
5. Providers publish updated models, decorations are applied, and favorites are loaded again with the parsed context.

Tree navigation reveals a source line. Category and entry commands gather node content and open an untitled preview beside the source document. The controller tracks preview document URIs so switching to those previews can retain the source log context.

### AI question

1. The webview sends an `ask` message to the controller.
2. The controller resolves the current syslog and any selection from its active editor.
3. The chat manager appends the question and passes prior messages to the agent.
4. The agent calls the configured provider, executes any requested tools against the full source text, and sends their results back to the provider.
5. The chat manager records the answer or error and the webview receives updated history.

## Key design decisions

- **Native VS Code document workflow.** Source logs remain editor documents; navigation and previews reuse VS Code APIs rather than a custom log-rendering surface.
- **Hybrid parsing.** ANTLR provides a parse-tree pass, while collectors handle much of the actual format recognition and field extraction.
- **Plain data between parser and trees.** Parsed records and tree nodes are separate representations. This allows parser and model checks outside VS Code, even though the controller is tightly coupled to the editor API.
- **Local sidecars for favorites.** Favorites travel alongside source files rather than using workspace state or a database.
- **Direct provider integration.** AI calls use a small HTTP client and local tool dispatch rather than an agent SDK. Cloud providers receive excerpts, selected text, and requested tool outputs.

## External dependencies and integrations

- The manifest requires VS Code `^1.92.0`; VS Code supplies the `vscode` module at runtime.
- `antlr4` is the only declared npm dependency. Its declared range is `^4.13.1`; the lockfile resolves `4.13.2`, matching the version noted in generated files.
- Node built-ins provide path and text-encoding utilities. The AI client uses the extension host's global `fetch`.
- Provider endpoints are fixed in code: DeepSeek and OpenAI cloud chat-completion endpoints, plus Ollama at `http://localhost:11434/v1/chat/completions`.
- Settings under `tcSyslogViewer.ai` supply provider, model, API key, and workspace. The workspace value is read but currently unused by the tools. API keys are stored in VS Code configuration rather than Secret Storage.

## Build / validation notes

There is no transpilation or bundling step: VS Code loads `src/extension.js` directly. Install the locked runtime dependency with `npm ci`.

Regenerate ANTLR output with:

```sh
npm run compile:antlr
```

This invokes an external `antlr` executable with JavaScript and visitor generation enabled. The generator is not installed by npm; generated lexer/parser files identify ANTLR 4.13.2. Keep source grammar and generated output together when changing parsing rules.

The `watch` script runs `node --watch src/extension.js`; it does not launch a VS Code Extension Development Host or provide the `vscode` module. There are currently no checked-in test suites, sample syslog fixtures, test/lint scripts, or Extension Development Host launch configuration.

Useful validation boundaries are direct Node checks of `parseTeamcenterLog()` and `buildTreeModel()`, followed by manual Extension Development Host checks for view refreshes, decorations, navigation, favorites, and webview behavior. Parser checks alone cannot validate editor integration.

## Known constraints

- **ANTLR recognition is incomplete.** The broad `MESSAGE` lexer rule can consume an entire normal log line, routing it to `otherLine`; the regex collector recovers ordinary log entries. Environment entries likewise rely on source-line scanning after section recognition.
- **Parse diagnostics are not surfaced.** Lexer and parser error listeners are removed, and `parseErrors` is initialized but never populated. A returned result does not imply an error-free ANTLR parse.
- **Some representations disagree.** The parser produces `truncated`, while the tree reads `truncatedNotifications`. Main log parsing supports `WARN`, but not `WARNING` or `TRACE`; AI statistics recognize those additional words and count matches anywhere in the text, including message bodies.
- **Large files require full synchronous work.** Each refresh reparses the document, builds a parse tree, performs multiple line scans, and constructs all tree nodes. There is no worker, streaming parser, incremental update, or per-document parsed cache. Large-log responsiveness is not guaranteed.
- **State is centered on one current document.** Clearing the view clears occurrence results and conversation history. Switching directly between syslog documents does not reset AI history, so messages from a previous log can remain in context.
- **Favorites use fixed positions and asynchronous reloads.** Source edits do not re-anchor stored ranges. Each refresh launches two favorites loads without awaiting them; no request-generation check prevents an older read from updating newer state. Read/JSON errors are silently treated as empty favorites, and URI construction assumes filesystem-backed documents.
- **AI requests have no explicit cancellation or iteration budget.** The HTTP client has no configured timeout, tool-call loop limit, or conversation-length cap. The initial excerpt is bounded, but selection and history are not; `summarize_window` separately truncates returned text to 2,000 characters. Changing provider without changing the configured model can retain an incompatible model name.
