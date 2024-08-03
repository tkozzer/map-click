// countySelection.js
import { g, path } from './mapSetup.js';
import { currentColor, defaultCountyColor } from './colorPicker.js';
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';

export let selectedCounties = [];

let cmdPressed = false;

document.addEventListener("keydown", function(event) {
    if (event.key === "Meta") {
        cmdPressed = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "Meta") {
        cmdPressed = false;
    }
});

function toggleCountySelection(element, d) {
    const currentFill = d3.select(element).style("fill");
    if (currentFill === d3.rgb(currentColor).toString()) {
        d3.select(element).style("fill", defaultCountyColor);
        selectedCounties = selectedCounties.filter(county => county.id !== d.id);
    } else {
        d3.select(element).style("fill", currentColor);
        selectedCounties.push(d);
    }
}

export function initializeCounties(countyFeatures, stateIdToName) {
    countyFeatures.forEach(county => {
        const stateId = county.id.slice(0, 2);
        county.properties.stateName = stateIdToName[stateId];
    });

    const counties = g.append("g")
        .selectAll("path")
        .data(countyFeatures)
        .enter().append("path")
        .attr("class", "county")
        .attr("d", path)
        .style("fill", defaultCountyColor)
        .style("stroke", "#7d7d7d")
        .style("stroke-width", "0.5px");

    counties
        .on("mouseover", function(event, d) {
            showTooltip(event, d);
            if (cmdPressed) {
                toggleCountySelection(this, d);
            }
        })
        .on("mouseout", hideTooltip)
        .on("click", function(event, d) {
            if (!cmdPressed) {
                toggleCountySelection(this, d);
            }
        })
        .on("contextmenu", showContextMenu);
}

export function clearSelectedCounties() {
    selectedCounties = [];
    g.selectAll(".county")
        .transition()
        .duration(750)
        .style("fill", defaultCountyColor);
}