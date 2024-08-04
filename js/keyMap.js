import { g } from './mapSetup.js';

let keyMapEntries = {};

export function initializeKeyMap() {
    const keyButton = document.getElementById('key-button');
    keyButton.addEventListener('click', function () {
        toggleKeyMap();
    });
}

function toggleKeyMap() {
    const keyMap = document.getElementById('key-map');
    if (keyMap.classList.contains('hidden')) {
        generateKeyMap();
        keyMap.classList.remove('hidden');
    } else {
        keyMap.classList.add('hidden');
    }
}

export function updateKeyMap(county, color) {
    if (!keyMapEntries[color]) {
        keyMapEntries[color] = new Set();
    }
    keyMapEntries[color].add(county);
    if (!document.getElementById('key-map').classList.contains('hidden')) {
        generateKeyMap();
    }
}

export function removeFromKeyMap(county, color) {
    if (keyMapEntries[color]) {
        keyMapEntries[color].delete(county);
        if (keyMapEntries[color].size === 0) {
            delete keyMapEntries[color];
        }
        if (!document.getElementById('key-map').classList.contains('hidden')) {
            generateKeyMap();
        }
    }
}

export function clearKeyMap() {
    keyMapEntries = {};
    const keyMapContainer = document.getElementById('key-map-entries');
    if (keyMapContainer) {
        keyMapContainer.innerHTML = '';
    }
    const keyMap = document.getElementById('key-map');
    if (keyMap && !keyMap.classList.contains('hidden')) {
        keyMap.classList.add('hidden');
    }
}

function generateKeyMap() {
    const keyMapContainer = document.getElementById('key-map-entries');
    keyMapContainer.innerHTML = '';

    if (Object.keys(keyMapEntries).length === 0) {
        console.debug('No counties selected');
        return;
    }

    Object.entries(keyMapEntries).forEach(([color, counties], index) => {
        const entry = document.createElement('div');
        entry.className = 'key-map-entry';

        const colorBox = document.createElement('div');
        colorBox.className = 'key-color';
        colorBox.style.backgroundColor = color;

        const nameInput = document.createElement('input');
        nameInput.className = 'key-name';
        nameInput.value = `Label ${index + 1}`;

        const countiesCount = document.createElement('span');
        countiesCount.className = 'counties-count';
        countiesCount.textContent = `(${counties.size} counties)`;

        nameInput.addEventListener('change', function () {
            const newLabel = this.value.trim();
            counties.forEach(county => {
                county.properties.label = newLabel;
                g.select(`.county[data-id="${county.id}"]`)
                    .attr('title', `${county.properties.name}, ${county.properties.stateName} - ${newLabel}`);
            });
        });

        entry.appendChild(colorBox);
        entry.appendChild(nameInput);
        entry.appendChild(countiesCount);
        keyMapContainer.appendChild(entry);
    });
}
