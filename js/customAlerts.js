// customAlerts.js

let alertContainer;

function createAlertContainer() {
    alertContainer = document.createElement('div');
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.left = '50%';
    alertContainer.style.transform = 'translateX(-50%)';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.width = '80%';
    alertContainer.style.maxWidth = '500px';
    document.body.appendChild(alertContainer);
}

function createAlert(type, message, duration = 5000) {
    if (!alertContainer) {
        createAlertContainer();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');

    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        <div class="alert-progress-bar"></div>
    `;

    alertContainer.appendChild(alertDiv);

    // Start the progress bar animation
    const progressBar = alertDiv.querySelector('.alert-progress-bar');
    progressBar.style.animation = `alertProgressBar ${duration}ms linear`;

    // Auto-dismiss after the specified duration
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 150);
    }, duration);

    // Stop the animation when the alert is manually closed
    const closeButton = alertDiv.querySelector('.btn-close');
    closeButton.addEventListener('click', () => {
        progressBar.style.animationPlayState = 'paused';
    });
}

export function showSuccessAlert(message, duration = 5000) {
    createAlert('success', message, duration);
}

export function showInfoAlert(message, duration = 5000) {
    createAlert('info', message, duration);
}

export function showWarningAlert(message, duration = 5000) {
    createAlert('warning', message, duration);
}

export function showErrorAlert(message, duration = 5000) {
    createAlert('danger', message, duration);
}