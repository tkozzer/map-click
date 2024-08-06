// imagePreview.js
import { g } from './mapSetup.js';
import { defaultCountyColor } from './colorPicker.js';
import { getKeyMapEntries } from './keyMap.js';

export function generatePreview(format) {
    console.debug(`Generating preview for ${format}`);

    const leftBuffer = 100; // Keep the left buffer as is
    const rightBuffer = 0; // Add a right buffer
    const mapWidth = 1200; // Increase the map width
    const baseHeight = 800; // Keep the height as is

    // Check if key map is visible and has entries
    const keyMap = document.getElementById('key-map');
    const keyMapEntries = getKeyMapEntries();
    const hasKeyMap = keyMap && !keyMap.classList.contains('hidden') && Object.keys(keyMapEntries).length > 0;

    const keyMapWidth = hasKeyMap ? calculateKeyMapWidth() : 0;
    const totalWidth = leftBuffer + mapWidth + rightBuffer + keyMapWidth;

    const offscreenSvg = d3.select("body")
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", baseHeight)
        .style("display", "none");

    offscreenSvg.append("rect")
        .attr("width", totalWidth)
        .attr("height", baseHeight)
        .attr("fill", "white");

    const offscreenG = offscreenSvg.append("g")
        .attr("transform", `translate(${leftBuffer}, 0)`); // Move the map to create left buffer

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(([us, states]) => {
        const countyFeatures = topojson.feature(us, us.objects.counties).features;
        const stateFeatures = topojson.feature(states, states.objects.states).features;

        const offscreenProjection = d3.geoAlbersUsa()
            .scale(1500) // Increase the scale to make the map larger
            .translate([mapWidth / 2, baseHeight / 2]);

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
                    return county.style("fill");
                } else {
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

        // Add key map only if it's visible and has entries
        if (hasKeyMap) {
            addKeyMapEntries(offscreenSvg, leftBuffer + mapWidth + rightBuffer, baseHeight, keyMapWidth);
        }

        const svgNode = offscreenSvg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        const image = new Image();
        image.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = totalWidth;
            canvas.height = baseHeight;
            const context = canvas.getContext("2d");

            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);

            const dataUrl = canvas.toDataURL(`image/${format}`);
            document.getElementById('imagePreviewContainer').innerHTML = `<img src="${dataUrl}" alt="Map Preview">`;

            offscreenSvg.remove();
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    });
}

function calculateKeyMapWidth() {
    const keyMapEntries = getKeyMapEntries();
    const numEntries = Object.keys(keyMapEntries).length;

    if (numEntries > 0) {
        const fontSize = 20; // Adjust this value based on your needs
        const colorBoxSize = fontSize * 1.5;
        const labelPadding = fontSize * 0.5;
        const rightPadding = fontSize * 2;

        // Create a temporary SVG to measure text width accurately
        const svg = d3.select('body').append('svg').style('visibility', 'hidden');

        // Measure the width of the widest default label
        const widestDefaultLabel = `Label ${numEntries}`; // e.g., "Label 20" for 20 entries
        const defaultLabelWidth = svg.append('text')
            .attr('font-size', `${fontSize}px`)
            .attr('font-family', 'Arial, sans-serif')
            .text(widestDefaultLabel)
            .node()
            .getComputedTextLength();

        // Find the widest custom label
        const widestCustomLabelWidth = Object.values(keyMapEntries).reduce((maxWidth, entry) => {
            if (entry.label) {
                const textWidth = svg.append('text')
                    .attr('font-size', `${fontSize}px`)
                    .attr('font-family', 'Arial, sans-serif')
                    .text(entry.label)
                    .node()
                    .getComputedTextLength();
                return Math.max(maxWidth, textWidth);
            }
            return maxWidth;
        }, 0);

        svg.remove(); // Remove the temporary SVG

        // Use the wider of default label width or custom label width
        const labelWidth = Math.max(defaultLabelWidth, widestCustomLabelWidth);

        const totalWidth = colorBoxSize + labelPadding + labelWidth + rightPadding;
        console.debug(`Calculated Keymap Width: ${totalWidth}`);
        return totalWidth;
    }
    return 0; // Return 0 if there are no entries
}

function addKeyMapEntries(svg, mapWidth, svgHeight, keyMapWidth) {
    const keyMapEntries = getKeyMapEntries();
    const numEntries = Object.keys(keyMapEntries).length;

    if (numEntries > 0) {
        const fontSize = 20; // Adjust this value based on your needs
        const entryHeight = fontSize * 2;
        const colorBoxSize = fontSize * 1.5;
        const labelPadding = fontSize * 0.5;
        const startX = mapWidth + 30;
        const keymapHeight = numEntries * entryHeight;
        const startY = (svgHeight - keymapHeight) / 2;

        console.debug(`Keymap Debug - Font Size: ${fontSize}, Entry Height: ${entryHeight}, Color Box Size: ${colorBoxSize}`);

        const keyMapGroup = svg.append("g").attr("transform", `translate(${startX}, ${startY})`);

        Object.entries(keyMapEntries).forEach(([color, entry], index) => {
            const entryGroup = keyMapGroup.append("g").attr("transform", `translate(0, ${index * entryHeight})`);

            entryGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", colorBoxSize)
                .attr("height", colorBoxSize)
                .attr("fill", color);

            const textElement = entryGroup.append("text")
                .attr("x", colorBoxSize + labelPadding)
                .attr("y", colorBoxSize / 2)
                .text(entry.label || `Label ${index + 1}`)
                .attr("font-size", `${fontSize}px`)
                .attr("font-family", "Arial, sans-serif")
                .attr("dominant-baseline", "central");

            console.debug(`Label "${entry.label}" - Computed text length: ${textElement.node().getComputedTextLength()}`);
        });
    }
}