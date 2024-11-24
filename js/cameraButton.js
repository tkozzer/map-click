// js/cameraButton.js
import { exportPng } from './image/exportPng.js';
import { exportJpg } from './image/exportJpg.js';
import { generatePreview } from './image/imagePreview.js';

let selectedFormat = 'png'; // Default format

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