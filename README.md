# LogicAnchor

### The Persistent Context Layer for Complex Codebases

<p align="left">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-9B72FF.svg?style=flat" />
  </a>
  <img src="https://img.shields.io/badge/Extension%20Status-Active-9B72FF.svg?style=flat" />
  <img src="https://img.shields.io/badge/VS%20Code-Extension-9B72FF.svg?style=flat&logo=visualstudiocode&logoColor=white" />
  <img src="https://img.shields.io/badge/Markdown-Supported-9B72FF.svg?style=flat&logo=markdown&logoColor=white" />
  <a href="https://github.com/byllzz">
    <img src="https://img.shields.io/badge/Author-Bilal%20Malik-9B72FF.svg?style=flat" />
  </a>
  <a href="https://github.com/byllzz/logicAnchor-vscode/releases">
    <img src="https://img.shields.io/badge/Latest%20Release-0.0.6-9B72FF.svg?style=flat" />
  </a>
</p>

[![Publisher](https://img.shields.io/badge/Publisher-Bilal%20Malik-9B72FF?style=flat)](https://marketplace.visualstudio.com/publishers/bilalmlkdev)

<p align="center">
Pin the <b>“Why”</b> behind your code directly inside your editor.
</p>

---
Instead of cluttering your files with massive comment blocks, LogicAnchor introduces a **structured documentation layer** that lives exactly where your logic does.
By anchoring insights, design decisions, and logic explanations to **specific lines of code**, you ensure that the **“Why” behind your implementation is never lost over time**.

---
##  Features

- **Contextual Pinning**
  Save thoughts or explanations directly to a specific line using the editor context menu *(right-click)*.

- **Visual Gutter Indicators**
  Anchors appear in the editor gutter, making it easy to spot where insights exist at a glance.

- **Markdown Hover Previews**
  Hover over any anchored line to instantly view the insight rendered as **rich Markdown**.

- **Logic Registry Sidebar**
  Browse, search, and manage all saved insights from a dedicated sidebar registry panel.

- **Precision Navigation**
  Clicking an insight in the registry automatically:
  - Opens the file
  - Jumps to the exact anchored line

- **Smart Highlight**
  When navigating to a note, LogicAnchor applies a temporary subtle glow to guide your focus precisely to the relevant code.

- **Dynamic Ghost Text** *(New)*
  View a faded, non-intrusive preview of your notes directly in the editor while scrolling.

- **Intelligent Tracking** *(New)*
  LogicAnchor dynamically tracks your code as you type.
  Even when adding or deleting lines, insights remain accurately pinned to the correct logic.

- **Theme Native UI**
  The interface automatically adapts to your VS Code theme:
  - Dark
  - Light
  - High Contrast

- **Rich Explanations**
  Write detailed insights using full Markdown support, including:
  - Code blocks
  - Lists
  - Bold formatting

---

 *Designed to keep your logic, thoughts, and explanations seamlessly connected to your code.*

---

##  Usage

### 1. Instant Context Anchoring
**Right-click any line** or press `Ctrl + Alt + A` to attach architectural decisions.

![Demo Add Note](media/demo-add-note.gif)
---

### 2. One-Click Access
Launch the **LogicAnchor Insight Registry** directly from the Activity Bar.

![Demo Sidebar Open](media/demo-sidebar-open.gif)

---

### 3. Centralized Registry
Access every architectural decision across your entire workspace.

![Demo Goto Location](media/demo-goto-location.gif)
---

##  Insight Registry

A dedicated **sidebar panel** lets you:

* Search all insights
* Browse architectural decisions
* Manage project documentation

---

##  Deep Linking

Click any insight in the registry to **jump instantly to the file and line where it was created**.

---

##  Theme Adaptive

LogicAnchor automatically adapts to your **VS Code theme**:

* Dark Mode
* Light Mode
* High Contrast

---


### View Insights

Click the **Anchor Icon** in the **Activity Bar** to open the **Insight Registry**.

From there you can:

*  Search insights
*  Navigate code context
*  Delete outdated notes

---

#  Optional Keyboard Shortcut

You can add a shortcut for faster anchoring inside `keybindings.json`.

```json
{
  "key": "ctrl+alt+a",
  "command": "logicanchor.addNote"
}
```

---

#  Configuration

LogicAnchor is fully configurable using **VS Code settings**.

---

## Toggle Gutter Icons

```json
{
  "logicanchor.showGutterIcon": true
}
```

---

## Enable Markdown Rendering

```json
{
  "logicanchor.enableMarkdown": true
}
```

---

## Exclude Files

```json
{
  "logicanchor.excludedFiles": [
    "**/node_modules/**",
    "**/.git/**",
    "*.log"
  ]
}
```

---

#  Installation

### From VS Code Marketplace

1. Open **VS Code**
2. Go to **Extensions** (`Ctrl + Shift + X`)
3. Search for **LogicAnchor**
4. Click **Install**

---

#  Change Log

See the **CHANGELOG.md** file for version history and updates.

---

#  Issues

If you find a bug or have a suggestion for a **new feature**, please open an **Issue** in the repository.

---

# Contributing

Contributions are welcome.
1. Fork the repository
2. Create a new branch
3. Submit a **Pull Request**

