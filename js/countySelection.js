import { g, path } from './mapSetup.js';
import { currentColor, defaultCountyColor } from './colorPicker.js';
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';
import { updateKeyMap, removeFromKeyMap } from './keyMap.js';

export let selectedCounties = [];

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

    // Find the index of the county in the selectedCounties array
    const countyIndex = selectedCounties.findIndex(county => county.id === d.id);

    if (currentFill === defaultColorHex) {
        // If the county is currently the default color, change it to the current color
        d3.select(element).style("fill", currentColorHex);
        if (countyIndex === -1) {
            selectedCounties.push({ ...d, color: currentColorHex });
        } else {
            selectedCounties[countyIndex] = { ...d, color: currentColorHex };
        }
        updateKeyMap(d, currentColorHex);
    } else {
        // If the county is currently colored, toggle between current color and default color
        if (currentFill === currentColorHex) {
            // Change to default color
            d3.select(element).style("fill", defaultCountyColor);
            selectedCounties.splice(countyIndex, 1);
            removeFromKeyMap(d, currentColorHex);
        } else {
            // Change to current color (from another color)
            d3.select(element).style("fill", currentColorHex);
            if (countyIndex === -1) {
                selectedCounties.push({ ...d, color: currentColorHex });
            } else {
                selectedCounties[countyIndex] = { ...d, color: currentColorHex };
            }
            removeFromKeyMap(d, currentFill);
            updateKeyMap(d, currentColorHex);
        }
    }

    console.log("Selected counties after:", selectedCounties);
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
