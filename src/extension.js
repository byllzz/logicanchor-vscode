const vscode = require('vscode');
const path = require('path');
const StorageManager = require('./storage');
const { getSidebarContent } = require('./webview');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const root = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!root) return;

  const storage = new StorageManager(root);
  let currentWebviewView = null;

  //  HIGHLIGHT DECORATION (From v0.0.1 update)
  const noteHighlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.symbolHighlightBackground'),
    isWholeLine: true,
    border: '1px solid gold',
    overviewRulerColor: 'gold',
    overviewRulerLane: vscode.OverviewRulerLane.Full,
  });

  //  GUTTER DECORATION SETUP
  const noteDecorationType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath(path.join('resources', 'note-marker.svg')),
    gutterIconSize: 'contain',
    isWholeLine: true,
    backgroundColor: 'rgba(0, 122, 204, 0.03)',
  });

  //  GHOST TEXT DECORATION (New in v0.0.2)
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
      const range = new vscode.Range(line, 0, line, 0);
      const category = note.category || 'Logic'; // Fallback for older notes

      // Gutter & Hover Tooltip
      gutterDecorations.push({
        range,
        hoverMessage: new vscode.MarkdownString(`**[${category.toUpperCase()}] LogicAnchor:**\n\n${note.content}`),
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
      currentWebviewView = webviewView;
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
      };

      const updateUI = () => {
        webviewView.webview.html = getSidebarContent(
          webviewView.webview,
          context.extensionUri,
          storage.getAllNotes(),
        );
      };

      updateUI();

      webviewView.webview.onDidReceiveMessage(async data => {
        console.log('Received from Webview:', data);

        //  REFRESH
        if (data.command === 'refresh') {
          updateUI();
          webviewView.webview.postMessage({
            command: 'showToast',
            text: 'Registry synced.',
            type: 'success',
          });
        }

        // DELETE SINGLE NOTE
        else if (data.command === 'deleteNote') {
          storage.deleteNote(data.file, data.line);
          updateUI();
          if (vscode.window.activeTextEditor) {
            updateDecorations(vscode.window.activeTextEditor);
          }
          webviewView.webview.postMessage({
            command: 'showToast',
            text: 'Insight removed.',
            type: 'error',
          });
        }

        // OPEN FILE WITH HIGHLIGHT
        else if (data.command === 'openFile') {
          const uri = vscode.Uri.file(path.join(root, data.file));
          const doc = await vscode.workspace.openTextDocument(uri);
          const editor = await vscode.window.showTextDocument(doc);

          const pos = new vscode.Position(data.line, 0);
          const range = new vscode.Range(pos, pos);

          editor.selection = new vscode.Selection(pos, pos);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

          // Apply the highlight decoration
          editor.setDecorations(noteHighlightDecoration, [range]);

          // Remove highlight after 2 seconds
          setTimeout(() => {
            editor.setDecorations(noteHighlightDecoration, []);
          }, 2000);
        }

        //  CLEAR ALL
        else if (data.command === 'clearAll') {
          vscode.commands.executeCommand('logicanchor.clearAll');
        }
      });
    },
  };

  //  EVENT LISTENERS (Updated with Smart Line Tracking)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => editor && updateDecorations(editor)),
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document !== editor.document) return;

      const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);
      let notes = storage.getAllNotes()[filePath];

      // SMART TRACKING: Adjust note lines if code is added/removed above them
      if (notes && Object.keys(notes).length > 0) {
        let changed = false;
        event.contentChanges.forEach(change => {
          const startLine = change.range.start.line;
          const endLine = change.range.end.line;
          const lineDelta = change.text.split('\n').length - 1 - (endLine - startLine);

          if (lineDelta !== 0) {
            const newNotes = {};
            Object.keys(notes).forEach(lineStr => {
              const line = parseInt(lineStr);
              if (line > startLine) {
                newNotes[line + lineDelta] = notes[lineStr];
                changed = true;
              } else {
                newNotes[lineStr] = notes[lineStr];
              }
            });
            notes = newNotes;
          }
        });

        if (changed) {
          storage.updateFileNotes(filePath, notes);
          if (currentWebviewView) {
            currentWebviewView.webview.html = getSidebarContent(
              currentWebviewView.webview,
              context.extensionUri,
              storage.getAllNotes()
            );
          }
        }
      }

      updateDecorations(editor);
    }),
  );

  // ADD Note COMMANDS (Updated with Categories)
  let addNoteCommand = vscode.commands.registerCommand('logicanchor.addNote', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Pick Category First
    const category = await vscode.window.showQuickPick(
      ['Logic', 'Bug Fix', 'Warning', 'TODO', 'Optimization'],
      { placeHolder: 'Select Insight Category' }
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
      updateDecorations(editor);

      // Refresh Sidebar Content
      if (currentWebviewView) {
        currentWebviewView.webview.html = getSidebarContent(
          currentWebviewView.webview,
          context.extensionUri,
          storage.getAllNotes(),
        );

        // This triggers new sliding toast!
        currentWebviewView.webview.postMessage({
          command: 'showToast',
          text: `${category} pinned successfully!`,
          type: 'success',
        });
      }

      // Standard VS Code notification
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
      storage.clearAllNotes();

      // Refresh the UI
      if (currentWebviewView) {
        currentWebviewView.webview.html = getSidebarContent(
          currentWebviewView.webview,
          context.extensionUri,
          storage.getAllNotes(),
        );
      }

      // Clear gutter icons in all visible editors
      vscode.window.visibleTextEditors.forEach(editor => updateDecorations(editor));
      vscode.window.showInformationMessage('LogicAnchor: All insights have been cleared.');
    }
  });

  //  pushing it to subscriptions!
  context.subscriptions.push(clearNotesCommand);

  //  REGISTRATION
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('logicAnchorView', sidebarProvider),
    addNoteCommand,
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
