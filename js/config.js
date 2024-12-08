// js/config.js

export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
console.log('IS_DEVELOPMENT', IS_DEVELOPMENT);
console.log('import.meta.env', import.meta.env);

// Helper to get the calling file name
function getCallerFile() {
    const error = new Error();
    const stack = error.stack.split('\n');
    // Get the caller's line (index 3 since 0 is error message, 1 is getCallerFile, 2 is the logging function)
    const callerLine = stack[3];
    // Extract file path - looking for something between ( and : or last / and :
    const match = callerLine.match(/\((.+?):\d+:\d+\)/) || callerLine.match(/at\s+(.+?):\d+:\d+/);
    if (match) {
        // Get just the file name from the path
        const fullPath = match[1];
        const fileName = fullPath.split('/').pop();
        return fileName;
    }
    return 'unknown';
}

// Logging utility functions
export function log(...args) {
    if (IS_DEVELOPMENT) {
        const caller = getCallerFile();
        console.log(`[${caller}]`, ...args);
    }
}

export function warn(...args) {
    if (IS_DEVELOPMENT) {
        const caller = getCallerFile();
        console.warn(`[${caller}]`, ...args);
    }
}

export function error(...args) {
    // Errors are always logged, regardless of environment
    const caller = getCallerFile();
    console.error(`[${caller}]`, ...args);
}

export function debug(...args) {
    if (IS_DEVELOPMENT) {
        const caller = getCallerFile();
        console.log(`[DEBUG][${caller}]`, ...args);
    }
}

export function info(...args) {
    if (IS_DEVELOPMENT) {
        const caller = getCallerFile();
        console.info(`[${caller}]`, ...args);
    }
}