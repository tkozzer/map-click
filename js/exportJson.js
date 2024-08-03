// exportJson.js
import { selectedCounties } from './countySelection.js';

const jsonExportContextMenu = document.getElementById('json-export-context-menu');
let selectedFields = new Set(['county_name', 'state_name', 'county_number']);

export function initializeJsonExport() {
    const exportJsonButton = document.getElementById('export-json');

    // Show context menu on right-click
    exportJsonButton.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        showJsonExportContextMenu(event);
    });

    // Export JSON on left-click
    exportJsonButton.addEventListener('click', function() {
        exportJson();
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!jsonExportContextMenu.contains(event.target) && event.target !== exportJsonButton) {
            jsonExportContextMenu.style.display = 'none';
        }
    });

    // Add event listeners for checkboxes
    jsonExportContextMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
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

function exportJson() {
    const exportData = selectedCounties.map(county => {
        const countyData = {};
        selectedFields.forEach(field => {
            switch(field) {
                case 'county_name':
                    countyData.county_name = county.properties.name;
                    break;
                case 'state_name':
                    countyData.state_name = county.properties.stateName;
                    break;
                case 'county_number':
                    countyData.county_number = county.id;
                    break;
                case 'population':
                    countyData.population = Math.floor(Math.random() * 1000000); // Placeholder
                    break;
                case 'area':
                    countyData.area_sq_km = Math.floor(Math.random() * 10000); // Placeholder
                    break;
                case 'county_seat':
                    countyData.county_seat = "Sample City"; // Placeholder
                    break;
                case 'median_income':
                    countyData.median_income = Math.floor(Math.random() * 100000); // Placeholder
                    break;
                case 'unemployment':
                    countyData.unemployment_rate = (Math.random() * 10).toFixed(1) + "%"; // Placeholder
                    break;
                case 'industries':
                    countyData.primary_industries = ["Agriculture", "Manufacturing"]; // Placeholder
                    break;
            }
        });
        return countyData;
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `selected-counties-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    link.click();

    URL.revokeObjectURL(url);
}