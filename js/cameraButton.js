// cameraButton.js
import { exportPng } from './exportPng.js';
import { exportJpg } from './exportJpg.js';
import { showCameraContextMenu } from './contextMenuUtils.js';

const cameraContextMenu = document.getElementById('camera-context-menu');
let selectedFormat = 'png'; // Default format

export function initializeCameraButton() {
    const cameraButton = document.getElementById('camera-button');

    cameraButton.addEventListener("contextmenu", showCameraContextMenu);

    cameraButton.addEventListener("click", function () {
        exportImage(selectedFormat);
    });

    document.getElementById("export-png").addEventListener("click", function () {
        selectedFormat = 'png';
        updateCheckmarks();
        cameraContextMenu.style.display = "none";
    });

    document.getElementById("export-jpg").addEventListener("click", function () {
        selectedFormat = 'jpg';
        updateCheckmarks();
        cameraContextMenu.style.display = "none";
    });

    // Initial checkmark setup
    updateCheckmarks();
}

export function updateCheckmarks() {
    document.getElementById("export-png").innerHTML = `<span class="checkmark">${selectedFormat === 'png' ? '✓' : '&nbsp;'}</span>Export as PNG`;
    document.getElementById("export-jpg").innerHTML = `<span class="checkmark">${selectedFormat === 'jpg' ? '✓' : '&nbsp;'}</span>Export as JPG`;
}

function exportImage(format) {
    console.debug(`Exporting image as ${format}`);
    if (format === 'png') {
        exportPng();
    } else if (format === 'jpg') {
        exportJpg();
    }
}