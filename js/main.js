import { svg, g, path } from './mapSetup.js';
import { initializeZoom, resetMap, clearMap, recenterMap, zoomIn, zoomOut, cleanupZoom } from './zoomAndReset.js';
import { initializeTooltipAndContextMenu } from './tooltipAndContextMenu.js';
import { initializeColorPicker } from './colorPicker.js';
import { initializeCounties } from './countySelection.js';
import { initializeCameraButton } from './cameraButton.js';
import { initializeJsonExport } from './exportJson.js';
import { initializeKeyMap } from './keyMap.js';
import { fetchAndDisplayCountyData } from './county.js';

let nationData;

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
]).then(([us, states]) => {
    const stateFeatures = topojson.feature(states, states.objects.states).features;
    const countyFeatures = topojson.feature(us, us.objects.counties).features;
    nationData = topojson.feature(us, us.objects.nation);

    const stateIdToName = {};
    stateFeatures.forEach(state => {
        stateIdToName[state.id] = state.properties.name;
    });

    initializeCounties(countyFeatures, stateIdToName);

    g.append("g")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#000000")
        .style("stroke-width", "1px");

    initializeZoom(nationData);
});

d3.select("#reset-button").on("click", resetMap);
d3.select("#clear-button").on("click", clearMap);
d3.select("#recenter-button").on("click", recenterMap);
d3.select("#zoom-in").on("click", zoomIn);
d3.select("#zoom-out").on("click", zoomOut);

initializeTooltipAndContextMenu();
initializeColorPicker();
initializeCameraButton();
initializeJsonExport();
initializeKeyMap();
cleanupZoom();

// Assume we have a function to show the modal and call fetchAndDisplayCountyData
function showModal(countyName, stateName) {
    fetchAndDisplayCountyData(countyName, stateName);
    $('#mapModal').modal('show');
}
