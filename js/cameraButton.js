// cameraButton.js
import { exportPng } from './exportPng.js';
import { exportJpg } from './exportJpg.js';
import { showCameraContextMenu } from './contextMenuUtils.js';
import { generatePreview } from './imagePreview.js';

const cameraContextMenu = document.getElementById('camera-context-menu');
let selectedFormat = 'png'; // Default format

export function initializeCameraButton() {
    const cameraButton = document.getElementById('camera-button');

    cameraButton.addEventListener("contextmenu", showCameraContextMenu);

    cameraButton.addEventListener("click", function () {
        showImagePreviewModal();
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

    // Initialize preview modal events
    initializePreviewModalEvents();
}

export function updateCheckmarks() {
    document.getElementById("export-png").innerHTML = `<span class="checkmark">${selectedFormat === 'png' ? '✓' : '&nbsp;'}</span>Export as PNG`;
    document.getElementById("export-jpg").innerHTML = `<span class="checkmark">${selectedFormat === 'jpg' ? '✓' : '&nbsp;'}</span>Export as JPG`;
}

function showImagePreviewModal() {
    generatePreview(selectedFormat);
    $('#imagePreviewModal').modal('show');
}

function initializePreviewModalEvents() {
    // Handle format change
    $('input[name="exportFormat"]').on('change', function () {
        selectedFormat = $(this).val();
        generatePreview(selectedFormat);
    });

    // Handle download button click
    $('#downloadButton').on('click', function () {
        if (selectedFormat === 'png') {
            exportPng();
        } else if (selectedFormat === 'jpg') {
            exportJpg();
        }
        $('#imagePreviewModal').modal('hide');
    });

    // Handle modal close button click
    $('.modal-header .close, .modal-footer .btn-secondary').on('click', function () {
        $('#imagePreviewModal').modal('hide');
    });

    // Handle modal backdrop click
    $('#imagePreviewModal').on('click', function (event) {
        if (event.target === this) {
            $(this).modal('hide');
        }
    });
}

function exportImage(format) {
    console.debug(`Exporting image as ${format}`);
    if (format === 'png') {
        exportPng();
    } else if (format === 'jpg') {
        exportJpg();
    }
}