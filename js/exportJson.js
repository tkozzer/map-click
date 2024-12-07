// js/exportJson.js

import { selectedCounties } from './countySelection.js';
import { getSelectedStates } from './stateSelection.js';
import { getCountyData } from './county.js';
import { getStateData } from './state.js';
import { showSuccessAlert, showErrorAlert } from './customAlerts.js';
import { showJsonExportContextMenu } from './contextMenuUtils.js';
import { getIsCountyMode } from './main.js';
import { getErrorLog, clearErrorLog } from './county.js';
import { log, warn, debug, error } from './config.js';

const jsonExportContextMenu = document.getElementById('json-export-context-menu');
const jsonExportFieldsContainer = document.getElementById('json-export-fields-container');
const exportJsonButton = document.getElementById('export-json');
const exportIcon = exportJsonButton?.querySelector('.fa-file-export');
const spinnerIcon = exportJsonButton?.querySelector('.fa-spinner');

let selectedFields = new Set();

const countyFields = [
    { id: 'county_name', label: 'County Name' },
    { id: 'state_name', label: 'State Name' },
    { id: 'county_number', label: 'County Number' },
    { id: 'population', label: 'Population' },
    { id: 'coordinates', label: 'Coordinates' },
    { id: 'area', label: 'Area' },
    { id: 'country', label: 'Country' },
    { id: 'official_website', label: 'Official Website' },
    { id: 'capital', label: 'Capital' },
    { id: 'osm_relation', label: 'OSM Relation' },
    { id: 'wikipedia', label: 'Wikipedia' }
];

const stateFields = [
    { id: 'state_name', label: 'State Name' },
    { id: 'population', label: 'Population' },
    { id: 'coordinates', label: 'Coordinates' },
    { id: 'area', label: 'Area' },
    { id: 'country', label: 'Country' },
    { id: 'official_website', label: 'Official Website' },
    { id: 'capital', label: 'Capital' },
    { id: 'osm_relation', label: 'OSM Relation' },
    { id: 'wikipedia', label: 'Wikipedia' }
];

export function initializeJsonExport() {
    exportJsonButton.addEventListener('contextmenu', (e) => {
        // Prevent context menu if button is disabled
        if (exportJsonButton.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }
        showJsonExportContextMenu(e);
    });

    exportJsonButton.addEventListener('click', (e) => {
        // Prevent click if button is disabled
        if (exportJsonButton.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }
        exportJson(e);
    });

    // Initialize gear button dropdown behavior
    const gearButton = document.getElementById('gear-button');
    const gearDropdown = gearButton.querySelector('.gear-dropdown');
    let isDropdownOpen = false;

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!gearButton.contains(e.target) && isDropdownOpen) {
            gearDropdown.style.display = 'none';
            isDropdownOpen = false;
            gearButton.title = 'Settings'; // Restore tooltip when dropdown closes
        }
    });

    // Toggle dropdown only on gear button click
    gearButton.addEventListener('click', (e) => {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        gearDropdown.style.display = isDropdownOpen ? 'block' : 'none';
        gearButton.title = isDropdownOpen ? '' : 'Settings'; // Remove tooltip when dropdown is open
    });

    document.getElementById('select-all-fields').addEventListener('click', selectAllFields);
    document.getElementById('clear-all-fields').addEventListener('click', clearAllFields);

    createContextMenu(); // Initialize the context menu
}

function createContextMenu() {
    const isCountyMode = getIsCountyMode();
    const fields = isCountyMode ? countyFields : stateFields;

    // Reset selected fields when switching modes
    selectedFields = new Set(isCountyMode ? ['county_name', 'state_name', 'county_number'] : ['state_name']);

    // Clear existing content
    jsonExportFieldsContainer.innerHTML = '';

    // Create and append new checkboxes
    fields.forEach(field => {
        const div = document.createElement('div');
        const isDisabled = (isCountyMode && (field.id === 'county_name' || field.id === 'state_name')) ||
            (!isCountyMode && field.id === 'state_name');
        const isChecked = isDisabled || selectedFields.has(field.id);

        div.innerHTML = `
            <input type="checkbox" id="json-${field.id}" 
                   ${isChecked ? 'checked' : ''} 
                   ${isDisabled ? 'disabled' : ''}>
            <label for="json-${field.id}">${field.label}</label>
        `;
        jsonExportFieldsContainer.appendChild(div);

        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function () {
            if (!this.disabled) {
                const fieldName = this.id.replace('json-', '');
                if (this.checked) {
                    selectedFields.add(fieldName);
                } else {
                    selectedFields.delete(fieldName);
                }
            }
        });

        // Ensure disabled fields are always in the selectedFields set
        if (isDisabled) {
            selectedFields.add(field.id);
        }
    });

    log("Context menu updated. Current mode:", isCountyMode ? "County" : "State");
    log("Selected fields:", Array.from(selectedFields));
}

function selectAllFields() {
    const fields = getIsCountyMode() ? countyFields : stateFields;
    fields.forEach(field => {
        const checkbox = document.getElementById(`json-${field.id}`);
        if (checkbox) {
            checkbox.checked = true;
            selectedFields.add(field.id);
        }
    });
}

function clearAllFields() {
    const fields = getIsCountyMode() ? countyFields : stateFields;
    fields.forEach(field => {
        const checkbox = document.getElementById(`json-${field.id}`);
        if (checkbox) {
            checkbox.checked = false;
            selectedFields.delete(field.id);
        }
    });
}

