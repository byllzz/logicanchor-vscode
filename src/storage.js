const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

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

  saveNote(fileRelativePath, line, content, category = 'Logic') {
    let data = this.getAllNotes();
    if (!data[fileRelativePath]) data[fileRelativePath] = {};

    data[fileRelativePath][line] = {
      content,
      category,
      isOrphan: false, // NEW -  Default to false on save
      author: vscode.env.machineId,
      timestamp: Date.now(),
    };

    this.saveToDisk(data);
  }

  // NEW for v0.0.3 - Mark a note as an orphan
  markAsOrphan(fileRelativePath, line, status = true) {
    let data = this.getAllNotes();
    if (data[fileRelativePath] && data[fileRelativePath][line]) {
      data[fileRelativePath][line].isOrphan = status;
      this.saveToDisk(data);
    }
  }

  // NEW for v0.0.3 - Move note from one line to another and clear orphan status
  reanchorNote(fileRelativePath, oldLine, newLine) {
    let data = this.getAllNotes();
    if (data[fileRelativePath] && data[fileRelativePath][oldLine]) {
      const noteData = data[fileRelativePath][oldLine];

      // Update the note data
      noteData.isOrphan = false;
      noteData.timestamp = Date.now(); 

      // Move to new line and delete old entry
      data[fileRelativePath][newLine] = noteData;
      delete data[fileRelativePath][oldLine];

      this.saveToDisk(data);
      return true;
    }
    return false;
  }

  deleteNote(fileRelativePath, line) {
    let data = this.getAllNotes();
    if (data[fileRelativePath] && data[fileRelativePath][line]) {
      delete data[fileRelativePath][line];
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
      this.saveToDisk({});
      return true;
    } catch (error) {
      return false;
    }
  }

  saveToDisk(data) {
    fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
  }


// v0.0.6 Update..
  updateFileNotes(filePath, fileNotes) {
    const allNotes = this.getAllNotes();
    if (!fileNotes || Object.keys(fileNotes).length === 0) {
        delete allNotes[filePath];
    } else {
        allNotes[filePath] = fileNotes;
    }
    this.saveToDisk(allNotes);
  }
}

module.exports = StorageManager;
