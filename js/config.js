// Create a default process object if it doesn't exist
if (!window.process) {
    window.process = {
        env: {
            NODE_ENV: 'production' // Default to production
        }
    };
}

export const IS_DEVELOPMENT = window.process?.env?.NODE_ENV === 'development'; 