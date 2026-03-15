const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * This class handles saving and retrieving notes from the .context folder
 */
class StorageManager {
  constructor(workspaceRoot) {
    this.storagePath = path.join(workspaceRoot, '.context', 'notes.json');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  saveNote(fileRelativePath, line, content) {
    let data = this.getAllNotes();
    if (!data[fileRelativePath]) data[fileRelativePath] = {};

    data[fileRelativePath][line] = {
      content,
      author: vscode.env.machineId, // Anonymous but unique
      timestamp: Date.now(),
    };

    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
  }

  // This method allows  to delete a note
  deleteNote(fileRelativePath, line) {
    let data = this.getAllNotes();
    if (data[fileRelativePath] && data[fileRelativePath][line]) {
      delete data[fileRelativePath][line];

      // Cleanup: If a file has no more notes, remove the file key entirely
      if (Object.keys(data[fileRelativePath]).length === 0) {
        delete data[fileRelativePath];
      }

      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  }

  getAllNotes() {
    if (!fs.existsSync(this.storagePath)) return {};
    try {
      const content = fs.readFileSync(this.storagePath, 'utf8');
      return JSON.parse(content || '{}');
    } catch (error) {
      console.error('LogicAnchor: Error reading notes.json', error);
      return {};
    }
  }

  clearAllNotes() {
    try {
      const emptyData = {};
      fs.writeFileSync(this.storagePath, JSON.stringify(emptyData, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to clear notes:', error);
      return false;
    }
  }
}

module.exports = StorageManager;
