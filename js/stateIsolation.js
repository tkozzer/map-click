import { getIsCountyMode } from './main.js';
import { log } from './config.js';
import { svg, g, path, projection } from './mapSetup.js';
import { zoom, recenterMap } from './zoomAndReset.js';

let stateIsolationModal;
let miniMapSvg;
let regions;
let selectedRegions = new Set();
let isCustomMode = false;
let customSelectedStates = new Set();
let isIsolationMode = false;

async function loadRegions() {
    try {
        const response = await fetch('resources/regions.json');
        const data = await response.json();
        regions = data.regions;
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

// Helper function to get region from state name
function getRegionForState(stateName) {
    return regions.find(region => region.states.includes(stateName));
}

function initializeMiniMap() {
    const container = document.getElementById('isolationMapContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear any existing content
    container.innerHTML = '';

    // Create SVG with adjusted viewBox for better centering
    miniMapSvg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 975 610')
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Load and render US map
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        .then(us => {
            const states = topojson.feature(us, us.objects.states);
            const projection = d3.geoAlbersUsa()
                .scale(1300)
                .translate([487, 305]);
            const path = d3.geoPath(projection);

            // Create state paths grouped by region
            regions.forEach(region => {
                const regionGroup = miniMapSvg.append('g')
                    .attr('class', 'region-group')
                    .attr('data-region', region.name);

                regionGroup.selectAll('path')
                    .data(states.features.filter(d => region.states.includes(d.properties.name)))
                    .enter()
                    .append('path')
                    .attr('class', 'mini-map-state')
                    .attr('d', path)
                    .attr('data-state', d => d.properties.name);
            });

            // Add region interaction handlers
            updateMapInteractions();
        });
}

function updateMapInteractions() {
    if (isCustomMode) {
        // Disable region selection and enable state selection
        miniMapSvg.selectAll('.region-group')
            .style('pointer-events', 'none')
            .on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);

        miniMapSvg.selectAll('.mini-map-state')
            .style('pointer-events', 'auto')
            .on('mouseover', handleStateHover)
            .on('mouseout', handleStateHoverEnd)
            .on('click', handleStateClick);
    } else {
        // Enable region selection and disable state selection
        miniMapSvg.selectAll('.mini-map-state')
            .style('pointer-events', 'none')
            .on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);

        miniMapSvg.selectAll('.region-group')
            .style('pointer-events', 'auto')
            .on('mouseover', handleRegionHover)
            .on('mouseout', handleRegionHoverEnd)
            .on('click', handleRegionClick);
    }

    updateVisualState();
}

function updateVisualState() {
    // Clear all selections first
    miniMapSvg.selectAll('.mini-map-state')
        .classed('selected', false);

    if (isCustomMode) {
        // In custom mode, show individual state selections
        customSelectedStates.forEach(stateName => {
            miniMapSvg.selectAll('.mini-map-state')
                .filter(d => d.properties.name === stateName)
                .classed('selected', true);
        });
    } else {
        // In region mode, show region selections
        selectedRegions.forEach(regionName => {
            const region = regions.find(r => r.name === regionName);
            if (region) {
                region.states.forEach(stateName => {
                    miniMapSvg.selectAll('.mini-map-state')
                        .filter(d => d.properties.name === stateName)
                        .classed('selected', true);
                });
            }
        });
    }
}

function handleStateClick(event, d) {
    if (!isCustomMode) return;

    const stateName = d.properties.name;
    if (customSelectedStates.has(stateName)) {
        customSelectedStates.delete(stateName);
    } else {
        customSelectedStates.add(stateName);
    }
    updateVisualState();
}

function handleStateHover(event, d) {
    if (!isCustomMode) return;
    d3.select(event.target).classed('highlighted', true);
}

function handleStateHoverEnd(event) {
    if (!isCustomMode) return;
    d3.select(event.target).classed('highlighted', false);
}

function handleRegionHover(event) {
    if (isCustomMode) return;
    const regionGroup = d3.select(event.currentTarget);
    regionGroup.selectAll('.mini-map-state').classed('highlighted', true);
}

function handleRegionHoverEnd(event) {
    if (isCustomMode) return;
    const regionGroup = d3.select(event.currentTarget);
    regionGroup.selectAll('.mini-map-state').classed('highlighted', false);
}

function handleRegionClick(event) {
    if (isCustomMode) return;
    const regionName = event.currentTarget.getAttribute('data-region');
    toggleRegion(regionName);
}

function toggleRegion(regionName) {
    const button = document.querySelector(`.region-buttons .btn[data-region="${regionName}"]`);
    const region = regions.find(r => r.name === regionName);

    if (!region) return;

    if (isCustomMode) {
        // In custom mode, add/remove all states in the region to custom selection
        const allStatesSelected = region.states.every(state => customSelectedStates.has(state));

        if (allStatesSelected) {
            // Remove all states in this region
            region.states.forEach(state => customSelectedStates.delete(state));
            button.classList.remove('active');
            selectedRegions.delete(regionName);
            log(`Custom Mode: Deselected ${regionName} region and its states`);
        } else {
            // Add all states in this region
            region.states.forEach(state => customSelectedStates.add(state));
            button.classList.add('active');
            selectedRegions.add(regionName);
            log(`Custom Mode: Selected ${regionName} region and its states`);
        }
    } else {
        // In region mode, toggle the region selection
        if (selectedRegions.has(regionName)) {
            selectedRegions.delete(regionName);
            button.classList.remove('active');
            log(`Region Mode: Deselected ${regionName} region`);
        } else {
            selectedRegions.add(regionName);
            button.classList.add('active');
            log(`Region Mode: Selected ${regionName} region`);
        }
    }

    updateVisualState();
}

function toggleState(stateName) {
    if (customSelectedStates.has(stateName)) {
        customSelectedStates.delete(stateName);
        log(`Custom Mode: Deselected state ${stateName}`);
    } else {
        customSelectedStates.add(stateName);
        log(`Custom Mode: Selected state ${stateName}`);
    }
    updateVisualState();
    updateSmallStatesButtons();
}

function toggleCustomMode() {
    if (isCustomMode) {
        exitCustomMode();
    } else {
        enterCustomMode();
    }
}

function clearAllSelections() {
    // Clear all selections
    selectedRegions.clear();
    customSelectedStates.clear();

    // Clear all button active states (regions and small states)
    document.querySelectorAll('.region-buttons .btn, .small-states-buttons .btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Exit custom mode
    isCustomMode = false;
    document.getElementById('custom-region-button').classList.remove('active');
    document.getElementById('small-states-list').style.display = 'none';

    // Update the visual state
    updateMapInteractions();
}

function applyIsolation() {
    // Get all selected states (from regions or custom selection)
    const selectedStates = new Set();

    if (isCustomMode) {
        // Use custom selected states
        customSelectedStates.forEach(state => selectedStates.add(state));
        log('Applying Isolation Mode with Custom Selection:');
        log('- Selected States:', Array.from(selectedStates).join(', '));
    } else {
        // Use states from selected regions
        selectedRegions.forEach(regionName => {
            const region = regions.find(r => r.name === regionName);
            if (region) {
                region.states.forEach(state => selectedStates.add(state));
            }
        });
        log('Applying Isolation Mode with Region Selection:');
        log('- Selected Regions:', Array.from(selectedRegions).join(', '));
        log('- Included States:', Array.from(selectedStates).join(', '));
    }

    // Hide state borders for non-selected states
    d3.selectAll('.state-border')
        .style('display', function (d) {
            return selectedStates.has(d.properties.name) ? null : 'none';
        });

    // Handle main state paths
    d3.selectAll('.states path')
        .style('display', function (d) {
            return selectedStates.has(d.properties.name) ? null : 'none';
        });

    // Handle split states if they exist
    d3.selectAll('path[data-clone-for]')
        .style('display', function () {
            const stateId = this.getAttribute('data-clone-for');
            const statePath = d3.select(`path[data-id="${stateId}"]`);
            const stateName = statePath.datum().properties.name;
            return selectedStates.has(stateName) ? null : 'none';
        });

    // Get the viewport dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate bounds of selected states
    let bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
    d3.selectAll('.states path')
        .filter(d => selectedStates.has(d.properties.name))
        .each(function (d) {
            const b = path.bounds(d);
            bounds[0][0] = Math.min(bounds[0][0], b[0][0]);
            bounds[0][1] = Math.min(bounds[0][1], b[0][1]);
            bounds[1][0] = Math.max(bounds[1][0], b[1][0]);
            bounds[1][1] = Math.max(bounds[1][1], b[1][1]);
        });

    // Calculate the scale and translate to center the region
    const [[x0, y0], [x1, y1]] = bounds;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    // Add more padding (20% on each side) to zoom out a bit more
    const padding = 0.8;
    const scale = padding * Math.min(width / dx, height / dy);
    const translate = [width / 2 - scale * x, height / 2 - scale * y + 30]; // Added 30px vertical offset to account for toolbar

    // Close the modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById('stateIsolationModal'));
    if (modal) {
        modal.hide();
    }

    // Apply the zoom transform with transition
    setTimeout(() => {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale));
    }, 100);

    // Set isolation mode flag
    isIsolationMode = true;
    log('Isolation Mode Enabled');

    // Remove any existing isolation mode label
    const existingLabel = document.querySelector('.isolation-mode-label');
    if (existingLabel) {
        existingLabel.remove();
    }

    // Create and show isolation mode label with close button
    const label = document.createElement('div');
    label.className = 'isolation-mode-label';

    const labelText = document.createElement('span');
    labelText.textContent = 'ISOLATION MODE';
    label.appendChild(labelText);

    const closeButton = document.createElement('button');
    closeButton.className = 'isolation-mode-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Exit isolation mode');
    closeButton.setAttribute('type', 'button');

    // Direct click handler
    const handleClick = () => {
        label.remove();
        exitIsolation();
        closeButton.removeEventListener('click', handleClick);
    };

    closeButton.addEventListener('click', handleClick);
    label.appendChild(closeButton);
    document.body.appendChild(label);
}

