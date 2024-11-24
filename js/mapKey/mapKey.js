// js/mapKey/mapKey.js

import { mapKeyConfig, getScaledMapKeyValue } from './mapKeyConfig.js';
import { showInfoAlert, updateInfoAlert } from '../customAlerts.js';

let mapKeyEntries = {};
let isMapKeyVisible = false;

export function initializeMapKey() {
    const mapKeyButton = document.getElementById('map-key-button');
    if (mapKeyButton) {
        mapKeyButton.addEventListener('click', toggleMapKey);
    }
}

export function getMapKeyEntries() {
    return mapKeyEntries;
}

export function getMapKeyVisibility() {
    return isMapKeyVisible;
}

export function toggleMapKey() {
    isMapKeyVisible = !isMapKeyVisible;
    const mapKey = document.getElementById('map-key');
    if (mapKey) {
        if (isMapKeyVisible) {
            generateMapKey();
            mapKey.classList.remove('hidden');
        } else {
            mapKey.classList.add('hidden');
        }
    }
}

export function updateMapKey(county, color) {
    if (Object.keys(mapKeyEntries).length >= mapKeyConfig.maxEntries && !mapKeyEntries[color]) {
        console.warn(`Maximum number of map key entries (${mapKeyConfig.maxEntries}) reached. Cannot add new color.`);
        if (isMapKeyVisible) {
            updateInfoAlert(`Maximum of ${mapKeyConfig.maxEntries} properties allowed in the map key. New colors cannot be added.`, 5000);
        }
        return;
    }

    if (!mapKeyEntries[color]) {
        mapKeyEntries[color] = { counties: new Set(), label: `Label for ${color}` };
    }
    mapKeyEntries[color].counties.add(county);

    // Add this debug log
    console.debug('Updated mapKeyEntries:', JSON.stringify(mapKeyEntries, (key, value) => {
        if (value instanceof Set) return Array.from(value);
        return value;
    }, 2));

    if (isMapKeyVisible) {
        generateMapKey();
    }
}

export function removeFromMapKey(county, color) {
    if (mapKeyEntries[color]) {
        mapKeyEntries[color].counties.delete(county);
        if (mapKeyEntries[color].counties.size === 0) {
            delete mapKeyEntries[color];
        }
        if (isMapKeyVisible) {
            generateMapKey();
        }
    }
}

export function clearMapKey() {
    mapKeyEntries = {};
    const mapKeyContainer = document.getElementById('map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';
    }
    const mapKey = document.getElementById('map-key');
    if (mapKey && !mapKey.classList.contains('hidden')) {
        mapKey.classList.add('hidden');
        isMapKeyVisible = false;
    }
}

