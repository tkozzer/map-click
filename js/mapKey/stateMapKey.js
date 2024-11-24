// js/mapKey/stateMapKey.js

import { showInfoAlert, updateInfoAlert } from '../customAlerts.js';

let stateMapKeyEntries = {};
let isStateMapKeyVisible = false;

export function initializeStateMapKey() {
    const stateMapKeyButton = document.getElementById('state-map-key-button');
    if (stateMapKeyButton) {
        stateMapKeyButton.addEventListener('click', toggleStateMapKey);
    }
}

export function getStateMapKeyEntries() {
    return stateMapKeyEntries;
}

export function getStateMapKeyVisibility() {
    return isStateMapKeyVisible;
}

export function toggleStateMapKey() {
    console.log("toggleStateMapKey called");
    isStateMapKeyVisible = !isStateMapKeyVisible;
    console.log("State map key visibility:", isStateMapKeyVisible);
    updateStateMapKeyVisibility();
}

function updateStateMapKeyVisibility() {
    console.log("updateStateMapKeyVisibility called");
    const mapKey = document.getElementById('state-map-key');
    if (mapKey) {
        console.log("State map key element found");
        if (isStateMapKeyVisible) {
            console.log("Showing state map key");
            generateStateMapKey();
            mapKey.classList.remove('hidden');
        } else {
            console.log("Hiding state map key");
            mapKey.classList.add('hidden');
        }
    } else {
        console.log("State map key element not found");
    }
}

export function updateStateMapKey(state, color) {
    const maxEntries = 20; // You can adjust this value as needed

    if (Object.keys(stateMapKeyEntries).length >= maxEntries && !stateMapKeyEntries[color]) {
        console.warn(`Maximum number of state map key entries (${maxEntries}) reached. Cannot add new color.`);
        if (isStateMapKeyVisible) {
            updateInfoAlert(`Maximum of ${maxEntries} properties allowed in the state map key. New colors cannot be added.`, 5000);
        }
        return;
    }

    if (!stateMapKeyEntries[color]) {
        stateMapKeyEntries[color] = { states: new Set(), label: `Label for ${color}` };
    }
    stateMapKeyEntries[color].states.add(state);

    if (isStateMapKeyVisible) {
        generateStateMapKey();
    }
}

export function removeFromStateMapKey(state, color) {
    if (stateMapKeyEntries[color]) {
        stateMapKeyEntries[color].states.delete(state);
        if (stateMapKeyEntries[color].states.size === 0) {
            delete stateMapKeyEntries[color];
        }
        if (isStateMapKeyVisible) {
            generateStateMapKey();
        }
    }
}

export function clearStateMapKey() {
    stateMapKeyEntries = {};
    const mapKeyContainer = document.getElementById('state-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';
    }
    const mapKey = document.getElementById('state-map-key');
    if (mapKey && !mapKey.classList.contains('hidden')) {
        mapKey.classList.add('hidden');
        isStateMapKeyVisible = false;
    }
}

function generateStateMapKey() {
    const mapKeyContainer = document.getElementById('state-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';

        if (Object.keys(stateMapKeyEntries).length === 0) {
            console.debug('No states selected');
            return;
        }

        Object.entries(stateMapKeyEntries).forEach(([color, entry], index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'map-key-entry';

            const colorBox = document.createElement('div');
            colorBox.className = 'key-color';
            colorBox.style.backgroundColor = color;

            const nameInput = document.createElement('input');
            nameInput.className = 'key-name';
            nameInput.value = entry.label || `Label ${index + 1}`;
            nameInput.maxLength = 50;

            const statesCount = document.createElement('span');
            statesCount.className = 'states-count';
            statesCount.textContent = `(${entry.states.size} states)`;

            nameInput.addEventListener('input', function () {
                this.value = this.value.slice(0, 50);
            });

            nameInput.addEventListener('change', function () {
                const newLabel = this.value.trim();
                entry.label = newLabel;
                entry.states.forEach(state => {
                    state.properties.label = newLabel;
                    d3.select(`.state[data-id="${state.id}"]`)
                        .attr('title', `${state.properties.name} - ${newLabel}`);
                });
            });

            entryDiv.appendChild(colorBox);
            entryDiv.appendChild(nameInput);
            entryDiv.appendChild(statesCount);
            mapKeyContainer.appendChild(entryDiv);
        });
    }
}

export function calculateStateMapKeyWidth(scale) {
    if (Object.keys(stateMapKeyEntries).length > 0 && isStateMapKeyVisible) {
        const fontSize = 16 * scale;
        const colorBoxSize = 20 * scale;
        const labelPadding = 10 * scale;
        const rightPadding = 40 * scale;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px Arial, sans-serif`;

        let maxLabelWidth = 0;
        for (const entry of Object.values(stateMapKeyEntries)) {
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

export function addStateMapKeyEntries(svg, startX, svgHeight, keyMapWidth, scale) {
    if (Object.keys(stateMapKeyEntries).length > 0 && isStateMapKeyVisible) {
        const fontSize = 16 * scale;
        const entryHeight = 23 * scale;
        const colorBoxSize = 20 * scale;
        const labelPadding = 10 * scale;
        const keymapHeight = Object.keys(stateMapKeyEntries).length * entryHeight;
        const startY = (svgHeight - keymapHeight) / 2;

        const keyMapGroup = svg.append("g")
            .attr("class", "state-map-key-group")
            .attr("transform", `translate(${startX}, ${startY})`);

        Object.entries(stateMapKeyEntries).forEach(([color, entry], index) => {
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

export function getStateMapKeyEntriesCount() {
    return Object.keys(stateMapKeyEntries).length;
}

console.log("stateMapKey.js loaded");