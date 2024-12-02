// js/cameraButton.js
import { exportPng } from './image/exportPng.js';
import { exportJpg } from './image/exportJpg.js';
import { generatePreview, cleanupPreview } from './image/imagePreview.js';

let selectedFormat = 'png'; // Default format
let isExporting = false; // Flag to prevent multiple exports

export function initializeCameraButton() {
    const cameraButton = document.getElementById('camera-button');

    cameraButton.addEventListener("click", function () {
        showImagePreviewModal();
    });

    // Initialize preview modal events
    initializePreviewModalEvents();
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
    $('#downloadButton').off('click').on('click', function () {
        if (isExporting) return; // Prevent multiple exports
        isExporting = true;

        if (selectedFormat === 'png') {
            exportPng();
        } else if (selectedFormat === 'jpg') {
            exportJpg();
        }
        $('#imagePreviewModal').modal('hide');

        // Reset the export flag after a short delay
        setTimeout(() => {
            isExporting = false;
        }, 1000);
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

    // Handle modal hidden event
    $('#imagePreviewModal').on('hidden.bs.modal', function () {
        cleanupPreview();
    });
}