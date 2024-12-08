// State management for the map application
import { debug, log } from './config.js';
import { clearStateColors, resetState as resetMultiColorState } from './multiColorState.js';
import { resetStateByName, getStateColor } from './stateSelection.js';
import { removeFromStateMapKey } from './mapKey/stateMapKey.js';

// Core state
const state = {
    selectedStates: new Set(),
    stateColors: new Map(),
    visibleStates: new Set(),
    isIsolationMode: false,
    selectedRegions: new Set(),
    isCustomMode: false
};

// State change subscribers
const subscribers = new Set();

// Subscribe to state changes
export function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

// Notify subscribers of state changes
function notifySubscribers() {
    subscribers.forEach(callback => callback(state));
}

// State getters
export function getSelectedStates() {
    return new Set(state.selectedStates);
}

export function getStateColors() {
    return new Map(state.stateColors);
}

export function getVisibleStates() {
    return new Set(state.visibleStates);
}

export function isStateVisible(stateName) {
    return state.visibleStates.has(stateName);
}

// State setters
export function setStateColor(stateName, color) {
    debug(`Attempting to set color for ${stateName}: ${color}`);

    // If we're in isolation mode and the state isn't visible, don't allow setting the color
    if (state.isIsolationMode && !state.visibleStates.has(stateName)) {
        debug(`Blocked setting color for ${stateName} - state is not visible in isolation mode`);
        return;
    }

    if (color) {
        state.stateColors.set(stateName, color);
        debug(`Successfully set color for ${stateName}: ${color}`);
    } else {
        state.stateColors.delete(stateName);
        debug(`Cleared color for ${stateName}`);
    }
    notifySubscribers();
}

export function toggleStateSelection(stateName) {
    if (state.selectedStates.has(stateName)) {
        state.selectedStates.delete(stateName);
        state.stateColors.delete(stateName);
    } else {
        state.selectedStates.add(stateName);
    }
    notifySubscribers();
}

// Isolation mode management
export function enterIsolationMode(visibleStates) {
    log('=== ENTER ISOLATION MODE START ===');

    // Get current D3 colors before making changes
    const currentD3Colors = new Map();
    state.visibleStates.forEach(stateName => {
        const color = getStateColor(stateName);
        if (color && color !== 'rgb(240, 240, 240)') { // Don't track default color
            currentD3Colors.set(stateName, color);
            log(`[COLOR TRACKING] Found color for ${stateName}: ${color}`);
        }
    });

    log('Current state colors:', Array.from(currentD3Colors.entries()));
    log('Entering isolation mode with visible states:', visibleStates);

    // Store old visible states for comparison
    const oldVisibleStates = new Set(state.visibleStates);
    log('Old visible states:', Array.from(oldVisibleStates));

    state.isIsolationMode = true;
    state.visibleStates = new Set(visibleStates);
    log('New visible states:', Array.from(state.visibleStates));

    // Check for states that were visible before but aren't now
    for (const oldState of oldVisibleStates) {
        if (!state.visibleStates.has(oldState)) {
            log(`[VISIBILITY CHANGE] State ${oldState} is no longer visible`);
            const currentColor = currentD3Colors.get(oldState);
            if (currentColor) {
                log(`[COLOR RESET] Found color on ${oldState}: ${currentColor}, clearing it now`);
                state.stateColors.delete(oldState);
                resetMultiColorState(oldState);
                resetStateByName(oldState);
                // Create a dummy state object with properties needed by removeFromStateMapKey
                const stateObj = { properties: { name: oldState } };
                removeFromStateMapKey(stateObj, currentColor);
                log(`[COLOR RESET] Finished clearing color on ${oldState}`);
            }
        }
    }

    log('Final state colors:', Array.from(state.stateColors.entries()));
    log('=== ENTER ISOLATION MODE END ===');
    notifySubscribers();
}

export function exitIsolationMode() {
    state.isIsolationMode = false;
    state.visibleStates.clear();
    state.selectedRegions.clear();
    // Clear all state colors in both managers
    state.stateColors.clear();
    clearStateColors();
    notifySubscribers();
}

// Region management
export function setSelectedRegions(regions) {
    state.selectedRegions = new Set(regions);
    notifySubscribers();
}

export function toggleRegion(regionName) {
    if (state.selectedRegions.has(regionName)) {
        state.selectedRegions.delete(regionName);
    } else {
        state.selectedRegions.add(regionName);
    }
    notifySubscribers();
}

// Reset state
export function resetState() {
    state.selectedStates.clear();
    state.stateColors.clear();
    state.visibleStates.clear();
    state.selectedRegions.clear();
    state.isIsolationMode = false;
    state.isCustomMode = false;
    notifySubscribers();
}

// Map key utilities
export function getVisibleStateColors() {
    debug('=== GET VISIBLE STATE COLORS START ===');
    const visibleColors = new Map();

    debug('Current isolation mode:', state.isIsolationMode);
    debug('Current visible states:', Array.from(state.visibleStates));
    debug('Current state colors:', Array.from(state.stateColors.entries()));

    if (state.isIsolationMode) {
        debug('In isolation mode - filtering colors');
        for (const [stateName, color] of state.stateColors) {
            if (state.visibleStates.has(stateName)) {
                visibleColors.set(stateName, color);
                debug(`Including state ${stateName} with color ${color}`);
            } else {
                debug(`Excluding state ${stateName} - not visible`);
                // Also clear the color since it shouldn't be visible
                state.stateColors.delete(stateName);
                debug(`Cleared color for non-visible state ${stateName}`);
            }
        }
    } else {
        debug('Not in isolation mode - showing all colors');
        return new Map(state.stateColors);
    }

    debug('Final visible colors:', Array.from(visibleColors.entries()));
    debug('=== GET VISIBLE STATE COLORS END ===');
    return visibleColors;
} 