const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const StorageManager = require('./storage');
const { getSidebarContent } = require('./webview');
const v005 = require("../versions/v005");
const v006 = require("../versions/v006");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
if (!root) return;

const storage = new StorageManager(root);
let currentWebviewView = null;
let pendingNotesCache = {};

// function to refresh the Sidebar content
 const refreshSidebar = () => {
  if(!currentWebviewView) return;
   //  Getthing stats from v0.0.5
   const stats = v005.getStats(storage);
   const totalCount = Number(stats.total) || 0;
   const orphanCount = Number(stats.orphans) || 0;
  //  Clear if 0, otherwise show health vs warning
  if (totalCount === 0 && orphanCount === 0) {
    currentWebviewView.badge = {value : 0 , tooltip : ""};
  } else {
    currentWebviewView.badge = {
      value: totalCount > 0 ? totalCount : orphanCount,
      tooltip: orphanCount > 0
        ? `⚠️ ${orphanCount} Orphans Detected`
        : `${totalCount} Logic Anchors pinned`
    };
  }
 const allNotes = storage.getAllNotes();
  currentWebviewView.webview.html = getSidebarContent(
    currentWebviewView.webview,
    context.extensionUri,
    allNotes
  );
 // Updating Stats in Webview UI
  currentWebviewView.webview.postMessage({
  command: 'updateStats',
  stats: stats,
  });

  if (v006?.updateStatusBarPulse) {
    v006.updateStatusBarPulse(storage);
  }
 };