function exitIsolation() {
    // Show all state paths
    d3.selectAll('.states path')
        .style('display', null);

    // Show all state borders
    d3.selectAll('.state-border')
        .style('display', null);

    // Show all split states
    d3.selectAll('path[data-clone-for]')
        .style('display', null);

    // Reset zoom to show entire US with transition
    recenterMap();

    // Reset selections
    selectedRegions.clear();
    customSelectedStates.clear();
    isCustomMode = false;

    // Update visual state
    updateVisualState();

    // Reset isolation mode flag
    isIsolationMode = false;
    log('Isolation Mode Disabled');
}

function enterCustomMode() {
    isCustomMode = true;
    customSelectedStates.clear();

    // Convert all selected regions to individual state selections
    selectedRegions.forEach(regionName => {
        const region = regions.find(r => r.name === regionName);
        if (region) {
            region.states.forEach(stateName => {
                customSelectedStates.add(stateName);
            });
        }
    });

    log('Entered Custom Mode');
    if (selectedRegions.size > 0) {
        log('- Converted Regions to States:', Array.from(customSelectedStates).join(', '));
    }

    // Update UI
    document.getElementById('custom-region-button').classList.add('active');
    document.getElementById('small-states-list').style.display = 'block';
    updateSmallStatesButtons();
    updateMapInteractions();
}

