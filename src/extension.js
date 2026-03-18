const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const StorageManager = require('./storage');
const { getSidebarContent } = require('./webview');
const v005 = require("../versions/v005");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!root) return;

  const storage = new StorageManager(root);
  let currentWebviewView = null;

  // function to refresh the Sidebar content
  const refreshSidebar = () => {
    if (currentWebviewView) {
      currentWebviewView.webview.html = getSidebarContent(
        currentWebviewView.webview,
        context.extensionUri,
        storage.getAllNotes(),
      );
    }
  };

  // the debounced update outside the listener so it persists
  const debouncedStorageUpdate = debounce((filePath, notes) => {
    storage.updateFileNotes(filePath, notes);
    refreshSidebar(); // Refresh UI after the file is actually updated
  }, 500);

  //  Validate anchors on activation to mark orphans v0.0.3
  // validateAnchorsOnStart(storage, root); ... also called it bottom
  //  HIGHLIGHT DECORATION (From v0.0.1 update)
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

  const updateDecorations = editor => {
    if (!editor) return;
    const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const fileNotes = storage.getAllNotes()[filePath] || {};

    const gutterDecorations = [];
    const ghostDecorations = [];

    Object.keys(fileNotes).forEach(lineStr => {
      const line = parseInt(lineStr);
      const note = fileNotes[lineStr];

      // Skip decorations if the note is orphaned (v0.0.3 update)
      if (note.isOrphan) return;

      const range = new vscode.Range(line, 0, line, 0);
      const category = note.category || 'Logic'; // Fallback for older notes

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
        renderOptions: {
          after: {
            contentText: `${category}: ${note.content.substring(0, 40)}${note.content.length > 40 ? '...' : ''}`,
            fontStyle: 'italic',
            color: new vscode.ThemeColor('editorCodeLens.foreground'), // Faded color for ghost text
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

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [context.extensionUri],
    };

    // Initial load
    refreshSidebar();

    webviewView.webview.onDidReceiveMessage(async data => {
      console.log('Received from Webview:', data);
      const editor = vscode.window.activeTextEditor;

      switch (data.command) {
        // v0.0.5 feature: Inline Edit
        case 'editNote':
          const editSuccessful = await v005.editInsight(storage, data.file, data.line);

          if (editSuccessful) {
            refreshSidebar();
            //  Refresh the decorations in the code editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              updateDecorations(editor);
            }
            //  Send the toast
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
        // v0.0.5 feature(copyMarkdown)
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
    break;
    // v0.0.5 feature (provides total stats of insights )
case 'getStats':
    const stats = v005.getStats(storage);
    webviewView.webview.postMessage({
        command: 'updateStats',
        stats: stats,
    });
    break;

        case 'deleteNote':
          storage.deleteNote(data.file, data.line);
          refreshSidebar();
          if (editor) {
            updateDecorations(editor);
          }
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
      }
    });
  },
};

  //  EVENT LISTENERS
  // ADD Note COMMANDS (Updated with Categories)
  let addNoteCommand = vscode.commands.registerCommand('logicanchor.addNote', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return; // Pick Category First

    const category = await vscode.window.showQuickPick(
      ['Logic', 'Bug Fix', 'Warning', 'TODO', 'Optimization'],
      { placeHolder: 'Select Insight Category' },
    );
    if (!category) return; // Exit if user cancels

    const noteText = await vscode.window.showInputBox({
      prompt: `What is the 'Why' behind this ${category}?`,
      placeHolder: 'Explain the logic for future developers...',
    });

    if (noteText) {
      const line = editor.selection.active.line;
      const filePath = vscode.workspace.asRelativePath(editor.document.uri);

      storage.saveNote(filePath, line, noteText, category);
      updateDecorations(editor); // Refresh Sidebar Content

      if (currentWebviewView) {
        currentWebviewView.webview.html = getSidebarContent(
          currentWebviewView.webview,
          context.extensionUri,
          storage.getAllNotes(),
        ); // This triggers new sliding toast!

        currentWebviewView.webview.postMessage({
          command: 'showToast',
          text: `${category} pinned successfully!`,
          type: 'success',
        });
      } // Standard VS Code notification

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
      storage.clearAllNotes(); // Refresh the UI

      if (currentWebviewView) {
        currentWebviewView.webview.html = getSidebarContent(
          currentWebviewView.webview,
          context.extensionUri,
          storage.getAllNotes(),
        );
      } // Clear gutter icons in all visible editors
      vscode.window.visibleTextEditors.forEach(editor => updateDecorations(editor));
      vscode.window.showInformationMessage('LogicAnchor: All insights have been cleared.');
    }
  });

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

  //  pushing it to subscriptions!
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
      let notes = storage.getAllNotes()[filePath];

      if (notes && Object.keys(notes).length > 0) {
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
            } else if (line >= startLine && line <= endLine && lineDelta < 0) {
              note.isOrphan = true;
              newNotes[lineStr] = note;
              changed = true;
            } else if (line > startLine && lineDelta !== 0) {
              newNotes[line + lineDelta] = note;
              changed = true;
            } else {
              newNotes[lineStr] = note;
            }
          });
          notes = newNotes;
        });

        if (changed) {
          // Using here the debounced function instead of direct storage update
          debouncedStorageUpdate(filePath, notes);
        }
      }

      // Decorations stay real-time so the icons move while typing!
      updateDecorations(editor);
    }),
  );

  // Command to ope the github repo
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

  //  this ensure icons appear when switching between open tabs
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        updateDecorations(editor);
      }
    }),
  );


  // v0.0.5 features

  // Registering the Export Command
  let exportCmd = vscode.commands.registerCommand("logicanchor.export" , ()=> {
    v005.exportToJSON(storage);
  });

}

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