//  Debounce function..
const debouncedStorageUpdate = debounce((filePath, notes) => {
  storage.updateFileNotes(filePath, notes);
  delete pendingNotesCache[filePath];
  // Refreshing sidebar here and checks for orphan alerts ONLY after typing stops
  refreshSidebar();
  if (v006?.updateOrphanAlert) {
    v006.updateOrphanAlert(storage);
  }
}, 500);

  //  Validate anchors on activation to mark orphans v0.0.3
  // validateAnchorsOnStart(storage, root); ... also called it bottom
  const noteHighlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.symbolHighlightBackground'),
    isWholeLine: true,
    border: '1px solid gold',
    overviewRulerColor: 'gold',
    overviewRulerLane: vscode.OverviewRulerLane.Full,
  });

  //  GUTTER DECORATION SETUP
  const noteDecorationType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath(path.join('resources', 'note-marker.svg')),
    gutterIconSize: 'contain',
    isWholeLine: true,
    backgroundColor: 'rgba(0, 122, 204, 0.03)',
  });

  //  GHOST TEXT DECORATION (New in v0.0.2)
  const ghostTextDecoration = vscode.window.createTextEditorDecorationType({});

 const updateDecorations = (editor, liveNotes = null) => {
    if (!editor) return;
    const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);

    // Prioritize: 1. Passed live notes, 2. The temporary cache, 3. The disk storage
    const fileNotes = liveNotes || (typeof pendingNotesCache !== 'undefined' ? pendingNotesCache[filePath] : null) || storage.getAllNotes()[filePath] || {};

    const gutterDecorations = [];
    const ghostDecorations = [];

    Object.keys(fileNotes).forEach(lineStr => {
      const line = parseInt(lineStr);
      const note = fileNotes[lineStr];

      // Skip decorations if the note is orphaned
      if (note.isOrphan) return;

      // We anchor the range to the start of the line
      const range = new vscode.Range(line, 0, line, 0);
      const category = note.category || 'Logic';

      // Gutter & Hover Tooltip
      gutterDecorations.push({
        range,
        hoverMessage: new vscode.MarkdownString(
          `**[${category.toUpperCase()}] LogicAnchor:**\n\n${note.content}`,
        ),
      });

      // Ghost Text (Inline Preview)
      ghostDecorations.push({
        range,
        // This ensures the decoration stays attached to the text range
        // even if lines are added/removed around it.
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        renderOptions: {
          after: {
            contentText: ` ${category}: ${note.content.substring(0, 40)}${note.content.length > 40 ? '...' : ''}`,
            fontStyle: 'italic',
            color: new vscode.ThemeColor('editorCodeLens.foreground'),
            margin: '0 0 0 3em',
          },
        },
      });
    });

    editor.setDecorations(noteDecorationType, gutterDecorations);
    editor.setDecorations(ghostTextDecoration, ghostDecorations);
  };

  // SIDEBAR PROVIDER
 const sidebarProvider = {
  resolveWebviewView(webviewView) {
    currentWebviewView = webviewView; // global reference
  webviewView.onDidDispose(() => {
    currentWebviewView = null;
  });

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [context.extensionUri],
    };
  //  Force update the badge the moment the user opens the panel
    const stats = v005.getStats(storage);
    webviewView.badge = stats.total > 0
      ? { value: stats.total, tooltip: `${stats.total} Logic Anchors` }
      : {value : 0 , tooltip : ""};

// Show total if available, otherwise orphans
if (stats.total > 0) {
    webviewView.badge = { value: stats.total, tooltip: `${stats.total} Logic Anchors` };
} else if (stats.orphans > 0) {
    webviewView.badge = { value: stats.orphans, tooltip: `${stats.orphans} Orphans detected` };
} else {
    webviewView.badge = undefined;
}
    // Initial load
    refreshSidebar();
    // If the user clicks away and comes back, refresh immediately
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          refreshSidebar();
        }
      });
    webviewView.webview.onDidReceiveMessage(async data => {
      console.log('Received from Webview:', data);
      const editor = vscode.window.activeTextEditor;

      switch (
        data.command // v0.0.5 feature: Inline Edit
      ) {
        case 'editNote':
          const editSuccessful = await v005.editInsight(storage, data.file, data.line);

          if (editSuccessful) {
            refreshSidebar(); //  Refresh the decorations in the code editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              updateDecorations(editor);
            } //  Send the toast
            webviewView.webview.postMessage({
              command: 'showToast',
              text: 'Insight updated live.',
              type: 'success',
            });
          }
          break;
          // v0.0.5 feature (export to json)
        case 'exportJson':
          await v005.exportToJSON(storage);
          break;
          case 'copyMarkdown':
          await v005.copyAsMarkdown(storage, data.file, data.line);
          webviewView.webview.postMessage({
            command: 'showToast',
            text: 'Markdown copied to clipboard!',
            type: 'success',
          });
          break;
        // v0.0.5 silent background process
        case 'init':
          const initStats = v005.getStats(storage);
          webviewView.webview.postMessage({
            command: 'updateStats',
            stats: initStats,
          });
          break;

        case 'refresh':
          await validateAnchorsOnStart(storage, root);
          refreshSidebar();
          const refreshStats = v005.getStats(storage);
          webviewView.webview.postMessage({
            command: 'updateStats',
            stats: refreshStats,
          });
          webviewView.webview.postMessage({
            command: 'showToast',
            text: 'Registry synced.',
            type: 'success',
          });
          break; // v0.0.5 feature (provides total stats of insights )
        case 'getStats':
          const stats = v005.getStats(storage);
          webviewView.webview.postMessage({
            command: 'updateStats',
            stats: stats,
          });
          break;

        case 'deleteNote':
          // Remove from storage
          await storage.deleteNote(data.file, data.line);
          // Then refresh the HTML list
          refreshSidebar();
          // Update editor gutter/decorations
          if (editor) {
            updateDecorations(editor);
          }
          // Show the toast
          webviewView.webview.postMessage({
            command: 'showToast',
            text: 'Insight removed.',
            type: 'error',
          });
          break;

        case 'openFile':
          const uri = vscode.Uri.file(path.join(root, data.file));
          const doc = await vscode.workspace.openTextDocument(uri);
          const openedEditor = await vscode.window.showTextDocument(doc);

          const pos = new vscode.Position(parseInt(data.line), 0);
          const range = new vscode.Range(pos, pos);

          openedEditor.selection = new vscode.Selection(pos, pos);
          openedEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);

          openedEditor.setDecorations(noteHighlightDecoration, [range]);
          setTimeout(() => {
            openedEditor.setDecorations(noteHighlightDecoration, []);
          }, 2000);
          break;

        case 'reanchorNote':
          if (!editor) {
            vscode.window.showErrorMessage(
              'Open the file and place your cursor on the new line first!',
            );
            return;
          }

          const activeFilePath = vscode.workspace.asRelativePath(editor.document.uri, false);

          if (activeFilePath !== data.file) {
            vscode.window.showErrorMessage(`Please open ${data.file} to re-anchor this note.`);
            return;
          }

          const newLine = editor.selection.active.line;
          const success = storage.reanchorNote(data.file, data.oldLine, newLine);

          if (success) {
            refreshSidebar();
            updateDecorations(editor);
            webviewView.webview.postMessage({
              command: 'showToast',
              text: `Re-anchored to line ${newLine + 1}`,
              type: 'success',
            });
          } else {
            vscode.window.showErrorMessage('Could not find the original note data to move.');
          }
          break;

        case 'clearAll':
          vscode.commands.executeCommand('logicanchor.clearAll');
          break;

        // v0.0.6 feature
        case 'cleanupOrphans':
          await v006.cleanupOrphans(storage);
          pendingNotesCache= {};
          refreshSidebar(); // Force the UI to update immediately
          break;
      }
    });
  },
};

  // All Working Event Listeners
