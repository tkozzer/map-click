// tooltipAndContextMenu.js

import { fetchAndDisplayCountyData } from './county.js';
import { fetchAndDisplayStateData } from './state.js';
import { isCountyMode } from './main.js';

export const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

let activeItem = null;
let map;
let itemBorder;

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
        content = `${d.properties.name}, ${d.properties.stateName}`;
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
        const stateName = d.properties.stateName.toLowerCase();
        regionType = stateName === 'louisiana' ? 'Parish' : 'County';
        itemName = `${d.properties.name} ${regionType}`;
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
        const isLouisiana = selectedState.toLowerCase() === 'louisiana';
        const regionType = isLouisiana ? 'Parish' : 'County';
        fetchAndDisplayCountyData(selectedItem + ` ${regionType}`, selectedState);
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
        const isLouisiana = state.toLowerCase() === 'louisiana';
        const regionType = isLouisiana ? 'Parish' : 'County';
        const encodedCounty = encodeURIComponent(item);
        const encodedState = encodeURIComponent(state);
        query = `https://nominatim.openstreetmap.org/search?q=${encodedCounty}+${regionType},+${encodedState}&format=json&polygon_geojson=1`;
    } else {
        const encodedState = encodeURIComponent(state);
        query = `https://nominatim.openstreetmap.org/search?q=${encodedState},+United+States&format=json&polygon_geojson=1`;
    }

    console.debug(`Querying OSM: ${query}`);

    fetch(query)
        .then(response => response.json())
        .then(data => {
            console.debug(`OSM response:`, data);
            if (data.length > 0 && data[0].geojson) {
                addItemBorderToMap(data[0].geojson);
            } else {
                console.error(`No valid GeoJSON data found for ${item}`);
            }
        })
        .catch(error => {
            console.error(`Error fetching border: ${error}`);
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