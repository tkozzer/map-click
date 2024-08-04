// exportJpg.js
import { g } from './mapSetup.js';
import { defaultCountyColor } from './colorPicker.js';
import { showSuccessAlert, showErrorAlert } from './customAlerts.js';

export function exportJpg() {
    console.log("Exporting as JPG");

    const offscreenSvg = d3.select("body")
        .append("svg")
        .attr("width", 5200)
        .attr("height", 3200)
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

        const offscreenProjection = d3.geoAlbersUsa()
            .scale(6250)
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
        canvas.width = 5200;
        canvas.height = 3200;
        const context = canvas.getContext("2d");

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.onload = function () {
            context.drawImage(image, 0, 0);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `us-county-map-${timestamp}.jpg`;

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL("image/jpeg", 0.9);  // Use JPEG format with 90% quality

            console.log("Image ready for download");

            link.click();
            offscreenSvg.remove();

            // Add success alert
            showSuccessAlert(`Successfully exported as JPG: ${filename}`);
        };
        image.onerror = function (error) {
            console.error("Image loading error", error);
            showErrorAlert("Error exporting as JPG. See console for details.");
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgString)));
        console.log("Image source set", image.src);
    }).catch(error => {
        console.error("Error fetching data or processing SVG", error);
        showErrorAlert("Error exporting as JPG. See console for details.");
    });
}