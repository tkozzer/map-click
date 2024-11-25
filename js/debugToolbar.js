// js/debugToolbar.js

import { getIsCountyMode } from './main.js';
import { selectAllCounties, selectCountiesInStates, deselectCountiesInStates } from './countySelection.js';
import { selectAllStates } from './stateSelection.js';
import { getErrorLog, clearErrorLog } from './county.js';
import { usStateEntityIds } from './usStates.js';
import { IS_DEVELOPMENT } from './config.js';

let stateDropdown;
let selectCountiesButton;
let deselectCountiesButton;

export function initializeDebugToolbar() {
    if (!IS_DEVELOPMENT) return; // Skip initialization if not in development

    const selectAllButton = document.getElementById('select-all-button');
    selectAllButton.addEventListener('click', handleSelectAll);

    const showErrorLogButton = document.createElement('button');
    showErrorLogButton.id = 'show-error-log-button';
    showErrorLogButton.className = 'debug-toolbar-button';
    showErrorLogButton.textContent = 'Show Error Log';
    showErrorLogButton.addEventListener('click', handleShowErrorLog);

    stateDropdown = document.createElement('select');
    stateDropdown.id = 'state-dropdown';
    stateDropdown.className = 'debug-toolbar-dropdown';
    stateDropdown.multiple = true;
    populateStateDropdown();

    selectCountiesButton = document.createElement('button');
    selectCountiesButton.id = 'select-counties-button';
    selectCountiesButton.className = 'debug-toolbar-button';
    selectCountiesButton.textContent = 'Select Counties';
    selectCountiesButton.addEventListener('click', handleSelectCounties);

    deselectCountiesButton = document.createElement('button');
    deselectCountiesButton.id = 'deselect-counties-button';
    deselectCountiesButton.className = 'debug-toolbar-button';
    deselectCountiesButton.textContent = 'Deselect Counties';
    deselectCountiesButton.addEventListener('click', handleDeselectCounties);

    const debugToolbar = document.getElementById('debug-toolbar');
    debugToolbar.appendChild(showErrorLogButton);
    debugToolbar.appendChild(stateDropdown);
    debugToolbar.appendChild(selectCountiesButton);
    debugToolbar.appendChild(deselectCountiesButton);

    updateToolbarVisibility();
}

function populateStateDropdown() {
    Object.keys(usStateEntityIds).sort().forEach(stateName => {
        const option = document.createElement('option');
        option.value = stateName;
        option.textContent = stateName.replace(/_/g, ' ');
        stateDropdown.appendChild(option);
    });
}

function handleSelectAll() {
    const isCountyMode = getIsCountyMode();
    if (isCountyMode) {
        selectAllCounties();
    } else {
        selectAllStates();
    }
}

function handleShowErrorLog() {
    const errorLog = getErrorLog();
    if (errorLog.length === 0) {
        alert('No errors logged.');
    } else {
        let errorMessage = 'Errors encountered:\n\n';
        errorLog.forEach((error, index) => {
            errorMessage += `${index + 1}. ${error.countyName}, ${error.stateName}\n`;
            errorMessage += `   Error: ${error.error}\n`;
            errorMessage += `   Wikidata URL: ${error.wikidataUrl}\n\n`;
        });
        alert(errorMessage);
        clearErrorLog();
    }
}

function handleSelectCounties() {
    const selectedStates = Array.from(stateDropdown.selectedOptions).map(option => option.value);
    if (selectedStates.length > 0) {
        selectCountiesInStates(selectedStates);
    } else {
        alert('Please select at least one state.');
    }
}

function handleDeselectCounties() {
    const selectedStates = Array.from(stateDropdown.selectedOptions).map(option => option.value);
    if (selectedStates.length > 0) {
        deselectCountiesInStates(selectedStates);
    } else {
        alert('Please select at least one state.');
    }
}

export function updateToolbarVisibility() {
    if (!IS_DEVELOPMENT) return; // Skip visibility updates if not in development

    const isCountyMode = getIsCountyMode();
    stateDropdown.style.display = isCountyMode ? 'block' : 'none';
    selectCountiesButton.style.display = isCountyMode ? 'block' : 'none';
    deselectCountiesButton.style.display = isCountyMode ? 'block' : 'none';
}