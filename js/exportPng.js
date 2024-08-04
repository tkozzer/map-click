// exportPng.js
import { g } from './mapSetup.js';
import { defaultCountyColor } from './colorPicker.js';
import { showSuccessAlert, showErrorAlert } from './customAlerts.js';

export function exportPng() {
    console.debug("Exporting as PNG");

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
        console.debug("Fetched data");

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
                    .filter(function (data) { return data.id === d.id; });
                if (!county.empty()) {
                    console.debug(`County found: ${county.datum().properties.name}`);
                    return county.style("fill");
                } else {
                    console.debug(`County not found: ${d.properties.name}`);
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

        console.debug("Serialized SVG", svgString);

        const canvas = document.createElement("canvas");
        canvas.width = 5200;  // Increased width for higher resolution
        canvas.height = 3200;  // Increased height for higher resolution
        const context = canvas.getContext("2d");

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.onload = function () {
            context.drawImage(image, 0, 0);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `us-county-map-${timestamp}.png`;

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL("image/png");

            console.debug("Image ready for download");

            link.click();
            offscreenSvg.remove();

            // Add success alert
            showSuccessAlert(`Successfully exported as PNG: ${filename}`);
        };
        image.onerror = function (error) {
            console.error("Image loading error", error);
            showErrorAlert("Error exporting as PNG. See console for details.");
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgString)));
        console.debug("Image source set", image.src);
    }).catch(error => {
        console.error("Error fetching data or processing SVG", error);
        showErrorAlert("Error exporting as PNG. See console for details.");
    });
}