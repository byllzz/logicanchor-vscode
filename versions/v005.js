const vscode = require('vscode');
const path = require('path');

class Version005 {
  /**
   * Inline Editing Logic
   */
  static async editInsight(storage, file, line) {
    const allNotes = storage.getAllNotes();
    const existingNote = allNotes[file] ? allNotes[file][line] : null;

    if (!existingNote) {
      vscode.window.showErrorMessage('LogicAnchor: Note not found.');
      return false;
    }

    const newContent = await vscode.window.showInputBox({
      prompt: 'Edit your insight',
      value: existingNote.content,
      ignoreFocusOut: true,
    });

    if (newContent === undefined) return false;

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const fullPath = path.join(workspaceFolders[0].uri.fsPath, file);
        const document = await vscode.workspace.openTextDocument(fullPath);
        const edit = new vscode.WorkspaceEdit();

        const lineNum = parseInt(line);
        const lineText = document.lineAt(lineNum).text;

        const commentMarker = '// ';
        const commentIndex = lineText.indexOf(commentMarker);

        if (commentIndex !== -1) {
          const range = new vscode.Range(
            lineNum,
            commentIndex + commentMarker.length,
            lineNum,
            lineText.length,
          );

          edit.replace(document.uri, range, newContent);
          await vscode.workspace.applyEdit(edit);
          await document.save();
        }
      }

      storage.saveNote(file, line, newContent, existingNote.category || 'Logic');
      return true;
    } catch (error) {
      console.error('Edit Error:', error);
      vscode.window.showErrorMessage('Failed to update: ' + error.message);
      return false;
    }
  } /**
   * Copy as Markdown
   */

  static async copyAsMarkdown(storage, file, line) {
    const allNotes = storage.getAllNotes();

    const fileNotes = allNotes[file];
    if (!fileNotes) return false;
    const note = fileNotes[line];

    if (note && note.content) {
      const justTheInsight = note.content;
      await vscode.env.clipboard.writeText(justTheInsight);
      return true;
    }

    return false;
  } /**
   * Statistics Dashboard
   */
  static getStats(storage) {
    const allNotes = storage.getAllNotes();
    const stats = {
      total: 0,
      orphans: 0,
      categories: { Logic: 0, 'Bug Fix': 0, Warning: 0, TODO: 0, Optimization: 0 },
    };

    Object.values(allNotes).forEach(fileNotes => {
      Object.values(fileNotes).forEach(note => {
        if (!note) return;

        if (note.isOrphan) {
          stats.orphans++; // Correctly count orphans
        } else {
          stats.total++; // Correctly count active notes
          const cat = note.category || 'Logic';
          if (stats.categories.hasOwnProperty(cat)) {
            stats.categories[cat]++;
          }
        }
      });
    });
    return stats;
  }
  /**
   * Export Logic
   */
  static async exportToJSON(storage) {
    const allNotes = storage.getAllNotes();

    if (Object.keys(allNotes).length === 0) {
      vscode.window.showWarningMessage('No insights found to export.');
      return;
    }

    const uri = await vscode.window.showSaveDialog({
      filters: { JSON: ['json'] },
      saveLabel: 'Export Insights',
      defaultUri: vscode.Uri.file('logicanchor-export.json'),
    });

    if (uri) {
      const content = Buffer.from(JSON.stringify(allNotes, null, 2), 'utf8');
      await vscode.workspace.fs.writeFile(uri, content);
      vscode.window.showInformationMessage('Insights exported successfully!');
    }
  }
}

module.exports = Version005;
