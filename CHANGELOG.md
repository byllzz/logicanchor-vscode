# Changelog

All notable changes to **LogicAnchor** will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**
and this project adheres to **[Semantic Versioning](https://semver.org/)**.

---

## [Unreleased]

### Planned
- Support for syncing insights via **GitHub Gists**
- Ability to **lock notes** to prevent accidental deletion
- **AI-assisted summaries** to automatically generate explanations from code logic

---

## [0.0.1] - 2024-05-20

### Added

- **Core Persistence**
  Support for saving line-specific insights that persist across VS Code sessions.

- **Insight Registry**
  Added a new **Activity Bar view** to browse, search, and filter all project anchors.

- **Gutter Markers**
  High-visibility **anchor icon** in the editor gutter to identify documented logic at a glance.

- **Markdown Hover Tooltips**
  Rich tooltips that render **Markdown content** when hovering over an anchored line.

- **Deep Linking**
  Clicking a note in the sidebar automatically opens the **target file and line**.

- **Context Menu Integration**
  Added **"Pin Insight to Line"** to the editor's right-click menu for faster workflow.

---

### Fixed

- Fixed an issue where the **sidebar icon would not render correctly on dark themes**
- Improved **toast notification timing** for better feedback and UX

---

