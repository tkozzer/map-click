import { getKeyMapEntries } from './keyMap.js';

export function addKeyMapEntries(svg, mapWidth, svgHeight, keyMapWidth) {
    const keyMapEntries = getKeyMapEntries();
    const numEntries = Object.keys(keyMapEntries).length;

    if (numEntries > 0) {
        const fontSize = 50;
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

export function calculateKeyMapWidth() {
    const keyMapEntries = getKeyMapEntries();
    const numEntries = Object.keys(keyMapEntries).length;

    if (numEntries > 0) {
        const fontSize = 50;
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
        console.debug(`Calculated Keymap Width: ${totalWidth}, Default Label: "${widestDefaultLabel}", Width: ${defaultLabelWidth}`);
        return totalWidth;
    }
    return 0; // Return 0 if there are no entries
}