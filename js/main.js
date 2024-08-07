import { g, path } from './mapSetup.js';
import { initializeZoom, resetMap, clearMap, recenterMap, zoomIn, zoomOut, cleanupZoom } from './zoomAndReset.js';
import { initializeTooltipAndContextMenu } from './tooltipAndContextMenu.js';
import { initializeColorPicker } from './colorPicker.js';
import { initializeCounties } from './countySelection.js';
import { initializeCameraButton } from './cameraButton.js';
import { initializeJsonExport } from './exportJson.js';
import { initializeMapKey } from './mapKey/mapKey.js';
import { initializeContextMenus } from './contextMenuUtils.js';

let nationData;
let stateFeatures;
let countyFeatures;
let isCountyMode = true;

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
]).then(([us, states]) => {
    stateFeatures = topojson.feature(states, states.objects.states).features;
    countyFeatures = topojson.feature(us, us.objects.counties).features;
    nationData = topojson.feature(us, us.objects.nation);

    const stateIdToName = {};
    stateFeatures.forEach(state => {
        stateIdToName[state.id] = state.properties.name;
    });

    initializeCounties(countyFeatures, stateIdToName);
    initializeStates();

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

function initializeStates() {
    g.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "#f0f0f0")
        .style("stroke", "#000000")
        .style("stroke-width", "1px")
        .style("display", "none");
}

function toggleMode() {
    isCountyMode = !isCountyMode;
    d3.select("#mode-text").text(isCountyMode ? "County" : "State");
    g.selectAll(".county").style("display", isCountyMode ? null : "none");
    g.selectAll(".states path").style("display", isCountyMode ? "none" : null);
}

d3.select("#reset-button").on("click", resetMap);
d3.select("#clear-button").on("click", clearMap);
d3.select("#recenter-button").on("click", recenterMap);
d3.select("#zoom-in").on("click", zoomIn);
d3.select("#zoom-out").on("click", zoomOut);
d3.select("#mode-toggle").on("click", toggleMode);

initializeTooltipAndContextMenu();
initializeColorPicker();
initializeCameraButton();
initializeJsonExport();
initializeMapKey();
initializeContextMenus();
cleanupZoom();