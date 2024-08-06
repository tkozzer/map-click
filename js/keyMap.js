// import { showInfoAlert, updateInfoAlert } from './customAlerts.js';

// let keyMapEntries = {};
// const MAX_KEYMAP_ENTRIES = 20;
// let isKeyMapVisible = false;

// export function initializeKeyMap() {
//     const keyButton = document.getElementById('key-button');
//     keyButton.addEventListener('click', function () {
//         toggleKeyMap();
//     });
// }

// function toggleKeyMap() {
//     const keyMap = document.getElementById('map-key');
//     if (keyMap.classList.contains('hidden')) {
//         generateKeyMap();
//         keyMap.classList.remove('hidden');
//         isKeyMapVisible = true;
//     } else {
//         keyMap.classList.add('hidden');
//         isKeyMapVisible = false;
//     }
// }

// export function updateKeyMap(county, color) {
//     if (Object.keys(keyMapEntries).length >= MAX_KEYMAP_ENTRIES && !keyMapEntries[color]) {
//         console.warn('Maximum number of keymap entries reached. Cannot add new color.');
//         if (isKeyMapVisible) {
//             updateInfoAlert(`Maximum of ${MAX_KEYMAP_ENTRIES} properties allowed in the keymap. New colors cannot be added.`, 5000);
//         }
//         return;
//     }

//     if (!keyMapEntries[color]) {
//         keyMapEntries[color] = { counties: new Set(), label: '' };
//     }
//     keyMapEntries[color].counties.add(county);
//     if (isKeyMapVisible) {
//         generateKeyMap();
//     }
// }

// export function removeFromKeyMap(county, color) {
//     if (keyMapEntries[color]) {
//         keyMapEntries[color].counties.delete(county);
//         if (keyMapEntries[color].counties.size === 0) {
//             delete keyMapEntries[color];
//         }
//         if (isKeyMapVisible) {
//             generateKeyMap();
//         }
//     }
// }

// export function clearKeyMap() {
//     keyMapEntries = {};
//     const keyMapContainer = document.getElementById('map-key-entries');
//     if (keyMapContainer) {
//         keyMapContainer.innerHTML = '';
//     }
//     const keyMap = document.getElementById('map-key');
//     if (keyMap && !keyMap.classList.contains('hidden')) {
//         keyMap.classList.add('hidden');
//         isKeyMapVisible = false;
//     }
// }

// export function getKeyMapEntries() {
//     return keyMapEntries;
// }

// function generateKeyMap() {
//     const keyMapContainer = document.getElementById('map-key-entries');
//     keyMapContainer.innerHTML = '';

//     if (Object.keys(keyMapEntries).length === 0) {
//         console.debug('No counties selected');
//         return;
//     }

//     Object.entries(keyMapEntries).forEach(([color, entry], index) => {
//         const entryDiv = document.createElement('div');
//         entryDiv.className = 'map-key-entry';

//         const colorBox = document.createElement('div');
//         colorBox.className = 'key-color';
//         colorBox.style.backgroundColor = color;

//         const nameInput = document.createElement('input');
//         nameInput.className = 'key-name';
//         nameInput.value = entry.label || `Label ${index + 1}`;
//         nameInput.maxLength = 50;

//         const countiesCount = document.createElement('span');
//         countiesCount.className = 'counties-count';
//         countiesCount.textContent = `(${entry.counties.size} counties)`;

//         nameInput.addEventListener('input', function () {
//             this.value = this.value.slice(0, 50);
//         });

//         nameInput.addEventListener('change', function () {
//             const newLabel = this.value.trim();
//             entry.label = newLabel;
//             entry.counties.forEach(county => {
//                 county.properties.label = newLabel;
//                 g.select(`.county[data-id="${county.id}"]`)
//                     .attr('title', `${county.properties.name}, ${county.properties.stateName} - ${newLabel}`);
//             });
//         });

//         entryDiv.appendChild(colorBox);
//         entryDiv.appendChild(nameInput);
//         entryDiv.appendChild(countiesCount);
//         keyMapContainer.appendChild(entryDiv);
//     });
// }

// export function getKeyMapEntriesCount() {
//     return Object.keys(keyMapEntries).length;
// }