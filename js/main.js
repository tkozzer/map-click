// main.js
import { svg, g, path } from './mapSetup.js';
import { zoom, initializeZoom, resetMap } from './zoomAndReset.js';
import { initializeTooltipAndContextMenu } from './tooltipAndContextMenu.js';
import { initializeColorPicker } from './colorPicker.js';
import { initializeCounties, clearSelectedCounties } from './countySelection.js';
import './exportJson.js';
import './exportPng.js';

let nationData;

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
]).then(([us, states]) => {
    const stateFeatures = topojson.feature(states, states.objects.states).features;
    const countyFeatures = topojson.feature(us, us.objects.counties).features;
    nationData = topojson.feature(us, us.objects.nation);

    const stateIdToName = {};
    stateFeatures.forEach(state => {
        stateIdToName[state.id] = state.properties.name;
    });

    initializeCounties(countyFeatures, stateIdToName);

    g.append("g")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#000000")
        .style("stroke-width", "1px");

    initializeZoom(nationData);
});

d3.select("#zoom-in").on("click", function() {
    zoom.scaleBy(svg.transition().duration(300), 1.5);
});

d3.select("#zoom-out").on("click", function() {
    zoom.scaleBy(svg.transition().duration(300), 1 / 1.5);
});

d3.select("#reset-button").on("click", function() {
    resetMap(nationData);
});
d3.select("#clear-button").on("click", clearSelectedCounties);

initializeTooltipAndContextMenu();
initializeColorPicker();
