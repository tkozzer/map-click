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
        mapKeyEntries[color] = { counties: new Set(), label: '' };
    }
    mapKeyEntries[color].counties.add(county);
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

        console.debug('Font size:', fontSize);
        console.debug('Color box size:', colorBoxSize);
        console.debug('Label padding:', labelPadding);
        console.debug('Right padding:', rightPadding);

        const svg = d3.create("svg");
        const widestLabelWidth = Object.values(mapKeyEntries).reduce((maxWidth, entry) => {
            const label = (entry.label || 'Label').substring(0, 50); // Limit to 50 characters
            console.debug('Calculating width for label:', label);
            const textWidth = svg.append("text")
                .attr("font-size", `${fontSize}px`)
                .attr("font-family", mapKeyConfig.fontFamily)
                .text(label)
                .node()
                .getComputedTextLength();
            console.debug('Label width:', textWidth);
            return Math.max(maxWidth, textWidth);
        }, 0);

        console.debug('Widest label width:', widestLabelWidth);

        const totalWidth = colorBoxSize + labelPadding + widestLabelWidth + rightPadding;
        console.debug('Total calculated width:', totalWidth);
        return totalWidth; // Remove the min check to allow for full width
    }
    console.debug('Returning 0 width');
    return 0;
}

export function addMapKeyEntries(svg, startX, svgHeight, keyMapWidth, scale) {
    const numEntries = Object.keys(mapKeyEntries).length;

    if (numEntries > 0 && isMapKeyVisible) {
        const fontSize = getScaledMapKeyValue(mapKeyConfig.baseFontSize, scale);
        const entryHeight = getScaledMapKeyValue(mapKeyConfig.baseEntryHeight, scale);
        const colorBoxSize = getScaledMapKeyValue(mapKeyConfig.baseColorBoxSize, scale);
        const labelPadding = getScaledMapKeyValue(mapKeyConfig.baseLabelPadding, scale);
        const keymapHeight = numEntries * entryHeight;
        const startY = (svgHeight - keymapHeight) / 2;

        console.debug('Font size:', fontSize);
        console.debug('Entry height:', entryHeight);
        console.debug('Color box size:', colorBoxSize);
        console.debug('Label padding:', labelPadding);
        console.debug('Keymap height:', keymapHeight);
        console.debug('Start Y:', startY);

        const keyMapGroup = svg.append("g").attr("transform", `translate(${startX}, ${startY})`);

        Object.entries(mapKeyEntries).forEach(([color, entry], index) => {
            const entryGroup = keyMapGroup.append("g").attr("transform", `translate(0, ${index * entryHeight})`);

            entryGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", colorBoxSize)
                .attr("height", colorBoxSize)
                .attr("fill", color);

            const label = (entry.label || `Label ${index + 1}`).substring(0, 50);
            console.debug('Adding label:', label);
            entryGroup.append("text")
                .attr("x", colorBoxSize + labelPadding)
                .attr("y", colorBoxSize / 2)
                .text(label)
                .attr("font-size", `${fontSize}px`)
                .attr("font-family", mapKeyConfig.fontFamily)
                .attr("dominant-baseline", "central");
        });
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