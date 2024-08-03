// countySelection.js
import { g, path } from './mapSetup.js';
import { tooltip, contextMenu } from './tooltipAndContextMenu.js';
import { currentColor, defaultCountyColor } from './colorPicker.js';

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

export function initializeCounties(countyFeatures, stateIdToName) {
    countyFeatures.forEach(county => {
        const stateId = county.id.slice(0, 2);
        county.properties.stateName = stateIdToName[stateId];
    });

    g.append("g")
        .selectAll("path")
        .data(countyFeatures)
        .enter().append("path")
        .attr("class", "county")
        .attr("d", path)
        .style("fill", defaultCountyColor)
        .style("stroke", "#7d7d7d")
        .style("stroke-width", "0.5px")
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                   .html(`${d.properties.name}, ${d.properties.stateName}`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
            if (cmdPressed) {
                const currentFill = d3.select(this).style("fill");
                if (currentFill === d3.rgb(currentColor).toString()) {
                    d3.select(this).style("fill", defaultCountyColor);
                    selectedCounties = selectedCounties.filter(county => county.id !== d.id);
                } else {
                    d3.select(this).style("fill", currentColor);
                    selectedCounties.push(d);
                }
            }
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .on("contextmenu", function(event, d) {
            event.preventDefault();
            activeCounty = d;
            contextMenu.style("display", "block")
                       .style("left", (event.pageX) + "px")
                       .style("top", (event.pageY) + "px");
        })
        .on("click", function(event, d) {
            if (!cmdPressed) {
                const currentFill = d3.select(this).style("fill");
                if (currentFill === d3.rgb(currentColor).toString()) {
                    d3.select(this).style("fill", defaultCountyColor);
                    selectedCounties = selectedCounties.filter(county => county.id !== d.id);
                } else {
                    d3.select(this).style("fill", currentColor);
                    selectedCounties.push(d);
                }
            }
        });
}

export function clearSelectedCounties() {
    selectedCounties = [];
    g.selectAll(".county")
        .transition()
        .duration(750)
        .style("fill", defaultCountyColor);
}
