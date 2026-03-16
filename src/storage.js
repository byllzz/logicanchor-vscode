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

  // 0.0.2 - Updated to include category support
  saveNote(fileRelativePath, line, content, category = 'Logic') {
    let data = this.getAllNotes();
    if (!data[fileRelativePath]) data[fileRelativePath] = {};

    data[fileRelativePath][line] = {
      content,
      category, // Added for v0.0.2
      author: vscode.env.machineId,
      timestamp: Date.now(),
    };

    this.saveToDisk(data);
  }

  // This method allows to delete a note
  deleteNote(fileRelativePath, line) {
    let data = this.getAllNotes();
    if (data[fileRelativePath] && data[fileRelativePath][line]) {
      delete data[fileRelativePath][line];

      // Cleanup: If a file has no more notes, remove the file key entirely
      if (Object.keys(data[fileRelativePath]).length === 0) {
        delete data[fileRelativePath];
      }

      this.saveToDisk(data);
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
      this.saveToDisk(emptyData);
      return true;
    } catch (error) {
      console.error('Failed to clear notes:', error);
      return false;
    }
  }

  // Helper to keep code clean
  saveToDisk(data) {
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
  }

  // 0.0.2 - New feature for Smart Line Tracking
  updateFileNotes(filePath, fileNotes) {
    const allNotes = this.getAllNotes();
    allNotes[filePath] = fileNotes;
    this.saveToDisk(allNotes);
  }
}

module.exports = StorageManager;
