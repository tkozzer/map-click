// js/main.js

import { g, path } from './mapSetup.js';
import { initializeZoom, resetMap, recenterMap, zoomIn, zoomOut, cleanupZoom } from './zoomAndReset.js';
import { initializeTooltipAndContextMenu } from './tooltipAndContextMenu.js';
import { initializeColorPicker } from './colorPicker.js';
import { initializeCounties, clearSelectedCounties } from './countySelection.js';
import { initializeStates, clearSelectedStates } from './stateSelection.js';
import { initializeCameraButton } from './cameraButton.js';
import { initializeJsonExport, updateContextMenu } from './exportJson.js';
import { initializeCountyMapKey, clearCountyMapKey, toggleCountyMapKey } from './mapKey/countyMapKey.js';
import { initializeStateMapKey, clearStateMapKey, toggleStateMapKey } from './mapKey/stateMapKey.js';
import { initializeContextMenus } from './contextMenuUtils.js';
import { initializeDebugToolbar, updateToolbarVisibility } from './debugToolbar.js';
import { initializeMultiColorToggle } from './multiColorState.js';
import { log } from './config.js';
import { initializeStateIsolation } from './stateIsolation.js';

export let isCountyMode = false;

// Export the function to get the current mode
export function getIsCountyMode() {
    return isCountyMode;
}

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
    initializeDebugToolbar();

    // Set initial state mode
    d3.select("#switchTrack").attr("transform", "translateX(-50%)");
    g.selectAll(".county").style("display", "none");
    g.selectAll(".states path").style("display", null);
    updateMapKeyVisibility();
    updateContextMenu();
    updateToolbarVisibility();
    window.dispatchEvent(new CustomEvent('statemode', {
        detail: { isCountyMode: false }
    }));
});

function toggleMode() {
    isCountyMode = !isCountyMode;
    d3.select("#switchTrack").attr("transform", isCountyMode ? "translateX(0)" : "translateX(-50%)");

    // Toggle visibility of counties
    g.selectAll(".county").style("display", isCountyMode ? null : "none");

    // Toggle visibility of states and split-states
    g.selectAll(".states path").style("display", isCountyMode ? "none" : null);
    g.selectAll(".split-state").style("display", isCountyMode ? "none" : null);

    // Dispatch state mode event
    window.dispatchEvent(new CustomEvent('statemode', {
        detail: { isCountyMode }
    }));

    updateMapKeyVisibility();
    updateContextMenu();
    updateToolbarVisibility();
    updateUIForMode(isCountyMode);
    log("Mode toggled:", isCountyMode ? "County" : "State");
}

function updateMapKeyVisibility() {
    const countyMapKey = document.getElementById('county-map-key');
    const stateMapKey = document.getElementById('state-map-key');
    if (isCountyMode) {
        countyMapKey.style.display = '';
        stateMapKey.style.display = 'none';
    } else {
        countyMapKey.style.display = 'none';
        stateMapKey.style.display = '';
    }
}

function toggleMapKey() {
    log("toggleMapKey called");
    log("Current mode:", isCountyMode ? "County" : "State");
    if (isCountyMode) {
        log("Toggling county map key");
        toggleCountyMapKey();
    } else {
        log("Toggling state map key");
        toggleStateMapKey();
    }
}

d3.select("#reset-button").on("click", () => {
    resetMap();
    if (isCountyMode) {
        clearCountyMapKey();
        clearSelectedCounties();
    } else {
        clearStateMapKey();
        clearSelectedStates();
    }
});

d3.select("#clear-button").on("click", () => {
    if (isCountyMode) {
        clearCountyMapKey();
        clearSelectedCounties();
    } else {
        clearStateMapKey();
        clearSelectedStates();
    }
});

d3.select("#recenter-button").on("click", recenterMap);
d3.select("#zoom-in").on("click", zoomIn);
d3.select("#zoom-out").on("click", zoomOut);
d3.select("#switchContainer").on("click", toggleMode);
document.getElementById('map-key-button').addEventListener('click', toggleMapKey);

initializeTooltipAndContextMenu();
initializeColorPicker();
initializeCameraButton();
initializeJsonExport();
initializeCountyMapKey();
initializeStateMapKey();
initializeContextMenus();
cleanupZoom();

// Initialize everything after DOM content is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeMultiColorToggle();
    initializeTooltipAndContextMenu();
    initializeColorPicker();
    initializeCameraButton();
    initializeJsonExport();
    initializeCountyMapKey();
    initializeStateMapKey();
    initializeContextMenus();
    cleanupZoom();
});

export function updateUIForMode(isCountyMode) {
    // Update the switch UI
    const stateButton = document.querySelector('.switch-button.state');
    const countyButton = document.querySelector('.switch-button.county');

    if (isCountyMode) {
        stateButton.classList.remove('active');
        countyButton.classList.add('active');
    } else {
        stateButton.classList.add('active');
        countyButton.classList.remove('active');
    }

    // Enable/disable the isolate button based on mode
    const isolateButton = document.getElementById('isolate-button');
    if (isolateButton) {
        if (isCountyMode) {
            isolateButton.classList.add('disabled');
            isolateButton.title = 'Region isolation is only available in state mode';
        } else {
            isolateButton.classList.remove('disabled');
            isolateButton.removeAttribute('title');
        }
    }

    // Update other UI elements as needed
    updateContextMenu();
}

initializeStateIsolation();