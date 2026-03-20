const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * v0.0.6 - Navigator & Documenter Update
 */
function navigateInsights(storage, direction) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const filePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const fileNotes = storage.getAllNotes()[filePath];

    if (!fileNotes) return;
    // Filter out lines that are marked as orphans so we don't jump to empty space
    const lines = Object.keys(fileNotes)
        .map(l => parseInt(l))
        .filter(l => !fileNotes[l.toString()].isOrphan)
        .sort((a, b) => a - b);

    if (lines.length === 0) {
        vscode.window.setStatusBarMessage("No active Logic Anchors in this file", 3000);
        return;
    }

    const currentLine = editor.selection.active.line;
    let target;

    if (direction === 'next') {
        target = lines.find(l => l > currentLine) ?? lines[0];
    } else {
        target = [...lines].reverse().find(l => l < currentLine) ?? lines[lines.length - 1];
    }

    const pos = new vscode.Position(target, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);

    // Quick feedback in the status bar
    const category = fileNotes[target.toString()].category || 'Insight';
    vscode.window.setStatusBarMessage(`Jumped to [${category}]`, 2000);
}

// Export Workspace Logic to Markdown
async function generateLogicMap(storage, rootPath) {
    // Start a progress notification
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "LogicAnchor",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Compiling project insights..." });

        const allNotes = storage.getAllNotes();
        const files = Object.keys(allNotes);

        if (files.length === 0) {
            vscode.window.showWarningMessage("No insights found to generate a map.");
            return;
        }

        let markdown = `# LogicAnchor: Project Knowledge Map\n\n`;
        markdown += `Generated: ${new Date().toLocaleString()}\n\n---\n\n`;

        files.forEach(file => {
            const notes = allNotes[file];
            const activeLines = Object.keys(notes).filter(l => !notes[l].isOrphan);

            if (activeLines.length > 0) {
                markdown += `### 📄 ${file}\n`;
                activeLines.sort((a, b) => parseInt(a) - parseInt(b)).forEach(line => {
                    const n = notes[line];
                    markdown += `- **Line ${parseInt(line) + 1}** _(${n.category})_: ${n.content}\n`;
                });
                markdown += `\n`;
            }
        });

        try {
            const fileName = 'LOGIC_MAP.md';
            const exportPath = path.join(rootPath, fileName);
            fs.writeFileSync(exportPath, markdown, 'utf8');

            //  Toast with an Action Button
            const selection = await vscode.window.showInformationMessage(
                `✅ Logic Map created: ${fileName}`,
                "Open File"
            );

            if (selection === "Open File") {
                const doc = await vscode.workspace.openTextDocument(exportPath);
                await vscode.window.showTextDocument(doc);
            }
        } catch (err) {
            vscode.window.showErrorMessage("Failed to generate Logic Map: " + err.message);
        }
    });
}
// Shows coverage info
let statusBarItem;
let pulseTimer;
let lastActiveCount = -1; // Keep track of the previous count

function updateStatusBarPulse(storage) {
    if (!statusBarItem) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'logicAnchorView.focus';
    }

    const allNotes = storage.getAllNotes();
    let totalActive = 0;
    let activeFileCount = 0;

    Object.keys(allNotes).forEach(file => {
        const activeInFile = Object.values(allNotes[file]).filter(n => !n.isOrphan).length;
        if (activeInFile > 0) {
            totalActive += activeInFile;
            activeFileCount++;
        }
    });

    // Only trigger the 2-second pulse if the count is DIFFERENT than before
    if (totalActive > 0 && totalActive !== lastActiveCount) {
        lastActiveCount = totalActive; // Update the record

        if (pulseTimer) clearTimeout(pulseTimer);

        statusBarItem.text = `$(pin) ${totalActive} Anchors (${activeFileCount} Files)`;
        statusBarItem.tooltip = "Click to open LogicAnchor Sidebar";
        statusBarItem.show();

        pulseTimer = setTimeout(() => {
            statusBarItem.hide();
        }, 2000);

    } else if (totalActive === 0) {
        // If there are zero anchors, hide immediately and reset tracker
        lastActiveCount = 0;
        if (pulseTimer) clearTimeout(pulseTimer);
        statusBarItem.hide();
    }
}

/**
 *  Health Check & Map
 */
