// js/mapKey/countyMapKey.js

import { showInfoAlert, updateInfoAlert } from '../customAlerts.js';
import { log, warn, debug } from '../config.js';

let countyMapKeyEntries = {};
let isCountyMapKeyVisible = false;

export function initializeCountyMapKey() {
    const countyMapKeyButton = document.getElementById('county-map-key-button');
    if (countyMapKeyButton) {
        countyMapKeyButton.addEventListener('click', toggleCountyMapKey);
    }
}

export function getCountyMapKeyEntries() {
    return countyMapKeyEntries;
}

export function getCountyMapKeyVisibility() {
    return isCountyMapKeyVisible;
}

export function toggleCountyMapKey() {
    log("toggleCountyMapKey called");
    isCountyMapKeyVisible = !isCountyMapKeyVisible;
    log("County map key visibility:", isCountyMapKeyVisible);
    updateCountyMapKeyVisibility();
}

function updateCountyMapKeyVisibility() {
    log("updateCountyMapKeyVisibility called");
    const mapKey = document.getElementById('county-map-key');
    if (mapKey) {
        log("County map key element found");
        if (isCountyMapKeyVisible) {
            log("Showing county map key");
            generateCountyMapKey();
            mapKey.classList.remove('hidden');
        } else {
            log("Hiding county map key");
            mapKey.classList.add('hidden');
        }
    } else {
        log("County map key element not found");
    }
}

export function updateCountyMapKey(county, color) {
    const maxEntries = 20; // You can adjust this value as needed

    if (Object.keys(countyMapKeyEntries).length >= maxEntries && !countyMapKeyEntries[color]) {
        warn(`Maximum number of county map key entries (${maxEntries}) reached. Cannot add new color.`);
        if (isCountyMapKeyVisible) {
            updateInfoAlert(`Maximum of ${maxEntries} properties allowed in the county map key. New colors cannot be added.`, 5000);
        }
        return;
    }

    if (!countyMapKeyEntries[color]) {
        countyMapKeyEntries[color] = { counties: new Set(), label: `Label for ${color}` };
    }
    countyMapKeyEntries[color].counties.add(county);

    if (isCountyMapKeyVisible) {
        generateCountyMapKey();
    }
}

export function removeFromCountyMapKey(county, color) {
    if (countyMapKeyEntries[color]) {
        countyMapKeyEntries[color].counties.delete(county);
        if (countyMapKeyEntries[color].counties.size === 0) {
            delete countyMapKeyEntries[color];
        }
        if (isCountyMapKeyVisible) {
            generateCountyMapKey();
        }
    }
}

export function clearCountyMapKey() {
    countyMapKeyEntries = {};
    const mapKeyContainer = document.getElementById('county-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';
    }
    const mapKey = document.getElementById('county-map-key');
    if (mapKey && !mapKey.classList.contains('hidden')) {
        mapKey.classList.add('hidden');
        isCountyMapKeyVisible = false;
    }
}

function generateCountyMapKey() {
    const mapKeyContainer = document.getElementById('county-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';

        if (Object.keys(countyMapKeyEntries).length === 0) {
            debug('No counties selected');
            return;
        }

        Object.entries(countyMapKeyEntries).forEach(([color, entry], index) => {
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

export function calculateCountyMapKeyWidth(scale) {
    if (Object.keys(countyMapKeyEntries).length > 0 && isCountyMapKeyVisible) {
        const fontSize = 16 * scale;
        const colorBoxSize = 20 * scale;
        const labelPadding = 10 * scale;
        const rightPadding = 40 * scale;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px Arial, sans-serif`;

        let maxLabelWidth = 0;
        for (const entry of Object.values(countyMapKeyEntries)) {
            const label = entry.label || `Label for ${entry.color}`;
            const truncatedLabel = label.slice(0, 50);
            const labelWidth = context.measureText(truncatedLabel).width;
            if (labelWidth > maxLabelWidth) {
                maxLabelWidth = labelWidth;
            }
        }

        return colorBoxSize + labelPadding + maxLabelWidth + rightPadding;
    }
    return 0;
}

export function addCountyMapKeyEntries(svg, startX, svgHeight, keyMapWidth, scale) {
    if (Object.keys(countyMapKeyEntries).length > 0 && isCountyMapKeyVisible) {
        const fontSize = 16 * scale;
        const entryHeight = 23 * scale;
        const colorBoxSize = 20 * scale;
        const labelPadding = 10 * scale;
        const keymapHeight = Object.keys(countyMapKeyEntries).length * entryHeight;
        const startY = (svgHeight - keymapHeight) / 2;

        const keyMapGroup = svg.append("g")
            .attr("class", "county-map-key-group")
            .attr("transform", `translate(${startX}, ${startY})`);

        Object.entries(countyMapKeyEntries).forEach(([color, entry], index) => {
            const entryGroup = keyMapGroup.append("g")
                .attr("transform", `translate(0, ${index * entryHeight})`);

            entryGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", colorBoxSize)
                .attr("height", colorBoxSize)
                .attr("fill", color);

            const label = entry.label || `Label for ${color}`;

            const foreignObject = entryGroup.append("foreignObject")
                .attr("x", colorBoxSize + labelPadding)
                .attr("y", 0)
                .attr("width", keyMapWidth - colorBoxSize - labelPadding)
                .attr("height", entryHeight);

            foreignObject.append("xhtml:div")
                .style("font-size", `${fontSize}px`)
                .style("font-family", 'Arial, sans-serif')
                .style("line-height", `${entryHeight}px`)
                .style("white-space", "nowrap")
                .style("overflow", "hidden")
                .style("text-overflow", "ellipsis")
                .text(label);
        });
    }
}

export function getCountyMapKeyEntriesCount() {
    return Object.keys(countyMapKeyEntries).length;
}

debug("countyMapKey.js loaded");