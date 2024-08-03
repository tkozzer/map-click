// tooltipAndContextMenu.js
export const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

export const contextMenu = d3.select("#context-menu");

let activeCounty = null;

export function initializeTooltipAndContextMenu() {
    d3.select("body").on("click", function() {
        contextMenu.style("display", "none");
    });

    d3.select("#wiki-link").on("click", function() {
        if (activeCounty) {
            const countyName = activeCounty.properties.name;
            const stateName = activeCounty.properties.stateName;
            const wikiUrl = `https://en.wikipedia.org/wiki/${countyName}_County,_${stateName}`;
            window.open(wikiUrl, '_blank');
        }
        contextMenu.style("display", "none");
    });
}

export function showTooltip(event, d) {
    tooltip.style("opacity", 1)
           .html(`${d.properties.name}, ${d.properties.stateName}`)
           .style("left", (event.pageX + 10) + "px")
           .style("top", (event.pageY - 28) + "px");
}

export function hideTooltip() {
    tooltip.style("opacity", 0);
}

export function showContextMenu(event, d) {
    event.preventDefault();
    activeCounty = d;
    contextMenu.style("display", "block")
               .style("left", (event.pageX) + "px")
               .style("top", (event.pageY) + "px");
}

export function applyCountyInteractions(selection) {
    selection
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("contextmenu", showContextMenu);
}