let addNoteCommand = vscode.commands.registerCommand('logicanchor.addNote', async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const category = await vscode.window.showQuickPick(
    ['Logic', 'Bug Fix', 'Warning', 'TODO', 'Optimization'],
    { placeHolder: 'Select Insight Category' },
  );
  if (!category) return;

  const noteText = await vscode.window.showInputBox({
    prompt: `What is the 'Why' behind this ${category}?`,
    placeHolder: 'Explain the logic for future developers...',
  });

  if (noteText) {
    const line = editor.selection.active.line;
    const filePath = vscode.workspace.asRelativePath(editor.document.uri);

    // Save to storage
    storage.saveNote(filePath, line, noteText, category);
    // Update editor visuals
    updateDecorations(editor);
    refreshSidebar();
    if (currentWebviewView) {
      //  Refresh Sidebar HTML
      currentWebviewView.webview.html = getSidebarContent(
        currentWebviewView.webview,
        context.extensionUri,
        storage.getAllNotes(),
      );
      // Explicitly push updated stats to update the "Total Insight" count
      const latestStats = v005.getStats(storage);
      currentWebviewView.webview.postMessage({
        command: 'updateStats',
        stats: latestStats,
      });
      //  Trigger the toast notification
      currentWebviewView.webview.postMessage({
        command: 'showToast',
        text: `${category} pinned successfully!`,
        type: 'success',
      });
    }
    vscode.window.showInformationMessage(`LogicAnchor: ${category} Saved.`);
  }
});


// Clear All Notes Command
  let clearNotesCommand = vscode.commands.registerCommand('logicanchor.clearAll', async () => {
    const confirmation = await vscode.window.showWarningMessage(
      'Are you sure you want to delete ALL logic anchors in this workspace?',
      { modal: true },
      'Yes, Clear All',
    );

    if (confirmation === 'Yes, Clear All') {
      // Wipe the storage
      await storage.clearAllNotes();
      pendingNotesCache = {};
      refreshSidebar();
      // Clear gutter icons in all visible editors
      vscode.window.visibleTextEditors.forEach(editor => updateDecorations(editor));
      vscode.window.showInformationMessage('LogicAnchor: All insights have been cleared.');
    }
  });

  // v0.0.6 feature
let hardResetCommand = vscode.commands.registerCommand('logicanchor.hardReset', async () => {
  const confirmation = await vscode.window.showWarningMessage(
    'This will WIPE ALL DATA and reset the badge. Are you sure?',
    { modal: true },
    'Yes, Reset Everything',
  );

  if (confirmation === 'Yes, Reset Everything') {
    await storage.clearAllNotes(); // Wipes disk
    pendingNotesCache = {}; // This clears memory
    if (currentWebviewView) {
      currentWebviewView.badge = undefined; // Removes the "1"
      refreshSidebar();
    }
    vscode.window.showInformationMessage('LogicAnchor: Storage has been hard reset.');
  }
});
context.subscriptions.push(hardResetCommand);

  // This validates anchors on activation to mark orphans v0.0.3
  async function validateAnchorsOnStart(storageManager, rootPath) {
    const allNotes = storageManager.getAllNotes();
    let changedAny = false;

    for (const filePath in allNotes) {
      try {
        const fullPath = path.join(rootPath, filePath);

        // Skip if file no longer exists on disk
        if (!fs.existsSync(fullPath)) {
          continue;
        }

        const uri = vscode.Uri.file(fullPath);
        const doc = await vscode.workspace.openTextDocument(uri);
        const fileNotes = allNotes[filePath];
        let fileChanged = false;

        Object.keys(fileNotes).forEach(lineStr => {
          const line = parseInt(lineStr);
          const note = fileNotes[lineStr];

          /**
           * ORPHAN LOGIC:
           * 1. Line number is beyond the current document length.
           * 2. The specific line is now empty or just whitespace (meaning the code moved/deleted).
           * 3. The entire document is empty.
           */
          const isLineOutOfBounds = line >= doc.lineCount;
          const isLineEmpty = !isLineOutOfBounds && doc.lineAt(line).isEmptyOrWhitespace;
          const isDocEmpty = doc.getText().trim() === '';

          const shouldBeOrphan = isLineOutOfBounds || isLineEmpty || isDocEmpty;

          if (note.isOrphan !== shouldBeOrphan) {
            note.isOrphan = shouldBeOrphan;
            fileChanged = true;
            changedAny = true;
          }
        });

        if (fileChanged) {
          storageManager.updateFileNotes(filePath, fileNotes);
        }
      } catch (e) {
        console.error('LogicAnchor: Error validating anchors for file:', filePath, e);
      }
    }

    return changedAny; // Return true if we need to trigger a UI refresh
  }

  // pushing it to subscriptions!
  context.subscriptions.push(clearNotesCommand);

  //  REGISTRATION
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('logicAnchorView', sidebarProvider),
    addNoteCommand,
  );

  validateAnchorsOnStart(storage, root).then(() => {
    refreshSidebar();
    if (vscode.window.activeTextEditor) updateDecorations(vscode.window.activeTextEditor);
  });

