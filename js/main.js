import { g, path } from './mapSetup.js';
import { initializeZoom, resetMap, clearMap, recenterMap, zoomIn, zoomOut, cleanupZoom } from './zoomAndReset.js';
import { initializeTooltipAndContextMenu } from './tooltipAndContextMenu.js';
import { initializeColorPicker } from './colorPicker.js';
import { initializeCounties, clearSelectedCounties } from './countySelection.js';
import { initializeStates, clearSelectedStates } from './stateSelection.js';
import { initializeCameraButton } from './cameraButton.js';
import { initializeJsonExport } from './exportJson.js';
import { initializeMapKey } from './mapKey/mapKey.js';
import { initializeContextMenus } from './contextMenuUtils.js';

export let isCountyMode = true; // Ensure this export is added

let nationData;
let stateFeatures;
let countyFeatures;

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
    initializeStates(stateFeatures);

    g.append("g")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("class", "state-border")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#000000")
        .style("stroke-width", "1px");

    initializeZoom(nationData);
});

function toggleMode() {
    isCountyMode = !isCountyMode;
    d3.select("#mode-text").text(isCountyMode ? "County" : "State");
    g.selectAll(".county").style("display", isCountyMode ? null : "none");
    g.selectAll(".states path").style("display", isCountyMode ? "none" : null);
}

d3.select("#reset-button").on("click", () => {
    resetMap();
    if (isCountyMode) {
        clearSelectedCounties();
    } else {
        clearSelectedStates();
    }
});

d3.select("#clear-button").on("click", () => {
    if (isCountyMode) {
        clearSelectedCounties();
    } else {
        clearSelectedStates();
    }
});
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
