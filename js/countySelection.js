import { g, path } from './mapSetup.js';
import { currentColor, defaultCountyColor } from './colorPicker.js';
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';
import { updateMapKey, removeFromMapKey } from './mapKey/mapKey.js';

export let selectedCounties = [];
export let countySelection;

let cmdPressed = false;

document.addEventListener("keydown", function (event) {
    if (event.key === "Meta") {
        cmdPressed = true;
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key === "Meta") {
        cmdPressed = false;
    }
});

function toggleCountySelection(element, d) {
    const currentFill = d3.select(element).style("fill");
    const defaultColorHex = d3.rgb(defaultCountyColor).toString();
    const currentColorHex = d3.rgb(currentColor).toString();

    const countyIndex = selectedCounties.findIndex(county => county.id === d.id);

    if (currentFill === defaultColorHex) {
        d3.select(element).style("fill", currentColorHex);
        if (countyIndex === -1) {
            selectedCounties.push({ ...d, color: currentColorHex });
        } else {
            selectedCounties[countyIndex] = { ...d, color: currentColorHex };
        }
        updateMapKey(d, currentColorHex);
    } else {
        if (currentFill === currentColorHex) {
            d3.select(element).style("fill", defaultCountyColor);
            selectedCounties.splice(countyIndex, 1);
            removeFromMapKey(d, currentColorHex);
        } else {
            d3.select(element).style("fill", currentColorHex);
            if (countyIndex === -1) {
                selectedCounties.push({ ...d, color: currentColorHex });
            } else {
                selectedCounties[countyIndex] = { ...d, color: currentColorHex };
            }
            removeFromMapKey(d, currentFill);
            updateMapKey(d, currentColorHex);
        }
    }
}

export function initializeCounties(countyFeatures, stateIdToName) {
    countyFeatures.forEach(county => {
        const stateId = county.id.slice(0, 2);
        county.properties.stateName = stateIdToName[stateId];
    });

    countySelection = g.append("g")
        .selectAll("path")
        .data(countyFeatures)
        .enter().append("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("data-id", d => d.id)
        .style("fill", defaultCountyColor)
        .style("stroke", "#7d7d7d")
        .style("stroke-width", "0.5px");

    countySelection
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            if (cmdPressed) {
                toggleCountySelection(this, d);
            }
        })
        .on("mouseout", hideTooltip)
        .on("click", function (event, d) {
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