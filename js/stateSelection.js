import { g, path } from './mapSetup.js';
import { currentColor, defaultStateColor } from './colorPicker.js'; // Ensure defaultStateColor is defined similarly to defaultCountyColor
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';
import { updateMapKey, removeFromMapKey } from './mapKey/mapKey.js';
import { isCountyMode } from './main.js'; // Ensure this import path is correct

export let selectedStates = [];
export let stateSelection;

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

function toggleStateSelection(element, d) {
    const currentFill = d3.select(element).style("fill");
    const defaultColorHex = d3.rgb(defaultStateColor).toString();
    const currentColorHex = d3.rgb(currentColor).toString();

    const stateIndex = selectedStates.findIndex(state => state.id === d.id);

    if (currentFill === defaultColorHex) {
        d3.select(element).style("fill", currentColorHex);
        if (stateIndex === -1) {
            selectedStates.push({ ...d, color: currentColorHex });
        } else {
            selectedStates[stateIndex] = { ...d, color: currentColorHex };
        }
        updateMapKey(d, currentColorHex);
    } else {
        if (currentFill === currentColorHex) {
            d3.select(element).style("fill", defaultStateColor);
            selectedStates.splice(stateIndex, 1);
            removeFromMapKey(d, currentColorHex);
        } else {
            d3.select(element).style("fill", currentColorHex);
            if (stateIndex === -1) {
                selectedStates.push({ ...d, color: currentColorHex });
            } else {
                selectedStates[stateIndex] = { ...d, color: currentColorHex };
            }
            removeFromMapKey(d, currentFill);
            updateMapKey(d, currentColorHex);
        }
    }
}

export function initializeStates(stateFeatures) {
    stateSelection = g.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("d", path)
        .attr("data-id", d => d.id)
        .style("fill", defaultStateColor)
        .style("stroke", "#000000")
        .style("stroke-width", "1px")
        .style("display", "none")
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            if (cmdPressed && !isCountyMode) {
                toggleStateSelection(this, d);
            }
        })
        .on("mouseout", hideTooltip)
        .on("click", function (event, d) {
            if (!cmdPressed && !isCountyMode) {
                toggleStateSelection(this, d);
            }
        })
        .on("contextmenu", showContextMenu);
}

export function clearSelectedStates() {
    selectedStates = [];
    g.selectAll(".states path")
        .transition()
        .duration(750)
        .style("fill", defaultStateColor);
}