async function exportJson() {
    // Return early if the button is disabled
    if (exportJsonButton.classList.contains('disabled')) {
        return;
    }

    const startTime = new Date().getTime();
    debug("Starting JSON export");

    try {
        if (exportIcon) exportIcon.style.display = 'none';
        if (spinnerIcon) spinnerIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .json-export-progress-bar-container');
        const progressBar = document.querySelector('#export-json .json-export-progress-bar');
        if (progressBarContainer) progressBarContainer.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';

        const isCountyMode = getIsCountyMode();
        const selectedItems = isCountyMode ? selectedCounties : getSelectedStates();

        if (selectedItems.length === 0) {
            warn(`No ${isCountyMode ? 'counties' : 'states'} selected for export`);
            showErrorAlert(`No ${isCountyMode ? 'counties' : 'states'} selected for export. Please select ${isCountyMode ? 'counties' : 'states'} and try again.`);
            return;
        }

        const exportData = await processItemsConcurrently(selectedItems, isCountyMode);
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        debug("Creating download link");
        const link = document.createElement('a');
        link.href = url;
        link.download = `selected-${isCountyMode ? 'counties' : 'states'}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        link.click();

        URL.revokeObjectURL(url);

        const endTime = new Date().getTime();
        const totalTime = (endTime - startTime) / 1000;
        debug(`Export completed successfully. Total time taken: ${totalTime.toFixed(2)} seconds for ${selectedItems.length} ${isCountyMode ? 'counties' : 'states'}.`);
        showSuccessAlert('Export completed successfully!');

        // Print error log to console
        const errorLog = getErrorLog();
        if (errorLog.length > 0) {
            error("Errors encountered during export:");
            errorLog.forEach((err, index) => {
                error(`${index + 1}. ${err.countyName}, ${err.stateName}`);
                error(`   Error: ${err.error}`);
                error(`   Wikidata URL: ${err.wikidataUrl}`);
            });
        } else {
            log("No errors encountered during export.");
        }
        clearErrorLog();
    } catch (err) {
        error('Error during export:', err);
        error('Error stack:', err.stack);
        showErrorAlert(`An error occurred during export: ${err.message}. Please check the console for more details.`);
    } finally {
        if (spinnerIcon) spinnerIcon.style.display = 'none';
        if (exportIcon) exportIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .json-export-progress-bar-container');
        if (progressBarContainer) progressBarContainer.style.display = 'none';
        const finalProgressBar = document.querySelector('#export-json .json-export-progress-bar');
        if (finalProgressBar) finalProgressBar.style.width = '0%';
    }
}

async function processItemsConcurrently(items, isCountyMode) {
    const MAX_CONCURRENT_REQUESTS = 10;
    const exportData = [];
    let progressIndex = 0;

    const updateProgressBar = (index, total) => {
        const progressBar = document.querySelector('#export-json .json-export-progress-bar');
        if (progressBar) {
            const progress = (index / total) * 100;
            progressBar.style.width = `${progress}%`;
        }
    };

    const processBatch = async (batch) => {
        const results = await Promise.all(batch.map(item => isCountyMode ? processCounty(item) : processState(item)));
        results.forEach(result => exportData.push(result));
        progressIndex += batch.length;
        updateProgressBar(progressIndex, items.length);
    };

    for (let i = 0; i < items.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = items.slice(i, i + MAX_CONCURRENT_REQUESTS);
        await processBatch(batch);
    }

    return exportData;
}

async function processCounty(county) {
    debug("Processing county:", county);
    const countyData = {};
    try {
        const countyName = county.properties.name;
        const stateName = county.properties.stateName;
        debug("Fetching data for county:", countyName, stateName);
        const countyDetails = await getCountyData(countyName, stateName);
        populateData(countyData, county, countyDetails, true);
    } catch (err) {
        error(`Error fetching data for county:`, county, err);
    }
    return countyData;
}

async function processState(state) {
    debug("Processing state:", state);
    const stateData = {};
    try {
        const stateName = state.properties.name;
        debug("Fetching data for state:", stateName);
        const stateDetails = await getStateData(stateName);
        populateData(stateData, state, stateDetails, false);
    } catch (err) {
        error(`Error fetching data for state:`, state, err);
    }
    return stateData;
}

function populateData(data, item, details, isCounty) {
    if (details) {
        selectedFields.forEach(field => {
            switch (field) {
                case 'county_name':
                    if (isCounty) data.county_name = item.properties.name;
                    break;
                case 'state_name':
                    data.state_name = isCounty ? item.properties.stateName : item.properties.name;
                    break;
                case 'county_number':
                    if (isCounty) data.county_number = item.id;
                    break;
                case 'population':
                    data.population = details.population || 'N/A';
                    break;
                case 'coordinates':
                    data.coordinates = details.coordinates.latitude && details.coordinates.longitude ? `${details.coordinates.latitude}, ${details.coordinates.longitude}` : 'N/A';
                    break;
                case 'area':
                    data.area = details.area ? `${details.area.value} ${details.area.unit}` : 'N/A';
                    break;
                case 'country':
                    data.country = details.country || 'N/A';
                    break;
                case 'official_website':
                    data.official_website = details.officialWebsite || 'N/A';
                    break;
                case 'capital':
                    data.capital = details.capital || 'N/A';
                    break;
                case 'osm_relation':
                    data.osm_relation = details.osmRelationUrl || 'N/A';
                    break;
                case 'wikipedia':
                    data.wikipedia = details.wikipediaLink || 'N/A';
                    break;
                default:
                    warn(`Unknown field: ${field}`);
                    break;
            }
        });
    } else {
        warn(`No details found for ${isCounty ? `county: ${item.properties.name}, state: ${item.properties.stateName}` : `state: ${item.properties.name}`}`);
    }
}

export function updateContextMenu() {
    createContextMenu();
    log("Context menu update triggered");
}