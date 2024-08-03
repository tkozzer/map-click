const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const g = svg.append("g");

const projection = d3.geoAlbersUsa()
    .scale(3000)  // Increased scale for more zoom
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

let initialTransform;

const zoom = d3.zoom()
    .on("zoom", zoomed);

function zoomed(event) {
    const transform = event.transform;
    if (transform.k < initialTransform.k / 2) {
        transform.k = initialTransform.k / 2;
        transform.x = (width / 2) - (width * transform.k / 2);
        transform.y = (height / 2) - (height * transform.k / 2);
    }
    g.attr("transform", transform);
}

const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

const contextMenu = d3.select("#context-menu");
let activeCounty = null;

let currentColor = "#ff0000";
const defaultCountyColor = "#f0f0f0";

d3.selectAll(".color-btn").on("click", function() {
    currentColor = this.style.backgroundColor;
    d3.select("#color-picker").property("value", d3.rgb(currentColor).formatHex());
});

d3.select("#color-picker").on("input", function() {
    currentColor = this.value;
});

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

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
]).then(([us, states]) => {
    const stateFeatures = topojson.feature(states, states.objects.states).features;
    const countyFeatures = topojson.feature(us, us.objects.counties).features;
    const nation = topojson.feature(us, us.objects.nation);

    const stateIdToName = {};
    stateFeatures.forEach(state => {
        stateIdToName[state.id] = state.properties.name;
    });

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
                } else {
                    d3.select(this).style("fill", currentColor);
                }
            }
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            if (!cmdPressed) {
                const currentFill = d3.select(this).style("fill");
                if (currentFill === d3.rgb(currentColor).toString()) {
                    d3.select(this).style("fill", defaultCountyColor);
                } else {
                    d3.select(this).style("fill", currentColor);
                }
            }
        })
        .on("contextmenu", function(event, d) {
            event.preventDefault();
            activeCounty = d;
            contextMenu.style("display", "block")
                       .style("left", (event.pageX) + "px")
                       .style("top", (event.pageY) + "px");
        });

    g.append("g")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("class", "state")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "#000000")
        .style("stroke-width", "1px");

    const [[x0, y0], [x1, y1]] = path.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
    const translate = [(width - scale * (x0 + x1)) / 2, (height - scale * (y0 + y1)) / 2];

    initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.call(zoom.transform, initialTransform);

    zoom.scaleExtent([scale / 2, scale * 8]);

    svg.call(zoom);
});

d3.select("#zoom-in").on("click", function() {
    zoom.scaleBy(svg.transition().duration(300), 1.5);
});

d3.select("#zoom-out").on("click", function() {
    zoom.scaleBy(svg.transition().duration(300), 1 / 1.5);
});

const resetButton = d3.select("#reset-button")
    .on("click", resetMap);

function resetMap() {
    svg.transition().duration(750).call(
        zoom.transform,
        initialTransform
    );
    
    g.selectAll(".county")
        .transition()
        .duration(750)
        .style("fill", defaultCountyColor);
}

const clearButton = d3.select("#clear-button")
    .on("click", clearClickedCounties);

function clearClickedCounties() {
    g.selectAll(".county")
        .transition()
        .duration(750)
        .style("fill", defaultCountyColor);
}

d3.select("#wiki-link").on("click", function() {
    if (activeCounty) {
        const countyName = activeCounty.properties.name;
        const stateName = activeCounty.properties.stateName;
        const wikiUrl = `https://en.wikipedia.org/wiki/${countyName}_County,_${stateName}`;
        window.open(wikiUrl, '_blank');
    }
    contextMenu.style("display", "none");
});

d3.select("body").on("click", function() {
    contextMenu.style("display", "none");
});

d3.select("#camera-button").on("click", function() {
    console.log("Camera button clicked");

    const offscreenSvg = d3.select("body")
        .append("svg")
        .attr("width", 5200)  // Increased width for higher resolution
        .attr("height", 3200)  // Increased height for higher resolution
        .style("display", "none");

    offscreenSvg.append("rect")
        .attr("width", 5200)
        .attr("height", 3200)
        .attr("fill", "white");

    const offscreenG = offscreenSvg.append("g");

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(([us, states]) => {
        console.log("Fetched data");

        const countyFeatures = topojson.feature(us, us.objects.counties).features;
        const stateFeatures = topojson.feature(states, states.objects.states).features;

        const stateIdToName = {};
        stateFeatures.forEach(state => {
            stateIdToName[state.id] = state.properties.name;
        });

        countyFeatures.forEach(county => {
            const stateId = county.id.slice(0, 2);
            county.properties.stateName = stateIdToName[stateId];
        });

        // Correct the projection for the offscreen SVG
        const offscreenProjection = d3.geoAlbersUsa()
            .scale(6250)  // Adjusted scale to match the zoom level
            .translate([2600, 1600]);

        const offscreenPath = d3.geoPath().projection(offscreenProjection);

        offscreenG.selectAll("path")
            .data(countyFeatures)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", offscreenPath)
            .style("fill", d => {
                const county = g.selectAll("path.county")
                    .filter(function(data) { return data.id === d.id; });
                if (!county.empty()) {
                    console.log(`County found: ${county.datum().properties.name}`);
                    return county.style("fill");
                } else {
                    console.log(`County not found: ${d.properties.name}`);
                    return defaultCountyColor;
                }
            })
            .style("stroke", "#7d7d7d")
            .style("stroke-width", "0.5px");

        offscreenG.selectAll("path.state")
            .data(stateFeatures)
            .enter().append("path")
            .attr("class", "state")
            .attr("d", offscreenPath)
            .style("fill", "none")
            .style("stroke", "#000000")
            .style("stroke-width", "1px");

        const svgNode = offscreenSvg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        console.log("Serialized SVG", svgString);

        const canvas = document.createElement("canvas");
        canvas.width = 5200;  // Increased width for higher resolution
        canvas.height = 3200;  // Increased height for higher resolution
        const context = canvas.getContext("2d");

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.onload = function() {
            context.drawImage(image, 0, 0);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `us-county-map-${timestamp}.png`;

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL("image/png");

            console.log("Image ready for download");

            link.click();
            offscreenSvg.remove();
        };
        image.onerror = function(error) {
            console.error("Image loading error", error);
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        console.log("Image source set", image.src);
    }).catch(error => {
        console.error("Error fetching data or processing SVG", error);
    });
});