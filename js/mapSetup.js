// js/mapSetup.js
export const width = window.innerWidth;
export const height = window.innerHeight;

export const svg = d3.select("#map")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

export const g = svg.append("g");

export const projection = d3.geoAlbersUsa()
    .scale(3000)
    .translate([width / 2, height / 2]);

export const path = d3.geoPath().projection(projection);