function exitCustomMode() {
    isCustomMode = false;
    customSelectedStates.clear();

    log('Exited Custom Mode');
    if (selectedRegions.size > 0) {
        log('- Active Regions:', Array.from(selectedRegions).join(', '));
    }

    // Update UI
    document.getElementById('custom-region-button').classList.remove('active');
    document.getElementById('small-states-list').style.display = 'none';

    // Update region buttons to reflect current selections
    document.querySelectorAll('.region-buttons .btn[data-region]').forEach(button => {
        const regionName = button.dataset.region;
        if (selectedRegions.has(regionName)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    updateMapInteractions();
}

function updateSmallStatesButtons() {
    document.querySelectorAll('.small-states-buttons .btn').forEach(button => {
        const stateName = button.dataset.state;
        if (customSelectedStates.has(stateName)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

export function initializeStateIsolation() {
    const isolateButton = document.getElementById('isolate-button');
    const modalElement = document.getElementById('stateIsolationModal');
    const customButton = document.getElementById('custom-region-button');
    const clearAllButton = document.getElementById('clearAllSelectionsButton');

    // Initialize exit isolation handler
    document.querySelector('.exit-isolation').addEventListener('click', exitIsolation);

    // Load regions data
    loadRegions();

    // Initialize Bootstrap modal
    stateIsolationModal = new bootstrap.Modal(modalElement, {
        keyboard: true,
        backdrop: true
    });

    // Handle isolate button click
    isolateButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (getIsCountyMode() || isolateButton.classList.contains('disabled')) {
            return;
        }

        const gearDropdown = document.querySelector('.gear-dropdown');
        if (gearDropdown) {
            gearDropdown.style.display = 'none';
        }

        stateIsolationModal.show();
    });

    // Handle region button clicks
    document.querySelectorAll('.region-buttons .btn[data-region]').forEach(button => {
        button.addEventListener('click', (e) => {
            const regionName = e.target.dataset.region;
            toggleRegion(regionName);
        });
    });

    // Handle small states button clicks
    document.querySelectorAll('.small-states-buttons .btn').forEach(button => {
        button.addEventListener('click', () => {
            if (isCustomMode) {
                const stateName = button.dataset.state;
                toggleState(stateName);
            }
        });
    });

    // Handle custom button click
    customButton.addEventListener('click', toggleCustomMode);

    // Handle clear all button click
    clearAllButton.addEventListener('click', clearAllSelections);

    // Initialize mini map when modal is shown
    modalElement.addEventListener('shown.bs.modal', () => {
        initializeMiniMap();
    });

    // Cleanup when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        selectedRegions.clear();
        isCustomMode = false;
        customSelectedStates.clear();
        document.querySelectorAll('.region-buttons .btn, .small-states-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('small-states-list').style.display = 'none';
    });

    // Handle apply button click
    document.getElementById('applyIsolationButton').addEventListener('click', () => {
        applyIsolation();
        stateIsolationModal.hide();
    });
} 