// mapSetup.js
export const width = window.innerWidth;
export const height = window.innerHeight;

export const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

export const g = svg.append("g");

export const projection = d3.geoAlbersUsa()
    .scale(3000)
    .translate([width / 2, height / 2]);

export const path = d3.geoPath().projection(projection);
