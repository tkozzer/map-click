import { g, path } from './mapSetup.js';
import { currentColor, defaultCountyColor } from './colorPicker.js';
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';
import { updateKeyMap, removeFromKeyMap } from './keyMap.js';

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
    const currentColorHex = d3.rgb(currentColor).toString();
    const defaultColorHex = d3.rgb(defaultCountyColor).toString();

    if (currentFill === defaultColorHex) {
        // Change to the current color
        d3.select(element).style("fill", currentColor);
        selectedCounties.push({ ...d, color: currentColor });
        updateKeyMap(d, currentColor);
    } else {
        // Change to the default color
        d3.select(element).style("fill", defaultCountyColor);
        selectedCounties = selectedCounties.filter(county => county.id !== d.id);
        removeFromKeyMap(d, currentFill);
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
        .attr("data-id", d => d.id)
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
