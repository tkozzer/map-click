// Create a default process object if it doesn't exist
// if (!window.process) {
//     window.process = {
//         env: {
//             NODE_ENV: 'production' // Default to production
//         }
//     };
// }

export const IS_DEVELOPMENT = window.process?.env?.NODE_ENV !== 'production';

// Logging utility functions
export function log(...args) {
    if (IS_DEVELOPMENT) {
        console.log(...args);
    }
}

export function warn(...args) {
    if (IS_DEVELOPMENT) {
        console.warn(...args);
    }
}

export function error(...args) {
    // Errors are always logged, regardless of environment
    console.error(...args);
}

export function debug(...args) {
    if (IS_DEVELOPMENT) {
        console.debug(...args);
    }
}

export function info(...args) {
    if (IS_DEVELOPMENT) {
        console.info(...args);
    }
}