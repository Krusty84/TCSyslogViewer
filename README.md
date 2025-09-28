# TCSyslogViewer

## 🚀 What is this?

**TCSyslogViewer** is a Visual Studio Code extension that makes working with Siemens Teamcenter `.syslog` files. 
It parses large logs, organises their content into rich explorer views, and provides tooling to jump to interesting sections, save favourites, and analyse recurring patterns.

<img width="1920" height="1124" alt="image" src="https://github.com/user-attachments/assets/b4190216-9db9-491d-a989-994f7eb39a0b" />

<img width="1208" height="574" alt="image" src="https://github.com/user-attachments/assets/6a1f8033-af79-4fc6-afe7-41fd816075c2" />

--

## 🎯 Features

- **Tcserver syslog parsing** – Automatically recognises `.syslog` files and builds structured views of key sections, log levels, SQL dumps, journal data.
- **Explorer views** – The activity-bar container exposes three tree views:
  - **Basic Content**: Overview and primary category hierarchy for the active log.
  - **Extra Content**: Additional parsed groups (SQL, Journals, Security check). Special modes for Teamcenter sever is need!
  - **Favorites**: Parts of the system log that interest you (stored in the file: original file name syslog`.favorite`)

## 🧑‍💼 Who is it for?

Developers, QA specialists, pre-sales specialists, etc., working with Teamcenter through the back door :)

## Commands

| Command | Description |
| --- | --- |
| `TC Syslog Viewer: Refresh Syslog File` | Reparse the active syslog and refresh all views. |
| `TC Syslog Viewer: Open Syslog File` | Show an open dialog constrained to `.syslog` files. |
| `TC Syslog Viewer: Open Category` | Open the selected category in a preview editor. |
| `TC Syslog Viewer: Open Entry` | Preview a single log entry. |
| `TC Syslog Viewer: Add to Favorites` | Save the current selection for quick access later. |
| `TC Syslog Viewer: Edit Favorite Comment` | Update the note associated with a favourite entry. |
| `TC Syslog Viewer: Remove Favorite` | Delete a favourite from the list. |
| `TC Syslog Viewer: Open Favorite Entry` | Navigate to the favourite in the source document. |
| `TC Syslog Viewer: Find All Occurrences` | Search for the current selection across the active document and store the session. |
| `TC Syslog Viewer: Find All Occurrences Open in Editor` | Search and open results directly in an editor tab. |
| `TC Syslog Viewer: Close Occurrences Result` | Remove a search session from the Occurrences panel. |

Context menus in the explorer and editor provide shortcuts for the same actions when a `.syslog` file is active:

<img width="495" height="356" alt="image" src="https://github.com/user-attachments/assets/949bb6c1-5b0d-4b6d-ba1a-f30b27d3ad5b" />

<img width="496" height="376" alt="image" src="https://github.com/user-attachments/assets/64bafcab-706f-46d6-a4fd-06b70a100299" />

<img width="1295" height="586" alt="image" src="https://github.com/user-attachments/assets/b5d1834e-6872-44b7-ba22-b535cd412ea3" />
