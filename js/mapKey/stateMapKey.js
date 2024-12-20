// js/mapKey/stateMapKey.js

import { showInfoAlert, updateInfoAlert } from '../customAlerts.js';
import { log, warn, debug } from '../config.js';

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
    log("toggleStateMapKey called");
    isStateMapKeyVisible = !isStateMapKeyVisible;
    log("State map key visibility:", isStateMapKeyVisible);
    updateStateMapKeyVisibility();
}

function updateStateMapKeyVisibility() {
    log("updateStateMapKeyVisibility called");
    const mapKey = document.getElementById('state-map-key');
    if (mapKey) {
        log("State map key element found");
        if (isStateMapKeyVisible) {
            log("Showing state map key");
            generateStateMapKey();
            mapKey.classList.remove('hidden');
        } else {
            log("Hiding state map key");
            mapKey.classList.add('hidden');
        }
    } else {
        log("State map key element not found");
    }
}

export function updateStateMapKey(state, color) {
    const maxEntries = 20; // You can adjust this value as needed

    if (Object.keys(stateMapKeyEntries).length >= maxEntries && !stateMapKeyEntries[color]) {
        warn(`Maximum number of state map key entries (${maxEntries}) reached. Cannot add new color.`);
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
    log(`[MAP KEY] Attempting to remove state ${state?.properties?.name} with color ${color}`);
    if (stateMapKeyEntries[color]) {
        log(`[MAP KEY] Found entry for color ${color}`);

        // Convert the Set to an array to find and remove the state by name
        const states = Array.from(stateMapKeyEntries[color].states);
        const stateToRemove = states.find(s => s.properties.name === state.properties.name);

        if (stateToRemove) {
            log(`[MAP KEY] Found state ${state.properties.name} in the set`);
            stateMapKeyEntries[color].states.delete(stateToRemove);

            if (stateMapKeyEntries[color].states.size === 0) {
                log(`[MAP KEY] No more states with color ${color}, removing color entry`);
                delete stateMapKeyEntries[color];
            }

            if (isStateMapKeyVisible) {
                log(`[MAP KEY] Map key is visible, regenerating display`);
                generateStateMapKey();
            }
        } else {
            log(`[MAP KEY] State ${state.properties.name} not found in the set`);
        }

        log(`[MAP KEY] Current entries:`, stateMapKeyEntries);
    } else {
        log(`[MAP KEY] No entry found for color ${color}`);
    }
}

export function clearStateMapKey() {
    log(`[MAP KEY] Clearing all entries`);
    log(`[MAP KEY] Previous entries:`, stateMapKeyEntries);
    stateMapKeyEntries = {};
    const mapKeyContainer = document.getElementById('state-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';
        log(`[MAP KEY] Cleared map key container`);
    }
    const mapKey = document.getElementById('state-map-key');
    if (mapKey && !mapKey.classList.contains('hidden')) {
        mapKey.classList.add('hidden');
        isStateMapKeyVisible = false;
        log(`[MAP KEY] Hidden map key`);
    }
    log(`[MAP KEY] State map key cleared`);
}

function generateStateMapKey() {
    log(`[MAP KEY] Generating state map key`);
    log(`[MAP KEY] Current entries:`, stateMapKeyEntries);

    const mapKeyContainer = document.getElementById('state-map-key-entries');
    if (mapKeyContainer) {
        mapKeyContainer.innerHTML = '';

        if (Object.keys(stateMapKeyEntries).length === 0) {
            log(`[MAP KEY] No entries to display`);
            return;
        }

        Object.entries(stateMapKeyEntries).forEach(([color, entry], index) => {
            log(`[MAP KEY] Adding entry for color ${color} with ${entry.states.size} states`);
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

        log(`[MAP KEY] Finished generating map key display`);
    } else {
        warn(`[MAP KEY] Could not find map key container element`);
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

debug("stateMapKey.js loaded");