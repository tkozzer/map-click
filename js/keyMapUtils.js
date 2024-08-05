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
        const charWidth = fontSize * 0.6; // Approximate width of a character
        const rightPadding = fontSize * 2;

        // Find the longest label
        const longestLabel = Object.values(keyMapEntries).reduce((longest, entry) => {
            const label = entry.label || '';
            return label.length > longest.length ? label : longest;
        }, '');

        const labelWidth = longestLabel.length * charWidth;

        const totalWidth = colorBoxSize + labelPadding + labelWidth + rightPadding;
        console.debug(`Calculated Keymap Width: ${totalWidth}, Longest label: "${longestLabel}" (${longestLabel.length} chars)`);
        return totalWidth;
    }
    return 0; // Return 0 if there are no entries
}