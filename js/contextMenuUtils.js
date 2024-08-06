// contextMenuUtils.js

// Store references to the context menus
const cameraContextMenu = document.getElementById('camera-context-menu');
const jsonExportContextMenu = document.getElementById('json-export-context-menu');

// Function to close all context menus
export function closeAllContextMenus() {
    if (cameraContextMenu) cameraContextMenu.style.display = 'none';
    if (jsonExportContextMenu) jsonExportContextMenu.style.display = 'none';
}

// Function to show the camera context menu
export function showCameraContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    closeAllContextMenus();

    const buttonRect = event.target.getBoundingClientRect();
    const menuWidth = 150; // Width of the context menu

    cameraContextMenu.style.display = "block";
    cameraContextMenu.style.left = (buttonRect.left - menuWidth) + "px";
    cameraContextMenu.style.top = buttonRect.top + "px";

    // Prevent the context menu from going off-screen to the left
    const menuRect = cameraContextMenu.getBoundingClientRect();
    if (menuRect.left < 0) {
        cameraContextMenu.style.left = "0px";
    }

    // Ensure checkmarks are up to date
    if (typeof updateCheckmarks === 'function') {
        updateCheckmarks();
    }
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
        if (!event.target.closest('#camera-context-menu') &&
            !event.target.closest('#json-export-context-menu') &&
            !event.target.closest('#camera-button') &&
            !event.target.closest('#export-json')) {
            closeAllContextMenus();
        }
    });

    // Event listener for right-clicks (context menu) on the document
    document.addEventListener('contextmenu', function (event) {
        // Close all menus if the right-click is outside any menu or button
        if (!event.target.closest('#camera-context-menu') &&
            !event.target.closest('#json-export-context-menu') &&
            !event.target.closest('#camera-button') &&
            !event.target.closest('#export-json')) {
            closeAllContextMenus();
        }
    });

    // Update the event listeners for the buttons
    document.getElementById('camera-button').addEventListener('contextmenu', showCameraContextMenu);
    document.getElementById('export-json').addEventListener('contextmenu', showJsonExportContextMenu);
}