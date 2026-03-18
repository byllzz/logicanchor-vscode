const vscode = require('vscode');

/**
 * Generates the HTML for the Sidebar.
 * @param {import('vscode').Webview} webview
 * @param {import('vscode').Uri} extensionUri
 * @param {Object} notes - The notes data from storage.js
 */
function getSidebarContent(webview, extensionUri, notes) {
    const markedJsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'resources', 'marked.esm.js')
    );

    const notesListHtml = Object.keys(notes).map(file => {
        return Object.keys(notes[file]).map(line => {
            const note = notes[file][line];
            const safeContent = encodeURIComponent(note.content);
            const fileName = file.split('/').pop();

            // 0.0.2 - Support for Categories
            const category = note.category || 'Logic';
            // const catClass = `cat-${category.toLowerCase().replace(' ', '-')}`;

            // 0.0.3 - Orphan Status Check
            const isOrphan = note.isOrphan === true;
            const orphanClass = isOrphan ? 'orphan' : '';
            const orphanBadge = isOrphan ? `<span class="orphan-badge">⚠️ Orphaned</span>` : '';

            // Re-anchor button (only shows if orphaned)
            const reanchorBtn = isOrphan
              ? `
                <button class="icon-btn" title="Re-anchor to current cursor line" onclick="reanchorNote(event, '${file}', '${line}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </button>
            `
              : '';


              // v0.0.5 feature(to hightlight card with exact cat color)
              const catClass = (note.category || 'Logic').toLowerCase().replace(/\s+/g, '-');
            return `
               <div class="note-card ${orphanClass} ${catClass}"
      onclick="openFile('${file}', ${line}, ${isOrphan})"
      data-category="${note.category || 'Logic'}">
                    <div class="note-header">
                        <div class="header-left">
                            <div class="file-info">
                                <div class="icon-wrapper">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                </div>
                                <span class="file-name">${fileName}</span>
                                <span class="line-badge">Ln ${parseInt(line) + 1}</span>
                                <!--<span class="cat-badge ${catClass}">${category}</span> -->
                             <span class="cat-badge cat-${category.toLowerCase().replace(/\s+/g, '-')}" data-category="${category}">
    ${category}
</span>
                                ${orphanBadge}
                            </div>
                            <span class="time-stamp">${new Date(note.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                       <div class="header-right">
    ${reanchorBtn}

    <button class="icon-btn edit" title="Edit Insight" onclick="editNote(event, '${file}', '${line}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    </button>

    <button class="icon-btn delete" title="Remove Insight" onclick="deleteNote(event, \`${file}\`, \`${line}\`)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
    </button>


<button class="icon-btn copy" title="Copy Markdown" onclick="copyMarkdown(event, '${file}', '${line}')">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
</button>
</div>
                    </div>
                   <div class="note-content markdown-body" data-raw="${safeContent}">
                    </div>


                </div>
            `;
        }).join('');
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
            <style>
                :root {
                    --premium-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                    --glass-bg: var(--vscode-sideBar-background);
                    --card-bg: var(--vscode-editor-background);
                    --card-border: var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
                    --accent: #9B72FF;
                    --text-main: var(--vscode-foreground);
                    --text-muted: var(--vscode-descriptionForeground);
                    --success-bg: #28a745;
                    --error-bg: #ea4335;
                }

                body {
                    padding: 0;
                    margin: 0;
                    color: var(--text-main);
                    font-family: var(--vscode-font-family);
                    background-color: var(--glass-bg);
                    overflow-x: hidden;
                }

                /* --- Header Styling --- */
                .header-container {
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    background: var(--glass-bg);
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--card-border);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .action-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .action-bar h3 {
                    margin: 0;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                }

                .action-buttons {
                    display: flex;
                    gap: 4px;
                }

                /* --- Toast Notification Styling --- */
                #toast-container {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: calc(100% - 32px);
                    max-width: 300px;
                    pointer-events: none;
                }

                .toast {
                    padding: 12px 16px;
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.25);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    pointer-events: auto;
                }

                .toast.success { background: var(--success-bg); }
                .toast.error { background: var(--error-bg); }
                .toast.warning { background: #f1c40f; color: #000; }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .toast.fade-out {
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                }

                /* --- Search & Input --- */
                .search-input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                #search-bar {
                    width: 100%;
                    padding: 6px 32px 6px 10px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border, transparent);
                    border-radius: 4px;
                    font-size: 12px;
                    outline: none;
                }

                #search-bar:focus {
                    border-color: var(--accent);
                }

                .search-icon {
                    position: absolute;
                    right: 10px;
                    color: var(--text-muted);
                    pointer-events: none;
                }

                /* --- Note Card Styling --- */
                #notes-container {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .note-card {
                    background: var(--card-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 6px;
                    padding: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .note-card:hover {
                    border-color: var(--accent);
                    box-shadow: var(--premium-shadow);
                    transform: translateY(-1px);
                }

                .note-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }

                .header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap; /* Helps if filename is long */
                }

                .icon-wrapper {
                    color: var(--vscode-symbolIcon-fileForeground, var(--text-muted));
                    display: flex;
                    align-items: center;
                }

                .file-name {
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--vscode-editor-foreground);
                }

                .line-badge {
                    font-size: 10px;
                    font-weight: 600;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 6px;
                    border-radius: 10px;
                }

                /* 0.0.2 - (Category Badge Styles updates for v0.0.5) */
                .cat-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 5px; /* Slightly tighter padding for a pro look */
    border-radius: 3px;
    border: 1px solid currentColor;
    display: inline-block;
    line-height: 1.2;
    transition: opacity 0.2s;
}

