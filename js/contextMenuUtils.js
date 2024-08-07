// contextMenuUtils.js

// Store reference to the JSON export context menu
const jsonExportContextMenu = document.getElementById('json-export-context-menu');

// Function to close all context menus
export function closeAllContextMenus() {
    if (jsonExportContextMenu) jsonExportContextMenu.style.display = 'none';
}

// Function to show the JSON export context menu
export function showJsonExportContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    closeAllContextMenus();

    const buttonRect = event.target.getBoundingClientRect();
    const menuWidth = 200; // Adjust as needed

    jsonExportContextMenu.style.display = 'block';
    jsonExportContextMenu.style.left = (buttonRect.right - menuWidth) + 'px';
    jsonExportContextMenu.style.top = buttonRect.bottom + 'px';
}

// Function to initialize context menus
export function initializeContextMenus() {
    // Event listener for clicks on the document
    document.addEventListener('click', function (event) {
        // Close all menus if the click is outside any menu
        if (!event.target.closest('#json-export-context-menu') &&
            !event.target.closest('#export-json')) {
            closeAllContextMenus();
        }
    });

    // Event listener for right-clicks (context menu) on the document
    document.addEventListener('contextmenu', function (event) {
        // Close all menus if the right-click is outside any menu or button
        if (!event.target.closest('#json-export-context-menu') &&
            !event.target.closest('#export-json')) {
            closeAllContextMenus();
        }
    });

    // Update the event listener for the JSON export button
    document.getElementById('export-json').addEventListener('contextmenu', showJsonExportContextMenu);
}