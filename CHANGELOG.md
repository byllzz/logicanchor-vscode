# Changelog

All notable changes to **LogicAnchor** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).



## [0.0.4] - 2026-03-18

### New Features

- **Live Statistics Dashboard**
  Added a top-level stats bar that dynamically tracks the total number of insights and breaks them down by category *(Logic, Bug Fix, TODO, etc.)*.

- **Regex-Safe Search Highlighting**
  Implemented a robust search engine that highlights matching text in real time. Safely handles special characters *(e.g., brackets, dots)* without crashing the UI.

- **Visual Category Themes**
  Note cards now feature color-coded left borders based on their category, enabling instant visual identification of task types.

- **Smart Registry Sync**
  Replaced aggressive **"Registry Synced"** toast notifications with a **"Silent Init"** process. Notifications now appear only during manual refreshes—not every time the sidebar opens.

---

###  Improvements & Refinements

- **Optimized Filtering**
  Rewrote `filterNotes` logic to use `data-raw` attributes, preventing conflicts between Markdown rendering and search highlighting, and eliminating "double-encoding" bugs.

- **Enhanced Delete Guard**
  Added a native confirmation dialog to prevent accidental data loss during delete actions.

- **Event Propagation Fixes**
  Improved button click handling using `stopPropagation` to ensure actions like **Delete** and **Copy** do not trigger unintended behaviors such as **Jump to Line**.

- **Theme Integration**
  Replaced hardcoded colors with CSS variables *(e.g., `--vscode-editor-findMatchHighlightBackground`)* to ensure consistent appearance across Light, Dark, and High Contrast themes.

---

### Bug Fixes

- Fixed a syntax error in the webview script caused by `${}` template literal conflicts within regex strings.

- Resolved an issue where **"Copy Markdown"** occasionally copied the entire file object instead of the specific insight text.

- Fixed a bug where **orphaned notes** *(notes whose original source code was deleted)* would lose their styling.

---

### Current Stats Support

- **Categories Tracked:**
  `Logic`, `Bug Fix`, `TODO`, `Warning`, `Optimization`

- **Search Scope:**
  Real-time content and category filtering


---
---

## [0.0.4] - 2026-03-17 (Specially for bug fix)

###  Fixed (Current)
* **Webview Scoping:** Resolved an issue where Sidebar buttons (Delete, Re-anchor) were unresponsive due to module scoping.
* **Navigation:** Fixed a bug preventing the editor from jumping to the correct line when clicking a note card.
* **Event Bubbling:** Fixed a conflict where clicking "Delete" would also trigger "Open File."

---
---
## [0.0.3] - 2026-03-16

###  Added

- **Smart Gutter Icons**
  Introduced a custom SVG note-marker in the editor gutter for better visibility of anchored insights.


- **Toolbar Navigation**
  Added professional action icons to the Sidebar title bar:
  -  **Pin Insight**
  -  **Clear All** *(with modal confirmation)*
  -  **GitHub** — Direct link to repository
  - **Report Issue** — Direct link to issue tracker

- **Orphan Tracking**
  New logic to detect *orphaned notes*—insights that lose their code reference due to line deletions or file wipes.

---

###  Changed

- **Improved Performance**
  Implemented **debounced storage updates (500ms)** to ensure smooth typing performance in large files.

- **Enhanced Tooltips**
  Gutter icons now display rich Markdown hover messages, including:
  - Insight category
  - Full note content

- **Refined Ghost Text**
  Optimized inline previews using `editorCodeLens.foreground` for a more native, non-distracting appearance.

---

###  Fixed

- **Sync Issues**
  Fixed a bug where the sidebar registry wouldn’t immediately refresh after deleting a note.

- **Activation Triggers**
  Updated `activationEvents` to ensure right-click menus and commands work even if the sidebar hasn’t been opened.

- **Persistence Reliability**
  Resolved an issue where line tracking failed during multiple rapid edits.

---

*This release focuses on usability, performance, and reliability—making insights smoother and more intuitive than ever.*

---
---
## [0.0.2] - 2026-03-16

### Added

#### Smart Line Tracking (Drift Protection)
Logic anchors now stay attached to the correct code even as you add or remove lines above them.
No more "floating" notes.

#### Ghost Text Inline Previews
Added subtle, theme-aware **Ghost Text** at the end of lines to preview insights directly in the editor without hovering.

#### Insight Categorization
You can now tag insights with categories such as:

- **Logic**
- **Bug Fix**
- **Warning**
- **TODO**
- **Optimization**

Categories are color-coded in the **Insight Registry** for faster scanning and organization.

#### Visual Line Highlighting
When jumping to a note from the **Insight Registry**, the target line now receives a temporary high-visibility highlight using `symbolHighlightBackground` to guide the eye.

#### Global Search & Filter
Added a **search bar** to the Insight Registry sidebar, allowing you to quickly filter notes by:

- Filename
- Insight content
- Category

---

### Improved

#### Navigation UX
Implemented a smooth **fade-out animation** for line highlights, ensuring the editor remains clean after locating an insight.

#### Theme Support
All UI elements now use **native VS Code theme variables**, ensuring perfect visibility across:

- Light themes
- Dark themes
- High Contrast themes

---

## [0.0.1] - 2024-05-20

### Added
- **Core Persistence**
  - Save line-specific insights that persist across VS Code sessions.

- **Insight Registry**
  - Added a dedicated **Activity Bar panel** to browse, search, and manage project anchors.

- **Gutter Markers**
  - High-visibility anchor icon displayed in the editor gutter to identify documented logic instantly.

- **Markdown Hover Tooltips**
  - Hover over anchored lines to view rich explanations rendered with **Markdown**.

- **Deep Linking**
  - Clicking an insight in the sidebar automatically **opens the file and jumps to the exact line**.

- **Context Menu Integration**
  - Added **"Pin Insight to Line"** to the editor’s right-click menu for faster workflows.

### Fixed
- Fixed an issue where the **sidebar icon** would not render correctly on dark themes.
- Improved **toast notification timing** for clearer user feedback and smoother UX.