// Scans open files and compares them to your anchors
async function showProjectHealth(storage) {
    // Show a loading state so the user knows a scan is happening
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "LogicAnchor: Assessing Project Health...",
        cancellable: false
    }, async (progress) => {
        const allNotes = storage.getAllNotes();

        // 2. Expanded file support (Web, Systems, and Mobile)
        const workspaceFiles = await vscode.workspace.findFiles(
            '**/*.{js,ts,jsx,tsx,py,cpp,c,h,java,cs,php,go,rb,rs,swift,kt}',
            '**/node_modules/**'
        );

        const documentedFiles = Object.keys(allNotes).filter(f => {
            const fileNotes = allNotes[f];
            return fileNotes && Object.values(fileNotes).some(n => !n.isOrphan);
        });

        const total = workspaceFiles.length;
        const covered = documentedFiles.length;
        // Calculate the Coverage Percentage:
        // $\text{Coverage} = \left( \frac{\text{covered}}{\text{total}} \right) \times 100$
        const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;

        const message = `📊 Logic Coverage: ${percentage}% (${covered}/${total} files documented)`;

        // Quick Status Bar feedback
        vscode.window.setStatusBarMessage(message, 6000);
        if (total === 0) {
            vscode.window.showInformationMessage("No supported code files found in this workspace.");
            return;
        }

        // Interactive Response
        const actionBtn = "View Logic Map";
        let selection;

        if (percentage < 50) {
            selection = await vscode.window.showWarningMessage(
                `${message}. Your documentation density is low—future you might be confused!`,
                actionBtn
            );
        } else if (percentage < 100) {
            selection = await vscode.window.showInformationMessage(
                `${message}. Solid progress! Keep anchoring that logic.`,
                actionBtn
            );
        } else {
            selection = await vscode.window.showInformationMessage(
                `🏆 100% Coverage! Every file is logically anchored. Legend status achieved.`,
                actionBtn
            );
        }

        // 5. If they click the button, trigger the Map generation automatically
        if (selection === actionBtn) {
            vscode.commands.executeCommand('logicanchor.generateMap');
        }
    });
}

// ORPHAN CLEANUP
// A "Garbage Collector" to delete notes that have been orphans for too long
   async function cleanupOrphans(storage) {
    const allNotes = storage.getAllNotes();
    let orphanCount = 0;

    // Counting how many orphans exist first
    Object.keys(allNotes).forEach(file => {
        const fileNotes = allNotes[file];
        Object.keys(fileNotes).forEach(line => {
            if (fileNotes[line].isOrphan === true) orphanCount++;
        });
    });

    if (orphanCount === 0) {
        vscode.window.setStatusBarMessage("✨ No orphans found to clean.", 3000);
        return;
    }

    // Show Confirmation Dialog
    const choice = await vscode.window.showWarningMessage(
        `Found ${orphanCount} orphaned anchors. This will permanently delete them. Continue?`,
        { modal: true }, // This makes it a popup they can't ignore
        "Delete All Orphans"
    );

    if (choice === "Delete All Orphans") {
        let deletedCount = 0;
        const allNotes = storage.getAllNotes();

        // Perform the deletion
        Object.keys(allNotes).forEach(file => {
            const fileNotes = allNotes[file];
            Object.keys(fileNotes).forEach(line => {
                if (fileNotes[line].isOrphan === true) {
                    delete fileNotes[line];
                    deletedCount++;
                }
            });

            // Clean up the file entry if it's now empty
            if (Object.keys(allNotes[file]).length === 0) {
                delete allNotes[file];
            }
        });

        // Save to Disk using your StorageManager method
         storage.saveToDisk(allNotes);

        // Tell the Sidebar to refresh
        vscode.commands.executeCommand('logicanchor.refreshSidebar');

        vscode.window.showInformationMessage(`🧹 Successfully removed ${deletedCount} orphaned anchors.`);

    }
}

/**
 * Checks for orphans and updates the Status Bar with a warning pulse if found.
 */
function updateOrphanAlert(storage) {
    const allNotes = storage.getAllNotes();
    let orphanCount = 0;

    Object.values(allNotes).forEach(fileNotes => {
        Object.values(fileNotes).forEach(note => {
            if (note.isOrphan) orphanCount++;
        });
    });

    if (orphanCount > 0) {
        // Show a persistent warning in the status bar
        vscode.window.setStatusBarMessage(
            `$(warning) LogicAnchor: ${orphanCount} orphans detected! Click the broom to clean.`,
            10000 // Show for 10 seconds
        );
    }
}
module.exports = {
    navigateInsights,
    generateLogicMap,
    updateStatusBarPulse ,
    showProjectHealth ,
    cleanupOrphans ,
    updateOrphanAlert
};
