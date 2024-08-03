// tooltipAndContextMenu.js
export const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

export const contextMenu = d3.select("#context-menu");

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
