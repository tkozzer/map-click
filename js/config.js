// js/config.js

export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
console.log('IS_DEVELOPMENT', IS_DEVELOPMENT);
console.log('import.meta.env', import.meta.env);

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