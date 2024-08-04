import { selectedCounties } from './countySelection.js';
import { getCountyData } from './county.js'; // Directly import the necessary function to get data

const jsonExportContextMenu = document.getElementById('json-export-context-menu');
const exportJsonButton = document.getElementById('export-json');
const exportIcon = exportJsonButton.querySelector('.fa-file-export');
const spinnerIcon = exportJsonButton.querySelector('.fa-spinner');

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
        exportIcon.style.display = 'none';
        spinnerIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .progress-bar-container');
        const progressBar = document.querySelector('#export-json .progress-bar');
        progressBarContainer.style.display = 'block'; // Show the progress bar container
        progressBar.style.width = '0%';

        const exportData = [];

        console.log(`Number of selected counties: ${selectedCounties.length}`);

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
            const progress = ((index + 1) / selectedCounties.length) * 100;
            progressBar.style.width = `${progress}%`;
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
        alert('Export completed successfully!');
    } catch (error) {
        console.error('Error during export:', error);
        console.error('Error stack:', error.stack);
        alert(`An error occurred during export: ${error.message}. Please check the console for more details.`);
    } finally {
        spinnerIcon.style.display = 'none';
        exportIcon.style.display = 'inline-block';
        const progressBarContainer = document.querySelector('#export-json .progress-bar-container');
        progressBarContainer.style.display = 'none'; // Hide the progress bar container
        document.querySelector('#export-json .progress-bar').style.width = '0%';
    }
}
