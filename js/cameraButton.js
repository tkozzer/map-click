// cameraButton.js
import { exportPng } from './exportPng.js';
import { exportJpg } from './exportJpg.js';

const cameraContextMenu = d3.select("#camera-context-menu");
let selectedFormat = 'png'; // Default format

export function initializeCameraButton() {
    const cameraButton = d3.select("#camera-button");

    cameraButton.on("contextmenu", function (event) {
        event.preventDefault();
        showCameraContextMenu(event);
    });

    cameraButton.on("click", function () {
        exportImage(selectedFormat);
    });

    d3.select("body").on("click", function () {
        cameraContextMenu.style("display", "none");
    });

    d3.select("#export-png").on("click", function () {
        selectedFormat = 'png';
        updateCheckmarks();
        cameraContextMenu.style("display", "none");
    });

    d3.select("#export-jpg").on("click", function () {
        selectedFormat = 'jpg';
        updateCheckmarks();
        cameraContextMenu.style("display", "none");
    });

    // Initial checkmark setup
    updateCheckmarks();
}

function showCameraContextMenu(event) {
    const buttonRect = event.target.getBoundingClientRect();
    const menuWidth = 150; // Width of the context menu

    cameraContextMenu.style("display", "block")
        .style("left", (buttonRect.left - menuWidth) + "px")
        .style("top", buttonRect.top + "px");

    // Prevent the context menu from going off-screen to the left
    const menuRect = cameraContextMenu.node().getBoundingClientRect();
    if (menuRect.left < 0) {
        cameraContextMenu.style("left", "0px");
    }

    // Ensure checkmarks are up to date
    updateCheckmarks();
}

function updateCheckmarks() {
    d3.select("#export-png").html(`<span class="checkmark">${selectedFormat === 'png' ? '✓' : '&nbsp;'}</span>Export as PNG`);
    d3.select("#export-jpg").html(`<span class="checkmark">${selectedFormat === 'jpg' ? '✓' : '&nbsp;'}</span>Export as JPG`);
}

function exportImage(format) {
    console.debug(`Exporting image as ${format}`);
    if (format === 'png') {
        exportPng();
    } else if (format === 'jpg') {
        exportJpg();
    }
}