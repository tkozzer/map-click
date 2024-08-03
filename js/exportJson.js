// exportJson.js
import { selectedCounties } from './countySelection.js';

d3.select("#export-json").on("click", function() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `selected-counties-${timestamp}.json`;

    const data = selectedCounties.map(county => ({
        county_name: county.properties.name,
        state_name: county.properties.stateName,
        county_number: county.id
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
});