.cat-badge:hover {
    opacity: 1; /* Pops slightly when hovering over the card */
}

/* Logic - Neutral Gray */
.cat-logic {
    color: var(--vscode-descriptionForeground);
    background: rgba(128, 128, 128, 0.1);
}

/* Bug Fix - Red */
.cat-bug-fix {
    color: var(--vscode-testing-iconFailed, #f14c4c);
    background: rgba(241, 76, 76, 0.1);
}

/* Warning - Amber/Yellow */
.cat-warning {
    color: var(--vscode-problemsWarningIcon-foreground, #cca700);
    background: rgba(204, 167, 0, 0.1);
}

/* TODO - Blue */
.cat-todo {
    color: var(--vscode-textLink-foreground, #3794ff);
    background: rgba(55, 148, 255, 0.1);
}

/* Optimization - Green */
.cat-optimization {
    color: var(--vscode-testing-iconPassed, #73c991);
    background: rgba(115, 201, 145, 0.1);
}

                .time-stamp {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .header-right {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    display: flex;
                    gap: 4px;
                }

                .note-card:hover .header-right {
                    opacity: 1;
                }

                .icon-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-btn:hover {
                    background: var(--vscode-toolbar-hoverBackground);
                    color: var(--text-main);
                }

                .icon-btn.delete:hover {
                    color: var(--vscode-errorForeground);
                    background: color-mix(in srgb, var(--vscode-errorForeground) 15%, transparent);
                }

                .icon-btn.edit:hover {
    color: var(--vscode-textLink-foreground);
    background: color-mix(in srgb, var(--vscode-textLink-foreground) 15%, transparent);
}
                .note-content {
                    font-size: 13px;
                    line-height: 1.5;
                    color: var(--vscode-editor-foreground);
                    opacity: 0.9;
                }

                .empty-state {
                    text-align: center;
                    margin-top: 40px;
                    color: var(--text-muted);
                    font-size: 13px;
                }

                .note-card.orphan {
                    border-left: 4px solid #9B72FF; /* Warning light purle */
                    opacity: 0.8;
                }

                .orphan-badge {
                    background:red;
                    color: #fff;
                    font-size: 10px;
                    padding: 4px 5px;
                    border-radius: 12px;
                    margin-left: 5px;
                }

                .export-btn {
    width: 100%;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 10px;
    border-radius: 2px;
}

.export-btn:hover {
    background: var(--vscode-button-hoverBackground);
}


.filter-container {
    padding: 10px;
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 10px;
}

#categoryFilter {
    width: 100%;
    background: var(--vscode-dropdown-background);
    color: var(--vscode-dropdown-foreground);
    border: 1px solid var(--vscode-dropdown-border);
    padding: 4px;
    outline: none;
}

#categoryFilter:focus {
    border-color: var(--vscode-focusBorder);
}

#empty-state-text{
color: var(--vscode-dropdown-foreground);
}


.stats-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    overflow-x: auto;
}

.stat-item.total {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-right: 1px solid var(--vscode-panel-border);
    padding-right: 12px;
}

.stat-count {
    font-size: 18px;
    font-weight: bold;
    color: var(--vscode-button-background);
}

.stat-label {
    font-size: 9px;
    text-transform: uppercase;
    opacity: 0.7;
}

.category-pills {
    display: flex;
    gap: 6px;
}

.stat-pill {
    white-space: nowrap;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    cursor: pointer;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border: 1px solid transparent;
}

.stat-pill:hover {
    border-color: var(--vscode-focusBorder);
}

/* Match your existing category colors */
.stat-pill.bug-fix { color: var(--vscode-testing-iconFailed); }
.stat-pill.todo { color: var(--vscode-textLink-foreground); }
mark {
    background: var(--vscode-editor-findMatchHighlightBackground, #e5a50a);
    color: var(--vscode-editor-findMatchHighlightForeground, black);
    border-radius: 2px;
    padding: 0 1px;
}

.note-card.logic { border-left: 4px solid var(--vscode-debugIcon-breakpointForeground); }
.note-card.bug-fix { border-left: 4px solid var(--vscode-errorForeground); }
.note-card.warning { border-left: 4px solid var(--vscode-editorWarning-foreground); }
.note-card.todo { border-left: 4px solid var(--vscode-textLink-foreground); }
.note-card.optimization { border-left: 4px solid var(--vscode-debugIcon-startForeground); }

.stat-pill.logic { background: rgba(231, 76, 60, 0.1); color: var(--vscode-debugIcon-breakpointForeground); }
.stat-pill.bug-fix { background: rgba(241, 144, 144, 0.1); color: var(--vscode-errorForeground); }

            </style>
        </head>
          <body>
            <div id="toast-container"></div>



            <div class="header-container">
                <div class="action-bar">
                    <h3>Insight Registry</h3>
                    <div class="action-buttons">
                        <button class="icon-btn" id="refresh-btn" title="Sync Workspace">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </button>
                        <!--
                        <button class="icon-btn" id="clear-all-btn" title="Clear All Insights">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        -->
                        <button class="export-btn" onclick="exportData()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Export JSON
    </button>
                    </div>
                </div>
                <div class="search-input-group">
                    <input type="text" id="search-bar" placeholder="Filter insights...">
                    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>



            <!-- v0.0.5 categories filter -->
            <div class="filter-container">
    <select id="categoryFilter" onchange="filterNotes()">
        <option value="all">All Categories</option>
        <option value="Logic">Logic</option>
        <option value="Bug Fix">Bug Fix</option>
        <option value="Warning">Warning</option>
        <option value="TODO">TODO</option>
        <option value="Optimization">Optimization</option>
    </select>
</div>

<div class="stats-bar" id="stats-container">
    <div class="stat-item total">
        <span class="stat-count" id="stat-total">0</span>
        <span class="stat-label">Total Insights</span>
    </div>
    <div id="category-stats-pills" class="category-pills"></div>
</div>


            <div id="notes-container">
                ${notesListHtml}
            </div>
            <div id="empty-state" style="display: none; padding: 20px; text-align: center; font-style:italic; opacity: 0.7;"><p id="empty-state-text">No insights found in this category.</p></div>
</div>

<script type="module">
    import { marked } from '${markedJsUri}';
    const vscode = acquireVsCodeApi();

    // --- UI HELPERS ---

    window.showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.className = 'toast ' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (icons[type] || '') + '</span>' +
            '<span class="toast-message">' + message + '</span>';

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        const timer = setTimeout(() => removeToast(toast), 3000);

        toast.onclick = () => {
            clearTimeout(timer);
            removeToast(toast);
        };

    function removeToast(el) {
    el.classList.add('fade-out');
    const forceRemove = setTimeout(() => {
        if (el.parentNode) el.remove();
    }, 500);

    el.addEventListener('transitionend', () => {
        clearTimeout(forceRemove); // Clear the fallback if CSS worked
        el.remove();
    }, { once: true });
}
    };

    // Core Actions.
    window.editNote = (event, file, line) => {
        event.preventDefault();
        event.stopPropagation();
        vscode.postMessage({ command: 'editNote', file: file, line: line });
    };

    window.openFile = (file, line, isOrphan) => {
        if (isOrphan) {
            window.showToast("Note is orphaned. Use the re-anchor button to fix it.", "warning");
        }
        vscode.postMessage({ command: 'openFile', file: file, line: line });
    };

  window.deleteNote = (event, file, line) => {
        event.preventDefault();
        event.stopPropagation(); // Prevents openFile from firing
        vscode.postMessage({ command: 'deleteNote', file: file, line: line });
    };

    window.reanchorNote = (event, file, oldLine) => {
        event.preventDefault();
        event.stopPropagation();
        vscode.postMessage({ command: 'reanchorNote', file: file, oldLine: oldLine });
    };

    window.exportData = () => {
        vscode.postMessage({ command: "exportJson" });
    };

    window.copyMarkdown = (event, file, line) => {
        event.preventDefault();
        event.stopPropagation();
        vscode.postMessage({ command: 'copyMarkdown', file: file, line: line });
    };

    // Filter & Search Logic
window.filterNotes = () => {
    const filterSelect = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('search-bar');
    const emptyState = document.getElementById('empty-state');
    const emptyText = document.getElementById('empty-state-text');

    if (!filterSelect || !emptyState || !emptyText) return;

    const filterValue = filterSelect.value;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('.note-card');

    let visibleCount = 0;

    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        const contentEl = card.querySelector('.note-content');

        const rawData = contentEl.getAttribute('data-raw');
        if (!rawData) return;

        const decodedContent = decodeURIComponent(rawData);
        const searchTarget = decodedContent.toLowerCase();

        const matchesFilter = (filterValue === 'all' || cardCategory.trim() === filterValue.trim());
        const matchesSearch = searchTarget.includes(searchTerm);

        if (matchesFilter && matchesSearch) {
            card.style.display = 'block';
            visibleCount++;

            let htmlResult = marked.parse(decodedContent);

           if (searchTerm !== '') {

                const escapedTerm = searchTerm.replace(/[.*+?^$|()\[\]\\]/g, '\\$&');
                const regex = new RegExp('(' + escapedTerm + ')', 'gi');
                htmlResult = htmlResult.replace(regex, '<mark>$1</mark>');
            }

            contentEl.innerHTML = htmlResult;
        } else {
            card.style.display = 'none';
        }
    });

    // Empty State
    emptyState.style.display = (visibleCount === 0) ? 'block' : 'none';
    if (visibleCount === 0) {
        if (searchTerm) {
            emptyText.innerText = 'No results matching "' + searchTerm + '"';
        } else if (filterValue !== 'all') {
            emptyText.innerText = 'No insights found for "' + filterValue + '".';
        } else {
            emptyText.innerText = "You haven't added any insights yet!";
        }
    }
};

    // Initialization..
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'showToast':
            window.showToast(message.text, message.type);
            break;

        case 'onRefresh':
            renderMarkdown();
            window.filterNotes();
            break;

        case 'updateStats':
            updateStatsUI(message.stats);
            break;
    }
});

