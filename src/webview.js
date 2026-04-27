const vscode = require('vscode');

/**
 * Generates the HTML for the Sidebar.
 */
function getSidebarContent(webview, extensionUri, notes) {
    const markedJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'marked.esm.js'));

    // Svg icons
    const ICONS = {
        REFRESH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
        EXPORT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        SEARCH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
        EDIT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        DELETE: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        COPY: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        CHEVRON: `<svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
    };

    // This Generate Content
    const notesListHtml = Object.keys(notes).map(file => {
        const pathParts = file.split(/[\\/]/);
        const fileName = pathParts.pop();
        const folderPath = pathParts.length > 0 ? pathParts.join('/') : 'Project Root';
        const noteCount = Object.keys(notes[file]).length;

        const cardsHtml = Object.keys(notes[file]).map(line => {
            const note = notes[file][line];
            const safeContent = encodeURIComponent(note.content);
            const category = note.category || 'Logic';
            const isOrphan = note.isOrphan === true;
            const catClass = category.toLowerCase().replace(/\s+/g, '-');

            return `
                <article class="note-card ${isOrphan ? 'is-orphan' : ''} cat-border-${catClass}"
                         onclick="openFile('${file}', ${line}, ${isOrphan})"
                         data-category="${category}">

                    <header class="card-header">
                        <div class="card-meta">
                            <span class="badge-line">Ln ${parseInt(line) + 1}</span>
                            <span class="badge-category cat-bg-${catClass}">${category}</span>
                            ${isOrphan ? `<span class="badge-orphan">⚠️ Orphaned</span>` : ''}
                        </div>

                        <div class="card-actions">
                            ${isOrphan ? `
                                <button class="action-icon-btn reanchor" title="Re-anchor" onclick="reanchorNote(event, '${file}', '${line}')">
                                    ${ICONS.REFRESH}
                                </button>` : ''}
                            <button class="action-icon-btn" title="Edit" onclick="editNote(event, '${file}', '${line}')">${ICONS.EDIT}</button>
                            <button class="action-icon-btn delete" title="Delete" onclick="deleteNote(event, \`${file}\`, \`${line}\`)">${ICONS.DELETE}</button>
                            <button class="action-icon-btn" title="Copy Markdown" onclick="copyMarkdown(event, '${file}', '${line}')">${ICONS.COPY}</button>
                        </div>
                    </header>

                    <div class="card-body markdown-body note-content" data-raw="${safeContent}">
                    </div>

                    <footer class="card-footer">
                        <span class="timestamp">${new Date(note.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </footer>
                </article>
            `;
        }).join('');

        return `
            <section class="file-group" data-file="${file}">
                <div class="file-group-header" onclick="toggleGroup(this)">
                    <div class="file-title">
                        ${ICONS.CHEVRON}
                        <span class="folder-prefix">${folderPath}/</span>
                        <span class="file-name">${fileName}</span>
                    </div>
                    <span class="file-count">${noteCount}</span>
                </div>
                <div class="file-group-content">
                    ${cardsHtml}
                </div>
            </section>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
        </head>

  <style>
    :root {
        --premium-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        --accent: var(--vscode-button-background, #9B72FF);
        --card-bg: var(--vscode-editor-background);
        --sidebar-bg: var(--vscode-sideBar-background);
        --border: var(--vscode-widget-border, rgba(128, 128, 128, 0.15));
        --border-light: rgba(128, 128, 128, 0.08);
        --text-main: var(--vscode-foreground);
        --text-muted: var(--vscode-descriptionForeground);
        --radius-sm: 6px;
        --radius-md: 8px;
        --radius-lg: 12px;
        --transition-fast: 0.15s ease-out;
        --transition-smooth: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    body {
        padding: 0;
        margin: 0;
        color: var(--text-main);
        font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: var(--sidebar-bg);
        font-size: var(--vscode-font-size, 13px);
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-background);
        border-radius: 10px;
        border: 2px solid var(--sidebar-bg); /* Faux padding */
    }
    ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
    ::-webkit-scrollbar-thumb:active { background: var(--vscode-scrollbarSlider-activeBackground); }

    .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .main-header {
        position: sticky;
        top: 0;
        z-index: 100;
        /* Premium Glass Effect */
        background: color-mix(in srgb, var(--sidebar-bg) 85%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .scrollable-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .title-row h1 {
        margin: 0;
        font-size: 22px;
        text-transform: uppercase;
        letter-spacing: .8px;
        color: var(--text-muted);
        font-weight: 800;
    }

    .global-actions, .controls-row {
        display: flex;
        gap: 8px;
    }

    .controls-row { margin-top: 2px; }

    .search-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
    }

    .search-wrapper svg {
        position: absolute;
        left: 10px;
        color: var(--text-muted);
        pointer-events: none;
        transition: var(--transition-fast);
    }

    #search-bar {
        width: 100%;
        padding: 10px 12px 10px 32px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 13px;
        transition: var(--transition-smooth);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
    }

    #search-bar:focus {
        outline: none;
        border-color: #9B72FF;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent);
    }

    /* #search-bar:focus + svg { color: var(--vscode-focusBorder); */
    #search-bar:focus + svg { color: #9B72FF; }

    .filter-wrapper select {
        padding: 10px 28px 10px 10px;
        background: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 13px;
        cursor: pointer;
        transition: var(--transition-smooth);
        appearance: none; /* Custom arrow fallback */
        background-image: url('data:image/svg+xml;utf8,<svg fill="gray" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
        background-repeat: no-repeat;
        background-position-x: 100%;
        background-position-y: center;
    }

    .filter-wrapper select:focus {
        outline: none;
        border-color: #9B72FF;
    }

    .stats-overview {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-top: 12px;
        border-top: 1px dashed var(--border);
    }

    .stat-main {
        text-align: center;
        padding-right: 16px;
        border-right: 1px solid var(--border);
    }

    #stat-total {
        font-size: 25px;
        font-weight: 800;
        color #9B72FF;
        display: block;
        line-height: 1;
    }
    .stat-main label { font-size: 9px; text-transform: uppercase; font-weight: 600; opacity: 0.6; letter-spacing: 0.5px; }

    .stat-pills {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none; /* Firefox */
    }
    .stat-pills::-webkit-scrollbar { display: none; }

    .stat-pill {
        white-space: nowrap;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        background: color-mix(in srgb, var(--text-main) 5%, transparent);
        border: 1px solid var(--border-light);
        transition: var(--transition-smooth);
    }
    .stat-pill strong { font-weight: 700; opacity: 0.9; margin-right: 2px; }
    .stat-pill:hover {
        border-color: #9B72FF;
        background: color-mix(in srgb, var(--vscode-focusBorder) 10%, transparent);
    }

    .file-group {
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
         overflow:visible;
        background: var(--sidebar-bg);
        transition: var(--transition-smooth);
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .file-group:hover { border-color: color-mix(in srgb, var(--border) 80%, var(--text-main)); }

    .file-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        cursor: pointer;
        background: color-mix(in srgb, var(--vscode-sideBarSectionHeader-background) 50%, transparent);
        transition: var(--transition-fast);
        user-select: none;
    }

    .file-group-header:hover { background: var(--vscode-list-hoverBackground); }
    .file-group-header:active { background: var(--vscode-list-activeSelectionBackground); }

    .file-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
    .chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(90deg); opacity: 0.5; }
    .collapsed .chevron { transform: rotate(0deg); }
    .collapsed .file-group-content { display: none; }

    .folder-prefix { opacity: 0.4; font-weight: 400; }
    .file-count {
        font-size: 10px;
        font-weight: 700;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 8px;
        border-radius: 12px;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    }

    .file-group-content { padding: 4px; display: flex; flex-direction: column; gap: 4px;  }

    .note-card {
        background: var(--card-bg);
        border-radius: var(--radius-sm);
        padding: 14px;
        position: relative;
        transition: var(--transition-smooth);
        border: 1px solid transparent;
        animation: fadeUp 0.4s ease-out forwards;
    }

    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .note-card:hover {
        background: color-mix(in srgb, var(--card-bg) 95%, var(--text-main));
        border-color: var(--border);
        box-shadow: var(--hover-shadow);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .card-meta { display: flex; align-items: center; gap: 8px; }

    .badge-line { font-size: 10px; font-family: monospace; font-weight: 600; opacity: 0.6; }

    .badge-category {
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 2px 8px;
        border-radius: 4px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
    }

    .card-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transform: translateX(5px);
        transition: var(--transition-smooth);
    }

    .note-card:hover .card-actions { opacity: 1; transform: translateX(0); }

    .action-icon-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition-fast);
    }

    .action-icon-btn:hover { background: color-mix(in srgb, var(--text-main) 10%, transparent); color: var(--text-main); transform: scale(1.05); }
    .action-icon-btn:active { transform: scale(0.95); }
    .action-icon-btn.delete:hover { color: #f14c4c; background: rgba(241,76,76,0.15); }

    .cat-bg-logic { background: color-mix(in srgb, gray 20%, transparent); color: #a9a9a9; }
    .cat-bg-bug-fix { background: color-mix(in srgb, #f14c4c 20%, transparent); color: #f14c4c; }
    .cat-bg-warning { background: color-mix(in srgb, #cca700 20%, transparent); color: #cca700; }
    .cat-bg-todo { background: color-mix(in srgb, #3794ff 20%, transparent); color: #3794ff; }
    .cat-bg-optimization { background: color-mix(in srgb, #73c991 20%, transparent); color: #73c991; }

    .cat-border-logic { border-left: 3px solid gray; }
    .cat-border-bug-fix { border-left: 3px solid #f14c4c; }
    .cat-border-warning { border-left: 3px solid #cca700; }
    .cat-border-todo { border-left: 3px solid #3794ff; }
    .cat-border-optimization { border-left: 3px solid #73c991; }

    .card-body {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        margin-bottom: 12px;
        line-height: 1.6;
    }

    .card-body pre { background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; overflow-x: auto; }
    .card-body code { font-family: var(--vscode-editor-font-family); font-size: 0.9em; background: rgba(128,128,128,0.1); padding: 2px 4px; border-radius: 3px; }
    .card-body p { margin-top: 0; margin-bottom: 8px; }
    .card-body p:last-child { margin-bottom: 0; }
    .card-body mark { background: var(--vscode-editor-findMatchHighlightBackground); color: inherit; border-radius: 2px; padding: 0 2px; }

    .card-footer { display: flex; justify-content: flex-end; border-top: 1px solid var(--border-light); padding-top: 8px; }
    .timestamp { font-size: 10px; color: var(--text-muted); font-weight: 500; }

    .note-card.is-orphan {
        background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(241,76,76,0.03) 10px, rgba(241,76,76,0.03) 20px), var(--card-bg);
        border: 1px dashed rgba(241,76,76,0.3);
    }
    .badge-orphan { background: #f14c4c; color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(241,76,76,0.3); }

    #toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .toast {
        background: var(--vscode-notifications-background, #2d2d2d);
        color: var(--vscode-notifications-foreground, #eee);
        padding: 12px 20px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        box-shadow: var(--premium-shadow);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 500;
        animation: slideInBottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; /* Bouncy entry */
    }
    .toast.fade-out { animation: fadeOutRight 0.3s ease-in forwards; }

    @keyframes slideInBottom {
        0% { transform: translateY(20px) scale(0.9); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes fadeOutRight {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(30px); opacity: 0; }
    }

    .btn-primary {
        background:#9B72FF;
        color: var(--vscode-button-foreground);
        padding: 6px 14px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 600;
        transition: var(--transition-fast);
    }

    .btn-primary:hover {
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .btn-primary:active { transform: translateY(0); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

    .btn-icon-round {
        background: var(--card-bg);
        border: 1px solid var(--border);
        color: var(--text-main);
        cursor: pointer;
        padding: 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition-smooth);
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .btn-icon-round:hover {
        background: var(--vscode-toolbar-hoverBackground);
        border-color: var(--text-muted);
        transform: rotate(15deg) scale(1.05);
    }
    .btn-icon-round:active { transform: rotate(0deg) scale(0.95); }
    .empty-placeholder {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
        border: 2px dashed var(--border);
        border-radius: var(--radius-lg);
        margin: 20px auto;
        max-width: 80%;
        background: color-mix(in srgb, var(--sidebar-bg) 50%, transparent);
        position:relative;
        bottom:27%;
    }
</style>
        <body>
            <div id="toast-container"></div>

            <main class="container">
                <header class="main-header">
                    <div class="title-row">
                        <h1>Insight Registry</h1>
                        <div class="global-actions">
                            <button class="btn-icon-round" id="refresh-btn" title="Sync Workspace">${ICONS.REFRESH}</button>
                            <button class="btn-primary" onclick="exportData()">${ICONS.EXPORT} Export JSON</button>
                        </div>
                    </div>

                    <div class="controls-row">
                        <div class="search-wrapper">
                            ${ICONS.SEARCH}
                            <input type="text" id="search-bar" placeholder="Search insights...">
                        </div>
                        <div class="filter-wrapper">
                            <select id="categoryFilter">
                                <option value="all">All Types</option>
                                <option value="Logic">Logic</option>
                                <option value="Bug Fix">Bug Fix</option>
                                <option value="Warning">Warning</option>
                                <option value="TODO">TODO</option>
                                <option value="Optimization">Optimization</option>
                            </select>
                        </div>
                    </div>

                    <div class="stats-overview" id="stats-container">
                        <div class="stat-main">
                            <span id="stat-total">0</span>
                            <label>Total Insights</label>
                        </div>
                        <div id="category-stats-pills" class="stat-pills"></div>
                    </div>
                </header>

                <div id="notes-container" class="scrollable-content">
                    ${notesListHtml}
                </div>

                <div id="empty-state" class="empty-placeholder" style="display:none">
                    <p id="empty-state-text">"You haven't added any insights yet!</p>
                </div>
            </main>

            <script type="module">
                import { marked } from '${markedJsUri}';
                const vscode = acquireVsCodeApi();

                // UI Helpers
                function removeToast(el) {
                    el.classList.add('fade-out');
                    const forceRemove = setTimeout(() => {
                        if (el.parentNode) el.remove();
                    }, 500);

                    el.addEventListener('transitionend', () => {
                        clearTimeout(forceRemove);
                        if (el.parentNode) el.remove();
                    }, { once: true });
                }

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
                };

                // Core Actions
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
                    event.stopPropagation();
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

                        if (!contentEl) return;

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
                        }
                           else {
                            emptyText.innerText = "You haven't added any insights yet!";
                        }
                    }
                };

                // Event Listeners
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
                                const safeName = name.toLowerCase().replace(/\\s+/g, '-');

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

                // UI Interections
                // v0.0.6 (group)
                window.toggleGroup = (headerElement) => {
                    const group = headerElement.parentElement;
                    group.classList.toggle('collapsed');
                };

                // Intialization..
                // Run once on load
                renderMarkdown();
                window.filterNotes();

                // Moved from toggleGroup to run exactly once on Webview startup
                vscode.postMessage({ command: 'init' });

                // Attach DOM listeners
                const sBar = document.getElementById('search-bar');
                if (sBar) sBar.addEventListener('input', window.filterNotes);

                const cFilter = document.getElementById('categoryFilter');
                if (cFilter) cFilter.addEventListener('change', window.filterNotes);

                const refreshBtn = document.getElementById('refresh-btn');
                if (refreshBtn) refreshBtn.onclick = () => vscode.postMessage({ command: 'refresh' });

                const clearBtn = document.getElementById('clear-all-btn');
                if (clearBtn) clearBtn.onclick = () => vscode.postMessage({ command: 'clearAll' });

            </script>
        </body>
        </html>
    `;
}

module.exports = { getSidebarContent };