export function calculateMapKeyWidth(scale) {
    console.debug('Calculating map key width. Scale:', scale);

    const numEntries = Object.keys(mapKeyEntries).length;
    console.debug('Number of entries:', numEntries);

    if (numEntries > 0 && isMapKeyVisible) {
        const fontSize = getScaledMapKeyValue(mapKeyConfig.baseFontSize, scale);
        const colorBoxSize = getScaledMapKeyValue(mapKeyConfig.baseColorBoxSize, scale);
        const labelPadding = getScaledMapKeyValue(mapKeyConfig.baseLabelPadding, scale);
        const rightPadding = getScaledMapKeyValue(mapKeyConfig.baseRightPadding, scale);

        if (isNaN(fontSize) || isNaN(colorBoxSize) || isNaN(labelPadding) || isNaN(rightPadding)) {
            console.error('Invalid scaled value detected', {
                fontSize,
                colorBoxSize,
                labelPadding,
                rightPadding
            });
            return 0;
        }

        console.debug('Font size:', fontSize);
        console.debug('Color box size:', colorBoxSize);
        console.debug('Label padding:', labelPadding);
        console.debug('Right padding:', rightPadding);

        // Create an offscreen canvas to measure text width
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px ${mapKeyConfig.fontFamily}`;

        // Measure the width of the longest label (up to 50 characters)
        const maxLabelLength = 50;
        let maxLabelWidth = 0;
        for (const entry of Object.values(mapKeyEntries)) {
            const label = entry.label || `Label for ${entry.color}`;
            const truncatedLabel = label.slice(0, maxLabelLength);
            const labelWidth = context.measureText(truncatedLabel).width;
            if (labelWidth > maxLabelWidth) {
                maxLabelWidth = labelWidth;
            }
        }

        const totalWidth = colorBoxSize + labelPadding + maxLabelWidth + rightPadding;
        console.debug('Total calculated width:', totalWidth);
        return isNaN(totalWidth) ? 0 : totalWidth;  // Ensure it returns a number
    }
    console.debug('Returning 0 width');
    return 0;
}

export function addMapKeyEntries(svg, startX, svgHeight, keyMapWidth, scale) {
    console.debug('Adding map key entries. startX:', startX, 'svgHeight:', svgHeight, 'keyMapWidth:', keyMapWidth, 'scale:', scale);

    try {
        const numEntries = Object.keys(mapKeyEntries).length;
        console.debug('Number of map key entries:', numEntries);

        if (numEntries > 0 && isMapKeyVisible) {
            // Provide default values if scale is undefined
            const safeScale = scale || 1;
            const safeKeyMapWidth = keyMapWidth || 200; // Provide a default width if it's 0

            const fontSize = getScaledMapKeyValue(mapKeyConfig.baseFontSize, safeScale);
            const entryHeight = getScaledMapKeyValue(mapKeyConfig.baseEntryHeight, safeScale);
            const colorBoxSize = getScaledMapKeyValue(mapKeyConfig.baseColorBoxSize, safeScale);
            const labelPadding = getScaledMapKeyValue(mapKeyConfig.baseLabelPadding, safeScale);
            const keymapHeight = numEntries * entryHeight;
            const startY = (svgHeight - keymapHeight) / 2;

            console.debug('Calculated dimensions:', {
                fontSize,
                entryHeight,
                colorBoxSize,
                labelPadding,
                keymapHeight,
                startY,
                safeScale,
                safeKeyMapWidth
            });

            if (isNaN(fontSize) || isNaN(entryHeight) || isNaN(colorBoxSize) || isNaN(labelPadding) || isNaN(startY)) {
                throw new Error('Invalid calculated values');
            }

            const keyMapGroup = svg.append("g")
                .attr("class", "map-key-group")
                .attr("transform", `translate(${startX}, ${startY})`);

            Object.entries(mapKeyEntries).forEach(([color, entry], index) => {
                const entryGroup = keyMapGroup.append("g")
                    .attr("transform", `translate(0, ${index * entryHeight})`);

                entryGroup.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", colorBoxSize)
                    .attr("height", colorBoxSize)
                    .attr("fill", color);

                const label = entry.label || `Label for ${color}`;
                console.debug('Adding label:', label);

                const foreignObject = entryGroup.append("foreignObject")
                    .attr("x", colorBoxSize + labelPadding)
                    .attr("y", 0)
                    .attr("width", safeKeyMapWidth - colorBoxSize - labelPadding)
                    .attr("height", entryHeight);

                foreignObject.append("xhtml:div")
                    .style("font-size", `${fontSize}px`)
                    .style("font-family", mapKeyConfig.fontFamily)
                    .style("line-height", `${entryHeight}px`)
                    .style("white-space", "nowrap")
                    .style("overflow", "hidden")
                    .style("text-overflow", "ellipsis")
                    .text(label);

                console.debug(`Label "${label}" added`);
            });

            console.debug('Map key added successfully');
        } else {
            console.debug('Map key not added: either no entries or not visible');
        }
    } catch (error) {
        console.error('Error in addMapKeyEntries:', error);
    }
}

function generateMapKey() {
    const mapKeyContainer = document.getElementById('map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';

        if (Object.keys(mapKeyEntries).length === 0) {
            console.debug('No counties selected');
            return;
        }

        Object.entries(mapKeyEntries).forEach(([color, entry], index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'map-key-entry';

            const colorBox = document.createElement('div');
            colorBox.className = 'key-color';
            colorBox.style.backgroundColor = color;

            const nameInput = document.createElement('input');
            nameInput.className = 'key-name';
            nameInput.value = entry.label || `Label ${index + 1}`;
            nameInput.maxLength = 50;

            const countiesCount = document.createElement('span');
            countiesCount.className = 'counties-count';
            countiesCount.textContent = `(${entry.counties.size} counties)`;

            nameInput.addEventListener('input', function () {
                this.value = this.value.slice(0, 50);
            });

            nameInput.addEventListener('change', function () {
                const newLabel = this.value.trim();
                entry.label = newLabel;
                entry.counties.forEach(county => {
                    county.properties.label = newLabel;
                    d3.select(`.county[data-id="${county.id}"]`)
                        .attr('title', `${county.properties.name}, ${county.properties.stateName} - ${newLabel}`);
                });
            });

            entryDiv.appendChild(colorBox);
            entryDiv.appendChild(nameInput);
            entryDiv.appendChild(countiesCount);
            mapKeyContainer.appendChild(entryDiv);
        });
    }
}

export function getMapKeyEntriesCount() {
    return Object.keys(mapKeyEntries).length;
}
