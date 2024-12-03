// js/cameraButton.js
import { exportPng } from './image/exportPng.js';
import { exportJpg } from './image/exportJpg.js';
import { generatePreview, cleanupPreview } from './image/imagePreview.js';

let selectedFormat = 'png'; // Default format
let isExporting = false; // Flag to prevent multiple exports
let imagePreviewModal;
let lastFocusedElement;

export function initializeCameraButton() {
    const cameraButton = document.getElementById('camera-button');
    const modalElement = document.getElementById('imagePreviewModal');
    const mainContent = document.getElementById('mainContent');

    // Initialize Bootstrap modal with custom options
    imagePreviewModal = new bootstrap.Modal(modalElement, {
        keyboard: true,
        backdrop: true,
        focus: false // Disable Bootstrap's focus management
    });

    cameraButton.addEventListener("click", function () {
        lastFocusedElement = document.activeElement;
        showImagePreviewModal();
    });

    // Handle modal events for accessibility
    modalElement.addEventListener('show.bs.modal', function () {
        // Remove any aria-hidden that Bootstrap might have added
        document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
            el.removeAttribute('aria-hidden');
        });

        // Use inert instead of aria-hidden
        mainContent.setAttribute('inert', '');
        mainContent.removeAttribute('aria-hidden');
    });

    modalElement.addEventListener('shown.bs.modal', function () {
        // Remove any aria-hidden that Bootstrap might have added
        document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
            el.removeAttribute('aria-hidden');
        });

        const firstInput = document.getElementById('formatPNG');
        if (firstInput) {
            firstInput.focus();
        }
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
        mainContent.removeAttribute('inert');
        // Remove any remaining aria-hidden
        document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
            el.removeAttribute('aria-hidden');
        });
        cleanupPreview();
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    });

    // Initialize preview modal events
    initializePreviewModalEvents();
}

function showImagePreviewModal() {
    generatePreview(selectedFormat);
    imagePreviewModal.show();
}

function initializePreviewModalEvents() {
    const modalElement = document.getElementById('imagePreviewModal');

    // Handle format change
    document.querySelectorAll('input[name="exportFormat"]').forEach(input => {
        input.addEventListener('change', function () {
            selectedFormat = this.value;
            generatePreview(selectedFormat);
        });
    });

    // Handle download button click
    document.getElementById('downloadButton').addEventListener('click', function () {
        if (isExporting) return; // Prevent multiple exports
        isExporting = true;

        if (selectedFormat === 'png') {
            exportPng();
        } else if (selectedFormat === 'jpg') {
            exportJpg();
        }
        imagePreviewModal.hide();

        // Reset the export flag after a short delay
        setTimeout(() => {
            isExporting = false;
        }, 1000);
    });

    // Trap focus within modal
    modalElement.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            const focusableElements = modalElement.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        } else if (e.key === 'Escape') {
            imagePreviewModal.hide();
        }
    });
}