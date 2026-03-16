# Changelog

All notable changes to **LogicAnchor** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- **GitHub Gist Sync**
  - Support syncing insights across machines using GitHub Gists.

- **Note Locking**
  - Ability to lock insights to prevent accidental deletion.

- **AI-Assisted Summaries**
  - Automatically generate explanations from code logic using AI-powered summaries.

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
