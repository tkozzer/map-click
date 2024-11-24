// js/tooltipAndContextMenu.js

import { fetchAndDisplayCountyData } from './county.js';
import { fetchAndDisplayStateData } from './state.js';
import { isCountyMode } from './main.js';

export const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

let activeItem = null;
let map;
let itemBorder;

function getRegionType(stateName, countyName) {
    if (stateName.toLowerCase() === 'louisiana') {
        return 'Parish';
    } else if (stateName.toLowerCase() === 'alaska') {
        if (countyName.toLowerCase().includes('borough')) {
            return 'Borough';
        } else if (countyName.toLowerCase().includes('census area')) {
            return 'Census Area';
        } else {
            return 'Municipality';
        }
    }
    return 'County';
}

export function initializeTooltipAndContextMenu() {
    d3.select("body").on("click", function () {
        $('#mapModal').modal('hide');
    });

    // Add event listener for the close button in the modal footer
    d3.select("#mapModal .modal-footer button").on("click", function () {
        $('#mapModal').modal('hide');
    });

    // Add event listener for the 'X' button in the modal header
    d3.select("#mapModal .modal-header .close").on("click", function () {
        $('#mapModal').modal('hide');
    });

    // Prevent modal from closing when clicking inside it
    d3.select("#mapModal .modal-content").on("click", function (event) {
        event.stopPropagation();
    });

    // Ensure the event listener is attached only once
    $('#mapModal').on('shown.bs.modal', handleModalShow);
}

export function showTooltip(event, d) {
    let content;
    if (isCountyMode) {
        const regionType = getRegionType(d.properties.stateName, d.properties.name);
        content = `${d.properties.name}${regionType !== 'Municipality' ? ' ' + regionType : ''}, ${d.properties.stateName}`;
    } else {
        content = d.properties.name;
    }

    tooltip.style("opacity", 1)
        .html(content)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

export function hideTooltip() {
    tooltip.style("opacity", 0);
}

export function showContextMenu(event, d) {
    event.preventDefault();
    activeItem = d;

    let regionType, itemName;
    if (isCountyMode) {
        regionType = getRegionType(d.properties.stateName, d.properties.name);
        itemName = `${d.properties.name}${regionType !== 'Municipality' ? ' ' + regionType : ''}`;
    } else {
        regionType = 'State';
        itemName = d.properties.name;
    }

    console.debug(`Showing context menu for ${itemName}`);

    $('#mapModalLabel').text(`${itemName} Border`);
    $('#mapModal').modal('show');
}

function handleModalShow() {
    if (!map) {
        initializeMap();
    } else {
        map.invalidateSize();
    }

    $('.spinner-container').show();
    const selectedItem = activeItem.properties.name;
    const selectedState = isCountyMode ? activeItem.properties.stateName : selectedItem;
    fetchItemBorder(selectedItem, selectedState);
    document.getElementById('geoEntityData').innerHTML = '';  // Clear previous data
    if (isCountyMode) {
        const regionType = getRegionType(selectedState, selectedItem);
        fetchAndDisplayCountyData(selectedItem, selectedState);
    } else {
        fetchAndDisplayStateData(selectedItem);
    }
}

function initializeMap() {
    console.debug("Initializing map");
    map = L.map('modalMap').setView([37.8, -96], 4); // Center of the US
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function fetchItemBorder(item, state) {
    console.debug(`Fetching border for ${item}, ${state}`);

    // Remove the previous item border if it exists
    if (itemBorder) {
        map.removeLayer(itemBorder);
        itemBorder = null; // Ensure the reference is cleared
    }

    let query;
    if (isCountyMode) {
        const regionType = getRegionType(state, item);
        const encodedItem = encodeURIComponent(item);
        const encodedState = encodeURIComponent(state);
        query = `https://nominatim.openstreetmap.org/search?q=${encodedItem}${regionType !== 'Municipality' ? '+' + encodeURIComponent(regionType) : ''},+${encodedState}&format=json&polygon_geojson=1`;
    } else {
        const encodedState = encodeURIComponent(state);
        query = `https://nominatim.openstreetmap.org/search?q=${encodedState},+United+States&format=json&polygon_geojson=1`;
    }

    console.debug(`Querying OSM: ${query}`);

    fetch(query)
        .then(response => response.json())
        .then(data => {
            console.debug(`OSM response:`, data);
            if (data.length > 0) {
                // Try to find the best match
                const bestMatch = data.find(result => result.geojson && result.geojson.type !== 'Point') || data[0];

                if (bestMatch.geojson && bestMatch.geojson.type !== 'Point') {
                    addItemBorderToMap(bestMatch.geojson);
                } else if (bestMatch.boundingbox) {
                    // If we only have a bounding box, create a rectangle
                    const bbox = bestMatch.boundingbox.map(Number);
                    const rectangle = [
                        [bbox[0], bbox[2]],
                        [bbox[1], bbox[3]]
                    ];
                    addItemBorderToMap({ type: 'Polygon', coordinates: [rectangle] });
                } else {
                    console.error(`No valid GeoJSON or bounding box data found for ${item}`);
                    alert(`Unable to display border for ${item}. Only point data available.`);
                }
            } else {
                console.error(`No data found for ${item}`);
                alert(`No geographic data found for ${item}.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching border: ${error}`);
            alert(`Error fetching border data: ${error.message}`);
        })
        .finally(() => {
            $('.spinner-container').hide();
        });
}

function addItemBorderToMap(geojson) {
    itemBorder = L.geoJSON(geojson, {
        style: {
            color: 'blue',
            weight: 2,
            fillOpacity: 0.2
        }
    }).addTo(map);
    map.fitBounds(itemBorder.getBounds());
    $('.spinner-container').hide();
}

export function applyItemInteractions(selection) {
    selection
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("contextmenu", showContextMenu);
}