context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document !== editor.document) return;

      const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);

      let notes = pendingNotesCache[filePath] || storage.getAllNotes()[filePath];

      if (notes) {
        let changed = false;
        const isFileEmpty = event.document.getText().trim() === '';

      event.contentChanges.forEach(change => {
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        const lineDelta = change.text.split('\n').length - 1 - (endLine - startLine);

        const newNotes = {};
        Object.keys(notes).forEach(lineStr => {
          const line = parseInt(lineStr);
          const note = notes[lineStr];

          if (isFileEmpty) {
            note.isOrphan = true;
            newNotes[lineStr] = note;
            changed = true;
          }
          // If it's just a backspace at the end, this keep the note.
          else if (line >= startLine && line <= endLine && lineDelta < 0) {
            const isFullLineDelete =
              change.range.start.character === 0 && change.range.end.character >= 999;
            if (isFullLineDelete || startLine !== endLine) {
              note.isOrphan = true;
              changed = true;
            }
            newNotes[lineStr] = note;
          }
          //  If press Enter ABOVE the insight line
          else if (line > startLine && lineDelta !== 0) {
            newNotes[line + lineDelta] = note;
            changed = true;
          }
          //  THE "MIDDLE & RIGHT" FIX
          else if (line === startLine && lineDelta > 0) {
            const lineAfterChange = event.document.lineAt(startLine).text;
            const cursorPosition = change.range.start.character;
            if (cursorPosition >= lineAfterChange.length && lineAfterChange.trim() !== '') {
              // RIGHT SIDE: Keep it here
              newNotes[lineStr] = note;
            } else {
              newNotes[line + lineDelta] = note;
              changed = true;
            }
          }
          else {
            newNotes[lineStr] = note;
          }
        });
        notes = newNotes;
      });


if (changed) {
        pendingNotesCache[filePath] = notes; // Keep in memory
        updateDecorations(editor, notes);    // Update visuals immediately (snappy!)
        debouncedStorageUpdate(filePath, notes); // Save to disk and update stats later
      }
      }
    }),
  );

  // Command to open the github repo
  let openRepoCommand = vscode.commands.registerCommand('logicanchor.openRepo', () => {
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/byllzz/logicanchor-vscode'));
  });

  // Command to open the Issues page
  const reportIssue = vscode.commands.registerCommand('logicanchor.reportIssue', () => {
    vscode.env.openExternal(
      vscode.Uri.parse('https://github.com/byllzz/logicanchor-vscode/issues'),
    );
  });

  // subscriptions
  context.subscriptions.push(openRepoCommand, reportIssue);

  //  this ensure icons appear when switching between open tabs
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        updateDecorations(editor);
      }
    }),
    vscode.commands.registerCommand('logicanchor.nextInsight', () => {
      v006.navigateInsights(storage, 'next');
    }),
    vscode.commands.registerCommand('logicanchor.prevInsight', () => {
      v006.navigateInsights(storage, 'prev');
    }),
    vscode.commands.registerCommand('logicanchor.generateMap', () => {
      v006.generateLogicMap(storage, root);
    }),
    // 5. Health Check Command
    vscode.commands.registerCommand('logicanchor.projectHealth', () => {
      v006.showProjectHealth(storage);
    }),
    // 6. Cleanup Command
    vscode.commands.registerCommand('logicanchor.cleanupOrphans', () => {
        v006.cleanupOrphans(storage);
    }),
    vscode.commands.registerCommand('logicanchor.refreshSidebar', () => {
      // FIX: Change 'updateSidebar' to 'refreshSidebar'
      if (typeof refreshSidebar === 'function') {
        refreshSidebar();
        vscode.window.setStatusBarMessage('🔄 Sidebar Synced', 2000);
      } else {
        console.error('LogicAnchor: refreshSidebar function not found!');
      }
    }),
  );

  // Registering the Export Command
  let exportCmd = vscode.commands.registerCommand("logicanchor.export" , ()=> {
    v005.exportToJSON(storage);
  });
}; // activate function end here
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
function deactivate() {}
module.exports = { activate, deactivate };
