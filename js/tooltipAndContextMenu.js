import { fetchAndDisplayCountyData } from './county.js';

export const tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip");

let activeCounty = null;
let map;
let countyBorder;

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
    tooltip.style("opacity", 1)
        .html(`${d.properties.name}, ${d.properties.stateName}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

export function hideTooltip() {
    tooltip.style("opacity", 0);
}

export function showContextMenu(event, d) {
    event.preventDefault();
    activeCounty = d;
    $('#mapModalLabel').text(`${d.properties.name} County Border`);
    $('#mapModal').modal('show');
}

function handleModalShow() {
    if (!map) {
        initializeMap();
    } else {
        map.invalidateSize(); // This makes sure the map container is properly sized
    }

    $('.spinner-container').show();
    const selectedCounty = activeCounty.properties.name;
    const selectedState = activeCounty.properties.stateName;
    fetchCountyBorder(selectedCounty, selectedState);
    document.getElementById('countyData').innerHTML = '';  // Clear previous data
    fetchAndDisplayCountyData(selectedCounty + ' County', selectedState);
}

function initializeMap() {
    console.log("Initializing map");
    map = L.map('modalMap').setView([37.8, -96], 4); // Center of the US
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function fetchCountyBorder(county, state) {
    console.log(`Fetching border for ${county} County, ${state}`);

    // Remove the previous county border if it exists
    if (countyBorder) {
        map.removeLayer(countyBorder);
        countyBorder = null; // Ensure the reference is cleared
    }

    fetch(`https://nominatim.openstreetmap.org/search?q=${county}+County,+${state}&format=json&polygon_geojson=1`)
        .then(response => response.json())
        .then(data => {
            console.log("Data fetched:", data);
            if (data.length > 0 && data[0].geojson) {
                countyBorder = L.geoJSON(data[0].geojson, {
                    style: {
                        color: 'blue',
                        weight: 2,
                        fillOpacity: 0.2
                    }
                }).addTo(map);
                map.fitBounds(countyBorder.getBounds());
            } else {
                console.error('No valid GeoJSON data found for ' + county + ' County');
            }
        })
        .catch(error => {
            console.error('Error fetching county border:', error);
        })
        .finally(() => {
            $('.spinner-container').hide();
        });
}

export function applyCountyInteractions(selection) {
    selection
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("contextmenu", showContextMenu);
}