function updateStatsUI(stats) {
    const totalEl = document.getElementById('stat-total');
    const pillContainer = document.getElementById('category-stats-pills');

    if (!totalEl || !pillContainer) return;
    totalEl.innerText = stats.total || 0;
    pillContainer.innerHTML = '';

    if (stats.categories) {
        Object.entries(stats.categories).forEach(([name, count]) => {
            if (count > 0) {
                const pill = document.createElement('div');
                const safeName = name.toLowerCase().replace(/\s+/g, '-');

                pill.className = 'stat-pill ' + safeName;
                pill.innerHTML = '<strong>' + count + '</strong> ' + name;
                pill.onclick = () => {
                    const filterDropdown = document.getElementById('categoryFilter');
                    if (filterDropdown) {
                        filterDropdown.value = name;
                        window.filterNotes();
                    }
                };

                pillContainer.appendChild(pill);
            }
        });
    }
}

    function renderMarkdown() {
        document.querySelectorAll('.note-content').forEach(el => {
            const rawData = el.getAttribute('data-raw');
            if (rawData) {
                el.innerHTML = marked.parse(decodeURIComponent(rawData));
            }
        });
    }

    // Run once on load
    renderMarkdown();
    window.filterNotes();

    // Attach listeners
    const sBar = document.getElementById('search-bar');
    if (sBar) sBar.addEventListener('input', window.filterNotes);

    const cFilter = document.getElementById('categoryFilter');
    if (cFilter) cFilter.addEventListener('change', window.filterNotes);

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.onclick = () => vscode.postMessage({ command: 'refresh' });

    const clearBtn = document.getElementById('clear-all-btn');
    if (clearBtn) clearBtn.onclick = () => vscode.postMessage({ command: 'clearAll' });

    vscode.postMessage({ command: 'init' });
</script>
        </body>
        </html>
    `;
}

module.exports = { getSidebarContent };
