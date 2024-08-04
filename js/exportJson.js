import { selectedCounties } from './countySelection.js';
import { getCountyData } from './county.js';
import { showSuccessAlert, showErrorAlert } from './customAlerts.js';

const jsonExportContextMenu = document.getElementById('json-export-context-menu');
const exportJsonButton = document.getElementById('export-json');
const exportIcon = exportJsonButton?.querySelector('.fa-file-export');
const spinnerIcon = exportJsonButton?.querySelector('.fa-spinner');

let selectedFields = new Set(['county_name', 'state_name', 'county_number']);

export function initializeJsonExport() {
    // Show context menu on right-click
    exportJsonButton.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        showJsonExportContextMenu(event);
    });

    // Export JSON on left-click
    exportJsonButton.addEventListener('click', async function () {
        await exportJson();
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!jsonExportContextMenu.contains(event.target) && event.target !== exportJsonButton) {
            jsonExportContextMenu.style.display = 'none';
        }
    });

    // Add event listeners for checkboxes
    jsonExportContextMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const fieldName = this.id.replace('json-', '').replace('-', '_');
            if (this.checked) {
                selectedFields.add(fieldName);
            } else {
                selectedFields.delete(fieldName);
            }
        });
    });

    // Add event listeners for "Select All" and "Clear" buttons
    document.getElementById('select-all-fields').addEventListener('click', selectAllFields);
    document.getElementById('clear-all-fields').addEventListener('click', clearAllFields);
}

function selectAllFields() {
    jsonExportContextMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
        const fieldName = checkbox.id.replace('json-', '').replace('-', '_');
        selectedFields.add(fieldName);
    });
}

function clearAllFields() {
    jsonExportContextMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const fieldName = checkbox.id.replace('json-', '').replace('-', '_');
        if (fieldName !== 'county_name' && fieldName !== 'state_name') {
            checkbox.checked = false;
            selectedFields.delete(fieldName);
        } else {
            checkbox.checked = true;
            selectedFields.add(fieldName);
        }
    });
}

function showJsonExportContextMenu(event) {
    const buttonRect = event.target.getBoundingClientRect();
    const menuWidth = 200; // Adjust as needed

    jsonExportContextMenu.style.display = 'block';
    jsonExportContextMenu.style.left = (buttonRect.right - menuWidth) + 'px';
    jsonExportContextMenu.style.top = buttonRect.bottom + 'px';

    // Stop propagation to prevent immediate closing
    event.stopPropagation();
}

async function exportJson() {
    const startTime = new Date().getTime();
    console.log("Starting JSON export");

    try {
        if (exportIcon) exportIcon.style.display = 'none';
        if (spinnerIcon) spinnerIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .json-export-progress-bar-container');
        const progressBar = document.querySelector('#export-json .json-export-progress-bar');
        if (progressBarContainer) progressBarContainer.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';

        const exportData = [];

        console.log(`Number of selected counties: ${selectedCounties.length}`);

        if (selectedCounties.length === 0) {
            console.warn("No counties selected for export");
            showErrorAlert('No counties selected for export. Please select counties and try again.');
            return;
        }

        // Use for...of loop with index
        for (let [index, county] of selectedCounties.entries()) {
            console.log("Processing county:", county);
            const countyData = {};
            try {
                const countyName = county.properties.name;
                const stateName = county.properties.stateName;

                console.log("Fetching data for county:", countyName, stateName);
                const countyDetails = await getCountyData(countyName, stateName);

                if (countyDetails) {
                    selectedFields.forEach(field => {
                        switch (field) {
                            case 'county_name':
                                countyData.county_name = countyName;
                                break;
                            case 'state_name':
                                countyData.state_name = stateName;
                                break;
                            case 'county_number':
                                countyData.county_number = county.id;
                                break;
                            case 'population':
                                countyData.population = countyDetails.population || 'N/A';
                                break;
                            case 'coordinates':
                                countyData.coordinates = countyDetails.coordinates.latitude && countyDetails.coordinates.longitude ? `${countyDetails.coordinates.latitude}, ${countyDetails.coordinates.longitude}` : 'N/A';
                                break;
                            case 'area':
                                countyData.area = countyDetails.area ? `${countyDetails.area.value} ${countyDetails.area.unit}` : 'N/A';
                                break;
                            case 'country':
                                countyData.country = countyDetails.country || 'N/A';
                                break;
                            case 'official_website':
                                countyData.official_website = countyDetails.officialWebsite || 'N/A';
                                break;
                            case 'capital':
                                countyData.capital = countyDetails.capital || 'N/A';
                                break;
                            case 'osm_relation':
                                countyData.osm_relation = countyDetails.osmRelationId || 'N/A';
                                break;
                            case 'wikipedia':
                                countyData.wikipedia = countyDetails.wikipediaLink || 'N/A';
                                break;
                            default:
                                console.warn(`Unknown field: ${field}`);
                                break;
                        }
                    });
                } else {
                    console.warn(`No details found for county: ${countyName}, ${stateName}`);
                }
            } catch (error) {
                console.error(`Error fetching data for county:`, county, error);
            }

            exportData.push(countyData);

            // Update progress bar
            if (progressBar) {
                const progress = ((index + 1) / selectedCounties.length) * 100;
                progressBar.style.width = `${progress}%`;
            }
        }

        console.log("Preparing JSON string");
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        console.log("Creating download link");
        const link = document.createElement('a');
        link.href = url;
        link.download = `selected-counties-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        link.click();

        URL.revokeObjectURL(url);

        const endTime = new Date().getTime();
        const totalTime = (endTime - startTime) / 1000; // Convert to seconds
        console.log(`Export completed successfully. Total time taken: ${totalTime.toFixed(2)} seconds for ${selectedCounties.length} counties.`);
        showSuccessAlert('Export completed successfully!');
    } catch (error) {
        console.error('Error during export:', error);
        console.error('Error stack:', error.stack);
        showErrorAlert(`An error occurred during export: ${error.message}. Please check the console for more details.`);
    } finally {
        if (spinnerIcon) spinnerIcon.style.display = 'none';
        if (exportIcon) exportIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .json-export-progress-bar-container');
        if (progressBarContainer) progressBarContainer.style.display = 'none';
        const finalProgressBar = document.querySelector('#export-json .json-export-progress-bar');
        if (finalProgressBar) finalProgressBar.style.width = '0%';
    }
}
