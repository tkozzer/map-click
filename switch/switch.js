// switch.js
document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('.switch-container').forEach(container => {
        container.addEventListener('click', function () {
            this.classList.toggle('state');
        });
    });
});
