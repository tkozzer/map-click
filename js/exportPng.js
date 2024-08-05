// exportPng.js
import { g } from './mapSetup.js';
import { defaultCountyColor } from './colorPicker.js';
import { showSuccessAlert, showErrorAlert } from './customAlerts.js';
import { addKeyMapEntries, calculateKeyMapWidth } from './keyMapUtils.js';

export function exportPng() {
    console.debug("Exporting as PNG");

    const baseWidth = 5200;
    const baseHeight = 3200;
    const mapWidth = 4300;  // Kept as is to maintain current map position
    const keyMapWidth = calculateKeyMapWidth();
    const totalWidth = mapWidth + keyMapWidth;

    console.debug(`Total width: ${totalWidth}, Map width: ${mapWidth}, Keymap width: ${keyMapWidth}`);

    const offscreenSvg = d3.select("body")
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", baseHeight)
        .style("display", "none");

    offscreenSvg.append("rect")
        .attr("width", totalWidth)
        .attr("height", baseHeight)
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

        // Adjust the projection to fit the smaller map area
        const offscreenProjection = d3.geoAlbersUsa()
            .scale(5600)  // Kept as is to maintain current map scale
            .translate([2300, 1600]);  // Kept as is to maintain current map position

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

        // Check if the key map is visible
        const keyMap = document.getElementById('key-map');
        if (keyMap && !keyMap.classList.contains('hidden')) {
            addKeyMapEntries(offscreenSvg, mapWidth, baseHeight, keyMapWidth);
        }

        const svgNode = offscreenSvg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        console.debug("Serialized SVG", svgString);

        const canvas = document.createElement("canvas");
        canvas.width = totalWidth;
        canvas.height = baseHeight;
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