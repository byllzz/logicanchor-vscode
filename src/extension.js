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

  //  DECORATION SETUP
  const noteDecorationType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: context.asAbsolutePath(path.join('resources', 'note-marker.svg')),
    gutterIconSize: 'contain',
    isWholeLine: true,
    backgroundColor: 'rgba(0, 122, 204, 0.03)',
  });

  const updateDecorations = editor => {
    if (!editor) return;
    // Force a relative path that matches the sidebar
    const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const fileNotes = storage.getAllNotes()[filePath] || {};

    const decorations = Object.keys(fileNotes).map(line => ({
      range: new vscode.Range(parseInt(line), 0, parseInt(line), 0),
      hoverMessage: new vscode.MarkdownString(`**LogicAnchor:** ${fileNotes[line].content}`),
    }));
    editor.setDecorations(noteDecorationType, decorations);
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

        // OPEN FILE
        else if (data.command === 'openFile') {
          const uri = vscode.Uri.file(path.join(root, data.file));
          const doc = await vscode.workspace.openTextDocument(uri);
          const editor = await vscode.window.showTextDocument(doc);
          const pos = new vscode.Position(data.line, 0);
          editor.selection = new vscode.Selection(pos, pos);
          editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
        }

        //  CLEAR ALL
        else if (data.command === 'clearAll') {
          vscode.commands.executeCommand('logicanchor.clearAll');
        }
      });
    },
  };

  //  EVENT LISTENERS
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => editor && updateDecorations(editor)),
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) updateDecorations(editor);
    }),
  );

  // ADD Note COMMANDS
  let addNoteCommand = vscode.commands.registerCommand('logicanchor.addNote', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const noteText = await vscode.window.showInputBox({
      prompt: "What is the 'Why' behind this code?",
      placeHolder: 'Explain the logic for future developers...',
    });

    if (noteText) {
      const line = editor.selection.active.line;
      const filePath = vscode.workspace.asRelativePath(editor.document.uri);

      storage.saveNote(filePath, line, noteText);
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
          text: 'Insight pinned successfully!',
          type: 'success',
        });
      }

      // Standard VS Code notification
      vscode.window.showInformationMessage('LogicAnchor: Insight Saved.');
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
